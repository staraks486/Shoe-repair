import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { RepairStatus, ShoeRepairRequest } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, History, AlertCircle, ChevronDown, ChevronUp, Trash2, Edit, Search, FileText, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import DashboardSummary from '../components/DashboardSummary';
import DashboardCalendar from '../components/DashboardCalendar';
import StatusDistribution from '../components/StatusDistribution';
import InvoiceModal from '../components/InvoiceModal';

const FALLBACK_COBBLERS = [
  { id: 'C-001', name: 'Devendra Vishwakarma', specialty: 'Goodyear-Welt Recrafting' },
  { id: 'C-002', name: 'Baldev Prasad', specialty: 'Exotic Patina & Dyeing' },
  { id: 'C-003', name: 'Rajesh Solanki', specialty: 'Stitch Reconstruction' }
];

export default function Dashboard() {
  const { repairs, updateRepairStatus, updateRepair, deleteRepair, settings } = useAppStore();
  const activeCobblers = settings?.cobblers?.length > 0 ? settings.cobblers : FALLBACK_COBBLERS;
  const [editingRepair, setEditingRepair] = useState<ShoeRepairRequest | null>(null);
  const [viewingRepair, setViewingRepair] = useState<ShoeRepairRequest | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<RepairStatus | 'All'>('All');

  const filteredRepairs = useMemo(() => {
    return repairs.filter(r => {
      const matchesSearch = r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.status.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = priorityFilter === 'All' || r.priority === priorityFilter || (!r.priority && priorityFilter === 'Medium'); // Default to medium if undefined

      return matchesSearch && matchesPriority;
    });
  }, [repairs, searchQuery, priorityFilter]);

  const columns: { title: string; status: RepairStatus }[] = [
    { title: 'Pending', status: 'Received' },
    { title: 'In Progress', status: 'In Progress' },
    { title: 'Polishing', status: 'Polishing' },
    { title: 'Ready for Pickup', status: 'Completed' },
    { title: 'Delivered', status: 'Delivered' },
  ];

  const chartData = columns.map(col => ({
    name: col.title,
    count: filteredRepairs.filter(r => r.status === col.status).length
  }));

  const COLORS = ['#f59e0b', '#3b82f6', '#a855f7', '#22c55e', '#64748b'];

  return (
    <div className="space-y-6 md:space-y-8 flex flex-col pb-10">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 bg-white p-6 border border-brand-border rounded-[24px] shadow-sm">
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-bold text-brand-dark tracking-tight">Workshop Monitor</h2>
          <p className="text-[10px] font-black text-brand-olive uppercase tracking-[0.2em] opacity-80">{format(new Date(), 'EEEE, MMMM do yyyy')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="flex-1 sm:w-32">
            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="block w-full py-2 px-3 border border-brand-border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-olive/10 focus:border-brand-olive bg-brand-bg transition-all"
            >
              <option value="All">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="flex-1 md:w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-muted" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-brand-border rounded-xl text-xs font-bold placeholder-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-olive/10 focus:border-brand-olive bg-brand-bg transition-all"
              />
            </div>
          </div>
        </div>
      </header>

      <DashboardSummary />
      
      <StatusDistribution repairs={repairs} />
      
      {/* Calendar Deadlines & Pick-ups Track */}
      <DashboardCalendar repairs={repairs} onViewRepair={setViewingRepair} />
      
      {/* Interactive Status Pills Navigation Bar */}
      <div className="space-y-2 shrink-0">
        <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider">Filter by Status</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => setSelectedStatus('All')}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap border shrink-0 flex items-center gap-1.5 cursor-pointer",
              selectedStatus === 'All'
                ? "bg-brand-dark text-white border-brand-dark shadow-md scale-[1.02]"
                : "bg-white text-brand-muted border-brand-border hover:text-brand-dark hover:border-brand-muted"
            )}
          >
            <span>All Tickets</span>
            <span className={clsx(
              "text-[9px] px-1.5 py-0.5 rounded-full font-black",
              selectedStatus === 'All' ? "bg-white/20 text-white" : "bg-brand-bg text-brand-dark"
            )}>
              {filteredRepairs.length}
            </span>
          </button>

          {columns.map((col) => {
            const count = filteredRepairs.filter(r => r.status === col.status).length;
            const isSelected = selectedStatus === col.status;
            return (
              <button
                key={col.status}
                onClick={() => setSelectedStatus(col.status)}
                className={clsx(
                  "px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap border shrink-0 flex items-center gap-1.5 cursor-pointer",
                  isSelected
                    ? "bg-brand-olive text-white border-brand-olive shadow-md scale-[1.02]"
                    : "bg-white text-brand-muted border-brand-border hover:text-brand-dark hover:border-brand-muted"
                )}
              >
                <span>{col.title}</span>
                <span className={clsx(
                  "text-[9px] px-1.5 py-0.5 rounded-full font-black",
                  isSelected ? "bg-white/25 text-white" : "bg-brand-bg text-brand-dark"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AnimatePresence mode="popLayout">
          {selectedStatus === 'All' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRepairs.map((repair) => (
                <RepairCard 
                  key={repair.id} 
                  repair={repair} 
                  onStatusChange={updateRepairStatus}
                  onEdit={setEditingRepair}
                  onDelete={deleteRepair}
                  onView={setViewingRepair}
                />
              ))}
              {filteredRepairs.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-16 bg-white rounded-2xl border border-brand-border text-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-brand-bg flex items-center justify-center mx-auto text-brand-muted opacity-60">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-extrabold text-sm text-brand-dark">No Care Tickets Found</h3>
                  <p className="text-xs text-brand-muted max-w-xs mx-auto">No footwear care logs match your search queries or active filters.</p>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRepairs.filter(r => r.status === selectedStatus).map((repair) => (
                <RepairCard 
                  key={repair.id} 
                  repair={repair} 
                  onStatusChange={updateRepairStatus}
                  onEdit={setEditingRepair}
                  onDelete={deleteRepair}
                  onView={setViewingRepair}
                />
              ))}
              {filteredRepairs.filter(r => r.status === selectedStatus).length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-16 bg-white rounded-2xl border border-brand-border text-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-brand-bg flex items-center justify-center mx-auto text-brand-muted opacity-60">
                    <Sparkles className="w-6 h-6 animate-pulse text-brand-olive" />
                  </div>
                  <h3 className="font-serif font-extrabold text-sm text-brand-dark">All Caught Up</h3>
                  <p className="text-xs text-brand-muted max-w-xs mx-auto">There are no active footwear care tickets in the "{columns.find(c => c.status === selectedStatus)?.title}" stage.</p>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
      
      {editingRepair && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold font-serif mb-4 text-brand-dark">Edit Repair</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Shoe Model</label>
                <input type="text" value={editingRepair.shoeModel} onChange={e => setEditingRepair({...editingRepair, shoeModel: e.target.value})} className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Repair Type (comma separated)</label>
                <input 
                  type="text" 
                  value={editingRepair.repairType.join(', ')} 
                  onChange={e => setEditingRepair({...editingRepair, repairType: e.target.value.split(',').map(s => s.trim())})} 
                  className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Price (₹)</label>
                <input type="number" value={editingRepair.price} onChange={e => {
                  const val = Number(e.target.value);
                  setEditingRepair({
                    ...editingRepair,
                    price: val,
                    balance: Math.max(0, val - (editingRepair.advance || 0))
                  });
                }} className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg font-mono" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Assigned Cobbler Artisan</label>
                <select 
                  value={editingRepair.assignedCobblerId || ''} 
                  onChange={e => {
                    const cid = e.target.value;
                    const cname = activeCobblers.find((c: any) => c.id === cid)?.name || 'Unassigned';
                    setEditingRepair({...editingRepair, assignedCobblerId: cid, assignedCobblerName: cname});
                  }}
                  className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg"
                >
                  <option value="">Select Cobbler</option>
                  {activeCobblers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.specialty})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Advance Deposit (₹)</label>
                  <input 
                    type="number" 
                    value={editingRepair.advance || 0} 
                    onChange={e => {
                      const adv = Number(e.target.value);
                      setEditingRepair({
                        ...editingRepair, 
                        advance: adv, 
                        balance: Math.max(0, editingRepair.price - adv),
                        paymentStatus: adv === 0 ? 'Unpaid' : (adv >= editingRepair.price ? 'Fully Paid' : 'Partially Paid')
                      });
                    }} 
                    className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Balance Due (₹)</label>
                  <div className="w-full border border-brand-border rounded-md p-2 text-sm bg-gray-100 font-mono text-brand-dark font-bold">
                    ₹{Math.max(0, editingRepair.price - (editingRepair.advance || 0)).toFixed(0)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Payment Method</label>
                  <select 
                    value={editingRepair.paymentMethod || 'None'} 
                    onChange={e => setEditingRepair({...editingRepair, paymentMethod: e.target.value as any})}
                    className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg"
                  >
                    <option value="None">None</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Transaction Ref</label>
                  <input 
                    type="text" 
                    value={editingRepair.transactionId || ''} 
                    onChange={e => setEditingRepair({...editingRepair, transactionId: e.target.value})} 
                    className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg font-mono" 
                    placeholder="TXN..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setEditingRepair(null)} className="px-4 py-2 border border-brand-border rounded-md text-sm font-bold uppercase tracking-widest hover:bg-brand-bg">Cancel</button>
                <button onClick={() => { updateRepair(editingRepair.id, editingRepair); setEditingRepair(null); }} className="px-4 py-2 bg-brand-dark text-white rounded-md text-sm font-bold uppercase tracking-widest hover:opacity-90">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingRepair && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setViewingRepair(null)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto transform transition-transform border-l border-brand-border">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h2 className="text-2xl font-serif font-bold text-brand-dark">{viewingRepair.invoiceNumber}</h2>
                    {viewingRepair.priority && (
                      <span className={clsx(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                        viewingRepair.priority === 'High' ? 'bg-red-100 text-red-700' :
                        viewingRepair.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      )}>
                        {viewingRepair.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-brand-muted">{viewingRepair.shoeModel}</p>
                </div>
                <button onClick={() => setViewingRepair(null)} className="p-2 text-brand-muted hover:text-brand-dark rounded-full hover:bg-brand-bg transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-2 border-b border-brand-border pb-1">Customer Details</h3>
                  <p className="text-sm font-medium text-brand-dark">{viewingRepair.customerName}</p>
                  <p className="text-xs text-brand-muted">{viewingRepair.phoneNumber}</p>
                  {viewingRepair.email && <p className="text-xs text-brand-muted">{viewingRepair.email}</p>}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-2 border-b border-brand-border pb-1">Repair Details</h3>
                  <div className="space-y-1">
                    <p className="text-sm"><span className="text-brand-muted">Services:</span> <span className="font-medium text-brand-dark">{Array.isArray(viewingRepair.repairType) ? viewingRepair.repairType.join(', ') : viewingRepair.repairType}</span></p>
                    <p className="text-sm"><span className="text-brand-muted">Received:</span> <span className="font-medium text-brand-dark">{format(new Date(viewingRepair.createdAt), 'PPP')}</span></p>
                    <p className="text-sm"><span className="text-brand-muted">Due Date:</span> <span className="font-medium text-brand-dark">{format(new Date(viewingRepair.dueDate), 'PPP')}</span></p>
                  </div>
                  {viewingRepair.description && (
                    <div className="mt-3 p-3 bg-brand-bg rounded-md">
                      <p className="text-xs text-brand-dark font-medium italic">"{viewingRepair.description}"</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-2 border-b border-brand-border pb-1">Repair Progress</h3>
                  <div className="relative pl-6 space-y-4 py-2 mt-2">
                    {/* Vertical line connector */}
                    <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-150" />
                    
                    {[
                      { key: 'Received', label: 'Received' },
                      { key: 'In Progress', label: 'In Progress' },
                      { key: 'Polishing', label: 'Polishing' },
                      { key: 'Completed', label: 'Ready for Pickup' }
                    ].map((step, idx) => {
                      const historyItem = viewingRepair.statusHistory?.find(h => h.status === step.key);
                      
                      let stepStatus: 'current' | 'completed' | 'pending' = 'pending';
                      
                      const vStep = (() => {
                        switch (viewingRepair.status) {
                          case 'Received': return 0;
                          case 'In Progress': return 1;
                          case 'Polishing': return 2;
                          case 'Completed': return 3;
                          case 'Delivered': return 4;
                          default: return 0;
                        }
                      })();
                      
                      if (vStep > idx || (step.key === 'Completed' && viewingRepair.status === 'Delivered')) {
                        stepStatus = 'completed';
                      } else if (vStep === idx) {
                        stepStatus = 'current';
                      }
                      
                      return (
                        <div key={step.key} className="relative flex items-start gap-3">
                          {/* Circle dot on vertical line */}
                          <div className={clsx(
                            "absolute -left-[23px] w-5 h-5 rounded-full flex items-center justify-center border-2 z-10 transition-all text-[10px]",
                            stepStatus === 'completed' ? "bg-brand-olive border-brand-olive text-white font-bold" :
                            stepStatus === 'current' ? "bg-white border-brand-olive text-brand-olive font-extrabold ring-4 ring-brand-olive/15 scale-110" :
                            "bg-white border-gray-300 text-gray-400"
                          )}>
                            {stepStatus === 'completed' ? '✓' : idx + 1}
                          </div>
                          
                          {/* Progress step text info */}
                          <div className="flex-1">
                            <p className={clsx(
                              "text-xs font-bold",
                              stepStatus === 'current' ? "text-brand-dark" : "text-brand-muted"
                            )}>
                              {step.label}
                            </p>
                            {historyItem ? (
                              <p className="text-[10px] text-brand-muted font-mono mt-0.5">
                                Logged: {format(new Date(historyItem.timestamp), 'MMM d, h:mm a')}
                              </p>
                            ) : stepStatus === 'current' ? (
                              <p className="text-[10px] text-brand-olive font-medium mt-0.5 animate-pulse">
                                Underway...
                              </p>
                            ) : (
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                Pending
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-2 border-b border-brand-border pb-1">Artisan Assignment</h3>
                  <div className="p-3 bg-brand-bg/50 border border-brand-border rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-sm font-bold text-brand-dark">{viewingRepair.assignedCobblerName || 'No artisan assigned'}</p>
                      {viewingRepair.assignedCobblerId && <p className="text-[10px] font-mono text-brand-muted mt-0.5">Artisan ID: {viewingRepair.assignedCobblerId}</p>}
                    </div>
                    <span className="text-[10px] font-bold text-brand-olive bg-white border border-brand-border/60 px-2 py-0.5 rounded shadow-xs">CW Certified</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-2 border-b border-brand-border pb-1">Cost Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-brand-muted">Base Repair Cost</span>
                      <span className="font-medium text-brand-dark">₹{viewingRepair.price.toFixed(2)}</span>
                    </div>
                    {viewingRepair.addons && viewingRepair.addons.length > 0 && viewingRepair.addons.map((addon, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-brand-muted">Addon: {addon.name}</span>
                        <span className="font-medium text-brand-dark">₹{addon.price.toFixed(2)}</span>
                      </div>
                    ))}
                    {viewingRepair.addonPrice > 0 && (!viewingRepair.addons || viewingRepair.addons.length === 0) && (
                      <div className="flex justify-between">
                        <span className="text-brand-muted">Addon Cost ({viewingRepair.addonType || 'Misc'})</span>
                        <span className="font-medium text-brand-dark">₹{viewingRepair.addonPrice.toFixed(2)}</span>
                      </div>
                    )}
                    {viewingRepair.insurancePrice > 0 && (
                      <div className="flex justify-between">
                        <span className="text-brand-muted">Cordwainers cover ({viewingRepair.insuranceType})</span>
                        <span className="font-medium text-brand-dark">₹{viewingRepair.insurancePrice.toFixed(2)}</span>
                      </div>
                    )}
                    {viewingRepair.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({viewingRepair.appliedOfferCode})</span>
                        <span className="font-medium">-₹{viewingRepair.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-brand-border pt-2 flex justify-between font-bold text-base">
                      <span className="text-brand-dark">Total Value</span>
                      <span className="text-brand-dark">
                        ₹{((viewingRepair.price || 0) + 
                           (viewingRepair.addons ? viewingRepair.addons.reduce((sum, a) => sum + a.price, 0) : viewingRepair.addonPrice || 0) + 
                           (viewingRepair.insurancePrice || 0) - 
                           (viewingRepair.discountAmount || 0)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-brand-muted">Advance Paid</span>
                      <span className="font-medium text-brand-dark">
                        ₹{(viewingRepair.advance || 0).toFixed(2)}
                        {viewingRepair.paymentMethod && viewingRepair.paymentMethod !== 'None' ? ` (${viewingRepair.paymentMethod})` : ''}
                      </span>
                    </div>
                    {viewingRepair.transactionId && (
                      <div className="flex justify-between text-[10px] text-brand-muted">
                        <span>Transaction Ref</span>
                        <span className="font-mono">{viewingRepair.transactionId}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-amber-600 font-bold">
                      <span>Balance Due</span>
                      <span>₹{(viewingRepair.balance || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-brand-muted pt-1">
                      <span>Payment Status</span>
                      <span className={clsx(
                        viewingRepair.paymentStatus === 'Fully Paid' ? 'text-green-600' :
                        viewingRepair.paymentStatus === 'Partially Paid' ? 'text-amber-500' :
                        'text-red-500'
                      )}>
                        {viewingRepair.paymentStatus || 'Unpaid'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-3 border-b border-brand-border pb-1">Order History</h3>
                  <div className="relative border-l border-brand-border ml-2 space-y-4">
                    {viewingRepair.statusHistory && viewingRepair.statusHistory.length > 0 ? viewingRepair.statusHistory.map((historyItem, idx) => (
                      <div key={idx} className="relative pl-4">
                        <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-brand-dark"></div>
                        <p className="text-xs font-bold text-brand-dark">{historyItem.status}</p>
                        <p className="text-[10px] text-brand-muted">{format(new Date(historyItem.timestamp), 'PPp')}</p>
                      </div>
                    )) : (
                      <div className="relative pl-4">
                        <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-brand-dark"></div>
                        <p className="text-xs font-bold text-brand-dark">{viewingRepair.status}</p>
                        <p className="text-[10px] text-brand-muted">{format(new Date(viewingRepair.createdAt), 'PPp')}</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              <div className="mt-8 pt-4 border-t border-brand-border flex gap-3">
                <button 
                  onClick={() => setShowInvoice(true)}
                  className="flex-1 bg-brand-dark text-white py-2 rounded-md text-sm font-bold uppercase tracking-widest hover:bg-brand-muted transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Generate Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInvoice && viewingRepair && (
        <InvoiceModal 
          invoice={viewingRepair} 
          onClose={() => setShowInvoice(false)} 
        />
      )}
    </div>
  );
}

interface RepairCardProps {
  key?: string;
  repair: ShoeRepairRequest;
  onStatusChange: (id: string, status: RepairStatus) => void;
  onEdit: (repair: ShoeRepairRequest) => void;
  onDelete: (id: string) => void;
  onView: (repair: ShoeRepairRequest) => void;
}

function RepairCard({ 
  repair, 
  onStatusChange,
  onEdit,
  onDelete,
  onView
}: RepairCardProps) {
  const { settings } = useAppStore();
  const [showTimeline, setShowTimeline] = useState(false);

  const triggerWhatsApp = (status: RepairStatus) => {
    const template = settings.whatsappTemplate || 'Hello {customerName}, your shoe repair ({repairType}) is now {status}. Invoice: {invoiceNumber}';
    const message = template
      .replace('{customerName}', repair.customerName)
      .replace('{repairType}', Array.isArray(repair.repairType) ? repair.repairType.join(', ') : repair.repairType)
      .replace('{status}', status)
      .replace('{invoiceNumber}', repair.invoiceNumber);
    const url = `https://wa.me/${repair.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as RepairStatus;
    onStatusChange(repair.id, newStatus);
    
    if (['In Progress', 'Completed', 'Delivered'].includes(newStatus)) {
      triggerWhatsApp(newStatus);
    }
  };

  const steps = [
    { key: 'Received', label: 'Received' },
    { key: 'In Progress', label: 'In Progress' },
    { key: 'Polishing', label: 'Polishing' },
    { key: 'Completed', label: 'Ready for Pickup' }
  ];

  const getCurrentStepIndex = () => {
    switch (repair.status) {
      case 'Received': return 0;
      case 'In Progress': return 1;
      case 'Polishing': return 2;
      case 'Completed': return 3;
      case 'Delivered': return 4;
      default: return 0;
    }
  };

  const currentStep = getCurrentStepIndex();

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        "bg-white rounded-2xl p-5 border border-brand-border shadow-sm flex flex-col space-y-4 transition-shadow duration-300 hover:shadow-premium group relative",
        repair.status === 'Completed' ? 'border-green-200 bg-green-50/10' : ''
      )}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="text-[10px] font-black text-brand-muted uppercase tracking-[0.15em] bg-brand-bg px-2 py-0.5 rounded-sm">{repair.invoiceNumber}</span>
          {repair.priority && (
            <span className={clsx(
              "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
              repair.priority === 'High' ? 'bg-red-100 text-red-700' :
              repair.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700'
            )}>
              {repair.priority}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1.5">
          {!repair.isSynced && <AlertCircle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />}
          <button onClick={(e) => { e.stopPropagation(); onEdit(repair); }} className="p-1.5 text-brand-muted hover:text-brand-dark hover:bg-brand-bg rounded-lg transition-all">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete this repair?')) onDelete(repair.id); }} className="p-1.5 text-brand-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div onClick={() => onView(repair)} className="cursor-pointer space-y-4">
        <div>
          <h4 className="font-serif text-lg font-bold text-brand-dark leading-tight tracking-tight group-hover:text-brand-olive transition-colors">{repair.shoeModel}</h4>
          <p className="text-xs font-medium text-brand-muted mt-1 leading-relaxed">
            {Array.isArray(repair.repairType) ? repair.repairType.join(', ') : repair.repairType}
          </p>
          {repair.assignedCobblerName && (
            <div className="flex items-center gap-2 mt-2.5">
              <div className="w-5 h-5 rounded-full bg-brand-olive/10 flex items-center justify-center">
                <span className="text-[8px] font-black text-brand-olive uppercase">{repair.assignedCobblerName.charAt(0)}</span>
              </div>
              <p className="text-[10px] text-brand-olive font-bold tracking-tight">
                Artisan: {repair.assignedCobblerName}
              </p>
            </div>
          )}
        </div>

        {/* Visual Progress Stepper - Refined */}
        <div className="py-3 border-t border-b border-brand-border/30" onClick={(e) => e.stopPropagation()}>
          <div className="relative flex items-center justify-between px-1">
            <div className="absolute left-2.5 right-2.5 h-[1.5px] bg-brand-border/40 top-1/2 -translate-y-1/2 z-0" />
            <div 
              className="absolute left-2.5 h-[1.5px] bg-brand-olive top-1/2 -translate-y-1/2 z-0 transition-all duration-500 ease-out" 
              style={{ width: `${currentStep === 4 ? 92 : (currentStep / 3) * 92}%` }} 
            />

            {steps.map((step, idx) => {
              const isCompleted = currentStep > idx;
              const isActive = currentStep === idx;
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => {
                    onStatusChange(repair.id, step.key as RepairStatus);
                    if (['In Progress', 'Polishing', 'Completed'].includes(step.key)) triggerWhatsApp(step.key as RepairStatus);
                  }}
                  className="relative z-10 flex flex-col items-center group/step focus:outline-none"
                >
                  <div className={clsx(
                    "w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-500 text-[9px] shadow-sm",
                    isCompleted && "bg-brand-olive border-brand-olive text-white",
                    isActive && "bg-white border-brand-olive text-brand-olive font-black ring-[5px] ring-brand-olive/10 scale-125 shadow-md",
                    !isCompleted && !isActive && "bg-white border-brand-border text-brand-muted group-hover/step:border-brand-muted"
                  )}>
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <span className={clsx(
                    "text-[8px] mt-2 font-black uppercase tracking-widest transition-colors",
                    isActive ? "text-brand-dark" : "text-brand-muted/70",
                  )}>
                    {idx === 3 ? 'Ready' : step.key === 'In Progress' ? 'PRG' : step.key.substring(0, 3)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-brand-muted uppercase tracking-wider">Customer</p>
            <p className="text-xs font-bold text-brand-dark">{repair.customerName}</p>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-brand-muted">Paid: ₹{(repair.advance || 0).toFixed(0)}</span>
              <span className={clsx(
                "font-black uppercase tracking-wider text-[8px]",
                repair.paymentStatus === 'Fully Paid' ? 'text-green-600' :
                repair.paymentStatus === 'Partially Paid' ? 'text-amber-500' :
                'text-red-500'
              )}>
                {repair.paymentStatus || 'Unpaid'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-brand-muted uppercase tracking-wider">Estimate</p>
            <p className="text-lg font-serif font-black text-brand-dark tracking-tighter">₹{repair.price.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-brand-border">
        <button onClick={(e) => { e.stopPropagation(); triggerWhatsApp(repair.status); }} className="text-brand-muted hover:text-green-600 transition-colors">
          <Phone className="w-4 h-4" />
        </button>
        
        <select value={repair.status} onChange={(e) => { e.stopPropagation(); handleStatusChange(e); }} onClick={(e) => e.stopPropagation()} className="text-[10px] border-none bg-brand-bg rounded px-2 py-1">
          <option value="Received">Received</option>
          <option value="In Progress">In Progress</option>
          <option value="Polishing">Polishing</option>
          <option value="Completed">Completed (Ready)</option>
          <option value="Delivered">Delivered</option>
        </select>
        
        <button onClick={(e) => { e.stopPropagation(); setShowTimeline(!showTimeline); }} className="text-brand-muted">
          {showTimeline ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {showTimeline && (
        <div className="pt-2 border-t border-brand-border space-y-1">
          {repair.statusHistory.map((item, idx) => (
            <div key={idx} className="flex justify-between text-[9px] text-brand-muted">
              <span>{format(new Date(item.timestamp), 'MMM d, HH:mm')}</span>
              <span>{item.status === 'Completed' ? 'Ready for Pickup' : item.status}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
