import { useState, useEffect, useContext, useCallback } from 'react';
import { getServiceRecords, getImages, type ServiceRecord, type ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { ServiceRecordContext } from '../contexts/ServiceRecordContext';
import ServiceTable from '../components/ServiceTable';
import ServiceCards from '../components/ServiceCards';
import ServiceDialog from '../components/ServiceDialog';
import { useIsMobile } from '../hooks/useIsMobile';
import { compareServiceByOdmDesc } from '../utils/serviceSort';

type DialogState = { mode: 'closed' } | { mode: 'insert' } | { mode: 'edit'; record: ServiceRecord };

const keyOf = (r: ServiceRecord) => String(r.id ?? r.odm);

export default function ServicePage() {
  const { currentVehicle } = useContext(VehicleContext);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
  const [images, setImages] = useState<Map<string, ImageInfo>>(new Map());
  const [imagesTick, setImagesTick] = useState(0);
  const refreshImages = useCallback(() => setImagesTick(t => t + 1), []);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!currentVehicle) {
      setServiceRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getServiceRecords(currentVehicle)
      .then(res => setServiceRecords([...(res.data || [])].sort(compareServiceByOdmDesc)))
      .catch(err => {
        console.error('Error fetching data:', err);
        setServiceRecords([]);
      })
      .finally(() => setLoading(false));
  }, [currentVehicle]);

  useEffect(() => {
    if (!currentVehicle || serviceRecords.length === 0) {
      setImages(new Map());
      return;
    }
    getImages('service_record', serviceRecords.map(r => keyOf(r)))
      .then(res => {
        const map = new Map<string, ImageInfo>();
        for (const img of res.data) {
          if (img.kind === 'receipt') map.set(String(img.entityId), img);
        }
        setImages(map);
      })
      .catch(() => setImages(new Map()));
  }, [currentVehicle, serviceRecords, imagesTick]);

  return (
    <ServiceRecordContext.Provider value={{ serviceRecords, setServiceRecords }}>
      <div>
        {!loading && (
          <button className="add-button" onClick={() => setDialog({ mode: 'insert' })}>➕ 新增保養記錄</button>
        )}
        {loading ? (
          <h2>正在載入...</h2>
        ) : isMobile ? (
          <ServiceCards
            images={images}
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        ) : (
          <ServiceTable
            images={images}
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        )}
        {dialog.mode !== 'closed' && (
          <ServiceDialog
            {...(dialog.mode === 'edit' ? { initial: dialog.record } : {})}
            receiptImage={dialog.mode === 'edit' ? images.get(String(keyOf(dialog.record))) ?? null : null}
            onImageChanged={refreshImages}
            onClose={() => setDialog({ mode: 'closed' })}
          />
        )}
      </div>
    </ServiceRecordContext.Provider>
  );
}
