import React, { useState } from 'react';
import { useAppStore } from '../store';
import { RepairStatus, ShoeRepairRequest } from '../types';
import { format } from 'date-fns';
import { Phone, History, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import DashboardSummary from '../components/DashboardSummary';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
  const { repairs, updateRepairStatus } = useAppStore();

  const columns: { title: string; status: RepairStatus }[] = [
    { title: 'Received', status: 'Received' },
    { title: 'In Progress', status: 'In Progress' },
    { title: 'Completed', status: 'Completed' },
    { title: 'Delivered', status: 'Delivered' },
  ];

  const chartData = columns.map(col => ({
    name: col.title,
    count: repairs.filter(r => r.status === col.status).length
  }));

  return (
    <div className="space-y-6 h-full flex flex-col p-6">
      <header className="flex justify-between items-center bg-white p-6 border border-brand-border rounded-xl shadow-sm">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-dark mb-1">Dashboard</h2>
          <span className="text-xs font-sans font-medium text-brand-muted bg-brand-border px-2 py-0.5 rounded-full uppercase tracking-wider">{format(new Date(), 'MMMM d, yyyy')}</span>
        </div>
      </header>

      <DashboardSummary />
      
      <div className="bg-white p-6 border border-brand-border rounded-xl shadow-sm h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 2 ? '#22c55e' : '#475569'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
        {columns.map((col) => {
          const colRepairs = repairs.filter((r) => r.status === col.status);
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
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface RepairCardProps {
  key?: string;
  repair: ShoeRepairRequest;
  onStatusChange: (id: string, status: RepairStatus) => void;
}

function RepairCard({ 
  repair, 
  onStatusChange 
}: RepairCardProps) {
  const { settings } = useAppStore();
  const [showTimeline, setShowTimeline] = useState(false);

  const triggerWhatsApp = (status: RepairStatus) => {
    const template = settings.whatsappTemplate || 'Hello {customerName}, your shoe repair ({repairType}) is now {status}. Invoice: {invoiceNumber}';
    const message = template
      .replace('{customerName}', repair.customerName)
      .replace('{repairType}', repair.repairType)
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
        <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">{repair.invoiceNumber}</span>
        {!repair.isSynced && <AlertCircle className="w-3 h-3 text-amber-500" />}
      </div>
      
      <div>
        <p className="text-sm font-bold text-brand-dark">{repair.shoeModel}</p>
        <p className="text-xs text-brand-muted">{repair.repairType}</p>
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-brand-border">
        <p className="text-xs font-medium text-brand-dark truncate">{repair.customerName}</p>
        <span className="text-sm font-serif font-bold text-brand-dark">₹{repair.price.toFixed(0)}</span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-brand-border">
        <button onClick={() => triggerWhatsApp(repair.status)} className="text-brand-muted hover:text-green-600 transition-colors">
          <Phone className="w-4 h-4" />
        </button>
        
        <select value={repair.status} onChange={handleStatusChange} className="text-[10px] border-none bg-brand-bg rounded px-2 py-1">
          <option value="Received">Received</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Delivered">Delivered</option>
        </select>
        
        <button onClick={() => setShowTimeline(!showTimeline)} className="text-brand-muted">
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
