import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Lightbulb, RefreshCw, Footprints } from 'lucide-react';

export const SHOE_FACTS = [
  {
    id: 1,
    title: "Cordwainer vs. Cobbler",
    fact: "A 'cordwainer' historically crafted brand new luxury leather footwear, whereas a 'cobbler' specifically specialized in repairing existing worn shoes.",
    category: "Craft History"
  },
  {
    id: 2,
    title: "5,500 Years of Footwear",
    fact: "The oldest known leather shoe, the Areni-1 shoe found in Armenia, dates back over 5,500 years to 3500 BCE and was stuffed with grass for insulation.",
    category: "Ancient Origin"
  },
  {
    id: 3,
    title: "The Legendary Goodyear Welt",
    fact: "Goodyear welted shoes require over 200 manual steps. Because the upper is stitched to a welt strip rather than directly to the sole, they can be resoled indefinitely.",
    category: "Resoling Art"
  },
  {
    id: 4,
    title: "Why Cedar Shoe Trees Matter",
    fact: "Raw aromatic cedar shoe trees absorb moisture and perspiration from inside full-grain leather after a day of wear, preventing sole collapse and salt stains.",
    category: "Shoe Care"
  },
  {
    id: 5,
    title: "The Origin of 'Sneakers'",
    fact: "Rubber-soled shoes were named 'sneakers' in the late 1800s because their soft rubber soles allowed the wearer to walk silently without making a sound.",
    category: "Etymology"
  },
  {
    id: 6,
    title: "High Heels for Horseback",
    fact: "High heels were originally worn by Persian cavalry soldiers in the 10th century to prevent their feet from slipping out of stirrups while riding.",
    category: "History"
  },
  {
    id: 7,
    title: "Hydrating Full-Grain Leather",
    fact: "Fine leather is natural hide collagen. Applying nourishing mink oil or beeswax conditioner every 3 to 6 months preserves suppleness and prevents surface micro-cracks.",
    category: "Maintenance"
  },
  {
    id: 8,
    title: "Millions of Cumulative Pounds",
    fact: "The average human takes 8,000 to 10,000 steps daily. Your shoes absorb over 1,000 tons of cumulative pressure each single day!",
    category: "Biomechanics"
  },
  {
    id: 9,
    title: "The Mystery of Leather Patina",
    fact: "Patina is the unique, rich depth of color and lustre that untreated vegetable-tanned leather naturally develops as it ages and interacts with sunlight and oils.",
    category: "Leather Knowledge"
  },
  {
    id: 10,
    title: "Left vs. Right Shoes",
    fact: "Until the early 1800s, shoes were built straight and symmetrical with no distinction between left and right feet! Right and left lasts were introduced in Philadelphia in 1818.",
    category: "Fun Fact"
  }
];

interface ShoeFactsLoaderProps {
  fullScreen?: boolean;
  message?: string;
}

export default function ShoeFactsLoader({ fullScreen = false, message = 'Loading Cordwainers Studio...' }: ShoeFactsLoaderProps) {
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    // Pick random initial fact
    setFactIndex(Math.floor(Math.random() * SHOE_FACTS.length));

    // Cycle through facts every 5 seconds
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % SHOE_FACTS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentFact = SHOE_FACTS[factIndex];

  const handleNextFact = () => {
    setFactIndex((prev) => (prev + 1) % SHOE_FACTS.length);
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-6 text-center select-none ${
        fullScreen
          ? 'fixed inset-0 z-50 bg-[#FAF9F5] text-brand-dark'
          : 'w-full min-h-[380px] bg-[#FAF9F5]/80 backdrop-blur-sm rounded-3xl border border-brand-border/60 my-4'
      }`}
    >
      <div className="max-w-md w-full flex flex-col items-center justify-between min-h-[300px]">
        {/* Animated Brand Loader Badge */}
        <div className="flex flex-col items-center space-y-3 mb-6">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-brand-dark flex items-center justify-center shadow-lg border border-brand-accent/30">
              <Footprints className="w-7 h-7 text-brand-accent animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand-accent rounded-full flex items-center justify-center border-2 border-[#FAF9F5]">
              <Sparkles className="w-2.5 h-2.5 text-white animate-spin" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-accent block">
              {message}
            </span>
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <div className="w-2 h-2 rounded-full bg-brand-accent animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-brand-accent animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-brand-accent animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>

        {/* Shoe Fact Container */}
        <div className="w-full bg-white p-5 md:p-6 rounded-2xl border border-brand-border/80 shadow-sm relative overflow-hidden flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-brand-border/40 pb-2.5 mb-3">
            <div className="flex items-center gap-1.5 text-brand-olive font-black text-[10px] uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
              <span>Did You Know?</span>
            </div>
            <span className="bg-brand-bg text-brand-dark text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-brand-border/60">
              {currentFact.category}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentFact.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-2 py-1 text-left"
            >
              <h4 className="text-xs font-black text-brand-dark uppercase tracking-wide">
                {currentFact.title}
              </h4>
              <p className="text-xs text-brand-dark/80 font-medium leading-relaxed">
                "{currentFact.fact}"
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between pt-3 border-t border-brand-border/40 mt-3 text-[9px] text-brand-muted font-bold">
            <span>Fact {factIndex + 1} of {SHOE_FACTS.length}</span>
            <button
              type="button"
              onClick={handleNextFact}
              className="inline-flex items-center gap-1 text-brand-dark hover:text-brand-accent font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Next Fact
            </button>
          </div>
        </div>

        {/* Bottom Design Credit */}
        <div className="mt-6 pt-2 text-center">
          <p className="text-[10px] font-black text-brand-dark/80 uppercase tracking-[0.2em]">
            Design by Arvind Kumar Shukla
          </p>
          <span className="text-[8px] font-bold text-brand-muted/60 uppercase tracking-widest block mt-0.5">
            Cordwainers Studio • v2.4.0
          </span>
        </div>
      </div>
    </div>
  );
}
