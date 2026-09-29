import axios from 'axios';
import type { FuelRecord } from '../types';
import type { VehicleType } from '../types/Vehicle';

const getBaseUrl = (): string => {
  const envUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000').trim();
  // Cloud single-origin deploy (nginx reverse-proxy /api -> backend):
  // REACT_APP_API_URL=/api needs no hostname at all.
  if (envUrl.startsWith('/')) return envUrl;
  try {
    const u = new URL(envUrl);
    const isEnvLocal = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    // Cloud deploy: explicit backend URL baked at build time always wins.
    // e.g. REACT_APP_API_URL=https://api-xxx.run.app (see reactjs/.env.example)
    if (!isEnvLocal) return u.toString().replace(/\/$/, '');
    // Local / LAN / other PC: page may be opened via LAN IP or hostname
    // (e.g. http://192.168.x.x:3000 on mobile). localhost would then mean
    // "the phone itself", so reuse the page's hostname + env port.
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const pageHost = window.location.hostname;
      if (pageHost && pageHost !== 'localhost' && pageHost !== '127.0.0.1') {
        u.hostname = pageHost;
        return u.toString().replace(/\/$/, '');
      }
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return envUrl;
  }
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: Number(process.env.REACT_APP_API_TIMEOUT_MS || 5000),
});

export const getVehicles = async () => {
  return api.get<{ id: string; type: number }[]>('/api/vehicles/');
};

export const addVehicle = async (id: string, type: VehicleType = 1) => {
  return api.post('/api/vehicles', { id, type });
};

export const deleteVehicle = async (id: string) => {
  return api.delete(`/api/vehicles/${id}`);
};

export const getFuelRecords = async (id: string) => {
  return api.get<FuelRecord[]>(`api/fuelrecords/${id}`);
};

export const addFuelRecord = async (id: string, fuelRecord: FuelRecord) => {
  return api.post(`api/fuelrecords/${id}`, fuelRecord);
};

export const deleteFuelRecord = async (id: string, fuelRecord: FuelRecord) => {
  const { odm } = fuelRecord;
  return api.delete(`/api/fuelrecords/${id}`, { params: { odm } });
};

export const recordKey = (fuelRecord: FuelRecord): string | number =>
  fuelRecord.id ?? (fuelRecord as { Id?: string | number }).Id ?? fuelRecord.odm;

export const updateFuelRecord = async (vehicleId: string, fuelRecord: FuelRecord) => {
  return api.put(`/api/fuelrecords/${vehicleId}/${recordKey(fuelRecord)}`, fuelRecord);
};

export interface ChargeRecord {
  id?: number | string;
  date: string;
  odm: number;
  kwh: number;
  price: number;
  pricePerKwh?: number;
}

const chargeKey = (r: ChargeRecord): string | number => r.id ?? r.odm;

export const getChargeRecords = async (id: string) => {
  return api.get<ChargeRecord[]>(`api/chargerecords/${id}`);
};

export const addChargeRecord = async (id: string, rec: ChargeRecord) => {
  return api.post(`api/chargerecords/${id}`, rec);
};

export const updateChargeRecord = async (vehicleId: string, rec: ChargeRecord) => {
  return api.put(`/api/chargerecords/${vehicleId}/${chargeKey(rec)}`, rec);
};

export const deleteChargeRecord = async (id: string, rec: ChargeRecord) => {
  return api.delete(`/api/chargerecords/${id}`, { params: { odm: rec.odm } });
};

export interface TunnelRecord {
  id?: number | string;
  date: string;
  tunnel: number;
  bound: number;
  fee: number;
}

export const getTunnelRecords = async (id: string) => {
  return api.get<TunnelRecord[]>(`api/tunnelrecords/${id}`);
};

export const addTunnelRecord = async (id: string, rec: TunnelRecord) => {
  return api.post(`api/tunnelrecords/${id}`, rec);
};

export const updateTunnelRecord = async (vehicleId: string, rec: TunnelRecord) => {
  return api.put(`/api/tunnelrecords/${vehicleId}/${rec.id ?? 0}`, rec);
};

export const deleteTunnelRecord = async (vehicleId: string, rec: TunnelRecord) => {
  return api.delete(`/api/tunnelrecords/${vehicleId}/${rec.id ?? 0}`);
};
