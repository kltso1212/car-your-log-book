import { createContext } from 'react';
import type { LicenceRecord } from '../services/api';
import type { Dispatch, SetStateAction } from 'react';

export interface LicenceRecordContextValue {
  licenceRecords: LicenceRecord[];
  setLicenceRecords: Dispatch<SetStateAction<LicenceRecord[]>>;
}

const defaultLicenceRecordContext: LicenceRecordContextValue = {
  licenceRecords: [],
  setLicenceRecords: () => {},
};

export const LicenceRecordContext = createContext<LicenceRecordContextValue>(defaultLicenceRecordContext);
