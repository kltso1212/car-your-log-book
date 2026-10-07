import type { MouseEvent } from 'react';
import { useContext } from 'react';
import { deleteLicenceRecord, type LicenceRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { LicenceRecordContext } from '../contexts/LicenceRecordContext';
import { LicenceTypeName } from '../types/DatedTypes';

// Mobile card list for licence fees (mirrors FuelRecordCards).
export default function LicenceCards({
  onEdit,
}: {
  onEdit: (record: LicenceRecord) => void;
}) {
  const { currentVehicle } = useContext(VehicleContext);
  const { licenceRecords, setLicenceRecords } = useContext(LicenceRecordContext);

  const handleDelete = (index: number) => (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    if (!window.confirm('確認刪除記錄?')) return;

    const record = licenceRecords.at(index);
    if (!record) return;

    if (currentVehicle === '') return;
    deleteLicenceRecord(currentVehicle, record)
      .then(() => {
        setLicenceRecords(prev => prev.filter((_, i) => i !== index));
      })
      .catch(err => {
        alert(err.response?.data?.message ?? err);
      });
  };

  return (
    <div className="cards">
      {licenceRecords.length === 0 ? (
        <h2>沒有記錄</h2>
      ) : (
        licenceRecords.map((record, i) => (
          <div className="card" key={record.id ?? `${record.date}-${i}`}>
            <div className="card-info">
              <div className="card-title">{record.date} · {LicenceTypeName(record.type)}</div>
              <div>$ {Number(record.fee).toFixed(2)}</div>
            </div>
            <div className="card-side">
              <button
                className="icon-button"
                title="編輯"
                aria-label={`編輯 ${record.date}牌費記錄`}
                onClick={() => onEdit(record)}>
                ✏️
              </button>
              <button
                className="icon-button danger"
                title="刪除"
                aria-label={`刪除 ${record.date}牌費記錄`}
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
