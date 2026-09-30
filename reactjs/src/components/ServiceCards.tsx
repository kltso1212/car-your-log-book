import type { MouseEvent } from 'react';
import { useContext } from 'react';
import { deleteServiceRecord, type ServiceRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { ServiceRecordContext } from '../contexts/ServiceRecordContext';
import { serviceItemName } from '../types/ServiceItems';
import { displayCustomList } from '../utils/customList';

// Mobile card list for service records (mirrors FuelRecordCards).
export default function ServiceCards({
  onEdit,
}: {
  onEdit: (record: ServiceRecord) => void;
}) {
  const { currentVehicle } = useContext(VehicleContext);
  const { serviceRecords, setServiceRecords } = useContext(ServiceRecordContext);

  const describe = (record: ServiceRecord): string => {
    const names = record.items.map(serviceItemName);
    const custom = displayCustomList(record.customItem);
    if (custom) names.push(custom);
    return names.join('、');
  };

  const handleDelete = (index: number) => (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    if (!window.confirm('確認刪除記錄?')) return;

    const record = serviceRecords.at(index);
    if (!record) return;

    deleteServiceRecord(currentVehicle, record)
      .then(() => {
        setServiceRecords(prev => prev.filter((_, i) => i !== index));
      })
      .catch(err => {
        alert(err.response?.data?.message ?? err);
      });
  };

  return (
    <div className="cards">
      {serviceRecords.length === 0 ? (
        <h2>沒有記錄</h2>
      ) : (
        serviceRecords.map((record, i) => (
          <div className="card" key={record.id ?? `${record.date}-${record.odm}`}>
            <div className="card-info">
              <div className="card-title">
                {record.date} · {Number(record.odm)} km · $ {Number(record.price).toFixed(2)}
              </div>
              <div>{describe(record)}</div>
            </div>
            <div className="card-side">
              <button
                className="icon-button"
                title="編輯"
                aria-label={`編輯 ${record.date} ${record.odm} km 記錄`}
                onClick={() => onEdit(record)}>
                ✏️
              </button>
              <button
                className="icon-button danger"
                title="刪除"
                aria-label={`刪除 ${record.date} ${record.odm} km 記錄`}
                onClick={handleDelete(i)}>
                🗑️
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
