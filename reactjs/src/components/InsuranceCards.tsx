import type { MouseEvent } from 'react';
import { useContext } from 'react';
import { deleteInsuranceRecord, type InsuranceRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { InsuranceRecordContext } from '../contexts/InsuranceRecordContext';
import { InsuranceTypeName } from '../types/DatedTypes';

// Mobile card list for insurance (mirrors FuelRecordCards).
export default function InsuranceCards({
  onEdit,
}: {
  onEdit: (record: InsuranceRecord) => void;
}) {
  const { currentVehicle } = useContext(VehicleContext);
  const { insuranceRecords, setInsuranceRecords } = useContext(InsuranceRecordContext);

  const handleDelete = (index: number) => (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    if (!window.confirm('確認刪除記錄?')) return;

    const record = insuranceRecords.at(index);
    if (!record) return;

    deleteInsuranceRecord(currentVehicle, record)
      .then(() => {
        setInsuranceRecords(prev => prev.filter((_, i) => i !== index));
      })
      .catch(err => {
        alert(err.response?.data?.message ?? err);
      });
  };

  return (
    <div className="cards">
      {insuranceRecords.length === 0 ? (
        <h2>沒有記錄</h2>
      ) : (
        insuranceRecords.map((record, i) => (
          <div className="card" key={record.id ?? `${record.date}-${i}`}>
            <div className="card-info">
              <div className="card-title">{record.date} · {InsuranceTypeName(record.type)}</div>
              <div>
                {!!record.broker && `${record.broker} · `}$ {Number(record.fee).toFixed(2)}
              </div>
            </div>
            <div className="card-side">
              <button
                className="icon-button"
                title="編輯"
                aria-label={`編輯 ${record.date}保險記錄`}
                onClick={() => onEdit(record)}>
                ✏️
              </button>
              <button
                className="icon-button danger"
                title="刪除"
                aria-label={`刪除 ${record.date}保險記錄`}
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
