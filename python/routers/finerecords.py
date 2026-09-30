"""GET/POST/PUT/DELETE /api/finerecords. Same CRUD shape as tunnelrecords
(date/offences/custom_offence/location/penalty), no UNIQUE constraint,
deletes key on id. offences travels as a JSON int[] on the wire and in TEXT.
"""
import json

from fastapi import APIRouter, Response, status

import db
from schemas import FineRecordIn, FineRecordOut, Message

router = APIRouter(prefix="/api/finerecords", tags=["finerecords"])

_LIST_SQL = """
    SELECT id, date, offences, custom_offence AS "customOffence",
    location, penalty
    FROM fine_records
    WHERE vehicle_id=?
    ORDER BY date DESC, id DESC
"""


def _decode(rows: list[dict]) -> list[dict]:
    for r in rows:
        try:
            r["offences"] = json.loads(r.get("offences") or "[]")
        except (ValueError, TypeError):
            r["offences"] = []
    return rows


@router.get("/{vehicle_id}", response_model=list[FineRecordOut])
def list_records(vehicle_id: str):
    print(f"GET api/finerecords/{vehicle_id}")
    return _decode(db.rows(_LIST_SQL, (vehicle_id,)))


@router.post("/{vehicle_id}", status_code=status.HTTP_201_CREATED)
def add_record(vehicle_id: str, body: FineRecordIn):
    print(f"POST api/finerecords/{vehicle_id} {body.model_dump_json()}")
    new_id = db.insert(
        """INSERT INTO fine_records
        (vehicle_id, date, offences, custom_offence, location, penalty)
        VALUES (?, ?, ?, ?, ?, ?)""",
        (vehicle_id, body.date, json.dumps(body.offences or []),
         body.customOffence, body.location, body.penalty),
    )
    return {"message": "罰款記錄已新增", "id": new_id}


@router.delete("/{vehicle_id}/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(vehicle_id: str, record_id: int):
    print(f"DELETE api/finerecords/{vehicle_id}/{record_id}")
    db.execute("DELETE FROM fine_records WHERE id=? AND vehicle_id=?", (record_id, vehicle_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{vehicle_id}/{record_id}", response_model=Message)
def update_record(vehicle_id: str, record_id: int, body: FineRecordIn):
    print(f"PUT api/finerecords/{vehicle_id}/{record_id} {body.model_dump_json()}")
    existing = db.rows("SELECT id FROM fine_records WHERE id=? AND vehicle_id=?", (record_id, vehicle_id))
    if not existing:
        return Response(
            content=Message(message="找不到罰款記錄").model_dump_json(),
            status_code=status.HTTP_404_NOT_FOUND,
            media_type="application/json",
        )
    db.execute(
        """UPDATE fine_records
        SET date=?, offences=?, custom_offence=?, location=?, penalty=?
        WHERE id=? AND vehicle_id=?""",
        (body.date, json.dumps(body.offences or []), body.customOffence,
         body.location, body.penalty, record_id, vehicle_id),
    )
    return Message(message="罰款記錄已更新")
