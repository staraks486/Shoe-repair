import React, { useState } from 'react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
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
  WifiOff
} from 'lucide-react';

export default function Settings() {
  const { 
    settings, 
    updateSettings, 
    repairs, 
    syncAllPending, 
    syncErrorLogs = [], 
    lastSyncStatus = 'idle', 
    lastSyncTime = null, 
    clearSyncErrorLogs 
  } = useAppStore();
  const [activeTab, setActiveTab] = useState('Store');
  
  // Google Sheets Connection Test State
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
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl font-black text-brand-dark tracking-tighter uppercase leading-none">Settings</h2>
          <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] mt-3">Configure artisan studio parameters</p>
        </div>
        <div className="flex bg-white/50 p-1.5 rounded-full border border-brand-border backdrop-blur-sm self-start">
          {['Store', 'Staff', 'Integrations'].map(tab => (
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

      <div className="bg-white rounded-[40px] border border-brand-border p-8 md:p-12 shadow-premium relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-accent via-brand-olive to-brand-accent opacity-20" />
        
        {activeTab === 'Store' && (
          <div className="space-y-12">
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
                  <input type="text" name="storeName" value={settings.storeName} onChange={handleChange}
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-display text-lg font-bold" />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-brand-muted mb-2 uppercase tracking-widest">Artisan Hours</label>
                  <input type="text" name="hours" value={settings.hours} onChange={handleChange}
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-medium" />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[10px] font-black text-brand-muted mb-2 uppercase tracking-widest">Geographic Anchor (Address)</label>
                  <input type="text" name="address" value={settings.address} onChange={handleChange}
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-medium" />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[10px] font-black text-brand-muted mb-2 uppercase tracking-widest">The Artisan Philosophy (Bio)</label>
                  <textarea name="cobblerBio" rows={4} value={settings.cobblerBio} onChange={handleChange}
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-[32px] px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-medium leading-relaxed" />
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
          </div>
        )}

        {activeTab === 'Staff' && (
          <div className="space-y-12">
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

              <div className="grid grid-cols-1 gap-4">
                {settings.employees?.map((emp, index) => (
                  <div key={emp.id} className="bg-brand-bg/30 border border-brand-border/40 rounded-[32px] p-8 grid grid-cols-1 md:grid-cols-2 gap-6 relative group">
                    <button 
                      onClick={() => {
                        const newItems = settings.employees.filter((_, i) => i !== index);
                        updateSettings({ employees: newItems });
                      }}
                      className="absolute top-6 right-6 p-2 text-brand-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Full Name</label>
                      <input type="text" value={emp.name} onChange={(e) => {
                        const newItems = [...settings.employees];
                        newItems[index].name = e.target.value;
                        updateSettings({ employees: newItems });
                      }} className="w-full bg-white border border-brand-border rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Artisan Role</label>
                      <input type="text" value={emp.role} onChange={(e) => {
                        const newItems = [...settings.employees];
                        newItems[index].role = e.target.value;
                        updateSettings({ employees: newItems });
                      }} className="w-full bg-white border border-brand-border rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none" />
                    </div>
                  </div>
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

              <div className="grid grid-cols-1 gap-4">
                {settings.cobblers?.map((cobbler, index) => (
                  <div key={cobbler.id} className="bg-brand-bg/30 border border-brand-border/40 rounded-[32px] p-8 grid grid-cols-1 md:grid-cols-2 gap-6 relative group">
                    <button 
                      onClick={() => {
                        const newItems = settings.cobblers.filter((_, i) => i !== index);
                        updateSettings({ cobblers: newItems });
                      }}
                      className="absolute top-6 right-6 p-2 text-brand-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Artisan Name</label>
                      <input type="text" value={cobbler.name} onChange={(e) => {
                        const newItems = [...settings.cobblers];
                        newItems[index].name = e.target.value;
                        updateSettings({ cobblers: newItems });
                      }} className="w-full bg-white border border-brand-border rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none font-display font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-4">Artisan Specialty</label>
                      <input type="text" value={cobbler.specialty} onChange={(e) => {
                        const newItems = [...settings.cobblers];
                        newItems[index].specialty = e.target.value;
                        updateSettings({ cobblers: newItems });
                      }} className="w-full bg-white border border-brand-border rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Integrations' && (
          <div className="space-y-12">
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
                      <input type="url" name="googleSheetsWebAppUrl" value={settings.googleSheetsWebAppUrl} onChange={handleChange}
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
          </div>
        )}
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
