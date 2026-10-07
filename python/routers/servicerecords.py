"""GET/POST/PUT/DELETE /api/servicerecords. Same CRUD shape as fuelrecords
(date/odm/items/custom_item/price), items travels as a JSON int[].
UNIQUE(vehicle_id, odm) like fuel — one service per mileage point.
"""
import json
import sqlite3

from fastapi import APIRouter, Response, status

import db
from schemas import Message, ServiceRecordIn, ServiceRecordOut

router = APIRouter(prefix="/api/servicerecords", tags=["servicerecords"])


def _is_unique_violation(err: Exception) -> bool:
    return isinstance(err, sqlite3.IntegrityError) and "UNIQUE" in str(err)


_LIST_SQL = """
    SELECT id, date, odm, items, custom_item AS "customItem", price
    FROM service_records
    WHERE vehicle_id=?
    ORDER BY odm
"""


def _decode(rows: list[dict]) -> list[dict]:
    for r in rows:
        try:
            r["items"] = json.loads(r.get("items") or "[]")
        except (ValueError, TypeError):
            r["items"] = []
    return rows


@router.get("/{vehicle_id}", response_model=list[ServiceRecordOut])
def list_records(vehicle_id: int):
    return _decode(db.rows(_LIST_SQL, (vehicle_id,)))


@router.post("/{vehicle_id}", response_model=Message, status_code=status.HTTP_201_CREATED)
def add_record(vehicle_id: int, body: ServiceRecordIn):
    try:
        db.execute(
            """INSERT INTO service_records
            (vehicle_id, date, odm, items, custom_item, price)
            VALUES (?, ?, ?, ?, ?, ?)""",
            (vehicle_id, body.date, body.odm, json.dumps(body.items or []),
             body.customItem, body.price),
        )
    except sqlite3.IntegrityError as err:
        if not _is_unique_violation(err):
            raise
        return Response(
            content=Message(message="保養記錄已存在").model_dump_json(),
            status_code=status.HTTP_409_CONFLICT,
            media_type="application/json",
        )
    return Message(message="保養記錄已新增")


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(vehicle_id: int, odm: int):
    db.execute("DELETE FROM service_records WHERE vehicle_id=? AND odm=?", (vehicle_id, odm))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{vehicle_id}/{record_id}", response_model=Message)
def update_record(vehicle_id: int, record_id: int, body: ServiceRecordIn):
    existing = db.rows("SELECT id FROM service_records WHERE id=? AND vehicle_id=?", (record_id, vehicle_id))
    if not existing:
        return Response(
            content=Message(message="找不到保養記錄").model_dump_json(),
            status_code=status.HTTP_404_NOT_FOUND,
            media_type="application/json",
        )
    try:
        db.execute(
            """UPDATE service_records
            SET date=?, odm=?, items=?, custom_item=?, price=?
            WHERE id=? AND vehicle_id=?""",
            (body.date, body.odm, json.dumps(body.items or []), body.customItem,
             body.price, record_id, vehicle_id),
        )
    except sqlite3.IntegrityError as err:
        if not _is_unique_violation(err):
            raise
        return Response(
            content=Message(message="保養記錄已存在").model_dump_json(),
            status_code=status.HTTP_409_CONFLICT,
            media_type="application/json",
        )
    return Message(message="保養記錄已更新")
