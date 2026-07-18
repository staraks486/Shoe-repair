import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useAppStore } from './store';

// Lazy load pages for performance optimization
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NewRepair = lazy(() => import('./pages/NewRepair'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Customers = lazy(() => import('./pages/Customers'));
const Insurance = lazy(() => import('./pages/Insurance'));
const Settings = lazy(() => import('./pages/Settings'));
const CobblerDesk = lazy(() => import('./pages/CobblerDesk'));
const Offers = lazy(() => import('./pages/Offers'));
const SocialsPayments = lazy(() => import('./pages/SocialsPayments'));
const Profile = lazy(() => import('./pages/Profile'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Booking = lazy(() => import('./pages/Booking'));

// Simple loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  const fetchFromFirestore = useAppStore((state) => state.fetchFromFirestore);

  useEffect(() => {
    fetchFromFirestore();
  }, [fetchFromFirestore]);

  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<PageLoader />}>
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
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/book" element={<Booking />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

