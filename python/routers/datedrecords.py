"""GET/POST/PUT/DELETE /api/insurancerecords and /api/licencerecords.
Both are flat dated rows (date/type/fee, insurance adds broker) with
UNIQUE(vehicle_id, date) — one policy/licence per start date.
"""
import sqlite3

from fastapi import APIRouter, Response, status

import db
from schemas import (
    InsuranceRecordIn,
    InsuranceRecordOut,
    LicenceRecordIn,
    LicenceRecordOut,
    Message,
)


def _is_unique_violation(err: Exception) -> bool:
    return isinstance(err, sqlite3.IntegrityError) and "UNIQUE" in str(err)


insurance_router = APIRouter(prefix="/api/insurancerecords", tags=["insurancerecords"])
licence_router = APIRouter(prefix="/api/licencerecords", tags=["licencerecords"])

_LIST_INSURANCE_SQL = """
    SELECT id, date, type, broker, fee
    FROM insurance_records
    WHERE vehicle_id=?
    ORDER BY date DESC, id DESC
"""

_LIST_LICENCE_SQL = """
    SELECT id, date, type, fee
    FROM licence_records
    WHERE vehicle_id=?
    ORDER BY date DESC, id DESC
"""


@insurance_router.get("/{vehicle_id}", response_model=list[InsuranceRecordOut])
def list_insurance(vehicle_id: str):
    print(f"GET api/insurancerecords/{vehicle_id}")
    return db.rows(_LIST_INSURANCE_SQL, (vehicle_id,))


@licence_router.get("/{vehicle_id}", response_model=list[LicenceRecordOut])
def list_licence(vehicle_id: str):
    print(f"GET api/licencerecords/{vehicle_id}")
    return db.rows(_LIST_LICENCE_SQL, (vehicle_id,))


@insurance_router.post("/{vehicle_id}", status_code=status.HTTP_201_CREATED)
def add_insurance(vehicle_id: str, body: InsuranceRecordIn):
    print(f"POST api/insurancerecords/{vehicle_id} {body.model_dump_json()}")
    try:
        new_id = db.insert(
            """INSERT INTO insurance_records
            (vehicle_id, date, type, broker, fee)
            VALUES (?, ?, ?, ?, ?)""",
            (vehicle_id, body.date, body.type, body.broker, body.fee),
        )
    except sqlite3.IntegrityError as err:
        if not _is_unique_violation(err):
            raise
        return Response(
            content=Message(message="保險記錄已存在").model_dump_json(),
            status_code=status.HTTP_409_CONFLICT,
            media_type="application/json",
        )
    return {"message": "保險記錄已新增", "id": new_id}


@licence_router.post("/{vehicle_id}", status_code=status.HTTP_201_CREATED)
def add_licence(vehicle_id: str, body: LicenceRecordIn):
    print(f"POST api/licencerecords/{vehicle_id} {body.model_dump_json()}")
    try:
        new_id = db.insert(
            """INSERT INTO licence_records
            (vehicle_id, date, type, fee)
            VALUES (?, ?, ?, ?)""",
            (vehicle_id, body.date, body.type, body.fee),
        )
    except sqlite3.IntegrityError as err:
        if not _is_unique_violation(err):
            raise
        return Response(
            content=Message(message="牌費記錄已存在").model_dump_json(),
            status_code=status.HTTP_409_CONFLICT,
            media_type="application/json",
        )
    return {"message": "牌費記錄已新增", "id": new_id}


@insurance_router.delete("/{vehicle_id}/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_insurance(vehicle_id: str, record_id: int):
    print(f"DELETE api/insurancerecords/{vehicle_id}/{record_id}")
    db.execute("DELETE FROM insurance_records WHERE id=? AND vehicle_id=?", (record_id, vehicle_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@licence_router.delete("/{vehicle_id}/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_licence(vehicle_id: str, record_id: int):
    print(f"DELETE api/licencerecords/{vehicle_id}/{record_id}")
    db.execute("DELETE FROM licence_records WHERE id=? AND vehicle_id=?", (record_id, vehicle_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@insurance_router.put("/{vehicle_id}/{record_id}", response_model=Message)
def update_insurance(vehicle_id: str, record_id: int, body: InsuranceRecordIn):
    print(f"PUT api/insurancerecords/{vehicle_id}/{record_id} {body.model_dump_json()}")
    existing = db.rows("SELECT id FROM insurance_records WHERE id=? AND vehicle_id=?", (record_id, vehicle_id))
    if not existing:
        return Response(
            content=Message(message="找不到保險記錄").model_dump_json(),
            status_code=status.HTTP_404_NOT_FOUND,
            media_type="application/json",
        )
    try:
        db.execute(
            """UPDATE insurance_records
            SET date=?, type=?, broker=?, fee=?
            WHERE id=? AND vehicle_id=?""",
            (body.date, body.type, body.broker, body.fee, record_id, vehicle_id),
        )
    except sqlite3.IntegrityError as err:
        if not _is_unique_violation(err):
            raise
        return Response(
            content=Message(message="保險記錄已存在").model_dump_json(),
            status_code=status.HTTP_409_CONFLICT,
            media_type="application/json",
        )
    return Message(message="保險記錄已更新")


@licence_router.put("/{vehicle_id}/{record_id}", response_model=Message)
def update_licence(vehicle_id: str, record_id: int, body: LicenceRecordIn):
    print(f"PUT api/licencerecords/{vehicle_id}/{record_id} {body.model_dump_json()}")
    existing = db.rows("SELECT id FROM licence_records WHERE id=? AND vehicle_id=?", (record_id, vehicle_id))
    if not existing:
        return Response(
            content=Message(message="找不到牌費記錄").model_dump_json(),
            status_code=status.HTTP_404_NOT_FOUND,
            media_type="application/json",
        )
    try:
        db.execute(
            """UPDATE licence_records
            SET date=?, type=?, fee=?
            WHERE id=? AND vehicle_id=?""",
            (body.date, body.type, body.fee, record_id, vehicle_id),
        )
    except sqlite3.IntegrityError as err:
        if not _is_unique_violation(err):
            raise
        return Response(
            content=Message(message="牌費記錄已存在").model_dump_json(),
            status_code=status.HTTP_409_CONFLICT,
            media_type="application/json",
        )
    return Message(message="牌費記錄已更新")
