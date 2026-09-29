import { getDb } from './database';

export interface TunnelRecord {
  id?: number;
  date: string;
  tunnel: number;
  bound: number;
  fee: number;
}

// Local port of the cloud /api/tunnelrecords endpoints. No UNIQUE
// constraint (same tunnel twice a day is normal), so deletes/updates key
// on the surrogate id. Newest-first like every other list.
export async function listTunnelRecords(vehicleId: string): Promise<TunnelRecord[]> {
  return getDb().getAllAsync<TunnelRecord>(
    `SELECT id, date, tunnel, bound, fee
     FROM tunnel_records WHERE vehicle_id = ? ORDER BY date DESC, id DESC`,
    vehicleId,
  );
}

export async function addTunnelRecord(vehicleId: string, rec: Omit<TunnelRecord, 'id'>): Promise<number> {
  const result = await getDb().runAsync(
    `INSERT INTO tunnel_records (vehicle_id, date, tunnel, bound, fee)
     VALUES (?, ?, ?, ?, ?)`,
    vehicleId,
    rec.date,
    rec.tunnel,
    rec.bound,
    rec.fee,
  );
  return result.lastInsertRowId;
}

export async function deleteTunnelRecord(vehicleId: string, id: number): Promise<void> {
  await getDb().runAsync('DELETE FROM tunnel_records WHERE id = ? AND vehicle_id = ?', id, vehicleId);
}

export async function updateTunnelRecord(
  vehicleId: string,
  id: number,
  rec: Omit<TunnelRecord, 'id'>,
): Promise<void> {
  await getDb().runAsync(
    `UPDATE tunnel_records
     SET date = ?, tunnel = ?, bound = ?, fee = ?
     WHERE id = ? AND vehicle_id = ?`,
    rec.date,
    rec.tunnel,
    rec.bound,
    rec.fee,
    id,
    vehicleId,
  );
}
