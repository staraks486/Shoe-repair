import { ReactNode, useState, useEffect, lazy, Suspense, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Package, 
  Users, 
  Wifi,
  WifiOff,
  RefreshCw,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  LogOut,
  User as UserIcon,
  UserCircle,
  Bell,
  X,
  CloudLightning
} from 'lucide-react';
import clsx from 'clsx';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import AuthObserver from './AuthObserver';
import InstallPrompt from './InstallPrompt';
import Login from '../pages/Login';
import logo from '../assets/logo.svg';
import NotificationToastProvider from './NotificationToastProvider';
const NotificationCenter = lazy(() => import('./NotificationCenter'));
const QRScanner = lazy(() => import('./QRScanner'));
import { SHOE_FACTS } from '../data/shoeFacts';
import { ShoeRepairRequest } from '../types';
import { format } from 'date-fns';
import { IndianRupee, Clock, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import ProfileOverlay from './ProfileOverlay';

export default function Layout({ children }: { children: ReactNode }) {
  const { settings, updateSettings, syncAllPending, repairs, lastSyncStatus, user, stores = [], currentStoreId, setCurrentStoreId, addStore, setUser } = useAppStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ status: 'success' | 'error' | 'syncing', message: string } | null>(null);
  const [currentTime, setCurrentTime] = useState('09:41');
  const [currentFact, setCurrentFact] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedRepair, setScannedRepair] = useState<ShoeRepairRequest | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [newStoreForm, setNewStoreForm] = useState({
    storeName: '',
    address: '',
    hours: 'Mon-Sat: 9AM - 6PM',
    phone: '',
    logoUrl: '',
    paymentLink: '',
    qrCode: ''
  });

  const navigate = useNavigate();
  const location = useLocation();

  const handleProfileInteraction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      setIsProfileOpen(false);
    } else {
      clickTimeout.current = setTimeout(() => {
        setIsProfileOpen(true);
        clickTimeout.current = null;
      }, 250);
    }
  };

  const isPublicRoute = location.pathname === '/book';

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setUser(null);
    }
  };

  const pendingSyncCount = repairs.filter(r => !r.isSynced).length;

  // Simulate real-time clock in mock status bar
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lastSyncStatus === 'syncing') {
      const randomFact = SHOE_FACTS[Math.floor(Math.random() * SHOE_FACTS.length)];
      setCurrentFact(randomFact);
    }
  }, [lastSyncStatus]);

  if (!user && !isPublicRoute) {
    return (
      <>
        <AuthObserver />
        <Login />
      </>
    );
  }

  const handleSync = async () => {
    if (settings.isOfflineMode) return;
    setIsSyncing(true);
    setSyncFeedback({ status: 'syncing', message: 'Syncing pending repairs to Google Sheets...' });
    try {
      await syncAllPending();
      setSyncFeedback({ status: 'success', message: 'Successfully synchronized repairs!' });
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err: any) {
      console.error('Manual sync failed:', err);
      setSyncFeedback({ status: 'error', message: err?.message || 'Sync failed. Verify your Sheet URL.' });
      setTimeout(() => setSyncFeedback(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleScanResult = (decodedText: string) => {
    setShowScanner(false);
    
    // Look up repair by invoice number or ID
    const repair = repairs.find(r => 
      r.invoiceNumber.toLowerCase() === decodedText.toLowerCase() || 
      r.id === decodedText
    );

    if (repair) {
      setScannedRepair(repair);
    } else {
      alert("No repair found for this ticket. Please check the QR code.");
    }
  };

  const primaryNavItems = [
    { to: '/new-repair', icon: PlusCircle, label: 'CW Care' },
    { to: '/insurance', icon: Shield, label: 'CW Cover' },
    { to: '/', icon: LayoutDashboard, label: 'Workshop Hub' },
    { to: '/inventory', icon: Package, label: 'CW Plus' },
    { to: '#profile', icon: UserCircle, label: 'Artisan', isProfile: true },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#EAE6DD] flex flex-col font-sans relative overflow-x-hidden">
      <AuthObserver />
      <NotificationToastProvider />
      
      {/* QR Scanner Overlay */}
      <AnimatePresence>
        {showScanner && (
          <Suspense fallback={<div className="fixed inset-0 bg-brand-dark/90 backdrop-blur-md z-[200] flex items-center justify-center"><Loader2 className="w-10 h-10 text-white animate-spin" /></div>}>
            <QRScanner 
              onScan={handleScanResult} 
              onClose={() => setShowScanner(false)} 
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Scanned Repair Detail Modal */}
      <AnimatePresence>
        {scannedRepair && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-[210] flex items-center justify-center p-4"
            onClick={() => setScannedRepair(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-brand-border flex items-center justify-between">
                <div>
                  <h3 className="font-display font-black text-brand-dark uppercase tracking-tight text-lg">Repair Found</h3>
                  <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">{scannedRepair.invoiceNumber}</p>
                </div>
                <button 
                  onClick={() => setScannedRepair(null)}
                  className="p-2 rounded-full bg-brand-bg text-brand-muted hover:text-brand-dark"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-display text-xl font-black text-brand-dark">{scannedRepair.shoeModel}</h4>
                    <p className="text-sm font-bold text-brand-olive">{scannedRepair.customerName}</p>
                  </div>
                  <div className={clsx(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    scannedRepair.status === 'Completed' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"
                  )}>
                    {scannedRepair.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-brand-light/50 p-4 rounded-2xl border border-brand-border/40">
                    <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1">Due Date</p>
                    <p className="text-sm font-bold text-brand-dark">
                      {format(new Date(scannedRepair.dueDate), 'dd MMM, yyyy')}
                    </p>
                  </div>
                  <div className="bg-brand-light/50 p-4 rounded-2xl border border-brand-border/40">
                    <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1">Total Amount</p>
                    <div className="flex items-center gap-1 text-sm font-black text-brand-dark">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {scannedRepair.price}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Services</p>
                  <div className="flex flex-wrap gap-2">
                    {scannedRepair.repairType.map((type, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white border border-brand-border rounded-full text-[10px] font-bold text-brand-dark uppercase tracking-tight">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setScannedRepair(null);
                    navigate('/cobbler-desk');
                  }}
                  className="w-full bg-brand-dark text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                >
                  Manage in Workshop
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Sync Loading Spinner Overlay - Only show on initial boot if no data */}
      <AnimatePresence mode="wait">
        {lastSyncStatus === 'syncing' && repairs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="fixed inset-0 bg-white/80 backdrop-blur-md z-[300] flex flex-col items-center justify-center"
          >
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-brand-border flex flex-col items-center space-y-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-brand-olive animate-spin" />
                <CloudLightning className="w-5 h-5 text-brand-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="text-center max-w-xs">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-4"
                >
                  <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em]">Arvind Kumar Shukla</p>
                  <p className="text-[8px] text-brand-muted font-bold uppercase tracking-widest mt-0.5">Lead Designer</p>
                </motion.div>

                <h3 className="font-display font-black text-brand-dark uppercase tracking-tight text-lg mb-2">Did you know?</h3>
                <p className="text-xs text-brand-olive font-bold leading-relaxed italic">
                  "{currentFact}"
                </p>
                <p className="text-[8px] text-brand-muted font-black uppercase tracking-[0.3em] mt-4 opacity-40 text-center">
                  Aligning Artisan Vault...
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Noise & Blurs */}
      <div className="fixed inset-0 bg-noise pointer-events-none opacity-5 z-0" />
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-accent/10 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-olive/5 blur-[150px] pointer-events-none" />

      {/* Main Content Wrapper (Full Screen) */}
      <div className="flex-1 flex flex-col relative z-10 w-full max-w-screen-2xl mx-auto px-0 md:px-8">
        
        {/* Redesigned Header based on user image - Shown on all pages */}
        <header className="bg-white/80 backdrop-blur-md px-3 sm:px-6 py-4 sm:py-6 border-b border-brand-border sticky top-0 relative z-20 flex flex-col items-center">
          <div className="w-full max-w-7xl flex items-center justify-between gap-1 sm:gap-4">
            {/* Left: Brand Identity */}
            <div className="flex items-center gap-2 sm:gap-4 max-w-[70%] sm:max-w-none">
              <button 
                onClick={handleProfileInteraction}
                className="relative group transition-transform active:scale-95 shrink-0"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-brand-dark text-white hover:bg-brand-olive flex items-center justify-center text-[10px] sm:text-xs font-black tracking-tighter transition-all shadow-lg relative">
                  {user ? (user.displayName || user.email?.split('@')[0] || 'AS').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'G'}
                  {lastSyncStatus === 'syncing' && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-brand-accent"></span>
                    </span>
                  )}
                </div>
              </button>
              <div className="shrink-0">
                <h1 className="font-display text-sm sm:text-lg font-bold text-brand-dark tracking-tight leading-none uppercase">
                  {location.pathname === '/insurance' ? 'COVER' : location.pathname === '/new-repair' ? 'CARE' : location.pathname === '/inventory' ? 'PLUS' : 'STUDIO'}
                </h1>
                <p className="text-[8px] sm:text-[9px] font-black text-brand-accent uppercase tracking-widest mt-0.5 sm:mt-1">
                  {location.pathname === '/insurance' ? 'Asset Preservation' : location.pathname === '/new-repair' ? 'Artisan Ops' : location.pathname === '/inventory' ? 'Premium Supplies' : 'Daily Analytics'}
                </p>
              </div>
 
              {/* Store Selector */}
              <div className="flex ml-1 sm:ml-4 items-center gap-1 bg-brand-bg/80 border border-brand-border/60 rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-1 shadow-sm max-w-[100px] xs:max-w-[150px] sm:max-w-none">
                <span className="text-[8px] sm:text-[9px] font-black uppercase text-brand-muted tracking-widest hidden md:inline">Store:</span>
                <select 
                  value={currentStoreId || ''}
                  onChange={(e) => {
                    if (e.target.value === 'ADD_NEW_STORE') {
                      setIsAddStoreOpen(true);
                    } else {
                      setCurrentStoreId(e.target.value);
                    }
                  }}
                  className="bg-transparent text-[10px] sm:text-xs font-bold text-brand-dark uppercase tracking-tight focus:outline-none cursor-pointer max-w-[65px] xs:max-w-none truncate"
                >
                  {stores.map(store => (
                    <option key={store.id} value={store.id} className="bg-white text-brand-dark font-sans uppercase">
                      {store.storeName}
                    </option>
                  ))}
                  <option value="ADD_NEW_STORE" className="bg-white text-brand-accent font-black uppercase tracking-wider">
                    + Add New Store
                  </option>
                </select>
              </div>
            </div>
 
            {/* Right: Quick Tools */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button 
                onClick={() => setShowScanner(true)}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white border border-brand-border shadow-sm flex items-center justify-center text-brand-dark hover:bg-brand-bg transition-colors"
                title="Scan Receipt"
              >
                <div className="flex flex-col items-center gap-0.5 scale-75 sm:scale-90">
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="w-1.5 h-1.5 bg-brand-dark rounded-[1px]" />
                    <div className="w-1.5 h-1.5 bg-brand-dark rounded-[1px]" />
                    <div className="w-1.5 h-1.5 bg-brand-dark rounded-[1px]" />
                    <div className="w-1.5 h-1.5 bg-brand-dark rounded-[1px]" />
                  </div>
                </div>
              </button>
              <Suspense fallback={<div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center"><Loader2 className="w-4 h-4 text-brand-muted animate-spin" /></div>}>
                <NotificationCenter />
              </Suspense>
              
              {user && (
                <button 
                  onClick={handleLogout}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 border border-red-100 shadow-sm flex items-center justify-center transition-colors"
                  title="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Viewport Context */}
        <div className="flex-1 relative bg-brand-bg min-h-screen">
          <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-6 pb-32 sm:pt-10">
            {children}
          </main>

          {/* Persistent Main Footer Designer Name */}
          <footer className="pb-40 px-6 py-12 border-t border-brand-border/40 text-center space-y-2 opacity-40 grayscale">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-dark">
              App designed by Arvind Kumar Shukla
            </p>
            <p className="text-[7px] font-bold uppercase tracking-widest text-brand-muted">
              © 2026 Cordwainers Studio • Artisan Framework • Vers: 2.4.0
            </p>
          </footer>
        </div>

        {/* Fixed Bottom Navigation (Mobile & Desktop) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-brand-border flex justify-around py-4 px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] select-none md:rounded-t-[32px] max-w-screen-xl mx-auto">
          {primaryNavItems.map((item) => (
            item.isProfile ? (
              <button
                key={item.to}
                onClick={handleProfileInteraction}
                className={clsx(
                  'flex flex-col items-center gap-1.5 px-4 py-1 rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider relative',
                  isProfileOpen ? 'text-brand-olive scale-105' : 'text-brand-muted hover:text-brand-dark'
                )}
              >
                <item.icon className={clsx(
                  "w-6 h-6 transition-all duration-300",
                  isProfileOpen ? "stroke-[2.5px]" : "stroke-[1.8px] opacity-75"
                )} />
                <span className="hidden sm:inline">{item.label}</span>
                {isProfileOpen && (
                  <span className="absolute bottom-[-2px] w-1.5 h-1.5 rounded-full bg-brand-olive" />
                )}
              </button>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex flex-col items-center gap-1.5 px-4 py-1 rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider relative',
                    isActive 
                      ? 'text-brand-olive scale-105' 
                      : 'text-brand-muted hover:text-brand-dark'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={clsx(
                      "w-6 h-6 transition-all duration-300",
                      isActive ? "stroke-[2.5px]" : "stroke-[1.8px] opacity-75"
                    )} />
                    <span className="hidden sm:inline">{item.label}</span>
                    {isActive && (
                      <span className="absolute bottom-[-2px] w-1.5 h-1.5 rounded-full bg-brand-olive" />
                    )}
                  </>
                )}
              </NavLink>
            )
          ))}
        </nav>

        {/* Dynamic Cloud Sync Status Floating Toast Notification */}
        <AnimatePresence>
          {syncFeedback && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className={clsx(
                "absolute bottom-20 left-4 right-4 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3",
                syncFeedback.status === 'success' && "bg-green-50 border-green-200 text-green-800",
                syncFeedback.status === 'error' && "bg-red-50 border-red-200 text-red-800",
                syncFeedback.status === 'syncing' && "bg-white border-brand-border text-brand-dark"
              )}
            >
              {syncFeedback.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />}
              {syncFeedback.status === 'error' && <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
              {syncFeedback.status === 'syncing' && <Loader2 className="w-4 h-4 text-brand-olive animate-spin shrink-0" />}
              <div className="text-[10px] font-bold tracking-tight leading-normal">
                {syncFeedback.message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <InstallPrompt />
      
      {/* Integrated Artisan Profile Overlay */}
      <ProfileOverlay 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />

      {/* Add New Store Modal Overlay */}
      <AnimatePresence>
        {isAddStoreOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[40px] border border-brand-border p-8 md:p-10 max-w-lg w-full shadow-premium relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-accent via-brand-olive to-brand-accent" />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-display text-2xl font-black text-brand-dark uppercase tracking-tight">New Store Setup</h3>
                  <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest mt-1">Register a new studio location</p>
                </div>
                <button 
                  onClick={() => setIsAddStoreOpen(false)}
                  className="p-2 rounded-full hover:bg-brand-bg text-brand-muted hover:text-brand-dark transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest">Store Name *</label>
                  <input 
                    type="text" 
                    required
                    value={newStoreForm.storeName}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, storeName: e.target.value })}
                    placeholder="e.g. Cordwainers Studio - Bangalore"
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-3.5 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest">Operating Hours</label>
                  <input 
                    type="text" 
                    value={newStoreForm.hours}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, hours: e.target.value })}
                    placeholder="e.g. Mon-Sat: 10AM - 8PM"
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-3.5 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest">Full Address *</label>
                  <input 
                    type="text" 
                    required
                    value={newStoreForm.address}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, address: e.target.value })}
                    placeholder="e.g. 12, Indiranagar Double Rd, Bangalore"
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-3.5 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest">Phone Contact</label>
                    <input 
                      type="text" 
                      value={newStoreForm.phone}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, phone: e.target.value })}
                      placeholder="e.g. +91 80 1234 5678"
                      className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-3.5 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest">Logo URL</label>
                    <input 
                      type="url" 
                      value={newStoreForm.logoUrl}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, logoUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-3.5 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={async () => {
                    if (!newStoreForm.storeName.trim() || !newStoreForm.address.trim()) {
                      alert('Store Name and Address are required.');
                      return;
                    }
                    await addStore(newStoreForm);
                    setIsAddStoreOpen(false);
                    // Reset form
                    setNewStoreForm({
                      storeName: '',
                      address: '',
                      hours: 'Mon-Sat: 9AM - 6PM',
                      phone: '',
                      logoUrl: '',
                      paymentLink: '',
                      qrCode: ''
                    });
                  }}
                  className="flex-1 bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest py-4 rounded-full hover:bg-brand-olive transition-all shadow-premium"
                >
                  Save & Initialize Store
                </button>
                <button
                  onClick={() => setIsAddStoreOpen(false)}
                  className="border border-brand-border text-brand-dark text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-full hover:bg-brand-bg transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
