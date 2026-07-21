import React from 'react';
import { 
  Sparkles, 
  CloudLightning, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Loader2, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Globe
} from 'lucide-react';
import { useAppStore } from '../store';
import clsx from 'clsx';
import ArtisanSoundscape from './ArtisanSoundscape';

interface ServiceHubProps {
  onItemClick?: () => void;
}

export default function ServiceHub({ onItemClick }: ServiceHubProps = {}) {
  const { 
    settings, 
    updateSettings, 
    syncAllPending, 
    repairs, 
    lastSyncStatus 
  } = useAppStore();

  const isSyncing = lastSyncStatus === 'syncing';
  const pendingSyncCount = repairs.filter(r => !r.isSynced).length;

  const handleSync = async () => {
    if (!settings.isOfflineMode) {
      await syncAllPending();
    }
  };

  return (
    <div className="space-y-8">
      {/* Service Hub Section Header */}
      <div className="flex items-center gap-3 border-b border-brand-border pb-4">
        <div className="w-10 h-10 rounded-2xl bg-brand-olive/10 flex items-center justify-center border border-brand-olive/20 shadow-sm">
          <Sparkles className="w-5 h-5 text-brand-olive" />
        </div>
        <div>
          <h3 className="font-display font-black text-xl text-brand-dark uppercase tracking-tight">Service Hub</h3>
          <p className="text-[10px] text-brand-muted uppercase tracking-widest font-bold">Connectivity & Focus Utilities</p>
        </div>
      </div>

      {/* Artisan Soundscapes Focus Generator */}
      <ArtisanSoundscape />

      {/* Cloud & Connectivity Center */}
      <div className="bg-brand-dark text-white rounded-[28px] p-6 sm:p-8 space-y-6 shadow-2xl border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 blur-[80px] rounded-full -mr-16 -mt-16 group-hover:bg-brand-accent/10 transition-all" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
              <CloudLightning className="w-4 h-4 text-brand-accent animate-pulse" />
            </div>
            <div>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-bg/40 block">Network Ops</span>
              <span className="text-xs font-display font-bold">Connectivity Engine</span>
            </div>
          </div>
          <span className={clsx(
            "text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest border",
            settings.isOfflineMode 
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
              : "bg-green-500/10 text-green-400 border-green-500/20"
          )}>
            {settings.isOfflineMode ? '● Local' : '● Cloud Online'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            type="button"
            onClick={() => updateSettings({ isOfflineMode: !settings.isOfflineMode })}
            className="flex-1 py-3.5 bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2.5 text-white shadow-sm"
          >
            {settings.isOfflineMode ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-brand-accent" />
                Establish Link
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-white/30" />
                Sever Link
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSync}
            disabled={settings.isOfflineMode || pendingSyncCount === 0 || isSyncing}
            className="flex-1 py-3.5 bg-brand-accent text-brand-dark font-black text-[9px] uppercase tracking-[0.2em] rounded-xl hover:opacity-90 transition-all disabled:opacity-10 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg active:scale-95"
          >
            {isSyncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {isSyncing ? 'Aligning...' : `Sync (${pendingSyncCount})`}
          </button>
        </div>
      </div>

      {/* Brand Connections */}
      <div className="bg-brand-bg/50 p-8 rounded-[28px] border border-brand-border flex flex-col items-center space-y-6">
        <div className="flex flex-col items-center space-y-1">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-muted opacity-60">Artisan Circle</span>
          <p className="text-[10px] font-bold text-brand-dark/50 uppercase">Handcrafted Community</p>
        </div>
        
        <div className="flex gap-4 sm:gap-6">
          {[
            { id: 'ig', icon: Instagram, link: settings.instagramLink, label: 'Instagram' },
            { id: 'fb', icon: Facebook, link: settings.facebookLink, label: 'Facebook' },
            { id: 'li', icon: Linkedin, link: settings.linkedinLink, label: 'LinkedIn' },
            { id: 'web', icon: Globe, link: settings.websiteLink, label: 'Website' }
          ].filter(s => s.link).map((social) => (
            <a 
              key={social.id}
              href={social.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-10 h-10 rounded-xl bg-white text-brand-olive border border-brand-border hover:bg-brand-olive hover:text-white hover:shadow-premium transition-all flex items-center justify-center group" 
              title={social.label}
            >
              <social.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
            </a>
          ))}
        </div>
      </div>

      {/* Human Signature/Footer Details */}
      <div className="text-center pt-4 pb-10">
        <div className="flex flex-col items-center space-y-3 opacity-30 grayscale">
          <p className="text-[8px] text-brand-dark font-black tracking-[0.4em] uppercase">Arvind Kumar Shukla</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-[1px] bg-brand-border" />
            <Sparkles className="w-2.5 h-2.5 text-brand-olive" />
            <div className="w-8 h-[1px] bg-brand-border" />
          </div>
          <p className="text-[7px] text-brand-muted font-bold uppercase tracking-widest leading-relaxed max-w-[200px] mx-auto">
            © 2026 Cordwainers Studio • shoeRepair Pro v2.4. artisan framework initialized.
          </p>
        </div>
      </div>
    </div>
  );
}
