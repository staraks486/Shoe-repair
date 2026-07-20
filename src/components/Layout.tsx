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
  const { settings, updateSettings, syncAllPending, repairs, lastSyncStatus, user, userProfile, stores = [], currentStoreId, setCurrentStoreId, addStore, setUser } = useAppStore();
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

  useEffect(() => {
    if ((user || userProfile) && location.pathname === '/login') {
      navigate('/', { replace: true });
    }
  }, [user, userProfile, location.pathname, navigate]);

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

  if (!user && !userProfile && !isPublicRoute) {
    return (
      <NotificationToastProvider>
        <AuthObserver />
        <Login />
      </NotificationToastProvider>
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

  const handleAddStore = (e: React.FormEvent) => {
    e.preventDefault();
    addStore({
      id: crypto.randomUUID(),
      name: newStoreForm.storeName,
      address: newStoreForm.address,
      hours: newStoreForm.hours,
      phone: newStoreForm.phone,
      logoUrl: newStoreForm.logoUrl || undefined,
      paymentLink: newStoreForm.paymentLink || undefined,
      qrCode: newStoreForm.qrCode || undefined,
      createdAt: new Date().toISOString(),
      theme: {
        primary: '#2D332F',
        secondary: '#D1CEC4',
        accent: '#8B9D83'
      }
    });
    setIsAddStoreOpen(false);
    setNewStoreForm({
      storeName: '',
      address: '',
      hours: 'Mon-Sat: 9AM - 6PM',
      phone: '',
      logoUrl: '',
      paymentLink: '',
      qrCode: ''
    });
  };

  const isAdmin = userProfile?.role === 'Admin' || userProfile?.isAdmin;

  const primaryNavItems = [
    { to: '/new-repair', icon: PlusCircle, label: 'CW Care' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/cobbler-desk', icon: Package, label: 'Cobbler Desk' },
    { to: '/inventory', icon: Package, label: 'Inventory', adminOnly: true },
    { to: '/insurance', icon: Shield, label: 'CW Assure' },
  ];

  const secondaryNavItems = [
    { to: '/customers', icon: Users, label: 'Directory' },
    { to: '/offers', icon: CloudLightning, label: 'Flash Offers' },
    { to: '/socials-payments', icon: IndianRupee, label: 'Sales & Media' },
    { to: '/appointments', icon: Calendar, label: 'Schedule' },
  ];

  const renderNavItems = (items: typeof primaryNavItems) => {
    return items.map((item) => {
      if (item.adminOnly && !isAdmin) return null;
      return (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => clsx(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative group",
            isActive 
              ? "bg-brand-dark text-white font-medium shadow-md" 
              : "text-brand-muted hover:bg-brand-bg/50 hover:text-brand-dark"
          )}
        >
          {({ isActive }) => (
            <>
              <item.icon className={clsx("w-4 h-4", isActive ? "text-white" : "text-brand-muted group-hover:text-brand-dark transition-colors")} />
              <span className="text-xs uppercase tracking-widest">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeNavIndicator"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-brand-accent rounded-r-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </>
          )}
        </NavLink>
      );
    });
  };

  const activeStore = stores?.find(s => s.id === currentStoreId) || stores?.[0];

  return (
    <NotificationToastProvider>
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col md:flex-row relative">
        <AuthObserver />
        <InstallPrompt />
        <div className="fixed inset-0 bg-noise opacity-5 pointer-events-none z-50 mix-blend-overlay" />
        
        {/* iOS-style Status Bar Mock (Desktop only for aesthetic) */}
        <div className="hidden md:flex fixed top-0 left-0 right-0 h-8 bg-brand-dark text-[10px] text-white/70 items-center justify-between px-6 z-50 font-medium tracking-wide">
          <div className="flex items-center gap-3">
            <span>{currentTime}</span>
            <div className="flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="opacity-75">100%</span>
            <div className="w-5 h-2.5 border border-white/50 rounded-[3px] p-[1px] relative">
              <div className="bg-white h-full rounded-[1px] w-full" />
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 h-1 bg-white/50 rounded-r-sm" />
            </div>
          </div>
        </div>

        {/* Global Feedback Banner */}
        <AnimatePresence>
          {syncFeedback && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-12 left-1/2 -translate-x-1/2 z-[100]"
            >
              <div className={clsx(
                "px-6 py-3 rounded-full shadow-lg border flex items-center gap-3 backdrop-blur-md",
                syncFeedback.status === 'success' ? "bg-green-50/90 border-green-200 text-green-800" :
                syncFeedback.status === 'error' ? "bg-red-50/90 border-red-200 text-red-800" :
                "bg-blue-50/90 border-blue-200 text-blue-800"
              )}>
                {syncFeedback.status === 'syncing' && <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />}
                {syncFeedback.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                {syncFeedback.status === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
                <span className="text-xs font-bold tracking-wide uppercase">{syncFeedback.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className="w-full md:w-[280px] md:h-screen md:sticky top-0 bg-[#F5F3EC] border-b md:border-b-0 md:border-r border-[#E8E6DF] flex flex-col pt-8 md:pt-14 relative z-40 shrink-0">
          
          <div className="px-6 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-xl bg-brand-dark text-white flex items-center justify-center shadow-md overflow-hidden relative group-hover:shadow-lg transition-all duration-300">
                <img src={logo} alt="Logo" className="w-6 h-6 object-contain z-10 brightness-0 invert" />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <h1 className="font-display font-black text-brand-dark tracking-tight leading-none text-lg">Cordwainers</h1>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-brand-muted mt-1">Studio</p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 md:hidden">
              <Suspense fallback={<div className="w-8 h-8 rounded-full bg-brand-border/20 animate-pulse" />}>
                <NotificationCenter />
              </Suspense>
              <button 
                onClick={handleProfileInteraction}
                className="w-10 h-10 rounded-xl bg-white border border-[#E8E6DF] flex items-center justify-center text-brand-dark shadow-sm hover:bg-[#EAE6DD] transition-all relative"
              >
                {userProfile?.displayName ? (
                  <span className="text-sm font-black uppercase">{userProfile.displayName.charAt(0)}</span>
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
                {userProfile?.role === 'Admin' && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-accent rounded-full border-2 border-white flex items-center justify-center">
                    <Shield className="w-2 h-2 text-white" />
                  </div>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
            {/* Context Switcher */}
            <div className="mb-6 px-2">
              <select 
                value={currentStoreId}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    setIsAddStoreOpen(true);
                  } else {
                    setCurrentStoreId(e.target.value);
                  }
                }}
                className="w-full bg-white border border-[#E8E6DF] text-brand-dark text-xs font-bold uppercase tracking-widest rounded-xl py-2.5 px-3 appearance-none cursor-pointer hover:border-brand-muted/30 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent shadow-sm"
                style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)', backgroundPosition: 'calc(100% - 15px) calc(1em + 2px), calc(100% - 11px) calc(1em + 2px)', backgroundSize: '4px 4px, 4px 4px', backgroundRepeat: 'no-repeat' }}
              >
                {stores?.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
                <option value="new">+ Add Store</option>
              </select>
            </div>

            <nav className="space-y-1 mb-8">
              <p className="px-3 text-[10px] font-black text-brand-muted/60 uppercase tracking-[0.2em] mb-3">Core Operations</p>
              {renderNavItems(primaryNavItems)}
            </nav>

            <nav className="space-y-1">
              <p className="px-3 text-[10px] font-black text-brand-muted/60 uppercase tracking-[0.2em] mb-3">Management</p>
              {renderNavItems(secondaryNavItems)}
            </nav>

            <div className="mt-8 px-3">
              <div className="bg-brand-bg rounded-2xl p-4 border border-[#E8E6DF] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-brand-accent/10 transition-colors" />
                <h3 className="text-[10px] font-black text-brand-dark uppercase tracking-widest mb-1">Store Status</h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                  <span className="text-xs font-medium text-brand-muted">Accepting Orders</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[#E8E6DF] hidden md:block mt-auto bg-[#F5F3EC]/80 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <Suspense fallback={<div className="w-8 h-8 rounded-full bg-brand-border/20 animate-pulse" />}>
                  <NotificationCenter />
                </Suspense>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-muted uppercase tracking-wider">
                {settings.isOfflineMode ? (
                  <><WifiOff className="w-3 h-3 text-amber-500" /> Offline</>
                ) : (
                  <><Wifi className="w-3 h-3 text-green-500" /> Online</>
                )}
              </div>
            </div>
            
            <button 
              onClick={handleProfileInteraction}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white transition-all group border border-transparent hover:border-[#E8E6DF] hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-dark text-white flex items-center justify-center shadow-inner relative">
                  {userProfile?.displayName ? (
                    <span className="text-sm font-black uppercase">{userProfile.displayName.charAt(0)}</span>
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                  {userProfile?.role === 'Admin' && (
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-brand-accent rounded-full border-2 border-white flex items-center justify-center">
                      <Shield className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-brand-dark truncate max-w-[120px]">
                    {userProfile?.displayName || user?.email?.split('@')[0] || 'Artisan'}
                  </p>
                  <p className="text-[10px] font-medium text-brand-muted uppercase tracking-wider">
                    {userProfile?.role || 'Staff'} Access
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-brand-muted group-hover:text-brand-dark transition-colors" />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full min-w-0 bg-[#FDFCFB] flex flex-col md:h-screen md:pt-14 relative z-30">
          <div className="flex-1 overflow-y-auto custom-scrollbar md:p-8 p-4 pt-6 pb-24 md:pb-8 relative">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
              </div>
            }>
              {children}
            </Suspense>
          </div>
        </main>
      </div>

      {/* Profile Overlay */}
      <ProfileOverlay isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* Add Store Modal */}
      <AnimatePresence>
        {isAddStoreOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddStoreOpen(false)}
              className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-brand-border overflow-hidden"
            >
              <div className="p-6 border-b border-brand-border flex items-center justify-between bg-brand-bg/50">
                <div>
                  <h3 className="font-display font-black text-xl text-brand-dark uppercase tracking-tight">Add Store</h3>
                  <p className="text-xs text-brand-muted mt-1">Configure a new workshop location</p>
                </div>
                <button
                  onClick={() => setIsAddStoreOpen(false)}
                  className="p-2 hover:bg-brand-border/50 rounded-full transition-colors text-brand-muted hover:text-brand-dark"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddStore} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-brand-dark uppercase tracking-widest mb-1.5 ml-1">Store Name</label>
                  <input
                    type="text"
                    value={newStoreForm.storeName}
                    onChange={(e) => setNewStoreForm({...newStoreForm, storeName: e.target.value})}
                    placeholder="e.g. Cordwainers South"
                    className="w-full bg-brand-bg border border-brand-border rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-brand-dark uppercase tracking-widest mb-1.5 ml-1">Address</label>
                  <input
                    type="text"
                    value={newStoreForm.address}
                    onChange={(e) => setNewStoreForm({...newStoreForm, address: e.target.value})}
                    placeholder="Full physical address"
                    className="w-full bg-brand-bg border border-brand-border rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-brand-dark uppercase tracking-widest mb-1.5 ml-1">Phone</label>
                    <input
                      type="tel"
                      value={newStoreForm.phone}
                      onChange={(e) => setNewStoreForm({...newStoreForm, phone: e.target.value})}
                      placeholder="Contact number"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-brand-dark uppercase tracking-widest mb-1.5 ml-1">Hours</label>
                    <input
                      type="text"
                      value={newStoreForm.hours}
                      onChange={(e) => setNewStoreForm({...newStoreForm, hours: e.target.value})}
                      placeholder="Mon-Sat: 9AM - 6PM"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddStoreOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold uppercase tracking-wider text-xs border border-brand-border text-brand-dark hover:bg-brand-bg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl font-bold uppercase tracking-wider text-xs bg-brand-dark text-white hover:bg-brand-olive transition-colors shadow-md"
                  >
                    Create Store
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </NotificationToastProvider>
  );
}
