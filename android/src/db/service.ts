import { getDb } from './database';
import { DbDuplicateError, isUniqueViolation } from './errors';

export interface ServiceRecord {
  id?: number;
  date: string;
  odm: number;
  items: number[];
  customItem?: string | null;
  price: number;
}

// Local port of the cloud /api/servicerecords endpoints. items travels as
// a JSON int[] in TEXT (unknown ids survive untouched).
// UNIQUE(vehicle_id, odm) like fuel — one service per mileage point.
function parseIds(raw: string | null): number[] {
  if (!raw) return [];
  const out: number[] = [];
  for (const part of raw.replace(/[\[\]\s]/g, '').split(',')) {
    if (!part) continue;
    const n = Number(part);
    if (Number.isInteger(n)) out.push(n);
  }
  return out;
}

export async function listServiceRecords(vehicleId: string): Promise<ServiceRecord[]> {
  const rows = await getDb().getAllAsync<{
    id: number; date: string; odm: number; items: string;
    custom_item: string | null; price: number;
  }>(
    `SELECT id, date, odm, items, custom_item, price
     FROM service_records WHERE vehicle_id = ? ORDER BY odm DESC`,
    vehicleId,
  );
  return rows.map(r => ({
    id: r.id,
    date: r.date,
    odm: r.odm,
    items: parseIds(r.items),
    customItem: r.custom_item,
    price: r.price,
  }));
}

export async function addServiceRecord(
  vehicleId: string,
  rec: Omit<ServiceRecord, 'id'>,
): Promise<number> {
  try {
    const result = await getDb().runAsync(
      `INSERT INTO service_records (vehicle_id, date, odm, items, custom_item, price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      vehicleId,
      rec.date,
      rec.odm,
      JSON.stringify(rec.items ?? []),
      rec.customItem?.trim() ? rec.customItem.trim() : null,
      rec.price,
    );
    return result.lastInsertRowId;
  } catch (e: unknown) {
    if (isUniqueViolation(e)) throw new DbDuplicateError(`${rec.odm} km 已有保養記錄!`);
    throw e;
  }
}

export async function deleteServiceRecord(vehicleId: string, odm: number): Promise<void> {
  await getDb().runAsync('DELETE FROM service_records WHERE vehicle_id = ? AND odm = ?', vehicleId, odm);
}

export async function updateServiceRecord(
  vehicleId: string,
  id: number,
  rec: Omit<ServiceRecord, 'id'>,
): Promise<void> {
  try {
    await getDb().runAsync(
      `UPDATE service_records
       SET date = ?, odm = ?, items = ?, custom_item = ?, price = ?
       WHERE id = ? AND vehicle_id = ?`,
      rec.date,
      rec.odm,
      JSON.stringify(rec.items ?? []),
      rec.customItem?.trim() ? rec.customItem.trim() : null,
      rec.price,
      id,
      vehicleId,
    );
  } catch (e: unknown) {
    if (isUniqueViolation(e)) throw new DbDuplicateError(`${rec.odm} km 已有保養記錄!`);
    throw e;
  }
}
