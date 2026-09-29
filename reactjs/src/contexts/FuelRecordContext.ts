import { createContext } from 'react';
import type { FuelRecordContextValue } from '../types';

const defaultFuelRecordContext: FuelRecordContextValue = {
  fuelRecords: [],
  setFuelRecords: () => {},
};

export const FuelRecordContext = createContext<FuelRecordContextValue>(defaultFuelRecordContext);
