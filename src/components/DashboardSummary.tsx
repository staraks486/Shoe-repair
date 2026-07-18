import { useAppStore } from '../store';
import { TrendingUp, Clock, AlertTriangle } from 'lucide-react';

export default function DashboardSummary() {
  const { repairs, inventory } = useAppStore();

  const totalRevenue = repairs.reduce((sum, r) => sum + r.price + r.addonPrice + (r.hasInsurance ? r.insurancePrice : 0) - r.discountAmount, 0);
  const pendingRepairs = repairs.filter(r => r.status !== 'Completed' && r.status !== 'Delivered').length;
  const lowInventory = inventory.filter(i => i.quantity <= i.minThreshold).length;

  return (
    <div className="space-y-6">
      {/* Premium Statistics Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total Revenue Card */}
        <div className="bg-white p-4 rounded-2xl border border-brand-border/60 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-premium transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-brand-olive/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center gap-1.5 text-brand-muted">
            <TrendingUp className="w-4 h-4 text-brand-olive shrink-0" />
            <h4 className="text-[10px] font-black uppercase tracking-wider leading-none">Revenue</h4>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-brand-muted font-bold tracking-tight">Total Sales</p>
            <p className="text-sm font-mono font-black text-brand-dark truncate mt-0.5 tracking-tighter">₹{Math.floor(totalRevenue).toLocaleString()}</p>
          </div>
        </div>

        {/* Pending Care Tickets Card */}
        <div className="bg-white p-4 rounded-2xl border border-brand-border/60 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-premium transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center gap-1.5 text-brand-muted">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <h4 className="text-[10px] font-black uppercase tracking-wider leading-none">Queue</h4>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-brand-muted font-bold tracking-tight">Active Jobs</p>
            <p className="text-sm font-mono font-black text-brand-dark truncate mt-0.5 tracking-tighter">{pendingRepairs}</p>
          </div>
        </div>

        {/* Low Inventory Stock Card */}
        <div className="bg-white p-4 rounded-2xl border border-brand-border/60 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-premium transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-red-500/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center gap-1.5 text-brand-muted">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <h4 className="text-[10px] font-black uppercase tracking-wider leading-none">Supplies</h4>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-brand-muted font-bold tracking-tight">Low Stock</p>
            <p className="text-sm font-mono font-black text-brand-dark truncate mt-0.5 tracking-tighter text-red-600">
              {lowInventory}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
