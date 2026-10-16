import { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import { getChargeRecords, getImages, type ChargeRecord, type ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { ChargeRecordContext } from '../contexts/ChargeRecordContext';
import ChargeTable from '../components/ChargeTable';
import ChargeCards from '../components/ChargeCards';
import ChargeDialog from '../components/ChargeDialog';
import { useIsMobile } from '../hooks/useIsMobile';
import { compareChargeByDateDesc } from '../utils/chargeSort';
import { averagePowerConsumption } from '../utils/fuelStats';

type DialogState = { mode: 'closed' } | { mode: 'insert' } | { mode: 'edit'; record: ChargeRecord };

const keyOf = (r: ChargeRecord) => String(r.id ?? r.odm);

export default function ChargePage() {
  const { currentVehicle } = useContext(VehicleContext);
  const [chargeRecords, setChargeRecords] = useState<ChargeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
  const [images, setImages] = useState<Map<string, ImageInfo>>(new Map());
  const [imagesTick, setImagesTick] = useState(0);
  const refreshImages = useCallback(() => setImagesTick(t => t + 1), []);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!currentVehicle) {
      setChargeRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getChargeRecords(currentVehicle)
      .then(res => setChargeRecords([...(res.data || [])].sort(compareChargeByDateDesc)))
      .catch(err => {
        console.error('Error fetching data:', err);
        setChargeRecords([]);
      })
      .finally(() => setLoading(false));
  }, [currentVehicle]);

  useEffect(() => {
    if (!currentVehicle || chargeRecords.length === 0) {
      setImages(new Map());
      return;
    }
    getImages('charge_record', chargeRecords.map(r => keyOf(r)))
      .then(res => {
        const map = new Map<string, ImageInfo>();
        for (const img of res.data) {
          if (img.kind === 'receipt') map.set(String(img.entityId), img);
        }
        setImages(map);
      })
      .catch(() => setImages(new Map()));
  }, [currentVehicle, chargeRecords, imagesTick]);

  const powerConsumption = useMemo<number>(
    () => averagePowerConsumption(chargeRecords),
    [chargeRecords],
  );

  return (
    <ChargeRecordContext.Provider value={{ chargeRecords, setChargeRecords }}>
      <div>
        {!loading && powerConsumption !== 0 && <p>平均電耗：$ {Number(powerConsumption).toFixed(2)} / km</p>}
        {!loading && (
          <button className="add-button" onClick={() => setDialog({ mode: 'insert' })}>➕ 新增充電記錄</button>
        )}
        {loading ? (
          <h2>正在載入...</h2>
        ) : isMobile ? (
          <ChargeCards
            images={images}
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        ) : (
          <ChargeTable
            images={images}
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        )}
        {dialog.mode !== 'closed' && (
          <ChargeDialog
            {...(dialog.mode === 'edit' ? { initial: dialog.record } : {})}
            receiptImage={dialog.mode === 'edit' ? images.get(String(keyOf(dialog.record))) ?? null : null}
            onImageChanged={refreshImages}
            onClose={() => setDialog({ mode: 'closed' })}
          />
        )}
      </div>
    </ChargeRecordContext.Provider>
  );
}
