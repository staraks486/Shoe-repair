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
    <div className="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[460px]">
      
      {/* LEFT: Calendar Interface */}
      <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-brand-border flex flex-col justify-between">
        <div>
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center text-brand-dark">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-brand-dark">Repair Deadlines Calendar</h3>
                <p className="text-[10px] text-brand-muted uppercase tracking-wider font-semibold">Track & organize shoe pick-up targets</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-brand-border hover:bg-brand-bg rounded transition-colors text-brand-dark"
              >
                Today
              </button>
              <div className="flex items-center bg-brand-bg border border-brand-border rounded">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-brand-border/40 text-brand-dark transition-colors rounded-l"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-brand-dark px-3 min-w-[110px] text-center uppercase tracking-wide">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-brand-border/40 text-brand-dark transition-colors rounded-r"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span key={d} className="text-[10px] font-bold uppercase tracking-wider text-brand-muted py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const isCurrentMonthDay = day.getMonth() === currentMonth.getMonth();
              const dayRepairs = getRepairsForDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDay = isToday(day);
              const hasHighPriority = dayRepairs.some(r => r.priority === 'High');

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={clsx(
                    "aspect-square rounded-lg p-1.5 relative flex flex-col justify-between text-left transition-all group focus:outline-none focus:ring-1 focus:ring-brand-dark",
                    isCurrentMonthDay ? "bg-white hover:bg-brand-bg" : "bg-gray-50/50 text-gray-300",
                    isSelected ? "ring-2 ring-brand-dark bg-brand-bg/60 font-bold" : "border border-transparent",
                    isTodayDay ? "border-emerald-500 bg-emerald-50/20" : ""
                  )}
                >
                  {/* Day Number */}
                  <span className={clsx(
                    "text-xs font-mono font-bold leading-none",
                    isTodayDay ? "text-emerald-700 bg-emerald-100/80 px-1 rounded" : "text-brand-dark",
                    !isCurrentMonthDay && "opacity-40"
                  )}>
                    {format(day, 'd')}
                  </span>

                  {/* Day Status Indicators / Dots */}
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {dayRepairs.slice(0, 4).map((rep, rIdx) => (
                      <span
                        key={rIdx}
                        className={clsx(
                          "w-1.5 h-1.5 rounded-full",
                          getStatusColor(rep.status),
                          rep.priority === 'High' && "animate-pulse ring-1 ring-red-500 ring-offset-0.5"
                        )}
                        title={`${rep.customerName} - ${rep.shoeModel}`}
                      />
                    ))}
                    {dayRepairs.length > 4 && (
                      <span className="text-[7px] font-mono font-bold text-brand-muted leading-none">
                        +{dayRepairs.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Red outer glow badge for High priority items */}
                  {hasHighPriority && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Month Metrics Bar */}
        <div className="mt-6 pt-4 border-t border-brand-border grid grid-cols-4 gap-2 text-center bg-brand-bg/40 p-2.5 rounded-lg">
          <div>
            <div className="text-xs font-mono font-bold text-brand-dark">{monthStats.total}</div>
            <div className="text-[8px] uppercase font-bold tracking-wider text-brand-muted">Total Due</div>
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-red-600">{monthStats.highPriority}</div>
            <div className="text-[8px] uppercase font-bold tracking-wider text-red-500">Urgent</div>
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-amber-600">{monthStats.pending}</div>
            <div className="text-[8px] uppercase font-bold tracking-wider text-amber-600">Active</div>
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-emerald-600">{monthStats.completed}</div>
            <div className="text-[8px] uppercase font-bold tracking-wider text-emerald-500">Ready</div>
          </div>
        </div>

      </div>

      {/* RIGHT: Selected Date Agenda / Deadlines details */}
      <div className="w-full lg:w-[320px] bg-brand-bg/25 p-6 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="mb-4">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand-muted block mb-1">
              Selected Agenda
            </span>
            <h4 className="font-serif text-base font-bold text-brand-dark">
              {format(selectedDate, 'eeee, MMMM d')}
            </h4>
            {isToday(selectedDate) && (
              <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                ● TODAY'S TARGETS
              </span>
            )}
          </div>

          {/* Agenda Filters */}
          <div className="flex gap-1 mb-4 bg-white p-1 rounded-md border border-brand-border">
            {['All', 'Pending/In Progress', 'Completed'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterStatus(tab)}
                className={clsx(
                  "flex-1 text-[8px] font-bold uppercase tracking-wider py-1 rounded transition-all",
                  filterStatus === tab 
                    ? "bg-brand-dark text-white shadow-sm" 
                    : "text-brand-muted hover:text-brand-dark hover:bg-brand-bg"
                )}
              >
                {tab === 'Pending/In Progress' ? 'Active' : tab === 'Completed' ? 'Ready' : 'All'}
              </button>
            ))}
          </div>

          {/* Repairs List */}
          <div className="space-y-3 pr-1">
            {selectedDateRepairs.length > 0 ? (
              selectedDateRepairs.map((repair) => {
                const isCompleted = repair.status === 'Completed' || repair.status === 'Delivered';
                return (
                  <div
                    key={repair.id}
                    className={clsx(
                      "bg-white p-3.5 rounded-lg border border-brand-border shadow-sm hover:shadow transition-all space-y-2 relative overflow-hidden group",
                      repair.priority === 'High' && "border-l-4 border-l-red-500"
                    )}
                  >
                    {/* Tiny visual ribbon for top priority */}
                    {repair.priority === 'High' && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white font-mono font-bold text-[8px] px-1.5 rounded-bl uppercase">
                        Urgent
                      </span>
                    )}

                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5 max-w-[80%]">
                        <span className="text-[9px] font-mono font-bold text-brand-muted block uppercase">
                          {repair.invoiceNumber}
                        </span>
                        <h5 className="font-serif font-bold text-xs text-brand-dark line-clamp-1">
                          {repair.shoeModel}
                        </h5>
                      </div>
                      <span className={clsx(
                        "w-2 h-2 rounded-full shrink-0 mt-1",
                        getStatusColor(repair.status)
                      )} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-brand-muted">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-medium text-brand-dark truncate">{repair.customerName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-brand-muted">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Status: <strong className="text-brand-dark font-semibold">{repair.status}</strong></span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between">
                      <span className="text-xs font-serif font-bold text-brand-dark">
                        ₹{repair.price.toFixed(0)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onViewRepair(repair)}
                        className="inline-flex items-center gap-1 text-[8px] font-bold text-brand-olive hover:text-brand-dark uppercase tracking-widest bg-brand-bg px-2 py-1 rounded border border-brand-border/40 transition-colors"
                      >
                        <Eye className="w-2.5 h-2.5" /> Detail View
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Empty state */
              <div className="bg-white rounded-lg border border-brand-border p-6 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center mx-auto text-brand-muted">
                  <CheckCircle className="w-5 h-5 text-gray-300" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-brand-dark">Clear Schedule</h5>
                  <p className="text-[10px] text-brand-muted mt-0.5">No shoe repairs or customer collections targeted for this day.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Legend */}
        <div className="bg-white border border-brand-border rounded-lg p-3 text-[10px] space-y-2.5 mt-4">
          <div className="flex items-center gap-1.5 font-bold uppercase text-brand-dark tracking-wider text-[8px]">
            <Info className="w-3.5 h-3.5 text-brand-olive" />
            <span>Cobbler Legend</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-brand-muted font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>Received</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
              <span>Polishing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
              <span>Delivered</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
