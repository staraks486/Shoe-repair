import { useAppStore } from '../store';
import { RepairStatus, ShoeRepairRequest } from '../types';
import { format } from 'date-fns';
import { Phone, Clock, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export default function Dashboard() {
  const { repairs, updateRepairStatus } = useAppStore();

  const columns: { title: string; status: RepairStatus }[] = [
    { title: 'Received', status: 'Received' },
    { title: 'In Progress', status: 'In Progress' },
    { title: 'Completed', status: 'Completed' },
    { title: 'Delivered', status: 'Delivered' },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <header className="flex justify-between items-center bg-white p-6 border-b border-brand-border rounded-xl shadow-sm mb-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-dark mb-1">Kanban Workflow</h2>
          <span className="text-xs font-sans font-medium text-brand-muted bg-brand-border px-2 py-0.5 rounded-full uppercase tracking-wider">{format(new Date(), 'MMMM d')}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 overflow-y-auto">
        {columns.map((col) => {
          const colRepairs = repairs.filter((r) => r.status === col.status);
          return (
            <div key={col.status} className="flex flex-col space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-olive">
                  {col.title} ({colRepairs.length})
                </span>
                <span className="text-lg text-brand-olive">•</span>
              </div>
              
              <div className="flex-1 space-y-3">
                {colRepairs.map((repair) => (
                  <RepairCard 
                    key={repair.id} 
                    repair={repair} 
                    onStatusChange={updateRepairStatus}
                  />
                ))}
                {colRepairs.length === 0 && col.status === 'Completed' && (
                  <div className="bg-brand-olive bg-opacity-5 rounded-xl p-4 border-2 border-dashed border-brand-olive flex items-center justify-center h-32">
                    <p className="text-brand-olive text-xs font-medium italic text-center">Move items here to trigger WhatsApp notification</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RepairCard({ 
  repair, 
  onStatusChange 
}: { 
  repair: ShoeRepairRequest; 
  onStatusChange: (id: string, status: RepairStatus) => void 
}) {
  const { settings } = useAppStore();
  const isOverdue = new Date(repair.dueDate) < new Date() && repair.status !== 'Delivered';

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

  const sendWhatsApp = () => {
    triggerWhatsApp(repair.status);
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
      "bg-brand-surface rounded-xl p-4 border border-brand-border-dark flex flex-col space-y-3",
      repair.status === 'Completed' ? 'bg-white shadow-sm border-green-200' : '',
      repair.status === 'In Progress' ? 'bg-white shadow-sm' : ''
    )}>
      <div className="flex justify-between items-start">
        <span className={clsx(
          "text-xs font-bold", 
          repair.status === 'Completed' ? "text-green-700" : "text-brand-accent"
        )}>{repair.invoiceNumber}</span>
        
        <div className="flex gap-2">
          {!repair.isSynced && (
            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-brand-border-dark flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-500" /> Unsynced
            </span>
          )}
        </div>
      </div>
      
      <div>
        <p className="font-medium text-brand-dark">{repair.shoeModel}</p>
        <p className="text-xs text-brand-muted">{repair.repairType}</p>
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-brand-border-dark">
        <div className="flex flex-col">
          <span className="text-[10px] text-brand-olive">Customer: {repair.customerName}</span>
          {repair.receivedBy && <span className="text-[10px] text-brand-muted">Assisted by: {repair.receivedBy}</span>}
        </div>
        <span className="text-xs font-bold font-serif text-brand-dark">₹{repair.price.toFixed(2)}</span>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-border-dark">
        <button
          onClick={sendWhatsApp}
          className="text-brand-muted hover:text-green-600 transition-colors"
          title="Send WhatsApp Update"
        >
          <Phone className="w-4 h-4" />
        </button>
        
        <select
          value={repair.status}
          onChange={handleStatusChange}
          className="text-xs border-brand-border-dark rounded-md py-1 pl-2 pr-6 focus:ring-brand-accent focus:border-brand-accent bg-white"
        >
          <option value="Received">Received</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Delivered">Delivered</option>
        </select>
      </div>
    </div>
  );
}
