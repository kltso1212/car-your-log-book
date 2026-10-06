"""GET/POST/PUT/DELETE /api/parkingrecords. Same CRUD shape as tunnelrecords
(date/carpark/rental_type/fee), no UNIQUE constraint, deletes key on id.
"""
from fastapi import APIRouter, Response, status

import db
from schemas import Message, ParkingRecordIn, ParkingRecordOut

router = APIRouter(prefix="/api/parkingrecords", tags=["parkingrecords"])

_LIST_SQL = """
    SELECT id, date, carpark, rental_type AS "rentalType", fee
    FROM parking_records
    WHERE vehicle_id=?
    ORDER BY date DESC, id DESC
"""


@router.get("/{vehicle_id}", response_model=list[ParkingRecordOut])
def list_records(vehicle_id: str):
    return db.rows(_LIST_SQL, (vehicle_id,))


@router.post("/{vehicle_id}", status_code=status.HTTP_201_CREATED)
def add_record(vehicle_id: str, body: ParkingRecordIn):
    new_id = db.insert(
        """INSERT INTO parking_records
        (vehicle_id, date, carpark, rental_type, fee)
        VALUES (?, ?, ?, ?, ?)""",
        (vehicle_id, body.date, body.carpark, body.rentalType, body.fee),
    )
    return {"message": "泊車記錄已新增", "id": new_id}


@router.delete("/{vehicle_id}/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(vehicle_id: str, record_id: int):
    db.execute("DELETE FROM parking_records WHERE id=? AND vehicle_id=?", (record_id, vehicle_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{vehicle_id}/{record_id}", response_model=Message)
def update_record(vehicle_id: str, record_id: int, body: ParkingRecordIn):
    existing = db.rows("SELECT id FROM parking_records WHERE id=? AND vehicle_id=?", (record_id, vehicle_id))
    if not existing:
        return Response(
            content=Message(message="找不到泊車記錄").model_dump_json(),
            status_code=status.HTTP_404_NOT_FOUND,
            media_type="application/json",
        )
    db.execute(
        """UPDATE parking_records
        SET date=?, carpark=?, rental_type=?, fee=?
        WHERE id=? AND vehicle_id=?""",
        (body.date, body.carpark, body.rentalType, body.fee, record_id, vehicle_id),
    )
    return Message(message="泊車記錄已更新")
