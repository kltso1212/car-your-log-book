import type { ServiceRecord } from '../services/api';

// Newest-first by odm (service rows always carry mileage, like fuel).
export function compareServiceByOdmDesc(a: ServiceRecord, b: ServiceRecord): number {
  return b.odm - a.odm;
}
