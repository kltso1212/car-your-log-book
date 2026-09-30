import { getDb } from './database';

export interface ParkingRecord {
  id?: number;
  date: string;
  carpark: string;
  rentalType: number;
  fee: number;
}

// Local port of the cloud /api/parkingrecords endpoints. No UNIQUE
// constraint (multiple parks per day are normal), so deletes/updates key
// on the surrogate id. Newest-first like every other list.
export async function listParkingRecords(vehicleId: string): Promise<ParkingRecord[]> {
  return getDb().getAllAsync<ParkingRecord>(
    `SELECT id, date, carpark, rental_type AS rentalType, fee
     FROM parking_records WHERE vehicle_id = ? ORDER BY date DESC, id DESC`,
    vehicleId,
  );
}

export async function addParkingRecord(
  vehicleId: string,
  rec: Omit<ParkingRecord, 'id'>,
): Promise<number> {
  const result = await getDb().runAsync(
    `INSERT INTO parking_records (vehicle_id, date, carpark, rental_type, fee)
     VALUES (?, ?, ?, ?, ?)`,
    vehicleId,
    rec.date,
    rec.carpark,
    rec.rentalType,
    rec.fee,
  );
  return result.lastInsertRowId;
}

export async function deleteParkingRecord(vehicleId: string, id: number): Promise<void> {
  await getDb().runAsync('DELETE FROM parking_records WHERE id = ? AND vehicle_id = ?', id, vehicleId);
}

export async function updateParkingRecord(
  vehicleId: string,
  id: number,
  rec: Omit<ParkingRecord, 'id'>,
): Promise<void> {
  await getDb().runAsync(
    `UPDATE parking_records
     SET date = ?, carpark = ?, rental_type = ?, fee = ?
     WHERE id = ? AND vehicle_id = ?`,
    rec.date,
    rec.carpark,
    rec.rentalType,
    rec.fee,
    id,
    vehicleId,
  );
}
