import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { getInsuranceRecords, getImages, type InsuranceRecord, type ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { InsuranceRecordContext } from '../contexts/InsuranceRecordContext';
import InsuranceTable from '../components/InsuranceTable';
import InsuranceCards from '../components/InsuranceCards';
import InsuranceDialog from '../components/InsuranceDialog';
import CalendarButtons from '../components/CalendarButtons';
import { useIsMobile } from '../hooks/useIsMobile';
import { compareInsuranceByDateDesc } from '../utils/insuranceSort';
import { insuranceExpiry, isExpiringSoon } from '../utils/expiry';
import { vehiclePlateOf } from '../types/Vehicle';

type DialogState = { mode: 'closed' } | { mode: 'insert' } | { mode: 'edit'; record: InsuranceRecord };

const keyOf = (r: InsuranceRecord) => String(r.id ?? 0);

export default function InsurancePage() {
  const { vehicles, currentVehicle } = useContext(VehicleContext);
  const [insuranceRecords, setInsuranceRecords] = useState<InsuranceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
  const [images, setImages] = useState<Map<string, ImageInfo>>(new Map());
  const [imagesTick, setImagesTick] = useState(0);
  const refreshImages = useCallback(() => setImagesTick(t => t + 1), []);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!currentVehicle) {
      setInsuranceRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getInsuranceRecords(currentVehicle)
      .then(res => setInsuranceRecords([...(res.data || [])].sort(compareInsuranceByDateDesc)))
      .catch(err => {
        console.error('Error fetching data:', err);
        setInsuranceRecords([]);
      })
      .finally(() => setLoading(false));
  }, [currentVehicle]);

  useEffect(() => {
    if (!currentVehicle || insuranceRecords.length === 0) {
      setImages(new Map());
      return;
    }
    getImages('insurance_record', insuranceRecords.map(r => keyOf(r)))
      .then(res => {
        const map = new Map<string, ImageInfo>();
        for (const img of res.data) {
          if (img.kind === 'receipt') map.set(String(img.entityId), img);
        }
        setImages(map);
      })
      .catch(() => setImages(new Map()));
  }, [currentVehicle, insuranceRecords, imagesTick]);

  // Same expiry the 總覽 page shows (latest record + 1 year − 1 day),
  // displayed here like the 平均油耗 line on the fuel page.
  const insuranceDue = useMemo(() => insuranceExpiry(insuranceRecords), [insuranceRecords]);

  return (
    <InsuranceRecordContext.Provider value={{ insuranceRecords, setInsuranceRecords }}>
      <div>
        {!loading && insuranceDue && (
          <p className={isExpiringSoon(insuranceDue) ? 'expiry-alert' : undefined}>
            {isExpiringSoon(insuranceDue) && '⚠️ '}保險到期日：{insuranceDue}{' '}
            <CalendarButtons
              title={`保險到期：${vehiclePlateOf(vehicles, currentVehicle)}`}
              date={insuranceDue}
              filename={`保險到期-${vehiclePlateOf(vehicles, currentVehicle)}`}
              description={`車輛 ${vehiclePlateOf(vehicles, currentVehicle)} 保險到期日 ${insuranceDue}，請續保。`}
            />
          </p>
        )}
        {!loading && (
          <button className="add-button" onClick={() => setDialog({ mode: 'insert' })}>➕ 新增保險記錄</button>
        )}
        {loading ? (
          <h2>正在載入...</h2>
        ) : isMobile ? (
          <InsuranceCards
            images={images}
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        ) : (
          <InsuranceTable
            images={images}
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        )}
        {dialog.mode !== 'closed' && (
          <InsuranceDialog
            {...(dialog.mode === 'edit' ? { initial: dialog.record } : {})}
            receiptImage={dialog.mode === 'edit' ? images.get(String(keyOf(dialog.record))) ?? null : null}
            onImageChanged={refreshImages}
            onClose={() => setDialog({ mode: 'closed' })}
          />
        )}
      </div>
    </InsuranceRecordContext.Provider>
  );
}
