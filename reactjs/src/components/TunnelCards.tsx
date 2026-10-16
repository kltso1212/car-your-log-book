import type { MouseEvent } from 'react';
import { useContext } from 'react';
import { deleteTunnelRecord, type TunnelRecord } from '../services/api';
import type { ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { TunnelRecordContext } from '../contexts/TunnelRecordContext';
import { TunnelBoundName, TunnelName } from '../types/Tunnel';
import ReceiptLink from './ReceiptLink';

// Mobile card list for tunnel trips (mirrors FuelRecordCards).
export default function TunnelCards({
  images,
  onEdit,
}: {
  images: Map<string, ImageInfo>;
  onEdit: (record: TunnelRecord) => void;
}) {
  const { currentVehicle } = useContext(VehicleContext);
  const { tunnelRecords, setTunnelRecords } = useContext(TunnelRecordContext);

  const handleDelete = (index: number) => (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    if (!window.confirm('確認刪除記錄?')) return;

    const record = tunnelRecords.at(index);
    if (!record) return;

    if (currentVehicle === '') return;
    deleteTunnelRecord(currentVehicle, record)
      .then(() => {
        setTunnelRecords(prev => prev.filter((_, i) => i !== index));
      })
      .catch(err => {
        alert(err.response?.data?.message ?? err);
      });
  };

  return (
    <div className="cards">
      {tunnelRecords.length === 0 ? (
        <h2>沒有記錄</h2>
      ) : (
        tunnelRecords.map((record, i) => {
          const receipt = images.get(String(record.id ?? 0));
          return (
          <div className="card" key={record.id ?? `${record.date}-${record.tunnel}-${i}`}>
            <div className="card-info">
              <div className="card-title">{record.date} · {TunnelName(record.tunnel)}</div>
              <div>
                {TunnelBoundName(record.tunnel, record.bound)} · $ {Number(record.fee).toFixed(2)}
              </div>
            </div>
            <div className="card-side">
              <ReceiptLink receipt={receipt} label={`${record.date} ${TunnelName(record.tunnel)}`} />
              <button
                className="icon-button"
                title="編輯"
                aria-label={`編輯 ${record.date} ${TunnelName(record.tunnel)}記錄`}
                onClick={() => onEdit(record)}>
                ✏️
              </button>
              <button
                className="icon-button danger"
                title="刪除"
                aria-label={`刪除 ${record.date} ${TunnelName(record.tunnel)}記錄`}
                onClick={handleDelete(i)}>
                🗑️
              </button>
            </div>
          </div>
          );
        })
      )}
    </div>
  );
}
