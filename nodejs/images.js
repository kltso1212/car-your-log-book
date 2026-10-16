const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { query, dbPath } = require('./db');

// Image files live next to the SQLite file so both share one volume:
// /data/sqlite.db + /data/uploads in compose, ../sqlite.db + ../uploads locally.
// UPLOAD_DIR overrides the location (same env var in every backend).
const UPLOAD_DIR = process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(path.dirname(path.resolve(dbPath)), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ENTITY_TABLES = {
    vehicle: 'vehicles',
    fuel_record: 'fuel_records',
    charge_record: 'charge_records',
    tunnel_record: 'tunnel_records',
    parking_record: 'parking_records',
    fine_record: 'fine_records',
    service_record: 'service_records',
    insurance_record: 'insurance_records',
    licence_record: 'licence_records',
};
const TABLE_ENTITIES = Object.fromEntries(
    Object.entries(ENTITY_TABLES).map(([entity, table]) => [table, entity]));

const KINDS = ['avatar', 'receipt']; // '<kind>_source' rows are stored implicitly
const ALLOWED_MIME = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const entityExists = async (entityType, entityId) => {
    const table = ENTITY_TABLES[entityType];
    if (!table) return false;
    const { rows } = await query(`SELECT 1 FROM ${table} WHERE id=$1`, [entityId]);
    return rows.length > 0;
};

const filePathOf = (entityType, entityId, fileName) =>
    path.join(UPLOAD_DIR, entityType, String(entityId), fileName);

// Writes the buffer under uploads/<entityType>/<entityId>/<uuid>.<ext>.
const saveImageFile = (buffer, entityType, entityId, mime) => {
    const fileName = `${crypto.randomUUID()}.${ALLOWED_MIME[mime]}`;
    const target = filePathOf(entityType, entityId, fileName);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, buffer);
    return fileName;
};

const removeImageFile = (entityType, entityId, fileName) => {
    if (!fileName) return;
    try {
        fs.unlinkSync(filePathOf(entityType, entityId, fileName));
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }
};

const imageJson = (row) => ({
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    kind: row.kind,
    mime: row.mime,
    width: row.width ?? null,
    height: row.height ?? null,
    sizeBytes: row.size_bytes,
    url: `/api/images/${row.id}/file`,
    createdAt: row.created_at,
});

// Removes db rows + files for one entity (all kinds: avatar, avatar_source, receipt).
const deleteImagesFor = async (entityType, entityId) => {
    entityId = Number(entityId);
    if (!Number.isInteger(entityId)) return 0;
    const { rows } = await query(
        `SELECT id, file_name FROM images
        WHERE entity_type=$1 AND entity_id=$2`, [entityType, entityId]);
    for (const row of rows) removeImageFile(entityType, entityId, row.file_name);
    await query(
        `DELETE FROM images
        WHERE entity_type=$1 AND entity_id=$2`, [entityType, entityId]);
    return rows.length;
};

// Deleting a vehicle cascades its records away, so their images would be
// orphaned — collect record ids first, then drop every related image.
const deleteVehicleImages = async (vehicleId) => {
    await deleteImagesFor('vehicle', vehicleId);
    for (const [table, entityType] of Object.entries(TABLE_ENTITIES)) {
        if (entityType === 'vehicle') continue;
        const { rows } = await query(`SELECT id FROM ${table} WHERE vehicle_id=$1`, [vehicleId]);
        for (const row of rows) await deleteImagesFor(entityType, row.id);
    }
};

module.exports = {
    UPLOAD_DIR,
    ENTITY_TABLES,
    TABLE_ENTITIES,
    KINDS,
    ALLOWED_MIME,
    MAX_IMAGE_BYTES,
    entityExists,
    filePathOf,
    saveImageFile,
    removeImageFile,
    imageJson,
    deleteImagesFor,
    deleteVehicleImages,
};
