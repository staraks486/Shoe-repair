import React from 'react';
import { ShoeRepairRequest, RepairStatus } from '../types';
import { useAppStore } from '../store';
import clsx from 'clsx';
import { motion } from 'motion/react';

interface StatusDistributionProps {
  repairs: ShoeRepairRequest[];
}

export default function StatusDistribution({ repairs }: StatusDistributionProps) {
  const { appointments } = useAppStore();
  const activeBookings = appointments.filter(a => a.status !== 'Cancelled');
  const total = repairs.length + activeBookings.length;

  const distribution = [
    { label: 'Bookings', key: 'Bookings', count: activeBookings.length, color: 'bg-indigo-500' },
    { label: 'Pending', key: 'Received', count: repairs.filter(r => r.status === 'Received').length, color: 'bg-amber-400' },
    { label: 'In Progress', key: 'In Progress', count: repairs.filter(r => r.status === 'In Progress').length, color: 'bg-[#B89C72]' },
    { label: 'Polishing', key: 'Polishing', count: repairs.filter(r => r.status === 'Polishing').length, color: 'bg-purple-500' },
    { label: 'Ready', key: 'Completed', count: repairs.filter(r => r.status === 'Completed').length, color: 'bg-green-500' },
    { label: 'Delivered', key: 'Delivered', count: repairs.filter(r => r.status === 'Delivered').length, color: 'bg-slate-400' },
  ].map(item => {
    const percentage = total > 0 ? (item.count / total) * 100 : 0;
    return { ...item, percentage };
  });

  if (total === 0) return null;

  return (
    <div className="bg-white p-6 rounded-[24px] border border-brand-border shadow-sm space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1 block">Workflow Health</span>
          <h3 className="font-display text-xl font-bold text-brand-dark">Status Distribution</h3>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-brand-dark">{total}</span>
          <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest block">Total Work Items</span>
        </div>
      </div>

      <div className="relative h-4 w-full bg-brand-bg rounded-full overflow-hidden flex shadow-inner border border-brand-border/20">
        {distribution.map((item, idx) => (
          item.percentage > 0 && (
            <motion.div
              key={item.key}
              initial={{ width: 0 }}
              animate={{ width: `${item.percentage}%` }}
              transition={{ duration: 0.8, delay: idx * 0.1, ease: "easeOut" }}
              className={clsx("h-full relative group cursor-help", item.color)}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          )
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 pt-2">
        {distribution.map((item) => (
          <div key={item.key} className="space-y-1">
            <div className="flex items-center gap-1.5">
              <div className={clsx("w-2 h-2 rounded-full", item.color)} />
              <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest truncate">{item.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-brand-dark">{item.count}</span>
              <span className="text-[10px] font-bold text-brand-muted">({Math.round(item.percentage)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
