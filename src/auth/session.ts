import { authCredentialsSchema, type AuthCredentials, type AuthMode, type AuthPayload, type SessionUser } from './contracts';
import { ApiClientError, SessionExpiredError, SessionStorageError, StaleSessionError } from './errors';
import type { SessionTransport } from './transport';

export interface RefreshTokenStorage {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
}

export type AuthSnapshot =
  | { readonly status: 'loading' }
  | { readonly status: 'signed-out' }
  | { readonly status: 'unavailable' }
  | { readonly status: 'signed-in'; readonly user: SessionUser };

type Listener = () => void;

export class AuthSession {
  private snapshot: AuthSnapshot = { status: 'loading' };
  private accessToken?: string;
  private generation = 0;
  private initialized = false;
  private initializeFlight?: Promise<void>;
  private refreshFlight?: Promise<void>;
  private storageTail: Promise<void> = Promise.resolve();
  private readonly listeners = new Set<Listener>();

  constructor(
    private readonly transport: SessionTransport,
    private readonly storage: RefreshTokenStorage,
  ) {}

  readonly getSnapshot = (): AuthSnapshot => this.snapshot;
  readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  get accountId(): string | undefined {
    switch (this.snapshot.status) {
      case 'signed-in':
        return this.snapshot.user.id;
      case 'loading':
      case 'signed-out':
      case 'unavailable':
        return undefined;
      default: {
        const unreachable: never = this.snapshot;
        return unreachable;
      }
    }
  }

  async initialize(force = false): Promise<void> {
    if (this.initializeFlight) return this.initializeFlight;
    if (this.initialized && !force) return;
    const flight = this.restore();
    this.initializeFlight = flight;
    try {
      await flight;
    } finally {
      if (this.initializeFlight === flight) this.initializeFlight = undefined;
    }
  }

  private async restore(): Promise<void> {
    this.initialized = true;
    const generation = ++this.generation;
    this.accessToken = undefined;
    this.update({ status: 'loading' });

    let refreshToken: string | null;
    try {
      refreshToken = await this.enqueueStorage(() => this.storage.get());
    } catch {
      if (generation === this.generation) this.update({ status: 'unavailable' });
      return;
    }
    if (generation !== this.generation) return;
    if (!refreshToken) {
      this.update({ status: 'signed-out' });
      return;
    }

    try {
      const payload = await this.transport.refresh(refreshToken);
      if (!await this.commit(payload, generation)) throw new StaleSessionError();
    } catch (error) {
      if (error instanceof StaleSessionError) return;
      if (error instanceof ApiClientError && error.status === 401) {
        await this.expire(generation);
        return;
      }
      if (generation === this.generation) this.update({ status: 'unavailable' });
    }
  }

  login(credentials: AuthCredentials): Promise<void> {
    return this.authenticate('login', credentials);
  }

  register(credentials: AuthCredentials): Promise<void> {
    return this.authenticate('register', credentials);
  }

  async logout(): Promise<boolean> {
    const generation = ++this.generation;
    this.accessToken = undefined;
    this.initialized = true;
    this.update({ status: 'signed-out' });

    let refreshToken: string | null;
    try {
      refreshToken = await this.enqueueStorage(async () => {
        const token = await this.storage.get();
        await this.storage.clear();
        return token;
      });
    } catch {
      if (generation === this.generation) this.update({ status: 'unavailable' });
      throw new SessionStorageError();
    }
    if (!refreshToken) return true;
    try {
      await this.transport.logout(refreshToken);
      return true;
    } catch (error) {
      if (error instanceof ApiClientError) return false;
      throw error;
    }
  }

  async request(input: {
    readonly path: string;
    readonly method: 'GET' | 'POST';
    readonly json?: unknown;
    readonly signal?: AbortSignal;
  }): Promise<unknown> {
    const generation = this.generation;
    const accessToken = this.accessToken;
    if (!accessToken || this.snapshot.status !== 'signed-in') throw new SessionExpiredError();

    try {
      const result = await this.transport.send({ ...input, accessToken });
      if (generation !== this.generation) throw new StaleSessionError();
      return result;
    } catch (error) {
      if (!(error instanceof ApiClientError) || error.status !== 401) throw error;
    }

    await this.refresh();
    if (generation !== this.generation) throw new StaleSessionError();
    const nextAccessToken = this.accessToken;
    if (!nextAccessToken) throw new SessionExpiredError();
    try {
      const result = await this.transport.send({ ...input, accessToken: nextAccessToken });
      if (generation !== this.generation) throw new StaleSessionError();
      return result;
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        await this.expire(generation);
        throw new SessionExpiredError();
      }
      throw error;
    }
  }

  private async authenticate(mode: AuthMode, rawCredentials: AuthCredentials): Promise<void> {
    const credentials = authCredentialsSchema.parse(rawCredentials);
    const generation = ++this.generation;
    this.accessToken = undefined;
    this.update({ status: 'signed-out' });
    try {
      await this.enqueueStorage(() => this.storage.clear());
    } catch {
      throw new SessionStorageError();
    }
    const payload = await this.transport.authenticate(mode, credentials);
    if (!await this.commit(payload, generation)) throw new StaleSessionError();
  }

  private async refresh(): Promise<void> {
    if (this.refreshFlight) return this.refreshFlight;
    const generation = this.generation;
    const flight = this.performRefresh(generation);
    this.refreshFlight = flight;
    try {
      await flight;
    } finally {
      if (this.refreshFlight === flight) this.refreshFlight = undefined;
    }
  }

  private async performRefresh(generation: number): Promise<void> {
    let refreshToken: string | null;
    try {
      refreshToken = await this.enqueueStorage(() => this.storage.get());
    } catch {
      if (generation !== this.generation) throw new StaleSessionError();
      this.accessToken = undefined;
      this.update({ status: 'unavailable' });
      throw new SessionStorageError();
    }
    if (generation !== this.generation) throw new StaleSessionError();
    if (!refreshToken) {
      await this.expire(generation);
      throw new SessionExpiredError();
    }
    let payload: AuthPayload;
    try {
      payload = await this.transport.refresh(refreshToken);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        await this.expire(generation);
        throw new SessionExpiredError();
      }
      throw error;
    }
    if (!await this.commit(payload, generation)) throw new StaleSessionError();
  }

  private async commit(payload: AuthPayload, generation: number): Promise<boolean> {
    let stored: boolean;
    try {
      stored = await this.enqueueStorage(async () => {
        if (generation !== this.generation) return false;
        await this.storage.set(payload.refreshToken);
        return generation === this.generation;
      });
    } catch {
      if (generation === this.generation) await this.expire(generation);
      throw new SessionStorageError();
    }
    if (!stored || generation !== this.generation) return false;
    this.accessToken = payload.accessToken;
    this.update({ status: 'signed-in', user: payload.user });
    return true;
  }

  private async expire(generation: number): Promise<void> {
    if (generation !== this.generation) return;
    ++this.generation;
    this.accessToken = undefined;
    this.update({ status: 'signed-out' });
    try {
      await this.enqueueStorage(() => this.storage.clear());
    } catch {
      this.update({ status: 'unavailable' });
      throw new SessionStorageError();
    }
  }

  private enqueueStorage<T>(operation: () => T | Promise<T>): Promise<T> {
    const result = this.storageTail.then(operation, operation);
    this.storageTail = result.then(() => undefined, () => undefined);
    return result;
  }

  private update(snapshot: AuthSnapshot): void {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener();
  }
}
