import { createContext } from 'react';
import type { VehicleContextValue } from '../types';

const defaultVehicleContext: VehicleContextValue = {
  vehicles: [],
  setVehicles: () => {},
  currentVehicle: '',
  setCurrentVehicle: () => {},
};

export const VehicleContext = createContext<VehicleContextValue>(defaultVehicleContext);
