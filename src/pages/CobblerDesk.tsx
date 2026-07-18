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
  Pause
} from 'lucide-react';
import { useAppStore } from '../store';
import { ShoeRepairRequest, RepairStatus, VoiceNote } from '../types';
import clsx from 'clsx';
import { format } from 'date-fns';
import VoiceNoteRecorder from '../components/VoiceNoteRecorder';
import { motion } from 'motion/react';

export default function CobblerDesk() {
  const { repairs, updateRepairStatus, addVoiceNote, deleteVoiceNote } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<RepairStatus | 'All'>('All');
  const [selectedRepair, setSelectedRepair] = useState<ShoeRepairRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'assigned' | 'in-progress' | 'completed'>('assigned');

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
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Polishing': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Delivered': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const handleStatusUpdate = (id: string, newStatus: RepairStatus) => {
    updateRepairStatus(id, newStatus);
    if (selectedRepair?.id === id) {
      setSelectedRepair(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  return (
    <div className="flex flex-col bg-[#faf9f6]">
      {/* Header */}
      <header className="bg-white border-b border-brand-border/60 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-serif text-2xl font-black text-brand-dark flex items-center gap-2">
              <Hammer className="w-6 h-6 text-brand-olive" />
              Cobbler's Desk
            </h1>
            <p className="text-xs font-bold text-brand-muted uppercase tracking-widest mt-1">
              Workshop Management & Artisan Workflow
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-brand-muted hover:text-brand-dark transition-colors">
              <History className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-brand-olive/10 border border-brand-olive/20 flex items-center justify-center">
              <User className="w-5 h-5 text-brand-olive" />
            </div>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="space-y-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-olive transition-colors" />
            <input
              type="text"
              placeholder="Search by Invoice, Customer or Shoe..."
              className="w-full bg-brand-light border border-brand-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-olive/20 focus:border-brand-olive transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-1 bg-brand-light p-1 rounded-xl border border-brand-border/60 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('assigned')}
              className={clsx(
                'flex-1 min-w-[100px] py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all',
                activeTab === 'assigned' ? 'bg-white text-brand-dark shadow-sm border border-brand-border/60' : 'text-brand-muted'
              )}
            >
              Assigned ({assignedRepairs.length})
            </button>
            <button
              onClick={() => setActiveTab('in-progress')}
              className={clsx(
                'flex-1 min-w-[100px] py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all',
                activeTab === 'in-progress' ? 'bg-white text-brand-dark shadow-sm border border-brand-border/60' : 'text-brand-muted'
              )}
            >
              Progress ({inProgressRepairs.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={clsx(
                'flex-1 min-w-[100px] py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all',
                activeTab === 'completed' ? 'bg-white text-brand-dark shadow-sm border border-brand-border/60' : 'text-brand-muted'
              )}
            >
              Ready for Pickup ({completedRepairs.length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 space-y-4 pb-24">
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
            <p className="font-serif text-lg font-bold text-brand-dark">No repairs found</p>
            <p className="text-sm text-brand-muted mt-1">Try adjusting your filters or search term</p>
          </div>
        )}
      </main>

      {/* Slide-over Detail Panel */}
      {selectedRepair && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-4 border-b border-brand-border flex items-center justify-between sticky top-0 bg-white z-10">
              <button 
                onClick={() => setSelectedRepair(null)}
                className="p-2 hover:bg-brand-light rounded-lg transition-colors"
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </button>
              <span className="font-serif text-lg font-bold text-brand-dark">Repair Details</span>
              <button className="p-2 hover:bg-brand-light rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Status Banner */}
              <div className={clsx(
                "p-4 rounded-2xl border flex items-center justify-between",
                getStatusColor(selectedRepair.status)
              )}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/50 rounded-xl flex items-center justify-center shadow-sm">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Current Status</p>
                    <p className="text-sm font-black">{selectedRepair.status === 'Completed' ? 'Ready for Pickup' : selectedRepair.status}</p>
                  </div>
                </div>
                <button className="bg-white/50 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-white transition-colors">
                  Update
                </button>
              </div>

              {/* Photos Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-brand-muted uppercase tracking-widest">Inspection Photos</h3>
                  <button className="flex items-center gap-1.5 text-brand-olive text-xs font-bold hover:underline">
                    <Camera className="w-3.5 h-3.5" />
                    Add Photo
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {selectedRepair.photoUrl ? (
                    <div className="aspect-square rounded-2xl overflow-hidden border border-brand-border relative group shadow-sm">
                      <img src={selectedRepair.photoUrl} alt="Repair" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button className="p-2 bg-white rounded-full shadow-lg"><Download className="w-4 h-4 text-brand-dark" /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[16/9] rounded-2xl bg-brand-light border-2 border-dashed border-brand-border flex flex-col items-center justify-center text-brand-muted gap-2">
                      <ImageIcon className="w-8 h-8 opacity-20" />
                      <p className="text-xs font-bold">No photos uploaded</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Order Info */}
              <section className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-serif text-2xl font-black text-brand-dark leading-tight">
                      {selectedRepair.shoeModel}
                    </h2>
                    <p className="text-sm font-bold text-brand-olive mt-1">Invoice: {selectedRepair.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 font-serif text-xl font-black text-brand-dark">
                      <IndianRupee className="w-4 h-4" />
                      {selectedRepair.price}
                    </div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Paid: ₹{selectedRepair.advance}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-brand-light/50 p-4 rounded-2xl border border-brand-border/40">
                    <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1">Customer</p>
                    <p className="text-sm font-bold text-brand-dark">{selectedRepair.customerName}</p>
                    <p className="text-xs text-brand-muted font-mono">{selectedRepair.phoneNumber}</p>
                  </div>
                  <div className="bg-brand-light/50 p-4 rounded-2xl border border-brand-border/40">
                    <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1">Due Date</p>
                    <p className="text-sm font-bold text-brand-dark">
                      {format(new Date(selectedRepair.dueDate), 'dd MMM, yyyy')}
                    </p>
                    <p className="text-xs text-brand-muted font-mono">11:00 AM</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Requirement Detail</p>
                  <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-sm text-sm text-brand-dark leading-relaxed">
                    {selectedRepair.repairType.join(', ')} - Deep cleaning and sole replacement requested. Focus on the stitching around the toe box.
                  </div>
                </div>

                {/* Voice Notes Section */}
                <section className="space-y-4">
                  <h3 className="text-xs font-black text-brand-muted uppercase tracking-widest">Voice Notes</h3>
                  
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
    </div>
  );
}

function RepairList({ repairs, onSelect, getStatusColor }: { 
  repairs: ShoeRepairRequest[], 
  onSelect: (r: ShoeRepairRequest) => void,
  getStatusColor: (s: RepairStatus) => string
}) {
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
            <h4 className="font-serif text-base font-black text-brand-dark truncate leading-tight mb-0.5">{repair.shoeModel}</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-muted truncate">{repair.customerName}</span>
              <span className="w-1 h-1 bg-brand-border rounded-full" />
              <span className="text-xs font-mono text-brand-olive">₹{repair.price}</span>
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
        className="p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
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
