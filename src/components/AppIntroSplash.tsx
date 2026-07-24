import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Footprints, ArrowRight, Quote, Sparkles } from 'lucide-react';
import { useAppStore } from '../store';
import { SHOE_INSIGHTS, ShoeInsight } from '../data/shoeFacts';

interface AppIntroSplashProps {
  forceShow?: boolean;
  onComplete?: () => void;
}

export default function AppIntroSplash({ forceShow = false, onComplete }: AppIntroSplashProps) {
  const { settings, fetchFromFirestore, processOfflineQueue } = useAppStore();
  const currentSpeed = settings?.introSpeed || 'slow';

  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (forceShow) return true;
    const initialSpeed = useAppStore.getState().settings?.introSpeed || 'slow';
    if (initialSpeed === 'off') return false;
    const alreadyShown = sessionStorage.getItem('cordwainer_intro_shown');
    return !alreadyShown;
  });

  const [progress, setProgress] = useState(0);
  const [insightIndex, setInsightIndex] = useState<number>(() => Math.floor(Math.random() * SHOE_INSIGHTS.length));

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Sync forceShow prop or custom global event trigger
  useEffect(() => {
    if (forceShow) {
      setShowSplash(true);
      setProgress(0);
      setInsightIndex(Math.floor(Math.random() * SHOE_INSIGHTS.length));
    }
  }, [forceShow]);

  useEffect(() => {
    const handleReplayIntro = () => {
      setShowSplash(true);
      setProgress(0);
      setInsightIndex(Math.floor(Math.random() * SHOE_INSIGHTS.length));
    };

    window.addEventListener('open-app-intro', handleReplayIntro);
    return () => window.removeEventListener('open-app-intro', handleReplayIntro);
  }, []);

  // Rotate fact/quote every 4 seconds if splash stays open for comfortable reading
  useEffect(() => {
    if (!showSplash) return;
    const rotateInterval = setInterval(() => {
      setInsightIndex((prev) => (prev + 1) % SHOE_INSIGHTS.length);
    }, 4000);
    return () => clearInterval(rotateInterval);
  }, [showSplash]);

  // Execute Background Update & Intro Timer
  useEffect(() => {
    if (!showSplash) return;

    let isMounted = true;

    // Kick off background sync
    const runBackgroundUpdate = async () => {
      try {
        await fetchFromFirestore();
        await processOfflineQueue();
      } catch (err) {
        console.warn('Background sync during intro:', err);
      }
    };

    runBackgroundUpdate();

    // Extended Progress Timer for relaxed presentation and ample reading time
    const stepDurationMap: Record<string, number> = {
      slow: 1200,     // ~6.0s total - extended viewing time
      standard: 800,  // ~4.0s total - balanced viewing time
      fast: 400,      // ~2.0s total - quick preview
      off: 60         // instant transition if previewed while off
    };
    const stepDuration = stepDurationMap[currentSpeed] || 1200;
    const intervalTime = 30;
    const increment = 100 / ((stepDuration * 5) / intervalTime);

    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          return 100;
        }

        const nextProgress = prevProgress + increment;

        if (nextProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            if (isMounted) {
              sessionStorage.setItem('cordwainer_intro_shown', 'true');
              setShowSplash(false);
              if (onCompleteRef.current) onCompleteRef.current();
            }
          }, 200);
          return 100;
        }
        return nextProgress;
      });
    }, intervalTime);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [showSplash, currentSpeed, fetchFromFirestore, processOfflineQueue]);

  const handleSkip = () => {
    sessionStorage.setItem('cordwainer_intro_shown', 'true');
    setShowSplash(false);
    if (onCompleteRef.current) onCompleteRef.current();
  };

  if (!showSplash) return null;

  const currentInsight: ShoeInsight = SHOE_INSIGHTS[insightIndex] || SHOE_INSIGHTS[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.99 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="fixed inset-0 z-[9999] bg-[#181514] text-white flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden"
      >
        {/* Top Header - Skip button only */}
        <div className="w-full max-w-2xl flex justify-end items-center z-10">
          <button
            onClick={handleSkip}
            className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer"
          >
            <span>Skip</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Central Studio Branding & Fact Box */}
        <div className="w-full max-w-md my-auto z-10 space-y-6 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center space-y-3"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#231F1D] flex items-center justify-center border border-brand-accent/30 shadow-2xl relative">
              <Footprints className="w-8 h-8 sm:w-10 sm:h-10 text-brand-accent" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-white">
                CORDWAINERS <span className="text-brand-accent">STUDIO</span>
              </h1>
              <p className="text-xs text-brand-muted/80 tracking-wider">
                Artisan Footwear & Leather Care
              </p>
            </div>
          </motion.div>

          {/* Minimal Progress Bar */}
          <div className="space-y-2 px-2">
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden p-0 relative">
              <motion.div
                className="h-full bg-brand-accent rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-mono text-brand-muted/70">
              <span>Loading workspace...</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Clean, Simple Fact / Quote Card */}
          <div className="pt-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={insightIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                onClick={() => setInsightIndex((prev) => (prev + 1) % SHOE_INSIGHTS.length)}
                className="bg-[#231F1D]/80 border border-white/10 hover:border-brand-accent/30 rounded-2xl p-4 text-left transition-all cursor-pointer group shadow-lg space-y-2"
                title="Click for another insight"
              >
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-brand-accent/90">
                  <span className="flex items-center gap-1.5 font-bold">
                    {currentInsight.type === 'quote' ? (
                      <Quote className="w-3 h-3 text-brand-accent" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-brand-accent" />
                    )}
                    {currentInsight.category}
                  </span>
                  <span className="text-brand-muted/60 text-[9px]">Tap for next</span>
                </div>

                <p className="text-xs text-white/90 leading-relaxed font-sans">
                  {currentInsight.type === 'quote' ? `"${currentInsight.text}"` : currentInsight.text}
                </p>

                {currentInsight.author && (
                  <p className="text-[10px] text-brand-accent/80 font-medium text-right italic pt-0.5">
                    — {currentInsight.author}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="w-full max-w-2xl text-center text-[11px] text-brand-muted/50 z-10">
          <span>Cordwainers Studio • Design by Arvind Kumar Shukla</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}


