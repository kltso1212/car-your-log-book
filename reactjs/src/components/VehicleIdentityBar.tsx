import { useContext, useState } from 'react';
import { VehicleContext } from '../contexts/VehicleContext';
import { vehicleLabelOf } from '../types/Vehicle';
import VehicleAvatar from './VehicleAvatar';
import VehicleDialog from './VehicleDialog';

// Common vehicle identity strip shown on every page between the vehicle
// picker and the navbar: avatar + vehicle name + edit button. The dialog's
// onSaved bumps refreshToken so the avatar re-fetches after a picture
// upload/replace/delete inside the dialog.
export default function VehicleIdentityBar() {
  const { vehicles, currentVehicle } = useContext(VehicleContext);
  const [showEdit, setShowEdit] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  if (currentVehicle === '') return null;
  const current = vehicles.find(v => v.id === currentVehicle);

  return (
    <div className="vehicle-heading">
      <VehicleAvatar vehicleId={currentVehicle} refreshToken={refreshToken} />
      <h1>
        {vehicleLabelOf(vehicles, currentVehicle)}
        <button
          className="icon-button"
          title="編輯座駕"
          aria-label="編輯座駕"
          onClick={() => setShowEdit(true)}
        >
          ✏️
        </button>
      </h1>
      {showEdit && current && (
        <VehicleDialog
          initial={current}
          onClose={() => setShowEdit(false)}
          onSaved={() => setRefreshToken(t => t + 1)}
        />
      )}
    </div>
  );
}
