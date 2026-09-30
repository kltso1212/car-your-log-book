import { createContext } from 'react';
import type { ParkingRecord } from '../services/api';
import type { Dispatch, SetStateAction } from 'react';

export interface ParkingRecordContextValue {
  parkingRecords: ParkingRecord[];
  setParkingRecords: Dispatch<SetStateAction<ParkingRecord[]>>;
}

const defaultParkingRecordContext: ParkingRecordContextValue = {
  parkingRecords: [],
  setParkingRecords: () => {},
};

export const ParkingRecordContext = createContext<ParkingRecordContextValue>(defaultParkingRecordContext);
