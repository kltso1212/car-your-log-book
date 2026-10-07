import type { MouseEvent } from 'react';
import { useContext } from 'react';
import { deleteFineRecord, type FineRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { FineRecordContext } from '../contexts/FineRecordContext';
import { offenceName } from '../types/Offence';
import { displayCustomList } from '../utils/customList';
import TableHeader from './TableHeader';

const describe = (record: FineRecord): string => {
  const names = record.offences.map(offenceName);
  const custom = displayCustomList(record.customOffence);
  if (custom) names.push(custom);
  return names.join('、');
};

export default function FineTable({ onEdit }: { onEdit: (record: FineRecord) => void }) {
  const { currentVehicle } = useContext(VehicleContext);
  const { fineRecords, setFineRecords } = useContext(FineRecordContext);

  const handleDelete = (event: MouseEvent<HTMLButtonElement>): void => {
    if (!window.confirm('確認刪除記錄?')) return;

    const index = Number(event.currentTarget.value);
    const record = fineRecords.at(index);
    if (!record) return;

    if (currentVehicle === '') return;
    deleteFineRecord(currentVehicle, record)
      .then(() => {
        setFineRecords(prev => prev.filter((_, i) => i !== index));
      })
      .catch(err => {
        alert(err.response?.data?.message ?? err);
      })
  };

  return (
    <div className="table-container">
      <table>
        <TableHeader columns={['日期', '違例事項', '地點', '罰款', '']} />
        <tbody>
          {fineRecords.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <h2>沒有記錄</h2>
              </td>
            </tr>
          ) : (
            fineRecords.map((record, i) => (
              <tr key={record.id ?? `${record.date}-${i}`}>
                <td>{record.date}</td>
                <td>{describe(record)}</td>
                <td>{record.location ?? ''}</td>
                <td>$ {Number(record.penalty).toFixed(2)}</td>
                <td className="row-actions">
                  <button
                    className="icon-button"
                    title="編輯"
                    aria-label={`編輯 ${record.date}罰款記錄`}
                    onClick={() => onEdit(record)}>
                    ✏️
                  </button>
                  <button
                    className="icon-button danger"
                    title="刪除"
                    aria-label={`刪除 ${record.date}罰款記錄`}
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
