import React, { useState } from 'react';
import { useAppStore } from '../store';
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
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="bg-white p-6 border-b border-brand-border rounded-xl shadow-sm">
        <h2 className="font-serif text-2xl font-bold text-brand-dark mb-1">Settings</h2>
        <p className="text-xs font-sans text-brand-muted uppercase tracking-wider">Configure your shop details and integrations</p>
      </header>

      <div className="flex space-x-2 border-b border-brand-border">
        {['Store', 'Staff', 'Integrations'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium ${activeTab === tab ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-muted hover:text-brand-dark'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white border border-brand-border rounded-xl p-8 shadow-sm space-y-8">
        
        {activeTab === 'Store' && (
          <>
            {/* Store Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">Store Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Logo Upload</label>
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateSettings({ logoUrl: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }} className="w-full text-sm text-brand-dark file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-bg file:text-brand-dark hover:file:bg-brand-bg/80" />
                  {settings.logoUrl && <img src={settings.logoUrl} alt="Logo Preview" className="mt-2 h-16 w-16 object-contain" />}
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Store Name</label>
                  <input type="text" name="storeName" value={settings.storeName} onChange={handleChange}
                    className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Address</label>
                  <input type="text" name="address" value={settings.address} onChange={handleChange}
                    className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Operating Hours</label>
                  <input type="text" name="hours" value={settings.hours} onChange={handleChange}
                    className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Cobbler Bio</label>
                  <textarea name="cobblerBio" rows={3} value={settings.cobblerBio} onChange={handleChange}
                    className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
                </div>
              </div>
            </div>

            {/* Theme */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">App Theme</h3>
              <select name="theme" value={settings.theme || 'olive'} onChange={handleChange}
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="olive">Olive</option>
              </select>
            </div>
          </>
        )}

        {activeTab === 'Staff' && (
          <>
            {/* Employees */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">Employees</h3>
              <div className="space-y-4">
                {settings.employees?.map((emp, index) => (
                  <div key={emp.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-brand-border-dark rounded-lg bg-brand-bg/50">
                    <div>
                      <label className="block text-xs font-medium text-brand-dark mb-1">Name</label>
                      <input type="text" value={emp.name} onChange={(e) => {
                        const newItems = [...settings.employees];
                        newItems[index].name = e.target.value;
                        updateSettings({ employees: newItems });
                      }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-dark mb-1">Role</label>
                      <input type="text" value={emp.role} onChange={(e) => {
                        const newItems = [...settings.employees];
                        newItems[index].role = e.target.value;
                        updateSettings({ employees: newItems });
                      }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-dark mb-1">Mobile</label>
                      <input type="text" value={emp.mobile} onChange={(e) => {
                        const newItems = [...settings.employees];
                        newItems[index].mobile = e.target.value;
                        updateSettings({ employees: newItems });
                      }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-dark mb-1">Email</label>
                      <input type="text" value={emp.email} onChange={(e) => {
                        const newItems = [...settings.employees];
                        newItems[index].email = e.target.value;
                        updateSettings({ employees: newItems });
                      }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                    </div>
                  </div>
                ))}
                <button onClick={() => {
                  updateSettings({
                    employees: [...(settings.employees || []), { id: Math.random().toString(), name: 'New Employee', role: 'Staff', mobile: '', email: '' }]
                  });
                }} className="text-xs font-bold text-brand-accent uppercase hover:underline">
                  + Add Employee
                </button>
              </div>
            </div>

            {/* Cobblers */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">Cobblers</h3>
              <div className="space-y-4">
                {settings.cobblers?.map((cobbler, index) => (
                  <div key={cobbler.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-brand-border-dark rounded-lg bg-brand-bg/50">
                    <div>
                      <label className="block text-xs font-medium text-brand-dark mb-1">Name</label>
                      <input type="text" value={cobbler.name} onChange={(e) => {
                        const newItems = [...settings.cobblers];
                        newItems[index].name = e.target.value;
                        updateSettings({ cobblers: newItems });
                      }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-dark mb-1">Specialty</label>
                      <input type="text" value={cobbler.specialty} onChange={(e) => {
                        const newItems = [...settings.cobblers];
                        newItems[index].specialty = e.target.value;
                        updateSettings({ cobblers: newItems });
                      }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-dark mb-1">Mobile</label>
                      <input type="text" value={cobbler.mobile} onChange={(e) => {
                        const newItems = [...settings.cobblers];
                        newItems[index].mobile = e.target.value;
                        updateSettings({ cobblers: newItems });
                      }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-dark mb-1">Email</label>
                      <input type="text" value={cobbler.email} onChange={(e) => {
                        const newItems = [...settings.cobblers];
                        newItems[index].email = e.target.value;
                        updateSettings({ cobblers: newItems });
                      }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                    </div>
                  </div>
                ))}
                <button onClick={() => {
                  updateSettings({
                    cobblers: [...(settings.cobblers || []), { id: Math.random().toString(), name: 'New Cobbler', specialty: 'General', mobile: '', email: '' }]
                  });
                }} className="text-xs font-bold text-brand-accent uppercase hover:underline">
                  + Add Cobbler
                </button>
              </div>
            </div>
          </>
        )}





        {activeTab === 'Integrations' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">Terms & Conditions</h3>
            <p className="text-xs text-brand-muted">
              Configure the Terms and Conditions that appear on your invoices.
            </p>
            <textarea name="termsAndConditions" rows={4} value={settings.termsAndConditions || ''} onChange={handleChange}
              placeholder="Enter terms and conditions for the invoice..."
              className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
            
            <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2 mt-8">Integrations & Notifications</h3>
            <p className="text-xs text-brand-muted">
              Configure automated WhatsApp messages and Google Sheets sync.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">WhatsApp Message Template</label>
                <textarea name="whatsappTemplate" rows={3} value={settings.whatsappTemplate || ''} onChange={handleChange}
                  placeholder="Hello {customerName}, your shoe repair ({repairType}) is now {status}. Invoice: {invoiceNumber}"
                  className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
                <p className="text-[10px] text-brand-muted mt-1">Available variables: {`{customerName}`}, {`{repairType}`}, {`{status}`}, {`{invoiceNumber}`}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Google Sheets Web App URL</label>
                <div className="flex gap-2">
                  <input type="url" name="googleSheetsWebAppUrl" value={settings.googleSheetsWebAppUrl} onChange={handleChange}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg px-3 py-2" />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                    className="px-4 py-2 bg-brand-dark text-white rounded-md text-xs font-bold uppercase tracking-wider hover:bg-brand-muted transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {testStatus === 'testing' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      'Test Connection'
                    )}
                  </button>
                </div>

                {/* Connection Status Indicator */}
                {testStatus !== 'idle' && (
                  <div className={`mt-3 p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
                    testStatus === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {testStatus === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{testStatus === 'success' ? 'Connection Verified' : 'Connection Failed'}</p>
                      <p className="mt-0.5 opacity-90">{testMessage}</p>
                    </div>
                  </div>
                )}

                {/* Script Setup Instructions */}
                <div className="mt-4 border border-brand-border rounded-xl overflow-hidden bg-brand-bg/10">
                  <button
                    type="button"
                    onClick={() => setShowScriptGuide(!showScriptGuide)}
                    className="w-full flex items-center justify-between p-3 text-left text-xs font-bold text-brand-dark uppercase tracking-wider hover:bg-brand-bg/40 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-brand-olive" />
                      Google Sheets Setup Guide
                    </span>
                    {showScriptGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showScriptGuide && (
                    <div className="p-4 border-t border-brand-border bg-white space-y-4 text-xs text-brand-dark">
                      <p className="leading-relaxed">
                        Follow these simple steps to connect your <strong>Cordwainers Studio</strong> database to Google Sheets in real-time:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 pl-1 leading-relaxed">
                        <li>Create a new Google Sheet or open an existing one.</li>
                        <li>In the top menu, go to <strong>Extensions &gt; Apps Script</strong>.</li>
                        <li>Delete any existing code and paste the custom script below.</li>
                        <li>Click the <strong>Save</strong> icon (floppy disk).</li>
                        <li>Click <strong>Deploy &gt; New deployment</strong> in the top right.</li>
                        <li>Select type <strong>Web app</strong> (gear icon).</li>
                        <li>Under <em>Execute as</em>, select <strong>Me</strong>.</li>
                        <li>Under <em>Who has access</em>, select <strong>Anyone</strong> (this allows the secure API requests).</li>
                        <li>Click <strong>Deploy</strong>, authorize the permissions, and copy the <strong>Web App URL</strong>.</li>
                        <li>Paste that URL into the input field above and click <strong>Test Connection</strong>!</li>
                      </ol>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-brand-bg px-3 py-1.5 rounded-t-lg border-t border-x border-brand-border">
                          <span className="font-mono text-[10px] font-bold text-brand-olive uppercase">Apps Script Code</span>
                          <button
                            type="button"
                            onClick={copyToClipboard}
                            className="flex items-center gap-1 text-[10px] text-brand-dark font-semibold uppercase hover:text-brand-olive transition-colors"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? 'Copied!' : 'Copy Script'}
                          </button>
                        </div>
                        <pre className="p-3 bg-brand-bg/40 border border-brand-border rounded-b-lg font-mono text-[10px] overflow-x-auto max-h-48 text-gray-700 leading-relaxed">
                          {googleAppsScriptCode}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* Connection Status and Sync Diagnostics Component */}
                <div className="mt-6 border border-brand-border-dark bg-brand-bg/50 rounded-2xl p-5 space-y-5">
                  <div className="flex items-center justify-between border-b border-brand-border-dark pb-3">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-brand-olive" />
                      <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">Sync Diagnostics & Connection Status</h4>
                    </div>
                    {/* Connection Status Badge */}
                    <div className="flex items-center gap-2">
                      {settings.isOfflineMode ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800 border border-gray-200">
                          <WifiOff className="w-3 h-3" /> Offline Mode
                        </span>
                      ) : !settings.googleSheetsWebAppUrl ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-50 text-yellow-800 border border-yellow-200">
                          <AlertCircle className="w-3 h-3" /> Not Configured
                        </span>
                      ) : lastSyncStatus === 'syncing' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
                          <Loader2 className="w-3 h-3 animate-spin" /> Syncing
                        </span>
                      ) : lastSyncStatus === 'success' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-800 border border-green-200">
                          <CheckCircle className="w-3 h-3 text-green-600" /> Connected
                        </span>
                      ) : lastSyncStatus === 'error' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-800 border border-red-200">
                          <XCircle className="w-3 h-3 text-red-600" /> Sync Error
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800 border border-gray-200">
                          <Wifi className="w-3 h-3" /> Idle
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-white border border-brand-border rounded-xl p-3 space-y-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-brand-muted">Last Synchronized</span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark">
                        <Clock className="w-3.5 h-3.5 text-brand-olive shrink-0" />
                        <span className="truncate">
                          {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white border border-brand-border rounded-xl p-3 space-y-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-brand-muted">Pending Changes</span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark">
                        <RefreshCw className="w-3.5 h-3.5 text-brand-olive shrink-0" />
                        <span>{repairs.filter(r => !r.isSynced).length} items pending</span>
                      </div>
                    </div>
                    <div className="bg-white border border-brand-border rounded-xl p-3 col-span-2 sm:col-span-1 space-y-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-brand-muted">Connection Mode</span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark">
                        {settings.isOfflineMode ? (
                          <>
                            <WifiOff className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            <span>Offline</span>
                          </>
                        ) : (
                          <>
                            <Wifi className="w-3.5 h-3.5 text-green-600 shrink-0" />
                            <span>Online</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sync Retry Button and state feedback */}
                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={handleRetrySync}
                      disabled={isRetryingSync || settings.isOfflineMode || !settings.googleSheetsWebAppUrl}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-dark text-white text-xs font-bold uppercase tracking-wider rounded-xl border border-brand-border hover:bg-brand-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isRetryingSync ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      {isRetryingSync ? 'Synchronizing now...' : 'Retry Synchronization'}
                    </button>

                    {retryFeedback && (
                      <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                        retryFeedback.status === 'success' 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}>
                        <div className="flex gap-2 items-center">
                          {retryFeedback.status === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                          )}
                          <span className="font-semibold">{retryFeedback.message}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Diagnostic Error Logs Section */}
                  <div className="space-y-3 pt-3 border-t border-brand-border-dark">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-brand-dark uppercase tracking-wider">Sync Error Log History</span>
                      {syncErrorLogs.length > 0 && (
                        <button
                          type="button"
                          onClick={clearSyncErrorLogs}
                          className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Clear Logs
                        </button>
                      )}
                    </div>

                    {syncErrorLogs.length === 0 ? (
                      <div className="bg-white border border-brand-border rounded-xl p-4 text-center space-y-1.5">
                        <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                        <p className="text-xs font-bold text-brand-dark">No errors found</p>
                        <p className="text-[10px] text-brand-muted">All background and manual synchronization tasks are completing cleanly.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {syncErrorLogs.map((log) => (
                          <div key={log.id} className="bg-white border border-red-100 rounded-xl p-3 text-xs flex gap-3 justify-between items-start">
                            <div className="space-y-1 min-w-0">
                              <p className="font-mono text-[9px] text-brand-muted">
                                {new Date(log.timestamp).toLocaleString()} • Failed {log.payloadCount} repairs payload
                              </p>
                              <p className="text-red-800 font-semibold leading-relaxed break-words">
                                {log.message}
                              </p>
                            </div>
                            <span className="inline-flex px-1.5 py-0.5 bg-red-50 text-[9px] text-red-600 font-bold uppercase rounded-md shrink-0 border border-red-100">
                              Failed
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-brand-bg text-brand-olive text-sm rounded-md border border-brand-border-dark">
              <strong>Note:</strong> To enable Gemini AI Chat, ensure you have set the <code>GEMINI_API_KEY</code> in the AI Studio Settings menu.
            </div>

            <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2 mt-8">Payment Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Payment Link (URL)</label>
                <input type="url" name="paymentLink" value={settings.paymentLink || ''} onChange={handleChange}
                  placeholder="https://pay.example.com/..."
                  className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">QR Code Image URL</label>
                <input type="url" name="qrCode" value={settings.qrCode || ''} onChange={handleChange}
                  placeholder="https://example.com/qr-code.png"
                  className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
