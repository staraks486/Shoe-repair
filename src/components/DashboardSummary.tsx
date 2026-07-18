import { useAppStore } from '../store';
import { TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

export default function DashboardSummary() {
  const { repairs, inventory } = useAppStore();

  const totalRevenue = repairs.reduce((sum, r) => sum + r.price + r.addonPrice + (r.hasInsurance ? r.insurancePrice : 0) - r.discountAmount, 0);
  const pendingRepairs = repairs.filter(r => r.status !== 'Completed' && r.status !== 'Delivered').length;
  const lowInventory = inventory.filter(i => i.quantity <= i.minThreshold).length;

  return (
    <div className="space-y-6">
      {/* Premium Statistics Metrics Grid */}
    <div className="grid grid-cols-3 gap-6">
      <div className="premium-card p-8 space-y-2">
        <p className="label-xs">Revenue</p>
        <p className="text-3xl font-display font-black text-brand-dark tracking-tighter">₹{Math.floor(totalRevenue).toLocaleString()}</p>
      </div>
      <div className="premium-card p-8 space-y-2">
        <p className="label-xs">Active Queue</p>
        <p className="text-3xl font-display font-black text-brand-dark tracking-tighter">{pendingRepairs}</p>
      </div>
      <div className="premium-card p-8 space-y-2">
        <p className="label-xs">Low Stock</p>
        <p className={clsx("text-3xl font-display font-black tracking-tighter", lowInventory > 0 ? "text-red-500" : "text-brand-dark")}>{lowInventory}</p>
      </div>
    </div>
    </div>
  );
}
