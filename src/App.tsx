import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Layout from './components/Layout';
import { useAppStore } from './store';
import ErrorBoundary from './components/ErrorBoundary';

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
const Appointments = lazy(() => import('./pages/Appointments'));
const Booking = lazy(() => import('./pages/Booking'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));

// Page transition component
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -5 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

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
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
                <Route path="/book" element={<PageWrapper><Booking /></PageWrapper>} />
                
                <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
                <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
                <Route path="/new-repair" element={<PageWrapper><NewRepair /></PageWrapper>} />
                <Route path="/inventory" element={<PageWrapper><Inventory /></PageWrapper>} />
                <Route path="/customers" element={<PageWrapper><Customers /></PageWrapper>} />
                <Route path="/insurance" element={<PageWrapper><Insurance /></PageWrapper>} />
                <Route path="/cobbler-desk" element={<PageWrapper><CobblerDesk /></PageWrapper>} />
                <Route path="/add-insurance" element={<Navigate to="/insurance?tab=add-cover" replace />} />
                <Route path="/offers" element={<PageWrapper><Offers /></PageWrapper>} />
                <Route path="/socials-payments" element={<PageWrapper><SocialsPayments /></PageWrapper>} />
                <Route path="/appointments" element={<PageWrapper><Appointments /></PageWrapper>} />
                <Route path="/profile" element={<PageWrapper><Profile /></PageWrapper>} />
                <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

