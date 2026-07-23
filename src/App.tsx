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
const Messaging = lazy(() => import('./pages/Messaging'));

import ShoeFactsLoader from './components/ShoeFactsLoader';

// Page transition component
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 3 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -3 }}
    transition={{ duration: 0.15, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

// Page loading fallback with shoe facts
const PageLoader = () => (
  <ShoeFactsLoader message="Preparing Artisan Studio..." />
);

export default function App() {
  const fetchFromFirestore = useAppStore((state) => state.fetchFromFirestore);
  const user = useAppStore((state) => state.user);
  const loadOfflineQueue = useAppStore((state) => state.loadOfflineQueue);
  const processOfflineQueue = useAppStore((state) => state.processOfflineQueue);
  
  useEffect(() => {
    fetchFromFirestore();

    return () => {
      const unsubscribers = useAppStore.getState().unsubscribers || [];
      unsubscribers.forEach((unsub) => {
        try {
          unsub();
        } catch (e) {
          console.error("Error unsubscribing Firestore listener:", e);
        }
      });
    };
  }, [fetchFromFirestore, user]);

  useEffect(() => {
    // Initial offline queue load
    loadOfflineQueue();

    // Connection event listeners
    const handleOnline = () => {
      console.log('App is online. Processing offline queue...');
      processOfflineQueue();
    };

    const handleOffline = () => {
      console.log('App went offline.');
    };

    const handleFocusOrVisibility = () => {
      if (document.visibilityState === 'visible' || document.hasFocus()) {
        if (navigator.onLine) {
          processOfflineQueue();
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', handleFocusOrVisibility);

    // Try processing if we are already online on mount
    if (navigator.onLine) {
      processOfflineQueue();
    }

    // High-frequency background sync timer (every 3 seconds) to ensure offline operations are pushed promptly
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        processOfflineQueue();
      }
    }, 3000);

    // Service Worker communication
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SYNC_OFFLINE_DATA') {
        console.log('Service Worker triggered offline sync message.');
        processOfflineQueue();
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleFocusOrVisibility);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [loadOfflineQueue, processOfflineQueue]);

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
                <Route path="/customers" element={<ProtectedRoute><PageWrapper><Customers /></PageWrapper></ProtectedRoute>} />
                <Route path="/insurance" element={<ProtectedRoute><PageWrapper><Insurance /></PageWrapper></ProtectedRoute>} />
                <Route path="/cobbler-desk" element={<ProtectedRoute><PageWrapper><CobblerDesk /></PageWrapper></ProtectedRoute>} />
                <Route path="/add-insurance" element={<Navigate to="/insurance?tab=add-cover" replace />} />
                <Route path="/offers" element={<ProtectedRoute><PageWrapper><Offers /></PageWrapper></ProtectedRoute>} />
                <Route path="/socials-payments" element={<ProtectedRoute><PageWrapper><SocialsPayments /></PageWrapper></ProtectedRoute>} />
                <Route path="/appointments" element={<ProtectedRoute><PageWrapper><Appointments /></PageWrapper></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><PageWrapper><Messaging /></PageWrapper></ProtectedRoute>} />
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

