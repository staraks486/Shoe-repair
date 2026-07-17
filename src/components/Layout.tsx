import { ReactNode, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Package, 
  Users, 
  MessageSquare, 
  Settings as SettingsIcon,
  Wifi,
  WifiOff,
  RefreshCw,
  Shield,
  Menu,
  X,
  Tag,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import clsx from 'clsx';
import IntroBanner from './IntroBanner';
import FloatingActionMenu from './FloatingActionMenu';

export default function Layout({ children }: { children: ReactNode }) {
  const { settings, updateSettings, syncAllPending, repairs } = useAppStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ status: 'success' | 'error' | 'syncing', message: string } | null>(null);

  const pendingSyncCount = repairs.filter(r => !r.isSynced).length;

  const handleSync = async () => {
    if (settings.isOfflineMode) return;
    setIsSyncing(true);
    setSyncFeedback({ status: 'syncing', message: 'Syncing pending repairs to Google Sheets...' });
    try {
      await syncAllPending();
      setSyncFeedback({ status: 'success', message: 'Successfully synchronized repairs to Google Sheets!' });
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err: any) {
      console.error('Manual sync failed:', err);
      setSyncFeedback({ status: 'error', message: err?.message || 'Sync failed. Check your Web App URL in settings.' });
      setTimeout(() => setSyncFeedback(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/new-repair', icon: PlusCircle, label: 'CW Care' },
    { to: '/inventory', icon: Package, label: 'CW Plus' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/insurance', icon: Shield, label: 'CW Cover' },
    { to: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-brand-bg text-brand-dark font-sans overflow-hidden">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-10" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className="hidden md:flex w-64 bg-brand-dark text-brand-bg flex-col relative z-20 h-screen transition-transform duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-accent rounded-lg flex items-center justify-center text-brand-dark">
                <Package className="w-6 h-6" />
              </div>
              <h1 className="font-serif text-xl font-bold tracking-tight">{settings.storeName}</h1>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium',
                  isActive 
                    ? 'text-brand-accent' 
                    : 'opacity-60 hover:opacity-100 hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto p-6 border-t border-brand-dark-surface">
          <div className="bg-brand-dark-surface rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider opacity-60">System Status</span>
              <div className={clsx("w-2 h-2 rounded-full", settings.isOfflineMode ? "bg-amber-400" : "bg-green-400")}></div>
            </div>
            <p className="text-xs">
              Mode: <span className="text-brand-accent">{settings.isOfflineMode ? 'Offline' : 'Online'}</span>
            </p>
            <div className="mt-3 flex gap-2">
              <button 
                onClick={() => updateSettings({ isOfflineMode: !settings.isOfflineMode })}
                className="flex-1 py-1.5 bg-brand-dark text-xs border border-brand-bg/20 rounded hover:bg-brand-bg/10 transition-colors flex items-center justify-center gap-1 text-white"
              >
                {settings.isOfflineMode ? <><Wifi className="w-3 h-3"/> Go Online</> : <><WifiOff className="w-3 h-3"/> Go Offline</>}
              </button>
              <button
                onClick={handleSync}
                disabled={settings.isOfflineMode || pendingSyncCount === 0 || isSyncing}
                className="flex-1 py-1.5 bg-brand-accent text-brand-dark font-bold text-xs rounded hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                {isSyncing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                {isSyncing ? 'Syncing...' : `Sync ${pendingSyncCount > 0 ? `(${pendingSyncCount})` : ''}`}
              </button>
            </div>
          </div>
          <div className="mt-4 text-center space-y-1">
            <p className="text-[10px] text-brand-bg opacity-40 uppercase tracking-widest">Designed by Arvind Kumar Shukla</p>
            <p className="text-[10px] text-brand-bg opacity-40">© 2026 ShoeRepair Pro</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-brand-border py-4 flex items-center justify-center gap-2">
            <img src={settings.logoUrl || "/logo.png"} alt="Logo" className="h-8 w-8 object-contain" />
            <h1 className="font-serif text-xl font-bold tracking-tight">Cordwainers Studio</h1>
        </header>
        <div className="flex-1 overflow-auto bg-brand-bg pb-16 md:pb-0">
          <div className="p-4 md:p-8 h-full">
            {children}
          </div>
        </div>
        <FloatingActionMenu />
      </main>

      {/* Mobile Footer Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-border flex justify-around p-2 z-20">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-1 p-2 rounded-md transition-colors text-[10px] font-medium',
                isActive 
                  ? 'text-brand-accent' 
                  : 'text-brand-muted hover:text-brand-dark'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Dynamic Sync Toast Notification */}
      {syncFeedback && (
        <div className={clsx(
          "fixed bottom-20 md:bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300",
          syncFeedback.status === 'success' && "bg-green-50 border-green-200 text-green-800",
          syncFeedback.status === 'error' && "bg-red-50 border-red-200 text-red-800",
          syncFeedback.status === 'syncing' && "bg-white border-brand-border text-brand-dark"
        )}>
          {syncFeedback.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />}
          {syncFeedback.status === 'error' && <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
          {syncFeedback.status === 'syncing' && <Loader2 className="w-5 h-5 text-brand-olive animate-spin shrink-0" />}
          <div className="text-xs font-semibold leading-relaxed">
            {syncFeedback.message}
          </div>
        </div>
      )}
    </div>
  );
}
