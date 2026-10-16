import type { MouseEvent } from 'react';
import { useContext } from 'react';
import { deleteTunnelRecord, type TunnelRecord } from '../services/api';
import type { ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { TunnelRecordContext } from '../contexts/TunnelRecordContext';
import { TunnelBoundName, TunnelName } from '../types/Tunnel';
import ReceiptLink from './ReceiptLink';
import TableHeader from './TableHeader';

export default function TunnelTable({ images, onEdit }: {
  images: Map<string, ImageInfo>;
  onEdit: (record: TunnelRecord) => void;
}) {
  const { currentVehicle } = useContext(VehicleContext);
  const { tunnelRecords, setTunnelRecords } = useContext(TunnelRecordContext);

  const handleDelete = (event: MouseEvent<HTMLButtonElement>): void => {
    if (!window.confirm('確認刪除記錄?')) return;

    const index = Number(event.currentTarget.value);
    const record = tunnelRecords.at(index);
    if (!record) return;

    if (currentVehicle === '') return;
    deleteTunnelRecord(currentVehicle, record)
      .then(() => {
        setTunnelRecords(prev => prev.filter((_, i) => i !== index));
      })
      .catch(err => {
        alert(err.response?.data?.message ?? err);
      })
  };

  return (
    <div className="table-container">
      <table>
        <TableHeader columns={['日期', '隧道', '方向', '隧道費', '']} />
        <tbody>
          {tunnelRecords.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <h2>沒有記錄</h2>
              </td>
            </tr>
          ) : (
            tunnelRecords.map((record, i) => {
              const receipt = images.get(String(record.id ?? 0));
              return (
              <tr key={record.id ?? `${record.date}-${record.tunnel}-${i}`}>
                <td>{record.date}</td>
                <td>{TunnelName(record.tunnel)}</td>
                <td>{TunnelBoundName(record.tunnel, record.bound)}</td>
                <td>$ {Number(record.fee).toFixed(2)}</td>
                <td className="row-actions">
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
                    onClick={handleDelete} value={i}>
                    🗑️
                  </button>
                </td>
              </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
