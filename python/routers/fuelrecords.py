"""GET/POST/PUT/DELETE /api/fuelrecords. Mirrors nodejs/server.js semantics,
including pricePerLitre computed in SQL and the Chinese messages.
"""
import sqlite3
from fastapi import APIRouter, Response, status

import db
from schemas import FuelRecordIn, FuelRecordOut, Message

router = APIRouter(prefix="/api/fuelrecords", tags=["fuelrecords"])


def _is_unique_violation(err: Exception) -> bool:
    return isinstance(err, sqlite3.IntegrityError) and "UNIQUE" in str(err)

_LIST_SQL = """
    SELECT id, date, odm, vendor, fuel_type AS "fuelType", litre, price,
    COALESCE(price / NULLIF(litre, 0), 0) AS "pricePerLitre"
    FROM fuel_records
    WHERE vehicle_id=?
    ORDER BY odm
"""


@router.get("/{vehicle_id}", response_model=list[FuelRecordOut])
def list_records(vehicle_id: str):
    print(f"GET api/fuelrecords/{vehicle_id}")
    return db.rows(_LIST_SQL, (vehicle_id,))


@router.post("/{vehicle_id}", response_model=Message, status_code=status.HTTP_201_CREATED)
def add_record(vehicle_id: str, body: FuelRecordIn):
    print(f"POST api/fuelrecords/{vehicle_id} {body.model_dump_json()}")
    db.execute(
        """INSERT INTO fuel_records
        (vehicle_id, date, odm, vendor, fuel_type, litre, price)
        VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (vehicle_id, body.date, body.odm, body.vendor, body.fuelType, body.litre, body.price),
    )
    return Message(message="入油記錄已新增")


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(vehicle_id: str, odm: int):
    print(f"DELETE api/fuelrecords/{vehicle_id} odm={odm}")
    db.execute("DELETE FROM fuel_records WHERE vehicle_id=? AND odm=?", (vehicle_id, odm))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{vehicle_id}/{record_id}", response_model=Message)
def update_record(vehicle_id: str, record_id: int, body: FuelRecordIn):
    print(f"PUT api/fuelrecords/{vehicle_id}/{record_id} {body.model_dump_json()}")
    existing = db.rows("SELECT id FROM fuel_records WHERE id=? AND vehicle_id=?", (record_id, vehicle_id))
    if not existing:
        return Response(
            content=Message(message="找不到入油記錄").model_dump_json(),
            status_code=status.HTTP_404_NOT_FOUND,
            media_type="application/json",
        )
    try:
        db.execute(
            """UPDATE fuel_records
            SET date=?, odm=?, vendor=?, fuel_type=?, litre=?, price=?
            WHERE id=? AND vehicle_id=?""",
            (body.date, body.odm, body.vendor, body.fuelType, body.litre, body.price, record_id, vehicle_id),
        )
    except sqlite3.IntegrityError as err:
        if not _is_unique_violation(err):
            raise
        return Response(
            content=Message(message="入油記錄已存在").model_dump_json(),
            status_code=status.HTTP_409_CONFLICT,
            media_type="application/json",
        )
    return Message(message="入油記錄已更新")
