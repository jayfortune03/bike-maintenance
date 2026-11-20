export const CURRENT_SCHEMA_VERSION = 2;

export function migratePersistedState(state: unknown, fromVersion: number, toVersion = CURRENT_SCHEMA_VERSION): unknown {
  let migrated = (state ?? {}) as Record<string, unknown>;
  for (let version = fromVersion; version < toVersion; version += 1) {
    if (version === 0) {
      migrated = { ...migrated, schemaVersion: 1 };
    }
    if (version === 1) {
      const preferences = migrated.preferences && typeof migrated.preferences === 'object' ? migrated.preferences as Record<string, unknown> : {};
      migrated = { ...migrated, preferences: { themeMode: 'system', useMotorcycleAccent: true, ...preferences, oilReminders: {} }, schemaVersion: 2 };
    }
  }
  return { ...migrated, schemaVersion: toVersion };
}
