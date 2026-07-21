import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, BookOpen, Shield, AlertCircle, X } from 'lucide-react';

interface ShoeCareTip {
  title: string;
  category: string;
  tip: string;
  fact: string;
}

const FALLBACK_TIPS: ShoeCareTip[] = [
  {
    title: "Suede Nap Restoration",
    category: "Suede",
    tip: "Never use water or standard shoe cream on suede. Instead, use a crepe brush in a single direction to raise the nap, and treat with a hydrophobic protector spray.",
    fact: "Suede is made from the underside of the animal hide, making it softer but more delicate than full-grain leather."
  },
  {
    title: "Cedar Shoe Trees",
    category: "Storage",
    tip: "Insert raw cedar shoe trees immediately after taking your shoes off. The natural cedar absorbs moisture, retains the shoe's shape, and deodorizes.",
    fact: "Leather expands when damp from perspiration. Without shoe trees, it can shrink and crack as it dries."
  },
  {
    title: "De-salting Winter Leather",
    category: "Leather",
    tip: "Mix equal parts white vinegar and water. Wipe down salt stains gently with a soft cloth, then dry naturally and apply a rich leather conditioner.",
    fact: "Salt can dehydrate leather and create white, bubbly stains that permanently damage the leather's collagen fibers."
  },
  {
    title: "The 24-Hour Rest Rule",
    category: "General",
    tip: "Avoid wearing the same leather shoes two days in a row. Give them at least 24 hours to air out and release absorbed perspiration.",
    fact: "An average pair of feet produces about a cup of perspiration daily, which leather fibers absorb."
  },
  {
    title: "Conditioning Welts",
    category: "Leather",
    tip: "When conditioning Goodyear welted shoes, pay extra attention to the welt stitching. Keeping the welt leather supple prevents it from cracking during future resole operations.",
    fact: "A Goodyear welt is a strip of leather stitched around the lower edge of a shoe, allowing it to be resoled multiple times."
  }
];

export default function DailyShoeCareTip() {
  const [tip, setTip] = useState<ShoeCareTip | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchTip = async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/shoecare/daily-tip');
      if (!response.ok) {
        throw new Error('Failed to retrieve care tip');
      }
      const data = await response.json();
      if (data.success && data.tip) {
        setTip(data.tip);
        setIsFallback(!!data.fallback);
      } else {
        throw new Error(data.message || 'Failed to parse care tip');
      }
    } catch (err: any) {
      console.warn('Fetch failed, applying local handcrafted care tip:', err);
      // Gracefully fall back to local wisdom instead of showing an error state
      const dayIndex = new Date().getDate() % FALLBACK_TIPS.length;
      const index = isManual ? Math.floor(Math.random() * FALLBACK_TIPS.length) : dayIndex;
      setTip(FALLBACK_TIPS[index]);
      setIsFallback(true);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTip();
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getCategoryColor = (category: string) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('suede')) return 'bg-amber-100 text-amber-900 border-amber-200';
    if (cat.includes('leather')) return 'bg-orange-100 text-orange-900 border-orange-200';
    if (cat.includes('canvas')) return 'bg-[#F4EBE1] text-[#8C6239] border-[#E3D3C1]';
    if (cat.includes('storage')) return 'bg-teal-100 text-teal-900 border-teal-200';
    return 'bg-stone-100 text-stone-900 border-stone-200';
  };

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* Tooltip trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold uppercase text-[10px] tracking-wider transition-all shadow-sm cursor-pointer select-none ${
          isOpen
            ? 'bg-brand-dark text-white border-brand-dark'
            : 'bg-white hover:bg-brand-bg/60 text-brand-dark border-brand-border hover:border-brand-muted/30'
        }`}
        title="Show daily shoe care wisdom"
      >
        <Sparkles className={`w-3.5 h-3.5 text-brand-accent ${isOpen ? '' : 'animate-pulse'}`} />
        <span>Artisan Care Room</span>
      </button>

      {/* Popover content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-80 sm:w-[22rem] bg-white border border-brand-border rounded-[2rem] p-6 shadow-2xl z-50 overflow-hidden"
          >
            {/* Background Decorative Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none" />

            <div className="space-y-4 relative">
              {/* Popover Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-brand-dark text-brand-accent rounded-lg">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h4 className="font-display text-sm font-black text-brand-dark uppercase tracking-tight">Care Room Wisdom</h4>
                      {isFallback && (
                        <span className="text-[7px] bg-brand-bg text-brand-muted px-1.5 py-0.5 rounded-full font-black tracking-widest border border-brand-border/40 uppercase">
                          Bespoke
                        </span>
                      )}
                    </div>
                    <p className="text-[8px] font-black text-brand-muted uppercase tracking-[0.2em]">Gemini AI Daily Tip</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => fetchTip(true)}
                    disabled={loading || isRefreshing}
                    className="p-1.5 rounded-lg hover:bg-brand-bg transition-all text-brand-muted hover:text-brand-dark disabled:opacity-40 cursor-pointer"
                    title="Fetch a new care tip"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-accent' : ''}`} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-brand-bg transition-all text-brand-muted hover:text-brand-dark cursor-pointer"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Popover Body */}
              <div className="min-h-[120px] flex flex-col justify-center relative pt-1">
                {loading ? (
                  <div className="space-y-3 py-2">
                    <div className="h-3 bg-brand-bg rounded-md w-1/3 animate-pulse" />
                    <div className="h-4 bg-brand-bg rounded-md w-3/4 animate-pulse" />
                    <div className="space-y-1.5 pt-1">
                      <div className="h-2.5 bg-brand-bg rounded-md w-full animate-pulse" />
                      <div className="h-2.5 bg-brand-bg rounded-md w-5/6 animate-pulse" />
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center text-center py-4 space-y-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 opacity-80" />
                    <p className="text-[11px] font-bold text-brand-muted">{error}</p>
                    <button
                      onClick={() => fetchTip()}
                      className="px-3 py-1.5 bg-brand-dark text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md hover:bg-brand-dark/90 transition-all cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                ) : tip ? (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    {/* Category Badge & Title */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 border text-[7px] font-black rounded-full uppercase tracking-widest ${getCategoryColor(tip.category)}`}>
                        {tip.category}
                      </span>
                    </div>

                    <div>
                      <h5 className="font-display text-sm font-black text-brand-dark leading-tight tracking-tight">
                        {tip.title}
                      </h5>
                      <p className="text-[11px] text-brand-muted mt-1 leading-relaxed font-medium">
                        {tip.tip}
                      </p>
                    </div>

                    {/* Historical / Science Fact */}
                    <div className="pt-2 border-t border-brand-border/40 flex gap-2 items-start">
                      <BookOpen className="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[8px] font-black text-brand-dark uppercase tracking-widest block mb-0.5">Historical Fact</span>
                        <p className="text-[9px] text-brand-muted leading-relaxed italic font-medium">
                          "{tip.fact}"
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Popover Footer */}
              <div className="pt-2 border-t border-brand-border/40 flex items-center justify-between text-[7px] font-black text-brand-muted uppercase tracking-[0.2em] pointer-events-none select-none">
                <div className="flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-brand-olive" />
                  <span>Guild Standards</span>
                </div>
                <span>Since 1840</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
