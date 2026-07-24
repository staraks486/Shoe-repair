import React, { useState, useMemo } from 'react';
import { 
  X, 
  Ruler, 
  Search, 
  Check, 
  Info, 
  Footprints, 
  ArrowRight, 
  Copy, 
  Sparkles,
  Award,
  Layers,
  SlidersHorizontal,
  HelpCircle
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SizeRow, 
  SHOE_SIZE_ALL_DATA, 
  FOOTWEAR_SYMBOLS,
  FootwearSymbol
} from '../data/shoeSizeChartData';

interface ShoeSizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSize?: (sizeLabel: string, category: 'MEN' | 'WOMEN' | 'KIDS', row: SizeRow) => void;
  initialCategory?: 'MEN' | 'WOMEN' | 'KIDS' | 'ALL';
}

export default function ShoeSizeChartModal({
  isOpen,
  onClose,
  onSelectSize,
  initialCategory = 'ALL'
}: ShoeSizeChartModalProps) {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'MEN' | 'WOMEN' | 'KIDS' | 'SYMBOLS' | 'GUIDE'>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [customCmInput, setCustomCmInput] = useState<number>(26.0);
  const [selectedRow, setSelectedRow] = useState<{ category: 'MEN' | 'WOMEN' | 'KIDS'; row: SizeRow } | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Auto-find closest size row across chosen or all categories based on CM input
  const closestMatchedRow = useMemo(() => {
    let bestMatch: { category: 'MEN' | 'WOMEN' | 'KIDS'; row: SizeRow; diff: number } | null = null;

    SHOE_SIZE_ALL_DATA.forEach(catData => {
      if (activeCategory !== 'ALL' && activeCategory !== 'SYMBOLS' && activeCategory !== 'GUIDE' && activeCategory !== catData.category) {
        return;
      }
      catData.sizes.forEach(row => {
        const diff = Math.abs(row.cm - customCmInput);
        if (!bestMatch || diff < bestMatch.diff) {
          bestMatch = { category: catData.category, row, diff };
        }
      });
    });

    return bestMatch ? { category: bestMatch.category, row: bestMatch.row } : null;
  }, [customCmInput, activeCategory]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(`Copied "${text}"`);
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  const handleSelect = (category: 'MEN' | 'WOMEN' | 'KIDS', row: SizeRow) => {
    setSelectedRow({ category, row });
    if (onSelectSize) {
      const label = `UK ${row.ukIndian} (${category}, ${row.cm} cm / Euro ${row.euro})`;
      onSelectSize(label, category, row);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-brand-dark/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-5xl bg-[#FAF8F5] border border-brand-accent/30 rounded-3xl shadow-2xl overflow-hidden text-brand-dark flex flex-col max-h-[92vh]"
        >
          {/* Header Banner - Craft Leather Box Design */}
          <div className="bg-gradient-to-r from-brand-dark via-[#2A2421] to-brand-dark text-white p-5 md:p-6 border-b border-brand-accent/30 flex-shrink-0 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
              <Ruler className="w-48 h-48 text-brand-accent" />
            </div>

            <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-brand-accent text-brand-dark font-mono text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md tracking-widest shadow-sm">
                    MADE IN INDIA
                  </span>
                  <span className="text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Official Footwear Standards
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight text-[#F5F3EC]">
                  Shoe Size Reference & Material Chart
                </h2>
                <p className="text-xs text-brand-muted/80 max-w-xl">
                  Precision conversion guide across CM Foot Length, Euro Sizes, US Sizes, and Indian/UK Standard Footwear Sizes.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all flex-shrink-0 border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Navigation Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-4 no-scrollbar border-t border-white/10 mt-4">
              {[
                { id: 'ALL', label: 'All Size Tables', icon: Ruler },
                { id: 'MEN', label: "Men's Sizes", icon: Footprints },
                { id: 'WOMEN', label: "Women's Sizes", icon: Footprints },
                { id: 'KIDS', label: "Kids' Sizes", icon: Footprints },
                { id: 'SYMBOLS', label: 'Material & Shoe Symbols', icon: Layers },
                { id: 'GUIDE', label: 'How to Measure', icon: HelpCircle },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id as any)}
                    className={clsx(
                      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                      isActive
                        ? "bg-brand-accent text-brand-dark border-brand-accent shadow-md font-extrabold"
                        : "bg-white/5 text-brand-muted hover:bg-white/15 hover:text-white border-white/10"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Main Body Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

            {/* Interactive Foot Length CM Calculator Banner */}
            {(activeCategory === 'ALL' || activeCategory === 'MEN' || activeCategory === 'WOMEN' || activeCategory === 'KIDS') && (
              <div className="bg-white border border-brand-border rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-brand-border/40 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-dark text-brand-accent flex items-center justify-center font-bold">
                      <SlidersHorizontal className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-display font-extrabold text-brand-dark uppercase tracking-wider">
                        Interactive Foot Length (CM) Size Calculator
                      </h3>
                      <p className="text-[11px] text-brand-muted">
                        Slide or enter foot length in CM to find exact matching size equivalents instantly.
                      </p>
                    </div>
                  </div>

                  {/* Search filter for tables */}
                  <div className="relative w-full md:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                    <input
                      type="text"
                      placeholder="Search CM / Euro / UK..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-brand-bg/60 border border-brand-border/80 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Slider & CM Number Input */}
                  <div className="md:col-span-6 space-y-2.5 bg-brand-bg/40 p-3.5 rounded-xl border border-brand-border/40">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                        Foot Length in CM:
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="14.0"
                          max="30.0"
                          value={customCmInput}
                          onChange={(e) => setCustomCmInput(parseFloat(e.target.value) || 24.0)}
                          className="w-20 px-2 py-1 text-right font-mono font-bold text-sm bg-white border border-brand-border rounded-lg text-brand-dark focus:ring-1 focus:ring-brand-dark"
                        />
                        <span className="text-xs font-bold text-brand-muted">cm</span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min="14.0"
                      max="29.3"
                      step="0.1"
                      value={customCmInput}
                      onChange={(e) => setCustomCmInput(parseFloat(e.target.value))}
                      className="w-full accent-brand-dark cursor-pointer h-2 bg-brand-border/60 rounded-lg"
                    />

                    <div className="flex justify-between text-[9px] font-mono text-brand-muted">
                      <span>14.0 cm (Kids)</span>
                      <span>22.0 cm (Women)</span>
                      <span>29.3 cm (Men)</span>
                    </div>
                  </div>

                  {/* Calculated Match Output Box */}
                  <div className="md:col-span-6 bg-brand-dark text-white rounded-2xl p-3.5 border border-brand-accent/30 flex items-center justify-between gap-3 shadow-md">
                    {closestMatchedRow ? (
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-brand-accent text-brand-dark text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded">
                              {closestMatchedRow.category} MATCH
                            </span>
                            <span className="text-emerald-300 font-mono text-[10px]">
                              {closestMatchedRow.row.cm} CM
                            </span>
                          </div>
                          <div className="flex items-baseline gap-3 pt-0.5">
                            <div>
                              <span className="text-[9px] uppercase text-brand-muted block font-bold">INDIAN / UK</span>
                              <span className="text-lg font-mono font-black text-white">UK {closestMatchedRow.row.ukIndian}</span>
                            </div>
                            <div className="border-l border-white/20 pl-3">
                              <span className="text-[9px] uppercase text-brand-muted block font-bold">EURO</span>
                              <span className="text-lg font-mono font-black text-amber-300">{closestMatchedRow.row.euro}</span>
                            </div>
                            <div className="border-l border-white/20 pl-3">
                              <span className="text-[9px] uppercase text-brand-muted block font-bold">US</span>
                              <span className="text-lg font-mono font-black text-emerald-400">{closestMatchedRow.row.us}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelect(closestMatchedRow!.category, closestMatchedRow!.row)}
                          className="px-3.5 py-2.5 rounded-xl bg-brand-accent text-brand-dark hover:bg-amber-300 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 flex-shrink-0 shadow-lg"
                        >
                          <span>{onSelectSize ? 'Select' : 'Apply'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="text-xs text-brand-muted italic">No size matched</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Size Reference Tables View */}
            {(activeCategory === 'ALL' || activeCategory === 'MEN' || activeCategory === 'WOMEN' || activeCategory === 'KIDS') && (
              <div className="space-y-8">
                {SHOE_SIZE_ALL_DATA.filter(cat => activeCategory === 'ALL' || activeCategory === cat.category).map(catData => {
                  const filteredSizes = catData.sizes.filter(s => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      s.cm.toString().includes(query) ||
                      s.euro.toString().includes(query) ||
                      s.us.toString().includes(query) ||
                      s.ukIndian.toString().includes(query)
                    );
                  });

                  return (
                    <div key={catData.category} className="bg-white rounded-2xl md:rounded-3xl border border-brand-border shadow-sm overflow-hidden">
                      {/* Table Section Header */}
                      <div className="bg-brand-bg/70 px-5 py-3.5 border-b border-brand-border flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full bg-brand-dark" />
                          <h3 className="text-base font-display font-extrabold text-brand-dark tracking-tight">
                            {catData.label}
                          </h3>
                          <span className="text-xs font-mono bg-brand-dark/10 text-brand-dark font-bold px-2.5 py-0.5 rounded-full">
                            {catData.category}
                          </span>
                        </div>
                        <span className="text-xs text-brand-muted font-medium">
                          {catData.description}
                        </span>
                      </div>

                      {/* Rendered Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-brand-dark text-white text-[10px] font-mono font-bold uppercase tracking-widest border-b border-brand-dark">
                              <th className="py-3 px-4 sm:px-6">CM Size</th>
                              <th className="py-3 px-4 sm:px-6 text-amber-300">EURO Size</th>
                              <th className="py-3 px-4 sm:px-6 text-emerald-300">US Size</th>
                              <th className="py-3 px-4 sm:px-6 text-brand-accent">INDIAN / UK Size</th>
                              <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-border/60 text-xs font-mono">
                            {filteredSizes.map((row, idx) => {
                              const isCalculatedMatch = closestMatchedRow?.category === catData.category && closestMatchedRow.row.cm === row.cm;
                              const isUserSelected = selectedRow?.category === catData.category && selectedRow.row.cm === row.cm;

                              return (
                                <tr
                                  key={idx}
                                  className={clsx(
                                    "transition-colors hover:bg-brand-bg/50",
                                    isUserSelected
                                      ? "bg-brand-olive/15 font-bold"
                                      : isCalculatedMatch
                                        ? "bg-amber-50 font-bold"
                                        : idx % 2 === 0 ? "bg-white" : "bg-brand-bg/20"
                                  )}
                                >
                                  <td className="py-2.5 px-4 sm:px-6 font-bold text-brand-dark">
                                    <div className="flex items-center gap-2">
                                      <span>{row.cm.toFixed(1)} cm</span>
                                      {isCalculatedMatch && (
                                        <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-sans font-bold">
                                          Match
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-4 sm:px-6 text-brand-dark font-extrabold">
                                    Euro {row.euro}
                                  </td>
                                  <td className="py-2.5 px-4 sm:px-6 text-brand-dark">
                                    US {row.us}
                                  </td>
                                  <td className="py-2.5 px-4 sm:px-6 font-black text-brand-dark">
                                    UK / India {row.ukIndian}
                                  </td>
                                  <td className="py-2.5 px-4 sm:px-6 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => handleCopy(`UK ${row.ukIndian} (${catData.category}, ${row.cm}cm, Euro ${row.euro})`)}
                                        className="p-1.5 rounded-lg bg-brand-bg hover:bg-brand-border text-brand-dark transition-colors"
                                        title="Copy size info"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleSelect(catData.category, row)}
                                        className={clsx(
                                          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                          isUserSelected
                                            ? "bg-emerald-600 text-white"
                                            : "bg-brand-dark text-white hover:bg-brand-olive"
                                        )}
                                      >
                                        {isUserSelected ? 'Selected' : 'Select'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Material & Shoe Symbol Legend Section */}
            {(activeCategory === 'ALL' || activeCategory === 'SYMBOLS') && (
              <div className="bg-white rounded-2xl md:rounded-3xl border border-brand-border p-5 md:p-6 shadow-sm space-y-6">
                <div className="border-b border-brand-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-brand-olive" />
                    <h3 className="text-base font-display font-extrabold text-brand-dark">
                      Footwear Material & Construction Symbol Legend
                    </h3>
                  </div>
                  <p className="text-xs text-brand-muted mt-1">
                    Standard pictograms defined on Made in India footwear labels representing materials (upper, lining, sole) and shoe components.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {FOOTWEAR_SYMBOLS.map((symbol) => (
                    <div
                      key={symbol.name}
                      className="bg-brand-bg/30 border border-brand-border/60 rounded-2xl p-4 flex items-start gap-3.5 hover:border-brand-dark transition-all"
                    >
                      <div className="w-12 h-12 rounded-xl bg-brand-dark text-white flex items-center justify-center flex-shrink-0 p-2 shadow-sm">
                        <RenderSymbolIcon type={symbol.svgType} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-display font-extrabold text-brand-dark">
                            {symbol.name}
                          </h4>
                          <span className={clsx(
                            "text-[8px] font-mono px-2 py-0.5 rounded uppercase font-bold",
                            symbol.type === 'Material' ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                          )}>
                            {symbol.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-brand-muted leading-tight">
                          {symbol.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How to Measure Feet Guide Section */}
            {(activeCategory === 'ALL' || activeCategory === 'GUIDE') && (
              <div className="bg-[#FAF6F0] rounded-2xl md:rounded-3xl border border-brand-accent/40 p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-brand-border/40 pb-3">
                  <Ruler className="w-5 h-5 text-brand-dark" />
                  <h3 className="text-base font-display font-extrabold text-brand-dark">
                    How to Measure Foot Length in CM Accurately
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-brand-border/50 space-y-1">
                    <span className="w-6 h-6 rounded-full bg-brand-dark text-white font-mono font-bold text-xs flex items-center justify-center">1</span>
                    <h5 className="font-bold text-brand-dark pt-1">Step 1: Stand on Paper</h5>
                    <p className="text-[11px] text-brand-muted">Place a plain piece of paper on a flat floor against a wall. Stand upright on it with socks on.</p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-brand-border/50 space-y-1">
                    <span className="w-6 h-6 rounded-full bg-brand-dark text-white font-mono font-bold text-xs flex items-center justify-center">2</span>
                    <h5 className="font-bold text-brand-dark pt-1">Step 2: Mark Heel & Toe</h5>
                    <p className="text-[11px] text-brand-muted">Use a pencil held vertically to mark the longest point of your toe and the back of your heel.</p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-brand-border/50 space-y-1">
                    <span className="w-6 h-6 rounded-full bg-brand-dark text-white font-mono font-bold text-xs flex items-center justify-center">3</span>
                    <h5 className="font-bold text-brand-dark pt-1">Step 3: Measure Distance</h5>
                    <p className="text-[11px] text-brand-muted">Measure the straight distance between the two points in centimeters (CM) using a ruler.</p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-brand-border/50 space-y-1">
                    <span className="w-6 h-6 rounded-full bg-brand-dark text-white font-mono font-bold text-xs flex items-center justify-center">4</span>
                    <h5 className="font-bold text-brand-dark pt-1">Step 4: Check Conversion</h5>
                    <p className="text-[11px] text-brand-muted">Compare your CM measurement on the table above to find your exact Indian / UK, Euro, or US size.</p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-brand-bg border-t border-brand-border/60 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs font-mono text-brand-muted">
              <Info className="w-4 h-4 text-brand-dark" />
              <span>Standard Indian Footwear Sizing Chart (BIS / ISO aligned)</span>
            </div>

            <div className="flex items-center gap-2">
              {copiedNotification && (
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg animate-pulse">
                  {copiedNotification}
                </span>
              )}
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-brand-dark text-white font-bold text-xs hover:bg-brand-olive transition-colors"
              >
                Close Reference Chart
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Custom SVG Footwear Symbol Pictograms matching the image
function RenderSymbolIcon({ type }: { type: FootwearSymbol['svgType'] }) {
  switch (type) {
    case 'hide':
      // Animal Hide / Genuine Leather Symbol
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-brand-accent">
          <path d="M7 3 C 9 3, 9 5, 12 5 C 15 5, 15 3, 17 3 C 20 5, 20 8, 19 12 C 21 16, 19 20, 16 21 C 13 20, 11 20, 8 21 C 5 20, 3 16, 5 12 C 4 8, 4 5, 7 3 Z" />
        </svg>
      );
    case 'coatedHide':
      // Coated Leather Hide Symbol with interior pattern
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7 text-brand-accent">
          <path d="M7 3 C 9 3, 9 5, 12 5 C 15 5, 15 3, 17 3 C 20 5, 20 8, 19 12 C 21 16, 19 20, 16 21 C 13 20, 11 20, 8 21 C 5 20, 3 16, 5 12 C 4 8, 4 5, 7 3 Z" />
          <path d="M12 9 L15 12 L12 15 L9 12 Z" fill="currentColor" fillOpacity="0.3" />
        </svg>
      );
    case 'textile':
      // Textile Woven Grid Pattern
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7 text-amber-300">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
        </svg>
      );
    case 'diamond':
      // Other Materials Diamond Outline
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-emerald-300">
          <polygon points="12,3 21,12 12,21 3,12" />
        </svg>
      );
    case 'lining':
      // Shoe Lining Diagram
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7 text-white">
          <path d="M3 16 C 3 10, 8 7, 12 7 C 16 7, 19 10, 21 13 L21 18 L3 18 Z" />
          <path d="M6 15 C 8 11, 12 10, 16 11" strokeDasharray="2 2" stroke="currentColor" />
        </svg>
      );
    case 'upper':
      // Shoe Upper Diagram
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-amber-300">
          <path d="M2 17 C 3 11, 8 8, 13 8 C 17 8, 19 10, 22 14 L22 17 Z" fill="currentColor" fillOpacity="0.2" />
          <path d="M2 17 C 3 11, 8 8, 13 8 C 17 8, 19 10, 22 14 L22 17 Z" />
        </svg>
      );
    case 'sole':
      // Shoe Sole Diagram
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-emerald-400">
          <path d="M2 16 C 5 16, 8 18, 12 18 C 17 18, 20 16, 22 16 L22 19 C 18 21, 12 21, 2 19 Z" fill="currentColor" fillOpacity="0.4" />
        </svg>
      );
    default:
      return <Footprints className="w-6 h-6 text-white" />;
  }
}
