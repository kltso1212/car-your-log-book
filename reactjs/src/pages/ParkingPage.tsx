import { useState, useEffect, useContext, useCallback } from 'react';
import { getParkingRecords, getImages, type ParkingRecord, type ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { ParkingRecordContext } from '../contexts/ParkingRecordContext';
import ParkingTable from '../components/ParkingTable';
import ParkingCards from '../components/ParkingCards';
import ParkingDialog from '../components/ParkingDialog';
import { useIsMobile } from '../hooks/useIsMobile';
import { compareParkingByDateDesc } from '../utils/parkingSort';

type DialogState = { mode: 'closed' } | { mode: 'insert' } | { mode: 'edit'; record: ParkingRecord };

const keyOf = (r: ParkingRecord) => String(r.id ?? 0);

export default function ParkingPage() {
  const { currentVehicle } = useContext(VehicleContext);
  const [parkingRecords, setParkingRecords] = useState<ParkingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
  const [images, setImages] = useState<Map<string, ImageInfo>>(new Map());
  const [imagesTick, setImagesTick] = useState(0);
  const refreshImages = useCallback(() => setImagesTick(t => t + 1), []);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!currentVehicle) {
      setParkingRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getParkingRecords(currentVehicle)
      .then(res => setParkingRecords([...(res.data || [])].sort(compareParkingByDateDesc)))
      .catch(err => {
        console.error('Error fetching data:', err);
        setParkingRecords([]);
      })
      .finally(() => setLoading(false));
  }, [currentVehicle]);

  useEffect(() => {
    if (!currentVehicle || parkingRecords.length === 0) {
      setImages(new Map());
      return;
    }
    getImages('parking_record', parkingRecords.map(r => keyOf(r)))
      .then(res => {
        const map = new Map<string, ImageInfo>();
        for (const img of res.data) {
          if (img.kind === 'receipt') map.set(String(img.entityId), img);
        }
        setImages(map);
      })
      .catch(() => setImages(new Map()));
  }, [currentVehicle, parkingRecords, imagesTick]);

  return (
    <ParkingRecordContext.Provider value={{ parkingRecords, setParkingRecords }}>
      <div>
        {!loading && (
          <button className="add-button" onClick={() => setDialog({ mode: 'insert' })}>➕ 新增泊車記錄</button>
        )}
        {loading ? (
          <h2>正在載入...</h2>
        ) : isMobile ? (
          <ParkingCards
            images={images}
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        ) : (
          <ParkingTable
            images={images}
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        )}
        {dialog.mode !== 'closed' && (
          <ParkingDialog
            {...(dialog.mode === 'edit' ? { initial: dialog.record } : {})}
            receiptImage={dialog.mode === 'edit' ? images.get(String(keyOf(dialog.record))) ?? null : null}
            onImageChanged={refreshImages}
            onClose={() => setDialog({ mode: 'closed' })}
          />
        )}
      </div>
    </ParkingRecordContext.Provider>
  );
}
