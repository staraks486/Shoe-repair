import React, { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths,
  parseISO,
  isValid
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Info
} from 'lucide-react';
import clsx from 'clsx';
import { ShoeRepairRequest, RepairStatus } from '../types';

interface DashboardCalendarProps {
  repairs: ShoeRepairRequest[];
  onViewRepair: (repair: ShoeRepairRequest) => void;
}

export default function DashboardCalendar({ repairs, onViewRepair }: DashboardCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Helper to safe parse date strings
  const parseRepairDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    try {
      const parsed = parseISO(dateStr);
      if (isValid(parsed)) return parsed;
      const parsedFallback = new Date(dateStr);
      if (isValid(parsedFallback)) return parsedFallback;
    } catch (e) {
      console.warn("Invalid date format", dateStr);
    }
    return null;
  };

  // Navigate months
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Map repairs by due date for high performance lookups
  const repairsWithParsedDates = useMemo(() => {
    return repairs.map(r => ({
      ...r,
      parsedDueDate: parseRepairDate(r.dueDate)
    })).filter(r => r.parsedDueDate !== null) as (ShoeRepairRequest & { parsedDueDate: Date })[];
  }, [repairs]);

  // Filtered repairs due on selected date
  const selectedDateRepairs = useMemo(() => {
    return repairsWithParsedDates.filter(r => {
      const isSame = isSameDay(r.parsedDueDate, selectedDate);
      if (!isSame) return false;
      if (filterStatus === 'All') return true;
      if (filterStatus === 'Pending/In Progress') {
        return r.status === 'Received' || r.status === 'In Progress' || r.status === 'Polishing';
      }
      return r.status === filterStatus;
    });
  }, [repairsWithParsedDates, selectedDate, filterStatus]);

  // Aggregate stats of selected month for a quick visual overview
  const monthStats = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    const monthRepairs = repairsWithParsedDates.filter(r => 
      r.parsedDueDate >= start && r.parsedDueDate <= end
    );

    return {
      total: monthRepairs.length,
      highPriority: monthRepairs.filter(r => r.priority === 'High').length,
      completed: monthRepairs.filter(r => r.status === 'Completed' || r.status === 'Delivered').length,
      pending: monthRepairs.filter(r => r.status === 'Received' || r.status === 'In Progress' || r.status === 'Polishing').length,
    };
  }, [repairsWithParsedDates, currentMonth]);

  // Check if a day has repairs due
  const getRepairsForDay = (day: Date) => {
    return repairsWithParsedDates.filter(r => isSameDay(r.parsedDueDate, day));
  };

  const getStatusColor = (status: RepairStatus) => {
    switch (status) {
      case 'Received': return 'bg-amber-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Polishing': return 'bg-purple-500';
      case 'Completed': return 'bg-green-500';
      case 'Delivered': return 'bg-slate-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white border border-brand-border rounded-[32px] shadow-premium overflow-hidden flex flex-col lg:flex-row min-h-[500px]">
      
      {/* LEFT: Calendar Interface */}
      <div className="flex-1 p-8 border-b lg:border-b-0 lg:border-r border-brand-border flex flex-col">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-bold text-brand-dark">Schedule</h3>
            <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Repair Deadlines</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleToday}
              className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest bg-brand-bg hover:bg-brand-border/40 rounded-full transition-colors text-brand-dark"
            >
              Today
            </button>
            <div className="flex items-center bg-brand-bg rounded-full p-1 border border-brand-border">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-brand-border/40 text-brand-dark rounded-full transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-black text-brand-dark px-4 min-w-[120px] text-center uppercase tracking-widest">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button onClick={handleNextMonth} className="p-1.5 hover:bg-brand-border/40 text-brand-dark rounded-full transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 gap-2 text-center mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <span key={d} className="text-[9px] font-black uppercase tracking-widest text-brand-muted">
              {d}
            </span>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-2 flex-1">
          {calendarDays.map((day, idx) => {
            const isCurrentMonthDay = day.getMonth() === currentMonth.getMonth();
            const dayRepairs = getRepairsForDay(day);
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDay = isToday(day);

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={clsx(
                  "aspect-square rounded-2xl p-2 relative flex flex-col items-center justify-center transition-all group",
                  isCurrentMonthDay ? "bg-white hover:bg-brand-bg" : "bg-brand-bg/20 text-gray-300",
                  isSelected ? "bg-brand-dark text-white ring-4 ring-brand-dark/10" : "border border-brand-border/40",
                  isTodayDay && !isSelected ? "border-brand-accent bg-brand-accent/5" : ""
                )}
              >
                <span className={clsx(
                  "text-xs font-display font-black",
                  isSelected ? "text-white" : isTodayDay ? "text-brand-accent" : "text-brand-dark"
                )}>
                  {format(day, 'd')}
                </span>

                {dayRepairs.length > 0 && (
                  <div className="flex gap-0.5 mt-1.5">
                    {dayRepairs.slice(0, 3).map((rep, rIdx) => (
                      <span
                        key={rIdx}
                        className={clsx(
                          "w-1 h-1 rounded-full",
                          isSelected ? "bg-white/40" : getStatusColor(rep.status)
                        )}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Selected Date Agenda */}
      <div className="w-full lg:w-[350px] bg-brand-bg/30 p-8 flex flex-col">
        <div className="mb-8">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-muted mb-2">Selected Date</p>
          <h4 className="font-display text-2xl font-bold text-brand-dark">
            {format(selectedDate, 'MMMM d')}
          </h4>
          <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-1">
            {format(selectedDate, 'eeee')}
          </p>
        </div>

        <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
          {selectedDateRepairs.length > 0 ? (
            selectedDateRepairs.map((repair) => (
              <div
                key={repair.id}
                onClick={() => onViewRepair(repair)}
                className="bg-white p-5 rounded-[24px] border border-brand-border hover:shadow-premium transition-all cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest">{repair.invoiceNumber}</p>
                      <h5 className="font-display font-bold text-sm text-brand-dark leading-tight group-hover:text-brand-accent transition-colors">
                        {repair.shoeModel}
                      </h5>
                    </div>
                    <span className={clsx("w-2 h-2 rounded-full mt-1", getStatusColor(repair.status))} />
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-brand-border/40">
                    <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest truncate max-w-[120px]">
                      {repair.customerName}
                    </p>
                    <p className="text-xs font-display font-black text-brand-dark">
                      ₹{repair.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white/50 rounded-[24px] border border-brand-border border-dashed p-8 text-center">
              <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">No Deadlines</p>
            </div>
          )}
        </div>

        <div className="mt-auto pt-8">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-brand-border space-y-1">
              <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest">Month Target</p>
              <p className="text-xl font-display font-black text-brand-dark">{monthStats.total}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-brand-border space-y-1">
              <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest">Ready</p>
              <p className="text-xl font-display font-black text-brand-accent">{monthStats.completed}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
