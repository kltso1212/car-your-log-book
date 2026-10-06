"""SQLite via stdlib sqlite3 (no server, zero dependencies). One file, zero-config:
Local default is the repo-root sqlite.db (shared across backends);
in compose SQLITE_PATH=/data/sqlite.db (shared volume) overrides it.

Same rows()/execute() shapes as before; only the placeholders changed
(%s -> ?) and UNIQUE violations surface as sqlite3.IntegrityError.
Dates are stored as TEXT 'YYYY-MM-DD', so rows come back frontend-ready.
"""
import os
import sqlite3
import threading

from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

DB_PATH = os.getenv("SQLITE_PATH", str(Path(__file__).resolve().parent.parent / "sqlite.db"))

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
CREATE TABLE IF NOT EXISTS parking_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    carpark TEXT NOT NULL,
    rental_type INTEGER NOT NULL,
    fee REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_parking_vehicle_date
    ON parking_records (vehicle_id, date);
CREATE TABLE IF NOT EXISTS fine_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    offences TEXT NOT NULL DEFAULT '[]',
    custom_offence TEXT,
    location TEXT,
    penalty REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_fine_vehicle_date
    ON fine_records (vehicle_id, date);
CREATE TABLE IF NOT EXISTS service_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    odm INTEGER NOT NULL,
    items TEXT NOT NULL DEFAULT '[]',
    custom_item TEXT,
    price REAL NOT NULL DEFAULT 0,
    UNIQUE (vehicle_id, odm)
);
CREATE TABLE IF NOT EXISTS insurance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    type INTEGER NOT NULL,
    broker TEXT,
    fee REAL NOT NULL DEFAULT 0,
    UNIQUE (vehicle_id, date)
);
CREATE TABLE IF NOT EXISTS licence_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    type INTEGER NOT NULL,
    fee REAL NOT NULL DEFAULT 0,
    UNIQUE (vehicle_id, date)
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


def insert(query: str, params: tuple = ()) -> int:
    """INSERT returning the new row id (for endpoints that echo it back)."""
    print(query, params)
    with _lock:
        try:
            cur = _conn().execute(query, params)
            new_id = cur.lastrowid or 0
            _conn().commit()
        except Exception:
            _conn().rollback()
            raise
    return new_id
