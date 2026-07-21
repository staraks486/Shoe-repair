import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Quote, HelpCircle, BookOpen, Smile } from 'lucide-react';

interface TriviaItem {
  type: 'quote' | 'fact' | 'knowledge' | 'joke';
  content: string;
  author?: string;
  category: string;
}

const TRIVIA_ITEMS: TriviaItem[] = [
  {
    type: 'joke',
    category: 'Cobbler Wit',
    content: "Why did the shoe repairman go to therapy? Because he needed some serious sole-searching!",
    author: "Workshop Humour"
  },
  {
    type: 'joke',
    category: 'Cobbler Wit',
    content: "Why do shoes make excellent detectives? Because they always stick together through thick and thin soles!",
    author: "Workshop Humour"
  },
  {
    type: 'joke',
    category: 'Cobbler Wit',
    content: "Why did the boot get sent to the principal's office? Because it wouldn't stop squeaking up in class!",
    author: "Workshop Humour"
  },
  {
    type: 'joke',
    category: 'Cobbler Wit',
    content: "How does a master cobbler greet their favorite client? 'Nice to meet you, my sole-mate!'",
    author: "Workshop Humour"
  },
  {
    type: 'quote',
    category: 'Inspiration',
    content: "“A shoe is not only a design, but it's a part of your body language, the way you walk. The way you're going to move is quite dictated by your shoes.”",
    author: "Christian Louboutin"
  },
  {
    type: 'quote',
    category: 'Craftsmanship',
    content: "“To wear dreams on one's feet is to begin to give a reality to one's dreams.”",
    author: "Roger Vivier"
  },
  {
    type: 'quote',
    category: 'Perspective',
    content: "“Shoes transform your body language and attitude. They lift you physically and emotionally.”",
    author: "Christian Louboutin"
  },
  {
    type: 'quote',
    category: 'Heritage',
    content: "“Good shoes take you good places.”",
    author: "Traditional Proverb"
  },
  {
    type: 'fact',
    category: 'History',
    content: "The world's oldest leather shoe, the Areni-1, is 5,500 years old. It was discovered intact in an Armenian cave, perfectly preserved by sheep manure and grass.",
    author: "Historical Discovery"
  },
  {
    type: 'fact',
    category: 'Linguistics',
    content: "The term 'sneaker' was coined in the late 1800s because the quiet rubber soles allowed the wearer to creep around without being heard.",
    author: "Etymology Trivia"
  },
  {
    type: 'fact',
    category: 'History',
    content: "Before the 19th century, shoes did not have distinct left and right feet. Both shoes in a pair were completely identical, known as 'straights'.",
    author: "Historical Fact"
  },
  {
    type: 'fact',
    category: 'Etymology',
    content: "Artisans of fine leather footwear are historically called 'Cordwainers' (from Cordoba, Spain), whereas 'Cobblers' traditionally only repaired old ones.",
    author: "Language Fact"
  },
  {
    type: 'knowledge',
    category: 'Leather Care',
    content: "Suede must never be treated with standard shoe cream or wax. Use a specialized crepe brush and steam to restore its natural nap.",
    author: "Artisan Care Tip"
  },
  {
    type: 'knowledge',
    category: 'Preservation',
    content: "Cedar shoe trees absorb moisture, prevent creasing, and deodorize. They are the single most essential tool in preserving premium footwear.",
    author: "Artisan Care Tip"
  },
  {
    type: 'knowledge',
    category: 'Preservation',
    content: "Never dry wet leather shoes near heaters or radiators. High heat dehydrates leather, causing deep cracks and irreversible structural shrinkage.",
    author: "Artisan Care Tip"
  },
  {
    type: 'knowledge',
    category: 'Wear Advice',
    content: "Give leather shoes at least 24 hours of rest between wears to allow internal perspiration and atmospheric humidity to dry completely.",
    author: "Artisan Care Tip"
  },
  {
    type: 'knowledge',
    category: 'Preservation',
    content: "A premium shoe horn is indispensable. It protects the structural integrity of the heel counter, preventing it from collapsing over time.",
    author: "Artisan Care Tip"
  }
];

export default function IntroBanner() {
  const { settings } = useAppStore();
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Set initial random trivia item on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * TRIVIA_ITEMS.length);
    setTriviaIndex(randomIndex);
  }, []);

  const handleNextTrivia = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      let nextIndex = Math.floor(Math.random() * TRIVIA_ITEMS.length);
      // Avoid showing the same one twice consecutively if possible
      if (nextIndex === triviaIndex && TRIVIA_ITEMS.length > 1) {
        nextIndex = (nextIndex + 1) % TRIVIA_ITEMS.length;
      }
      setTriviaIndex(nextIndex);
      setIsRefreshing(false);
    }, 300);
  };

  const currentTrivia = TRIVIA_ITEMS[triviaIndex] || TRIVIA_ITEMS[0];

  const getIcon = (type: string) => {
    switch (type) {
      case 'quote':
        return <Quote className="w-4 h-4 text-brand-accent" />;
      case 'fact':
        return <BookOpen className="w-4 h-4 text-brand-accent" />;
      case 'joke':
        return <Smile className="w-4 h-4 text-brand-accent" />;
      case 'knowledge':
      default:
        return <HelpCircle className="w-4 h-4 text-brand-accent" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-brand-dark text-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] mb-10 shadow-xl relative overflow-hidden group"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-brand-accent/20 transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-olive/20 rounded-full blur-[60px] -ml-24 -mb-24 group-hover:bg-brand-olive/30 transition-all duration-700" />
      
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
        {/* Left: Main welcome messaging */}
        <div className="lg:col-span-3 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-brand-accent/20 border border-brand-accent/30">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-accent">
                Artisan Workshop
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-brand-accent animate-pulse" />
          </div>
          
          <h2 className="font-display text-4xl md:text-5xl font-black mb-6 tracking-tight leading-none text-white">
            Welcome to <span className="text-brand-accent block mt-2">{settings.storeName}</span>
          </h2>
          
          <div className="space-y-4">
            <p className="text-sm md:text-base text-brand-bg/85 max-w-xl leading-relaxed font-medium">
              Protecting the heritage of fine footwear. Your dedicated hub for repair logistics, artisan CRM, and luxury inventory management.
            </p>
            <div className="h-1 w-20 bg-brand-accent rounded-full md:mx-0 mx-auto" />
          </div>
        </div>

        {/* Right: Interactive Shoe Fact / Knowledge box */}
        <div className="lg:col-span-2 w-full">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[190px] shadow-lg">
            {/* Header / Type Tag */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  {getIcon(currentTrivia.type)}
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-brand-accent">
                  {currentTrivia.category}
                </span>
              </div>
              <button 
                onClick={handleNextTrivia}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/5 hover:border-white/20 transition-all text-white/70 hover:text-white"
                title="Get another shoe fact"
              >
                <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-500 ${isRefreshing ? 'rotate-180 text-brand-accent' : ''}`} />
              </button>
            </div>

            {/* Fact content with transition */}
            <div className="flex-1 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={triviaIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs md:text-sm text-white/90 leading-relaxed font-medium italic">
                    {currentTrivia.content}
                  </p>
                  {currentTrivia.author && (
                    <p className="text-[10px] text-white/50 mt-2 font-mono uppercase tracking-wider text-right">
                      — {currentTrivia.author}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Corner Decorative background quote mark */}
            <div className="absolute -bottom-4 -right-2 text-white/[0.03] select-none text-8xl font-black font-display pointer-events-none">
              ”
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

