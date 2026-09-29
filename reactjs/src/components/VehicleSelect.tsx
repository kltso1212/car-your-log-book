import { useContext, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addVehicle, deleteVehicle } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { slugFromPageIndex } from '../types/Page';
import { normalizeVehicleType, vehicleTypes, type VehicleType } from '../types/Vehicle';
import { PageContext } from '../contexts/PageContext';

export default function VehicleSelect() {
  const { vehicles, setVehicles, currentVehicle, setCurrentVehicle } = useContext(VehicleContext);
  const { currentPage } = useContext(PageContext);
  const navigate = useNavigate();
  const params = useParams();
  const [showDialog, setShowDialog] = useState(false);
  const [draftId, setDraftId] = useState('');
  const [draftType, setDraftType] = useState<VehicleType>(1);

  const goToVehicle = (vehicleId: string) => {
    if (!vehicleId) {
      navigate('/');
      return;
    }
    // Preserve current tab when switching vehicles; fall back to active slug param.
    const slug = slugFromPageIndex(currentPage);
    navigate(`/vehicles/${encodeURIComponent(vehicleId)}/${slug}`, { replace: false });
  };

  const handleSelect = (vehicleId: string): void => {
    setCurrentVehicle(vehicleId);
    if (vehicleId !== (params.vehicleId ?? '')) goToVehicle(vehicleId);
  };

  const handleDelete = (): void => {
    if (!currentVehicle) return alert('請選擇座駕');
    if (!window.confirm(`確認刪除${currentVehicle}?`)) return;

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

  const handleConfirmInsert = (e: FormEvent): void => {
    e.preventDefault();
    const id = draftId.trim().toUpperCase();
    if (!id) return alert('請輸入車牌');

    addVehicle(id, draftType)
      .then(() => {
        setVehicles(prev =>
          [...prev, { id, type: draftType }].sort((a, b) => a.id.localeCompare(b.id)));
        setCurrentVehicle(id);
        setDraftId('');
        setDraftType(1);
        setShowDialog(false);
        goToVehicle(id);
      })
      .catch(err => {
        alert(err.response?.data?.message ?? err);
      })
  };

  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setDraftType(normalizeVehicleType(Number(e.target.value)));
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
            {v.id} · {vehicleTypes.find(t => t.id === v.type)?.tc ?? ''}
          </option>
        ))}
      </select>
      <button className="icon-button" title="新增座駕" aria-label="新增座駕" onClick={() => setShowDialog(true)}>➕</button>
      <button className="icon-button danger" title="刪除座駕" aria-label={`刪除座駕 ${currentVehicle}`} onClick={handleDelete}>➖</button>
      {showDialog && (
        <div className="dialog-backdrop" onClick={() => setShowDialog(false)}>
          <div className="dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <h2>新增座駕</h2>
            <form onSubmit={handleConfirmInsert}>
              <div className="form-row">
                <label>車牌
                  <input
                    value={draftId}
                    onChange={e => setDraftId(e.target.value)}
                    placeholder="車牌"
                    autoFocus
                    required
                  />
                </label>
                <label>車輛類別（設定後不能更改）
                  <select value={draftType} onChange={handleTypeChange}>
                    {vehicleTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.tc}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="dialog-actions">
                <button type="button" onClick={() => setShowDialog(false)}>取消</button>
                <button type="submit">新增</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
