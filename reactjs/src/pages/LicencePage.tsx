import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { getLicenceRecords, getImages, type LicenceRecord, type ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { LicenceRecordContext } from '../contexts/LicenceRecordContext';
import LicenceTable from '../components/LicenceTable';
import LicenceCards from '../components/LicenceCards';
import LicenceDialog from '../components/LicenceDialog';
import CalendarButtons from '../components/CalendarButtons';
import { useIsMobile } from '../hooks/useIsMobile';
import { compareLicenceByDateDesc } from '../utils/licenceSort';
import { licenceExpiry, isExpiringSoon } from '../utils/expiry';
import { vehiclePlateOf } from '../types/Vehicle';

type DialogState = { mode: 'closed' } | { mode: 'insert' } | { mode: 'edit'; record: LicenceRecord };

const keyOf = (r: LicenceRecord) => String(r.id ?? 0);

export default function LicencePage() {
  const { vehicles, currentVehicle } = useContext(VehicleContext);
  const [licenceRecords, setLicenceRecords] = useState<LicenceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
  const [images, setImages] = useState<Map<string, ImageInfo>>(new Map());
  const [imagesTick, setImagesTick] = useState(0);
  const refreshImages = useCallback(() => setImagesTick(t => t + 1), []);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!currentVehicle) {
      setLicenceRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getLicenceRecords(currentVehicle)
      .then(res => setLicenceRecords([...(res.data || [])].sort(compareLicenceByDateDesc)))
      .catch(err => {
        console.error('Error fetching data:', err);
        setLicenceRecords([]);
      })
      .finally(() => setLoading(false));
  }, [currentVehicle]);

  useEffect(() => {
    if (!currentVehicle || licenceRecords.length === 0) {
      setImages(new Map());
      return;
    }
    getImages('licence_record', licenceRecords.map(r => keyOf(r)))
      .then(res => {
        const map = new Map<string, ImageInfo>();
        for (const img of res.data) {
          if (img.kind === 'receipt') map.set(String(img.entityId), img);
        }
        setImages(map);
      })
      .catch(() => setImages(new Map()));
  }, [currentVehicle, licenceRecords, imagesTick]);

  // Same expiry the 總覽 page shows (latest record + term − 1 day),
  // displayed here like the 平均油耗 line on the fuel page.
  const licenceDue = useMemo(() => licenceExpiry(licenceRecords), [licenceRecords]);

  return (
    <LicenceRecordContext.Provider value={{ licenceRecords, setLicenceRecords }}>
      <div>
        {!loading && licenceDue && (
          <p className={isExpiringSoon(licenceDue) ? 'expiry-alert' : undefined}>
            {isExpiringSoon(licenceDue) && '⚠️ '}牌費到期日：{licenceDue}{' '}
            <CalendarButtons
              title={`牌費到期：${vehiclePlateOf(vehicles, currentVehicle)}`}
              date={licenceDue}
              filename={`牌費到期-${vehiclePlateOf(vehicles, currentVehicle)}`}
              description={`車輛 ${vehiclePlateOf(vehicles, currentVehicle)} 牌費到期日 ${licenceDue}，請續牌。`}
            />
          </p>
        )}
        {!loading && (
          <button className="add-button" onClick={() => setDialog({ mode: 'insert' })}>➕ 新增牌費記錄</button>
        )}
        {loading ? (
          <h2>正在載入...</h2>
        ) : isMobile ? (
          <LicenceCards
            images={images}
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        ) : (
          <LicenceTable
            images={images}
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        )}
        {dialog.mode !== 'closed' && (
          <LicenceDialog
            {...(dialog.mode === 'edit' ? { initial: dialog.record } : {})}
            receiptImage={dialog.mode === 'edit' ? images.get(String(keyOf(dialog.record))) ?? null : null}
            onImageChanged={refreshImages}
            onClose={() => setDialog({ mode: 'closed' })}
          />
        )}
      </div>
    </LicenceRecordContext.Provider>
  );
}
