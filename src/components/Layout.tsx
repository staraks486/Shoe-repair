import { ReactNode, useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Package, 
  Users, 
  Settings as SettingsIcon,
  Wifi,
  WifiOff,
  RefreshCw,
  Shield,
  Menu,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  Sparkles,
  CloudLightning,
  Instagram,
  Facebook,
  Linkedin,
  Globe,
  Share2,
  Hammer,
  Tag,
  LogOut,
  User as UserIcon,
  UserCircle,
  Bell
} from 'lucide-react';
import clsx from 'clsx';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import AuthObserver from './AuthObserver';
import Login from '../pages/Login';
import logo from '../assets/logo.svg';
import NotificationCenter from './NotificationCenter';
import NotificationToastProvider from './NotificationToastProvider';
import QRScanner from './QRScanner';
import { SHOE_FACTS } from '../data/shoeFacts';
import { ShoeRepairRequest } from '../types';
import { format } from 'date-fns';
import { IndianRupee, Clock, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const { settings, updateSettings, syncAllPending, repairs, lastSyncStatus, user, updateRepairStatus } = useAppStore();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ status: 'success' | 'error' | 'syncing', message: string } | null>(null);
  const [currentTime, setCurrentTime] = useState('09:41');
  const [currentFact, setCurrentFact] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedRepair, setScannedRepair] = useState<ShoeRepairRequest | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed", err);
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

  // Automatically close bottom drawer upon navigating
  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  if (!user) {
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
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/insurance', icon: Shield, label: 'Protection' },
    { to: '/new-repair', icon: PlusCircle, label: 'CW Care' },
    { to: '/inventory', icon: Package, label: 'CW Plus' },
  ];

  const moreHubItems = [
    { to: '/cobbler-desk', icon: Hammer, label: "Cobbler's Desk", desc: 'Manage assigned repairs, check photos, log payments & balances' },
    { to: '/offers', icon: Tag, label: 'Offers & Loyalty', desc: 'Manage artisan discounts & seasonal repair deals' },
    { to: '/customers', icon: Users, label: 'Customer Directory', desc: 'Manage artisan CRM & footwear profiles' },
    { to: '/socials-payments', icon: Share2, label: 'Socials & Payments', desc: 'Configure payment gateways, QR codes & social links' },
    { to: '/settings', icon: SettingsIcon, label: 'App Settings & API', desc: 'Configure cloud spreadsheets & pricing' },
  ];

  return (
    <div className="min-h-screen w-full bg-[#EAE6DD] flex flex-col font-sans relative">
      <AuthObserver />
      <NotificationToastProvider />
      
      {/* QR Scanner Overlay */}
      <AnimatePresence>
        {showScanner && (
          <QRScanner 
            onScan={handleScanResult} 
            onClose={() => setShowScanner(false)} 
          />
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
                  <h3 className="font-serif font-black text-brand-dark uppercase tracking-tight text-lg">Repair Found</h3>
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
                    <h4 className="font-serif text-xl font-black text-brand-dark">{scannedRepair.shoeModel}</h4>
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

      {/* Global Sync Loading Spinner Overlay */}
      <AnimatePresence mode="wait">
        {lastSyncStatus === 'syncing' && (
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

                <h3 className="font-serif font-black text-brand-dark uppercase tracking-tight text-lg mb-2">Did you know?</h3>
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
      <div className="flex-1 flex flex-col relative z-10 w-full max-w-screen-2xl mx-auto md:px-8">
        
        {/* Redesigned Header based on user image - Shown on all pages */}
        <header className="bg-white/80 backdrop-blur-md px-6 py-6 border-b border-brand-border sticky top-0 relative z-20 flex flex-col items-center">
          <div className="w-full max-w-7xl flex items-center justify-between">
            {/* Left: Brand Identity */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/profile')}
                className="relative group transition-transform active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-dark text-white hover:bg-brand-olive flex items-center justify-center text-xs font-black tracking-tighter transition-all shadow-lg">
                  {(user.displayName || user.email?.split('@')[0] || 'AS').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
              </button>
              <div>
                <h1 className="font-serif text-lg font-bold text-brand-dark tracking-tight leading-none uppercase">Studio</h1>
                <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest mt-1">Artisan Ops</p>
              </div>
            </div>

            {/* Right: Quick Tools */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowScanner(true)}
                className="w-10 h-10 rounded-xl bg-white border border-brand-border shadow-sm flex items-center justify-center text-brand-dark hover:bg-brand-bg transition-colors"
                title="Scan Receipt"
              >
                <div className="flex flex-col items-center gap-0.5 scale-90">
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="w-1.5 h-1.5 bg-brand-dark rounded-[1px]" />
                    <div className="w-1.5 h-1.5 bg-brand-dark rounded-[1px]" />
                    <div className="w-1.5 h-1.5 bg-brand-dark rounded-[1px]" />
                    <div className="w-1.5 h-1.5 bg-brand-dark rounded-[1px]" />
                  </div>
                </div>
              </button>
              <NotificationCenter />
            </div>
          </div>
        </header>

        {/* Scrollable Viewport Context */}
        <div className="flex-1 relative bg-brand-bg pb-32">
          <div className="p-4 md:p-10">
            {children}
          </div>

          {/* Persistent Main Footer Designer Name */}
          <footer className="mt-12 mb-20 px-6 py-8 border-t border-brand-border/40 text-center space-y-2 opacity-60">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-dark">
              Designed by Arvind Kumar Shukla
            </p>
            <p className="text-[8px] font-bold uppercase tracking-widest text-brand-muted">
              © 2026 Cordwainers Studio • Artisan Footwear Management
            </p>
          </footer>
        </div>

        {/* DYNAMIC BOTTOM SHEET DRAWER OVERLAY (SERVICE HUB) */}
        <AnimatePresence>
          {isMoreOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-brand-dark/45 backdrop-blur-xs z-40"
                onClick={() => setIsMoreOpen(false)}
              />
              
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] border-t border-brand-border shadow-[0_-10px_40px_rgba(0,0,0,0.18)] z-50 p-6 pb-8 flex flex-col space-y-5 select-none"
              >
                {/* Aesthetic Drag Handle Decoration */}
                <div className="w-12 h-1 bg-brand-border rounded-full mx-auto cursor-pointer" onClick={() => setIsMoreOpen(false)} />

                {/* Service Hub Header */}
                <div className="flex items-center justify-between border-b border-brand-bg pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-olive/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-brand-olive" />
                    </div>
                    <div>
                      <h3 className="font-serif font-extrabold text-base text-brand-dark">Service Hub</h3>
                      <p className="text-[9px] text-brand-muted uppercase tracking-wider font-semibold">Extended Management Portal</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsMoreOpen(false)}
                    className="p-1.5 rounded-full bg-brand-bg text-brand-muted hover:text-brand-dark transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Hub Grid Menu Links */}
                <div className="space-y-3">
                  {moreHubItems.map((item) => (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false);
                        navigate(item.to);
                      }}
                      className="w-full text-left p-3.5 rounded-2xl bg-brand-bg/50 border border-brand-border/40 hover:bg-brand-bg hover:border-brand-border transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white border border-brand-border flex items-center justify-center text-brand-olive group-hover:bg-brand-olive group-hover:text-white transition-all shadow-xs">
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-brand-dark leading-tight">{item.label}</h4>
                          <p className="text-[10px] text-brand-muted mt-0.5 font-medium">{item.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-brand-muted group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>

                {/* Dynamic Sync Center & Offline Settings Box */}
                <div className="bg-brand-dark text-white rounded-2xl p-4 space-y-4 shadow-sm border border-brand-dark-surface/50">
                  <div className="flex justify-between items-center border-b border-brand-dark-surface pb-2.5">
                    <div className="flex items-center gap-2">
                      <CloudLightning className="w-4 h-4 text-brand-accent animate-pulse" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-bg/85">Cloud Connectivity</span>
                    </div>
                    <span className={clsx(
                      "text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider",
                      settings.isOfflineMode ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30"
                    )}>
                      {settings.isOfflineMode ? 'Local Mode' : 'Cloud Connected'}
                    </span>
                  </div>

                  <div className="flex gap-2.5">
                    <button 
                      type="button"
                      onClick={() => updateSettings({ isOfflineMode: !settings.isOfflineMode })}
                      className="flex-1 py-2.5 bg-brand-dark-surface text-[10px] font-bold uppercase tracking-wider rounded-xl border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-1.5 text-white"
                    >
                      {settings.isOfflineMode ? (
                        <>
                          <Wifi className="w-3.5 h-3.5 text-brand-accent" />
                          Go Online
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3.5 h-3.5 text-brand-muted" />
                          Go Offline
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSync}
                      disabled={settings.isOfflineMode || pendingSyncCount === 0 || isSyncing}
                      className="flex-1 py-2.5 bg-brand-accent text-brand-dark font-extrabold text-[10px] uppercase tracking-wider rounded-xl hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {isSyncing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      {isSyncing ? 'Aligning...' : `Sync ${pendingSyncCount > 0 ? `(${pendingSyncCount})` : ''}`}
                    </button>
                  </div>
                </div>

                {/* Brand Social Hub & Connections */}
                <div className="pt-2 border-t border-brand-bg flex flex-col items-center space-y-2">
                  <span className="text-[7.5px] font-extrabold uppercase tracking-[0.25em] text-brand-muted">Join the Artisan Circle</span>
                  <div className="flex gap-4">
                    {settings.instagramLink && (
                      <a href={settings.instagramLink} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-brand-bg text-brand-olive hover:bg-brand-olive hover:text-white transition-all shadow-xs" title="Instagram">
                        <Instagram className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {settings.facebookLink && (
                      <a href={settings.facebookLink} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-brand-bg text-brand-olive hover:bg-brand-olive hover:text-white transition-all shadow-xs" title="Facebook">
                        <Facebook className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {settings.linkedinLink && (
                      <a href={settings.linkedinLink} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-brand-bg text-brand-olive hover:bg-brand-olive hover:text-white transition-all shadow-xs" title="LinkedIn">
                        <Linkedin className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {settings.websiteLink && (
                      <a href={settings.websiteLink} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-brand-bg text-brand-olive hover:bg-brand-olive hover:text-white transition-all shadow-xs" title="Official Website">
                        <Globe className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Human Signature/Footer Details */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="text-center pt-2 border-t border-brand-bg/60"
                >
                  <p className="text-[9px] text-brand-accent font-black tracking-[0.3em] uppercase">App design by Arvind Kumar Shukla</p>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <Sparkles className="w-2.5 h-2.5 text-brand-olive" />
                    <span className="text-[7px] text-brand-muted font-bold uppercase tracking-widest">Handcrafted Excellence</span>
                    <Sparkles className="w-2.5 h-2.5 text-brand-olive" />
                  </div>
                  <p className="text-[8px] text-brand-muted/70 mt-1">© 2026 Cordwainers Studio • ShoeRepair Pro</p>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Fixed Bottom Navigation (Mobile & Desktop) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-brand-border flex justify-around py-4 px-6 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] select-none md:rounded-t-[32px] max-w-screen-xl mx-auto">
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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
          ))}

          {/* Dynamic Service Hub Menu Button */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={clsx(
              'flex flex-col items-center gap-1.5 px-4 py-1 rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider relative',
              isMoreOpen ? 'text-brand-olive scale-105' : 'text-brand-muted hover:text-brand-dark'
            )}
          >
            <Menu className={clsx(
              "w-6 h-6 transition-all duration-300",
              isMoreOpen ? "stroke-[2.5px] rotate-90" : "stroke-[1.8px] opacity-75"
            )} />
            <span className="hidden sm:inline">More</span>
            {isMoreOpen && (
              <span className="absolute bottom-[-2px] w-1.5 h-1.5 rounded-full bg-brand-olive" />
            )}
          </button>
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
    </div>
  );
}
