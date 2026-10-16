"""GET/POST/PUT/DELETE /api/vehicles: list ordered by id, 200 + validation
400s with the Chinese messages.
plate is non-unique (same plate may appear on 2+ rows for plate reuse).
"""
import sqlite3
from fastapi import APIRouter, Response, status

import db
import images
from schemas import Message, VehicleCreated, VehicleIn, VehicleOut, VehicleUpdate, is_valid_year, normalize_plate

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


def _is_unique_violation(err: Exception) -> bool:
    return isinstance(err, sqlite3.IntegrityError) and "UNIQUE" in str(err)


@router.get("", response_model=list[VehicleOut])
def list_vehicles():
    return db.rows("SELECT id, plate, type, brand, model, year FROM vehicles ORDER BY id")


@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(vehicle_id: int):
    found = db.rows(
        "SELECT id, plate, type, brand, model, year FROM vehicles WHERE id=?", (vehicle_id,)
    )
    if not found:
        return Response(
            content=Message(message="找不到車輛").model_dump_json(),
            status_code=status.HTTP_404_NOT_FOUND,
            media_type="application/json",
        )
    return found[0]


@router.post("", response_model=VehicleCreated)
def add_vehicle(body: VehicleIn):
    if body.type not in (1, 2, 3, 4):
        return Response(
            content=Message(message="車輛類別無效").model_dump_json(),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json",
        )
    plate = normalize_plate(body.plate)
    if not plate:
        return Response(
            content=Message(message="車牌無效").model_dump_json(),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json",
        )
    brand = (body.brand or "").strip()
    model = (body.model or "").strip()
    year = body.year
    if not is_valid_year(year):
        return Response(
            content=Message(message="年份無效").model_dump_json(),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json",
        )
    try:
        created = db.rows(
            "INSERT INTO vehicles (plate, type, brand, model, year) VALUES (?, ?, ?, ?, ?) RETURNING id",
            (plate, body.type, brand, model, year),
        )
        new_id = created[0]["id"] if created else 0
    except sqlite3.IntegrityError as err:
        if not _is_unique_violation(err):
            raise
        return Response(
            content=Message(message="車輛已被註冊").model_dump_json(),
            status_code=status.HTTP_409_CONFLICT,
            media_type="application/json",
        )
    return {"message": "車輛註冊成功", "id": new_id}


@router.put("/{vehicle_id}", response_model=Message)
def update_vehicle(vehicle_id: int, body: VehicleUpdate):
    if body.type not in (1, 2, 3, 4):
        return Response(
            content=Message(message="車輛類別無效").model_dump_json(),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json",
        )
    plate = normalize_plate(body.plate)
    if not plate:
        return Response(
            content=Message(message="車牌無效").model_dump_json(),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json",
        )
    brand = (body.brand or "").strip()
    model = (body.model or "").strip()
    year = body.year
    if not is_valid_year(year):
        return Response(
            content=Message(message="年份無效").model_dump_json(),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json",
        )
    existing = db.rows("SELECT id FROM vehicles WHERE id=?", (vehicle_id,))
    if not existing:
        return Response(
            content=Message(message="找不到車輛").model_dump_json(),
            status_code=status.HTTP_404_NOT_FOUND,
            media_type="application/json",
        )
    db.execute(
        "UPDATE vehicles SET plate=?, type=?, brand=?, model=?, year=? WHERE id=?",
        (plate, body.type, brand, model, year, vehicle_id),
    )
    return Message(message="車輛已更新")


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: int):
    images.delete_vehicle_images(vehicle_id)  # before cascade drops the records
    db.execute("DELETE FROM vehicles WHERE id=?", (vehicle_id,))
    return Response(status_code=status.HTTP_204_NO_CONTENT)
