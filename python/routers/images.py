"""POST/GET/DELETE /api/images: uploads for vehicle avatars and record
receipts. Files on disk under UPLOAD_DIR (default: next to sqlite.db +
/uploads), db rows in `images` keyed by (entity_type, entity_id, kind) —
1 avatar per vehicle, 1 receipt per record. `source` (optional upload field)
keeps the uncropped avatar so it can be re-cropped later (stored as
<kind>_source). Mirrors nodejs/server.js Images section.
"""
import datetime
import os

from fastapi import APIRouter, File, Form, Request, Response, UploadFile, status
from fastapi.responses import FileResponse

import db
import images
from schemas import Message

router = APIRouter(prefix="/api/images", tags=["images"])


def _error(message: str, code: int) -> Response:
    return Response(
        content=Message(message=message).model_dump_json(),
        status_code=code,
        media_type="application/json",
    )


def _int_or_null(v: object) -> int | None:
    if v is None:
        return None
    try:
        n = float(str(v).strip())
    except ValueError:
        return None
    if n > 0 and n.is_integer():
        return int(n)
    return None


def _now_iso() -> str:
    return (
        datetime.datetime.now(datetime.timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )


def _replace(entity_type: str, entity_id: int, kind: str) -> None:
    found = db.rows(
        """SELECT id, file_name FROM images
        WHERE entity_type=? AND entity_id=? AND kind=?""",
        (entity_type, entity_id, kind),
    )
    for row in found:
        images.remove_image_file(entity_type, entity_id, row["file_name"])
        db.execute("DELETE FROM images WHERE id=?", (row["id"],))


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_image(
    entityType: str = "",
    entityId: str = "",
    kind: str = "",
    file: UploadFile | None = File(None),
    source: UploadFile | None = File(None),
    width: str | None = Form(None),
    height: str | None = Form(None),
    sourceWidth: str | None = Form(None),
    sourceHeight: str | None = Form(None),
):
    if entityType not in images.ENTITY_TABLES:
        return _error("圖片類型無效", status.HTTP_400_BAD_REQUEST)
    try:
        entity_id = int(entityId)
    except ValueError:
        entity_id = 0
    if entity_id <= 0:
        return _error("圖片對象無效", status.HTTP_400_BAD_REQUEST)
    if kind not in images.KINDS:
        return _error("圖片用途無效", status.HTTP_400_BAD_REQUEST)
    if not images.entity_exists(entityType, entity_id):
        return _error(
            "找不到車輛" if entityType == "vehicle" else "找不到記錄",
            status.HTTP_404_NOT_FOUND,
        )
    main_data = await file.read() if file is not None else None
    source_data = await source.read() if source is not None else None
    for data in (main_data, source_data):
        if data is not None and len(data) > images.MAX_IMAGE_BYTES:
            return _error("圖片太大 (最大 10MB)", status.HTTP_400_BAD_REQUEST)
    if main_data is None:
        return _error("缺少圖片", status.HTTP_400_BAD_REQUEST)
    for f in (file, source):
        if f is not None and f.content_type not in images.ALLOWED_MIME:
            return _error("圖片格式無效", status.HTTP_400_BAD_REQUEST)
    _replace(entityType, entity_id, kind)
    main_name = images.save_image_file(main_data, entityType, entity_id, file.content_type)
    inserted = db.rows(
        """INSERT INTO images (entity_type, entity_id, kind, file_name, mime,
        width, height, size_bytes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *""",
        (entityType, entity_id, kind, main_name, file.content_type,
         _int_or_null(width), _int_or_null(height), len(main_data), _now_iso()),
    )
    image = images.image_json(inserted[0])
    source_image = None
    if source is not None:
        _replace(entityType, entity_id, f"{kind}_source")
        source_name = images.save_image_file(source_data, entityType, entity_id, source.content_type)
        inserted = db.rows(
            """INSERT INTO images (entity_type, entity_id, kind, file_name, mime,
            width, height, size_bytes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *""",
            (entityType, entity_id, f"{kind}_source", source_name, source.content_type,
             _int_or_null(sourceWidth), _int_or_null(sourceHeight), len(source_data), _now_iso()),
        )
        source_image = images.image_json(inserted[0])
    return {"message": "圖片已上載", "image": image, "source": source_image}


@router.get("")
def list_images(entityType: str = "", entityId: str = ""):
    if entityType not in images.ENTITY_TABLES:
        return _error("圖片類型無效", status.HTTP_400_BAD_REQUEST)
    ids = []
    for part in entityId.split(","):
        try:
            n = int(part.strip())
        except ValueError:
            continue
        if n > 0:
            ids.append(n)
    if not ids:
        return _error("圖片對象無效", status.HTTP_400_BAD_REQUEST)
    placeholders = ",".join("?" for _ in ids)
    found = db.rows(
        f"""SELECT * FROM images
        WHERE entity_type=? AND entity_id IN ({placeholders})
        ORDER BY id""",
        (entityType, *ids),
    )
    return [images.image_json(r) for r in found]


@router.get("/{image_id}/file")
def get_image_file(image_id: int, request: Request):
    found = db.rows("SELECT * FROM images WHERE id=?", (image_id,))
    if not found:
        return _error("找不到圖片", status.HTTP_404_NOT_FOUND)
    row = found[0]
    path = images.file_path_of(row["entity_type"], row["entity_id"], row["file_name"])
    if not os.path.isfile(path):
        return _error("找不到圖片", status.HTTP_404_NOT_FOUND)
    etag = f'"img-{row["id"]}"'
    headers = {
        "Content-Type": row["mime"],
        "Cache-Control": "public, max-age=31536000, immutable",
        "ETag": etag,
    }
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=status.HTTP_304_NOT_MODIFIED, headers=headers)
    return FileResponse(path, media_type=row["mime"], headers=headers)


@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_image(image_id: int):
    found = db.rows("SELECT * FROM images WHERE id=?", (image_id,))
    if not found:
        return _error("找不到圖片", status.HTTP_404_NOT_FOUND)
    row = found[0]
    images.remove_image_file(row["entity_type"], row["entity_id"], row["file_name"])
    db.execute("DELETE FROM images WHERE id=?", (image_id,))
    return Response(status_code=status.HTTP_204_NO_CONTENT)
