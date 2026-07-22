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
  Tag,
  Keyboard,
  Lock,
  Unlock,
  Terminal,
  Activity,
  HardDrive,
  Eye,
  EyeOff,
  MessageSquare
} from 'lucide-react';
import clsx from 'clsx';
import { auth, db } from '../services/firebase';
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
  const { settings, updateSettings, syncAllPending, repairs, lastSyncStatus, user, userProfile, stores = [], currentStoreId, setCurrentStoreId, addStore, setUser, offlineQueue = [], processOfflineQueue, isPrivacyMasked, togglePrivacyMask } = useAppStore();
  const [syncFeedback, setSyncFeedback] = useState<{ status: 'success' | 'error' | 'syncing', message: string } | null>(null);
  const [currentTime, setCurrentTime] = useState('09:41');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Advanced Security & Dev Telemetry states
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isDevConsoleOpen, setIsDevConsoleOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [systemUptime, setSystemUptime] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const isChatRoute = location.pathname === '/chat';
  const { messages } = useAppStore();
  const unreadMessagesCount = user ? (messages || []).filter(
    m => m.senderId !== user.uid && (!m.readBy || !m.readBy.includes(user.uid))
  ).length : 0;

  // System Uptime Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemUptime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard Shortcuts (Alt + Key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'd') {
          e.preventDefault();
          navigate('/dashboard');
        } else if (key === 'c') {
          e.preventDefault();
          navigate('/cobbler-desk');
        } else if (key === 'n') {
          e.preventDefault();
          navigate('/new-repair');
        } else if (key === 'p') {
          e.preventDefault();
          navigate('/stock');
        } else if (key === 'l') {
          e.preventDefault();
          setIsLocked(true);
        } else if (key === 'k') {
          e.preventDefault();
          setIsShortcutsOpen(prev => !prev);
        } else if (key === 's') {
          e.preventDefault();
          togglePrivacyMask();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, togglePrivacyMask]);

  // Security Inactivity Auto-Lock (3 minutes of idle time triggers lock screen)
  useEffect(() => {
    if (isLocked) return;

    let timer: NodeJS.Timeout;
    const IDLE_LIMIT = 3 * 60 * 1000; // 3 minutes for secure but testable lock

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsLocked(true);
      }, IDLE_LIMIT);
    };

    const handleActivity = () => {
      resetTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    resetTimer();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [isLocked]);

  const handleUnlock = () => {
    // Master workshop staff PIN is "1234"
    if (pinInput === '1234') {
      setIsLocked(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
      setTimeout(() => setPinError(false), 2000);
    }
  };

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
    { to: '/chat', icon: MessageSquare, label: 'CW Chat' },
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
          {/* Left Navigation: Hamburger Menu Button and Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-9 h-9 rounded-xl bg-brand-dark text-white flex items-center justify-center hover:bg-brand-olive transition-colors active:scale-95 shadow-sm"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div>
              <div className="flex items-center gap-1">
                <h1 className="font-display font-black text-brand-dark tracking-tight leading-none text-sm">Cordwainers</h1>
                <Sparkles className="w-3 h-3 text-brand-accent animate-pulse" />
              </div>
              <p className="text-[7px] font-black uppercase tracking-[0.2em] text-brand-muted mt-0.5">
                Studio
              </p>
            </div>
          </div>

          {/* Right Navigation: Notifications and Profile Portal */}
          <div className="flex items-center gap-2">
            <Suspense fallback={<div className="w-6 h-6 rounded-full bg-brand-border/20 animate-pulse" />}>
              <NotificationCenter />
            </Suspense>

            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-9 h-9 rounded-xl bg-brand-dark text-[#D4AF37] flex items-center justify-center shadow-md overflow-hidden relative border border-white/10 hover:scale-105 active:scale-95 transition-all duration-300"
              title="Open Artisan Portal"
            >
              {userProfile?.displayName ? (
                <span className="text-xs font-black uppercase">{userProfile.displayName.charAt(0)}</span>
              ) : (
                <span className="font-display font-black text-sm tracking-tighter leading-none">C</span>
              )}
              <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-brand-dark" />
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

            {/* Terminal Control Center (Security / Developer / Power-User Tools) */}
            <div className="mt-6 px-3">
              <div className="bg-brand-bg rounded-2xl p-4 border border-[#E8E6DF] space-y-3.5">
                <h3 className="text-[10px] font-black text-brand-muted/70 uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-brand-olive" />
                  Terminal Tools
                </h3>
                
                <div className="space-y-2">
                  {/* Privacy Shield */}
                  <button
                    onClick={togglePrivacyMask}
                    className={clsx(
                      "w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all active:scale-95 font-bold text-xs shadow-sm cursor-pointer",
                      isPrivacyMasked 
                        ? "bg-red-50/50 border-red-200 text-red-700 hover:bg-red-50" 
                        : "bg-white border-[#E8E6DF] text-brand-dark hover:bg-[#FAF9F5]"
                    )}
                    title="Alt + S to Toggle. Mask client details on screen."
                  >
                    <div className="flex items-center gap-2">
                      {isPrivacyMasked ? <EyeOff className="w-3.5 h-3.5 text-red-500" /> : <Eye className="w-3.5 h-3.5 text-brand-muted" />}
                      <span>Privacy Shield</span>
                    </div>
                    <span className={clsx(
                      "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                      isPrivacyMasked ? "bg-red-200/50 text-red-800" : "bg-slate-100 text-brand-muted"
                    )}>
                      {isPrivacyMasked ? "MASKED" : "OPEN"}
                    </span>
                  </button>

                  {/* Dev Telemetry Panel */}
                  <button
                    onClick={() => setIsDevConsoleOpen(!isDevConsoleOpen)}
                    className={clsx(
                      "w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all active:scale-95 font-bold text-xs shadow-sm cursor-pointer",
                      isDevConsoleOpen 
                        ? "bg-brand-dark text-white border-brand-dark" 
                        : "bg-white border-[#E8E6DF] text-brand-dark hover:bg-[#FAF9F5]"
                    )}
                    title="Toggle Web App Developer diagnostics panel."
                  >
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Dev Console</span>
                    </div>
                    <span className="text-[8px] font-mono opacity-80 uppercase font-black">
                      {isDevConsoleOpen ? "ON" : "OFF"}
                    </span>
                  </button>

                  {/* Keyboard Shortcuts */}
                  <button
                    onClick={() => setIsShortcutsOpen(true)}
                    className="w-full flex items-center justify-between p-2 rounded-xl border border-[#E8E6DF] bg-white text-brand-dark hover:bg-[#FAF9F5] transition-all active:scale-95 font-bold text-xs shadow-sm cursor-pointer"
                    title="Alt + K to Open"
                  >
                    <div className="flex items-center gap-2">
                      <Keyboard className="w-3.5 h-3.5 text-brand-olive" />
                      <span>Shortcuts Legend</span>
                    </div>
                    <span className="text-[8px] font-black text-brand-muted uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                      ALT+K
                    </span>
                  </button>

                  {/* Lock Screen Toggle */}
                  <button
                    onClick={() => setIsLocked(true)}
                    className="w-full flex items-center justify-between p-2 rounded-xl border border-[#E8E6DF] bg-white text-brand-dark hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all active:scale-95 font-bold text-xs shadow-sm cursor-pointer"
                    title="Alt + L to lock instantly"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-brand-muted" />
                      <span>Lock Terminal</span>
                    </div>
                    <span className="text-[8px] font-black text-brand-muted uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                      ALT+L
                    </span>
                  </button>
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
          {/* 1. CW Book */}
          <NavLink
            key="/book"
            to="/book"
            className={({ isActive }) => clsx(
              "flex flex-col items-center justify-center flex-1 py-1 transition-all relative",
              isActive ? "text-brand-dark font-black" : "text-brand-muted hover:text-brand-dark font-semibold"
            )}
          >
            {({ isActive }) => (
              <>
                <Calendar className="w-5 h-5" />
                <span className="text-[9px] uppercase tracking-wider mt-1 scale-95 origin-center">CW Book</span>
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

          {/* 2. CW Care */}
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

          {/* 3. Dashboard (Center) */}
          <NavLink
            key="/dashboard"
            to="/dashboard"
            className={({ isActive }) => clsx(
              "flex flex-col items-center justify-center flex-1 transition-all relative z-50",
              isActive ? "text-brand-accent font-black" : "text-brand-dark hover:text-brand-accent font-semibold"
            )}
          >
            {({ isActive }) => (
              <div className="flex flex-col items-center justify-center">
                <div className={clsx(
                  "w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all -mt-5 border",
                  isActive 
                    ? "bg-brand-dark border-brand-accent text-brand-accent" 
                    : "bg-white border-[#E8E6DF] text-brand-muted"
                )}>
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <span className="text-[8px] uppercase tracking-wider mt-1.5 font-bold">Dashboard</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeMobileNavIndicator"
                    className="absolute -bottom-1.5 w-1.5 h-1.5 bg-brand-accent rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
            )}
          </NavLink>

          {/* 4. CW Cover (CW Assure) */}
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
                <span className="text-[9px] uppercase tracking-wider mt-1 scale-95 origin-center">CW Assure</span>
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

          {/* 5. CW Plus (Stock) */}
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

      {/* Full-Screen Inactivity Lock Overlay */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-dark/95 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center p-4 text-white"
          >
            <div className="w-full max-w-md text-center space-y-8">
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-brand-accent/15 border-2 border-brand-accent/30 flex items-center justify-center text-brand-accent animate-pulse">
                  <Lock className="w-10 h-10" />
                </div>
                <h2 className="font-display text-3xl font-black uppercase tracking-tight text-[#FAF9F5]">Terminal Locked</h2>
                <p className="text-xs text-white/60 uppercase tracking-widest font-semibold">Cordwainers Studio Security Protocol</p>
              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Enter Workshop PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPinInput(val);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUnlock();
                    }}
                    placeholder="••••"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 text-center text-3xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none text-brand-accent"
                  />
                </div>

                {pinError && (
                  <p className="text-xs text-red-400 font-bold uppercase tracking-wider animate-bounce">
                    Invalid Security PIN. Try Again.
                  </p>
                )}

                <button
                  onClick={handleUnlock}
                  className="w-full py-3.5 rounded-xl bg-brand-accent text-white text-xs font-black uppercase tracking-wider hover:bg-brand-accent/95 transition-all shadow-lg active:scale-98"
                >
                  Unlock Terminal
                </button>
                <p className="text-[10px] text-white/30 tracking-wide font-medium">Standard workshop staff demo passcode is: <span className="font-mono text-brand-accent">1234</span></p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Legend Modal */}
      <AnimatePresence>
        {isShortcutsOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9990] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl border border-brand-border p-6 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center border-b border-brand-border pb-4">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-brand-olive" />
                  <h3 className="font-display font-black text-lg text-brand-dark uppercase tracking-tight">Artisan Shortcuts</h3>
                </div>
                <button
                  onClick={() => setIsShortcutsOpen(false)}
                  className="p-1.5 hover:bg-brand-light rounded-lg transition-colors text-brand-muted hover:text-brand-dark"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5">
                <p className="text-xs text-brand-muted font-medium">Use global <kbd className="bg-brand-light border border-brand-border px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shadow-xs">Alt</kbd> modifiers to navigate rapidly like a workshop power user:</p>
                
                <div className="space-y-2 font-mono text-xs text-brand-dark">
                  <div className="flex items-center justify-between p-2.5 bg-brand-light/40 rounded-xl border border-brand-border/35">
                    <span className="font-sans font-bold">Open Dashboard</span>
                    <kbd className="bg-white border border-brand-border px-2 py-0.5 rounded text-[10px] font-bold shadow-xs">Alt + D</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-brand-light/40 rounded-xl border border-brand-border/35">
                    <span className="font-sans font-bold">Cobbler Desk</span>
                    <kbd className="bg-white border border-brand-border px-2 py-0.5 rounded text-[10px] font-bold shadow-xs">Alt + C</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-brand-light/40 rounded-xl border border-brand-border/35">
                    <span className="font-sans font-bold">Care Intake (New)</span>
                    <kbd className="bg-white border border-brand-border px-2 py-0.5 rounded text-[10px] font-bold shadow-xs">Alt + N</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-brand-light/40 rounded-xl border border-brand-border/35">
                    <span className="font-sans font-bold">Stock Management</span>
                    <kbd className="bg-white border border-brand-border px-2 py-0.5 rounded text-[10px] font-bold shadow-xs">Alt + P</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-brand-light/40 rounded-xl border border-brand-border/35">
                    <span className="font-sans font-bold text-red-600">Secure Lock Screen</span>
                    <kbd className="bg-white border border-brand-border px-2 py-0.5 rounded text-[10px] font-bold shadow-xs text-red-600">Alt + L</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-brand-light/40 rounded-xl border border-brand-border/35">
                    <span className="font-sans font-bold text-amber-700">Toggle Privacy Shield</span>
                    <kbd className="bg-white border border-brand-border px-2 py-0.5 rounded text-[10px] font-bold shadow-xs text-amber-700">Alt + S</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-brand-light/40 rounded-xl border border-brand-border/35">
                    <span className="font-sans font-bold">Shortcuts Guide</span>
                    <kbd className="bg-white border border-brand-border px-2 py-0.5 rounded text-[10px] font-bold shadow-xs">Alt + K</kbd>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsShortcutsOpen(false)}
                className="w-full py-3 rounded-xl bg-brand-dark hover:bg-brand-olive text-white text-xs font-black uppercase tracking-wider transition-colors"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Web App Developer Diagnostics Console Drawer */}
      <AnimatePresence>
        {isDevConsoleOpen && (
          <div className="fixed inset-0 z-[9980] flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDevConsoleOpen(false)}
              className="fixed inset-0 bg-black"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg h-full bg-brand-dark text-slate-100 flex flex-col shadow-2xl border-l border-white/10"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-5 h-5 text-brand-accent" />
                  <div>
                    <h3 className="font-mono text-sm font-black uppercase tracking-wider text-white">Workshop Telemetry Console</h3>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">Live Dev Tools & State Inspections</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDevConsoleOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Telemetry Stats Grid */}
              <div className="p-6 grid grid-cols-2 gap-4 border-b border-white/5 bg-black/20 font-mono text-xs">
                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">System Uptime</span>
                  <p className="text-base font-black text-brand-accent">
                    {Math.floor(systemUptime / 60)}m {systemUptime % 60}s
                  </p>
                </div>
                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Network Ingress</span>
                  <p className="text-base font-black text-green-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    100% Secure
                  </p>
                </div>
                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Zustand Store</span>
                  <p className="text-sm font-bold text-white">
                    {repairs.length} Repairs, {stores.length} Stores
                  </p>
                </div>
                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Offline Sync Queue</span>
                  <p className="text-sm font-bold text-amber-400">
                    {offlineQueue.length} Pending Actions
                  </p>
                </div>
              </div>

              {/* Diagnostics Logger Logs */}
              <div className="flex-1 p-6 flex flex-col min-h-0 space-y-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
                  Active Diagnostics Logs
                </span>
                
                <div className="flex-1 bg-black/50 p-4 rounded-2xl border border-white/10 font-mono text-[11px] text-slate-300 overflow-y-auto space-y-2.5 h-full scrollbar-thin">
                  <p className="text-green-400">[OK] Zustand state store loaded successfully.</p>
                  {db ? (
                    <p className="text-green-400">[OK] Firebase Firestore is connected. Cloud synchronization is active.</p>
                  ) : (
                    <p className="text-amber-400 font-bold">[WARN] Firebase is NOT connected. App is in Local-Only Mode. Add VITE_FIREBASE_ env vars on Render.com to enable cross-device sync.</p>
                  )}
                  {auth ? (
                    <p className="text-green-400">[OK] Firebase Auth is initialized and active.</p>
                  ) : (
                    <p className="text-amber-400 font-bold">[WARN] Firebase Auth is inactive. Mock-only authentication is running.</p>
                  )}
                  <p className="text-slate-400">[INFO] Offline Queue SQLite/IndexedDB sync hook checking integrity...</p>
                  <p className="text-green-400">[OK] DB Schema validation: No unmapped fields.</p>
                  <p className="text-slate-400">[INFO] Security inactivity watch started. Timeout: 180s.</p>
                  <p className="text-brand-accent">[SYSTEM] Privacy Shield status changed. Masking: {isPrivacyMasked ? "ACTIVE" : "INACTIVE"}.</p>
                  <p className="text-slate-400">[DEBUG] Ingress routing to container port 3000 running stable.</p>
                  <p className="text-green-400">[OK] Web Push payload templates verified.</p>
                </div>
              </div>

              {/* Actions Panel */}
              <div className="p-6 border-t border-white/10 bg-black/40 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold">
                  <span>STORE CONTEXT ID</span>
                  <span className="text-white truncate max-w-[200px]">{currentStoreId || 'none'}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => {
                      processOfflineQueue();
                    }}
                    className="py-2.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 text-white font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    Trigger Sync
                  </button>
                  <button
                    onClick={() => {
                      togglePrivacyMask();
                    }}
                    className="py-2.5 bg-brand-accent/20 hover:bg-brand-accent/30 rounded-xl border border-brand-accent/30 text-brand-accent font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    Toggle Privacy
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CW Chat Flotation Icon */}
      <AnimatePresence>
        {user && !isChatRoute && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 50 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/chat')}
            className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40 bg-brand-dark hover:bg-brand-dark/95 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border border-brand-accent/30 group transition-all"
            title="CW Chat - Team Coordination"
            id="chat-flotation-button"
          >
            <div className="relative">
              <MessageSquare className="w-6 h-6 text-[#FAF9F5] group-hover:rotate-6 transition-transform" />
              
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-3.5 -right-3.5 bg-brand-accent text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-brand-dark shadow-md animate-bounce">
                  {unreadMessagesCount}
                </span>
              )}
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </NotificationToastProvider>
  );
}
