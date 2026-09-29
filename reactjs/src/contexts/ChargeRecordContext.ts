import { createContext } from 'react';
import type { ChargeRecord } from '../services/api';
import type { Dispatch, SetStateAction } from 'react';

export interface ChargeRecordContextValue {
  chargeRecords: ChargeRecord[];
  setChargeRecords: Dispatch<SetStateAction<ChargeRecord[]>>;
}

const defaultChargeRecordContext: ChargeRecordContextValue = {
  chargeRecords: [],
  setChargeRecords: () => {},
};

export const ChargeRecordContext = createContext<ChargeRecordContextValue>(defaultChargeRecordContext);
