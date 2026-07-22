import { ReactNode, useState, useEffect, lazy, Suspense } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Package, 
  Boxes,
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
  X,
  CloudLightning,
  Menu,
  Sparkles,
  IndianRupee,
  Calendar,
  Tag
} from 'lucide-react';
import clsx from 'clsx';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import AuthObserver from './AuthObserver';
import InstallPrompt from './InstallPrompt';
import Login from '../pages/Login';
// logo svg import removed
import NotificationToastProvider from './NotificationToastProvider';

const NotificationCenter = lazy(() => import('./NotificationCenter'));

import { ShoeRepairRequest } from '../types';
import { format } from 'date-fns';
import ProfileOverlay from './ProfileOverlay';

export default function Layout({ children }: { children: ReactNode }) {
  const { settings, updateSettings, syncAllPending, repairs, lastSyncStatus, user, userProfile, stores = [], currentStoreId, setCurrentStoreId, addStore, setUser, offlineQueue = [], processOfflineQueue } = useAppStore();
  const [syncFeedback, setSyncFeedback] = useState<{ status: 'success' | 'error' | 'syncing', message: string } | null>(null);
  const [currentTime, setCurrentTime] = useState('09:41');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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
    
    setSyncFeedback({ status: 'syncing', message: 'Syncing pending repairs to Google Sheets...' });
    
    try {
      await syncAllPending();
      setSyncFeedback({ status: 'success', message: 'Successfully synchronized repairs!' });
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err: any) {
      console.error('Manual sync failed:', err);
      setSyncFeedback({ status: 'error', message: err?.message || 'Sync failed. Verify your Sheet URL.' });
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  const handleAddStore = (e: React.FormEvent) => {
    e.preventDefault();
    addStore({
      storeName: newStoreForm.storeName,
      address: newStoreForm.address,
      hours: newStoreForm.hours,
      phone: newStoreForm.phone,
      logoUrl: newStoreForm.logoUrl || undefined,
      paymentLink: newStoreForm.paymentLink || undefined,
      qrCode: newStoreForm.qrCode || undefined,
      createdAt: new Date().toISOString()
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
    { to: '/book', icon: Calendar, label: 'CW Book' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/cobbler-desk', icon: Package, label: 'Cobbler Desk' },
    { to: '/stock', icon: Boxes, label: 'CW Plus' },
    { to: '/insurance', icon: Shield, label: 'CW Assure' },
  ];

  const secondaryNavItems = [
    { to: '/customers', icon: Users, label: 'Directory' },
    { to: '/socials-payments', icon: IndianRupee, label: 'Sales & Media' },
    { to: '/appointments', icon: Calendar, label: 'Schedule' },
  ];

  const renderNavItems = (items: typeof primaryNavItems) => {
    return items.map((item) => {
      if ((item as any).adminOnly && !isAdmin) return null;
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
                "bg-[#F4EBE1] border-[#E3D3C1] text-[#8C6239]"
              )}>
                {syncFeedback.status === 'syncing' && <RefreshCw className="w-4 h-4 animate-spin text-[#8C6239]" />}
                {syncFeedback.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                {syncFeedback.status === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
                <span className="text-xs font-bold tracking-wide uppercase">{syncFeedback.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 left-0 right-0 h-16 bg-[#F5F3EC] border-b border-[#E8E6DF] flex items-center justify-between px-4 z-40 shadow-sm">
          <div 
            className="flex items-center gap-2.5 cursor-pointer group/logo relative select-none" 
            onClick={() => setIsProfileOpen(true)}
            title="Open Artisan Portal"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-dark text-[#D4AF37] flex items-center justify-center shadow-md overflow-hidden relative border border-white/10 group-hover/logo:scale-105 transition-all duration-300">
              <span className="font-display font-black text-sm tracking-tighter leading-none z-10">C</span>
              <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-brand-dark" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h1 className="font-display font-black text-brand-dark tracking-tight leading-none text-sm group-hover/logo:text-brand-accent transition-colors">Cordwainers</h1>
                <Sparkles className="w-3 h-3 text-brand-accent animate-pulse" />
              </div>
              <p className="text-[7px] font-black uppercase tracking-[0.2em] text-brand-muted mt-0.5">
                Studio <span className="text-brand-accent/80 font-bold tracking-normal normal-case font-sans">• Portal</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Suspense fallback={<div className="w-6 h-6 rounded-full bg-brand-border/20 animate-pulse" />}>
              <NotificationCenter />
            </Suspense>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-8 h-8 rounded-lg bg-brand-dark text-white flex items-center justify-center hover:bg-brand-olive transition-colors animate-fade-in"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Sidebar (Desktop only) */}
        <aside className="hidden md:flex md:w-[280px] md:h-screen md:sticky top-0 bg-[#F5F3EC] md:border-r border-[#E8E6DF] flex-col pt-14 relative z-40 shrink-0">
          <div className="px-6 mb-8 flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer group/logo relative select-none" 
              onClick={() => setIsProfileOpen(true)}
              title="Open Artisan Portal"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-dark text-[#D4AF37] flex items-center justify-center shadow-md overflow-hidden relative group-hover/logo:shadow-lg group-hover/logo:scale-105 transition-all duration-300 border border-white/10">
                <span className="font-display font-black text-lg tracking-tighter leading-none z-10">C</span>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover/logo:opacity-100 transition-opacity" />
                <div className="absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-brand-dark" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-display font-black text-brand-dark tracking-tight leading-none text-lg group-hover/logo:text-brand-accent transition-colors">Cordwainers</h1>
                  <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse shrink-0" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-brand-muted mt-1 flex items-center gap-1">
                  Studio <span className="text-brand-accent/75 font-bold tracking-normal normal-case font-sans">• Artisan Portal</span>
                </p>
              </div>
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
                  <option key={store.id} value={store.id}>{store.storeName}</option>
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
            
            <div className="flex items-center justify-between p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#E8E6DF]/50 shadow-sm select-none">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center shadow-inner relative select-none">
                  {userProfile?.displayName ? (
                    <span className="text-xs font-black uppercase">{userProfile.displayName.charAt(0)}</span>
                  ) : (
                    <UserIcon className="w-3.5 h-3.5" />
                  )}
                  {userProfile?.role === 'Admin' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-brand-accent rounded-full border border-white flex items-center justify-center">
                      <Shield className="w-1.5 h-1.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-brand-dark truncate max-w-[110px]">
                    {userProfile?.displayName || user?.email?.split('@')[0] || 'Artisan'}
                  </p>
                  <p className="text-[9px] font-black text-brand-muted uppercase tracking-wider">
                    {userProfile?.role || 'Staff'} Mode
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-brand-muted hover:text-red-600 hover:bg-white border border-transparent hover:border-brand-border rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                title="Terminate Session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Design Credit */}
            <div className="mt-3.5 text-center text-[8px] font-black text-brand-muted/50 uppercase tracking-[0.15em] select-none pointer-events-none">
              App design by Arvind Kumar Shukla
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-40 md:hidden"
              />
              {/* Drawer Content */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-[280px] bg-[#F5F3EC] border-r border-[#E8E6DF] z-50 flex flex-col p-6 shadow-2xl md:hidden"
              >
                <div className="flex items-center justify-between mb-8">
                  <div 
                    className="flex items-center gap-3 cursor-pointer group/logo" 
                    onClick={() => { setIsProfileOpen(true); setIsMobileMenuOpen(false); }}
                    title="Open Artisan Portal"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-dark text-[#D4AF37] flex items-center justify-center shadow-md overflow-hidden relative border border-white/10 group-hover/logo:scale-105 transition-all">
                      <span className="font-display font-black text-lg tracking-tighter leading-none">C</span>
                      <div className="absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-brand-dark" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h1 className="font-display font-black text-brand-dark tracking-tight leading-none text-lg">Cordwainers</h1>
                        <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-brand-muted mt-1">
                        Studio <span className="text-brand-accent/75 font-bold tracking-normal normal-case font-sans">• Artisan Portal</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-brand-border/50 rounded-full transition-colors text-brand-muted hover:text-brand-dark"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-1 py-2 custom-scrollbar">
                  {/* Context Switcher */}
                  <div className="mb-6">
                    <select 
                      value={currentStoreId}
                      onChange={(e) => {
                        if (e.target.value === 'new') {
                          setIsAddStoreOpen(true);
                        } else {
                          setCurrentStoreId(e.target.value);
                        }
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-white border border-[#E8E6DF] text-brand-dark text-xs font-bold uppercase tracking-widest rounded-xl py-2.5 px-3 appearance-none cursor-pointer hover:border-brand-muted/30 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent shadow-sm"
                      style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)', backgroundPosition: 'calc(100% - 15px) calc(1em + 2px), calc(100% - 11px) calc(1em + 2px)', backgroundSize: '4px 4px, 4px 4px', backgroundRepeat: 'no-repeat' }}
                    >
                      {stores?.map(store => (
                        <option key={store.id} value={store.id}>{store.storeName}</option>
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

                <div className="p-4 border-t border-[#E8E6DF] mt-auto">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-muted uppercase tracking-wider">
                      {settings.isOfflineMode ? (
                        <><WifiOff className="w-3 h-3 text-amber-500" /> Offline</>
                      ) : (
                        <><Wifi className="w-3 h-3 text-green-500" /> Online</>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3.5 bg-white/75 rounded-2xl border border-[#E8E6DF]/50 shadow-sm select-none">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center shadow-inner relative select-none">
                        {userProfile?.displayName ? (
                          <span className="text-xs font-black uppercase">{userProfile.displayName.charAt(0)}</span>
                        ) : (
                          <UserIcon className="w-3.5 h-3.5" />
                        )}
                        {userProfile?.role === 'Admin' && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-brand-accent rounded-full border border-white flex items-center justify-center">
                            <Shield className="w-1.5 h-1.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-extrabold text-brand-dark truncate max-w-[110px]">
                          {userProfile?.displayName || user?.email?.split('@')[0] || 'Artisan'}
                        </p>
                        <p className="text-[9px] font-black text-brand-muted uppercase tracking-wider">
                          {userProfile?.role || 'Staff'} Mode
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-2 text-brand-muted hover:text-red-600 hover:bg-white border border-transparent hover:border-brand-border rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                      title="Terminate Session"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Design Credit */}
                  <div className="mt-3.5 text-center text-[8px] font-black text-brand-muted/50 uppercase tracking-[0.15em] select-none pointer-events-none">
                    App design by Arvind Kumar Shukla
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 w-full min-w-0 bg-[#FDFCFB] flex flex-col md:h-screen md:pt-14 relative z-30">
          {offlineQueue && offlineQueue.length > 0 && (
            <div className="bg-amber-50/95 border-b border-amber-200 px-6 py-3.5 flex items-center justify-between gap-4 shadow-sm relative z-40 animate-fade-in backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-800 animate-pulse">
                  {lastSyncStatus === 'syncing' ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-amber-900 uppercase tracking-widest">
                      {lastSyncStatus === 'syncing' ? 'Synchronizing Offline Data...' : 'Offline Changes Pending'}
                    </span>
                    <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                      {offlineQueue.length} {offlineQueue.length === 1 ? 'change' : 'changes'}
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-700/90 mt-1 font-medium tracking-wide">
                    {lastSyncStatus === 'syncing' 
                      ? 'Pristinely pushing captured offline tasks to Firebase database.' 
                      : `Cached: "${offlineQueue[offlineQueue.length - 1].description}". Will auto-sync when online.`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => processOfflineQueue()}
                  disabled={lastSyncStatus === 'syncing'}
                  className={clsx(
                    "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer border border-transparent whitespace-nowrap",
                    !navigator.onLine 
                      ? "bg-[#FAF9F5]/80 text-amber-800/40 border-[#E8E6DF] cursor-not-allowed"
                      : "bg-amber-600 hover:bg-amber-700 text-white"
                  )}
                >
                  {lastSyncStatus === 'syncing' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Syncing
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      {navigator.onLine ? 'Sync Now' : 'Offline'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
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

        {/* Mobile Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#F5F3EC]/95 backdrop-blur-md border-t border-[#E8E6DF] px-2 py-2 flex items-center justify-around z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] pb-[calc(env(safe-area-inset-bottom,0px)+8px)]">
          <NavLink
            key="/dashboard"
            to="/dashboard"
            className={({ isActive }) => clsx(
              "flex flex-col items-center justify-center flex-1 py-1 transition-all relative",
              isActive ? "text-brand-dark font-black" : "text-brand-muted hover:text-brand-dark font-semibold"
            )}
          >
            {({ isActive }) => (
              <>
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[9px] uppercase tracking-wider mt-1 scale-95 origin-center">Dashboard</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeMobileNavIndicator"
                    className="absolute -bottom-1.5 w-1.5 h-1.5 bg-brand-accent rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>

          <NavLink
            key="/new-repair"
            to="/new-repair"
            className={({ isActive }) => clsx(
              "flex flex-col items-center justify-center flex-1 py-1 transition-all relative",
              isActive ? "text-brand-dark font-black" : "text-brand-muted hover:text-brand-dark font-semibold"
            )}
          >
            {({ isActive }) => (
              <>
                <PlusCircle className="w-5 h-5" />
                <span className="text-[9px] uppercase tracking-wider mt-1 scale-95 origin-center">CW Care</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeMobileNavIndicator"
                    className="absolute -bottom-1.5 w-1.5 h-1.5 bg-brand-accent rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>

          <NavLink
            key="/insurance"
            to="/insurance"
            className={({ isActive }) => clsx(
              "flex flex-col items-center justify-center flex-1 py-1 transition-all relative",
              isActive ? "text-brand-dark font-black" : "text-brand-muted hover:text-brand-dark font-semibold"
            )}
          >
            {({ isActive }) => (
              <>
                <Shield className="w-5 h-5" />
                <span className="text-[9px] uppercase tracking-wider mt-1 scale-95 origin-center">CW Cover</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeMobileNavIndicator"
                    className="absolute -bottom-1.5 w-1.5 h-1.5 bg-brand-accent rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>

          <NavLink
            key="/stock"
            to="/stock"
            className={({ isActive }) => clsx(
              "flex flex-col items-center justify-center flex-1 py-1 transition-all relative",
              isActive ? "text-brand-dark font-black" : "text-brand-muted hover:text-brand-dark font-semibold"
            )}
          >
            {({ isActive }) => (
              <>
                <Boxes className="w-5 h-5" />
                <span className="text-[9px] uppercase tracking-wider mt-1 scale-95 origin-center">CW Plus</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeMobileNavIndicator"
                    className="absolute -bottom-1.5 w-1.5 h-1.5 bg-brand-accent rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        </div>
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
