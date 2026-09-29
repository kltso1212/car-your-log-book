import type { ChargeRecord } from '../data';
import { getDb } from './database';
import { DbDuplicateError, isUniqueViolation } from './errors';

interface ChargeRow {
  id: number;
  date: string;
  odm: number;
  kwh: number;
  price: number;
}

// Local port of the cloud /api/chargerecords/{id} endpoints (electric only).
// pricePerKwh is computed in JS (same formula as the server SQL).
function toRecord(row: ChargeRow): ChargeRecord {
  return {
    id: row.id,
    date: row.date,
    odm: row.odm,
    kwh: row.kwh,
    price: row.price,
    pricePerKwh: row.kwh > 0 ? row.price / row.kwh : 0,
  };
}

export async function listChargeRecords(vehicleId: string): Promise<ChargeRecord[]> {
  const rows = await getDb().getAllAsync<ChargeRow>(
    `SELECT id, date, odm, kwh, price
     FROM charge_records WHERE vehicle_id = ? ORDER BY date DESC, odm DESC`,
    vehicleId,
  );
  return rows.map(toRecord);
}

export async function addChargeRecord(vehicleId: string, rec: ChargeRecord): Promise<void> {
  try {
    await getDb().runAsync(
      `INSERT INTO charge_records (vehicle_id, date, odm, kwh, price)
       VALUES (?, ?, ?, ?, ?)`,
      vehicleId,
      rec.date,
      rec.odm,
      rec.kwh,
      rec.price,
    );
  } catch (e: unknown) {
    if (isUniqueViolation(e)) throw new DbDuplicateError(`${rec.odm} km 已有充電記錄!`);
    throw e;
  }
}

export async function deleteChargeRecord(vehicleId: string, odm: number): Promise<void> {
  await getDb().runAsync('DELETE FROM charge_records WHERE vehicle_id = ? AND odm = ?', vehicleId, odm);
}

export async function updateChargeRecord(
  vehicleId: string,
  id: number,
  rec: ChargeRecord,
): Promise<void> {
  try {
    await getDb().runAsync(
      `UPDATE charge_records
       SET date = ?, odm = ?, kwh = ?, price = ?
       WHERE id = ? AND vehicle_id = ?`,
      rec.date,
      rec.odm,
      rec.kwh,
      rec.price,
      id,
      vehicleId,
    );
  } catch (e: unknown) {
    if (isUniqueViolation(e)) throw new DbDuplicateError(`${rec.odm} km 已有充電記錄!`);
    throw e;
  }
}
