import { getDb } from './database';

export interface FineRecord {
  id?: number;
  date: string;
  offences: number[];
  customOffence?: string | null;
  location?: string | null;
  penalty: number;
}

// Local port of the cloud /api/finerecords endpoints. offences travels as
// a JSON int[] in TEXT (unknown ids survive untouched). No UNIQUE
// constraint, so deletes/updates key on the surrogate id.
export async function listFineRecords(vehicleId: string): Promise<FineRecord[]> {
  const rows = await getDb().getAllAsync<{
    id: number; date: string; offences: string;
    custom_offence: string | null; location: string | null; penalty: number;
  }>(
    `SELECT id, date, offences, custom_offence, location, penalty
     FROM fine_records WHERE vehicle_id = ? ORDER BY date DESC, id DESC`,
    vehicleId,
  );
  return rows.map(r => ({
    id: r.id,
    date: r.date,
    offences: parseIds(r.offences),
    customOffence: r.custom_offence,
    location: r.location,
    penalty: r.penalty,
  }));
}

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

export async function addFineRecord(
  vehicleId: string,
  rec: Omit<FineRecord, 'id'>,
): Promise<number> {
  const result = await getDb().runAsync(
    `INSERT INTO fine_records (vehicle_id, date, offences, custom_offence, location, penalty)
     VALUES (?, ?, ?, ?, ?, ?)`,
    vehicleId,
    rec.date,
    JSON.stringify(rec.offences ?? []),
    rec.customOffence?.trim() ? rec.customOffence.trim() : null,
    rec.location?.trim() ? rec.location.trim() : null,
    rec.penalty,
  );
  return result.lastInsertRowId;
}

export async function deleteFineRecord(vehicleId: string, id: number): Promise<void> {
  await getDb().runAsync('DELETE FROM fine_records WHERE id = ? AND vehicle_id = ?', id, vehicleId);
}

export async function updateFineRecord(
  vehicleId: string,
  id: number,
  rec: Omit<FineRecord, 'id'>,
): Promise<void> {
  await getDb().runAsync(
    `UPDATE fine_records
     SET date = ?, offences = ?, custom_offence = ?, location = ?, penalty = ?
     WHERE id = ? AND vehicle_id = ?`,
    rec.date,
    JSON.stringify(rec.offences ?? []),
    rec.customOffence?.trim() ? rec.customOffence.trim() : null,
    rec.location?.trim() ? rec.location.trim() : null,
    rec.penalty,
    id,
    vehicleId,
  );
}
