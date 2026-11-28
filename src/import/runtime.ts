import { accountApi, authSession } from '@/src/auth/runtime';
import { mmkvStorage } from '@/src/storage/adapter';
import { ImportLedger } from './import-ledger';
import { LocalImportRunner } from './local-import';

export const importLedger = new ImportLedger(mmkvStorage);
export const localImportRunner = new LocalImportRunner(accountApi, importLedger, () => authSession.accountId);
