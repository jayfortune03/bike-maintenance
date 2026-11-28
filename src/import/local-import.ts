import * as z from 'zod';
import type { AccountMotorcycleApi } from '@/src/auth/account-api';
import type { RemoteMotorcycle } from '@/src/auth/contracts';
import { ApiClientError, SessionExpiredError, SessionStorageError, StaleSessionError } from '@/src/auth/errors';
import type { Motorcycle } from '@/src/domain/types';
import { ImportLedger, ImportLedgerError } from './import-ledger';

const importCandidateSchema = z.strictObject({
  localId: z.string().min(1).max(128),
  name: z.string().trim().min(1).max(100),
  odometerKm: z.number().int().min(0).max(2_147_483_647),
}).readonly();

export type ImportCandidate = z.infer<typeof importCandidateSchema>;
export type InvalidImportItem = {
  readonly localId: string;
  readonly name: string;
  readonly reason: string;
};
export type ImportFailure = ImportCandidate & { readonly reason: string };
export type ImportSuccess = ImportCandidate & { readonly remoteId: string };
export type ImportPlan = {
  readonly ready: readonly ImportCandidate[];
  readonly invalid: readonly InvalidImportItem[];
};
export type ImportRunResult =
  | { readonly kind: 'discarded' }
  | {
    readonly kind: 'complete';
    readonly succeeded: readonly ImportSuccess[];
    readonly failed: readonly ImportFailure[];
    readonly remoteMotorcycles: readonly RemoteMotorcycle[];
    readonly refreshError?: string;
  };

function invalidReason(error: z.ZodError): string {
  const field = error.issues[0]?.path[0];
  switch (field) {
    case 'name':
      return 'Nama harus berisi 1-100 karakter.';
    case 'odometerKm':
      return 'Odometer harus berupa kilometer bulat antara 0 dan 2.147.483.647.';
    case 'localId':
      return 'ID lokal motor tidak dapat digunakan untuk impor.';
    default:
      return 'Data motor lokal tidak valid.';
  }
}

export function buildImportPlan(
  motorcycles: readonly Pick<Motorcycle, 'id' | 'nickname' | 'currentOdometer'>[],
  importedByLocalId: Readonly<Record<string, string>>,
): ImportPlan {
  const ready: ImportCandidate[] = [];
  const invalid: InvalidImportItem[] = [];
  for (const motorcycle of motorcycles) {
    if (importedByLocalId[motorcycle.id]) continue;
    const candidate = importCandidateSchema.safeParse({
      localId: motorcycle.id,
      name: motorcycle.nickname,
      odometerKm: motorcycle.currentOdometer,
    });
    if (candidate.success) ready.push(candidate.data);
    else invalid.push({
      localId: motorcycle.id,
      name: motorcycle.nickname.trim() || 'Motor tanpa nama',
      reason: invalidReason(candidate.error),
    });
  }
  return { ready, invalid };
}

export function selectImportCandidates(
  ready: readonly ImportCandidate[],
  selectedLocalIds: readonly string[],
): readonly ImportCandidate[] {
  const selected = new Set(selectedLocalIds);
  return ready.filter((item) => selected.has(item.localId));
}

function userMessage(error: ApiClientError | z.ZodError | ImportLedgerError): string {
  if (error instanceof ImportLedgerError) return 'Motor mungkin sudah terunggah, tetapi status lokal belum tersimpan. Coba lagi untuk mencocokkan data.';
  if (error instanceof z.ZodError) return 'Respons server tidak dapat dibaca. Coba lagi nanti.';
  if (error.status === 400) return 'Server menolak data motor. Periksa nama dan odometer.';
  if (error.status === 429) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
  if (error.kind === 'network') return 'API tidak dapat dihubungi. Periksa koneksi lalu coba lagi.';
  return 'Motor belum dapat diunggah. Coba lagi.';
}

export class LocalImportRunner {
  constructor(
    private readonly api: AccountMotorcycleApi,
    private readonly ledger: ImportLedger,
    private readonly currentAccountId: () => string | undefined,
  ) {}

  async run(accountId: string, items: readonly ImportCandidate[]): Promise<ImportRunResult> {
    const succeeded: ImportSuccess[] = [];
    const failed: ImportFailure[] = [];

    // ponytail: local garages are small; use bounded concurrency only if import latency becomes measurable.
    for (const item of items) {
      if (this.currentAccountId() !== accountId) return { kind: 'discarded' };
      try {
        const remoteId = await this.api.importMotorcycle({
          importKey: item.localId,
          name: item.name,
          odometerKm: item.odometerKm,
        });
        if (this.currentAccountId() !== accountId) return { kind: 'discarded' };
        await this.ledger.record(accountId, item.localId, remoteId);
        succeeded.push({ ...item, remoteId });
      } catch (error) {
        if (error instanceof StaleSessionError || error instanceof SessionExpiredError || error instanceof SessionStorageError) return { kind: 'discarded' };
        if (error instanceof ApiClientError || error instanceof z.ZodError || error instanceof ImportLedgerError) {
          failed.push({ ...item, reason: userMessage(error) });
          continue;
        }
        throw error;
      }
    }

    if (this.currentAccountId() !== accountId) return { kind: 'discarded' };
    try {
      const remoteMotorcycles = await this.api.listMotorcycles();
      if (this.currentAccountId() !== accountId) return { kind: 'discarded' };
      return { kind: 'complete', succeeded, failed, remoteMotorcycles };
    } catch (error) {
      if (error instanceof StaleSessionError || error instanceof SessionExpiredError || error instanceof SessionStorageError) return { kind: 'discarded' };
      if (error instanceof ApiClientError || error instanceof z.ZodError) {
        if (this.currentAccountId() !== accountId) return { kind: 'discarded' };
        return {
          kind: 'complete',
          succeeded,
          failed,
          remoteMotorcycles: [],
          refreshError: 'Data unggahan tersimpan, tetapi daftar akun belum dapat diperbarui.',
        };
      }
      throw error;
    }
  }
}
