"""SQLite via stdlib sqlite3 (no server, zero dependencies). One file, zero-config:
SQLITE_PATH points at the db file (shared /data volume in compose).

Same rows()/execute() shapes as before; only the placeholders changed
(%s -> ?) and UNIQUE violations surface as sqlite3.IntegrityError.
Dates are stored as TEXT 'YYYY-MM-DD', so rows come back frontend-ready.
"""
import os
import sqlite3
import threading

from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv("SQLITE_PATH", "./fuel.db")

_lock = threading.RLock()
_db: sqlite3.Connection | None = None

SCHEMA = """
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
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
"""

# Existing files predate the type column (immutably set at creation);
# backfill anything that is not a valid 1-4 type to petrol (1).
MIGRATE_VEHICLE_TYPE = [
    """SELECT COUNT(*) AS n FROM pragma_table_info('vehicles') WHERE name='type'""",
    """ALTER TABLE vehicles ADD COLUMN type INTEGER NOT NULL DEFAULT 1""",
    """UPDATE vehicles SET type=1 WHERE CAST(type AS INTEGER) NOT IN (1,2,3,4)""",
]


def _conn() -> sqlite3.Connection:
    global _db
    if _db is None:
        os.makedirs(os.path.dirname(os.path.abspath(DB_PATH)), exist_ok=True)
        _db = sqlite3.connect(DB_PATH, check_same_thread=False)
        _db.row_factory = sqlite3.Row
        with _lock:
            _db.executescript(SCHEMA)
            has_type = _db.execute(MIGRATE_VEHICLE_TYPE[0]).fetchone()[0]
            if not has_type:
                _db.execute(MIGRATE_VEHICLE_TYPE[1])
            _db.execute(MIGRATE_VEHICLE_TYPE[2])
            _db.commit()
        print(f"SQLite ready at {os.path.abspath(DB_PATH)}")
    return _db


def rows(query: str, params: tuple = ()) -> list[dict]:
    print(query, params)
    with _lock:
        cur = _conn().execute(query, params)
        result = [dict(r) for r in cur.fetchall()]
        _conn().commit()
    return result


def execute(query: str, params: tuple = ()) -> None:
    print(query, params)
    with _lock:
        try:
            _conn().execute(query, params)
            _conn().commit()
        except Exception:
            _conn().rollback()
            raise
