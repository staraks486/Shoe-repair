import React, { useState } from 'react';
import { useAppStore } from '../store';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import clsx from 'clsx';
import { 
  CheckCircle, 
  XCircle, 
  Copy, 
  Check, 
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
  GripVertical,
  Download,
  Upload,
  Archive,
  X,
  AlertTriangle,
  User
} from 'lucide-react';
import { checkNotificationPermission, requestNotificationPermission } from '../lib/notifications';

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

export default function Settings() {
  const { 
    settings, 
    updateSettings, 
    repairs, 
    syncAllPending, 
    syncErrorLogs = [], 
    lastSyncStatus = 'idle', 
    lastSyncTime = null, 
    clearSyncErrorLogs,
    userProfile,
    stores = [],
    addStore,
    updateStore,
    deleteStore,
    addUserCredential,
    deleteUserCredential,
    updateUserCredential,
    backups = [],
    createAppBackup,
    importBackup,
    deleteBackupRecord
  } = useAppStore();
  const [activeTab, setActiveTab] = useState('Store');
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
    qrCode: ''
  });

  const isAdmin = userProfile?.role === 'Admin' || userProfile?.isAdmin === true;

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
        <div className="flex bg-white/50 p-1.5 rounded-full border border-brand-border backdrop-blur-sm justify-center flex-wrap gap-1">
          {['Store', 'Stores', 'Staff', 'Users', 'Integrations', 'Notifications', 'Backup'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab 
                  ? "bg-brand-dark text-white shadow-premium" 
                  : "text-brand-muted hover:text-brand-dark"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {!isAdmin && (
        <div className="bg-amber-50/60 backdrop-blur-sm border border-amber-200/50 rounded-[28px] p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800">Guest / Demo Mode Active</h4>
            <p className="text-xs font-semibold leading-relaxed text-amber-900/80">You are logged in under a guest or staff preview profile. Read-only permissions are enforced across all studio configurations, staff tables, integrations, and backup modules.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[40px] border border-brand-border p-8 md:p-12 shadow-premium relative overflow-hidden">
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
                    qrCode: ''
                  });
                }}
                className="bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full hover:bg-brand-olive transition-all shadow-premium"
              >
                + Add New Store
              </button>
            </div>

            {/* Editing / Adding Store Form */}
            {editingStoreId && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-brand-light/30 border border-brand-border/60 rounded-[32px] p-6 md:p-8 space-y-8"
              >
                <div className="flex justify-between items-center border-b border-brand-border/40 pb-4">
                  <h4 className="text-xs font-black text-brand-dark uppercase tracking-widest">
                    {editingStoreId === 'new' ? 'New Store Setup' : 'Edit Location Details'}
                  </h4>
                  <button 
                    onClick={() => setEditingStoreId(null)}
                    className="text-[10px] font-black uppercase text-brand-muted hover:text-brand-dark"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest">Store Name</label>
                    <input 
                      type="text" 
                      value={storeForm.storeName}
                      onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                      placeholder="e.g. Cordwainers Studio - Mumbai"
                      className="w-full bg-white border border-brand-border rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest">Artisan Hours</label>
                    <input 
                      type="text" 
                      value={storeForm.hours}
                      onChange={(e) => setStoreForm({ ...storeForm, hours: e.target.value })}
                      placeholder="e.g. Mon-Sat: 9AM - 7PM"
                      className="w-full bg-white border border-brand-border rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest">Full Address</label>
                    <input 
                      type="text" 
                      value={storeForm.address}
                      onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                      placeholder="e.g. 456, Linking Road, Santacruz West, Mumbai"
                      className="w-full bg-white border border-brand-border rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest">Phone Contact</label>
                    <input 
                      type="text" 
                      value={storeForm.phone}
                      onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full bg-white border border-brand-border rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest">Logo URL</label>
                    <input 
                      type="url" 
                      value={storeForm.logoUrl}
                      onChange={(e) => setStoreForm({ ...storeForm, logoUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-white border border-brand-border rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
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
                    className="bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-full hover:bg-brand-olive transition-all shadow-premium"
                  >
                    Save Store Setup
                  </button>
                  <button
                    onClick={() => setEditingStoreId(null)}
                    className="border border-brand-border text-brand-dark text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-full hover:bg-brand-bg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {/* List of Existing Stores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
              {stores.map((store: any) => (
                <SwipeToDelete
                  key={store.id}
                  itemName={store.storeName}
                  onDelete={() => handleInitiateStoreDelete(store)}
                >
                  <div className="bg-white p-6 space-y-4 relative overflow-hidden animate-in fade-in duration-300 w-full">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-display text-lg font-bold text-brand-dark leading-snug">{store.storeName}</h4>
                        <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest mt-1">Location ID: {store.id}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
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
                              qrCode: store.qrCode || ''
                            });
                          }}
                          className="text-[10px] font-black text-brand-olive uppercase tracking-widest hover:text-brand-dark"
                        >
                          Edit details
                        </button>
                        {stores.length > 1 && (
                          <button
                            onClick={() => handleInitiateStoreDelete(store)}
                            className="text-[10px] font-black text-red-600 hover:text-red-800 uppercase tracking-widest flex items-center gap-1"
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
                    </div>
                  </div>
                </SwipeToDelete>
              ))}
            </div>
          </fieldset>
        )}

        {activeTab === 'Store' && (
          <fieldset disabled={!isAdmin} className="space-y-12 w-full block border-none p-0 m-0">
            {/* Store Details */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b border-brand-border pb-4">
                <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                  <Database className="w-4 h-4 text-brand-olive" />
                </div>
                <h3 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em]">Identity & Locale</h3>
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
                        value={settings.logoUrl || ''} 
                        onChange={handleChange}
                        placeholder="https://artisan.com/logo.png"
                        className="w-full bg-white border border-brand-border rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-medium" 
                      />
                      <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest leading-relaxed">Provide a public URL for your high-fidelity brand mark.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-brand-muted mb-2 uppercase tracking-widest">Studio Name</label>
                  <input type="text" name="storeName" value={settings.storeName || ''} onChange={handleChange}
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-display text-lg font-bold" />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-brand-muted mb-2 uppercase tracking-widest">Artisan Hours</label>
                  <input type="text" name="hours" value={settings.hours || ''} onChange={handleChange}
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-medium" />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[10px] font-black text-brand-muted mb-2 uppercase tracking-widest">Geographic Anchor (Address)</label>
                  <input type="text" name="address" value={settings.address || ''} onChange={handleChange}
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-medium" />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[10px] font-black text-brand-muted mb-2 uppercase tracking-widest">The Artisan Philosophy (Bio)</label>
                  <textarea name="cobblerBio" rows={4} value={settings.cobblerBio || ''} onChange={handleChange}
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
                        value={settings.instagramLink || ''} 
                        onChange={handleChange}
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
                        value={settings.facebookLink || ''} 
                        onChange={handleChange}
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
                        value={settings.twitterLink || ''} 
                        onChange={handleChange}
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
                        value={settings.linkedinLink || ''} 
                        onChange={handleChange}
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
                        value={settings.websiteLink || ''} 
                        onChange={handleChange}
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
          </fieldset>
        )}

        {activeTab === 'Staff' && (
          <fieldset disabled={!isAdmin} className="space-y-12 w-full block border-none p-0 m-0">
            {/* Employees */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-brand-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                    <Database className="w-4 h-4 text-brand-olive" />
                  </div>
                  <h3 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em]">Concierge Team</h3>
                </div>
                <button 
                  onClick={() => {
                    updateSettings({
                      employees: [...(settings.employees || []), { id: Math.random().toString(), name: 'New Staff', role: 'Concierge', mobile: '', email: '' }]
                    });
                  }} 
                  className="px-6 py-2 bg-brand-bg border border-brand-border rounded-full text-[10px] font-black text-brand-dark uppercase tracking-widest hover:bg-brand-dark hover:text-white transition-all"
                >
                  Deploy Personnel
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {settings.employees?.map((emp, index) => (
                  <SwipeToDelete
                    key={emp.id}
                    itemName={emp.name || 'this staff member'}
                    onDelete={() => {
                      const newItems = settings.employees.filter((_, i) => i !== index);
                      updateSettings({ employees: newItems });
                    }}
                    confirmMessage={`Are you sure you want to dismiss "${emp.name || 'this staff member'}" from the concierge team?`}
                  >
                    <div className="bg-white p-8 grid grid-cols-1 md:grid-cols-2 gap-6 relative w-full">
                      <button 
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to dismiss "${emp.name || 'this staff member'}" from the concierge team?`)) {
                            const newItems = settings.employees.filter((_, i) => i !== index);
                            updateSettings({ employees: newItems });
                          }
                        }}
                        className="absolute top-6 right-6 p-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-full border border-red-200 transition-all z-20"
                        title="Dismiss personnel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      {/* Avatar preview and URL input */}
                      <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-brand-border/40">
                        <div className="w-20 h-20 rounded-full border border-brand-border overflow-hidden bg-brand-bg flex-shrink-0 flex items-center justify-center shadow-inner">
                          {emp.avatarUrl ? (
                            <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-8 h-8 text-brand-muted" />
                          )}
                        </div>
                        <div className="flex-1 w-full space-y-2">
                          <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Profile Photo / Avatar URL</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={emp.avatarUrl || ''} 
                              placeholder="https://images.unsplash.com/... or paste any image URL" 
                              onChange={(e) => {
                                const newItems = [...settings.employees];
                                newItems[index].avatarUrl = e.target.value;
                                updateSettings({ employees: newItems });
                              }} 
                              className="flex-1 bg-white border border-brand-border rounded-full px-6 py-2.5 text-xs focus:ring-2 focus:ring-brand-accent/20 outline-none" 
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const defaultAvatars = [
                                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
                                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
                                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
                                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
                                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop",
                                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop"
                                ];
                                const avatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
                                const newItems = [...settings.employees];
                                newItems[index].avatarUrl = avatar;
                                updateSettings({ employees: newItems });
                              }}
                              className="px-4 py-2 bg-brand-bg hover:bg-brand-dark hover:text-white text-brand-dark border border-brand-border rounded-full text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              Auto Photo
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Full Name</label>
                        <input type="text" value={emp.name || ''} onChange={(e) => {
                          const newItems = [...settings.employees];
                          newItems[index].name = e.target.value;
                          updateSettings({ employees: newItems });
                        }} className="w-full bg-white border border-brand-border rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Artisan Role</label>
                        <input type="text" value={emp.role || ''} onChange={(e) => {
                          const newItems = [...settings.employees];
                          newItems[index].role = e.target.value;
                          updateSettings({ employees: newItems });
                        }} className="w-full bg-white border border-brand-border rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Contact Mobile</label>
                        <input type="tel" value={emp.mobile || ''} onChange={(e) => {
                          const newItems = [...settings.employees];
                          newItems[index].mobile = e.target.value;
                          updateSettings({ employees: newItems });
                        }} className="w-full bg-white border border-brand-border rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none" placeholder="+1 555-0100" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Email Address</label>
                        <input type="email" value={emp.email || ''} onChange={(e) => {
                          const newItems = [...settings.employees];
                          newItems[index].email = e.target.value;
                          updateSettings({ employees: newItems });
                        }} className="w-full bg-white border border-brand-border rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none" placeholder="name@artisan.com" />
                      </div>
                    </div>
                  </SwipeToDelete>
                ))}
              </div>
            </div>

            {/* Cobblers */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-brand-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                    <Database className="w-4 h-4 text-brand-olive" />
                  </div>
                  <h3 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em]">Master Cobblers</h3>
                </div>
                <button 
                  onClick={() => {
                    updateSettings({
                      cobblers: [...(settings.cobblers || []), { id: Math.random().toString(), name: 'New Cobbler', specialty: 'General Artisan', mobile: '', email: '' }]
                    });
                  }} 
                  className="px-6 py-2 bg-brand-bg border border-brand-border rounded-full text-[10px] font-black text-brand-dark uppercase tracking-widest hover:bg-brand-dark hover:text-white transition-all"
                >
                  Enlist Artisan
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
                    <div className="bg-white p-8 grid grid-cols-1 md:grid-cols-2 gap-6 relative w-full">
                      <button 
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to dismiss "${cobbler.name || 'this cobbler'}" from the enlisted artisans?`)) {
                            const newItems = settings.cobblers.filter((_, i) => i !== index);
                            updateSettings({ cobblers: newItems });
                          }
                        }}
                        className="absolute top-6 right-6 p-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-full border border-red-200 transition-all z-20"
                        title="Dismiss cobbler"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Artisan Name</label>
                        <input type="text" value={cobbler.name || ''} onChange={(e) => {
                          const newItems = [...settings.cobblers];
                          newItems[index].name = e.target.value;
                          updateSettings({ cobblers: newItems });
                        }} className="w-full bg-white border border-brand-border rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none font-display font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Artisan Specialty</label>
                        <input type="text" value={cobbler.specialty || ''} onChange={(e) => {
                          const newItems = [...settings.cobblers];
                          newItems[index].specialty = e.target.value;
                          updateSettings({ cobblers: newItems });
                        }} className="w-full bg-white border border-brand-border rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Contact Mobile</label>
                        <input type="tel" value={cobbler.mobile || ''} onChange={(e) => {
                          const newItems = [...settings.cobblers];
                          newItems[index].mobile = e.target.value;
                          updateSettings({ cobblers: newItems });
                        }} className="w-full bg-white border border-brand-border rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none" placeholder="+1 555-0155" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Email Address</label>
                        <input type="email" value={cobbler.email || ''} onChange={(e) => {
                          const newItems = [...settings.cobblers];
                          newItems[index].email = e.target.value;
                          updateSettings({ cobblers: newItems });
                        }} className="w-full bg-white border border-brand-border rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none" placeholder="cobbler@artisan.com" />
                      </div>
                    </div>
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-brand-border p-8 md:p-10 relative overflow-hidden"
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
                          <input type="text" value={cred.displayName || ''} onChange={(e) => {
                            updateUserCredential(cred.email, { displayName: e.target.value });
                          }} className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none font-bold" placeholder="e.g. John Doe" />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Login Username (Unique)</label>
                          <input type="text" value={cred.username || ''} onChange={(e) => {
                            updateUserCredential(cred.email, { username: e.target.value.toLowerCase().replace(/\s+/g, '') });
                          }} className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none font-bold font-mono" placeholder="e.g. johndoe" />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Email Address</label>
                          <input type="email" value={cred.email} onChange={(e) => {
                            const newCreds = [...(settings.userCredentials || [])];
                            newCreds[index].email = e.target.value;
                            updateSettings({ userCredentials: newCreds });
                          }} className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none font-bold" placeholder="e.g. john@cordwainers.com" />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Mobile Number</label>
                          <input type="tel" value={cred.mobile || ''} onChange={(e) => {
                            updateUserCredential(cred.email, { mobile: e.target.value });
                          }} className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none font-bold" placeholder="e.g. +91 9876543210" />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Change Password</label>
                          <input type="text" value={cred.password || ''} disabled={userProfile?.role !== 'Admin'} onChange={(e) => {
                            updateUserCredential(cred.email, { password: e.target.value });
                          }} className={clsx("w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none text-brand-accent font-mono font-bold", userProfile?.role !== 'Admin' && "opacity-50 cursor-not-allowed")} placeholder="Change Password" />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Account Role</label>
                          <select 
                            value={cred.role} 
                            onChange={(e) => {
                              updateUserCredential(cred.email, { role: e.target.value as 'Admin' | 'Staff' });
                            }} 
                            className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 outline-none font-bold"
                          >
                            <option value="Admin">Admin (Full Access)</option>
                            <option value="Staff">Staff (Read-Only/Limited)</option>
                          </select>
                        </div>
                      </div>
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
              <textarea name="termsAndConditions" rows={6} value={settings.termsAndConditions || ''} onChange={handleChange}
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
                   {lastSyncStatus === 'success' ? (
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
                <div className="bg-brand-bg/30 p-8 rounded-[32px] border border-brand-border/40 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-6">Google Sheets Web App URL</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input type="url" name="googleSheetsWebAppUrl" value={settings.googleSheetsWebAppUrl || ''} onChange={handleChange}
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
                  <textarea name="whatsappIntakeTemplate" value={settings.whatsappIntakeTemplate || ''} onChange={handleChange}
                    placeholder="Hello {customerName}, your shoe repair {repairType} has been received. Ticket: {invoiceNumber}"
                    className="w-full bg-brand-bg/30 border border-brand-border rounded-[24px] px-8 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-6">Ready for Pickup Notification</label>
                  <textarea name="whatsappReadyTemplate" value={settings.whatsappReadyTemplate || ''} onChange={handleChange}
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
