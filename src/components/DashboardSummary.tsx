import { useAppStore } from '../store';
import { motion } from 'motion/react';
import clsx from 'clsx';

export default function DashboardSummary() {
  const { repairs, inventory } = useAppStore();

  const totalRevenue = repairs.reduce((sum, r) => sum + r.price + (r.addonPrice || 0) + (r.hasInsurance ? r.insurancePrice : 0) - (r.discountAmount || 0), 0);
  const pendingRepairs = repairs.filter(r => r.status !== 'Completed' && r.status !== 'Delivered').length;
  const lowInventory = inventory.filter(i => i.quantity <= i.minThreshold).length;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
      >
        <motion.div variants={item} className="premium-card p-4 sm:p-8 space-y-1 sm:space-y-2">
          <p className="label-xs">Revenue</p>
          <p className="text-2xl sm:text-3xl font-display font-black text-brand-dark tracking-tighter">₹{Math.floor(totalRevenue).toLocaleString()}</p>
        </motion.div>
        <motion.div variants={item} className="premium-card p-4 sm:p-8 space-y-1 sm:space-y-2">
          <p className="label-xs">Active Queue</p>
          <p className="text-2xl sm:text-3xl font-display font-black text-brand-dark tracking-tighter">{pendingRepairs}</p>
        </motion.div>
        <motion.div variants={item} className="premium-card p-4 sm:p-8 space-y-1 sm:space-y-2">
          <p className="label-xs">Low Stock</p>
          <p className={clsx("text-2xl sm:text-3xl font-display font-black tracking-tighter", lowInventory > 0 ? "text-red-500" : "text-brand-dark")}>{lowInventory}</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
