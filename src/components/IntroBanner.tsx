import { useAppStore } from '../store';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import logo from '../assets/logo.svg';

export default function IntroBanner() {
  const { settings } = useAppStore();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-brand-dark text-white p-8 rounded-[2.5rem] mb-10 shadow-xl relative overflow-hidden group"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-brand-accent/20 transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-olive/20 rounded-full blur-[60px] -ml-24 -mb-24 group-hover:bg-brand-olive/30 transition-all duration-700" />
      
      <div className="relative z-10 flex flex-col items-center md:items-start">
        <div className="text-center md:text-left flex-1">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-brand-accent/20 border border-brand-accent/30">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-accent">
                Artisan Workshop
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-brand-accent animate-pulse" />
          </div>
          
          <h2 className="font-serif text-4xl md:text-6xl font-black mb-6 tracking-tight leading-none text-white">
            Welcome to <span className="text-brand-accent block mt-2">{settings.storeName}</span>
          </h2>
          
          <div className="space-y-4">
            <p className="text-base md:text-lg text-brand-bg/80 max-w-xl leading-relaxed font-medium">
              Protecting the heritage of fine footwear. Your dedicated hub for repair logistics, artisan CRM, and luxury inventory management.
            </p>
            <div className="h-1 w-20 bg-brand-accent rounded-full md:mx-0 mx-auto" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
