import { createContext } from 'react';
import type { FineRecord } from '../services/api';
import type { Dispatch, SetStateAction } from 'react';

export interface FineRecordContextValue {
  fineRecords: FineRecord[];
  setFineRecords: Dispatch<SetStateAction<FineRecord[]>>;
}

const defaultFineRecordContext: FineRecordContextValue = {
  fineRecords: [],
  setFineRecords: () => {},
};

export const FineRecordContext = createContext<FineRecordContextValue>(defaultFineRecordContext);
