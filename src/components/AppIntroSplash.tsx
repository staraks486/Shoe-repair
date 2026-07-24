import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Footprints, 
  RefreshCw, 
  CheckCircle2, 
  Lightbulb, 
  Zap, 
  ArrowRight,
  Clock
} from 'lucide-react';
import { useAppStore } from '../store';
import { SHOE_FACTS } from './ShoeFactsLoader';

interface AppIntroSplashProps {
  forceShow?: boolean;
  onComplete?: () => void;
}

const INTRO_STEPS = [
  { label: "Initializing Cordwainer Studio Node...", sub: "Verifying secure workshop session & environment" },
  { label: "Syncing Firestore Database Records...", sub: "Fetching active repairs, customers & store settings in background" },
  { label: "Processing Offline Queue & Pings...", sub: "Pushing local pending mutations to live Cloud Firestore" },
  { label: "Optimizing Asset Cache & Soundscape...", sub: "Preloading UI themes, size maps & artisan tools" },
  { label: "Workshop Workspace Ready!", sub: "Opening Cordwainer Artisan Studio" }
];

export default function AppIntroSplash({ forceShow = false, onComplete }: AppIntroSplashProps) {
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (forceShow) return true;
    const alreadyShown = sessionStorage.getItem('cordwainer_intro_shown');
    return !alreadyShown;
  });

  const [progress, setProgress] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [syncStatusText, setSyncStatusText] = useState('Starting background update...');
  const [speedMode, setSpeedMode] = useState<'slow' | 'standard'>('slow');

  const { fetchFromFirestore, processOfflineQueue, repairs } = useAppStore();

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Derived stepIndex from progress to avoid setState inside setState loop
  const stepIndex = Math.min(
    Math.floor((progress / 100) * INTRO_STEPS.length),
    INTRO_STEPS.length - 1
  );

  // Sync forceShow prop or custom global event trigger
  useEffect(() => {
    if (forceShow) {
      setShowSplash(true);
      setProgress(0);
    }
  }, [forceShow]);

  useEffect(() => {
    const handleReplayIntro = () => {
      setShowSplash(true);
      setProgress(0);
    };

    window.addEventListener('open-app-intro', handleReplayIntro);
    return () => window.removeEventListener('open-app-intro', handleReplayIntro);
  }, []);

  // Execute Background Update & Intro Timer
  useEffect(() => {
    if (!showSplash) return;

    let isMounted = true;

    // Pick random initial shoe fact
    setFactIndex(Math.floor(Math.random() * SHOE_FACTS.length));

    // 1. Kick off real background application update
    const runBackgroundUpdate = async () => {
      try {
        if (isMounted) setSyncStatusText('Fetching live Firestore data...');
        await fetchFromFirestore();
        if (isMounted) setSyncStatusText('Processing offline sync queue...');
        await processOfflineQueue();
        if (isMounted) setSyncStatusText('Background update complete!');
      } catch (err) {
        console.warn('Background update warning during intro:', err);
        if (isMounted) setSyncStatusText('Background update ready.');
      }
    };

    runBackgroundUpdate();

    // 2. Smooth Progress Timer
    const stepDuration = speedMode === 'slow' ? 700 : 400; // ms per step
    const intervalTime = 50; // update frequency
    const increment = 100 / ((stepDuration * INTRO_STEPS.length) / intervalTime);

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
          }, 350);
          return 100;
        }
        return nextProgress;
      });
    }, intervalTime);

    // Rotate shoe facts every 2.5 seconds
    const factTimer = setInterval(() => {
      if (isMounted) {
        setFactIndex((prev) => (prev + 1) % SHOE_FACTS.length);
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(timer);
      clearInterval(factTimer);
    };
  }, [showSplash, speedMode, fetchFromFirestore, processOfflineQueue]);

  const currentFact = SHOE_FACTS[factIndex] || SHOE_FACTS[0];
  const currentStep = INTRO_STEPS[stepIndex] || INTRO_STEPS[0];

  const handleSkip = () => {
    sessionStorage.setItem('cordwainer_intro_shown', 'true');
    setShowSplash(false);
    if (onCompleteRef.current) onCompleteRef.current();
  };

  if (!showSplash) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="fixed inset-0 z-[9999] bg-[#1A1615] text-white flex flex-col items-center justify-between p-4 sm:p-6 md:p-10 select-none overflow-hidden"
      >
        {/* Background Glowing Ambient Orbs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand-accent/15 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-600/15 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '1000ms' }} />

        {/* Top Bar Controls */}
        <div className="w-full max-w-4xl flex items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-1">
              <Zap className="w-3 h-3 fill-emerald-400 text-emerald-400" /> Background Updating
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSpeedMode(prev => prev === 'slow' ? 'standard' : 'slow')}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted hover:text-white transition-all flex items-center gap-1 border border-white/10"
              title="Toggle Intro Pace"
            >
              <Clock className="w-3 h-3 text-brand-accent" />
              <span>Pace: {speedMode === 'slow' ? 'Slow & Smooth (3.5s)' : 'Standard (2.0s)'}</span>
            </button>

            <button
              onClick={handleSkip}
              className="px-4 py-1.5 rounded-full bg-brand-accent/20 hover:bg-brand-accent hover:text-brand-dark text-brand-accent text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 border border-brand-accent/40 cursor-pointer"
            >
              <span>Skip Intro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Central Studio Branding & Progress Card */}
        <div className="w-full max-w-xl my-auto z-10 space-y-6 text-center">
          {/* Animated Workshop Badge */}
          <div className="flex flex-col items-center space-y-3">
            <motion.div 
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, type: 'spring' }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-dark via-[#2A2421] to-[#120F0E] flex items-center justify-center shadow-2xl border-2 border-brand-accent/40 relative overflow-hidden">
                <Footprints className="w-10 h-10 text-brand-accent animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              </div>
              <div className="absolute -top-2 -right-2 w-7 h-7 bg-brand-accent rounded-full flex items-center justify-center shadow-lg border-2 border-[#1A1615]">
                <Sparkles className="w-3.5 h-3.5 text-brand-dark animate-spin" />
              </div>
            </motion.div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent bg-brand-accent/10 px-3 py-1 rounded-full border border-brand-accent/20">
                MADE IN INDIA • EST. 1898
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold tracking-tight text-white pt-2">
                CORDWAINERS <span className="text-brand-accent">STUDIO</span>
              </h1>
              <p className="text-xs text-brand-muted/80 font-mono tracking-wider">
                Artisan Footwear Repair & Luxury Care Hub
              </p>
            </div>
          </div>

          {/* Progress Percentage Display & Bar */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl space-y-4 relative overflow-hidden">
            <div className="flex justify-between items-end border-b border-white/10 pb-3">
              <div className="text-left space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" /> Step {stepIndex + 1} of {INTRO_STEPS.length}
                </span>
                <p className="text-sm font-bold text-white tracking-wide">
                  {currentStep.label}
                </p>
                <p className="text-[11px] text-brand-muted/80 font-mono">
                  {currentStep.sub}
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-mono font-black text-brand-accent">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            {/* Custom Smooth Progress Track */}
            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-white/15 relative">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 via-brand-accent to-emerald-400 rounded-full shadow-lg"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>

            {/* Background Sync Live Metrics */}
            <div className="flex items-center justify-between text-[10px] font-mono text-brand-muted pt-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sync Status: <strong className="text-white">{syncStatusText}</strong></span>
              </div>
              <div>
                <span>Active Repairs: <strong className="text-amber-300">{repairs?.length || 0} orders</strong></span>
              </div>
            </div>
          </div>

          {/* Rotating Shoe Care & Craft Fact Card */}
          <div className="bg-gradient-to-r from-white/5 via-white/10 to-white/5 border border-white/10 rounded-2xl p-4 text-left relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
              <span className="text-[9.5px] font-mono font-bold uppercase tracking-widest text-amber-300 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-400 fill-amber-400/30" /> Craft & Leather Trivia
              </span>
              <span className="text-[9px] font-mono text-brand-muted px-2 py-0.5 rounded bg-white/10">
                {currentFact.category}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentFact.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="space-y-1"
              >
                <h4 className="text-xs font-bold text-white">{currentFact.title}</h4>
                <p className="text-[11px] text-brand-muted leading-relaxed">
                  "{currentFact.fact}"
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Design Credit */}
        <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-2 text-center text-[10px] font-mono text-brand-muted/70 pt-4 border-t border-white/10 z-10">
          <div>
            <span>Design by <strong className="text-white font-bold">Arvind Kumar Shukla</strong></span>
          </div>
          <div>
            <span>Cordwainers Studio • Full-Stack Realtime Sync Enabled</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

