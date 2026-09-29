import { useState, useEffect, useContext } from 'react';
import type { ChangeEvent } from 'react';
import { addTunnelRecord, type TunnelRecord } from '../services/api';
import { TunnelRecordContext } from '../contexts/TunnelRecordContext';
import { VehicleContext } from '../contexts/VehicleContext';
import { tunnels } from '../types/Tunnel';
import { compareTunnelByDateDesc } from '../utils/tunnelSort';

// Inline insert row for the PC table — same role as InsertFuelRecord.
// The tunnel picker drives the bound options, mirroring TunnelDialog.
export default function TunnelInsertRow() {
  const { currentVehicle } = useContext(VehicleContext);
  const { tunnelRecords, setTunnelRecords } = useContext(TunnelRecordContext);
  const [newRecord, setNewRecord] = useState<Omit<TunnelRecord, 'id'>>(
    { date: '', tunnel: tunnels[0]!.id, bound: 1, fee: 0 },
  );

  const boundOptions = tunnels.find(t => t.id === newRecord.tunnel)?.bounds ?? [];
  useEffect(() => {
    if (!boundOptions[newRecord.bound - 1]) {
      setNewRecord(prev => ({ ...prev, bound: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newRecord.tunnel]);

  const handleInsert = (): void => {
    if (!newRecord.date) {
      return alert('請選擇日期!');
    }

    addTunnelRecord(currentVehicle, newRecord)
      .then(res => {
        setTunnelRecords(prev =>
          [...prev, { ...newRecord, id: res.data?.id }].sort(compareTunnelByDateDesc));
        setNewRecord({ date: '', tunnel: tunnels[0]!.id, bound: 1, fee: 0 });
      })
      .catch((err) => {
        alert(err.response.data.message ?? err);
      })
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setNewRecord(prev => ({
      ...prev,
      [name]: name === 'date' ? value : Number(value),
    }));
  };

  return (
    <tr>
      <td>
        <input type="date" name="date" value={newRecord.date} onChange={handleInputChange} />
      </td>
      <td>
        <select name="tunnel" value={newRecord.tunnel} onChange={handleInputChange}>
          {tunnels.map(t => (
            <option key={t.id} value={t.id}>{t.tc}</option>
          ))}
        </select>
      </td>
      <td>
        <select name="bound" value={newRecord.bound} onChange={handleInputChange}>
          {boundOptions.map((label, i) => (
            <option key={label} value={i + 1}>{label}</option>
          ))}
        </select>
      </td>
      <td>
        <input type="number" min="0" step="any" name="fee" value={newRecord.fee} onChange={handleInputChange} placeholder="0" />
      </td>
      <td>
        <button className="icon-button" title="新增隧道記錄" aria-label="新增隧道記錄" onClick={handleInsert}>➕</button>
      </td>
    </tr>
  );
}
