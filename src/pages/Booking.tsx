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
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock3,
  CalendarCheck2,
  Loader2,
  MessageSquare
} from 'lucide-react';
import clsx from 'clsx';
import { format, addDays, startOfToday, eachDayOfInterval } from 'date-fns';

const TIME_SLOTS = [
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', 
  '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', 
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', 
  '05:00 PM', '05:30 PM'
];

const SERVICE_TYPES = [
  { id: 'Drop-off', name: 'In-Studio Drop-off', desc: 'Visit our workshop for a physical inspection and ticket creation.', icon: MapPin },
  { id: 'Consultation', name: 'Artisan Consultation', desc: '15-min deep dive with a lead cordwainer into restoration options.', icon: User },
  { id: 'Home Pickup', name: 'Concierge Pickup', desc: 'Premium white-glove collection service from your doorstep.', icon: ShieldCheck }
] as const;

export default function Booking() {
  const { addAppointment } = useAppStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    time: '11:00 AM',
    serviceType: 'Drop-off' as 'Drop-off' | 'Consultation' | 'Home Pickup',
    notes: ''
  });

  const tomorrow = addDays(startOfToday(), 1);
  const nextTwoWeeks = eachDayOfInterval({
    start: tomorrow,
    end: addDays(tomorrow, 13)
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addAppointment(formData);
      setSubmitted(true);
    } catch (err) {
      console.error("Booking failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] p-12 text-center shadow-2xl border border-brand-border space-y-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-4 border border-emerald-200">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-3">
            <h1 className="font-serif text-4xl font-black text-brand-dark tracking-tight uppercase">Booking Confirmed</h1>
            <p className="text-brand-muted font-bold uppercase tracking-[0.2em] text-[10px]">Your artisan slot is reserved</p>
          </div>
          
          <div className="bg-brand-bg rounded-3xl p-6 border border-brand-border/40 space-y-4">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-brand-muted uppercase tracking-widest">Service</span>
              <span className="text-brand-dark">{formData.serviceType}</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-brand-muted uppercase tracking-widest">Schedule</span>
              <span className="text-brand-dark">{format(new Date(formData.date), 'EEEE, MMM dd')} @ {formData.time}</span>
            </div>
          </div>

          <p className="text-sm text-brand-muted leading-relaxed font-medium">
            We've sent a confirmation email to <span className="text-brand-dark font-bold">{formData.email}</span>. Please arrive 5 minutes early for your session.
          </p>

          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-brand-dark text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-brand-olive transition-all shadow-xl active:scale-95"
          >
            Return to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-12">
      <header className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-accent/10 rounded-full border border-brand-accent/20"
        >
          <Sparkles className="w-3 h-3 text-brand-accent" />
          <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em]">Cordwainer Consultations</span>
        </motion.div>
        <h1 className="font-serif text-5xl font-black text-brand-dark tracking-tighter uppercase leading-none">Book Your Artisan Slot</h1>
        <p className="text-sm font-bold text-brand-muted max-w-lg mx-auto leading-relaxed">
          Select your preferred service and time for a premium footwear restoration experience.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Step Navigation & Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-brand-border rounded-[2.5rem] p-8 shadow-premium space-y-8">
            <div className="space-y-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-4 group">
                  <div className={clsx(
                    "w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all border",
                    step === s ? "bg-brand-dark text-white shadow-lg scale-110 border-transparent" : "bg-brand-bg text-brand-muted border-brand-border/40"
                  )}>
                    {s}
                  </div>
                  <div className="space-y-0.5">
                    <p className={clsx(
                      "text-[9px] font-black uppercase tracking-[0.2em]",
                      step === s ? "text-brand-accent" : "text-brand-muted/60"
                    )}>
                      Step 0{s}
                    </p>
                    <p className={clsx(
                      "text-xs font-black uppercase tracking-tight",
                      step === s ? "text-brand-dark" : "text-brand-muted"
                    )}>
                      {s === 1 ? 'Service Type' : s === 2 ? 'Date & Time' : 'Client Profile'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <hr className="border-brand-border/40" />

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Selected Service</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-bg rounded-xl flex items-center justify-center text-brand-olive border border-brand-border/40">
                  {SERVICE_TYPES.find(s => s.id === formData.serviceType)?.icon && 
                    <div className="w-5 h-5">
                      {/* @ts-ignore */}
                      {(() => {
                        const Icon = SERVICE_TYPES.find(s => s.id === formData.serviceType)?.icon;
                        return Icon ? <Icon className="w-full h-full" /> : null;
                      })()}
                    </div>
                  }
                </div>
                <div>
                  <p className="text-xs font-black text-brand-dark">{formData.serviceType}</p>
                  <p className="text-[10px] font-bold text-brand-muted">Premium Artisan Support</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 bg-white border border-brand-border rounded-[3rem] p-10 shadow-premium relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full blur-[80px] -mr-32 -mt-32" />
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 relative z-10"
              >
                <div className="space-y-2">
                  <h2 className="font-serif text-2xl font-black text-brand-dark uppercase tracking-tight">How should we meet?</h2>
                  <p className="text-xs font-bold text-brand-muted">Select the consultation format that suits your needs.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {SERVICE_TYPES.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, serviceType: service.id });
                        setStep(2);
                      }}
                      className={clsx(
                        "flex items-center gap-5 p-6 rounded-3xl border transition-all text-left group",
                        formData.serviceType === service.id 
                          ? "bg-brand-dark border-transparent shadow-xl scale-[1.02]" 
                          : "bg-white border-brand-border hover:border-brand-accent/40 hover:bg-brand-bg/30"
                      )}
                    >
                      <div className={clsx(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                        formData.serviceType === service.id ? "bg-white/10 text-white" : "bg-brand-bg text-brand-olive"
                      )}>
                        <service.icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={clsx(
                          "font-serif text-lg font-black",
                          formData.serviceType === service.id ? "text-white" : "text-brand-dark"
                        )}>
                          {service.name}
                        </p>
                        <p className={clsx(
                          "text-xs font-medium leading-relaxed",
                          formData.serviceType === service.id ? "text-white/60" : "text-brand-muted"
                        )}>
                          {service.desc}
                        </p>
                      </div>
                      <ChevronRight className={clsx(
                        "w-6 h-6 transition-transform group-hover:translate-x-1",
                        formData.serviceType === service.id ? "text-brand-accent" : "text-brand-border"
                      )} />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 relative z-10"
              >
                <div className="space-y-2">
                  <h2 className="font-serif text-2xl font-black text-brand-dark uppercase tracking-tight">Select a date & time</h2>
                  <p className="text-xs font-bold text-brand-muted">Consultations are typically 30 minutes in duration.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-brand-dark uppercase tracking-widest ml-1">Preferred Date</p>
                    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                      {nextTwoWeeks.map((date) => (
                        <button
                          key={date.toISOString()}
                          type="button"
                          onClick={() => setFormData({ ...formData, date: format(date, 'yyyy-MM-dd') })}
                          className={clsx(
                            "flex flex-col items-center justify-center min-w-[70px] h-24 rounded-2xl border transition-all",
                            formData.date === format(date, 'yyyy-MM-dd')
                              ? "bg-brand-dark text-white border-transparent shadow-lg scale-105"
                              : "bg-white border-brand-border hover:bg-brand-bg/50"
                          )}
                        >
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">
                            {format(date, 'EEE')}
                          </span>
                          <span className="text-xl font-serif font-black">
                            {format(date, 'dd')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-brand-dark uppercase tracking-widest ml-1">Available Slots</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setFormData({ ...formData, time: slot })}
                          className={clsx(
                            "py-3 rounded-xl text-[10px] font-black border transition-all uppercase tracking-tight",
                            formData.time === slot
                              ? "bg-brand-accent text-white border-transparent shadow-md"
                              : "bg-white border-brand-border text-brand-muted hover:border-brand-accent/40"
                          )}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-8 py-5 border border-brand-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-dark transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-1 bg-brand-dark text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl"
                    >
                      Continue to Details
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 relative z-10"
              >
                <div className="space-y-2">
                  <h2 className="font-serif text-2xl font-black text-brand-dark uppercase tracking-tight">Finalize your profile</h2>
                  <p className="text-xs font-bold text-brand-muted">Provide your contact details to receive the artisan ticket.</p>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-brand-dark uppercase tracking-widest ml-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                        <input
                          type="text"
                          required
                          value={formData.customerName}
                          onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                          className="w-full bg-brand-bg border-brand-border rounded-2xl py-4 pl-12 pr-4 text-xs font-bold focus:ring-brand-accent"
                          placeholder="John Artisan"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-brand-dark uppercase tracking-widest ml-1">Mobile Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full bg-brand-bg border-brand-border rounded-2xl py-4 pl-12 pr-4 text-xs font-bold focus:ring-brand-accent"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-dark uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-brand-bg border-brand-border rounded-2xl py-4 pl-12 pr-4 text-xs font-bold focus:ring-brand-accent"
                        placeholder="artisan@cordwainers.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-dark uppercase tracking-widest ml-1">Footwear Notes (Optional)</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-brand-muted" />
                      <textarea
                        rows={3}
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full bg-brand-bg border-brand-border rounded-2xl py-4 pl-12 pr-4 text-xs font-bold focus:ring-brand-accent no-scrollbar"
                        placeholder="Tell us about your shoes (e.g., Suede Loafers, Sole separation...)"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-8 py-5 border border-brand-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-dark transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-brand-accent text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-brand-accent/20 disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CalendarCheck2 className="w-4 h-4" />
                          Confirm Appointment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
      
      <footer className="text-center py-8">
        <p className="text-[9px] font-bold text-brand-muted uppercase tracking-[0.3em]">
          Cordwainers Studio &copy; {new Date().getFullYear()} &bull; Artisanal Excellence
        </p>
      </footer>
    </div>
  );
}
