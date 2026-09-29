import * as SQLite from 'expo-sqlite';

// Phone-local database. No backend, no network: everything the app needs
// lives in this file. Schema matches the server SQLite tables
// (vehicles / fuel_records + surrogate id + UNIQUE(vehicle_id, odm)).

const DB_NAME = 'fuel.db';
const SCHEMA_VERSION = 5;

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Database not initialised — call initDatabase() first');
  return db;
}

async function getUserVersion(database: SQLite.SQLiteDatabase): Promise<number> {
  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

export async function ensureMigrated(database: SQLite.SQLiteDatabase): Promise<void> {
  const version = await getUserVersion(database);
  if (version < 1) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        type INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS fuel_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        odm INTEGER NOT NULL,
        vendor INTEGER NOT NULL DEFAULT 0,
        fuel_type INTEGER NOT NULL DEFAULT 0,
        litre REAL NOT NULL DEFAULT 0,
        price REAL NOT NULL DEFAULT 0,
        UNIQUE (vehicle_id, odm)
      );
      CREATE TABLE IF NOT EXISTS charge_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        odm INTEGER NOT NULL,
        kwh REAL NOT NULL DEFAULT 0,
        price REAL NOT NULL DEFAULT 0,
        UNIQUE (vehicle_id, odm)
      );
      CREATE TABLE IF NOT EXISTS tunnel_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        tunnel INTEGER NOT NULL,
        bound INTEGER NOT NULL,
        fee REAL NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_tunnel_vehicle_date
        ON tunnel_records (vehicle_id, date);
    `);
  }
  if (version < 2) {
    // v2: key-value store for Drive backup state (file id, dirty flag,
    // last sync time). Was briefly in v1, removed, now back for BYOD.
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }
  if (version < 3) {
    // v3: Google Drive BYOD removed — app is offline-only, settings unused.
    await database.execAsync('DROP TABLE IF EXISTS settings;');
  }
  if (version < 4) {
    // v4: vehicle type (1 petrol / 2 hybrid / 3 electric / 4 diesel,
    // immutable after creation) + charge_records for electric vehicles.
    const cols = await database.getAllAsync<{ name: string }>(
      `SELECT name FROM pragma_table_info('vehicles')`,
    );
    if (!cols.some(c => c.name === 'type')) {
      await database.execAsync('ALTER TABLE vehicles ADD COLUMN type INTEGER NOT NULL DEFAULT 1');
    }
    await database.execAsync(`UPDATE vehicles SET type=1 WHERE CAST(type AS INTEGER) NOT IN (1,2,3,4)`);
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS charge_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        odm INTEGER NOT NULL,
        kwh REAL NOT NULL DEFAULT 0,
        price REAL NOT NULL DEFAULT 0,
        UNIQUE (vehicle_id, odm)
      );
    `);
  }
  if (version < 5) {
    // v5: tunnel_records (no UNIQUE — same tunnel twice a day is normal).
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS tunnel_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        tunnel INTEGER NOT NULL,
        bound INTEGER NOT NULL,
        fee REAL NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_tunnel_vehicle_date
        ON tunnel_records (vehicle_id, date);
    `);
  }
  if (version < SCHEMA_VERSION) {
    await database.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  }
}

export async function initDatabase(): Promise<void> {
  if (db) return;
  const database = SQLite.openDatabaseSync(DB_NAME);
  // FK enforcement (incl. ON DELETE CASCADE) is opt-in per connection in SQLite.
  await database.execAsync('PRAGMA foreign_keys = ON;');
  await ensureMigrated(database);
  db = database;
}

// Test hook: point the module at an injected database (node:sqlite harness).
export function __setDbForTests(database: SQLite.SQLiteDatabase): void {
  db = database;
}
