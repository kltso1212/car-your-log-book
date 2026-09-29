import type { FuelRecord } from '../data';
import { getDb } from './database';
import { DbDuplicateError, isUniqueViolation } from './errors';

interface FuelRow {
  id: number;
  date: string;
  odm: number;
  vendor: number;
  fuel_type: number;
  litre: number;
  price: number;
}

// Local port of the cloud /api/fuelrecords/{id} endpoints.
// pricePerLitre is computed in JS (same formula as the server SQL:
// price / litre, 0 when litre is 0).
function toRecord(row: FuelRow): FuelRecord {
  return {
    id: row.id,
    date: row.date,
    odm: row.odm,
    vendor: row.vendor,
    fuelType: row.fuel_type,
    litre: row.litre,
    price: row.price,
    pricePerLitre: row.litre > 0 ? row.price / row.litre : 0,
  };
}

export async function listFuelRecords(vehicleId: string): Promise<FuelRecord[]> {
  const rows = await getDb().getAllAsync<FuelRow>(
    `SELECT id, date, odm, vendor, fuel_type, litre, price
     FROM fuel_records WHERE vehicle_id = ? ORDER BY date DESC, odm DESC`,
    vehicleId,
  );
  return rows.map(toRecord);
}

export async function addFuelRecord(vehicleId: string, rec: FuelRecord): Promise<void> {
  try {
    await getDb().runAsync(
      `INSERT INTO fuel_records (vehicle_id, date, odm, vendor, fuel_type, litre, price)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      vehicleId,
      rec.date,
      rec.odm,
      rec.vendor,
      rec.fuelType,
      rec.litre,
      rec.price,
    );
  } catch (e: unknown) {
    if (isUniqueViolation(e)) throw new DbDuplicateError(`${rec.odm} km 已有入油記錄!`);
    throw e;
  }
}

export async function deleteFuelRecord(vehicleId: string, odm: number): Promise<void> {
  await getDb().runAsync('DELETE FROM fuel_records WHERE vehicle_id = ? AND odm = ?', vehicleId, odm);
}

// Edit by surrogate id (scoped to vehicle). Changing odm to another
// existing (vehicle, odm) throws the same duplicate message as insert.
export async function updateFuelRecord(
  vehicleId: string,
  id: number,
  rec: FuelRecord,
): Promise<void> {
  try {
    await getDb().runAsync(
      `UPDATE fuel_records
       SET date = ?, odm = ?, vendor = ?, fuel_type = ?, litre = ?, price = ?
       WHERE id = ? AND vehicle_id = ?`,
      rec.date,
      rec.odm,
      rec.vendor,
      rec.fuelType,
      rec.litre,
      rec.price,
      id,
      vehicleId,
    );
  } catch (e: unknown) {
    if (isUniqueViolation(e)) throw new DbDuplicateError(`${rec.odm} km 已有入油記錄!`);
    throw e;
  }
}
