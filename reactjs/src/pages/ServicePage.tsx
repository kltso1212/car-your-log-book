import { useState, useEffect, useContext } from 'react';
import { getServiceRecords, type ServiceRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { ServiceRecordContext } from '../contexts/ServiceRecordContext';
import ServiceTable from '../components/ServiceTable';
import ServiceCards from '../components/ServiceCards';
import ServiceDialog from '../components/ServiceDialog';
import { useIsMobile } from '../hooks/useIsMobile';
import { compareServiceByOdmDesc } from '../utils/serviceSort';

type DialogState = { mode: 'closed' } | { mode: 'insert' } | { mode: 'edit'; record: ServiceRecord };

export default function ServicePage() {
  const { currentVehicle } = useContext(VehicleContext);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!currentVehicle) {
      setServiceRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getServiceRecords(currentVehicle)
      .then(res => setServiceRecords([...(res.data || [])].sort(compareServiceByOdmDesc)))
      .catch(err => {
        console.error('Error fetching data:', err);
        setServiceRecords([]);
      })
      .finally(() => setLoading(false));
  }, [currentVehicle]);

  return (
    <ServiceRecordContext.Provider value={{ serviceRecords, setServiceRecords }}>
      <div>
        {!loading && (
          <button className="add-button" onClick={() => setDialog({ mode: 'insert' })}>➕ 新增保養記錄</button>
        )}
        {loading ? (
          <h2>正在載入...</h2>
        ) : isMobile ? (
          <ServiceCards
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        ) : (
          <ServiceTable
            onEdit={record => setDialog({ mode: 'edit', record })}
          />
        )}
        {dialog.mode !== 'closed' && (
          <ServiceDialog
            {...(dialog.mode === 'edit' ? { initial: dialog.record } : {})}
            onClose={() => setDialog({ mode: 'closed' })}
          />
        )}
      </div>
    </ServiceRecordContext.Provider>
  );
}
