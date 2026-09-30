import { getDb } from './database';
import { DbDuplicateError, isUniqueViolation } from './errors';

export interface InsuranceRecord {
  id?: number;
  date: string;
  type: number;
  broker?: string | null;
  fee: number;
}

export interface LicenceRecord {
  id?: number;
  date: string;
  type: number;
  fee: number;
}

// Local ports of /api/insurancerecords + /api/licencerecords.
// UNIQUE(vehicle_id, date) on both — one policy/licence per start date.
async function listDated<T>(
  table: string,
  columns: string,
  vehicleId: string,
  map: (r: Record<string, number | string | null>) => T,
): Promise<T[]> {
  const rows = await getDb().getAllAsync<Record<string, number | string | null>>(
    `SELECT ${columns} FROM ${table} WHERE vehicle_id = ? ORDER BY date DESC, id DESC`,
    vehicleId,
  );
  return rows.map(map);
}

const str = (v: number | string | null | undefined): string | null =>
  v === null || v === undefined || v === '' ? null : String(v);

export async function listInsuranceRecords(vehicleId: string): Promise<InsuranceRecord[]> {
  return listDated(
    'insurance_records',
    'id, date, type, broker, fee',
    vehicleId,
    r => ({
      id: r.id as number,
      date: String(r.date),
      type: Number(r.type),
      broker: str(r.broker),
      fee: Number(r.fee),
    }),
  );
}

export async function listLicenceRecords(vehicleId: string): Promise<LicenceRecord[]> {
  return listDated(
    'licence_records',
    'id, date, type, fee',
    vehicleId,
    r => ({
      id: r.id as number,
      date: String(r.date),
      type: Number(r.type),
      fee: Number(r.fee),
    }),
  );
}

export async function addInsuranceRecord(
  vehicleId: string,
  rec: Omit<InsuranceRecord, 'id'>,
): Promise<number> {
  try {
    const result = await getDb().runAsync(
      `INSERT INTO insurance_records (vehicle_id, date, type, broker, fee)
       VALUES (?, ?, ?, ?, ?)`,
      vehicleId,
      rec.date,
      rec.type,
      str(rec.broker),
      rec.fee,
    );
    return result.lastInsertRowId;
  } catch (e: unknown) {
    if (isUniqueViolation(e)) throw new DbDuplicateError(`${rec.date} 已有保險記錄!`);
    throw e;
  }
}

export async function addLicenceRecord(
  vehicleId: string,
  rec: Omit<LicenceRecord, 'id'>,
): Promise<number> {
  try {
    const result = await getDb().runAsync(
      `INSERT INTO licence_records (vehicle_id, date, type, fee)
       VALUES (?, ?, ?, ?)`,
      vehicleId,
      rec.date,
      rec.type,
      rec.fee,
    );
    return result.lastInsertRowId;
  } catch (e: unknown) {
    if (isUniqueViolation(e)) throw new DbDuplicateError(`${rec.date} 已有牌費記錄!`);
    throw e;
  }
}

export async function deleteInsuranceRecord(vehicleId: string, id: number): Promise<void> {
  await getDb().runAsync('DELETE FROM insurance_records WHERE id = ? AND vehicle_id = ?', id, vehicleId);
}

export async function deleteLicenceRecord(vehicleId: string, id: number): Promise<void> {
  await getDb().runAsync('DELETE FROM licence_records WHERE id = ? AND vehicle_id = ?', id, vehicleId);
}

export async function updateInsuranceRecord(
  vehicleId: string,
  id: number,
  rec: Omit<InsuranceRecord, 'id'>,
): Promise<void> {
  try {
    await getDb().runAsync(
      `UPDATE insurance_records
       SET date = ?, type = ?, broker = ?, fee = ?
       WHERE id = ? AND vehicle_id = ?`,
      rec.date,
      rec.type,
      str(rec.broker),
      rec.fee,
      id,
      vehicleId,
    );
  } catch (e: unknown) {
    if (isUniqueViolation(e)) throw new DbDuplicateError(`${rec.date} 已有保險記錄!`);
    throw e;
  }
}

export async function updateLicenceRecord(
  vehicleId: string,
  id: number,
  rec: Omit<LicenceRecord, 'id'>,
): Promise<void> {
  try {
    await getDb().runAsync(
      `UPDATE licence_records
       SET date = ?, type = ?, fee = ?
       WHERE id = ? AND vehicle_id = ?`,
      rec.date,
      rec.type,
      rec.fee,
      id,
      vehicleId,
    );
  } catch (e: unknown) {
    if (isUniqueViolation(e)) throw new DbDuplicateError(`${rec.date} 已有牌費記錄!`);
    throw e;
  }
}
