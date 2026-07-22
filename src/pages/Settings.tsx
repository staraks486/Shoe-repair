import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import clsx from 'clsx';
import { 
  CheckCircle, 
  XCircle, 
  Copy, 
  Check, 
  Star,
  Loader2, 
  HelpCircle,
  FileSpreadsheet,
  Link,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Trash2,
  Clock,
  Database,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Globe,
  Phone,
  GripVertical,
  Download,
  Upload,
  Archive,
  X,
  AlertTriangle,
  User,
  Save
} from 'lucide-react';
import { checkNotificationPermission, requestNotificationPermission } from '../lib/notifications';
import { db } from '../services/firebase';

interface SwipeToDeleteProps {
  onDelete: () => void;
  confirmMessage?: string;
  itemName?: string;
  children: React.ReactNode;
}

function SwipeToDelete({ onDelete, confirmMessage, itemName, children }: SwipeToDeleteProps) {
  const [isSwiped, setIsSwiped] = useState(false);

  const handleDragEnd = (_event: any, info: any) => {
    // Highly responsive thresholds: swipe left if dragged more than 30px or swiped with speed
    if (info.offset.x < -30 || info.velocity.x < -100) {
      setIsSwiped(true);
    } else if (info.offset.x > 25 || info.velocity.x > 100) {
      setIsSwiped(false);
    }
  };

  const handleDelete = () => {
    if (confirmMessage) {
      if (window.confirm(confirmMessage)) {
        onDelete();
      }
    } else {
      onDelete();
    }
    setIsSwiped(false);
  };

  return (
    <div className="relative overflow-hidden rounded-[32px] w-full bg-red-500 shadow-sm">
      <div className="absolute inset-0 bg-red-600 flex items-center justify-end px-8 text-white">
        <button
          onClick={handleDelete}
          type="button"
          className="flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-110 active:scale-95"
          title={`Permanently delete ${itemName || 'item'}`}
        >
          <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-md">
            <Trash2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest text-white">Delete</span>
        </button>
      </div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={{ left: 0.15, right: 0.05 }}
        onDragEnd={handleDragEnd}
        animate={{ x: isSwiped ? -120 : 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 220 }}
        className="relative bg-white w-full z-10 select-none touch-pan-y cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-stretch">
          <div className="flex items-center justify-center px-3 border-r border-brand-border/30 hover:bg-brand-bg/30 transition-colors shrink-0">
            <GripVertical className="w-4 h-4 text-brand-muted/40" />
          </div>
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function EmployeeCard({ emp, index, settings, updateSettings }: { emp: any; index: number; settings: any; updateSettings: any }) {
  const [avatarUrl, setAvatarUrl] = useState(emp.avatarUrl || '');
  const [name, setName] = useState(emp.name || '');
  const [role, setRole] = useState(emp.role || '');
  const [mobile, setMobile] = useState(emp.mobile || '');
  const [email, setEmail] = useState(emp.email || '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setAvatarUrl(emp.avatarUrl || '');
    setName(emp.name || '');
    setRole(emp.role || '');
    setMobile(emp.mobile || '');
    setEmail(emp.email || '');
  }, [emp]);

  const handleBlur = (field: string, value: string) => {
    const newItems = [...(settings.employees || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    updateSettings({ employees: newItems });
  };

  const handleAutoPhoto = () => {
    const defaultAvatars = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop"
    ];
    const avatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
    setAvatarUrl(avatar);
    const newItems = [...(settings.employees || [])];
    newItems[index] = { ...newItems[index], avatarUrl: avatar };
    updateSettings({ employees: newItems });
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-[28px] border border-brand-border/80 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative w-full">
      {/* Header with dismiss button */}
      <div className="md:col-span-2 flex justify-between items-center pb-3 border-b border-brand-border/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-olive" />
          <span className="text-[10px] font-black text-brand-dark uppercase tracking-widest">
            {name ? name : `Personnel Member #${index + 1}`}
          </span>
        </div>
        <button 
          type="button"
          onClick={() => {
            if (window.confirm(`Are you sure you want to dismiss "${emp.name || 'this staff member'}" from the concierge team?`)) {
              const newItems = (settings.employees || []).filter((_: any, i: number) => i !== index);
              updateSettings({ employees: newItems });
            }
          }}
          className="p-2 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-full border border-red-200/80 transition-all text-xs flex items-center gap-1 font-bold"
          title="Dismiss personnel"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="text-[9px] uppercase tracking-wider hidden sm:inline">Dismiss</span>
        </button>
      </div>
      
      {/* Avatar preview and URL input */}
      <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-4 pb-4 border-b border-brand-border/40">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-brand-border overflow-hidden bg-brand-bg flex-shrink-0 flex items-center justify-center shadow-inner">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <User className="w-7 h-7 text-brand-muted" />
          )}
        </div>
        <div className="flex-1 w-full space-y-2">
          <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest block">Profile Photo / Avatar URL</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input 
              type="text" 
              value={avatarUrl} 
              placeholder="https://images.unsplash.com/... or paste image link" 
              onChange={(e) => setAvatarUrl(e.target.value)} 
              onBlur={() => handleBlur('avatarUrl', avatarUrl)}
              className="flex-1 bg-white border border-brand-border rounded-full px-5 py-2.5 text-xs focus:ring-2 focus:ring-brand-accent/20 outline-none w-full" 
            />
            <button
              type="button"
              onClick={handleAutoPhoto}
              className="px-4 py-2 bg-brand-bg hover:bg-brand-dark hover:text-white text-brand-dark border border-brand-border rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap"
            >
              Auto Photo
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest block">Full Name</label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          onBlur={() => handleBlur('name', name)}
          placeholder="e.g. Anand Sharma"
          className="w-full bg-white border border-brand-border rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none font-bold" 
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest block">Artisan Role</label>
        <input 
          type="text" 
          value={role} 
          onChange={(e) => setRole(e.target.value)} 
          onBlur={() => handleBlur('role', role)}
          placeholder="e.g. Concierge Lead"
          className="w-full bg-white border border-brand-border rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none" 
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest block">Contact Mobile</label>
        <input 
          type="tel" 
          value={mobile} 
          onChange={(e) => setMobile(e.target.value)} 
          onBlur={() => handleBlur('mobile', mobile)}
          className="w-full bg-white border border-brand-border rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none" 
          placeholder="+91 98765 43210" 
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest block">Email Address</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          onBlur={() => handleBlur('email', email)}
          className="w-full bg-white border border-brand-border rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none" 
          placeholder="name@artisan.com" 
        />
      </div>

      <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-brand-border/40 mt-2">
        <span className="text-[10px] font-bold uppercase tracking-wider h-5 flex items-center">
          {saved && (
            <motion.span 
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-brand-olive flex items-center gap-1"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Saved Personnel Profile!
            </motion.span>
          )}
        </span>
        <button
          type="button"
          onClick={() => {
            const newItems = [...(settings.employees || [])];
            newItems[index] = {
              ...newItems[index],
              avatarUrl,
              name,
              role,
              mobile,
              email
            };
            updateSettings({ employees: newItems });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          }}
          className="w-full sm:w-auto bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest px-6 py-3.5 rounded-full hover:bg-brand-olive active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Save className="w-3.5 h-3.5" />
          Save Personnel Profile
        </button>
      </div>
    </div>
  );
}

function CobblerCard({ cobbler, index, settings, updateSettings }: { cobbler: any; index: number; settings: any; updateSettings: any }) {
  const [name, setName] = useState(cobbler.name || '');
  const [specialty, setSpecialty] = useState(cobbler.specialty || '');
  const [mobile, setMobile] = useState(cobbler.mobile || '');
  const [email, setEmail] = useState(cobbler.email || '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(cobbler.name || '');
    setSpecialty(cobbler.specialty || '');
    setMobile(cobbler.mobile || '');
    setEmail(cobbler.email || '');
  }, [cobbler]);

  const handleBlur = (field: string, value: string) => {
    const newItems = [...(settings.cobblers || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    updateSettings({ cobblers: newItems });
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-[28px] border border-brand-border/80 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative w-full">
      <div className="md:col-span-2 flex justify-between items-center pb-3 border-b border-brand-border/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-accent" />
          <span className="text-[10px] font-black text-brand-dark uppercase tracking-widest">
            {name ? name : `Master Artisan #${index + 1}`}
          </span>
        </div>
        <button 
          type="button"
          onClick={() => {
            if (window.confirm(`Are you sure you want to dismiss "${cobbler.name || 'this cobbler'}" from the enlisted artisans?`)) {
              const newItems = (settings.cobblers || []).filter((_: any, i: number) => i !== index);
              updateSettings({ cobblers: newItems });
            }
          }}
          className="p-2 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-full border border-red-200/80 transition-all text-xs flex items-center gap-1 font-bold"
          title="Dismiss cobbler"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="text-[9px] uppercase tracking-wider hidden sm:inline">Dismiss</span>
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest block">Artisan Name</label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          onBlur={() => handleBlur('name', name)}
          placeholder="e.g. Master Rajesh"
          className="w-full bg-white border border-brand-border rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none font-display font-bold" 
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest block">Artisan Specialty</label>
        <input 
          type="text" 
          value={specialty} 
          onChange={(e) => setSpecialty(e.target.value)} 
          onBlur={() => handleBlur('specialty', specialty)}
          placeholder="e.g. Goodyear Welt Specialist"
          className="w-full bg-white border border-brand-border rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none" 
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest block">Contact Mobile</label>
        <input 
          type="tel" 
          value={mobile} 
          onChange={(e) => setMobile(e.target.value)} 
          onBlur={() => handleBlur('mobile', mobile)}
          className="w-full bg-white border border-brand-border rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none" 
          placeholder="+91 98765 00000" 
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest block">Email Address</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          onBlur={() => handleBlur('email', email)}
          className="w-full bg-white border border-brand-border rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none" 
          placeholder="artisan@cordwainers.com" 
        />
      </div>

      <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-brand-border/40 mt-2">
        <span className="text-[10px] font-bold uppercase tracking-wider h-5 flex items-center">
          {saved && (
            <motion.span 
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-brand-olive flex items-center gap-1"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Saved Artisan Profile!
            </motion.span>
          )}
        </span>
        <button
          type="button"
          onClick={() => {
            const newItems = [...(settings.cobblers || [])];
            newItems[index] = {
              ...newItems[index],
              name,
              specialty,
              mobile,
              email
            };
            updateSettings({ cobblers: newItems });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          }}
          className="w-full sm:w-auto bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest px-6 py-3.5 rounded-full hover:bg-brand-olive active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Save className="w-3.5 h-3.5" />
          Save Artisan Details
        </button>
      </div>
    </div>
  );
}

function CredentialCard({ cred, index, settings, deleteUserCredential, updateUserCredential, updateSettings, isAdmin }: { cred: any; index: number; settings: any; deleteUserCredential: any; updateUserCredential: any; updateSettings: any; isAdmin: boolean }) {
  const [displayName, setDisplayName] = useState(cred.displayName || '');
  const [username, setUsername] = useState(cred.username || '');
  const [email, setEmail] = useState(cred.email || '');
  const [mobile, setMobile] = useState(cred.mobile || '');
  const [password, setPassword] = useState(cred.password || '');
  const [role, setRole] = useState(cred.role);

  useEffect(() => {
    setDisplayName(cred.displayName || '');
    setUsername(cred.username || '');
    setEmail(cred.email || '');
    setMobile(cred.mobile || '');
    setPassword(cred.password || '');
    setRole(cred.role);
  }, [cred]);

  const handleBlur = (field: string, value: any) => {
    updateUserCredential(cred.email, { [field]: value });
  };

  return (
    <div className="bg-white p-8 grid grid-cols-1 md:grid-cols-2 gap-6 relative w-full rounded-3xl border border-brand-border/40 shadow-sm hover:shadow-md transition-all">
      <button 
        type="button"
        onClick={() => {
          if (window.confirm(`Are you sure you want to delete access for "${cred.displayName || cred.email}"?`)) {
            deleteUserCredential(cred.email);
          }
        }}
        className="absolute top-6 right-6 p-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-full border border-red-200 transition-all z-20"
        title="Delete account access"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      
      <div className="space-y-2">
        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Full Name (Display Name)</label>
        <input 
          type="text" 
          value={displayName} 
          onChange={(e) => setDisplayName(e.target.value)}
          onBlur={() => handleBlur('displayName', displayName)}
          className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none font-bold" 
          placeholder="e.g. John Doe" 
        />
      </div>

      <div className="space-y-2">
        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Login Username (Unique)</label>
        <input 
          type="text" 
          value={username} 
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
          onBlur={() => handleBlur('username', username)}
          className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none font-bold font-mono" 
          placeholder="e.g. johndoe" 
        />
      </div>

      <div className="space-y-2">
        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Email Address</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => {
            const newCreds = [...(settings.userCredentials || [])];
            newCreds[index] = { ...newCreds[index], email };
            updateSettings({ userCredentials: newCreds });
          }}
          className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none font-bold" 
          placeholder="e.g. john@cordwainers.com" 
        />
      </div>

      <div className="space-y-2">
        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Mobile Number</label>
        <input 
          type="tel" 
          value={mobile} 
          onChange={(e) => setMobile(e.target.value)}
          onBlur={() => handleBlur('mobile', mobile)}
          className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none font-bold" 
          placeholder="e.g. +91 9876543210" 
        />
      </div>

      <div className="space-y-2">
        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Change Password</label>
        <input 
          type="text" 
          value={password} 
          disabled={!isAdmin} 
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => handleBlur('password', password)}
          className={clsx("w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none text-brand-accent font-mono font-bold", !isAdmin && "opacity-50 cursor-not-allowed")} 
          placeholder="Change Password" 
        />
      </div>

      <div className="space-y-2">
        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Account Role</label>
        <select 
          value={role} 
          onChange={(e) => {
            const r = e.target.value as 'Admin' | 'Staff';
            setRole(r);
            updateUserCredential(cred.email, { role: r });
          }} 
          className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none font-bold"
        >
          <option value="Admin">Admin (Full Access)</option>
          <option value="Staff">Staff (Read-Only/Limited)</option>
        </select>
      </div>
    </div>
  );
}

export default function Settings() {
  const { 
    settings, 
    updateSettings, 
    repairs = [], 
    customers = [],
    inventory = [],
    appointments = [],
    offlineQueue = [],
    profiles = [],
    messages = [],
    syncAllPending, 
    syncErrorLogs = [], 
    lastSyncStatus = 'idle', 
    lastSyncTime = null, 
    clearSyncErrorLogs,
    userProfile,
    stores = [],
    addStore,
    updateStore,
    setDefaultStore,
    deleteStore,
    addUserCredential,
    deleteUserCredential,
    updateUserCredential,
    backups = [],
    createAppBackup,
    createStoreBackup,
    importBackup,
    deleteBackupRecord,
    currentStoreId,
    setCurrentStoreId
  } = useAppStore();
  const [activeTab, setActiveTab] = useState('Store');
  const [localFields, setLocalFields] = useState<Record<string, string>>({});
  const [storeSaved, setStoreSaved] = useState(false);

  useEffect(() => {
    setLocalFields({
      logoUrl: settings.logoUrl || '',
      storeName: settings.storeName || '',
      hours: settings.hours || '',
      address: settings.address || '',
      cobblerBio: settings.cobblerBio || '',
      instagramLink: settings.instagramLink || '',
      facebookLink: settings.facebookLink || '',
      twitterLink: settings.twitterLink || '',
      linkedinLink: settings.linkedinLink || '',
      websiteLink: settings.websiteLink || '',
      termsAndConditions: settings.termsAndConditions || '',
      googleSheetsWebAppUrl: settings.googleSheetsWebAppUrl || '',
      whatsappIntakeTemplate: settings.whatsappIntakeTemplate || '',
      whatsappReadyTemplate: settings.whatsappReadyTemplate || '',
    });
  }, [settings, currentStoreId]);

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setLocalFields(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const fieldName = e.target.name;
    const fieldValue = e.target.value;
    updateSettings({ [fieldName]: fieldValue });

    const storeFields = ['storeName', 'address', 'hours', 'phone', 'logoUrl', 'paymentLink', 'qrCode', 'instagramLink', 'facebookLink', 'twitterLink', 'linkedinLink', 'websiteLink', 'whatsappLink'];
    if (storeFields.includes(fieldName) && currentStoreId) {
      updateStore(currentStoreId, { [fieldName]: fieldValue });
    }
  };

  const activeStoreObj = stores.find((s: any) => s.id === currentStoreId) || stores.find((s: any) => s.isDefault) || stores[0];
  const defaultStoreObj = stores.find((s: any) => s.isDefault) || stores[0];

  const handleSyncFromDefaultStore = async () => {
    if (defaultStoreObj) {
      await setDefaultStore(defaultStoreObj.id);
      setLocalFields(prev => ({
        ...prev,
        storeName: defaultStoreObj.storeName || '',
        address: defaultStoreObj.address || '',
        hours: defaultStoreObj.hours || '',
        logoUrl: defaultStoreObj.logoUrl || '',
        instagramLink: defaultStoreObj.instagramLink || '',
        facebookLink: defaultStoreObj.facebookLink || '',
        twitterLink: defaultStoreObj.twitterLink || '',
        linkedinLink: defaultStoreObj.linkedinLink || '',
        websiteLink: defaultStoreObj.websiteLink || '',
        whatsappLink: defaultStoreObj.whatsappLink || ''
      }));
    }
  };
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    displayName: '',
    username: '',
    email: '',
    mobile: '',
    password: '',
    role: 'Staff' as 'Admin' | 'Staff'
  });
  const [addUserError, setAddUserError] = useState<string | null>(null);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError(null);

    const displayName = newUserForm.displayName.trim();
    const username = newUserForm.username.trim().toLowerCase().replace(/\s+/g, '');
    const email = newUserForm.email.trim().toLowerCase();
    const mobile = newUserForm.mobile.trim();
    const password = newUserForm.password;
    const role = newUserForm.role;

    if (!displayName || !username || !email || !password) {
      setAddUserError('Display Name, Username, Email, and Password are required.');
      return;
    }

    const currentCreds = settings.userCredentials || [];
    
    // Check duplicate username
    if (currentCreds.some(c => c.username?.toLowerCase() === username)) {
      setAddUserError('An account with this username already exists.');
      return;
    }

    // Check duplicate email
    if (currentCreds.some(c => c.email.toLowerCase() === email)) {
      setAddUserError('An account with this email address already exists.');
      return;
    }

    // Add new credential
    addUserCredential({
      displayName,
      username,
      email,
      mobile,
      password,
      role
    });
    
    // Reset form and close
    setNewUserForm({
      displayName: '',
      username: '',
      email: '',
      mobile: '',
      password: '',
      role: 'Staff'
    });
    setShowAddUserModal(false);
  };

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [storeForm, setStoreForm] = useState({
    storeName: '',
    address: '',
    hours: 'Mon-Sat: 9AM - 6PM',
    phone: '',
    logoUrl: '',
    paymentLink: '',
    qrCode: '',
    isDefault: false,
    instagramLink: '',
    facebookLink: '',
    twitterLink: '',
    linkedinLink: '',
    websiteLink: '',
    whatsappLink: ''
  });

  const isAdmin = !userProfile || userProfile.role === 'Admin' || userProfile.isAdmin === true;

  React.useEffect(() => {
    checkNotificationPermission().then(setNotificationPermission);
  }, []);

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
  };
  
  // ... existing connection test state ...
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [showScriptGuide, setShowScriptGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Retry sync state
  const [isRetryingSync, setIsRetryingSync] = useState(false);
  const [retryFeedback, setRetryFeedback] = useState<{ status: 'success' | 'error', message: string } | null>(null);

  const handleRetrySync = async () => {
    setIsRetryingSync(true);
    setRetryFeedback(null);
    try {
      await syncAllPending();
      setRetryFeedback({ status: 'success', message: 'Synchronization completed successfully!' });
    } catch (err: any) {
      setRetryFeedback({ status: 'error', message: err?.message || 'Sync failed. Review error logs below.' });
    } finally {
      setIsRetryingSync(false);
    }
  };

  // Backup system state
  const [backupStatus, setBackupStatus] = useState<'idle' | 'exporting' | 'restoring' | 'success' | 'error'>('idle');
  const [backupMessage, setBackupMessage] = useState('');

  // Store deletion state with backup prompt
  const [deletingStore, setDeletingStore] = useState<any | null>(null);
  const [downloadedBackupForStore, setDownloadedBackupForStore] = useState<boolean>(false);

  const handleInitiateStoreDelete = (store: any) => {
    if (stores.length <= 1) {
      alert("Cannot delete the only registered store location.");
      return;
    }
    setDeletingStore(store);
    setDownloadedBackupForStore(false);
  };

  const handleDownloadSpecificStoreBackup = async (store: any) => {
    try {
      const backupData = await useAppStore.getState().createStoreBackup(store.id);
      if (!backupData) {
        throw new Error("Could not generate store backup.");
      }
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      const cleanedStoreName = store.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      downloadAnchor.setAttribute('download', `store_backup_${cleanedStoreName}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setDownloadedBackupForStore(true);
    } catch (err) {
      console.error(err);
      alert("Failed to download store backup.");
    }
  };

  const handleExportBackup = async () => {
    setBackupStatus('exporting');
    setBackupMessage('Generating full database and configuration backup...');
    try {
      const backupData = await createAppBackup();
      if (!backupData) {
        throw new Error("Unable to create backup. Ensure you have an active database connection.");
      }

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadAnchor.setAttribute('download', `app_backup_${timestamp}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setBackupStatus('success');
      setBackupMessage('Master backup file generated and downloaded successfully!');
    } catch (err: any) {
      console.error(err);
      setBackupStatus('error');
      setBackupMessage(err.message || 'Failed to export application backup.');
    }
  };

  const handleExportCSV = (collectionName: 'Customers' | 'Repairs' | 'Inventory') => {
    setBackupStatus('exporting');
    setBackupMessage(`Generating ${collectionName} spreadsheet (.CSV)...`);
    try {
      const convertToCSV = (headers: string[], rows: any[][]): string => {
        const escapeField = (val: any) => {
          if (val === null || val === undefined) return '';
          let str = String(val);
          str = str.replace(/"/g, '""');
          if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
            return `"${str}"`;
          }
          return str;
        };

        const headerLine = headers.map(escapeField).join(',');
        const rowLines = rows.map(row => row.map(escapeField).join(','));
        return [headerLine, ...rowLines].join('\n');
      };

      let headers: string[] = [];
      let rows: any[][] = [];
      const timestamp = new Date().toISOString().split('T')[0];

      if (collectionName === 'Customers') {
        headers = ['Phone Number', 'Name', 'Email', 'Total Orders', 'Last Visit'];
        rows = (customers || []).map(c => [
          c.phoneNumber || '',
          c.name || '',
          c.email || '',
          c.totalOrders || 0,
          c.lastVisit || ''
        ]);
      } else if (collectionName === 'Inventory') {
        headers = ['ID', 'Name', 'Category', 'Quantity', 'Price (INR)', 'Unit', 'Min Threshold', 'Barcode'];
        rows = (inventory || []).map(i => [
          i.id || '',
          i.name || '',
          i.category || '',
          i.quantity || 0,
          i.price || 0,
          i.unit || '',
          i.minThreshold || 0,
          i.barcode || ''
        ]);
      } else if (collectionName === 'Repairs') {
        headers = [
          'ID', 'Invoice Number', 'Customer Name', 'Phone Number', 'Email',
          'Shoe Model', 'Color', 'Size', 'Status', 'Priority', 'Price (INR)',
          'Advance Paid (INR)', 'Balance (INR)', 'Due Date', 'Created At',
          'Received By', 'Payment Status', 'Payment Method', 'Transaction ID',
          'Assigned Cobbler', 'Services', 'Addons Description', 'Addon Price (INR)',
          'Has Insurance', 'Insurance Type', 'Insurance Price (INR)', 'Applied Offer'
        ];
        rows = (repairs || []).map(r => [
          r.id || '',
          r.invoiceNumber || '',
          r.customerName || '',
          r.phoneNumber || '',
          r.email || '',
          r.shoeModel || '',
          r.shoeColor || '',
          r.shoeSize || '',
          r.status || '',
          r.priority || '',
          r.price || 0,
          r.advance || 0,
          r.balance || 0,
          r.dueDate || '',
          r.createdAt || '',
          r.receivedBy || '',
          r.paymentStatus || 'Unpaid',
          r.paymentMethod || 'None',
          r.transactionId || '',
          r.assignedCobblerName || '',
          (r.repairType || []).join('; '),
          r.addonType || '',
          r.addonPrice || 0,
          r.hasInsurance ? 'Yes' : 'No',
          r.insuranceType || '',
          r.insurancePrice || 0,
          r.appliedOfferCode || ''
        ]);
      }

      const csvContent = convertToCSV(headers, rows);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `cordwainers_${collectionName.toLowerCase()}_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setBackupStatus('success');
      setBackupMessage(`${collectionName} collection exported successfully!`);
    } catch (err: any) {
      console.error(err);
      setBackupStatus('error');
      setBackupMessage(err.message || `Failed to export ${collectionName} collection.`);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackupStatus('restoring');
    setBackupMessage('Reading backup file...');
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const backupData = JSON.parse(content);
        
        setBackupMessage('Restoring configurations & records to database...');
        await importBackup(backupData);
        
        setBackupStatus('success');
        setBackupMessage('Application configuration and records successfully restored!');
      } catch (err: any) {
        console.error("Backup file import failed", err);
        setBackupStatus('error');
        setBackupMessage(`Restoration failed: ${err?.message || 'Invalid or corrupted file.'}`);
      }
    };
    reader.onerror = () => {
      setBackupStatus('error');
      setBackupMessage('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const googleAppsScriptCode = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    if (data.action === 'test') {
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Connection successful!' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'syncRepairs') {
      var repairs = data.repairs;
      // Add header row if sheet is empty
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "Invoice Number", "Date", "Customer Name", "Phone Number", "Email",
          "Shoe Model", "Shoe Size", "Leather Type", "Price", "Status",
          "Services", "Advance Paid", "Received By"
        ]);
      }
      
      for (var i = 0; i < repairs.length; i++) {
        var r = repairs[i];
        sheet.appendRow([
          r.invoiceNumber || "",
          r.date || "",
          r.customerName || "",
          r.phoneNumber || "",
          r.email || "",
          r.shoeModel || "",
          r.shoeSize || "",
          r.leatherType || "",
          r.price || 0,
          r.status || "",
          (r.repairType || []).join(", "),
          r.advance || 0,
          r.receivedBy || ""
        ]);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', synced: repairs.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!settings.googleSheetsWebAppUrl) {
      setTestStatus('error');
      setTestMessage('Please enter a Web App URL first.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('');

    try {
      const response = await fetch('/api/sync/google-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: settings.googleSheetsWebAppUrl,
          payload: { action: 'test' } 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setTestStatus('success');
        setTestMessage('Connected successfully! Dispatched a test ping. (Google Web App URL reached)');
      } else {
        throw new Error(result.data?.message || result.error || 'Failed to connect to Google Sheets');
      }
    } catch (error: any) {
      console.error('Test connection error:', error);
      setTestStatus('error');
      setTestMessage(error.message || 'Failed to send test ping. Please check the URL.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    updateSettings({ [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-300">
      <header className="flex flex-col items-center justify-center text-center gap-6">
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="font-display text-4xl font-black text-brand-dark tracking-tighter uppercase leading-none text-center">Settings</h2>
          <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] mt-3 text-center">Configure artisan studio parameters</p>
        </div>
        <div className="flex bg-white/60 p-1.5 rounded-2xl md:rounded-full border border-brand-border backdrop-blur-sm justify-start md:justify-center overflow-x-auto max-w-full gap-1.5 w-full scrollbar-none">
          {['Store', 'Stores', 'Store DB', 'Staff', 'Users', 'Integrations', 'Notifications', 'Backup'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "shrink-0 px-4 md:px-6 py-2.5 rounded-xl md:rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab 
                  ? "bg-brand-dark text-white shadow-premium" 
                  : "text-brand-muted hover:text-brand-dark bg-white/40 md:bg-transparent"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {!isAdmin && (
        <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/60 rounded-[28px] p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800">Guest / Staff Preview Profile</h4>
              <p className="text-xs font-semibold leading-relaxed text-amber-900/80">Logged in with preview permissions. Read-only limits are active for studio configs and staff management.</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[28px] sm:rounded-[36px] md:rounded-[40px] border border-brand-border p-4 sm:p-8 md:p-12 shadow-premium relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-accent via-brand-olive to-brand-accent opacity-20" />
        
        {activeTab === 'Stores' && (
          <fieldset disabled={!isAdmin} className="space-y-12 animate-in fade-in duration-300 w-full block border-none p-0 m-0">
            <div className="flex items-center justify-between border-b border-brand-border pb-6 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                  <Database className="w-4 h-4 text-brand-olive" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em]">Manage Locations</h3>
                  <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wider mt-1">Configure and add separate stores & databases</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingStoreId('new');
                  setStoreForm({
                    storeName: '',
                    address: '',
                    hours: 'Mon-Sat: 9AM - 6PM',
                    phone: '',
                    logoUrl: '',
                    paymentLink: '',
                    qrCode: '',
                    isDefault: stores.length === 0,
                    instagramLink: '',
                    facebookLink: '',
                    twitterLink: '',
                    linkedinLink: '',
                    websiteLink: '',
                    whatsappLink: ''
                  });
                }}
                className="bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full hover:bg-brand-olive transition-all shadow-premium"
              >
                + Add New Store
              </button>
            </div>

            {/* Editing / Adding Store Modal */}
            <AnimatePresence>
              {editingStoreId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", duration: 0.4 }}
                    className="bg-white w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-brand-border p-5 sm:p-8 md:p-10 relative my-auto scrollbar-thin space-y-6"
                  >
                    <div className="flex justify-between items-center border-b border-brand-border pb-4 sticky top-0 bg-white z-10 pt-1">
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-brand-dark uppercase tracking-widest">
                          {editingStoreId === 'new' ? 'New Store Setup' : 'Edit Location Details'}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-brand-muted font-medium mt-0.5">Configure store information, operating hours, and location contacts</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setEditingStoreId(null)}
                        className="p-2 hover:bg-brand-bg rounded-full border border-transparent hover:border-brand-border transition-all cursor-pointer"
                        title="Close modal"
                      >
                        <X className="w-5 h-5 text-brand-dark" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest">Store Name</label>
                        <input 
                          type="text" 
                          value={storeForm.storeName}
                          onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                          placeholder="e.g. Cordwainers Studio - Mumbai"
                          className="w-full bg-[#F5F3EC]/60 border border-brand-border rounded-2xl px-5 py-3 text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest">Artisan Hours</label>
                        <input 
                          type="text" 
                          value={storeForm.hours}
                          onChange={(e) => setStoreForm({ ...storeForm, hours: e.target.value })}
                          placeholder="e.g. Mon-Sat: 9AM - 7PM"
                          className="w-full bg-[#F5F3EC]/60 border border-brand-border rounded-2xl px-5 py-3 text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest">Full Address</label>
                        <input 
                          type="text" 
                          value={storeForm.address}
                          onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                          placeholder="e.g. 456, Linking Road, Santacruz West, Mumbai"
                          className="w-full bg-[#F5F3EC]/60 border border-brand-border rounded-2xl px-5 py-3 text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest">Phone Contact</label>
                        <input 
                          type="text" 
                          value={storeForm.phone}
                          onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full bg-[#F5F3EC]/60 border border-brand-border rounded-2xl px-5 py-3 text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest">Logo / Photo URL</label>
                        <input 
                          type="url" 
                          value={storeForm.logoUrl}
                          onChange={(e) => setStoreForm({ ...storeForm, logoUrl: e.target.value })}
                          placeholder="https://..."
                          className="w-full bg-[#F5F3EC]/60 border border-brand-border rounded-2xl px-5 py-3 text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                        />
                      </div>

                      {/* Store Social Network Links Section */}
                      <div className="md:col-span-2 pt-3 border-t border-brand-border/40 space-y-3">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-brand-olive" />
                          <label className="block text-[10px] font-black text-brand-dark uppercase tracking-widest">Store Social Network Links</label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1">
                              <Instagram className="w-3 h-3 text-pink-600" /> Instagram Profile
                            </label>
                            <input 
                              type="url" 
                              value={storeForm.instagramLink}
                              onChange={(e) => setStoreForm({ ...storeForm, instagramLink: e.target.value })}
                              placeholder="https://instagram.com/yourstore"
                              className="w-full bg-[#F5F3EC]/60 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1">
                              <Facebook className="w-3 h-3 text-blue-600" /> Facebook Page
                            </label>
                            <input 
                              type="url" 
                              value={storeForm.facebookLink}
                              onChange={(e) => setStoreForm({ ...storeForm, facebookLink: e.target.value })}
                              placeholder="https://facebook.com/yourstore"
                              className="w-full bg-[#F5F3EC]/60 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1">
                              <Twitter className="w-3 h-3 text-sky-500" /> Twitter / X Profile
                            </label>
                            <input 
                              type="url" 
                              value={storeForm.twitterLink}
                              onChange={(e) => setStoreForm({ ...storeForm, twitterLink: e.target.value })}
                              placeholder="https://x.com/yourstore"
                              className="w-full bg-[#F5F3EC]/60 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1">
                              <Linkedin className="w-3 h-3 text-indigo-600" /> LinkedIn Profile
                            </label>
                            <input 
                              type="url" 
                              value={storeForm.linkedinLink || ''}
                              onChange={(e) => setStoreForm({ ...storeForm, linkedinLink: e.target.value })}
                              placeholder="https://linkedin.com/company/yourstore"
                              className="w-full bg-[#F5F3EC]/60 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1">
                              <Globe className="w-3 h-3 text-emerald-600" /> Website / Shop Link
                            </label>
                            <input 
                              type="url" 
                              value={storeForm.websiteLink}
                              onChange={(e) => setStoreForm({ ...storeForm, websiteLink: e.target.value })}
                              placeholder="https://yourstore.com"
                              className="w-full bg-[#F5F3EC]/60 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="block text-[9px] font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1">
                              <Phone className="w-3 h-3 text-green-600" /> WhatsApp Line / Link
                            </label>
                            <input 
                              type="text" 
                              value={storeForm.whatsappLink}
                              onChange={(e) => setStoreForm({ ...storeForm, whatsappLink: e.target.value })}
                              placeholder="https://wa.me/919876543210 or +91 98765 43210"
                              className="w-full bg-[#F5F3EC]/60 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Default Store Toggle Option */}
                      <div className="md:col-span-2 bg-[#F5F3EC]/60 p-4 rounded-2xl border border-brand-border flex items-center justify-between cursor-pointer hover:bg-[#F5F3EC] transition-all" onClick={() => setStoreForm({ ...storeForm, isDefault: !storeForm.isDefault })}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${storeForm.isDefault ? 'bg-amber-100 text-amber-700' : 'bg-brand-bg text-brand-muted'}`}>
                            <Star className={`w-4 h-4 ${storeForm.isDefault ? 'fill-amber-500 text-amber-500' : ''}`} />
                          </div>
                          <div>
                            <span className="text-xs font-black text-brand-dark uppercase tracking-wider block">Set as Default Store Location</span>
                            <p className="text-[10px] text-brand-muted font-medium">Auto-selects this store workspace whenever the application launches</p>
                          </div>
                        </div>
                        <input 
                          type="checkbox"
                          checked={storeForm.isDefault}
                          onChange={(e) => setStoreForm({ ...storeForm, isDefault: e.target.checked })}
                          className="w-5 h-5 accent-brand-dark rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-brand-border mt-6">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!storeForm.storeName || !storeForm.address) {
                            alert('Please fill out Store Name and Address');
                            return;
                          }
                          if (editingStoreId === 'new') {
                            await addStore(storeForm);
                          } else {
                            await updateStore(editingStoreId, storeForm);
                          }
                          setEditingStoreId(null);
                        }}
                        className="w-full sm:w-auto bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest px-8 py-3.5 rounded-full hover:bg-brand-olive active:scale-[0.98] transition-all shadow-premium cursor-pointer"
                      >
                        Save Store Setup
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingStoreId(null)}
                        className="w-full sm:w-auto border border-brand-border text-brand-dark text-[10px] font-black uppercase tracking-widest px-8 py-3.5 rounded-full hover:bg-brand-bg transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* List of Existing Stores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
              {stores.map((store: any) => (
                <SwipeToDelete
                  key={store.id}
                  itemName={store.storeName}
                  onDelete={() => handleInitiateStoreDelete(store)}
                >
                  <div className={`bg-white p-6 space-y-4 relative overflow-hidden animate-in fade-in duration-300 w-full rounded-2xl border ${store.isDefault ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-brand-border'}`}>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-display text-lg font-bold text-brand-dark leading-snug">{store.storeName}</h4>
                          {store.isDefault && (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-amber-300">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              Default Store
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest mt-1">Location ID: {store.id}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {!store.isDefault && (
                          <button
                            onClick={() => setDefaultStore(store.id)}
                            className="text-[10px] font-black text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer border border-amber-200"
                            title="Set as Default Store"
                          >
                            <Star className="w-3 h-3 text-amber-500" />
                            Make Default
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingStoreId(store.id);
                            setStoreForm({
                              storeName: store.storeName,
                              address: store.address,
                              hours: store.hours,
                              phone: store.phone || '',
                              logoUrl: store.logoUrl || '',
                              paymentLink: store.paymentLink || '',
                              qrCode: store.qrCode || '',
                              isDefault: store.isDefault === true,
                              instagramLink: store.instagramLink || '',
                              facebookLink: store.facebookLink || '',
                              twitterLink: store.twitterLink || '',
                              linkedinLink: store.linkedinLink || '',
                              websiteLink: store.websiteLink || '',
                              whatsappLink: store.whatsappLink || ''
                            });
                          }}
                          className="text-[10px] font-black text-brand-olive uppercase tracking-widest hover:text-brand-dark cursor-pointer"
                        >
                          Edit details
                        </button>
                        {stores.length > 1 && (
                          <button
                            onClick={() => handleInitiateStoreDelete(store)}
                            className="text-[10px] font-black text-red-600 hover:text-red-800 uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-brand-border/40 pt-4">
                      <p className="text-xs text-brand-dark font-medium">
                        <span className="font-bold text-brand-muted">Address:</span> {store.address}
                      </p>
                      <p className="text-xs text-brand-dark font-medium">
                        <span className="font-bold text-brand-muted">Hours:</span> {store.hours}
                      </p>
                      {store.phone && (
                        <p className="text-xs text-brand-dark font-medium">
                          <span className="font-bold text-brand-muted">Phone:</span> {store.phone}
                        </p>
                      )}

                      {/* Store Social Links Display */}
                      {(store.instagramLink || store.facebookLink || store.twitterLink || store.linkedinLink || store.websiteLink || store.whatsappLink) && (
                        <div className="pt-3 border-t border-brand-border/30 flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-black text-brand-muted uppercase tracking-wider block w-full sm:w-auto mr-1">Social Links:</span>
                          {store.instagramLink && (
                            <a href={store.instagramLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-pink-50 text-pink-700 hover:bg-pink-100 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border border-pink-200">
                              <Instagram className="w-3 h-3 text-pink-600" /> Instagram
                            </a>
                          )}
                          {store.facebookLink && (
                            <a href={store.facebookLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border border-blue-200">
                              <Facebook className="w-3 h-3 text-blue-600" /> Facebook
                            </a>
                          )}
                          {store.twitterLink && (
                            <a href={store.twitterLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 hover:bg-sky-100 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border border-sky-200">
                              <Twitter className="w-3 h-3 text-sky-500" /> X / Twitter
                            </a>
                          )}
                          {store.linkedinLink && (
                            <a href={store.linkedinLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border border-indigo-200">
                              <Linkedin className="w-3 h-3 text-indigo-600" /> LinkedIn
                            </a>
                          )}
                          {store.websiteLink && (
                            <a href={store.websiteLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border border-emerald-200">
                              <Globe className="w-3 h-3 text-emerald-600" /> Website
                            </a>
                          )}
                          {store.whatsappLink && (
                            <a href={store.whatsappLink.startsWith('http') ? store.whatsappLink : `https://wa.me/${store.whatsappLink.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border border-green-200">
                              <Phone className="w-3 h-3 text-green-600" /> WhatsApp
                            </a>
                          )}
                        </div>
                      )}

                      {/* Store Database Details */}
                      <div className="pt-3 border-t border-brand-border/40 bg-brand-bg/20 p-3 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-brand-dark">
                          <span className="flex items-center gap-1">
                            <Database className="w-3 h-3 text-brand-olive" /> Firestore Document Path:
                          </span>
                          <span className="font-mono text-brand-accent">/stores/{store.id}</span>
                        </div>
                        <p className="text-[9px] text-brand-muted font-medium">
                          Subcollections: <span className="font-mono text-brand-dark">repairs, customers, inventory, appointments, staff</span>
                        </p>
                        <div className="flex items-center justify-between pt-1 text-[9px] font-bold">
                          <span className={store.id === currentStoreId ? "text-emerald-700 font-black" : "text-brand-muted"}>
                            {store.id === currentStoreId ? "● Active Loaded Database Context" : "Isolated DB Node"}
                          </span>
                          <button
                            type="button"
                            onClick={() => createStoreBackup(store.id)}
                            className="text-[9px] font-black text-brand-olive hover:text-brand-dark uppercase tracking-wider underline cursor-pointer"
                          >
                            Export DB Backup
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwipeToDelete>
              ))}
            </div>
          </fieldset>
        )}

        {activeTab === 'Store DB' && (
          <fieldset disabled={!isAdmin} className="space-y-10 animate-in fade-in duration-300 w-full block border-none p-0 m-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-border pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-dark text-white flex items-center justify-center shadow-md">
                  <Database className="w-5 h-5 text-brand-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-brand-dark uppercase tracking-[0.2em]">Store Database & Firestore Specs</h3>
                  <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wider mt-0.5">
                    Live store database documents, collections schema, and real-time sync metrics
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => syncAllPending()}
                  className="inline-flex items-center gap-2 bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full hover:bg-brand-olive transition-all cursor-pointer shadow-premium"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync Firestore DB
                </button>
              </div>
            </div>

            {/* Firestore Global Config Specs */}
            <div className="bg-gradient-to-br from-brand-bg/80 via-white to-brand-bg/40 p-6 md:p-8 rounded-[32px] border border-brand-border/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-brand-border/40 pb-4">
                <div>
                  <span className="text-[9px] font-black text-brand-accent uppercase tracking-[0.25em] block">Firestore Target Project DB</span>
                  <p className="text-xs md:text-sm font-mono font-black text-brand-dark mt-0.5 break-all">
                    ai-studio-shoerepaircobble-4df45754-d7c2-4b18-965d-93834f094599
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-full border border-emerald-200">
                  <Wifi className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Real-Time Sync Online</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-brand-border/60 space-y-1">
                  <span className="text-[9px] font-black text-brand-muted uppercase tracking-wider block">Active Store DB Path</span>
                  <p className="text-xs font-mono font-bold text-brand-dark truncate">/stores/{currentStoreId}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-brand-border/60 space-y-1">
                  <span className="text-[9px] font-black text-brand-muted uppercase tracking-wider block">Default Store DB</span>
                  <p className="text-xs font-bold text-amber-800 flex items-center gap-1 truncate">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                    {defaultStoreObj?.storeName || 'Cordwainers Studio'}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-brand-border/60 space-y-1">
                  <span className="text-[9px] font-black text-brand-muted uppercase tracking-wider block">Offline Queue Buffer</span>
                  <p className="text-xs font-black text-brand-dark">{offlineQueue.length} pending writes</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-brand-border/60 space-y-1">
                  <span className="text-[9px] font-black text-brand-muted uppercase tracking-wider block">Last DB Sync</span>
                  <p className="text-xs font-bold text-brand-dark">
                    {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Live'}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Store Collection Documents Metrics */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em] flex items-center gap-2">
                  <Database className="w-4 h-4 text-brand-olive" />
                  Active Store Database Subcollections (/stores/{currentStoreId})
                </h4>
                <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">
                  Store: <strong className="text-brand-dark">{activeStoreObj?.storeName}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-brand-border text-center space-y-2 hover:border-brand-olive transition-colors shadow-sm">
                  <span className="text-2xl font-black text-brand-dark block">{repairs.length}</span>
                  <div>
                    <span className="text-[10px] font-black text-brand-dark uppercase tracking-wider block">Repairs</span>
                    <span className="text-[8px] font-mono text-brand-muted">.../repairs</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-brand-border text-center space-y-2 hover:border-brand-olive transition-colors shadow-sm">
                  <span className="text-2xl font-black text-brand-dark block">{customers.length}</span>
                  <div>
                    <span className="text-[10px] font-black text-brand-dark uppercase tracking-wider block">Customers</span>
                    <span className="text-[8px] font-mono text-brand-muted">.../customers</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-brand-border text-center space-y-2 hover:border-brand-olive transition-colors shadow-sm">
                  <span className="text-2xl font-black text-brand-dark block">{inventory.length}</span>
                  <div>
                    <span className="text-[10px] font-black text-brand-dark uppercase tracking-wider block">Inventory</span>
                    <span className="text-[8px] font-mono text-brand-muted">.../inventory</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-brand-border text-center space-y-2 hover:border-brand-olive transition-colors shadow-sm">
                  <span className="text-2xl font-black text-brand-dark block">{appointments.length}</span>
                  <div>
                    <span className="text-[10px] font-black text-brand-dark uppercase tracking-wider block">Bookings</span>
                    <span className="text-[8px] font-mono text-brand-muted">.../appointments</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-brand-border text-center space-y-2 hover:border-brand-olive transition-colors shadow-sm">
                  <span className="text-2xl font-black text-brand-dark block">{profiles.length}</span>
                  <div>
                    <span className="text-[10px] font-black text-brand-dark uppercase tracking-wider block">Staff / Team</span>
                    <span className="text-[8px] font-mono text-brand-muted">.../staff</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-brand-border text-center space-y-2 hover:border-brand-olive transition-colors shadow-sm">
                  <span className="text-2xl font-black text-brand-dark block">{messages.length}</span>
                  <div>
                    <span className="text-[10px] font-black text-brand-dark uppercase tracking-wider block">Messages</span>
                    <span className="text-[8px] font-mono text-brand-muted">.../messages</span>
                  </div>
                </div>
              </div>
            </div>

            {/* All Registered Store Locations in Database */}
            <div className="space-y-4 pt-4 border-t border-brand-border">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em]">Registered Stores Collection (/stores)</h4>
                  <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wider mt-0.5">
                    {stores.length} store location documents configured in Firestore database
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-brand-border rounded-2xl bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-brand-bg/60 border-b border-brand-border text-[9px] font-black text-brand-muted uppercase tracking-widest">
                      <th className="p-4">Store Name</th>
                      <th className="p-4">Document ID</th>
                      <th className="p-4">Firestore Path</th>
                      <th className="p-4">DB Role</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/40 font-medium">
                    {stores.map((s: any) => {
                      const isActive = s.id === currentStoreId;
                      return (
                        <tr key={s.id} className={isActive ? 'bg-amber-50/40 font-bold' : 'hover:bg-brand-bg/30'}>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-brand-dark">{s.storeName}</span>
                              {s.isDefault && (
                                <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-300">
                                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Default
                                </span>
                              )}
                              {isActive && (
                                <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-300">
                                  Active Context
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-mono text-[10px] text-brand-muted">{s.id}</td>
                          <td className="p-4 font-mono text-[10px] text-brand-dark">/stores/{s.id}</td>
                          <td className="p-4 text-[10px]">
                            {s.isDefault ? 'Primary Default Store' : 'Isolated Branch Store'}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {!isActive && (
                              <button
                                type="button"
                                onClick={() => setCurrentStoreId(s.id)}
                                className="bg-brand-dark text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-brand-olive transition-all cursor-pointer"
                              >
                                Load DB
                              </button>
                            )}
                            {!s.isDefault && (
                              <button
                                type="button"
                                onClick={() => setDefaultStore(s.id)}
                                className="bg-amber-50 text-amber-900 border border-amber-300 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-all cursor-pointer"
                              >
                                Make Default DB
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => createStoreBackup(s.id)}
                              className="bg-brand-bg border border-brand-border text-brand-dark text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-white transition-all cursor-pointer"
                            >
                              Export JSON
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </fieldset>
        )}

        {activeTab === 'Store' && (
          <fieldset disabled={!isAdmin} className="space-y-12 w-full block border-none p-0 m-0">
            {/* Store Details */}
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                    <Database className="w-4 h-4 text-brand-olive" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em]">Identity & Locale</h3>
                    <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wider mt-0.5">
                      Active Store: <span className="text-brand-dark font-black">{activeStoreObj?.storeName || 'Cordwainers Studio'}</span>
                      {activeStoreObj?.isDefault && (
                        <span className="ml-2 inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-amber-300">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          Default Store
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {defaultStoreObj && defaultStoreObj.id !== currentStoreId && (
                  <button
                    type="button"
                    onClick={handleSyncFromDefaultStore}
                    className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    Load Default Store Details
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-brand-muted mb-2 uppercase tracking-widest">Studio Brand Identity (Logo URL)</label>
                  <div className="flex gap-6 items-center bg-brand-bg/30 p-6 rounded-[32px] border border-brand-border/40">
                    {settings.logoUrl ? (
                      <div className="w-24 h-24 rounded-2xl bg-white border border-brand-border p-4 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                        <img src={settings.logoUrl} alt="Store Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-brand-border flex flex-col items-center justify-center shrink-0">
                        <Link className="w-6 h-6 text-brand-muted opacity-30" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <input 
                        type="url" 
                        name="logoUrl" 
                        value={localFields.logoUrl || ''} 
                        onChange={handleLocalChange}
                        onBlur={handleBlur}
                        placeholder="https://artisan.com/logo.png"
                        className="w-full bg-white border border-brand-border rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-medium" 
                      />
                      <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest leading-relaxed">Provide a public URL for your high-fidelity brand mark.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-brand-muted mb-2 uppercase tracking-widest">Studio Name</label>
                  <input type="text" name="storeName" value={localFields.storeName || ''} onChange={handleLocalChange} onBlur={handleBlur}
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-display text-lg font-bold" />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-brand-muted mb-2 uppercase tracking-widest">Artisan Hours</label>
                  <input type="text" name="hours" value={localFields.hours || ''} onChange={handleLocalChange} onBlur={handleBlur}
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-medium" />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[10px] font-black text-brand-muted mb-2 uppercase tracking-widest">Geographic Anchor (Address)</label>
                  <input type="text" name="address" value={localFields.address || ''} onChange={handleLocalChange} onBlur={handleBlur}
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-medium" />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[10px] font-black text-brand-muted mb-2 uppercase tracking-widest">The Artisan Philosophy (Bio)</label>
                  <textarea name="cobblerBio" rows={4} value={localFields.cobblerBio || ''} onChange={handleLocalChange} onBlur={handleBlur}
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-[32px] px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-medium leading-relaxed" />
                </div>

                {/* Social Links Section */}
                <div className="md:col-span-2 border-t border-brand-border/40 pt-6 mt-2 space-y-4">
                  <h4 className="text-xs font-black text-brand-dark uppercase tracking-widest flex items-center gap-2">
                    <Link className="w-4 h-4 text-brand-accent" />
                    Digital Connectivity (Social & Website Links)
                  </h4>
                  <p className="text-[9px] text-brand-muted font-bold uppercase tracking-wider">Configure your social presence links for ticket templates, communication campaigns, and receipts.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <Instagram className="w-3.5 h-3.5 text-brand-olive" /> Instagram Link
                      </label>
                      <input 
                        type="url" 
                        name="instagramLink" 
                        value={localFields.instagramLink || ''} 
                        onChange={handleLocalChange}
                        onBlur={handleBlur}
                        placeholder="https://instagram.com/yourbrand"
                        className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-5 py-3 text-xs focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <Facebook className="w-3.5 h-3.5 text-brand-olive" /> Facebook Page
                      </label>
                      <input 
                        type="url" 
                        name="facebookLink" 
                        value={localFields.facebookLink || ''} 
                        onChange={handleLocalChange}
                        onBlur={handleBlur}
                        placeholder="https://facebook.com/yourbrand"
                        className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-5 py-3 text-xs focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <Twitter className="w-3.5 h-3.5 text-brand-olive" /> Twitter / X Link
                      </label>
                      <input 
                        type="url" 
                        name="twitterLink" 
                        value={localFields.twitterLink || ''} 
                        onChange={handleLocalChange}
                        onBlur={handleBlur}
                        placeholder="https://twitter.com/yourbrand"
                        className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-5 py-3 text-xs focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <Linkedin className="w-3.5 h-3.5 text-brand-olive" /> LinkedIn Company
                      </label>
                      <input 
                        type="url" 
                        name="linkedinLink" 
                        value={localFields.linkedinLink || ''} 
                        onChange={handleLocalChange}
                        onBlur={handleBlur}
                        placeholder="https://linkedin.com/company/yourbrand"
                        className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-5 py-3 text-xs focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" 
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <Globe className="w-3.5 h-3.5 text-brand-olive" /> Brand Website URL
                      </label>
                      <input 
                        type="url" 
                        name="websiteLink" 
                        value={localFields.websiteLink || ''} 
                        onChange={handleLocalChange}
                        onBlur={handleBlur}
                        placeholder="https://yourbrand.com"
                        className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-5 py-3.5 text-xs focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Interface */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-brand-border pb-4">
                <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-brand-olive" />
                </div>
                <h3 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em]">Atmosphere</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['light', 'dark', 'olive'].map(theme => (
                  <button
                    key={theme}
                    onClick={() => updateSettings({ theme: theme as any })}
                    className={clsx(
                      "p-6 rounded-[32px] border transition-all text-left group",
                      settings.theme === theme 
                        ? "bg-brand-dark border-brand-dark shadow-lg scale-[1.02]" 
                        : "bg-white border-brand-border hover:bg-brand-bg"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <span className={clsx(
                        "text-[10px] font-black uppercase tracking-[0.2em]",
                        settings.theme === theme ? "text-white" : "text-brand-dark"
                      )}>
                        {theme.charAt(0).toUpperCase() + theme.slice(1)} Palette
                      </span>
                      {settings.theme === theme && <CheckCircle className="w-5 h-5 text-brand-accent" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button Container */}
            <div className="flex items-center gap-4 pt-8 border-t border-brand-border/40 mt-12">
              <button
                type="button"
                onClick={() => {
                  updateSettings(localFields);
                  setStoreSaved(true);
                  setTimeout(() => setStoreSaved(false), 3000);
                }}
                className="bg-brand-dark text-white text-xs font-black uppercase tracking-widest px-8 py-4 rounded-full hover:bg-brand-olive hover:scale-[1.02] active:scale-[0.98] transition-all shadow-premium flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Store Details
              </button>
              {storeSaved && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs font-bold text-brand-olive uppercase tracking-wider flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Store details saved successfully!
                </motion.span>
              )}
            </div>
          </fieldset>
        )}

        {activeTab === 'Staff' && (
          <fieldset disabled={!isAdmin} className="space-y-12 w-full block border-none p-0 m-0">
            {/* Employees */}
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-border pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                    <Database className="w-4 h-4 text-brand-olive" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em]">Concierge Team</h3>
                    <p className="text-[10px] text-brand-muted uppercase font-bold tracking-wider mt-0.5">Front desk and intake specialists</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    updateSettings({
                      employees: [...(settings.employees || []), { id: Date.now().toString(), name: 'New Concierge Staff', role: 'Concierge Specialist', mobile: '', email: '' }]
                    });
                    setTimeout(() => {
                      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    }, 100);
                  }} 
                  className="w-full sm:w-auto px-6 py-3 bg-brand-dark text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-olive active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  + Deploy Personnel
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {settings.employees?.map((emp, index) => (
                  <SwipeToDelete
                    key={emp.id}
                    itemName={emp.name || 'this staff member'}
                    onDelete={() => {
                      const newItems = (settings.employees || []).filter((_: any, i: number) => i !== index);
                      updateSettings({ employees: newItems });
                    }}
                    confirmMessage={`Are you sure you want to dismiss "${emp.name || 'this staff member'}" from the concierge team?`}
                  >
                    <EmployeeCard emp={emp} index={index} settings={settings} updateSettings={updateSettings} />
                  </SwipeToDelete>
                ))}
              </div>
            </div>

            {/* Cobblers */}
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-border pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                    <Database className="w-4 h-4 text-brand-olive" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em]">Master Cobblers</h3>
                    <p className="text-[10px] text-brand-muted uppercase font-bold tracking-wider mt-0.5">Restoration and cordwainer artisans</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    updateSettings({
                      cobblers: [...(settings.cobblers || []), { id: Date.now().toString(), name: 'New Master Artisan', specialty: 'General Cordwainer', mobile: '', email: '' }]
                    });
                    setTimeout(() => {
                      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    }, 100);
                  }} 
                  className="w-full sm:w-auto px-6 py-3 bg-brand-dark text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-olive active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  + Enlist Artisan
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {settings.cobblers?.map((cobbler, index) => (
                  <SwipeToDelete
                    key={cobbler.id}
                    itemName={cobbler.name || 'this cobbler'}
                    onDelete={() => {
                      const newItems = settings.cobblers.filter((_, i) => i !== index);
                      updateSettings({ cobblers: newItems });
                    }}
                    confirmMessage={`Are you sure you want to dismiss "${cobbler.name || 'this cobbler'}" from the enlisted artisans?`}
                  >
                    <CobblerCard cobbler={cobbler} index={index} settings={settings} updateSettings={updateSettings} />
                  </SwipeToDelete>
                ))}
              </div>
            </div>

          </fieldset>
        )}

        {activeTab === 'Users' && (
          <fieldset disabled={!isAdmin} className="space-y-12 w-full block border-none p-0 m-0">
            {/* Studio Access Accounts & Credentials - Admin Only */}
            {isAdmin && (
              <div className="space-y-8 mt-12">
                <div className="flex items-center justify-between border-b border-brand-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                      <Database className="w-4 h-4 text-brand-olive" />
                    </div>
                    <h3 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em]">Studio Access Accounts</h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setAddUserError(null);
                      setShowAddUserModal(true);
                    }} 
                    className="px-6 py-2 bg-brand-bg border border-brand-border rounded-full text-[10px] font-black text-brand-dark uppercase tracking-widest hover:bg-brand-dark hover:text-white transition-all flex items-center gap-2 cursor-pointer"
                  >
                    Create New Account
                  </button>
                </div>

                {/* Add User Modal Dialog */}
                <AnimatePresence>
                  {showAddUserModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.4 }}
                        className="bg-white w-full max-w-xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-brand-border p-5 sm:p-8 md:p-10 relative my-auto scrollbar-thin space-y-5"
                      >
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#F5F3EC] rounded-full filter blur-3xl opacity-50 -z-10" />
                        
                        <div className="flex items-center justify-between border-b border-brand-border pb-5 mb-6">
                          <div>
                            <h4 className="text-base font-black text-brand-dark tracking-tight">Create Staff Account</h4>
                            <p className="text-xs text-brand-muted font-medium mt-1">Register a new studio artisan or administrator</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAddUserModal(false)}
                            className="p-2.5 hover:bg-brand-bg rounded-full border border-transparent hover:border-brand-border transition-all cursor-pointer"
                          >
                            <X className="w-5 h-5 text-brand-dark" />
                          </button>
                        </div>

                        {addUserError && (
                          <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-800 flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                            <p>{addUserError}</p>
                          </div>
                        )}

                        <form onSubmit={handleAddUser} className="space-y-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Full Name */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-black text-brand-dark uppercase tracking-widest ml-3">
                                Full Name
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Liam Cobbler"
                                value={newUserForm.displayName}
                                onChange={(e) => setNewUserForm({ ...newUserForm, displayName: e.target.value })}
                                className="w-full bg-[#F5F3EC]/70 border border-brand-border rounded-2xl px-5 py-3.5 text-xs text-brand-dark font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-brand-accent/10 transition-all placeholder:text-brand-muted/40"
                              />
                            </div>

                            {/* Login Username */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-black text-brand-dark uppercase tracking-widest ml-3">
                                Login Username
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. liam123"
                                value={newUserForm.username}
                                onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                                className="w-full bg-[#F5F3EC]/70 border border-brand-border rounded-2xl px-5 py-3.5 text-xs text-brand-dark font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-brand-accent/10 transition-all placeholder:text-brand-muted/40 font-mono"
                              />
                            </div>

                            {/* Email Address */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-black text-brand-dark uppercase tracking-widest ml-3">
                                Email Address
                              </label>
                              <input
                                type="email"
                                required
                                placeholder="e.g. liam@cordwainers.com"
                                value={newUserForm.email}
                                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                className="w-full bg-[#F5F3EC]/70 border border-brand-border rounded-2xl px-5 py-3.5 text-xs text-brand-dark font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-brand-accent/10 transition-all placeholder:text-brand-muted/40"
                              />
                            </div>

                            {/* Mobile Number */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-black text-brand-dark uppercase tracking-widest ml-3">
                                Mobile Number
                              </label>
                              <input
                                type="tel"
                                placeholder="e.g. +91 9876543210"
                                value={newUserForm.mobile}
                                onChange={(e) => setNewUserForm({ ...newUserForm, mobile: e.target.value })}
                                className="w-full bg-[#F5F3EC]/70 border border-brand-border rounded-2xl px-5 py-3.5 text-xs text-brand-dark font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-brand-accent/10 transition-all placeholder:text-brand-muted/40"
                              />
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between pr-2">
                                <label className="block text-[10px] font-black text-brand-dark uppercase tracking-widest ml-3">
                                  Password
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
                                    let randPassword = "";
                                    for (let i = 0; i < 12; i++) {
                                      randPassword += chars.charAt(Math.floor(Math.random() * chars.length));
                                    }
                                    setNewUserForm({ ...newUserForm, password: randPassword });
                                  }}
                                  className="text-[9px] font-black text-brand-accent uppercase tracking-wider cursor-pointer hover:underline"
                                >
                                  Generate
                                </button>
                              </div>
                              <input
                                type="text"
                                required
                                placeholder="Min 6 characters"
                                value={newUserForm.password}
                                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                className="w-full bg-[#F5F3EC]/70 border border-brand-border rounded-2xl px-5 py-3.5 text-xs text-brand-dark font-bold outline-none focus:bg-white focus:ring-4 focus:ring-brand-accent/10 transition-all placeholder:text-brand-muted/40 font-mono text-brand-accent"
                              />
                            </div>

                            {/* Role */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-black text-brand-dark uppercase tracking-widest ml-3">
                                Account Role
                              </label>
                              <select
                                value={newUserForm.role}
                                onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as 'Admin' | 'Staff' })}
                                className="w-full bg-[#F5F3EC]/70 border border-brand-border rounded-2xl px-5 py-3.5 text-xs text-brand-dark font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-brand-accent/10 transition-all cursor-pointer"
                              >
                                <option value="Staff">Staff (Read-Only/Limited)</option>
                                <option value="Admin">Admin (Full Access)</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 pt-4 border-t border-brand-border mt-6">
                            <button
                              type="button"
                              onClick={() => setShowAddUserModal(false)}
                              className="px-6 py-3.5 bg-brand-bg hover:bg-brand-border/30 border border-brand-border text-brand-dark rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-8 py-3.5 bg-brand-dark hover:bg-brand-olive text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer hover:shadow-lg active:scale-[0.98]"
                            >
                              Add Staff Account
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 gap-6">
                  {(settings.userCredentials || []).map((cred, index) => (
                    <SwipeToDelete
                      key={cred.email}
                      itemName={cred.displayName || cred.email}
                      onDelete={() => deleteUserCredential(cred.email)}
                      confirmMessage={`Are you sure you want to delete access for "${cred.displayName || cred.email}"?`}
                    >
                      <CredentialCard 
                        cred={cred} 
                        index={index} 
                        settings={settings}
                        deleteUserCredential={deleteUserCredential} 
                        updateUserCredential={updateUserCredential} 
                        updateSettings={updateSettings}
                        isAdmin={isAdmin} 
                      />
                    </SwipeToDelete>
                  ))}
                </div>
              </div>
            )}
          </fieldset>
        )}

        {activeTab === 'Integrations' && (
          <fieldset disabled={!isAdmin} className="space-y-12 w-full block border-none p-0 m-0">
            {/* Legal Foundations */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-brand-border pb-4">
                <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                  <Database className="w-4 h-4 text-brand-olive" />
                </div>
                <h3 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em]">Legal Foundations</h3>
              </div>
              <textarea name="termsAndConditions" rows={6} value={localFields.termsAndConditions || ''} onChange={handleLocalChange} onBlur={handleBlur}
                placeholder="Artisan service terms..."
                className="w-full bg-brand-bg/30 border border-brand-border rounded-[32px] px-8 py-6 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-medium leading-relaxed italic" />
            </div>

            {/* Cloud Architecture */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-brand-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4 text-brand-olive" />
                  </div>
                  <h3 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em]">Cloud Vault Architecture</h3>
                </div>
                <div className="flex items-center gap-2">
                   {!db ? (
                     <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                       Local-Only Mode
                     </span>
                   ) : lastSyncStatus === 'success' ? (
                     <span className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-[9px] font-black uppercase tracking-widest">
                       Vault Online
                     </span>
                   ) : (
                     <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[9px] font-black uppercase tracking-widest">
                       Sync Pending
                     </span>
                   )}
                </div>
              </div>

              <div className="space-y-6">
                {!db && (
                  <div className="bg-amber-50/60 border border-amber-200 rounded-[32px] p-8 space-y-4 shadow-sm animate-fade-in">
                    <div className="flex items-center gap-2.5 text-amber-800">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <h4 className="text-xs font-black uppercase tracking-widest">Cross-Device Synchronization Guide</h4>
                    </div>
                    <p className="text-xs text-amber-900 font-medium leading-relaxed">
                      Your application is currently running in <strong>Local-Only Mode</strong>. Because local storage is strictly device-specific, updates made on this desktop will not sync to your mobile phone.
                    </p>
                    <div className="space-y-3 text-xs text-amber-800 font-medium">
                      <p className="font-black text-amber-950 uppercase tracking-wider text-[10px]">- Setup Real-Time Sync on Render.com -</p>
                      <p className="leading-relaxed">To connect your deployed app to the Firebase cloud for instant real-time synchronization between desktop and mobile devices, add these settings on Render:</p>
                      <ol className="list-decimal pl-5 space-y-2.5 leading-relaxed">
                        <li>Go to your <strong>Render.com Dashboard</strong> and open your web service.</li>
                        <li>Navigate to the <strong>Environment</strong> tab.</li>
                        <li>Add the following environment variables using your Firebase configuration:
                          <div className="mt-2 font-mono text-[10px] space-y-1.5 text-amber-950 bg-[#FCFAF5] p-4 rounded-2xl border border-amber-200/70 select-all relative group">
                            <p>VITE_FIREBASE_API_KEY=AIzaSyDrv5C8MUyxbAa0peLRWRxK-EDggN0QvmQ</p>
                            <p>VITE_FIREBASE_PROJECT_ID=farmer-s-gate-ddbbf</p>
                            <p>VITE_FIREBASE_AUTH_DOMAIN=farmer-s-gate-ddbbf.firebaseapp.com</p>
                            <p>VITE_FIREBASE_APP_ID=1:506460132530:web:d7c40c58444a12b50465ab</p>
                            <p>VITE_FIREBASE_STORAGE_BUCKET=farmer-s-gate-ddbbf.firebasestorage.app</p>
                            <p>VITE_FIREBASE_MESSAGING_SENDER_ID=506460132530</p>
                            <p>VITE_FIREBASE_DATABASE_ID=ai-studio-shoerepaircobble-4df45754-d7c2-4b18-965d-93834f094599</p>
                          </div>
                        </li>
                        <li>Click <strong>Save Changes</strong>. Render will rebuild and redeploy your applet. It will now securely connect, sync, and instantly display updates on all devices!</li>
                      </ol>
                    </div>
                  </div>
                )}
                <div className="bg-brand-bg/30 p-8 rounded-[32px] border border-brand-border/40 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-6">Google Sheets Web App URL</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input type="url" name="googleSheetsWebAppUrl" value={localFields.googleSheetsWebAppUrl || ''} onChange={handleLocalChange} onBlur={handleBlur}
                        placeholder="https://script.google.com/..."
                        className="flex-1 bg-white border border-brand-border rounded-full px-8 py-4 text-xs focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-mono" />
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testStatus === 'testing'}
                        className="px-8 py-4 bg-brand-dark text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-olive transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {testStatus === 'testing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Test Connectivity
                      </button>
                    </div>
                  </div>

                  {testStatus !== 'idle' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={clsx(
                        "p-6 rounded-[24px] border flex items-start gap-4 text-xs",
                        testStatus === 'success' ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
                      )}
                    >
                      {testStatus === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                      <div>
                        <p className="font-black uppercase tracking-widest">{testStatus === 'success' ? 'Vault Connection Secure' : 'Connectivity Disrupted'}</p>
                        <p className="mt-1 font-medium opacity-80">{testMessage}</p>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="bg-brand-dark text-white rounded-[32px] p-8 shadow-premium border border-brand-dark-surface">
                   <div className="flex items-center gap-3 mb-6">
                     <AlertCircle className="w-5 h-5 text-brand-accent" />
                     <h4 className="text-[11px] font-black uppercase tracking-widest text-brand-bg/80">Diagnostic Center</h4>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <button
                        onClick={handleRetrySync}
                        disabled={isRetryingSync || settings.isOfflineMode}
                        className="flex items-center justify-center gap-2 p-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-30"
                     >
                       <RefreshCw className={clsx("w-4 h-4", isRetryingSync && "animate-spin")} />
                       Manual Sync Flush
                     </button>
                     <button
                        onClick={clearSyncErrorLogs}
                        disabled={syncErrorLogs.length === 0}
                        className="flex items-center justify-center gap-2 p-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-30"
                     >
                       <Trash2 className="w-4 h-4" />
                       Wipe Log Archive
                     </button>
                   </div>

                   {syncErrorLogs.length > 0 && (
                     <div className="mt-6 space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                       {syncErrorLogs.map(log => (
                         <div key={log.id} className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-1">
                           <p className="text-[8px] font-black text-brand-accent uppercase tracking-widest">Fault logged at {new Date(log.timestamp).toLocaleTimeString()}</p>
                           <p className="text-[11px] font-medium opacity-70 italic">"{log.message}"</p>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
              </div>
            </div>

            {/* WhatsApp Templates */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b border-brand-border pb-4">
                <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-brand-olive" />
                </div>
                <h3 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em]">WhatsApp Communication</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-6">Care Intake Confirmation (Received)</label>
                  <textarea name="whatsappIntakeTemplate" value={localFields.whatsappIntakeTemplate || ''} onChange={handleLocalChange} onBlur={handleBlur}
                    placeholder="Hello {customerName}, your shoe repair {repairType} has been received. Ticket: {invoiceNumber}"
                    className="w-full bg-brand-bg/30 border border-brand-border rounded-[24px] px-8 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-6">Ready for Pickup Notification</label>
                  <textarea name="whatsappReadyTemplate" value={localFields.whatsappReadyTemplate || ''} onChange={handleLocalChange} onBlur={handleBlur}
                    placeholder="Great news {customerName}! Your shoes are ready for pickup. Total due: ₹{balance}"
                    className="w-full bg-brand-bg/30 border border-brand-border rounded-[24px] px-8 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" />
                </div>

                <div className="p-6 bg-brand-bg/50 rounded-2xl border border-brand-border/40">
                  <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                    <HelpCircle className="w-3 h-3" />
                    Available Dynamic Placeholders
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['{customerName}', '{repairType}', '{invoiceNumber}', '{status}', '{price}', '{balance}', '{shoeModel}'].map(p => (
                      <code key={p} className="px-2 py-1 bg-white border border-brand-border rounded text-[10px] font-mono text-brand-dark">{p}</code>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
        )}

        {activeTab === 'Notifications' && (
          <fieldset disabled={!isAdmin} className="space-y-12 w-full block border-none p-0 m-0">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-brand-border pb-4">
                <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-brand-olive" />
                </div>
                <h3 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em]">Web Push Notifications</h3>
              </div>
              
              <div className="bg-brand-bg/30 p-8 rounded-[32px] border border-brand-border/40 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-brand-dark">Enable Desktop Notifications</h4>
                    <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Stay updated on repair status and appointments</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {notificationPermission === 'granted' ? (
                      <span className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle className="w-4 h-4" />
                        Enabled
                      </span>
                    ) : notificationPermission === 'denied' ? (
                      <span className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <BellOff className="w-4 h-4" />
                        Blocked
                      </span>
                    ) : (
                      <button
                        onClick={handleRequestPermission}
                        className="px-6 py-3 bg-brand-dark text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-olive transition-all"
                      >
                        Enable Now
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-white rounded-2xl border border-brand-border shadow-sm space-y-4">
                  <p className="text-[11px] text-brand-dark font-medium leading-relaxed">
                    By enabling notifications, you will receive real-time alerts for:
                  </p>
                  <ul className="space-y-2">
                    {[
                      'Customer status updates (Ready for Pickup)',
                      'New appointment confirmations',
                      'Inventory threshold alerts',
                      'Daily studio schedule reminders'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-[10px] font-bold text-brand-muted uppercase tracking-tight">
                        <div className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </fieldset>
        )}

        {activeTab === 'Backup' && (
          <fieldset disabled={!isAdmin} className="space-y-12 animate-in fade-in duration-300 w-full block border-none p-0 m-0">
            {/* Header Description */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 border-b border-brand-border pb-4">
                <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                  <Archive className="w-4 h-4 text-brand-olive" />
                </div>
                <h3 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em]">Disaster Recovery & Backups</h3>
              </div>
              <p className="text-xs font-medium text-brand-muted leading-relaxed max-w-2xl">
                Maintain absolute control over your artisan operations workspace. Export comprehensive snapshots of your stores, orders, and personnel databases, or restore previously generated backups instantly.
              </p>
            </div>

            {/* Dynamic Status Notifications */}
            {backupStatus !== 'idle' && (
              <div className={clsx(
                "p-6 rounded-[24px] border flex items-start gap-4 transition-all duration-300",
                backupStatus === 'exporting' || backupStatus === 'restoring' 
                  ? "bg-brand-bg/80 border-brand-border text-brand-dark" 
                  : backupStatus === 'success'
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
              )}>
                <div className="shrink-0 mt-0.5">
                  {(backupStatus === 'exporting' || backupStatus === 'restoring') ? (
                    <Loader2 className="w-5 h-5 text-brand-olive animate-spin" />
                  ) : backupStatus === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    {backupStatus === 'exporting' && 'Generating snapshot...'}
                    {backupStatus === 'restoring' && 'Restoring database state...'}
                    {backupStatus === 'success' && 'Operation Complete'}
                    {backupStatus === 'error' && 'Execution Interrupted'}
                  </h4>
                  <p className="text-xs font-medium opacity-90">{backupMessage}</p>
                </div>
                <button 
                  onClick={() => setBackupStatus('idle')}
                  className="text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Export & Import Panel */}
              <div className="space-y-8">
                {/* Master Export */}
                <div className="bg-brand-bg/30 p-8 rounded-[32px] border border-brand-border/40 space-y-6">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-brand-dark">Complete Workspace Snapshot</h4>
                    <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest leading-relaxed">
                      Aggregate all registered stores, active concierge personnel, repair requests, customer profiles, and system metadata into a unified JSON archive.
                    </p>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-brand-dark text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-olive transition-all shadow-premium"
                  >
                    <Download className="w-4 h-4" />
                    Download Master Backup (.JSON)
                  </button>
                </div>

                {/* Master Import */}
                <div className="bg-brand-bg/30 p-8 rounded-[32px] border border-brand-border/40 space-y-6">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-brand-dark">Restore Database Configuration</h4>
                    <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest leading-relaxed">
                      Upload any master workspace snapshot or auto-saved store deletion backup file to restore full operational data instantly.
                    </p>
                  </div>
                  <div className="relative group">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportFile}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-brand-border hover:border-brand-dark bg-white rounded-[24px] p-8 text-center transition-all space-y-2">
                      <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center mx-auto">
                        <Upload className="w-4 h-4 text-brand-olive" />
                      </div>
                      <p className="text-xs font-bold text-brand-dark">Drag and drop or select backup file</p>
                      <p className="text-[9px] text-brand-muted font-black uppercase tracking-widest">Supported formats: JSON archive only</p>
                    </div>
                  </div>
                </div>

                {/* Manual CSV Export */}
                <div className="bg-brand-bg/30 p-8 rounded-[32px] border border-brand-border/40 space-y-6">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-brand-dark flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Export Collections to CSV
                    </h4>
                    <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest leading-relaxed">
                      Download modular CSV spreadsheets of individual database collections for custom reporting, spreadsheet analysis, or manual record-keeping.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => handleExportCSV('Customers')}
                      className="flex flex-col items-center justify-center gap-2.5 p-5 bg-white hover:bg-brand-bg border border-brand-border hover:border-brand-dark rounded-2xl transition-all group shadow-sm hover:shadow-md"
                    >
                      <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-brand-dark">Customers</span>
                        <span className="block text-[8px] font-bold text-brand-muted uppercase mt-0.5">{(customers || []).length} Records</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportCSV('Repairs')}
                      className="flex flex-col items-center justify-center gap-2.5 p-5 bg-white hover:bg-brand-bg border border-brand-border hover:border-brand-dark rounded-2xl transition-all group shadow-sm hover:shadow-md"
                    >
                      <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-brand-dark">Repairs</span>
                        <span className="block text-[8px] font-bold text-brand-muted uppercase mt-0.5">{(repairs || []).length} Orders</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportCSV('Inventory')}
                      className="flex flex-col items-center justify-center gap-2.5 p-5 bg-white hover:bg-brand-bg border border-brand-border hover:border-brand-dark rounded-2xl transition-all group shadow-sm hover:shadow-md"
                    >
                      <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Database className="w-4 h-4" />
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-brand-dark">Inventory</span>
                        <span className="block text-[8px] font-bold text-brand-muted uppercase mt-0.5">{(inventory || []).length} Items</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Automatic Location Backups List */}
              <div className="space-y-6">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-brand-dark">Auto-Saved Pre-deletion Backups</h4>
                  <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest">
                    Emergency restore logs generated automatically prior to any studio location deletion.
                  </p>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {backups.length === 0 ? (
                    <div className="border border-dashed border-brand-border/60 rounded-[32px] p-12 text-center bg-brand-bg/10 space-y-3">
                      <Archive className="w-8 h-8 text-brand-muted/40 mx-auto" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-brand-dark">No automatic backups captured</p>
                        <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                          Whenever a store is swiped to delete, its complete internal collections are snapshotted and cataloged here before destruction.
                        </p>
                      </div>
                    </div>
                  ) : (
                    backups.map((bak: any) => {
                      const storeDisplayName = bak.name || bak.data?.storeDetails?.storeName || 'Unknown Studio';
                      const rawStoreName = bak.data?.storeDetails?.storeName || 'Unknown Studio';
                      return (
                        <div key={bak.id} className="bg-white border border-brand-border rounded-2xl p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-xs font-black text-brand-dark uppercase tracking-wider">
                                {storeDisplayName}
                              </h5>
                              <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mt-0.5">
                                Auto-Captured {new Date(bak.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 bg-brand-bg border border-brand-border text-[8px] font-black uppercase tracking-widest rounded text-brand-olive">
                              Store Backup
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to restore "${rawStoreName}" to your active studio locations? This will recreate the store, all of its repairs, inventory, customers, appointments, and credentials.`)) {
                                  setBackupStatus('restoring');
                                  setBackupMessage(`Restoring store location "${rawStoreName}"...`);
                                  try {
                                    await importBackup(bak.data);
                                    setBackupStatus('success');
                                    setBackupMessage(`Successfully restored store "${rawStoreName}" and all associated data records!`);
                                  } catch (err: any) {
                                    setBackupStatus('error');
                                    setBackupMessage(`Restoration failed: ${err.message}`);
                                  }
                                }
                              }}
                              className="flex-1 py-2 bg-brand-dark text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-brand-olive transition-all text-center"
                            >
                              Restore Location
                            </button>
                            <button
                              onClick={() => {
                                const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                                  JSON.stringify(bak.data, null, 2)
                                )}`;
                                const downloadAnchor = document.createElement('a');
                                downloadAnchor.setAttribute('href', jsonString);
                                downloadAnchor.setAttribute('download', `emergency_backup_${bak.data?.storeId || bak.id}.json`);
                                document.body.appendChild(downloadAnchor);
                                downloadAnchor.click();
                                downloadAnchor.remove();
                              }}
                              className="p-2 border border-brand-border hover:bg-brand-bg rounded-full text-brand-dark"
                              title="Download backup file"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Permanently delete this pre-deletion backup log? You will lose the ability to restore this deleted location.`)) {
                                  await deleteBackupRecord(bak.id);
                                }
                              }}
                              className="p-2 border border-brand-border hover:border-red-200 hover:bg-red-50 hover:text-red-600 rounded-full text-brand-muted"
                              title="Dismiss backup record"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </fieldset>
        )}

        {/* Custom Backup Suggestion & Delete Confirmation Modal */}
        <AnimatePresence>
          {deletingStore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="bg-white rounded-[32px] border border-brand-border/40 shadow-2xl p-8 max-w-lg w-full space-y-6 overflow-hidden relative"
              >
                {/* Close Button */}
                <button
                  onClick={() => setDeletingStore(null)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-brand-bg text-brand-muted hover:text-brand-dark transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Header Icon */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-brand-dark uppercase tracking-wider">Confirm Permanent Deletion</h3>
                    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-0.5">Critical Action Requested</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs font-medium text-brand-dark leading-relaxed">
                  <p>
                    You are preparing to permanently delete the studio location <strong className="text-red-600 font-bold">"{deletingStore.storeName}"</strong>.
                  </p>
                  <p className="text-brand-muted">
                    This action is <strong className="text-brand-dark">completely irreversible</strong> and will delete all associated repair logs, customer database records, active inventory items, and calendar appointments.
                  </p>

                  {/* Safety Recommendation Notification Box */}
                  <div className="bg-amber-50 border border-amber-200 rounded-[20px] p-5 space-y-3">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Archive className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Data Safety Suggestion</span>
                    </div>
                    <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                      To prevent accidental data loss, we highly recommend downloading a local backup file before deleting this store. You can restore this file at any time via the Backup tab.
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          await handleDownloadSpecificStoreBackup(deletingStore);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-sm w-full sm:w-auto text-left"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {downloadedBackupForStore ? 'Backup Downloaded! (Save again)' : 'Download Studio Backup (.JSON)'}
                      </button>
                      {downloadedBackupForStore && (
                        <p className="text-[9px] text-green-700 font-bold uppercase tracking-widest mt-2 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Secure copy saved successfully!
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const storeId = deletingStore.id;
                      await deleteStore(storeId);
                      setDeletingStore(null);
                    }}
                    className="flex-1 py-4 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all text-center shadow-lg hover:shadow-red-200"
                  >
                    Confirm & Delete Store
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingStore(null)}
                    className="flex-1 py-4 border border-brand-border text-brand-dark rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-bg transition-all text-center"
                  >
                    Cancel & Keep Location
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="text-center space-y-4 opacity-40">
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-brand-dark" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-dark">Arvind Kumar Shukla</p>
          <div className="h-px w-12 bg-brand-dark" />
        </div>
        <p className="text-[8px] font-bold uppercase tracking-widest text-brand-muted max-w-xs mx-auto leading-relaxed">
          Proprietary Artisan Ops Framework • Vers: 2.4.0 • Cordwainers Studio Global Sync
        </p>
      </footer>
    </div>
  );
}
