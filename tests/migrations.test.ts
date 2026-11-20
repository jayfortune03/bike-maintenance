import { describe, expect, it } from 'vitest';
import { migratePersistedState } from '@/src/storage/migrations';

describe('persisted state migrations', () => {
  it('moves an empty v0 state to the current schema', () => expect(migratePersistedState({ motorcycles: [] }, 0)).toMatchObject({ motorcycles: [], schemaVersion: 2, preferences: { themeMode: 'system', useMotorcycleAccent: true, oilReminders: {} } }));
  it('preserves existing preferences while adding oil reminder state', () => expect(migratePersistedState({ preferences: { themeMode: 'dark', useMotorcycleAccent: false } }, 1)).toMatchObject({ schemaVersion: 2, preferences: { themeMode: 'dark', useMotorcycleAccent: false, oilReminders: {} } }));
});
