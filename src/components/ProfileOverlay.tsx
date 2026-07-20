import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Calendar, Save, LogOut, Camera, Sparkles } from 'lucide-react';
import { useAppStore } from '../store';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import ServiceHub from './ServiceHub';
import { auth } from '../services/firebase';

interface ProfileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileOverlay({ isOpen, onClose }: ProfileOverlayProps) {
  const { user, userProfile } = useAppStore();
  const navigate = useNavigate();

  if (!user) return null;

  const isAdmin = user.email === 'star.aks486@gmail.com' || 
                  user.email === 'admin@cordwainers.local' || 
                  userProfile?.role === 'Admin' || 
                  userProfile?.isAdmin;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm"
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 280 }}
            className="relative w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto border-l border-brand-border flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-brand-border px-6 sm:px-10 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-dark text-white flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-black text-brand-dark uppercase tracking-tight">Artisan Portal</h2>
                  <p className="text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] opacity-60">Cordwainers Studio ID</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 hover:bg-brand-bg rounded-xl transition-all group active:scale-95 border border-transparent hover:border-brand-border"
              >
                <X className="w-5 h-5 text-brand-muted group-hover:text-brand-dark" />
              </button>
            </div>

            <div className="flex-1 p-6 sm:p-10 space-y-10 pb-32">
              {/* Profile Card / Hero Section */}
              <div className="bg-brand-dark rounded-[32px] p-8 sm:p-10 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/10 rounded-full -mr-32 -mt-32 blur-[80px] transition-all group-hover:bg-brand-accent/20" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-olive/20 rounded-full -ml-16 -mb-16 blur-[60px]" />
                
                <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                  <div className="relative">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2.5rem] bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-4xl font-display font-black shadow-inner border border-white/20">
                      {(user.displayName || user.email?.split('@')[0] || 'A').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-accent rounded-xl flex items-center justify-center border-2 border-brand-dark shadow-lg">
                      <Sparkles className="w-4 h-4 text-brand-dark" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tighter">
                      {user.displayName || 'Artisan Partner'}
                    </h3>
                    <p className="text-xs font-bold text-brand-bg/60 uppercase tracking-widest">{user.email}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl backdrop-blur-sm">
                    <Calendar className="w-3.5 h-3.5 text-brand-accent" />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/80">
                      Partner since {format(new Date(user.metadata.creationTime || Date.now()), 'MMMM yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Quick Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isAdmin && (
                  <button 
                    onClick={() => {
                      navigate('/settings');
                      onClose();
                    }}
                    className="p-5 rounded-2xl border border-brand-border bg-white hover:border-brand-accent hover:shadow-premium transition-all text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center text-brand-olive group-hover:bg-brand-olive group-hover:text-white transition-all">
                        <Save className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark">Studio Preferences</span>
                    </div>
                  </button>
                )}
                <button 
                  onClick={() => auth.signOut()}
                  className="p-5 rounded-2xl border border-brand-border bg-white hover:border-red-200 hover:bg-red-50/30 transition-all text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Terminate Session</span>
                  </div>
                </button>
              </div>

              {/* Service Hub Section */}
              <div className="pt-2">
                <ServiceHub onItemClick={onClose} />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
