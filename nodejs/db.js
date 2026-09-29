require('dotenv').config();
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

// SQLite via node:sqlite (stdlib, no pg dependency). One file, zero-config:
// SQLITE_PATH points at the db file (shared /data volume in compose).
// Same query(text, params) shape as before so server.js is untouched,
// except $1-placeholders become ? for SQLite.

const dbPath = process.env.SQLITE_PATH || './fuel.db';
fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');
db.exec(`
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
// Existing files predate the type column (immutably set at creation);
// backfill anything that is not a valid 1-4 type to petrol (1).
if (!db.prepare(`SELECT COUNT(*) AS n FROM pragma_table_info('vehicles') WHERE name='type'`).get().n) {
    db.exec(`ALTER TABLE vehicles ADD COLUMN type INTEGER NOT NULL DEFAULT 1`);
}
db.exec(`UPDATE vehicles SET type=1 WHERE CAST(type AS INTEGER) NOT IN (1,2,3,4)`);
console.log(`SQLite ready at ${path.resolve(dbPath)}`);

const toQuestionMarks = (text) => text.replace(/\$(\d+)/g, '?');

const uniqueError = () => {
    const err = new Error('UNIQUE constraint failed');
    err.code = '23505'; // same code server.js already maps to 409
    return err;
};

const query = async (text, params = []) => {
    console.log(text, params);
    const sql = toQuestionMarks(text);
    const trimmed = sql.trim().toUpperCase();
    try {
        // SELECT and ... RETURNING both produce rows.
        if (trimmed.startsWith('SELECT') || trimmed.includes('RETURNING')) {
            const rows = db.prepare(sql).all(...params);
            return { rows, rowCount: rows.length };
        }
        const result = db.prepare(sql).run(...params);
        return { rows: [], rowCount: Number(result.changes) };
    } catch (err) {
        if (String(err.message).includes('UNIQUE constraint failed')) throw uniqueError();
        throw err;
    }
};

module.exports = { query };
