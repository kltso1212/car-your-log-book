import { useContext } from 'react';
import { VehicleContext } from '../contexts/VehicleContext';

export default function HomePage() {
  const { vehicles, currentVehicle } = useContext(VehicleContext);

  if (vehicles.length === 0) return <h2>尚無車輛，請按新增加入座駕</h2>;
  if (!currentVehicle) return <h2>請在上方選擇您的座駕，紀錄將保留於網址列</h2>;
  return null;
}
