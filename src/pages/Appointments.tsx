import { useState } from 'react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  CalendarDays,
  Plus,
  Filter,
  Search,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import clsx from 'clsx';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { Appointment } from '../types';

export default function Appointments() {
  const { appointments, updateAppointment, deleteAppointment } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const filteredAppointments = appointments
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a => 
      a.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.phone.includes(searchQuery)
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleStatusChange = (id: string, status: Appointment['status']) => {
    updateAppointment(id, { status });
    if (selectedAppointment?.id === id) {
      setSelectedAppointment(prev => prev ? { ...prev, status } : null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-6">
        <div className="space-y-1">
          <h1 className="font-serif text-4xl font-black text-brand-dark tracking-tight">Studio Schedule</h1>
          <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em]">Drop-offs & Consultations</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
            <input 
              type="text" 
              placeholder="Search appointments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-brand-border rounded-full py-2.5 pl-11 pr-4 text-xs font-bold focus:ring-brand-accent focus:border-brand-accent shadow-premium"
            />
          </div>
          <button className="bg-brand-dark text-white p-2.5 rounded-full shadow-lg hover:bg-brand-accent transition-all active:scale-95">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-brand-border shadow-premium overflow-x-auto no-scrollbar">
        {['all', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab as any)}
            className={clsx(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              filter === tab 
                ? "bg-brand-dark text-white shadow-md" 
                : "text-brand-muted hover:text-brand-dark"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List View */}
        <div className="lg:col-span-2 space-y-4">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((apt) => {
              const date = parseISO(apt.date);
              return (
                <motion.div
                  layout
                  key={apt.id}
                  onClick={() => setSelectedAppointment(apt)}
                  className={clsx(
                    "bg-white border p-5 rounded-[2rem] shadow-premium hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden",
                    selectedAppointment?.id === apt.id ? "ring-2 ring-brand-accent border-transparent" : "border-brand-border"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center justify-center w-14 h-14 bg-brand-bg rounded-2xl border border-brand-border/40 shrink-0">
                        <span className="text-[10px] font-black text-brand-muted uppercase tracking-tighter">
                          {format(date, 'MMM')}
                        </span>
                        <span className="text-xl font-serif font-black text-brand-dark">
                          {format(date, 'dd')}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-lg font-black text-brand-dark">{apt.customerName}</h3>
                          <span className={clsx(
                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                            getStatusColor(apt.status)
                          )}>
                            {apt.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-brand-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {apt.time}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-brand-border" />
                          <span className="text-brand-olive uppercase tracking-widest text-[9px]">
                            {apt.serviceType}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button className="p-2 text-brand-muted hover:text-brand-dark opacity-0 group-hover:opacity-100 transition-all">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {isToday(date) && (
                    <div className="absolute top-0 right-0 px-4 py-1 bg-brand-accent text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-bl-xl">
                      Today
                    </div>
                  )}
                </motion.div>
              );
            })
          ) : (
            <div className="bg-white/50 border border-dashed border-brand-border p-20 rounded-[3rem] text-center space-y-4">
              <CalendarDays className="w-12 h-12 text-brand-muted mx-auto opacity-20" />
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-black text-brand-dark">No appointments found</h3>
                <p className="text-xs font-bold text-brand-muted">Try adjusting your filters or search query.</p>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedAppointment ? (
              <motion.div
                key={selectedAppointment.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-brand-dark text-white rounded-[2.5rem] shadow-2xl p-8 sticky top-24 space-y-8 overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-accent/10 rounded-full blur-[60px] -mr-24 -mt-24 group-hover:bg-brand-accent/20 transition-all duration-700" />
                
                <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em]">Appointment Detail</p>
                      <h2 className="font-serif text-3xl font-black">{selectedAppointment.customerName}</h2>
                    </div>
                    <button 
                      onClick={() => setSelectedAppointment(null)}
                      className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="p-2 bg-brand-accent/20 rounded-xl">
                        <Calendar className="w-5 h-5 text-brand-accent" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Schedule</p>
                        <p className="text-sm font-bold">
                          {format(parseISO(selectedAppointment.date), 'EEEE, MMM dd')} @ {selectedAppointment.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="p-2 bg-brand-olive/20 rounded-xl">
                        <Mail className="w-5 h-5 text-brand-olive" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Contact</p>
                        <p className="text-sm font-bold truncate">{selectedAppointment.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="p-2 bg-blue-500/20 rounded-xl">
                        <Phone className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Phone</p>
                        <p className="text-sm font-bold">{selectedAppointment.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Artisan Notes</p>
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/10 min-h-[100px]">
                      <p className="text-xs text-white/70 leading-relaxed font-medium">
                        {selectedAppointment.notes || "No additional notes provided by customer."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Workflow Actions</p>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedAppointment.status === 'Pending' && (
                        <>
                          <button 
                            onClick={() => handleStatusChange(selectedAppointment.id, 'Confirmed')}
                            className="bg-emerald-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Confirm
                          </button>
                          <button 
                            onClick={() => handleStatusChange(selectedAppointment.id, 'Cancelled')}
                            className="bg-red-900/40 text-red-200 p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-red-900/60 transition-all border border-red-500/20"
                          >
                            <XCircle className="w-4 h-4" />
                            Decline
                          </button>
                        </>
                      )}
                      {selectedAppointment.status === 'Confirmed' && (
                        <button 
                          onClick={() => handleStatusChange(selectedAppointment.id, 'Completed')}
                          className="col-span-2 bg-brand-accent text-white p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Mark as Attended
                        </button>
                      )}
                      {(selectedAppointment.status === 'Completed' || selectedAppointment.status === 'Cancelled') && (
                        <button 
                          onClick={() => deleteAppointment(selectedAppointment.id)}
                          className="col-span-2 bg-white/5 text-white/60 p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-red-900/40 hover:text-red-200 transition-all"
                        >
                          Archive Record
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white border border-brand-border rounded-[2.5rem] p-12 text-center space-y-6 h-[500px] flex flex-col items-center justify-center shadow-premium">
                <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center text-brand-muted mb-4 border border-brand-border/40">
                  <AlertCircle className="w-10 h-10 opacity-30" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl font-black text-brand-dark">Selection Required</h3>
                  <p className="text-xs font-medium text-brand-muted max-w-[200px] mx-auto leading-relaxed">
                    Select an appointment from the list to view client details and manage the studio workflow.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
