"""Image storage helpers shared by routers/images.py and every DELETE endpoint.
Files live under UPLOAD_DIR (default: next to sqlite.db + /uploads, same env
var in every backend), db rows in `images` keyed by (entity_type, entity_id,
kind) — 1 avatar per vehicle, 1 receipt per record. Mirrors nodejs/images.js.
"""
import os
import uuid
from pathlib import Path

import db

UPLOAD_DIR = os.getenv("UPLOAD_DIR") or str(Path(db.DB_PATH).resolve().parent / "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ENTITY_TABLES = {
    "vehicle": "vehicles",
    "fuel_record": "fuel_records",
    "charge_record": "charge_records",
    "tunnel_record": "tunnel_records",
    "parking_record": "parking_records",
    "fine_record": "fine_records",
    "service_record": "service_records",
    "insurance_record": "insurance_records",
    "licence_record": "licence_records",
}
TABLE_ENTITIES = {table: entity for entity, table in ENTITY_TABLES.items()}

KINDS = ["avatar", "receipt"]  # '<kind>_source' rows are stored implicitly
ALLOWED_MIME = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
MAX_IMAGE_BYTES = 10 * 1024 * 1024


def entity_exists(entity_type: str, entity_id: int) -> bool:
    table = ENTITY_TABLES.get(entity_type)
    if not table:
        return False
    return bool(db.rows(f"SELECT 1 FROM {table} WHERE id=?", (entity_id,)))


def file_path_of(entity_type: str, entity_id: int, file_name: str) -> str:
    return os.path.join(UPLOAD_DIR, entity_type, str(entity_id), file_name)


def save_image_file(data: bytes, entity_type: str, entity_id: int, mime: str) -> str:
    """Writes the bytes under uploads/<entityType>/<entityId>/<uuid>.<ext>."""
    file_name = f"{uuid.uuid4()}.{ALLOWED_MIME[mime]}"
    target = file_path_of(entity_type, entity_id, file_name)
    os.makedirs(os.path.dirname(target), exist_ok=True)
    with open(target, "wb") as f:
        f.write(data)
    return file_name


def remove_image_file(entity_type: str, entity_id: int, file_name: str | None) -> None:
    if not file_name:
        return
    try:
        os.remove(file_path_of(entity_type, entity_id, file_name))
    except FileNotFoundError:
        pass


def image_json(row: dict) -> dict:
    return {
        "id": row["id"],
        "entityType": row["entity_type"],
        "entityId": row["entity_id"],
        "kind": row["kind"],
        "mime": row["mime"],
        "width": row["width"],
        "height": row["height"],
        "sizeBytes": row["size_bytes"],
        "url": f"/api/images/{row['id']}/file",
        "createdAt": row["created_at"],
    }


def delete_images_for(entity_type: str, entity_id) -> int:
    """Removes db rows + files for one entity (all kinds: avatar,
    avatar_source, receipt)."""
    if not isinstance(entity_id, int):
        return 0
    found = db.rows(
        "SELECT id, file_name FROM images WHERE entity_type=? AND entity_id=?",
        (entity_type, entity_id),
    )
    for row in found:
        remove_image_file(entity_type, entity_id, row["file_name"])
    db.execute(
        "DELETE FROM images WHERE entity_type=? AND entity_id=?",
        (entity_type, entity_id),
    )
    return len(found)


def delete_vehicle_images(vehicle_id: int) -> int:
    """Deleting a vehicle cascades its records away, so their images would be
    orphaned — collect record ids first, then drop every related image."""
    deleted = delete_images_for("vehicle", vehicle_id)
    for table, entity in TABLE_ENTITIES.items():
        if entity == "vehicle":
            continue
        for row in db.rows(f"SELECT id FROM {table} WHERE vehicle_id=?", (vehicle_id,)):
            deleted += delete_images_for(entity, row["id"])
    return deleted
