import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { RepairStatus, ShoeRepairRequest } from '../types';
import { format } from 'date-fns';
import { Phone, History, AlertCircle, ChevronDown, ChevronUp, Trash2, Edit, Search, FileText } from 'lucide-react';
import clsx from 'clsx';
import DashboardSummary from '../components/DashboardSummary';
import InvoiceModal from '../components/InvoiceModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

export default function Dashboard() {
  const { repairs, updateRepairStatus, updateRepair, deleteRepair } = useAppStore();
  const [editingRepair, setEditingRepair] = useState<ShoeRepairRequest | null>(null);
  const [viewingRepair, setViewingRepair] = useState<ShoeRepairRequest | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

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
    { title: 'Completed', status: 'Completed' },
    { title: 'Delivered', status: 'Delivered' },
  ];

  const chartData = columns.map(col => ({
    name: col.title,
    count: filteredRepairs.filter(r => r.status === col.status).length
  }));

  const COLORS = ['#f59e0b', '#3b82f6', '#22c55e', '#64748b'];

  return (
    <div className="space-y-6 h-full flex flex-col p-6">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 border border-brand-border rounded-xl shadow-sm">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-dark mb-1">Dashboard</h2>
          <span className="text-xs font-sans font-medium text-brand-muted bg-brand-border px-2 py-0.5 rounded-full uppercase tracking-wider">{format(new Date(), 'MMMM d, yyyy')}</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="block w-full sm:w-32 py-2 px-3 border border-brand-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-dark focus:border-brand-dark bg-brand-bg transition-colors"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-brand-muted" />
            </div>
            <input
              type="text"
              placeholder="Search tickets, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-brand-border rounded-md text-sm placeholder-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-dark focus:border-brand-dark bg-brand-bg transition-colors"
            />
          </div>
        </div>
      </header>

      <DashboardSummary />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 border border-brand-border rounded-xl shadow-sm h-80 flex flex-col">
          <h3 className="text-sm font-bold text-brand-muted uppercase mb-4">Repairs by Status</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 border border-brand-border rounded-xl shadow-sm h-80 flex flex-col">
          <h3 className="text-sm font-bold text-brand-muted uppercase mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
        {columns.map((col) => {
          const colRepairs = filteredRepairs.filter((r) => r.status === col.status);
          return (
            <div key={col.status} className="flex flex-col space-y-4">
              <div className="flex items-center justify-between px-2 py-2 bg-white rounded-lg border border-brand-border">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-dark">
                  {col.title}
                </span>
                <span className="text-xs font-bold bg-brand-border text-brand-dark px-2 py-0.5 rounded-full">
                  {colRepairs.length}
                </span>
              </div>
              
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {colRepairs.map((repair) => (
                  <RepairCard 
                    key={repair.id} 
                    repair={repair} 
                    onStatusChange={updateRepairStatus}
                    onEdit={setEditingRepair}
                    onDelete={deleteRepair}
                    onView={setViewingRepair}
                  />
                ))}
              </div>
            </div>
          );
        })}
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
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Repair Type</label>
                <input type="text" value={editingRepair.repairType} onChange={e => setEditingRepair({...editingRepair, repairType: e.target.value})} className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Price</label>
                <input type="number" value={editingRepair.price} onChange={e => setEditingRepair({...editingRepair, price: Number(e.target.value)})} className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
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
                      <span className="font-medium text-brand-dark">₹{(viewingRepair.advance || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-amber-600 font-bold">
                      <span>Balance Due</span>
                      <span>₹{(viewingRepair.balance || 0).toFixed(2)}</span>
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

  return (
    <div className={clsx(
      "bg-white rounded-lg p-4 border border-brand-border shadow-sm flex flex-col space-y-3 transition-all hover:shadow-md",
      repair.status === 'Completed' ? 'border-green-200' : ''
    )}>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">{repair.invoiceNumber}</span>
          {repair.priority && (
            <span className={clsx(
              "text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
              repair.priority === 'High' ? 'bg-red-100 text-red-700' :
              repair.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700'
            )}>
              {repair.priority}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {!repair.isSynced && <AlertCircle className="w-3 h-3 text-amber-500" />}
          <button onClick={(e) => { e.stopPropagation(); onEdit(repair); }} className="text-brand-muted hover:text-brand-dark transition-colors">
            <Edit className="w-3 h-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete this repair?')) onDelete(repair.id); }} className="text-brand-muted hover:text-red-500 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      <div onClick={() => onView(repair)} className="cursor-pointer">
        <div>
          <p className="text-sm font-bold text-brand-dark">{repair.shoeModel}</p>
          <p className="text-xs text-brand-muted">{repair.repairType}</p>
        </div>
        
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-brand-border">
          <p className="text-xs font-medium text-brand-dark truncate">{repair.customerName}</p>
          <span className="text-sm font-serif font-bold text-brand-dark">₹{repair.price.toFixed(0)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-brand-border">
        <button onClick={(e) => { e.stopPropagation(); triggerWhatsApp(repair.status); }} className="text-brand-muted hover:text-green-600 transition-colors">
          <Phone className="w-4 h-4" />
        </button>
        
        <select value={repair.status} onChange={(e) => { e.stopPropagation(); handleStatusChange(e); }} onClick={(e) => e.stopPropagation()} className="text-[10px] border-none bg-brand-bg rounded px-2 py-1">
          <option value="Received">Received</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
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
              <span>{item.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
