import { describe, expect, it } from 'vitest';
import { migratePersistedState } from '@/src/storage/migrations';

describe('persisted state migrations', () => {
  it('moves an empty v0 state to the current schema', () => expect(migratePersistedState({ motorcycles: [] }, 0)).toMatchObject({ motorcycles: [], schemaVersion: 1 }));
});
