import { useState, useEffect, useContext } from 'react';
import { getTunnelRecords, type TunnelRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { TunnelRecordContext } from '../contexts/TunnelRecordContext';
import TunnelTable from '../components/TunnelTable';
import TunnelCards from '../components/TunnelCards';
import TunnelDialog from '../components/TunnelDialog';
import { useIsMobile } from '../hooks/useIsMobile';
import { compareTunnelByDateDesc } from '../utils/tunnelSort';

type DialogState = { mode: 'closed' } | { mode: 'insert' } | { mode: 'edit'; record: TunnelRecord };

export default function TunnelPage() {
  const { currentVehicle } = useContext(VehicleContext);
  const [tunnelRecords, setTunnelRecords] = useState<TunnelRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
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
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        ) : (
          <TunnelTable
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        )}
        {dialog.mode !== 'closed' && (
          <TunnelDialog
            {...(dialog.mode === 'edit' ? { initial: dialog.record } : {})}
            onClose={() => setDialog({ mode: 'closed' })}
          />
        )}
      </div>
    </TunnelRecordContext.Provider>
  );
}
