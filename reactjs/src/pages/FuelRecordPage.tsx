import { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import { getFuelRecords, getImages, recordKey } from '../services/api';
import type { ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { FuelRecordContext } from '../contexts/FuelRecordContext';
import FuelRecordTable from '../components/FuelRecordTable';
import FuelRecordCards from '../components/FuelRecordCards';
import FuelRecordDialog from '../components/FuelRecordDialog';
import { useIsMobile } from '../hooks/useIsMobile';
import { compareFuelByDateAsc, compareFuelByDateDesc } from '../utils/fuelSort';
import type { FuelRecord } from '../types';

type DialogState = { mode: 'closed' } | { mode: 'insert' } | { mode: 'edit'; record: FuelRecord };

export default function FuelRecordPage() {
  const { currentVehicle } = useContext(VehicleContext);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
  const [images, setImages] = useState<Map<string, ImageInfo>>(new Map());
  const [imagesTick, setImagesTick] = useState(0);
  const refreshImages = useCallback(() => setImagesTick(t => t + 1), []);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!currentVehicle) {
      setFuelRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getFuelRecords(currentVehicle)
      .then(res => setFuelRecords([...(res.data || [])].sort(compareFuelByDateDesc)))
      .catch(err => {
        console.error('Error fetching data:', err);
        setFuelRecords([]);
      })
      .finally(() => setLoading(false));
  }, [currentVehicle]);

  useEffect(() => {
    if (!currentVehicle || fuelRecords.length === 0) {
      setImages(new Map());
      return;
    }
    getImages('fuel_record', fuelRecords.map(r => recordKey(r)))
      .then(res => {
        const map = new Map<string, ImageInfo>();
        for (const img of res.data) {
          if (img.kind === 'receipt') map.set(String(img.entityId), img);
        }
        setImages(map);
      })
      .catch(() => setImages(new Map()));
  }, [currentVehicle, fuelRecords, imagesTick]);

  const fuelConsumption = useMemo<number>(() => {
    if (fuelRecords.length <= 1) return 0;
    // Display is newest-first; consumption needs chronological order.
    const ascending = [...fuelRecords].sort(compareFuelByDateAsc);
    let consumption = 0;
    for (let i = 1; i < ascending.length; ++i) {
      const current = ascending[i];
      const previous = ascending[i - 1];
      if (!current || !previous) continue;
      if (current.odm === previous.odm) continue;
      consumption += current.price / (current.odm - previous.odm);
    }
    consumption /= ascending.length - 1;
    return consumption;
  }, [fuelRecords]);

  return (
    <FuelRecordContext.Provider value={{ fuelRecords, setFuelRecords }}>
      <div>
        {!loading && fuelConsumption !== 0 && <p>平均油耗：$ {Number(fuelConsumption).toFixed(2)} / km</p>}
        {!loading && (
          <button className="add-button" onClick={() => setDialog({ mode: 'insert' })}>➕ 新增入油記錄</button>
        )}
        {loading ? (
          <h2>正在載入...</h2>
        ) : isMobile ? (
          <FuelRecordCards
            images={images}
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        ) : (
          <FuelRecordTable
            images={images}
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        )}
        {dialog.mode !== 'closed' && (
          <FuelRecordDialog
            {...(dialog.mode === 'edit' ? { initial: dialog.record } : {})}
            receiptImage={dialog.mode === 'edit' ? images.get(String(recordKey(dialog.record))) ?? null : null}
            onImageChanged={refreshImages}
            onClose={() => setDialog({ mode: 'closed' })}
          />
        )}
      </div>
    </FuelRecordContext.Provider>
  );
}
