import { useState, useEffect, useContext } from 'react';
import { getChargeRecords, type ChargeRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { ChargeRecordContext } from '../contexts/ChargeRecordContext';
import ChargeTable from '../components/ChargeTable';
import ChargeCards from '../components/ChargeCards';
import ChargeDialog from '../components/ChargeDialog';
import { useIsMobile } from '../hooks/useIsMobile';
import { compareChargeByDateDesc } from '../utils/chargeSort';

type DialogState = { mode: 'closed' } | { mode: 'insert' } | { mode: 'edit'; record: ChargeRecord };

export default function ChargePage() {
  const { currentVehicle } = useContext(VehicleContext);
  const [chargeRecords, setChargeRecords] = useState<ChargeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!currentVehicle) {
      setChargeRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getChargeRecords(currentVehicle)
      .then(res => setChargeRecords([...(res.data || [])].sort(compareChargeByDateDesc)))
      .catch(err => {
        console.error('Error fetching data:', err);
        setChargeRecords([]);
      })
      .finally(() => setLoading(false));
  }, [currentVehicle]);

  return (
    <ChargeRecordContext.Provider value={{ chargeRecords, setChargeRecords }}>
      <div>
        {loading ? (
          <h2>正在載入...</h2>
        ) : isMobile ? (
          <ChargeCards
            onAdd={() => setDialog({ mode: 'insert' })}
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        ) : (
          <ChargeTable onEdit={record => setDialog({ mode: 'edit', record })} />
        )}
        {dialog.mode !== 'closed' && (
          <ChargeDialog
            {...(dialog.mode === 'edit' ? { initial: dialog.record } : {})}
            onClose={() => setDialog({ mode: 'closed' })}
          />
        )}
      </div>
    </ChargeRecordContext.Provider>
  );
}
