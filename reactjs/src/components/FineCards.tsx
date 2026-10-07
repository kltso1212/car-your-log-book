import type { MouseEvent } from 'react';
import { useContext } from 'react';
import { deleteFineRecord, type FineRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { FineRecordContext } from '../contexts/FineRecordContext';
import { offenceName } from '../types/Offence';
import { displayCustomList } from '../utils/customList';

// Mobile card list for fines (mirrors FuelRecordCards).
export default function FineCards({
  onEdit,
}: {
  onEdit: (record: FineRecord) => void;
}) {
  const { currentVehicle } = useContext(VehicleContext);
  const { fineRecords, setFineRecords } = useContext(FineRecordContext);

  const describe = (record: FineRecord): string => {
    const names = record.offences.map(offenceName);
    const custom = displayCustomList(record.customOffence);
    if (custom) names.push(custom);
    return names.join('、');
  };

  const handleDelete = (index: number) => (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    if (!window.confirm('確認刪除記錄?')) return;

    const record = fineRecords.at(index);
    if (!record) return;

    if (currentVehicle === '') return;
    deleteFineRecord(currentVehicle, record)
      .then(() => {
        setFineRecords(prev => prev.filter((_, i) => i !== index));
      })
      .catch(err => {
        alert(err.response?.data?.message ?? err);
      });
  };

  return (
    <div className="cards">
      {fineRecords.length === 0 ? (
        <h2>沒有記錄</h2>
      ) : (
        fineRecords.map((record, i) => (
          <div className="card" key={record.id ?? `${record.date}-${i}`}>
            <div className="card-info">
              <div className="card-title">{record.date} · $ {Number(record.penalty).toFixed(2)}</div>
              <div>{describe(record)}</div>
              {!!record.location && <div>{record.location}</div>}
            </div>
            <div className="card-side">
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
