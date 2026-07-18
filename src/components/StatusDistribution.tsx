import React from 'react';
import { ShoeRepairRequest, RepairStatus } from '../types';
import clsx from 'clsx';
import { motion } from 'motion/react';

interface StatusDistributionProps {
  repairs: ShoeRepairRequest[];
}

export default function StatusDistribution({ repairs }: StatusDistributionProps) {
  const total = repairs.length;

  const distribution = [
    { label: 'Pending', status: 'Received', color: 'bg-amber-400' },
    { label: 'In Progress', status: 'In Progress', color: 'bg-blue-500' },
    { label: 'Polishing', status: 'Polishing', color: 'bg-purple-500' },
    { label: 'Ready', status: 'Completed', color: 'bg-green-500' },
    { label: 'Delivered', status: 'Delivered', color: 'bg-slate-400' },
  ].map(item => {
    const count = repairs.filter(r => r.status === item.status).length;
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return { ...item, count, percentage };
  });

  if (total === 0) return null;

  return (
    <div className="bg-white p-6 rounded-[24px] border border-brand-border shadow-sm space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1 block">Workflow Health</span>
          <h3 className="font-serif text-xl font-bold text-brand-dark">Status Distribution</h3>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-brand-dark">{total}</span>
          <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest block">Total Tickets</span>
        </div>
      </div>

      <div className="relative h-4 w-full bg-brand-bg rounded-full overflow-hidden flex shadow-inner border border-brand-border/20">
        {distribution.map((item, idx) => (
          item.percentage > 0 && (
            <motion.div
              key={item.status}
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 pt-2">
        {distribution.map((item) => (
          <div key={item.status} className="space-y-1">
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
