import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Download, X, Share, PlusSquare, MoreVertical } from 'lucide-react';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    // 1. Check if already in standalone mode (installed)
    const isStandalone = 
      (window.navigator as any).standalone || 
      window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) return;

    // 2. Check if user dismissed it recently
    const dismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissed) {
      const lastDismissed = parseInt(dismissed, 10);
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - lastDismissed < threeDays) return;
    }

    // 3. Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isMobile = isIos || isAndroid;

    if (isMobile) {
      setPlatform(isIos ? 'ios' : 'android');
      // Delay prompt slightly for better UX
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 z-[100] md:hidden"
      >
        <div className="bg-brand-dark text-white rounded-[32px] p-6 shadow-2xl border border-brand-dark-surface overflow-hidden relative">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          <button 
            onClick={dismiss}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-accent flex items-center justify-center shrink-0 shadow-lg">
              <Download className="w-6 h-6 text-brand-dark" />
            </div>
            
            <div className="space-y-3 pr-6">
              <div>
                <h3 className="font-display font-black text-lg uppercase tracking-tight leading-tight">Install Studio App</h3>
                <p className="text-white/60 text-xs font-medium tracking-wide">Access Cordwainers from your home screen for the full artisan experience.</p>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 border border-white/5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent">How to install:</p>
                
                {platform === 'ios' ? (
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <Share className="w-4 h-4" />
                    </div>
                    <p className="leading-tight">Tap <span className="font-bold">Share</span> and select <span className="font-bold">"Add to Home Screen"</span></p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <MoreVertical className="w-4 h-4" />
                    </div>
                    <p className="leading-tight">Tap the <span className="font-bold">Menu</span> and select <span className="font-bold">"Install App"</span> or <span className="font-bold">"Add to Home screen"</span></p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
