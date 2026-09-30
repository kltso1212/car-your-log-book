import type { MouseEvent } from 'react';
import { useContext } from 'react';
import { deleteInsuranceRecord, type InsuranceRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { InsuranceRecordContext } from '../contexts/InsuranceRecordContext';
import { InsuranceTypeName } from '../types/DatedTypes';
import TableHeader from './TableHeader';

export default function InsuranceTable({ onEdit }: { onEdit: (record: InsuranceRecord) => void }) {
  const { currentVehicle } = useContext(VehicleContext);
  const { insuranceRecords, setInsuranceRecords } = useContext(InsuranceRecordContext);

  const handleDelete = (event: MouseEvent<HTMLButtonElement>): void => {
    if (!window.confirm('確認刪除記錄?')) return;

    const index = Number(event.currentTarget.value);
    const record = insuranceRecords.at(index);
    if (!record) return;

    deleteInsuranceRecord(currentVehicle, record)
      .then(() => {
        setInsuranceRecords(prev => prev.filter((_, i) => i !== index));
      })
      .catch(err => {
        alert(err.response?.data?.message ?? err);
      })
  };

  return (
    <div className="table-container">
      <table>
        <TableHeader columns={['日期', '保險種類', '保險公司', '保費', '']} />
        <tbody>
          {insuranceRecords.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <h2>沒有記錄</h2>
              </td>
            </tr>
          ) : (
            insuranceRecords.map((record, i) => (
              <tr key={record.id ?? `${record.date}-${i}`}>
                <td>{record.date}</td>
                <td>{InsuranceTypeName(record.type)}</td>
                <td>{record.broker ?? ''}</td>
                <td>$ {Number(record.fee).toFixed(2)}</td>
                <td className="row-actions">
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
