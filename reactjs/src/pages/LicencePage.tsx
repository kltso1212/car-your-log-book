import { useState, useEffect, useContext, useMemo } from 'react';
import { getLicenceRecords, type LicenceRecord } from '../services/api';
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

export default function LicencePage() {
  const { vehicles, currentVehicle } = useContext(VehicleContext);
  const [licenceRecords, setLicenceRecords] = useState<LicenceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
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
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        ) : (
          <LicenceTable
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        )}
        {dialog.mode !== 'closed' && (
          <LicenceDialog
            {...(dialog.mode === 'edit' ? { initial: dialog.record } : {})}
            onClose={() => setDialog({ mode: 'closed' })}
          />
        )}
      </div>
    </LicenceRecordContext.Provider>
  );
}
