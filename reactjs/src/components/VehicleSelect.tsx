import { useContext, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteVehicle } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { slugFromPageIndex } from '../types/Page';
import { vehicleLabelOf, vehiclePlateOf } from '../types/Vehicle';
import { PageContext } from '../contexts/PageContext';
import VehicleDialog from './VehicleDialog';

export default function VehicleSelect() {
  const { vehicles, setVehicles, currentVehicle, setCurrentVehicle } = useContext(VehicleContext);
  const { currentPage } = useContext(PageContext);
  const navigate = useNavigate();
  const params = useParams();
  const [showDialog, setShowDialog] = useState(false);

  const goToVehicle = (vehicleId: number | '') => {
    if (vehicleId === '') {
      navigate('/');
      return;
    }
    // Preserve current tab when switching vehicles; fall back to active slug param.
    const slug = slugFromPageIndex(currentPage);
    navigate(`/vehicles/${vehicleId}/${slug}`, { replace: false });
  };

  const selectedParam = params.vehicleId !== undefined && params.vehicleId !== ''
    ? Number(params.vehicleId)
    : '';

  const handleSelect = (raw: string): void => {
    const vehicleId: number | '' = raw === '' ? '' : Number(raw);
    if (raw !== '' && !Number.isInteger(vehicleId)) return;
    setCurrentVehicle(vehicleId);
    if (vehicleId !== selectedParam) goToVehicle(vehicleId);
  };

  const handleDelete = (): void => {
    if (currentVehicle === '') return alert('請選擇座駕');
    if (!window.confirm(`確認刪除${vehiclePlateOf(vehicles, currentVehicle)}?`)) return;

    deleteVehicle(currentVehicle)
      .then(() => {
        setVehicles(prev => prev.filter(v => v.id !== currentVehicle));
        setCurrentVehicle('');
        navigate('/');
      })
      .catch((err) => {
        alert(err.response.data.message ?? err);
      })
  };

  return (
    <div className="tab-panel vehicle-bar">
      <select
        aria-label="選擇座駕"
        onChange={e => handleSelect(e.target.value)}
        value={currentVehicle}
      >
        <option key="selectYourVehicle" value="">-- 選擇您的座駕 --</option>
        {vehicles.map(v => (
          <option key={v.id} value={v.id}>
            {vehicleLabelOf(vehicles, v.id)}
          </option>
        ))}
      </select>
      <button className="icon-button" title="新增座駕" aria-label="新增座駕" onClick={() => setShowDialog(true)}>➕</button>
      <button className="icon-button danger" title="刪除座駕" aria-label={`刪除座駕 ${currentVehicle}`} onClick={handleDelete}>➖</button>
      {showDialog && (
        <VehicleDialog
          onClose={() => setShowDialog(false)}
          onInserted={id => goToVehicle(id)}
        />
      )}
    </div>
  );
}
