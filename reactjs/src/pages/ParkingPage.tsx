import { useState, useEffect, useContext } from 'react';
import { getParkingRecords, type ParkingRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { ParkingRecordContext } from '../contexts/ParkingRecordContext';
import ParkingTable from '../components/ParkingTable';
import ParkingCards from '../components/ParkingCards';
import ParkingDialog from '../components/ParkingDialog';
import { useIsMobile } from '../hooks/useIsMobile';
import { compareParkingByDateDesc } from '../utils/parkingSort';

type DialogState = { mode: 'closed' } | { mode: 'insert' } | { mode: 'edit'; record: ParkingRecord };

export default function ParkingPage() {
  const { currentVehicle } = useContext(VehicleContext);
  const [parkingRecords, setParkingRecords] = useState<ParkingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
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
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        ) : (
          <ParkingTable
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        )}
        {dialog.mode !== 'closed' && (
          <ParkingDialog
            {...(dialog.mode === 'edit' ? { initial: dialog.record } : {})}
            onClose={() => setDialog({ mode: 'closed' })}
          />
        )}
      </div>
    </ParkingRecordContext.Provider>
  );
}
