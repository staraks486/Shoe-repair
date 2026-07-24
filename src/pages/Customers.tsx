import { useState } from 'react';
import { useAppStore } from '../store';
import { format } from 'date-fns';
import { Search, Phone, Mail, Calendar, MessageSquare, Trash2, User, Plus, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import SyncContactsButton from '../components/SyncContactsButton';
import WhatsAppImportModal from '../components/WhatsAppImportModal';
import PageHeader from '../components/PageHeader';
import SwipeToDelete from '../components/SwipeToDelete';

export default function Customers() {
  const { 
    customers, 
    addCustomer, 
    deleteCustomer, 
    isPrivacyMasked,
    lastSyncTime,
    offlineQueue,
    currentStoreId,
    fetchFromFirestore
  } = useAppStore();

  const [search, setSearch] = useState('');
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(true);

  const [newCustomerPhone, setNewCustomerPhone] = useState('+91 ');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerOrders, setNewCustomerOrders] = useState(0);
  const [addError, setAddError] = useState('');

  const pendingCustomerWrites = (offlineQueue || []).filter(op => op.collectionName === 'customers').length;

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchFromFirestore();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const maskPhone = (phone: string) => {
    if (!isPrivacyMasked) return phone;
    const cleaned = phone.replace(/\s+/g, '');
    if (cleaned.length < 5) return '••••••';
    return cleaned.slice(0, 4) + ' •••• ••' + cleaned.slice(-3);
  };

  const maskName = (name: string) => {
    if (!isPrivacyMasked) return name;
    const parts = name.split(' ');
    return parts.map((p, i) => i === 0 ? p : p[0] + '•••').join(' ');
  };

  const maskEmail = (email: string) => {
    if (!isPrivacyMasked || !email) return email;
    const [user, domain] = email.split('@');
    if (!domain) return '•••••';
    return user.slice(0, 2) + '••••@' + domain;
  };

  function MaskedText({ text, maskFn }: { text: string; maskFn: (t: string) => string }) {
    const [revealed, setRevealed] = useState(false);
    return (
      <span 
        onMouseEnter={() => setRevealed(true)}
        onMouseLeave={() => setRevealed(false)}
        onClick={() => setRevealed(!revealed)}
        className="cursor-help select-none border-b border-dotted border-brand-border/40 hover:border-brand-olive transition-colors"
        title="Hover/click to reveal safely"
      >
        {revealed ? text : maskFn(text)}
      </span>
    );
  }

  const handleDelete = (phoneNumber: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}" from the database?`)) {
      deleteCustomer(phoneNumber);
    }
  };

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = newCustomerPhone.trim();
    if (!cleanPhone || cleanPhone === '+91 ') {
      setAddError('Mobile Number is required');
      return;
    }
    const duplicate = customers.some(c => c.phoneNumber.replace(/\D/g, '') === cleanPhone.replace(/\D/g, ''));
    if (duplicate) {
      setAddError('A customer with this phone number already exists in the archive.');
      return;
    }

    addCustomer({
      phoneNumber: cleanPhone,
      name: newCustomerName.trim(),
      email: newCustomerEmail.trim() || '',
      totalOrders: Number(newCustomerOrders) || 0,
      lastVisit: new Date().toISOString()
    });

    setNewCustomerPhone('+91 ');
    setNewCustomerName('');
    setNewCustomerEmail('');
    setNewCustomerOrders(0);
    setAddError('');
    setIsAddModalOpen(false);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phoneNumber.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-300">
      <PageHeader 
        title="Customers" 
        subtitle="Artisan Client Archive & CRM" 
      >
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-dark text-[#F5F3EC] text-[10px] font-black uppercase tracking-widest transition-all shadow-sm hover:bg-brand-accent hover:text-brand-dark"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
          <button
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-green-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-sm hover:bg-green-600"
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp Bulk Import
          </button>
          <SyncContactsButton />
          <div className="relative group w-full sm:min-w-[320px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Search the archive..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-brand-border rounded-full pl-12 pr-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all shadow-sm font-medium"
            />
          </div>
        </div>
      </PageHeader>

      {/* Real-Time Sync Status Indicator */}
      <div className="bg-brand-dark/95 backdrop-blur text-[#F5F3EC] rounded-2xl md:rounded-3xl p-4 md:p-5 border border-brand-accent/20 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-black uppercase tracking-widest text-emerald-400">
                  Real-Time Customer Sync Active
                </p>
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-brand-muted/90 font-mono mt-0.5">
                Store Location: <span className="text-brand-accent font-bold">{currentStoreId || 'default'}</span> | Directory Records: <span className="text-white font-bold">{customers.length}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase font-bold text-brand-muted/80">Last Updated Timestamp</p>
              <p className="text-xs font-mono font-medium text-emerald-300">
                {lastSyncTime ? format(new Date(lastSyncTime), 'HH:mm:ss a (PPP)') : 'Listening for changes...'}
              </p>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider transition-all border border-white/10 cursor-pointer"
              title="Trigger sync refresh"
            >
              <RefreshCw className={clsx("w-3.5 h-3.5", isRefreshing && "animate-spin text-brand-accent")} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="text-brand-muted hover:text-white text-[10px] font-mono underline cursor-pointer"
            >
              {showDiagnostics ? 'Hide Details' : 'Sync Details'}
            </button>
          </div>
        </div>

        {showDiagnostics && (
          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono text-brand-muted">
            <div className="bg-white/5 p-2 rounded-lg">
              <span className="block text-brand-muted/60 text-[9px]">STORE LOCATION</span>
              <span className="text-white font-medium truncate block">{currentStoreId || 'default'}</span>
            </div>
            <div className="bg-white/5 p-2 rounded-lg">
              <span className="block text-brand-muted/60 text-[9px]">DIRECTORY TOTAL</span>
              <span className="text-white font-medium truncate block">{customers.length} clients</span>
            </div>
            <div className="bg-white/5 p-2 rounded-lg">
              <span className="block text-brand-muted/60 text-[9px]">PENDING LOCAL UPDATES</span>
              <span className={clsx("font-bold", pendingCustomerWrites > 0 ? "text-amber-400" : "text-emerald-400")}>
                {pendingCustomerWrites} pending
              </span>
            </div>
            <div className="bg-white/5 p-2 rounded-lg">
              <span className="block text-brand-muted/60 text-[9px]">SYNC STATUS</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Sync Connected
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block bg-white rounded-[40px] border border-brand-border shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-border">
            <thead>
              <tr className="bg-brand-bg/50">
                <th scope="col" className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Client Identity</th>
                <th scope="col" className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Contact Info</th>
                <th scope="col" className="px-8 py-5 text-center text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Engagement</th>
                <th scope="col" className="px-8 py-5 text-right text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Last Visit</th>
                <th scope="col" className="px-8 py-5 text-right text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Action</th>
              </tr>
            </thead>
            <motion.tbody 
              variants={container}
              initial="hidden"
              animate="show"
              className="divide-y divide-brand-border bg-white"
            >
              <AnimatePresence>
                {filteredCustomers.map((c) => (
                  <motion.tr 
                    variants={itemAnim}
                    layout
                    exit={{ opacity: 0, x: -20 }}
                    key={c.phoneNumber} 
                    className="hover:bg-brand-bg/20 transition-colors group"
                  >
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center text-brand-olive font-display font-black text-sm">
                          {c.name.charAt(0)}
                        </div>
                        <div className="text-sm font-bold text-brand-dark font-display">
                          <MaskedText text={c.name} maskFn={maskName} />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-brand-dark">
                          <Phone className="w-3.5 h-3.5 text-brand-muted opacity-40" />
                          <MaskedText text={c.phoneNumber} maskFn={maskPhone} />
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-2 text-[10px] text-brand-muted font-medium">
                            <Mail className="w-3.5 h-3.5 text-brand-muted opacity-40" />
                            <MaskedText text={c.email} maskFn={maskEmail} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1 rounded-full text-[10px] font-black bg-brand-bg text-brand-dark border border-brand-border group-hover:bg-brand-accent group-hover:border-brand-accent transition-colors">
                        {c.totalOrders}
                      </span>
                      <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Total Orders</p>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 text-xs font-bold text-brand-dark">
                        <Calendar className="w-3.5 h-3.5 text-brand-muted opacity-40" />
                        {format(new Date(c.lastVisit), 'dd MMM, yyyy')}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right">
                      <button 
                        onClick={() => handleDelete(c.phoneNumber, c.name)}
                        className="p-2 rounded-full text-brand-muted/70 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title={`Delete ${c.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredCustomers.length === 0 && (
                <motion.tr variants={itemAnim}>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-6 h-6 text-brand-muted opacity-40" />
                      </div>
                      <p className="text-[11px] font-black text-brand-dark uppercase tracking-tighter">No artisans found in the archive</p>
                      <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest leading-relaxed">Refine your search parameters or register a new client via the intake portal.</p>
                    </div>
                  </td>
                </motion.tr>
              )}
            </motion.tbody>
          </table>
        </div>
      </div>

      {/* Mobile Swipeable List View (Visible on mobile) */}
      <div className="md:hidden space-y-4">
        <div className="px-4 py-2 bg-brand-bg/30 rounded-xl border border-brand-border/40 mb-2">
          <p className="text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] text-center italic">
            Swipe left on a card to archive/delete
          </p>
        </div>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <AnimatePresence>
            {filteredCustomers.map((c) => (
              <motion.div
                key={c.phoneNumber}
                variants={itemAnim}
                layout
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <SwipeToDelete onDelete={() => handleDelete(c.phoneNumber, c.name)}>
                  <div className="p-5 border border-brand-border rounded-2xl bg-white shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center text-brand-olive font-display font-black text-sm">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-brand-dark font-display">{c.name}</div>
                          <div className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Client</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-[10px] font-black bg-brand-bg px-2 py-1 rounded-lg border border-brand-border">
                          {c.totalOrders} Orders
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 pt-4 border-t border-brand-border/60">
                      <div className="flex items-center gap-3 text-xs font-bold text-brand-dark">
                        <Phone className="w-4 h-4 text-brand-muted opacity-40" />
                        {c.phoneNumber}
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-3 text-xs text-brand-muted font-medium truncate">
                          <Mail className="w-4 h-4 text-brand-muted opacity-40" />
                          {c.email}
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-[10px] font-black text-brand-muted uppercase tracking-widest pt-1">
                        <Calendar className="w-4 h-4 text-brand-muted opacity-40" />
                        Last Visit: {format(new Date(c.lastVisit), 'dd MMM, yyyy')}
                      </div>
                    </div>
                  </div>
                </SwipeToDelete>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredCustomers.length === 0 && (
            <div className="px-4 py-16 text-center bg-white rounded-3xl border border-brand-border border-dashed">
              <Search className="w-8 h-8 text-brand-muted mx-auto mb-4 opacity-30" />
              <p className="text-[10px] font-black text-brand-dark uppercase tracking-widest">No matching records</p>
            </div>
          )}
        </motion.div>
      </div>
      
      <footer className="text-center pt-8 opacity-40">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-dark">Cordwainers Studio CRM Portal</p>
      </footer>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#F8F6F2] rounded-[2rem] shadow-2xl overflow-hidden border border-brand-border"
            >
              {/* Header */}
              <div className="bg-white px-8 py-6 border-b border-brand-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-bg flex items-center justify-center border border-brand-border/60">
                    <User className="w-6 h-6 text-brand-olive" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-black text-brand-dark uppercase tracking-tighter">Register New Client</h3>
                    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Add to the secure artisan vault</p>
                  </div>
                </div>
                <button onClick={() => {
                  setIsAddModalOpen(false);
                  setAddError('');
                }} className="p-2 hover:bg-brand-bg rounded-full transition-colors">
                  <X className="w-5 h-5 text-brand-muted" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddCustomerSubmit} className="p-8 space-y-6">
                {addError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold">
                    <span>⚠️</span>
                    <span>{addError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* MOBILE NUMBER FIRST */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-4">Mobile Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                      <input
                        required
                        type="tel"
                        value={newCustomerPhone}
                        onChange={e => {
                          const val = e.target.value;
                          if (val.startsWith('+91 ')) {
                            setNewCustomerPhone(val);
                          } else if (val === '+91' || val === '+9' || val === '+') {
                            setNewCustomerPhone('+91 ');
                          } else if (!val.startsWith('+')) {
                            setNewCustomerPhone('+91 ' + val);
                          } else {
                            setNewCustomerPhone(val);
                          }
                        }}
                        className="w-full bg-white border border-brand-border rounded-full pl-14 pr-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold text-brand-dark"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-4">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                      <input
                        required
                        type="text"
                        value={newCustomerName}
                        onChange={e => setNewCustomerName(e.target.value)}
                        className="w-full bg-white border border-brand-border rounded-full pl-14 pr-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-display font-bold text-brand-dark"
                        placeholder="e.g. Arvind Kumar Shukla"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-4">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                      <input
                        type="email"
                        value={newCustomerEmail}
                        onChange={e => setNewCustomerEmail(e.target.value)}
                        className="w-full bg-white border border-brand-border rounded-full pl-14 pr-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold text-brand-dark"
                        placeholder="e.g. customer@luxury.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-4">Initial Order Count</label>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                      <input
                        type="number"
                        min="0"
                        value={newCustomerOrders}
                        onChange={e => setNewCustomerOrders(Number(e.target.value))}
                        className="w-full bg-white border border-brand-border rounded-full pl-14 pr-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold text-brand-dark"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-dark text-[#F5F3EC] py-4 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-brand-accent hover:text-brand-dark transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <Plus className="w-4 h-4" />
                  Add Customer
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <WhatsAppImportModal 
        isOpen={isWhatsAppModalOpen} 
        onClose={() => setIsWhatsAppModalOpen(false)} 
      />
    </div>
  );
}

