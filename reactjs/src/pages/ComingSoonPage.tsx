import { Page } from '../types/Page';
import { useContext } from 'react';
import { PageContext } from '../contexts/PageContext';
import { VehicleContext } from '../contexts/VehicleContext';
import { vehiclePlateOf } from '../types/Vehicle';

export default function ComingSoonPage() {
  const { currentPage } = useContext(PageContext);
  const { vehicles, currentVehicle } = useContext(VehicleContext);
  return (
    <div>
      {currentVehicle !== '' && <h1>{vehiclePlateOf(vehicles, currentVehicle)}的{Page(currentPage) ?? ''}記錄</h1>}
      <h2>Coming Soon</h2>
    </div>
  );
}
