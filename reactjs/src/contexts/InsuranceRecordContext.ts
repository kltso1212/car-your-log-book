import { createContext } from 'react';
import type { InsuranceRecord } from '../services/api';
import type { Dispatch, SetStateAction } from 'react';

export interface InsuranceRecordContextValue {
  insuranceRecords: InsuranceRecord[];
  setInsuranceRecords: Dispatch<SetStateAction<InsuranceRecord[]>>;
}

const defaultInsuranceRecordContext: InsuranceRecordContextValue = {
  insuranceRecords: [],
  setInsuranceRecords: () => {},
};

export const InsuranceRecordContext = createContext<InsuranceRecordContextValue>(defaultInsuranceRecordContext);
