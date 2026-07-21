import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Layout from './components/Layout';
import { useAppStore } from './store';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages for performance optimization
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NewRepair = lazy(() => import('./pages/NewRepair'));
const Stock = lazy(() => import('./pages/Stock'));
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
                
                <Route path="/" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
                <Route path="/new-repair" element={<ProtectedRoute><PageWrapper><NewRepair /></PageWrapper></ProtectedRoute>} />
                <Route path="/stock" element={<ProtectedRoute><PageWrapper><Stock /></PageWrapper></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute><PageWrapper><Inventory /></PageWrapper></ProtectedRoute>} />
                <Route path="/customers" element={<ProtectedRoute><PageWrapper><Customers /></PageWrapper></ProtectedRoute>} />
                <Route path="/insurance" element={<ProtectedRoute><PageWrapper><Insurance /></PageWrapper></ProtectedRoute>} />
                <Route path="/cobbler-desk" element={<ProtectedRoute><PageWrapper><CobblerDesk /></PageWrapper></ProtectedRoute>} />
                <Route path="/add-insurance" element={<Navigate to="/insurance?tab=add-cover" replace />} />
                <Route path="/offers" element={<ProtectedRoute><PageWrapper><Offers /></PageWrapper></ProtectedRoute>} />
                <Route path="/socials-payments" element={<ProtectedRoute><PageWrapper><SocialsPayments /></PageWrapper></ProtectedRoute>} />
                <Route path="/appointments" element={<ProtectedRoute><PageWrapper><Appointments /></PageWrapper></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute requireAdmin><PageWrapper><Settings /></PageWrapper></ProtectedRoute>} />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

