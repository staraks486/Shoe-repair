import { useState } from 'react';
import { Plus, PlusCircle, Shield, Tag, Ruler } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import ShoeSizeChartModal from './ShoeSizeChartModal';

export default function FloatingActionMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end md:hidden">
        {isOpen && (
          <div className="flex flex-col items-end space-y-3 mb-4 animate-in slide-in-from-bottom-2 fade-in duration-200">
            <button 
              onClick={() => { setIsOpen(false); setIsSizeChartOpen(true); }}
              className="flex items-center space-x-3 bg-brand-dark text-white px-5 py-3 rounded-full shadow-xl border border-brand-accent/30 hover:bg-brand-olive transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent">Shoe Size Chart</span>
              <Ruler className="w-5 h-5 text-brand-accent" />
            </button>
            <button 
              onClick={() => { setIsOpen(false); navigate('/offers'); }}
              className="flex items-center space-x-3 bg-white text-brand-dark px-5 py-3 rounded-full shadow-xl border border-brand-border hover:bg-gray-50 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest">Offers & Discounts</span>
              <Tag className="w-5 h-5 text-brand-olive" />
            </button>
            <button 
              onClick={() => { setIsOpen(false); navigate('/new-repair?mode=step'); }}
              className="flex items-center space-x-3 bg-white text-brand-dark px-5 py-3 rounded-full shadow-xl border border-brand-border hover:bg-gray-50 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest">CW Care Form</span>
              <PlusCircle className="w-5 h-5 text-brand-olive" />
            </button>
            <button 
              onClick={() => { setIsOpen(false); navigate('/insurance?tab=add-cover'); }}
              className="flex items-center space-x-3 bg-white text-brand-dark px-5 py-3 rounded-full shadow-xl border border-brand-border hover:bg-gray-50 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest">CW Cover Form</span>
              <Shield className="w-5 h-5 text-brand-accent" />
            </button>
          </div>
        )}
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300",
            isOpen ? "bg-brand-muted rotate-45" : "bg-brand-dark hover:scale-105"
          )}
        >
          <Plus className="w-6 h-6" />
        </button>
        
        {isOpen && (
          <div 
            className="fixed inset-0 bg-brand-dark/20 backdrop-blur-sm z-[-1]" 
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      <ShoeSizeChartModal
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
      />
    </>
  );
}
