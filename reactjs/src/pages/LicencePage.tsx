import { useState, useEffect, useContext } from 'react';
import { getLicenceRecords, type LicenceRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { LicenceRecordContext } from '../contexts/LicenceRecordContext';
import LicenceTable from '../components/LicenceTable';
import LicenceCards from '../components/LicenceCards';
import LicenceDialog from '../components/LicenceDialog';
import { useIsMobile } from '../hooks/useIsMobile';
import { compareLicenceByDateDesc } from '../utils/licenceSort';

type DialogState = { mode: 'closed' } | { mode: 'insert' } | { mode: 'edit'; record: LicenceRecord };

export default function LicencePage() {
  const { currentVehicle } = useContext(VehicleContext);
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

  return (
    <LicenceRecordContext.Provider value={{ licenceRecords, setLicenceRecords }}>
      <div>
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
