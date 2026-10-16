import axios from 'axios';
import type { FuelRecord } from '../types';
import type { NewVehicleInput, Vehicle } from '../types/Vehicle';

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
  return api.get<Vehicle[]>('/api/vehicles');
};

export const addVehicle = async (input: NewVehicleInput) => {
  return api.post<{ message: string; id: number }>('/api/vehicles', input);
};

export const updateVehicle = async (id: number, input: NewVehicleInput) => {
  return api.put(`/api/vehicles/${id}`, input);
};

export const deleteVehicle = async (id: number) => {
  return api.delete(`/api/vehicles/${id}`);
};

export const getFuelRecords = async (id: number) => {
  return api.get<FuelRecord[]>(`api/fuelrecords/${id}`);
};

export const addFuelRecord = async (id: number, fuelRecord: FuelRecord) => {
  return api.post(`api/fuelrecords/${id}`, fuelRecord);
};

export const deleteFuelRecord = async (id: number, fuelRecord: FuelRecord) => {
  const { odm } = fuelRecord;
  return api.delete(`/api/fuelrecords/${id}`, { params: { odm } });
};

export const recordKey = (fuelRecord: FuelRecord): string | number =>
  fuelRecord.id ?? (fuelRecord as { Id?: string | number }).Id ?? fuelRecord.odm;

export const updateFuelRecord = async (vehicleId: number, fuelRecord: FuelRecord) => {
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

export const getChargeRecords = async (id: number) => {
  return api.get<ChargeRecord[]>(`api/chargerecords/${id}`);
};

export const addChargeRecord = async (id: number, rec: ChargeRecord) => {
  return api.post(`api/chargerecords/${id}`, rec);
};

export const updateChargeRecord = async (vehicleId: number, rec: ChargeRecord) => {
  return api.put(`/api/chargerecords/${vehicleId}/${chargeKey(rec)}`, rec);
};

export const deleteChargeRecord = async (id: number, rec: ChargeRecord) => {
  return api.delete(`/api/chargerecords/${id}`, { params: { odm: rec.odm } });
};

export interface TunnelRecord {
  id?: number | string;
  date: string;
  tunnel: number;
  bound: number;
  fee: number;
}

export const getTunnelRecords = async (id: number) => {
  return api.get<TunnelRecord[]>(`api/tunnelrecords/${id}`);
};

export const addTunnelRecord = async (id: number, rec: TunnelRecord) => {
  return api.post(`api/tunnelrecords/${id}`, rec);
};

export const updateTunnelRecord = async (vehicleId: number, rec: TunnelRecord) => {
  return api.put(`/api/tunnelrecords/${vehicleId}/${rec.id ?? 0}`, rec);
};

export const deleteTunnelRecord = async (vehicleId: number, rec: TunnelRecord) => {
  return api.delete(`/api/tunnelrecords/${vehicleId}/${rec.id ?? 0}`);
};

export interface ParkingRecord {
  id?: number | string;
  date: string;
  carpark: string;
  rentalType: number;
  fee: number;
}

export const getParkingRecords = async (id: number) => {
  return api.get<ParkingRecord[]>(`api/parkingrecords/${id}`);
};

export const addParkingRecord = async (id: number, rec: ParkingRecord) => {
  return api.post(`api/parkingrecords/${id}`, rec);
};

export const updateParkingRecord = async (vehicleId: number, rec: ParkingRecord) => {
  return api.put(`/api/parkingrecords/${vehicleId}/${rec.id ?? 0}`, rec);
};

export const deleteParkingRecord = async (vehicleId: number, rec: ParkingRecord) => {
  return api.delete(`/api/parkingrecords/${vehicleId}/${rec.id ?? 0}`);
};

export interface FineRecord {
  id?: number | string;
  date: string;
  offences: number[];
  customOffence?: string | null;
  location?: string | null;
  penalty: number;
}

export const getFineRecords = async (id: number) => {
  return api.get<FineRecord[]>(`api/finerecords/${id}`);
};

export const addFineRecord = async (id: number, rec: Omit<FineRecord, 'id'>) => {
  return api.post(`api/finerecords/${id}`, rec);
};

export const updateFineRecord = async (vehicleId: number, rec: FineRecord) => {
  return api.put(`/api/finerecords/${vehicleId}/${rec.id ?? 0}`, rec);
};

export const deleteFineRecord = async (vehicleId: number, rec: FineRecord) => {
  return api.delete(`/api/finerecords/${vehicleId}/${rec.id ?? 0}`);
};

export interface ServiceRecord {
  id?: number | string;
  date: string;
  odm: number;
  items: number[];
  customItem?: string | null;
  price: number;
}

export const getServiceRecords = async (id: number) => {
  return api.get<ServiceRecord[]>(`api/servicerecords/${id}`);
};

export const addServiceRecord = async (id: number, rec: Omit<ServiceRecord, 'id'>) => {
  return api.post(`api/servicerecords/${id}`, rec);
};

export const updateServiceRecord = async (vehicleId: number, rec: ServiceRecord) => {
  return api.put(`/api/servicerecords/${vehicleId}/${rec.id ?? 0}`, rec);
};

export const deleteServiceRecord = async (id: number, rec: ServiceRecord) => {
  return api.delete(`/api/servicerecords/${id}`, { params: { odm: rec.odm } });
};

export interface InsuranceRecord {
  id?: number | string;
  date: string;
  type: number;
  broker?: string | null;
  fee: number;
}

export interface LicenceRecord {
  id?: number | string;
  date: string;
  type: number;
  fee: number;
}

export const getInsuranceRecords = async (id: number) => {
  return api.get<InsuranceRecord[]>(`api/insurancerecords/${id}`);
};

export const addInsuranceRecord = async (id: number, rec: Omit<InsuranceRecord, 'id'>) => {
  return api.post(`api/insurancerecords/${id}`, rec);
};

export const updateInsuranceRecord = async (vehicleId: number, rec: InsuranceRecord) => {
  return api.put(`/api/insurancerecords/${vehicleId}/${rec.id ?? 0}`, rec);
};

export const deleteInsuranceRecord = async (vehicleId: number, rec: InsuranceRecord) => {
  return api.delete(`/api/insurancerecords/${vehicleId}/${rec.id ?? 0}`);
};

export const getLicenceRecords = async (id: number) => {
  return api.get<LicenceRecord[]>(`api/licencerecords/${id}`);
};

export const addLicenceRecord = async (id: number, rec: Omit<LicenceRecord, 'id'>) => {
  return api.post(`api/licencerecords/${id}`, rec);
};

export const updateLicenceRecord = async (vehicleId: number, rec: LicenceRecord) => {
  return api.put(`/api/licencerecords/${vehicleId}/${rec.id ?? 0}`, rec);
};

export const deleteLicenceRecord = async (vehicleId: number, rec: LicenceRecord) => {
  return api.delete(`/api/licencerecords/${vehicleId}/${rec.id ?? 0}`);
};

export interface ImageInfo {
  id: number;
  entityType: string;
  entityId: number;
  kind: string;
  mime: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  url: string;
  createdAt: string;
}

export const imageFileUrl = (id: number | string): string =>
  `${api.defaults.baseURL}/api/images/${id}/file`;

export const getImages = async (entityType: string, entityIds: (number | string)[]) => {
  return api.get<ImageInfo[]>('/api/images', {
    params: { entityType, entityId: entityIds.join(',') },
  });
};

export type ImageKind = 'avatar' | 'receipt';

export const uploadImage = async (
  file: { blob: Blob; width: number; height: number },
  opts: {
    entityType: string;
    entityId: number;
    kind: ImageKind;
    source?: { blob: Blob; width: number; height: number };
  },
) => {
  const form = new FormData();
  const nameOf = (blob: Blob) => `image.${blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'}`;
  form.append('file', file.blob, nameOf(file.blob));
  form.append('width', String(file.width));
  form.append('height', String(file.height));
  if (opts.source) {
    form.append('source', opts.source.blob, nameOf(opts.source.blob));
    form.append('sourceWidth', String(opts.source.width));
    form.append('sourceHeight', String(opts.source.height));
  }
  return api.post<{ message: string; image: ImageInfo; source: ImageInfo | null }>(
    `/api/images?entityType=${opts.entityType}&entityId=${opts.entityId}&kind=${opts.kind}`,
    form,
    { timeout: 30000 },
  );
};

export const deleteImage = async (id: number | string) => {
  return api.delete(`/api/images/${id}`);
};
