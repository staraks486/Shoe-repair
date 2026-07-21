import { useAppStore } from '../store';
import { format, isToday, parseISO } from 'date-fns';
import { Clock, User, ArrowRight, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Appointment } from '../types';

interface AppointmentSummaryProps {
  onViewAppointment?: (apt: Appointment) => void;
}

export default function AppointmentSummary({ onViewAppointment }: AppointmentSummaryProps) {
  const { appointments } = useAppStore();
  const navigate = useNavigate();

  const todayAppointments = appointments.filter(a => isToday(parseISO(a.date)) && a.status !== 'Cancelled');

  return (
    <div className="bg-white border border-brand-border rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-premium space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-accent/10 rounded-xl sm:rounded-2xl sm:p-2.5">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-brand-accent" />
          </div>
          <div>
            <h3 className="font-display text-lg sm:text-xl font-black text-brand-dark uppercase tracking-tight">Today's Schedule</h3>
            <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">{todayAppointments.length} Bookings for today</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/appointments')}
          className="p-2 rounded-full hover:bg-brand-bg transition-all group"
        >
          <ArrowRight className="w-5 h-5 text-brand-muted group-hover:text-brand-dark group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      <div className="space-y-3">
        {todayAppointments.length > 0 ? (
          todayAppointments.slice(0, 3).map((apt) => (
            <motion.div 
              key={apt.id}
              whileHover={{ x: 4 }}
              className="flex items-center justify-between p-4 bg-brand-bg rounded-2xl border border-brand-border/40 hover:border-brand-accent/20 transition-all cursor-pointer"
              onClick={() => onViewAppointment ? onViewAppointment(apt) : navigate('/appointments')}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-dark font-black shadow-sm border border-brand-border/40">
                  <Clock className="w-4 h-4 text-brand-olive" />
                </div>
                <div>
                  <p className="text-xs font-black text-brand-dark">{apt.customerName}</p>
                  <p className="text-[10px] font-bold text-brand-muted">{apt.time} &bull; {apt.serviceType}</p>
                </div>
              </div>
              <div className="px-2 py-1 bg-amber-100 text-amber-700 text-[8px] font-black rounded-full uppercase tracking-widest border border-amber-200">
                {apt.status}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-6 text-center">
            <p className="text-xs font-bold text-brand-muted uppercase tracking-widest italic opacity-60">No consultations booked for today</p>
          </div>
        )}
      </div>

      {todayAppointments.length > 3 && (
        <button 
          onClick={() => navigate('/appointments')}
          className="w-full py-3 text-[9px] font-black text-brand-muted uppercase tracking-[0.3em] hover:text-brand-dark transition-all border-t border-brand-border/40 pt-6"
        >
          View all {todayAppointments.length} bookings
        </button>
      )}
    </div>
  );
}
