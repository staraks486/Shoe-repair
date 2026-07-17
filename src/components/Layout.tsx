import { ReactNode } from 'react';
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
  Shield
} from 'lucide-react';
import clsx from 'clsx';

export default function Layout({ children }: { children: ReactNode }) {
  const { settings, updateSettings, syncAllPending, repairs } = useAppStore();
  const pendingSyncCount = repairs.filter(r => !r.isSynced).length;

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/new-repair', icon: PlusCircle, label: 'New Repair' },
    { to: '/inventory', icon: Package, label: 'Inventory' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/insurance', icon: Shield, label: 'Insurance' },
    { to: '/chat', icon: MessageSquare, label: 'AI Assistant' },
    { to: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-brand-bg text-brand-dark font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-dark text-brand-bg flex flex-col">
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-brand-accent rounded-lg flex items-center justify-center text-brand-dark">
              <Package className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-xl font-bold tracking-tight">{settings.storeName}</h1>
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
                className="flex-1 py-1.5 bg-brand-dark text-xs border border-brand-bg/20 rounded hover:bg-brand-bg/10 transition-colors flex items-center justify-center gap-1"
              >
                {settings.isOfflineMode ? <><Wifi className="w-3 h-3"/> Go Online</> : <><WifiOff className="w-3 h-3"/> Go Offline</>}
              </button>
              <button
                onClick={() => syncAllPending()}
                disabled={settings.isOfflineMode || pendingSyncCount === 0}
                className="flex-1 py-1.5 bg-brand-accent text-brand-dark font-medium text-xs rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Sync {pendingSyncCount > 0 && `(${pendingSyncCount})`}
              </button>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-[10px] text-brand-bg opacity-40 uppercase tracking-widest">Designed & Developed by AI Studio</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-auto bg-brand-bg">
          <div className="p-8 h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
