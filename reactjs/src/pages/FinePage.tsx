import { useState, useEffect, useContext, useCallback } from 'react';
import { getFineRecords, getImages, type FineRecord, type ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { FineRecordContext } from '../contexts/FineRecordContext';
import FineTable from '../components/FineTable';
import FineCards from '../components/FineCards';
import FineDialog from '../components/FineDialog';
import { useIsMobile } from '../hooks/useIsMobile';
import { compareFineByDateDesc } from '../utils/fineSort';

type DialogState = { mode: 'closed' } | { mode: 'insert' } | { mode: 'edit'; record: FineRecord };

const keyOf = (r: FineRecord) => String(r.id ?? 0);

export default function FinePage() {
  const { currentVehicle } = useContext(VehicleContext);
  const [fineRecords, setFineRecords] = useState<FineRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
  const [images, setImages] = useState<Map<string, ImageInfo>>(new Map());
  const [imagesTick, setImagesTick] = useState(0);
  const refreshImages = useCallback(() => setImagesTick(t => t + 1), []);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!currentVehicle) {
      setFineRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getFineRecords(currentVehicle)
      .then(res => setFineRecords([...(res.data || [])].sort(compareFineByDateDesc)))
      .catch(err => {
        console.error('Error fetching data:', err);
        setFineRecords([]);
      })
      .finally(() => setLoading(false));
  }, [currentVehicle]);

  useEffect(() => {
    if (!currentVehicle || fineRecords.length === 0) {
      setImages(new Map());
      return;
    }
    getImages('fine_record', fineRecords.map(r => keyOf(r)))
      .then(res => {
        const map = new Map<string, ImageInfo>();
        for (const img of res.data) {
          if (img.kind === 'receipt') map.set(String(img.entityId), img);
        }
        setImages(map);
      })
      .catch(() => setImages(new Map()));
  }, [currentVehicle, fineRecords, imagesTick]);

  return (
    <FineRecordContext.Provider value={{ fineRecords, setFineRecords }}>
      <div>
        {!loading && (
          <button className="add-button" onClick={() => setDialog({ mode: 'insert' })}>➕ 新增罰款記錄</button>
        )}
        {loading ? (
          <h2>正在載入...</h2>
        ) : isMobile ? (
          <FineCards
            images={images}
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        ) : (
          <FineTable
            images={images}
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        )}
        {dialog.mode !== 'closed' && (
          <FineDialog
            {...(dialog.mode === 'edit' ? { initial: dialog.record } : {})}
            receiptImage={dialog.mode === 'edit' ? images.get(String(keyOf(dialog.record))) ?? null : null}
            onImageChanged={refreshImages}
            onClose={() => setDialog({ mode: 'closed' })}
          />
        )}
      </div>
    </FineRecordContext.Provider>
  );
}
