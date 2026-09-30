import type { MouseEvent } from 'react';
import { useContext } from 'react';
import { deleteLicenceRecord, type LicenceRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { LicenceRecordContext } from '../contexts/LicenceRecordContext';
import { LicenceTypeName } from '../types/DatedTypes';
import TableHeader from './TableHeader';

export default function LicenceTable({ onEdit }: { onEdit: (record: LicenceRecord) => void }) {
  const { currentVehicle } = useContext(VehicleContext);
  const { licenceRecords, setLicenceRecords } = useContext(LicenceRecordContext);

  const handleDelete = (event: MouseEvent<HTMLButtonElement>): void => {
    if (!window.confirm('確認刪除記錄?')) return;

    const index = Number(event.currentTarget.value);
    const record = licenceRecords.at(index);
    if (!record) return;

    deleteLicenceRecord(currentVehicle, record)
      .then(() => {
        setLicenceRecords(prev => prev.filter((_, i) => i !== index));
      })
      .catch(err => {
        alert(err.response?.data?.message ?? err);
      })
  };

  return (
    <div className="table-container">
      <table>
        <TableHeader columns={['日期', '牌費種類', '牌費', '']} />
        <tbody>
          {licenceRecords.length === 0 ? (
            <tr>
              <td colSpan={4}>
                <h2>沒有記錄</h2>
              </td>
            </tr>
          ) : (
            licenceRecords.map((record, i) => (
              <tr key={record.id ?? `${record.date}-${i}`}>
                <td>{record.date}</td>
                <td>{LicenceTypeName(record.type)}</td>
                <td>$ {Number(record.fee).toFixed(2)}</td>
                <td className="row-actions">
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
