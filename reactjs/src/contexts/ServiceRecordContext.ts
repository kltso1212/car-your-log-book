import { createContext } from 'react';
import type { ServiceRecord } from '../services/api';
import type { Dispatch, SetStateAction } from 'react';

export interface ServiceRecordContextValue {
  serviceRecords: ServiceRecord[];
  setServiceRecords: Dispatch<SetStateAction<ServiceRecord[]>>;
}

const defaultServiceRecordContext: ServiceRecordContextValue = {
  serviceRecords: [],
  setServiceRecords: () => {},
};

export const ServiceRecordContext = createContext<ServiceRecordContextValue>(defaultServiceRecordContext);
