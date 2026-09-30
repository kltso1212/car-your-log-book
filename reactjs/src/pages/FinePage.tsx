import { useState, useEffect, useContext } from 'react';
import { getFineRecords, type FineRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { FineRecordContext } from '../contexts/FineRecordContext';
import FineTable from '../components/FineTable';
import FineCards from '../components/FineCards';
import FineDialog from '../components/FineDialog';
import { useIsMobile } from '../hooks/useIsMobile';
import { compareFineByDateDesc } from '../utils/fineSort';

type DialogState = { mode: 'closed' } | { mode: 'insert' } | { mode: 'edit'; record: FineRecord };

export default function FinePage() {
  const { currentVehicle } = useContext(VehicleContext);
  const [fineRecords, setFineRecords] = useState<FineRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
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
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        ) : (
          <FineTable
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        )}
        {dialog.mode !== 'closed' && (
          <FineDialog
            {...(dialog.mode === 'edit' ? { initial: dialog.record } : {})}
            onClose={() => setDialog({ mode: 'closed' })}
          />
        )}
      </div>
    </FineRecordContext.Provider>
  );
}
