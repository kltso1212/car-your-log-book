import type { MouseEvent } from 'react';
import { useContext } from 'react';
import { deleteChargeRecord, type ChargeRecord } from '../services/api';
import type { ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { ChargeRecordContext } from '../contexts/ChargeRecordContext';
import ReceiptLink from './ReceiptLink';
import TableHeader from './TableHeader';

export default function ChargeTable({ images, onEdit }: {
  images: Map<string, ImageInfo>;
  onEdit: (record: ChargeRecord) => void;
}) {
  const { currentVehicle } = useContext(VehicleContext);
  const { chargeRecords, setChargeRecords } = useContext(ChargeRecordContext);

  const handleDelete = (event: MouseEvent<HTMLButtonElement>): void => {
    if (!window.confirm('確認刪除記錄?')) return;

    const index = Number(event.currentTarget.value);
    const record = chargeRecords.at(index);
    if (!record) return;

    if (currentVehicle === '') return;
    deleteChargeRecord(currentVehicle, record)
      .then(() => {
        setChargeRecords(prev => prev.filter((_, i) => i !== index));
      })
      .catch(err => {
        alert(err.response?.data?.message ?? err);
      })
  };

  return (
    <div className="table-container">
      <table>
        <TableHeader columns={['充電日期', '行車哩數', '充電量', '總價錢', '每度電價', '']} />
        <tbody>
          {chargeRecords.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <h2>沒有記錄</h2>
              </td>
            </tr>
          ) : (
            chargeRecords.map((record, i) => {
              const receipt = images.get(String(record.id ?? record.odm));
              return (
              <tr key={record.id ?? record.odm}>
                <td>{record.date}</td>
                <td>{Number(record.odm)} km</td>
                <td>{Number(record.kwh).toFixed(2)} kWh</td>
                <td>$ {Number(record.price).toFixed(2)}</td>
                <td>$ {Number(record.pricePerKwh ?? 0).toFixed(2)} / kWh</td>
                <td className="row-actions">
                  <ReceiptLink receipt={receipt} label={`${record.date} ${record.odm} km`} />
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
