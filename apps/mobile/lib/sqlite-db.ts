import * as SQLite from 'expo-sqlite';
import { STARTER_SPECIES_IDS } from '@nalvie/core';

const DATABASE_NAME = 'nalvie.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Opens and migrates the single shared database.
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DATABASE_NAME);
    migrate(db);
  }
  return db;
}

function migrate(database: SQLite.SQLiteDatabase): void {
  database.execSync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      planned_duration_minutes REAL NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      outcome TEXT,
      selected_item_id TEXT NOT NULL,
      awarded_item_id TEXT,
      paused_ms INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tank_items (
      id TEXT PRIMARY KEY NOT NULL,
      species_id TEXT NOT NULL,
      name TEXT NOT NULL,
      rarity TEXT NOT NULL,
      unlocked_at TEXT
    );

    CREATE TABLE IF NOT EXISTS unlocked_species (
      species_id TEXT PRIMARY KEY NOT NULL,
      unlocked_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY NOT NULL,
      default_session_minutes REAL NOT NULL,
      sound_enabled INTEGER NOT NULL,
      dark_mode_override INTEGER,
      has_completed_onboarding INTEGER NOT NULL DEFAULT 0,
      sound_source TEXT NOT NULL DEFAULT 'local',
      somafm_station_id TEXT NOT NULL DEFAULT 'groovesalad'
    );
  `);
  seedStarterSpecies(database);
}

function seedStarterSpecies(database: SQLite.SQLiteDatabase): void {
  const unlockedAt = new Date().toISOString();
  for (const speciesId of STARTER_SPECIES_IDS) {
    database.runSync('INSERT OR IGNORE INTO unlocked_species (species_id, unlocked_at) VALUES (?, ?)', [
      speciesId,
      unlockedAt,
    ]);
  }
}

// Dev-only "clear database" action: wipes every row but keeps the schema,
// so the app behaves like a fresh install without needing a reinstall.
export function clearDatabase(): void {
  getDatabase().execSync(`
    DELETE FROM sessions;
    DELETE FROM tank_items;
    DELETE FROM unlocked_species;
    DELETE FROM settings;
  `);
  seedStarterSpecies(getDatabase());
}
