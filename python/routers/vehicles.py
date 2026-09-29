"""GET/POST/DELETE /api/vehicles. Mirrors nodejs/server.js semantics:
list ordered by id, 200 + duplicate-409 with the same Chinese messages.
"""
import sqlite3
from fastapi import APIRouter, Response, status

import db
from schemas import Message, VehicleIn, VehicleOut

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


def _is_unique_violation(err: Exception) -> bool:
    return isinstance(err, sqlite3.IntegrityError) and "UNIQUE" in str(err)


@router.get("", response_model=list[VehicleOut])
def list_vehicles():
    print("GET api/vehicles")
    return db.rows("SELECT id, type FROM vehicles ORDER BY id")


@router.post("", response_model=Message)
def add_vehicle(body: VehicleIn):
    print(f"POST api/vehicles {body.model_dump_json()}")
    if body.type not in (1, 2, 3, 4):
        return Response(
            content=Message(message="車輛類別無效").model_dump_json(),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json",
        )
    try:
        db.execute("INSERT INTO vehicles (id, type) VALUES (?, ?)", (body.id, body.type))
    except sqlite3.IntegrityError as err:
        if not _is_unique_violation(err):
            raise
        return Response(
            content=Message(message="車輛已被註冊").model_dump_json(),
            status_code=status.HTTP_409_CONFLICT,
            media_type="application/json",
        )
    return Message(message="車輛註冊成功")


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: str):
    print(f"DELETE api/vehicles/{vehicle_id}")
    db.execute("DELETE FROM vehicles WHERE id=?", (vehicle_id,))
    return Response(status_code=status.HTTP_204_NO_CONTENT)
