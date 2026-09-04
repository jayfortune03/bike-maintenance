export const CURRENT_SCHEMA_VERSION = 1;

export function migratePersistedState(state: unknown, fromVersion: number, toVersion = CURRENT_SCHEMA_VERSION): unknown {
  let migrated = (state ?? {}) as Record<string, unknown>;
  for (let version = fromVersion; version < toVersion; version += 1) {
    if (version === 0) {
      migrated = { ...migrated, schemaVersion: 1 };
    }
  }
  return { ...migrated, schemaVersion: toVersion };
}
