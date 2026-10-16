"""GET/POST/PUT/DELETE /api/chargerecords. Same CRUD shape as fuelrecords
(kwh instead of litre), for electric vehicles only (enforced in frontends).
"""
import sqlite3
from fastapi import APIRouter, Response, status

import db
import images
from routers.vehicles import _is_unique_violation
from schemas import ChargeRecordIn, ChargeRecordOut, Message

router = APIRouter(prefix="/api/chargerecords", tags=["chargerecords"])

_LIST_SQL = """
    SELECT id, date, odm, kwh, price,
    COALESCE(price / NULLIF(kwh, 0), 0) AS "pricePerKwh"
    FROM charge_records
    WHERE vehicle_id=?
    ORDER BY odm
"""


@router.get("/{vehicle_id}", response_model=list[ChargeRecordOut])
def list_records(vehicle_id: int):
    return db.rows(_LIST_SQL, (vehicle_id,))


@router.post("/{vehicle_id}", status_code=status.HTTP_201_CREATED)
def add_record(vehicle_id: int, body: ChargeRecordIn):
    try:
        new_id = db.insert(
            """INSERT INTO charge_records
            (vehicle_id, date, odm, kwh, price)
            VALUES (?, ?, ?, ?, ?)""",
            (vehicle_id, body.date, body.odm, body.kwh, body.price),
        )
    except sqlite3.IntegrityError as err:
        if not _is_unique_violation(err):
            raise
        return Response(
            content=Message(message="充電記錄已存在").model_dump_json(),
            status_code=status.HTTP_409_CONFLICT,
            media_type="application/json",
        )
    return {"message": "充電記錄已新增", "id": new_id}


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(vehicle_id: int, odm: int):
    for rec in db.rows("SELECT id FROM charge_records WHERE vehicle_id=? AND odm=?", (vehicle_id, odm)):
        images.delete_images_for("charge_record", rec["id"])
    db.execute("DELETE FROM charge_records WHERE vehicle_id=? AND odm=?", (vehicle_id, odm))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{vehicle_id}/{record_id}", response_model=Message)
def update_record(vehicle_id: int, record_id: int, body: ChargeRecordIn):
    existing = db.rows("SELECT id FROM charge_records WHERE id=? AND vehicle_id=?", (record_id, vehicle_id))
    if not existing:
        return Response(
            content=Message(message="找不到充電記錄").model_dump_json(),
            status_code=status.HTTP_404_NOT_FOUND,
            media_type="application/json",
        )
    try:
        db.execute(
            """UPDATE charge_records
            SET date=?, odm=?, kwh=?, price=?
            WHERE id=? AND vehicle_id=?""",
            (body.date, body.odm, body.kwh, body.price, record_id, vehicle_id),
        )
    except sqlite3.IntegrityError as err:
        if not _is_unique_violation(err):
            raise
        return Response(
            content=Message(message="充電記錄已存在").model_dump_json(),
            status_code=status.HTTP_409_CONFLICT,
            media_type="application/json",
        )
    return Message(message="充電記錄已更新")
