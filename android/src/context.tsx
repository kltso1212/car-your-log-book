import React, { createContext, useContext } from 'react';
import type { Vehicle } from './data';

// Mounted above the tab navigator in App.tsx so the selected vehicle persists
// across all tabs. Type is int (1-4), set at creation, immutable.
export interface VehicleContextValue {
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  currentVehicle: string;
  setCurrentVehicle: React.Dispatch<React.SetStateAction<string>>;
}

export const VehicleContext = createContext<VehicleContextValue>({
  vehicles: [],
  setVehicles: () => {},
  currentVehicle: '',
  setCurrentVehicle: () => {},
});

export const useVehicles = () => useContext(VehicleContext);
