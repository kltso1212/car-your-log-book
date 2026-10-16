import { useState, useEffect, useContext, useCallback } from 'react';
import { getTunnelRecords, getImages, type TunnelRecord, type ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { TunnelRecordContext } from '../contexts/TunnelRecordContext';
import TunnelTable from '../components/TunnelTable';
import TunnelCards from '../components/TunnelCards';
import TunnelDialog from '../components/TunnelDialog';
import { useIsMobile } from '../hooks/useIsMobile';
import { compareTunnelByDateDesc } from '../utils/tunnelSort';

type DialogState = { mode: 'closed' } | { mode: 'insert' } | { mode: 'edit'; record: TunnelRecord };

const keyOf = (r: TunnelRecord) => String(r.id ?? 0);

export default function TunnelPage() {
  const { currentVehicle } = useContext(VehicleContext);
  const [tunnelRecords, setTunnelRecords] = useState<TunnelRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
  const [images, setImages] = useState<Map<string, ImageInfo>>(new Map());
  const [imagesTick, setImagesTick] = useState(0);
  const refreshImages = useCallback(() => setImagesTick(t => t + 1), []);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!currentVehicle) {
      setTunnelRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getTunnelRecords(currentVehicle)
      .then(res => setTunnelRecords([...(res.data || [])].sort(compareTunnelByDateDesc)))
      .catch(err => {
        console.error('Error fetching data:', err);
        setTunnelRecords([]);
      })
      .finally(() => setLoading(false));
  }, [currentVehicle]);

  useEffect(() => {
    if (!currentVehicle || tunnelRecords.length === 0) {
      setImages(new Map());
      return;
    }
    getImages('tunnel_record', tunnelRecords.map(r => keyOf(r)))
      .then(res => {
        const map = new Map<string, ImageInfo>();
        for (const img of res.data) {
          if (img.kind === 'receipt') map.set(String(img.entityId), img);
        }
        setImages(map);
      })
      .catch(() => setImages(new Map()));
  }, [currentVehicle, tunnelRecords, imagesTick]);

  return (
    <TunnelRecordContext.Provider value={{ tunnelRecords, setTunnelRecords }}>
      <div>
        {!loading && (
          <button className="add-button" onClick={() => setDialog({ mode: 'insert' })}>➕ 新增隧道記錄</button>
        )}
        {loading ? (
          <h2>正在載入...</h2>
        ) : isMobile ? (
          <TunnelCards
            images={images}
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        ) : (
          <TunnelTable
            images={images}
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        )}
        {dialog.mode !== 'closed' && (
          <TunnelDialog
            {...(dialog.mode === 'edit' ? { initial: dialog.record } : {})}
            receiptImage={dialog.mode === 'edit' ? images.get(String(keyOf(dialog.record))) ?? null : null}
            onImageChanged={refreshImages}
            onClose={() => setDialog({ mode: 'closed' })}
          />
        )}
      </div>
    </TunnelRecordContext.Provider>
  );
}
