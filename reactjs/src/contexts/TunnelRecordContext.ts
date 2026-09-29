import { createContext } from 'react';
import type { TunnelRecord } from '../services/api';
import type { Dispatch, SetStateAction } from 'react';

export interface TunnelRecordContextValue {
  tunnelRecords: TunnelRecord[];
  setTunnelRecords: Dispatch<SetStateAction<TunnelRecord[]>>;
}

const defaultTunnelRecordContext: TunnelRecordContextValue = {
  tunnelRecords: [],
  setTunnelRecords: () => {},
};

export const TunnelRecordContext = createContext<TunnelRecordContextValue>(defaultTunnelRecordContext);
