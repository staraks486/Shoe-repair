import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { RepairStatus, ShoeRepairRequest } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, History, AlertCircle, ChevronDown, ChevronUp, Trash2, Edit, Search, FileText, Sparkles, Check, X } from 'lucide-react';
import clsx from 'clsx';
import DashboardSummary from '../components/DashboardSummary';
import AppointmentSummary from '../components/AppointmentSummary';
import DashboardCalendar from '../components/DashboardCalendar';
import StatusDistribution from '../components/StatusDistribution';
import InvoiceModal from '../components/InvoiceModal';
import DeleteConfirmationButton from '../components/DeleteConfirmationButton';
import PhotoManager from '../components/PhotoManager';
import PageHeader from '../components/PageHeader';
import IntroBanner from '../components/IntroBanner';

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

  const COLORS = ['#1C1917', '#44403C', '#78716C', '#A8A29E', '#D6D3D1'];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader 
        title="Workshop Hub" 
        subtitle="Daily Operations & Analytics" 
      />

      <IntroBanner />

      {/* Analytics Visualization - High Visibility Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <DashboardSummary />
        </div>
        <div className="lg:col-span-1">
          <AppointmentSummary />
        </div>
      </section>
      
      <section className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
        <StatusDistribution repairs={repairs} />
      </section>
      
      {/* Calendar Deadlines & Pick-ups Track */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
        <DashboardCalendar repairs={repairs} onViewRepair={setViewingRepair} />
      </section>
      
      {/* Interactive Status Pills Navigation Bar */}
      <section className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex gap-8 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedStatus('All')}
              className={clsx(
                "px-1 py-1 text-[10px] font-black uppercase tracking-[0.25em] transition-all whitespace-nowrap border-b-2 shrink-0",
                selectedStatus === 'All'
                  ? "border-brand-dark text-brand-dark"
                  : "border-transparent text-brand-muted hover:text-brand-dark"
              )}
            >
              All Queue
            </button>

            {columns.map((col) => {
              const isSelected = selectedStatus === col.status;
              return (
                <button
                  key={col.status}
                  onClick={() => setSelectedStatus(col.status)}
                  className={clsx(
                    "px-1 py-1 text-[10px] font-black uppercase tracking-[0.25em] transition-all whitespace-nowrap border-b-2 shrink-0",
                    isSelected
                      ? "border-brand-dark text-brand-dark"
                      : "border-transparent text-brand-muted hover:text-brand-dark"
                  )}
                >
                  {col.title}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
            <input
              type="text"
              placeholder="Search active jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border-none rounded-full text-xs font-bold shadow-premium focus:ring-0"
            />
          </div>
        </div>
      </section>

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
                  <h3 className="font-display font-extrabold text-sm text-brand-dark">No Care Tickets Found</h3>
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
                  <h3 className="font-display font-extrabold text-sm text-brand-dark">All Caught Up</h3>
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
            <h3 className="text-lg font-bold font-display mb-4 text-brand-dark">Edit Repair</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Shoe Model</label>
                <input type="text" value={editingRepair.shoeModel || ''} onChange={e => setEditingRepair({...editingRepair, shoeModel: e.target.value})} className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Repair Type (comma separated)</label>
                <input 
                  type="text" 
                  value={(editingRepair.repairType || []).join(', ')} 
                  onChange={e => setEditingRepair({...editingRepair, repairType: e.target.value.split(',').map(s => s.trim())})} 
                  className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Price (₹)</label>
                <input type="number" value={editingRepair.price || 0} onChange={e => {
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
                    <h2 className="text-2xl font-display font-bold text-brand-dark">{viewingRepair.invoiceNumber}</h2>
                    {viewingRepair.priority && (
                      <span className={clsx(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                        viewingRepair.priority === 'High' ? 'bg-brand-dark text-white' :
                        viewingRepair.priority === 'Medium' ? 'bg-brand-muted text-white' :
                        'bg-brand-bg text-brand-dark'
                      )}>
                        {viewingRepair.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-brand-muted truncate max-w-[200px]">{viewingRepair.shoeModel}</p>
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
                  <p className="text-sm font-medium text-brand-dark truncate max-w-[200px]">{viewingRepair.customerName}</p>
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
                  <h3 className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-3 border-b border-brand-border pb-1">Visual Documentation</h3>
                  <div className="space-y-6">
                    <PhotoManager 
                      label="Before (Intake Condition)"
                      photos={viewingRepair.beforePhotos || []}
                      onAdd={(p) => {
                         const updatedPhotos = [...(viewingRepair.beforePhotos || []), p];
                         updateRepair(viewingRepair.id, { beforePhotos: updatedPhotos });
                         setViewingRepair({ ...viewingRepair, beforePhotos: updatedPhotos });
                      }}
                      onRemove={(id) => {
                         const updatedPhotos = (viewingRepair.beforePhotos || []).filter(p => p.id !== id);
                         updateRepair(viewingRepair.id, { beforePhotos: updatedPhotos });
                         setViewingRepair({ ...viewingRepair, beforePhotos: updatedPhotos });
                      }}
                      maxPhotos={5}
                    />
                    <PhotoManager 
                      label="After (Restoration Result)"
                      photos={viewingRepair.afterPhotos || []}
                      onAdd={(p) => {
                         const updatedPhotos = [...(viewingRepair.afterPhotos || []), p];
                         updateRepair(viewingRepair.id, { afterPhotos: updatedPhotos });
                         setViewingRepair({ ...viewingRepair, afterPhotos: updatedPhotos });
                      }}
                      onRemove={(id) => {
                         const updatedPhotos = (viewingRepair.afterPhotos || []).filter(p => p.id !== id);
                         updateRepair(viewingRepair.id, { afterPhotos: updatedPhotos });
                         setViewingRepair({ ...viewingRepair, afterPhotos: updatedPhotos });
                      }}
                      maxPhotos={5}
                    />
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
                      <div className="flex justify-between text-brand-muted italic">
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
                    <div className="flex justify-between text-xs text-brand-dark font-black">
                      <span>Balance Due</span>
                      <span>₹{(viewingRepair.balance || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-brand-muted pt-1">
                      <span>Payment Status</span>
                      <span className={clsx(
                        viewingRepair.paymentStatus === 'Fully Paid' ? 'text-brand-dark' :
                        viewingRepair.paymentStatus === 'Partially Paid' ? 'text-brand-muted' :
                        'text-brand-dark underline'
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
    let template = '';
    
    if (status === 'Received') {
      template = settings.whatsappIntakeTemplate || 'Hello {customerName}, your shoe repair ({repairType}) has been received successfully. Ticket: {invoiceNumber}';
    } else if (status === 'Completed') {
      template = settings.whatsappReadyTemplate || 'Great news {customerName}! Your {shoeModel} is ready for pickup. Balance due: ₹{balance}. Ticket: {invoiceNumber}';
    } else {
      template = 'Hello {customerName}, your repair status ({repairType}) is now: {status}. Ticket: {invoiceNumber}';
    }

    const message = template
      .replace(/{customerName}/g, repair.customerName)
      .replace(/{repairType}/g, Array.isArray(repair.repairType) ? repair.repairType.join(', ') : repair.repairType)
      .replace(/{status}/g, status === 'Completed' ? 'Ready for Pickup' : status)
      .replace(/{invoiceNumber}/g, repair.invoiceNumber)
      .replace(/{shoeModel}/g, repair.shoeModel)
      .replace(/{price}/g, repair.price.toString())
      .replace(/{balance}/g, (repair.balance || (repair.price - (repair.advance || 0))).toString());

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

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={clsx(
        "premium-card p-5 sm:p-8 flex flex-col justify-between min-h-[260px] sm:min-h-[280px] group",
        repair.status === 'Completed' ? 'ring-2 ring-brand-dark/10' : ''
      )}
    >
      <div className="space-y-4 sm:space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5 flex-1 min-w-0">
            <p className="label-xs">{repair.invoiceNumber}</p>
            <h4 onClick={() => onView(repair)} className="text-lg sm:text-xl font-display font-black text-brand-dark leading-tight tracking-tight hover:text-brand-muted transition-colors cursor-pointer truncate max-w-full">
              {repair.shoeModel}
            </h4>
          </div>
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(repair)} className="p-3 text-brand-muted hover:text-brand-dark transition-colors" title="Edit Repair"><Edit className="w-5 h-5 sm:w-4 sm:h-4" /></button>
            <DeleteConfirmationButton onDelete={() => onDelete(repair.id)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {Array.isArray(repair.repairType) ? repair.repairType.slice(0, 2).map((t, i) => (
            <span key={i} className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-brand-bg rounded-full text-[8px] sm:text-[9px] font-black text-brand-muted uppercase tracking-widest">{t}</span>
          )) : (
            <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-brand-bg rounded-full text-[8px] sm:text-[9px] font-black text-brand-muted uppercase tracking-widest">{repair.repairType}</span>
          )}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-brand-border/40 mt-4 sm:mt-6">
        <div className="flex justify-between items-end gap-2">
          <div className="space-y-3 sm:space-y-4 flex-1 min-w-0">
            <div className="space-y-1.5 min-w-0">
              <p className="label-xs text-brand-muted truncate max-w-full">{repair.customerName}</p>
              <select 
                value={repair.status} 
                onChange={handleStatusChange}
                className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-brand-bg border-none rounded-full px-3 py-1.5 sm:px-4 sm:py-2 cursor-pointer hover:bg-brand-border/40 transition-all max-w-full"
              >
                <option value="Received">Received</option>
                <option value="In Progress">In Progress</option>
                <option value="Polishing">Polishing</option>
                <option value="Completed">Ready</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
            
            <div className="flex items-center gap-4">
              <button onClick={() => triggerWhatsApp(repair.status)} className="text-brand-muted hover:text-brand-dark transition-colors">
                <Phone className="w-4 h-4" />
              </button>
              <button onClick={() => setShowTimeline(!showTimeline)} className="text-brand-muted hover:text-brand-dark transition-colors">
                <History className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-display font-black text-brand-dark tracking-tighter">₹{repair.price.toLocaleString()}</p>
          </div>
        </div>

        {showTimeline && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="pt-2 space-y-1 overflow-hidden"
          >
            {repair.statusHistory.slice(-3).map((item, idx) => (
              <div key={idx} className="flex justify-between text-[8px] text-brand-muted font-bold uppercase tracking-tight">
                <span>{item.status}</span>
                <span>{format(new Date(item.timestamp), 'MMM d')}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
