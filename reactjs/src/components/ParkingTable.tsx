import type { MouseEvent } from 'react';
import { useContext } from 'react';
import { deleteParkingRecord, type ParkingRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { ParkingRecordContext } from '../contexts/ParkingRecordContext';
import { RentalTypeName } from '../types/Parking';
import TableHeader from './TableHeader';

export default function ParkingTable({ onEdit }: { onEdit: (record: ParkingRecord) => void }) {
  const { currentVehicle } = useContext(VehicleContext);
  const { parkingRecords, setParkingRecords } = useContext(ParkingRecordContext);

  const handleDelete = (event: MouseEvent<HTMLButtonElement>): void => {
    if (!window.confirm('確認刪除記錄?')) return;

    const index = Number(event.currentTarget.value);
    const record = parkingRecords.at(index);
    if (!record) return;

    if (currentVehicle === '') return;
    deleteParkingRecord(currentVehicle, record)
      .then(() => {
        setParkingRecords(prev => prev.filter((_, i) => i !== index));
      })
      .catch(err => {
        alert(err.response?.data?.message ?? err);
      })
  };

  return (
    <div className="table-container">
      <table>
        <TableHeader columns={['日期', '停車場', '收費模式', '費用', '']} />
        <tbody>
          {parkingRecords.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <h2>沒有記錄</h2>
              </td>
            </tr>
          ) : (
            parkingRecords.map((record, i) => (
              <tr key={record.id ?? `${record.date}-${record.carpark}-${i}`}>
                <td>{record.date}</td>
                <td>{record.carpark}</td>
                <td>{RentalTypeName(record.rentalType)}</td>
                <td>$ {Number(record.fee).toFixed(2)}</td>
                <td className="row-actions">
                  <button
                    className="icon-button"
                    title="編輯"
                    aria-label={`編輯 ${record.date} ${record.carpark}記錄`}
                    onClick={() => onEdit(record)}>
                    ✏️
                  </button>
                  <button
                    className="icon-button danger"
                    title="刪除"
                    aria-label={`刪除 ${record.date} ${record.carpark}記錄`}
                    onClick={handleDelete} value={i}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
