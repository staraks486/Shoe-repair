import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewRepair from './pages/NewRepair';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Insurance from './pages/Insurance';
import Settings from './pages/Settings';
import CobblerDesk from './pages/CobblerDesk';
import Offers from './pages/Offers';
import SocialsPayments from './pages/SocialsPayments';
import { useAppStore } from './store';

export default function App() {
  const fetchFromFirestore = useAppStore((state) => state.fetchFromFirestore);

  useEffect(() => {
    fetchFromFirestore();
  }, [fetchFromFirestore]);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new-repair" element={<NewRepair />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/insurance" element={<Insurance />} />
          <Route path="/cobbler-desk" element={<CobblerDesk />} />
          <Route path="/add-insurance" element={<Navigate to="/insurance?tab=add-cover" replace />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/socials-payments" element={<SocialsPayments />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

