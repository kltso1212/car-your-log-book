import { useState, useEffect, useContext } from 'react';
import { getInsuranceRecords, type InsuranceRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { InsuranceRecordContext } from '../contexts/InsuranceRecordContext';
import InsuranceTable from '../components/InsuranceTable';
import InsuranceCards from '../components/InsuranceCards';
import InsuranceDialog from '../components/InsuranceDialog';
import { useIsMobile } from '../hooks/useIsMobile';
import { compareInsuranceByDateDesc } from '../utils/insuranceSort';

type DialogState = { mode: 'closed' } | { mode: 'insert' } | { mode: 'edit'; record: InsuranceRecord };

export default function InsurancePage() {
  const { currentVehicle } = useContext(VehicleContext);
  const [insuranceRecords, setInsuranceRecords] = useState<InsuranceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
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

  return (
    <InsuranceRecordContext.Provider value={{ insuranceRecords, setInsuranceRecords }}>
      <div>
        {!loading && (
          <button className="add-button" onClick={() => setDialog({ mode: 'insert' })}>➕ 新增保險記錄</button>
        )}
        {loading ? (
          <h2>正在載入...</h2>
        ) : isMobile ? (
          <InsuranceCards
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        ) : (
          <InsuranceTable
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        )}
        {dialog.mode !== 'closed' && (
          <InsuranceDialog
            {...(dialog.mode === 'edit' ? { initial: dialog.record } : {})}
            onClose={() => setDialog({ mode: 'closed' })}
          />
        )}
      </div>
    </InsuranceRecordContext.Provider>
  );
}
