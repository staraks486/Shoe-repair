import React, { useState, useEffect, useRef } from 'react';
import { 
  Hammer, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Camera, 
  IndianRupee, 
  Calendar,
  MessageSquare,
  History,
  User,
  ArrowRight,
  MoreVertical,
  Download,
  Image as ImageIcon,
  Volume2,
  Trash2 as TrashIcon,
  Play,
  Pause,
  Plus,
  Briefcase,
  TrendingUp,
  CreditCard,
  Check,
  UserPlus,
  Coins,
  Ruler
} from 'lucide-react';
import ShoeSizeChartModal from '../components/ShoeSizeChartModal';
import { useAppStore } from '../store';
import { ShoeRepairRequest, RepairStatus, VoiceNote } from '../types';
import clsx from 'clsx';
import { format } from 'date-fns';
import VoiceNoteRecorder from '../components/VoiceNoteRecorder';
import { motion } from 'motion/react';
import { sendPushNotification } from '../lib/notifications';

import PhotoManager from '../components/PhotoManager';
import RepairStepperTimeline from '../components/RepairStepperTimeline';

export default function CobblerDesk() {
  const { repairs, updateRepairStatus, updateRepair, addVoiceNote, deleteVoiceNote, settings, updateSettings, user, userProfile, isPrivacyMasked } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<RepairStatus | 'All'>('All');
  const [selectedRepair, setSelectedRepair] = useState<ShoeRepairRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'assigned' | 'in-progress' | 'completed'>('assigned');
  const [currentView, setCurrentView] = useState<'repairs' | 'cobblers' | 'payments'>('repairs');
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  // Privacy Masking helpers
  const maskPhone = (phone: string) => {
    if (!isPrivacyMasked) return phone;
    const cleaned = (phone || '').replace(/\s+/g, '');
    if (cleaned.length < 5) return '••••••';
    return cleaned.slice(0, 4) + ' •••• ••' + cleaned.slice(-3);
  };

  const maskName = (name: string) => {
    if (!isPrivacyMasked) return name;
    const parts = (name || '').split(' ');
    return parts.map((p, i) => i === 0 ? p : p[0] + '•••').join(' ');
  };

  function MaskedText({ text, maskFn }: { text: string; maskFn: (t: string) => string }) {
    const [revealed, setRevealed] = useState(false);
    return (
      <span 
        onMouseEnter={() => setRevealed(true)}
        onMouseLeave={() => setRevealed(false)}
        onClick={() => setRevealed(!revealed)}
        className="cursor-help select-none border-b border-dotted border-brand-border/40 hover:border-brand-olive transition-colors"
        title="Hover/click to reveal safely"
      >
        {revealed ? text : maskFn(text)}
      </span>
    );
  }

  // Stopwatch states
  const [stopwatchRepairId, setStopwatchRepairId] = useState<string | null>(null);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const stopwatchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync stopwatch on active repair change
  useEffect(() => {
    if (selectedRepair) {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
      setIsStopwatchRunning(false);
      setStopwatchSeconds(0);
      setStopwatchRepairId(selectedRepair.id);
    } else {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
      setIsStopwatchRunning(false);
    }
    return () => {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
    };
  }, [selectedRepair]);

  // Stopwatch ticking effect
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
    }
    return () => {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
    };
  }, [isStopwatchRunning]);

  const formatStopwatchTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSaveLaborTime = () => {
    if (!selectedRepair) return;
    const currentLabor = selectedRepair.laborSeconds || 0;
    const newLabor = currentLabor + stopwatchSeconds;
    
    updateRepair(selectedRepair.id, { laborSeconds: newLabor });
    setSelectedRepair(prev => prev ? { ...prev, laborSeconds: newLabor } : null);
    
    setStopwatchSeconds(0);
    setIsStopwatchRunning(false);
  };

  // Artisan Text Comments states
  const [newCommentText, setNewCommentText] = useState('');
  const [selectedCommentAuthor, setSelectedCommentAuthor] = useState('');

  // Sync default author
  useEffect(() => {
    if (userProfile?.displayName) {
      setSelectedCommentAuthor(userProfile.displayName);
    } else if (settings?.employees && settings.employees.length > 0) {
      setSelectedCommentAuthor(settings.employees[0].name);
    } else if (settings?.cobblers && settings.cobblers.length > 0) {
      setSelectedCommentAuthor(settings.cobblers[0].name);
    } else {
      setSelectedCommentAuthor('Artisan Staff');
    }
  }, [userProfile, settings]);

  const handleAddComment = () => {
    if (!newCommentText.trim() || !selectedRepair) return;
    
    const newComment = {
      id: 'cmt-' + Math.floor(Math.random() * 1000000),
      author: selectedCommentAuthor || 'Workshop',
      text: newCommentText.trim(),
      timestamp: new Date().toISOString()
    };
    
    const existingComments = selectedRepair.comments || [];
    const updatedComments = [...existingComments, newComment];
    
    updateRepair(selectedRepair.id, { comments: updatedComments });
    
    // Update local state for details view
    setSelectedRepair(prev => prev ? { ...prev, comments: updatedComments } : null);
    
    setNewCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    if (!selectedRepair) return;
    
    const existingComments = selectedRepair.comments || [];
    const updatedComments = existingComments.filter(c => c.id !== commentId);
    
    updateRepair(selectedRepair.id, { comments: updatedComments });
    
    // Update local state for details view
    setSelectedRepair(prev => prev ? { ...prev, comments: updatedComments } : null);
  };

  // Cobbler management states
  const [isAddCobblerModalOpen, setIsAddCobblerModalOpen] = useState(false);
  const [newCobblerName, setNewCobblerName] = useState('');
  const [newCobblerSpecialty, setNewCobblerSpecialty] = useState('Goodyear-Welt');
  const [newCobblerMobile, setNewCobblerMobile] = useState('');
  const [newCobblerEmail, setNewCobblerEmail] = useState('');
  const [cobblerToDelete, setCobblerToDelete] = useState<string | null>(null);

  // Payment record states
  const [paymentRepairId, setPaymentRepairId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Net Banking'>('UPI');
  const [paymentDate, setPaymentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  });
  const [paymentTransactionId, setPaymentTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentFilterStatus, setPaymentFilterStatus] = useState<'All' | 'Fully Paid' | 'Partially Paid' | 'Unpaid'>('All');

  // Sync payment amounts on selection
  useEffect(() => {
    if (paymentRepairId) {
      const repair = repairs.find(r => r.id === paymentRepairId);
      if (repair) {
        const balance = repair.price - (repair.advance || 0);
        setPaymentAmount(balance);
        setPaymentTransactionId('');
        setPaymentNotes('');
        setPaymentMethod('UPI');
      }
    }
  }, [paymentRepairId, repairs]);

  const handleAddCobbler = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCobblerName.trim()) return;

    const newCobbler = {
      id: 'C-' + Math.floor(100 + Math.random() * 900),
      name: newCobblerName,
      specialty: newCobblerSpecialty,
      mobile: newCobblerMobile || '',
      email: newCobblerEmail || ''
    };

    updateSettings({
      cobblers: [...(settings.cobblers || []), newCobbler]
    });

    // Reset fields
    setNewCobblerName('');
    setNewCobblerSpecialty('Goodyear-Welt');
    setNewCobblerMobile('');
    setNewCobblerEmail('');
    setIsAddCobblerModalOpen(false);
  };

  const handleDeleteCobbler = (cobblerId: string) => {
    // Unassign repairs assigned to this cobbler
    repairs.forEach(r => {
      if (r.assignedCobblerId === cobblerId) {
        updateRepair(r.id, { assignedCobblerId: undefined, assignedCobblerName: undefined });
      }
    });
    
    updateSettings({
      cobblers: (settings.cobblers || []).filter(c => c.id !== cobblerId)
    });
    setCobblerToDelete(null);
  };

  const handleAddPayment = (repairId: string, amount: number, method: string, dateStr: string, transactionId: string, notes?: string) => {
    const repair = repairs.find(r => r.id === repairId);
    if (!repair) return;

    const newPayment = {
      id: Math.random().toString(36).substring(2, 9),
      amount,
      method: method as any,
      date: new Date(dateStr).toISOString(),
      transactionId,
      notes
    };

    const newAdvance = (repair.advance || 0) + amount;
    const newBalance = Math.max(0, repair.price - newAdvance);
    const newPayments = [...(repair.payments || []), newPayment];
    const newPaymentStatus = newBalance === 0 ? 'Fully Paid' : 'Partially Paid';

    updateRepair(repairId, {
      advance: newAdvance,
      balance: newBalance,
      payments: newPayments,
      paymentStatus: newPaymentStatus,
      paymentMethod: method as any,
      transactionId: transactionId || undefined
    });

    // Update locally if selected
    if (selectedRepair?.id === repairId) {
      setSelectedRepair(prev => prev ? {
        ...prev,
        advance: newAdvance,
        balance: newBalance,
        payments: newPayments,
        paymentStatus: newPaymentStatus,
        paymentMethod: method as any,
        transactionId: transactionId || undefined
      } : null);
    }
  };

  const filteredRepairs = repairs.filter(repair => {
    const matchesSearch = 
      repair.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.shoeModel.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || repair.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const assignedRepairs = filteredRepairs.filter(r => r.status === 'Received');
  const inProgressRepairs = filteredRepairs.filter(r => r.status === 'In Progress' || r.status === 'Polishing');
  const completedRepairs = filteredRepairs.filter(r => r.status === 'Completed' || r.status === 'Delivered');

  const getStatusColor = (status: RepairStatus) => {
    switch (status) {
      case 'Received': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'In Progress': return 'bg-[#F4EBE1] text-[#8C6239] border-[#E3D3C1]';
      case 'Polishing': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Delivered': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: RepairStatus) => {
    updateRepairStatus(id, newStatus);
    const repair = repairs.find(r => r.id === id);
    
    if (selectedRepair?.id === id) {
      setSelectedRepair(prev => prev ? { ...prev, status: newStatus } : null);
    }

    // Trigger Push Notification for status update
    if (repair) {
      const title = `Repair Update: ${repair.shoeModel}`;
      const body = `Your repair status is now: ${newStatus === 'Completed' ? 'Ready for Pickup' : newStatus}`;
      
      await sendPushNotification({
        title,
        body,
        email: repair.email,
        url: '/history' // Direct to repair history or status page
      });
    }
  };

  const triggerWhatsApp = (repair: ShoeRepairRequest) => {
    let template = '';
    const status = repair.status;
    
    if (status === 'Received') {
      template = settings.whatsappIntakeTemplate || 'Hello {customerName}, your shoe repair ({repairType}) has been received successfully. Ticket: {invoiceNumber}';
    } else if (status === 'Completed') {
      template = settings.whatsappReadyTemplate || 'Great news {customerName}! Your {shoeModel} is ready for pickup. Balance due: ₹{balance}. Ticket: {invoiceNumber}';
    } else {
      template = 'Hello {customerName}, your repair status ({repairType}) is now: {status}. Ticket: {invoiceNumber}';
    }

    const message = template
      .replace(/{customerName}/g, repair.customerName)
      .replace(/{repairType}/g, Array.isArray(repair.repairType) ? repair.repairType.join(', ') : repair.repairType)
      .replace(/{status}/g, status === 'Completed' ? 'Ready for Pickup' : status)
      .replace(/{invoiceNumber}/g, repair.invoiceNumber)
      .replace(/{shoeModel}/g, repair.shoeModel)
      .replace(/{price}/g, repair.price.toString())
      .replace(/{balance}/g, (repair.price - (repair.advance || 0)).toString());

    const url = `https://wa.me/${repair.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-300">
      {/* HEADER: Standardized Artisan style */}
      <header className="flex flex-col items-center justify-center text-center gap-6">
        <div className="space-y-1 flex flex-col items-center justify-center text-center">
          <h1 className="font-display text-4xl font-black text-brand-dark tracking-tight flex items-center justify-center gap-3 text-center">
            <Hammer className="w-8 h-8 text-brand-olive" />
            Cobbler Desk
          </h1>
          <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] mt-3 text-center">Workshop Management & Artisan Workflow</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-lg">
          <div className="relative group w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-olive transition-colors" />
            <input
              type="text"
              placeholder="Search by Invoice, Customer or Shoe..."
              className="w-full bg-white border border-brand-border rounded-full py-4 pl-12 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-brand-olive/20 focus:border-brand-olive transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsSizeChartOpen(true)}
            className="px-4 py-3.5 rounded-full bg-brand-dark text-white border border-brand-accent/30 hover:bg-brand-olive transition-all flex items-center gap-2 text-xs font-bold shrink-0 shadow-sm"
            title="Open Made in India Shoe Size & Material Chart"
          >
            <Ruler className="w-4 h-4 text-brand-accent" />
            <span className="hidden md:inline">Size Chart</span>
          </button>
          <div className="w-12 h-12 rounded-full bg-brand-olive/10 border border-brand-olive/20 flex items-center justify-center shadow-sm shrink-0">
            <User className="w-6 h-6 text-brand-olive" />
          </div>
        </div>
      </header>

      {/* Shoe Size Chart Modal */}
      <ShoeSizeChartModal
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
      />

      {/* Primary Root Views Switcher */}
      <div className="flex bg-white/60 backdrop-blur-md p-1 rounded-2xl border border-brand-border/85 shadow-sm max-w-lg mx-auto mb-6">
        <button
          onClick={() => setCurrentView('repairs')}
          className={clsx(
            'flex-1 py-3 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2',
            currentView === 'repairs' ? 'bg-brand-dark text-white shadow-md' : 'text-brand-muted hover:text-brand-dark'
          )}
        >
          <Hammer className="w-3.5 h-3.5" />
          Workshop Desk
        </button>
        <button
          onClick={() => setCurrentView('cobblers')}
          className={clsx(
            'flex-1 py-3 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2',
            currentView === 'cobblers' ? 'bg-brand-dark text-white shadow-md' : 'text-brand-muted hover:text-brand-dark'
          )}
        >
          <User className="w-3.5 h-3.5" />
          Artisans Registry
        </button>
        <button
          onClick={() => setCurrentView('payments')}
          className={clsx(
            'flex-1 py-3 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2',
            currentView === 'payments' ? 'bg-brand-dark text-white shadow-md' : 'text-brand-muted hover:text-brand-dark'
          )}
        >
          <IndianRupee className="w-3.5 h-3.5" />
          Payments Ledger
        </button>
      </div>

      {currentView === 'repairs' && (
        <>
          {/* Tabs */}
          <div className="flex bg-white p-1 rounded-full border border-brand-border shadow-premium overflow-x-auto scrollbar-hide max-w-full">
            <button
              onClick={() => setActiveTab('assigned')}
              className={clsx(
                'flex-1 min-w-[140px] py-3 text-[10px] font-black uppercase tracking-widest rounded-full transition-all whitespace-nowrap',
                activeTab === 'assigned' ? 'bg-brand-dark text-white shadow-lg' : 'text-brand-muted hover:text-brand-dark'
              )}
            >
              Assigned ({assignedRepairs.length})
            </button>
            <button
              onClick={() => setActiveTab('in-progress')}
              className={clsx(
                'flex-1 min-w-[140px] py-3 text-[10px] font-black uppercase tracking-widest rounded-full transition-all whitespace-nowrap',
                activeTab === 'in-progress' ? 'bg-brand-dark text-white shadow-lg' : 'text-brand-muted hover:text-brand-dark'
              )}
            >
              Progress ({inProgressRepairs.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={clsx(
                'flex-1 min-w-[140px] py-3 text-[10px] font-black uppercase tracking-widest rounded-full transition-all whitespace-nowrap',
                activeTab === 'completed' ? 'bg-brand-dark text-white shadow-lg' : 'text-brand-muted hover:text-brand-dark'
              )}
            >
              Ready ({completedRepairs.length})
            </button>
          </div>

          {/* Main Content Area */}
          <main className="space-y-8 pb-24">
            {activeTab === 'assigned' && (
              <RepairList 
                repairs={assignedRepairs} 
                onSelect={setSelectedRepair} 
                getStatusColor={getStatusColor}
              />
            )}
            {activeTab === 'in-progress' && (
              <RepairList 
                repairs={inProgressRepairs} 
                onSelect={setSelectedRepair} 
                getStatusColor={getStatusColor}
              />
            )}
            {activeTab === 'completed' && (
              <RepairList 
                repairs={completedRepairs} 
                onSelect={setSelectedRepair} 
                getStatusColor={getStatusColor}
              />
            )}

            {filteredRepairs.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-brand-border/40">
                <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-border/20">
                  <Search className="w-8 h-8 text-brand-muted" />
                </div>
                <p className="font-display text-lg font-bold text-brand-dark">No repairs found</p>
                <p className="text-sm text-brand-muted mt-1">Try adjusting your filters or search term</p>
              </div>
            )}
          </main>
        </>
      )}

      {currentView === 'cobblers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-brand-light/30 p-4 rounded-2xl border border-brand-border/40">
            <div>
              <h3 className="font-display text-lg font-bold text-brand-dark">Active Artisan Directory</h3>
              <p className="text-xs text-brand-muted">Manage the master cobblers, specialty parameters, and track active assignments.</p>
            </div>
            <button
              onClick={() => setIsAddCobblerModalOpen(true)}
              className="bg-brand-dark text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-brand-accent transition-all active:scale-95 shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              Add Artisan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(settings.cobblers || []).map((cobbler) => {
              const cobblerRepairs = repairs.filter(r => r.assignedCobblerId === cobbler.id);
              const activeJobs = cobblerRepairs.filter(r => r.status !== 'Completed' && r.status !== 'Delivered');

              return (
                <div key={cobbler.id} className="bg-white p-5 rounded-3xl border border-brand-border/60 hover:shadow-premium transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-display text-lg font-black text-brand-dark leading-tight">{cobbler.name}</h4>
                        <span className="inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-brand-olive/10 text-brand-olive border border-brand-olive/20 mt-1">
                          {cobbler.specialty}
                        </span>
                      </div>
                      
                      {/* Safe inline delete confirm box to avoid iframe browser alert blockages */}
                      {cobblerToDelete === cobbler.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCobblerToDelete(null)}
                            className="bg-slate-100 text-slate-700 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded"
                          >
                            No
                          </button>
                          <button
                            onClick={() => handleDeleteCobbler(cobbler.id)}
                            className="bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-sm"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCobblerToDelete(cobbler.id)}
                          className="p-1.5 hover:bg-red-50 text-brand-muted hover:text-red-500 rounded-lg transition-colors"
                          title="Remove Artisan"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-brand-muted font-medium">
                      {cobbler.mobile && <p>📱 {cobbler.mobile}</p>}
                      {cobbler.email && <p>✉️ {cobbler.email}</p>}
                    </div>

                    <div className="pt-2 border-t border-brand-border/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-brand-olive" />
                          Assigned Work ({activeJobs.length} Active)
                        </span>
                      </div>

                      {activeJobs.length > 0 ? (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                          {activeJobs.map((job) => (
                            <button
                              key={job.id}
                              onClick={() => setSelectedRepair(job)}
                              className="w-full text-left bg-brand-light/30 p-2 rounded-xl border border-brand-border/30 hover:bg-brand-light transition-colors flex items-center justify-between text-xs font-bold text-brand-dark"
                            >
                              <div className="truncate pr-2">
                                <p className="truncate leading-none mb-1.5">{job.shoeModel}</p>
                                <div className="flex items-center gap-1 text-[9px] text-brand-muted font-bold uppercase tracking-wider leading-none">
                                  <span className="font-mono">{job.invoiceNumber}</span>
                                  <span>•</span>
                                  <span>Due: {format(new Date(job.dueDate), 'dd MMM')}</span>
                                </div>
                              </div>
                              <span className={clsx(
                                "px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider shrink-0",
                                getStatusColor(job.status)
                              )}>
                                {job.status}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-brand-muted font-bold tracking-wider italic py-3 text-center border border-dashed border-brand-border rounded-xl">
                          No active jobs assigned
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-brand-muted font-bold tracking-wider pt-2 flex justify-between items-center text-right">
                    <span>ID: {cobbler.id}</span>
                    <span className="text-emerald-600 font-mono">Completed Jobs: {cobblerRepairs.length - activeJobs.length}</span>
                  </div>
                </div>
              );
            })}

            {(!settings.cobblers || settings.cobblers.length === 0) && (
              <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-brand-border">
                <User className="w-10 h-10 text-brand-muted mx-auto mb-2 opacity-40" />
                <p className="font-display text-sm font-bold text-brand-dark">No cobblers registered</p>
                <p className="text-xs text-brand-muted mt-1">Add details above to initialize the artisan registry.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {currentView === 'payments' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-brand-border/60 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Collected (Advance)</p>
                <p className="font-display text-2xl font-black text-brand-dark">
                  ₹{repairs.reduce((sum, r) => sum + (r.advance || 0), 0)}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-brand-border/60 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Outstanding Balance</p>
                <p className="font-display text-2xl font-black text-red-600">
                  ₹{repairs.reduce((sum, r) => sum + (r.price - (r.advance || 0)), 0)}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-brand-border/60 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-olive/10 flex items-center justify-center text-brand-olive">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Projected Revenue</p>
                <p className="font-display text-2xl font-black text-brand-dark">
                  ₹{repairs.reduce((sum, r) => sum + (r.price || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-brand-border/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-brand-border flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="font-display text-lg font-bold text-brand-dark flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-olive" />
                Payment Ledger
              </h3>
              
              <div className="flex bg-brand-light p-1 rounded-xl border border-brand-border/40 text-[10px] font-black uppercase tracking-wider">
                {(['All', 'Fully Paid', 'Partially Paid', 'Unpaid'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setPaymentFilterStatus(opt)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg transition-all",
                      paymentFilterStatus === opt ? "bg-white text-brand-dark shadow-xs" : "text-brand-muted hover:text-brand-dark"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-brand-border/40 overflow-x-auto">
              {repairs
                .filter(r => {
                  const balance = r.price - (r.advance || 0);
                  const status = balance === 0 ? 'Fully Paid' : r.advance > 0 ? 'Partially Paid' : 'Unpaid';
                  return paymentFilterStatus === 'All' || status === paymentFilterStatus;
                })
                .map((r) => {
                  const balance = r.price - (r.advance || 0);
                  const status = balance === 0 ? 'Fully Paid' : r.advance > 0 ? 'Partially Paid' : 'Unpaid';

                  return (
                    <div key={r.id} className="p-4 hover:bg-brand-light/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-light border border-brand-border/50 flex items-center justify-center text-brand-muted shrink-0">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-brand-muted font-mono">{r.invoiceNumber}</span>
                            <span className="text-[10px] font-medium text-brand-muted">
                              {format(new Date(r.createdAt), 'dd MMM yyyy')}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-brand-dark">{r.customerName}</h4>
                          <p className="text-xs text-brand-muted">{r.shoeModel}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 justify-between md:justify-end">
                        <div className="grid grid-cols-3 gap-4 text-right text-xs">
                          <div>
                            <p className="text-[9px] text-brand-muted font-bold uppercase">Total</p>
                            <p className="font-bold text-brand-dark">₹{r.price}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-brand-muted font-bold uppercase">Paid</p>
                            <p className="font-bold text-emerald-600">₹{r.advance || 0}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-brand-muted font-bold uppercase">Due</p>
                            <p className="font-bold text-red-600">₹{balance}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border",
                            status === 'Fully Paid' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                            status === 'Partially Paid' ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-red-100 text-red-700 border-red-200"
                          )}>
                            {status}
                          </span>

                          {balance > 0 ? (
                            <button
                              onClick={() => setPaymentRepairId(r.id)}
                              className="bg-brand-dark text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-brand-accent transition-all flex items-center gap-1 shadow-sm active:scale-95"
                            >
                              <Plus className="w-3 h-3" />
                              Pay
                            </button>
                          ) : (
                            <div className="p-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600" title="Settled">
                              <Check className="w-4.5 h-4.5" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {repairs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm font-bold text-brand-muted">No records registered in database</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Detail Panel */}
      {selectedRepair && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-4 border-b border-brand-border flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedRepair(null)}
                  className="p-2 hover:bg-brand-light rounded-lg transition-colors"
                >
                  <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
                <button 
                  onClick={() => triggerWhatsApp(selectedRepair)}
                  className="p-2 text-brand-olive hover:bg-brand-olive/10 rounded-lg transition-colors"
                  title="Send WhatsApp Status Update"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
              <span className="font-display text-lg font-bold text-brand-dark">Repair Details</span>
              <button className="p-2 hover:bg-brand-light rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Interactive Stepper Timeline */}
              <RepairStepperTimeline 
                repair={selectedRepair} 
                onStatusChange={handleStatusUpdate} 
                showDetails={true} 
              />

              {/* Photos Section */}
              <section className="space-y-12">
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-brand-muted uppercase tracking-widest border-b border-brand-border pb-2">Condition Documentation</h3>
                  
                  <div className="space-y-8">
                    <PhotoManager 
                      label="BEFORE PHOTOS"
                      photos={selectedRepair.beforePhotos || []}
                      onAdd={(photo) => {
                        const newPhotos = [...(selectedRepair.beforePhotos || []), photo];
                        updateRepair(selectedRepair.id, { beforePhotos: newPhotos });
                        setSelectedRepair(prev => prev ? { ...prev, beforePhotos: newPhotos } : null);
                      }}
                      onRemove={(photoId) => {
                        const newPhotos = (selectedRepair.beforePhotos || []).filter(p => p.id !== photoId);
                        updateRepair(selectedRepair.id, { beforePhotos: newPhotos });
                        setSelectedRepair(prev => prev ? { ...prev, beforePhotos: newPhotos } : null);
                      }}
                    />

                    <div className="h-px bg-brand-border" />

                    <PhotoManager 
                      label="AFTER PHOTOS"
                      photos={selectedRepair.afterPhotos || []}
                      onAdd={(photo) => {
                        const newPhotos = [...(selectedRepair.afterPhotos || []), photo];
                        updateRepair(selectedRepair.id, { afterPhotos: newPhotos });
                        setSelectedRepair(prev => prev ? { ...prev, afterPhotos: newPhotos } : null);
                      }}
                      onRemove={(photoId) => {
                        const newPhotos = (selectedRepair.afterPhotos || []).filter(p => p.id !== photoId);
                        updateRepair(selectedRepair.id, { afterPhotos: newPhotos });
                        setSelectedRepair(prev => prev ? { ...prev, afterPhotos: newPhotos } : null);
                      }}
                    />
                  </div>
                </div>
              </section>

              {/* Order Info */}
              <section className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-display text-2xl font-black text-brand-dark leading-tight">
                      {selectedRepair.shoeModel}
                    </h2>
                    <p className="text-sm font-bold text-brand-olive mt-1">Invoice: {selectedRepair.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 font-display text-xl font-black text-brand-dark">
                      <IndianRupee className="w-4 h-4" />
                      {selectedRepair.price}
                    </div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Paid: ₹{selectedRepair.advance}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-brand-light/50 p-4 rounded-2xl border border-brand-border/40">
                    <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1">Customer</p>
                    <p className="text-sm font-bold text-brand-dark">
                      <MaskedText text={selectedRepair.customerName} maskFn={maskName} />
                    </p>
                    <p className="text-xs text-brand-muted font-mono">
                      <MaskedText text={selectedRepair.phoneNumber} maskFn={maskPhone} />
                    </p>
                  </div>
                  <div className="bg-brand-light/50 p-4 rounded-2xl border border-brand-border/40">
                    <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1">Due Date</p>
                    <p className="text-sm font-bold text-brand-dark">
                      {format(new Date(selectedRepair.dueDate), 'dd MMM, yyyy')}
                    </p>
                    <p className="text-xs text-brand-muted font-mono">11:00 AM</p>
                  </div>
                </div>

                {/* Cobbler Assignment UI */}
                <div className="bg-brand-light/50 p-4 rounded-2xl border border-brand-border/40 space-y-2">
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Assigned Artisan</p>
                  <div className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-olive/10 flex items-center justify-center text-brand-olive shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        {selectedRepair.assignedCobblerId ? (
                          <>
                            <p className="text-xs font-bold text-brand-dark truncate">{selectedRepair.assignedCobblerName}</p>
                            <p className="text-[9px] text-brand-muted font-bold uppercase truncate">
                              {settings.cobblers?.find(c => c.id === selectedRepair.assignedCobblerId)?.specialty || 'Master Cobbler'}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-brand-muted italic">Unassigned</p>
                        )}
                      </div>
                    </div>
                    <select
                      value={selectedRepair.assignedCobblerId || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          updateRepair(selectedRepair.id, { assignedCobblerId: undefined, assignedCobblerName: undefined });
                          setSelectedRepair(prev => prev ? { ...prev, assignedCobblerId: undefined, assignedCobblerName: undefined } : null);
                        } else {
                          const cob = (settings.cobblers || []).find(c => c.id === val);
                          if (cob) {
                            updateRepair(selectedRepair.id, { assignedCobblerId: cob.id, assignedCobblerName: cob.name });
                            setSelectedRepair(prev => prev ? { ...prev, assignedCobblerId: cob.id, assignedCobblerName: cob.name } : null);
                          }
                        }
                      }}
                      className="text-[11px] bg-white border border-brand-border rounded-lg px-2 py-1.5 font-bold focus:ring-brand-accent focus:border-brand-accent"
                    >
                      <option value="">-- Assign Cobbler --</option>
                      {(settings.cobblers || []).map(cob => (
                        <option key={cob.id} value={cob.id}>{cob.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active Workshop Hands-On Labor Stopwatch */}
                <div className="bg-brand-light/50 p-4 rounded-2xl border border-brand-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-olive" />
                      Active Hands-On Labor
                    </p>
                    {selectedRepair.laborSeconds && selectedRepair.laborSeconds > 0 ? (
                      <span className="text-[9px] font-mono font-bold bg-[#FAF9F5] border border-brand-border/40 text-[#5C5340] px-2 py-0.5 rounded-md">
                        Total Logged: {Math.floor(selectedRepair.laborSeconds / 3600)}h {Math.floor((selectedRepair.laborSeconds % 3600) / 60)}m {selectedRepair.laborSeconds % 60}s
                      </span>
                    ) : (
                      <span className="text-[9px] text-brand-muted font-bold uppercase tracking-wide">
                        No Time Logged
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-brand-border/50">
                    <div className="font-mono text-xl font-black tracking-wider text-brand-dark">
                      {formatStopwatchTime(stopwatchSeconds)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                        className={clsx(
                          "p-2.5 rounded-xl text-white transition-all active:scale-90 shadow-sm cursor-pointer",
                          isStopwatchRunning 
                            ? "bg-amber-600 hover:bg-amber-700" 
                            : "bg-brand-olive hover:bg-brand-dark"
                        )}
                        title={isStopwatchRunning ? "Pause timer" : "Start timer"}
                      >
                        {isStopwatchRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={handleSaveLaborTime}
                        disabled={stopwatchSeconds === 0}
                        className={clsx(
                          "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer",
                          stopwatchSeconds === 0 
                            ? "bg-[#FAF9F5] border border-[#E8E6DF] text-brand-muted/40 cursor-not-allowed" 
                            : "bg-brand-accent text-white hover:bg-brand-accent/90 shadow-sm"
                        )}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Log Time
                      </button>
                    </div>
                  </div>
                </div>

                {/* Financial Ledger Section */}
                <div className="bg-brand-light/35 p-4 rounded-2xl border border-brand-border/40 space-y-4">
                  <div className="flex items-center justify-between border-b border-brand-border/45 pb-2">
                    <h4 className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Financial Ledger</h4>
                    <span className={clsx(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border",
                      selectedRepair.price - (selectedRepair.advance || 0) === 0 ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                      selectedRepair.advance > 0 ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-red-100 text-red-700 border-red-200"
                    )}>
                      {selectedRepair.price - (selectedRepair.advance || 0) === 0 ? 'Fully Paid' : selectedRepair.advance > 0 ? 'Partially Paid' : 'Unpaid'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-xl border border-brand-border/40">
                      <p className="text-[9px] font-bold text-brand-muted uppercase tracking-wider">Total Price</p>
                      <p className="font-black text-brand-dark">₹{selectedRepair.price}</p>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-brand-border/40">
                      <p className="text-[9px] font-bold text-brand-muted uppercase tracking-wider">Paid</p>
                      <p className="font-black text-emerald-600">₹{selectedRepair.advance || 0}</p>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-brand-border/40">
                      <p className="text-[9px] font-bold text-brand-muted uppercase tracking-wider">Balance Due</p>
                      <p className="font-black text-red-600">₹{selectedRepair.price - (selectedRepair.advance || 0)}</p>
                    </div>
                  </div>

                  {/* Payment Records History list */}
                  {selectedRepair.payments && selectedRepair.payments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Payment History</p>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {selectedRepair.payments.map((p, idx) => (
                          <div key={p.id || idx} className="flex justify-between items-center text-[11px] bg-white p-2 rounded-xl border border-brand-border/30">
                            <div>
                              <p className="font-bold text-brand-dark">₹{p.amount} via {p.method}</p>
                              <p className="text-[9px] text-brand-muted">
                                {format(new Date(p.date), 'dd MMM yyyy, hh:mm a')}
                              </p>
                            </div>
                            {p.transactionId && (
                              <p className="text-[9px] text-brand-muted font-mono bg-brand-light px-1 py-0.5 rounded truncate max-w-[120px]">
                                {p.transactionId}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRepair.price - (selectedRepair.advance || 0) > 0 && (
                    <button 
                      onClick={() => setPaymentRepairId(selectedRepair.id)}
                      className="w-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 active:scale-98"
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      Record Direct Payment
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Requirement Detail</p>
                  <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-sm text-sm text-brand-dark leading-relaxed whitespace-pre-line font-medium">
                    {selectedRepair.description || `${selectedRepair.repairType.join(', ')} - Deep cleaning and premium restoration requested.`}
                  </div>
                </div>

                {/* Artisan Comments Section */}
                <section className="space-y-4 pt-2 border-t border-brand-border/40">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-brand-muted uppercase tracking-widest font-display">Artisan Work Logs & comments</h3>
                    <span className="bg-brand-bg text-brand-dark text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-brand-border">
                      {selectedRepair.comments?.length || 0} Logs
                    </span>
                  </div>

                  {/* Add Comment controls */}
                  <div className="bg-brand-light/50 p-3 rounded-2xl border border-brand-border space-y-2.5">
                    <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Log an update</p>
                    {(() => {
                      const list: { id: string; name: string; role: string }[] = [];
                      if (settings?.employees) {
                        settings.employees.forEach((emp: any) => list.push({ id: emp.id, name: emp.name, role: emp.role }));
                      }
                      if (settings?.cobblers) {
                        settings.cobblers.forEach((cob: any) => list.push({ id: cob.id, name: cob.name, role: cob.specialty + ' Cobbler' }));
                      }
                      return (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <select
                              value={selectedCommentAuthor}
                              onChange={(e) => setSelectedCommentAuthor(e.target.value)}
                              className="bg-[#FAF9F5] border border-brand-border rounded-xl px-3 py-2 text-[10px] font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-olive/20"
                            >
                              <option value="">Select Sign-off...</option>
                              {list.map(member => (
                                <option key={member.id} value={member.name}>
                                  {member.name}
                                </option>
                              ))}
                              <option value="Anonymous Cobbler">Anonymous Cobbler</option>
                            </select>
                            <input
                              type="text"
                              value={newCommentText}
                              onChange={(e) => setNewCommentText(e.target.value)}
                              placeholder="Type a progress update or issue..."
                              className="flex-1 bg-[#FAF9F5] border border-brand-border rounded-xl px-3 py-2 text-[10px] font-medium text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-olive/20"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddComment();
                              }}
                            />
                            <button
                              onClick={handleAddComment}
                              disabled={!newCommentText.trim()}
                              className="px-4 bg-brand-dark hover:bg-brand-olive text-white rounded-xl transition-all flex items-center justify-center disabled:opacity-40 disabled:hover:bg-brand-dark shadow-sm hover:scale-102 active:scale-98"
                              title="Post Log"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* List comments */}
                  <div className="space-y-3">
                    {selectedRepair.comments && selectedRepair.comments.length > 0 ? (
                      <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                        {selectedRepair.comments.map((comment) => (
                          <div key={comment.id} className="bg-white p-4 rounded-xl border border-brand-border flex items-start justify-between gap-3 shadow-sm animate-fade-in">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-extrabold text-brand-dark">{comment.author}</span>
                                <span className="bg-amber-100/70 text-amber-900 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  Artisan
                                </span>
                                <span className="text-[10px] text-brand-muted font-medium">
                                  {(() => {
                                    try {
                                      return format(new Date(comment.timestamp), 'dd MMM, hh:mm a');
                                    } catch {
                                      return 'Recently';
                                    }
                                  })()}
                                </span>
                              </div>
                              <p className="text-xs text-brand-dark/95 leading-relaxed font-medium">
                                {comment.text}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-brand-muted hover:text-red-500 p-1 rounded-lg transition-colors shrink-0"
                              title="Delete Log"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-center text-brand-muted uppercase font-bold tracking-widest py-4 border border-dashed border-brand-border rounded-2xl bg-brand-light/30">
                        No progress comments logged yet
                      </p>
                    )}
                  </div>
                </section>

                {/* Voice Notes Section */}
                <section className="space-y-4 pt-2 border-t border-brand-border/40">
                  <h3 className="text-xs font-black text-brand-muted uppercase tracking-widest font-display">Voice Notes</h3>
                  
                  <VoiceNoteRecorder 
                    onSave={(base64, duration) => {
                      addVoiceNote(selectedRepair.id, {
                        blobUrl: base64,
                        duration,
                        timestamp: new Date().toISOString()
                      });
                    }}
                  />

                  <div className="space-y-3">
                    {selectedRepair.voiceNotes?.map((note) => (
                      <VoiceNoteItem 
                        key={note.id} 
                        note={note} 
                        onDelete={() => deleteVoiceNote(selectedRepair.id, note.id)} 
                      />
                    ))}
                    {(!selectedRepair.voiceNotes || selectedRepair.voiceNotes.length === 0) && (
                      <p className="text-[10px] text-center text-brand-muted uppercase font-bold tracking-widest py-4 border border-dashed border-brand-border rounded-2xl">
                        No voice notes recorded
                      </p>
                    )}
                  </div>
                </section>
              </section>
            </div>

            {/* Workflow Actions */}
            <div className="p-4 bg-brand-light border-t border-brand-border grid grid-cols-2 gap-3 sticky bottom-0">
              {selectedRepair.status === 'Received' ? (
                <button 
                  onClick={() => handleStatusUpdate(selectedRepair.id, 'In Progress')}
                  className="col-span-2 bg-brand-dark text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-brand-dark/20 hover:-translate-y-0.5 transition-transform active:translate-y-0"
                >
                  Start Repair Now
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : selectedRepair.status === 'In Progress' ? (
                <>
                  <button 
                    onClick={() => handleStatusUpdate(selectedRepair.id, 'Polishing')}
                    className="bg-brand-olive text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-brand-olive/20"
                  >
                    Send to Polishing
                  </button>
                  <button className="bg-white border border-brand-border text-brand-dark py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    Put on Hold
                  </button>
                </>
              ) : selectedRepair.status === 'Polishing' ? (
                <button 
                  onClick={() => handleStatusUpdate(selectedRepair.id, 'Completed')}
                  className="col-span-2 bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  Mark as Ready for Pickup
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  onClick={() => setSelectedRepair(null)}
                  className="col-span-2 bg-white border border-brand-border text-brand-dark py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  Back to Workshop
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Cobbler Modal */}
      {isAddCobblerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl border border-brand-border p-6 w-full max-w-md shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="font-display text-xl font-black text-brand-dark tracking-tight uppercase">Add New Artisan</h3>
            <form onSubmit={handleAddCobbler} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Artisan Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baldev Prasad"
                  value={newCobblerName}
                  onChange={(e) => setNewCobblerName(e.target.value)}
                  className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-xs font-bold focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Specialty</label>
                <select
                  value={newCobblerSpecialty}
                  onChange={(e) => setNewCobblerSpecialty(e.target.value)}
                  className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-xs font-bold focus:ring-brand-accent focus:border-brand-accent"
                >
                  <option value="Goodyear-Welt">Goodyear-Welt</option>
                  <option value="Patina Master">Patina Master</option>
                  <option value="Sole Stitching">Sole Stitching</option>
                  <option value="Suede Restoration">Suede Restoration</option>
                  <option value="Heel Crafting">Heel Crafting</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Mobile Number</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={newCobblerMobile}
                  onChange={(e) => setNewCobblerMobile(e.target.value)}
                  className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-xs font-bold focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. artisan@cordwainers.com"
                  value={newCobblerEmail}
                  onChange={(e) => setNewCobblerEmail(e.target.value)}
                  className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-xs font-bold focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddCobblerModalOpen(false)}
                  className="flex-1 bg-white border border-brand-border text-brand-muted py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:text-brand-dark transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-dark text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-brand-accent transition-colors shadow-lg shadow-brand-dark/10"
                >
                  Save Artisan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentRepairId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl border border-brand-border p-6 w-full max-w-md shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="font-display text-xl font-black text-brand-dark tracking-tight uppercase">Record Payment</h3>
            <div className="bg-brand-light/40 p-3 rounded-xl border border-brand-border/40 text-xs">
              <span className="font-bold text-brand-muted">Repair Order:</span>{' '}
              <span className="font-black text-brand-dark">
                {repairs.find(r => r.id === paymentRepairId)?.shoeModel} (
                {repairs.find(r => r.id === paymentRepairId)?.invoiceNumber})
              </span>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddPayment(
                paymentRepairId,
                paymentAmount,
                paymentMethod,
                paymentDate,
                paymentTransactionId,
                paymentNotes
              );
              setPaymentRepairId(null);
            }} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={repairs.find(r => r.id === paymentRepairId) ? (repairs.find(r => r.id === paymentRepairId)!.price - (repairs.find(r => r.id === paymentRepairId)!.advance || 0)) : 100000}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-xs font-bold focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-xs font-bold focus:ring-brand-accent focus:border-brand-accent"
                >
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-xs font-bold focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Transaction ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. TXN987654321"
                  value={paymentTransactionId}
                  onChange={(e) => setPaymentTransactionId(e.target.value)}
                  className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-xs font-bold focus:ring-brand-accent focus:border-brand-accent font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Partial balance collected"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-xs font-bold focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setPaymentRepairId(null)}
                  className="flex-1 bg-white border border-brand-border text-brand-muted py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:text-brand-dark transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/10"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RepairList({ repairs, onSelect, getStatusColor }: { 
  repairs: ShoeRepairRequest[], 
  onSelect: (r: ShoeRepairRequest) => void,
  getStatusColor: (s: RepairStatus) => string
}) {
  const { isPrivacyMasked } = useAppStore();

  const maskName = (name: string) => {
    if (!isPrivacyMasked) return name;
    const parts = (name || '').split(' ');
    return parts.map((p, i) => i === 0 ? p : p[0] + '•••').join(' ');
  };

  return (
    <div className="space-y-3">
      {repairs.map((repair) => (
        <button
          key={repair.id}
          onClick={() => onSelect(repair)}
          className="w-full bg-white p-4 rounded-2xl border border-brand-border/60 shadow-xs hover:shadow-md hover:border-brand-olive/30 hover:-translate-y-0.5 transition-all flex items-center gap-4 group text-left"
        >
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-brand-light border border-brand-border flex-shrink-0 relative">
            {repair.photoUrl ? (
              <img src={repair.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-brand-muted opacity-30" />
              </div>
            )}
            {repair.voiceNotes && repair.voiceNotes.length > 0 && (
              <div className="absolute -top-1 -right-1 bg-brand-accent p-1 rounded-full border-2 border-white shadow-sm z-10">
                <Volume2 className="w-2.5 h-2.5 text-white" />
              </div>
            )}
            <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-brand-olive rounded-full border border-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest truncate">{repair.invoiceNumber}</span>
              <span className={clsx(
                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border",
                getStatusColor(repair.status)
              )}>
                {repair.status === 'Completed' ? 'Ready for Pickup' : repair.status}
              </span>
            </div>
            <h4 className="font-display text-base font-black text-brand-dark truncate leading-tight mb-0.5">{repair.shoeModel}</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-muted truncate">{maskName(repair.customerName)}</span>
              <span className="w-1 h-1 bg-brand-border rounded-full" />
              <span className="text-xs font-mono text-brand-olive font-bold">₹{repair.price}</span>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center group-hover:bg-brand-olive group-hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      ))}
    </div>
  );
}

function VoiceNoteItem({ note, onDelete }: { note: VoiceNote, onDelete: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 bg-brand-light/30 p-3 rounded-xl border border-brand-border/40 group">
      <button 
        onClick={togglePlayback}
        className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-brand-olive hover:scale-105 transition-transform"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">
            {format(new Date(note.timestamp), 'dd MMM, HH:mm')}
          </p>
          <span className="text-[10px] font-bold text-brand-olive font-mono">
            {formatDuration(note.duration)}
          </span>
        </div>
        <div className="h-1.5 bg-white rounded-full mt-2 overflow-hidden border border-brand-border/40">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: isPlaying ? '100%' : '0%' }}
            transition={{ duration: note.duration || 0, ease: 'linear' }}
            className="h-full bg-brand-accent"
          />
        </div>
      </div>

      <button 
        onClick={onDelete}
        className="p-2 text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:text-red-600"
      >
        <TrashIcon className="w-4 h-4" />
      </button>

      <audio 
        ref={audioRef} 
        src={note.blobUrl} 
        onEnded={() => setIsPlaying(false)} 
        className="hidden" 
      />
    </div>
  );
}
