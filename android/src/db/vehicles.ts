import type { Vehicle, VehicleType } from '../data';
import { getDb } from './database';
import { DbDuplicateError, isUniqueViolation } from './errors';

// Local vehicles table. Type is set once at creation (1-4) and never updated.
export async function listVehicles(): Promise<Vehicle[]> {
  const rows = await getDb().getAllAsync<{ id: string; type: number }>(
    'SELECT id, CAST(type AS INTEGER) AS type FROM vehicles ORDER BY id',
  );
  return rows.map(r => ({ id: r.id, type: (r.type as VehicleType) }));
}

export async function addVehicle(id: string, type: VehicleType): Promise<void> {
  try {
    await getDb().runAsync('INSERT INTO vehicles (id, type) VALUES (?, ?)', id, type);
  } catch (e: unknown) {
    if (isUniqueViolation(e)) throw new DbDuplicateError('車輛已被註冊');
    throw e;
  }
}

export async function deleteVehicle(id: string): Promise<void> {
  await getDb().runAsync('DELETE FROM vehicles WHERE id = ?', id);
}
