import { useState } from 'react';
import { useAppStore } from '../store';
import { format } from 'date-fns';
import { Search, Phone, Mail, Calendar, MessageSquare, Trash2, User } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import SyncContactsButton from '../components/SyncContactsButton';
import WhatsAppImportModal from '../components/WhatsAppImportModal';
import PageHeader from '../components/PageHeader';
import SwipeToDelete from '../components/SwipeToDelete';

export default function Customers() {
  const { customers, deleteCustomer } = useAppStore();
  const [search, setSearch] = useState('');
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

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
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader 
        title="Customers" 
        subtitle="Artisan Client Archive & CRM" 
      >
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
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

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block bg-white rounded-[40px] border border-brand-border shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-border">
            <thead>
              <tr className="bg-brand-bg/50">
                <th scope="col" className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Client Identity</th>
                <th scope="col" className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Contact Node</th>
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
                        <div className="text-sm font-bold text-brand-dark font-display">{c.name}</div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-brand-dark">
                          <Phone className="w-3.5 h-3.5 text-brand-muted opacity-40" />
                          {c.phoneNumber}
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-2 text-[10px] text-brand-muted font-medium">
                            <Mail className="w-3.5 h-3.5 text-brand-muted opacity-40" />
                            {c.email}
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
                        onClick={() => deleteCustomer(c.phoneNumber)}
                        className="p-2 rounded-full text-brand-muted hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
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
                <SwipeToDelete onDelete={() => deleteCustomer(c.phoneNumber)}>
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

      <WhatsAppImportModal 
        isOpen={isWhatsAppModalOpen} 
        onClose={() => setIsWhatsAppModalOpen(false)} 
      />
    </div>
  );
}

