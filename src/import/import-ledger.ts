import * as z from 'zod';
import type { StateStorage } from 'zustand/middleware';

const STORAGE_KEY = 'motorcycle-care-account-imports';
const ledgerSchema = z.record(
  z.uuid(),
  z.record(z.string().min(1).max(128), z.uuid()),
);

type LedgerData = z.infer<typeof ledgerSchema>;

export class ImportLedgerError extends Error {
  readonly name = 'ImportLedgerError';

  constructor() {
    super('Import history storage is unavailable');
  }
}

export class ImportLedger {
  private tail: Promise<void> = Promise.resolve();

  constructor(private readonly storage: StateStorage) {}

  async getAccount(accountId: string): Promise<Readonly<Record<string, string>>> {
    const state = await this.read();
    return state[accountId] ?? {};
  }

  record(accountId: string, localId: string, remoteId: string): Promise<void> {
    const operation = this.tail.then(async () => {
      const state = await this.read();
      const next: LedgerData = {
        ...state,
        [accountId]: { ...state[accountId], [localId]: remoteId },
      };
      await this.storage.setItem(STORAGE_KEY, JSON.stringify(next));
    });
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }

  private async read(): Promise<LedgerData> {
    const raw = await this.storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    try {
      return ledgerSchema.parse(JSON.parse(raw));
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof z.ZodError) throw new ImportLedgerError();
      throw error;
    }
  }
}
