import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getVehicles } from './services/api';
import { normalizeVehicleType } from './types/Vehicle';
import type { Vehicle } from './types/Vehicle';
import { PageContext } from './contexts/PageContext';
import { VehicleContext } from './contexts/VehicleContext';
import VehicleSelect from './components/VehicleSelect';
import NavigationBar from './components/NavigationBar';
import HomePage from './pages/HomePage';
import VehicleRoutePage from './pages/VehicleRoutePage';

function AppShell() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currentVehicle, setCurrentVehicle] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadSuccess, setLoadSuccess] = useState(true);

  useEffect(() => {
    getVehicles()
      .then(res => {
        setVehicles((res.data ?? []).map(v => ({ id: v.id, type: normalizeVehicleType(v.type) })));
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoadSuccess(false);
        setVehicles([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <VehicleContext.Provider value={{ vehicles, setVehicles, currentVehicle, setCurrentVehicle }}>
      <PageContext.Provider value={{ currentPage, setCurrentPage }}>
        {/* Vehicle picker first; navbar only appears once a vehicle is
            selected, below the picker */}
        {loading ? <h2>正在載入...</h2> : (loadSuccess ? <VehicleSelect /> : <h2>載入失敗!</h2>)}
        {!loading && loadSuccess && currentVehicle && <NavigationBar />}
        {!loading && loadSuccess && (
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* Tab without vehicle selected: prompt to pick one */}
            <Route path="/:slug" element={<HomePage />} />
            {/* Canonical per-vehicle pages; vehicle + tab persist in URL */}
            <Route path="/vehicles/:vehicleId/:slug" element={<VehicleRoutePage />} />
            <Route path="/vehicles/:vehicleId" element={<Navigate to="fuel" replace />} />
            <Route path="*" element={<h2>找不到頁面</h2>} />
          </Routes>
        )}
      </PageContext.Provider>
    </VehicleContext.Provider>
  );
}

export default function Main() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
