import React, { useState } from 'react';
import { ShoeRepairRequest, RepairStatus } from '../types';
import { format } from 'date-fns';
import { 
  PackageCheck, 
  Hammer, 
  Sparkles, 
  CheckCircle2, 
  UserCheck, 
  Clock, 
  Check, 
  Calendar,
  User,
  ArrowRight
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

interface RepairStepperTimelineProps {
  repair: ShoeRepairRequest;
  onStatusChange?: (id: string, status: RepairStatus) => void;
  compact?: boolean;
  className?: string;
  showDetails?: boolean;
}

export const WORKFLOW_STEPS: { 
  status: RepairStatus; 
  label: string; 
  shortLabel: string;
  desc: string; 
  icon: React.ComponentType<{ className?: string }> 
}[] = [
  { status: 'Received', label: 'Received', shortLabel: 'Received', desc: 'Item received & tagged', icon: PackageCheck },
  { status: 'In Progress', label: 'In Progress', shortLabel: 'Crafting', desc: 'Repair work under way', icon: Hammer },
  { status: 'Polishing', label: 'Polishing', shortLabel: 'Polishing', desc: 'Finish, polish & inspection', icon: Sparkles },
  { status: 'Completed', label: 'Ready', shortLabel: 'Ready', desc: 'Ready for customer pickup', icon: CheckCircle2 },
  { status: 'Delivered', label: 'Delivered', shortLabel: 'Delivered', desc: 'Handed over to customer', icon: UserCheck },
];

export default function RepairStepperTimeline({
  repair,
  onStatusChange,
  compact = false,
  className = '',
  showDetails = true
}: RepairStepperTimelineProps) {
  const [updatingStatus, setUpdatingStatus] = useState<RepairStatus | null>(null);
  const [hoveredStep, setHoveredStep] = useState<RepairStatus | null>(null);

  // Helper to get index of current status
  const getStatusIndex = (s: RepairStatus) => {
    const idx = WORKFLOW_STEPS.findIndex(step => step.status === s);
    return idx === -1 ? 0 : idx;
  };

  const currentIndex = getStatusIndex(repair.status);

  // Find logged timestamp for a given status step
  const getStepLog = (stepStatus: RepairStatus) => {
    if (!repair.statusHistory || repair.statusHistory.length === 0) {
      if (stepStatus === 'Received' && repair.createdAt) {
        return {
          timestamp: repair.createdAt,
          user: repair.receivedBy || 'Staff'
        };
      }
      return null;
    }

    // Search backwards for the latest timestamp matching this status
    const match = repair.statusHistory.slice().reverse().find(h => h.status === stepStatus);
    if (match) {
      return match;
    }

    // Fallback for Received if missing in statusHistory
    if (stepStatus === 'Received' && repair.createdAt) {
      return {
        timestamp: repair.createdAt,
        user: repair.receivedBy || 'Staff'
      };
    }

    return null;
  };

  const handleStepClick = async (targetStatus: RepairStatus) => {
    if (!onStatusChange || targetStatus === repair.status) return;
    setUpdatingStatus(targetStatus);
    try {
      await onStatusChange(repair.id, targetStatus);
    } catch (e) {
      console.error("Failed to update status:", e);
    } finally {
      setTimeout(() => setUpdatingStatus(null), 300);
    }
  };

  if (compact) {
    return (
      <div className={clsx("w-full space-y-2", className)}>
        {/* Compact Horizontal Stepper */}
        <div className="relative flex items-center justify-between w-full px-1">
          {/* Background Connecting Line */}
          <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-1 bg-brand-border/40 rounded-full -z-0" />
          
          {/* Active Progress Fill Line */}
          <div 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-1 bg-brand-dark rounded-full transition-all duration-300 -z-0"
            style={{
              width: `${(currentIndex / (WORKFLOW_STEPS.length - 1)) * 100}%`
            }}
          />

          {WORKFLOW_STEPS.map((step, idx) => {
            const isPassed = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const stepLog = getStepLog(step.status);
            const Icon = step.icon;

            return (
              <div 
                key={step.status} 
                className="relative z-10 flex flex-col items-center group cursor-pointer"
                onClick={() => handleStepClick(step.status)}
                onMouseEnter={() => setHoveredStep(step.status)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <button
                  disabled={!onStatusChange}
                  className={clsx(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 border-2",
                    isCurrent 
                      ? "bg-brand-dark border-brand-dark text-white ring-4 ring-brand-dark/10 scale-110 shadow-md" 
                      : isPassed 
                        ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700" 
                        : "bg-white border-brand-border text-brand-muted hover:border-brand-dark hover:text-brand-dark"
                  )}
                  title={`Click to set status to ${step.label}`}
                >
                  {isPassed ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Step Label */}
                <span className={clsx(
                  "text-[9px] font-bold tracking-tight uppercase mt-1 transition-colors whitespace-nowrap",
                  isCurrent ? "text-brand-dark font-black" : isPassed ? "text-emerald-700 font-semibold" : "text-brand-muted/70"
                )}>
                  {step.shortLabel}
                </span>

                {/* Tooltip / Timestamp Badge on Hover or Current */}
                <AnimatePresence>
                  {(hoveredStep === step.status || (isCurrent && !hoveredStep)) && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 2, scale: 0.95 }}
                      className="absolute bottom-full mb-1.5 px-2.5 py-1 bg-brand-dark text-white rounded-lg text-[9px] font-mono whitespace-nowrap shadow-xl z-20 pointer-events-none flex flex-col items-center"
                    >
                      <span className="font-sans font-bold text-[9px] text-brand-accent">{step.label}</span>
                      {stepLog ? (
                        <span className="text-[8px] text-brand-muted/90">
                          {format(new Date(stepLog.timestamp), 'MMM d, h:mm a')}
                        </span>
                      ) : (
                        <span className="text-[8px] text-amber-300 italic">Click to log timestamp</span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Full Rich Expanded Stepper Component
  return (
    <div className={clsx("w-full bg-white rounded-2xl md:rounded-3xl border border-brand-border p-4 md:p-6 shadow-sm space-y-4", className)}>
      <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-olive" />
          <h4 className="text-xs md:text-sm font-display font-extrabold uppercase tracking-wider text-brand-dark">
            Repair Lifecycle & Timestamps
          </h4>
        </div>
        <span className="text-[10px] font-mono bg-brand-bg px-2.5 py-1 rounded-full text-brand-muted font-bold">
          Click stage to update
        </span>
      </div>

      {/* Horizontal / Responsive Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 md:gap-3 pt-1">
        {WORKFLOW_STEPS.map((step, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;
          const stepLog = getStepLog(step.status);
          const Icon = step.icon;
          const isUpdating = updatingStatus === step.status;

          return (
            <motion.div
              key={step.status}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleStepClick(step.status)}
              className={clsx(
                "relative rounded-xl md:rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between select-none group",
                isCurrent 
                  ? "bg-brand-dark text-white border-brand-dark shadow-md ring-2 ring-brand-dark/20" 
                  : isPassed 
                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-950 hover:bg-emerald-100/80" 
                    : "bg-brand-bg/50 border-brand-border/70 text-brand-muted hover:border-brand-dark hover:bg-white"
              )}
            >
              {/* Step Header */}
              <div className="flex items-center justify-between mb-2">
                <span className={clsx(
                  "w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  isCurrent 
                    ? "bg-brand-accent text-brand-dark font-black" 
                    : isPassed 
                      ? "bg-emerald-600 text-white" 
                      : "bg-white text-brand-muted border border-brand-border group-hover:border-brand-dark"
                )}>
                  {isPassed ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </span>

                <span className={clsx(
                  "text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase",
                  isCurrent 
                    ? "bg-white/10 text-brand-accent border border-white/10" 
                    : isPassed 
                      ? "bg-emerald-100 text-emerald-800" 
                      : "bg-brand-border/40 text-brand-muted"
                )}>
                  Step {idx + 1}
                </span>
              </div>

              {/* Step Info */}
              <div className="space-y-0.5 my-1">
                <h5 className={clsx(
                  "text-xs font-display font-extrabold tracking-tight",
                  isCurrent ? "text-white" : isPassed ? "text-emerald-900" : "text-brand-dark"
                )}>
                  {step.label}
                </h5>
                <p className={clsx(
                  "text-[10px] leading-tight line-clamp-1",
                  isCurrent ? "text-brand-muted/80" : "text-brand-muted"
                )}>
                  {step.desc}
                </p>
              </div>

              {/* Timestamp footer */}
              <div className="mt-2 pt-2 border-t border-current/10 flex items-center gap-1.5 text-[9px] font-mono">
                <Calendar className="w-3 h-3 opacity-60 flex-shrink-0" />
                <span className="truncate">
                  {stepLog ? (
                    format(new Date(stepLog.timestamp), 'MMM d, h:mm a')
                  ) : (
                    <span className="opacity-50 italic">Pending</span>
                  )}
                </span>
              </div>

              {isUpdating && (
                <div className="absolute inset-0 bg-brand-dark/80 rounded-xl md:rounded-2xl flex items-center justify-center text-white text-[10px] font-mono font-bold animate-pulse">
                  Logging...
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Status History Log Table */}
      {showDetails && repair.statusHistory && repair.statusHistory.length > 0 && (
        <div className="mt-3 pt-3 border-t border-brand-border/40 space-y-2">
          <p className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">
            Automated Audit Log
          </p>
          <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
            {repair.statusHistory.slice().reverse().map((entry, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between bg-brand-bg/80 px-3 py-1.5 rounded-xl text-[10px] font-mono text-brand-dark border border-brand-border/40"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-brand-dark">{entry.status}</span>
                  <span className="text-brand-muted/70">by {entry.user || 'Staff'}</span>
                </div>
                <span className="text-brand-muted font-medium">
                  {format(new Date(entry.timestamp), 'MMM d, yyyy - h:mm:ss a')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
