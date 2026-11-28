import { describe, expect, it, vi } from 'vitest';
import type { StateStorage } from 'zustand/middleware';
import type { AccountMotorcycleApi, ImportMotorcycleRequest } from '@/src/auth/account-api';
import type { RemoteMotorcycle } from '@/src/auth/contracts';
import { ApiClientError } from '@/src/auth/errors';
import { ImportLedger } from '@/src/import/import-ledger';
import { buildImportPlan, LocalImportRunner, selectImportCandidates, type ImportCandidate } from '@/src/import/local-import';

const ACCOUNT_A = '11111111-1111-4111-8111-111111111111';
const ACCOUNT_B = '22222222-2222-4222-8222-222222222222';
const REMOTE_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const REMOTE_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const REMOTE_C = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

function memoryStorage(): StateStorage {
  let value: string | null = null;
  return {
    getItem: () => value,
    setItem: (_name, next) => { value = next; },
    removeItem: () => { value = null; },
  };
}

function candidates(): readonly ImportCandidate[] {
  return [
    { localId: 'local-a', name: 'Motor A', odometerKm: 100 },
    { localId: 'local-b', name: 'Motor B', odometerKm: 200 },
    { localId: 'local-c', name: 'Motor C', odometerKm: 300 },
  ];
}

function fakeApi(failedIds: Set<string>) {
  const remoteIds: Readonly<Record<string, string>> = { 'local-a': REMOTE_A, 'local-b': REMOTE_B, 'local-c': REMOTE_C };
  return {
    importMotorcycle: vi.fn(async (request: ImportMotorcycleRequest) => {
      if (failedIds.has(request.importKey)) throw new ApiClientError('network', 'Offline');
      return remoteIds[request.importKey] ?? REMOTE_A;
    }),
    listMotorcycles: vi.fn(async (_signal?: AbortSignal): Promise<readonly RemoteMotorcycle[]> => []),
  } satisfies AccountMotorcycleApi;
}

describe('local motorcycle import', () => {
  it('validates every local name and odometer before upload', () => {
    const givenMotorcycles = [
      { id: 'valid', nickname: 'Motor valid', currentOdometer: 0 },
      { id: 'empty', nickname: '   ', currentOdometer: 10 },
      { id: 'long', nickname: 'a'.repeat(101), currentOdometer: 10 },
      { id: 'negative', nickname: 'Motor negatif', currentOdometer: -1 },
      { id: 'fraction', nickname: 'Motor pecahan', currentOdometer: 1.5 },
      { id: 'large', nickname: 'Motor besar', currentOdometer: 2_147_483_648 },
    ];

    const whenPlan = buildImportPlan(givenMotorcycles, {});

    expect(whenPlan.ready.map((item) => item.localId)).toEqual(['valid']);
    expect(whenPlan.invalid.map((item) => item.localId)).toEqual(['empty', 'long', 'negative', 'fraction', 'large']);
  });

  it('keeps only explicitly selected motorcycles in source order', () => {
    const givenCandidates = candidates();

    const whenSelected = selectImportCandidates(givenCandidates, ['local-c', 'local-a', 'missing']);

    expect(whenSelected.map((item) => item.localId)).toEqual(['local-a', 'local-c']);
  });

  it('keeps persisted successes when one item fails', async () => {
    const givenFailures = new Set(['local-b']);
    const givenLedger = new ImportLedger(memoryStorage());
    const givenApi = fakeApi(givenFailures);
    const runner = new LocalImportRunner(givenApi, givenLedger, () => ACCOUNT_A);

    const whenResult = await runner.run(ACCOUNT_A, candidates());

    expect(whenResult.kind).toBe('complete');
    if (whenResult.kind === 'complete') {
      expect(whenResult.succeeded.map((item) => item.localId)).toEqual(['local-a', 'local-c']);
      expect(whenResult.failed.map((item) => item.localId)).toEqual(['local-b']);
    }
    await expect(givenLedger.getAccount(ACCOUNT_A)).resolves.toEqual({ 'local-a': REMOTE_A, 'local-c': REMOTE_C });
  });

  it('submits only failed items on retry', async () => {
    const givenFailures = new Set(['local-b']);
    const givenLedger = new ImportLedger(memoryStorage());
    const givenApi = fakeApi(givenFailures);
    const runner = new LocalImportRunner(givenApi, givenLedger, () => ACCOUNT_A);
    const first = await runner.run(ACCOUNT_A, candidates());
    expect(first.kind).toBe('complete');
    if (first.kind !== 'complete') return;
    givenFailures.clear();
    givenApi.importMotorcycle.mockClear();

    const whenRetry = await runner.run(ACCOUNT_A, first.failed);

    expect(whenRetry.kind).toBe('complete');
    expect(givenApi.importMotorcycle).toHaveBeenCalledTimes(1);
    expect(givenApi.importMotorcycle.mock.calls[0]?.[0].importKey).toBe('local-b');
    await expect(givenLedger.getAccount(ACCOUNT_A)).resolves.toEqual({ 'local-a': REMOTE_A, 'local-b': REMOTE_B, 'local-c': REMOTE_C });
  });

  it('isolates persisted import IDs by account', async () => {
    const givenLedger = new ImportLedger(memoryStorage());
    await givenLedger.record(ACCOUNT_A, 'local-a', REMOTE_A);

    const whenOtherAccountLoads = await givenLedger.getAccount(ACCOUNT_B);

    expect(whenOtherAccountLoads).toEqual({});
    await expect(givenLedger.getAccount(ACCOUNT_A)).resolves.toEqual({ 'local-a': REMOTE_A });
  });

  it('discards a late account refresh without losing the original account success', async () => {
    const givenList = deferred<readonly RemoteMotorcycle[]>();
    const givenListStarted = deferred<void>();
    const givenLedger = new ImportLedger(memoryStorage());
    let currentAccount = ACCOUNT_A;
    const givenApi: AccountMotorcycleApi = {
      importMotorcycle: vi.fn(async () => REMOTE_A),
      listMotorcycles: vi.fn(async () => {
        givenListStarted.resolve();
        return givenList.promise;
      }),
    };
    const runner = new LocalImportRunner(givenApi, givenLedger, () => currentAccount);

    const whenRun = runner.run(ACCOUNT_A, [candidates()[0] ?? { localId: 'local-a', name: 'Motor A', odometerKm: 100 }]);
    await givenListStarted.promise;
    currentAccount = ACCOUNT_B;
    givenList.resolve([]);
    const result = await whenRun;

    expect(result).toEqual({ kind: 'discarded' });
    await expect(givenLedger.getAccount(ACCOUNT_A)).resolves.toEqual({ 'local-a': REMOTE_A });
    await expect(givenLedger.getAccount(ACCOUNT_B)).resolves.toEqual({});
  });
});
