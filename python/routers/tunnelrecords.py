"""GET/POST/PUT/DELETE /api/tunnelrecords. Same CRUD shape as fuelrecords
(date/tunnel/bound/fee instead of date/odm/vendor/...), but no UNIQUE
constraint (same tunnel twice a day is normal), so deletes key on the
surrogate id instead of ?odm=.
"""
from fastapi import APIRouter, Response, status

import db
import images
from schemas import Message, TunnelRecordIn, TunnelRecordOut

router = APIRouter(prefix="/api/tunnelrecords", tags=["tunnelrecords"])

_LIST_SQL = """
    SELECT id, date, tunnel, bound, fee
    FROM tunnel_records
    WHERE vehicle_id=?
    ORDER BY date DESC, id DESC
"""


@router.get("/{vehicle_id}", response_model=list[TunnelRecordOut])
def list_records(vehicle_id: int):
    return db.rows(_LIST_SQL, (vehicle_id,))


@router.post("/{vehicle_id}", status_code=status.HTTP_201_CREATED)
def add_record(vehicle_id: int, body: TunnelRecordIn):
    new_id = db.insert(
        """INSERT INTO tunnel_records
        (vehicle_id, date, tunnel, bound, fee)
        VALUES (?, ?, ?, ?, ?)""",
        (vehicle_id, body.date, body.tunnel, body.bound, body.fee),
    )
    return {"message": "隧道記錄已新增", "id": new_id}


@router.delete("/{vehicle_id}/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(vehicle_id: int, record_id: int):
    images.delete_images_for("tunnel_record", record_id)
    db.execute("DELETE FROM tunnel_records WHERE id=? AND vehicle_id=?", (record_id, vehicle_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{vehicle_id}/{record_id}", response_model=Message)
def update_record(vehicle_id: int, record_id: int, body: TunnelRecordIn):
    existing = db.rows("SELECT id FROM tunnel_records WHERE id=? AND vehicle_id=?", (record_id, vehicle_id))
    if not existing:
        return Response(
            content=Message(message="找不到隧道記錄").model_dump_json(),
            status_code=status.HTTP_404_NOT_FOUND,
            media_type="application/json",
        )
    db.execute(
        """UPDATE tunnel_records
        SET date=?, tunnel=?, bound=?, fee=?
        WHERE id=? AND vehicle_id=?""",
        (body.date, body.tunnel, body.bound, body.fee, record_id, vehicle_id),
    )
    return Message(message="隧道記錄已更新")
