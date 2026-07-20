import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import DeleteConfirmationButton from '../components/DeleteConfirmationButton';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PackagePlus, 
  AlertTriangle, 
  Trash2, 
  Search, 
  Sparkles, 
  Barcode, 
  X, 
  Copy, 
  Check, 
  Info,
  Layers,
  CircleDollarSign,
  Camera
} from 'lucide-react';
import clsx from 'clsx';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import SwipeToDelete from '../components/SwipeToDelete';
import PageHeader from '../components/PageHeader';

// Dynamic, visual barcode rendering component using SVGs and geometric rects
function VisualBarcode({ value }: { value: string }) {
  // Generate a deterministic visual bar sequence based on character codes
  const bars: number[] = [];
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const b1 = (code % 3) + 1;
    const s1 = ((code >> 1) % 3) + 1;
    const b2 = ((code >> 2) % 3) + 1;
    bars.push(b1, s1, b2, 1); 
  }

  let currentX = 15;
  const height = 64;
  return (
    <div className="flex flex-col items-center select-none">
      <svg width="220" height={height} className="text-brand-dark overflow-visible">
        <g fill="currentColor">
          {/* Start guard bars */}
          <rect x={5} y={0} width={2} height={height} />
          <rect x={9} y={0} width={2} height={height} />
          
          {bars.map((width, idx) => {
            const x = currentX;
            currentX += width * 1.5;
            // Draw alternating stripes
            if (idx % 2 === 0) {
              return (
                <rect
                  key={idx}
                  x={x}
                  y={0}
                  width={width * 1.5}
                  height={height}
                />
              );
            }
            return null;
          })}

          {/* End guard bars */}
          <rect x={currentX + 2} y={0} width={2} height={height} />
          <rect x={currentX + 6} y={0} width={2} height={height} />
        </g>
      </svg>
      <div className="mt-3 font-mono text-xs tracking-[0.3em] text-brand-dark font-bold">
        {value}
      </div>
    </div>
  );
}

export default function Inventory() {
  const { inventory, addInventoryItem, deleteInventoryItem, updateInventoryItem } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'current' | 'sold' | 'add-item'>('current');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Soles',
    quantity: 0,
    unit: 'pcs',
    minThreshold: 10,
    price: 0,
    barcode: ''
  });

  // Generates a mock barcode number in standard retail formats (e.g. 890 for India/custom boutique)
  const generateRandomBarcode = () => {
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
    return `890${randomDigits}`;
  };

  // Populate default barcode when entering add-item tab
  useEffect(() => {
    if (activeTab === 'add-item' && !formData.barcode) {
      setFormData(prev => ({ ...prev, barcode: generateRandomBarcode() }));
    }
  }, [activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addInventoryItem(formData);
    setActiveTab('current');
    setFormData({ 
      name: '', 
      category: 'Soles', 
      quantity: 0, 
      unit: 'pcs', 
      minThreshold: 10, 
      price: 0, 
      barcode: '' 
    });
  };

  // Deterministically resolves barcode (falls back for existing items that do not have one saved)
  const getItemBarcode = (item: any) => {
    if (item.barcode) return item.barcode;
    const hash = item.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const paddedHash = String(hash * 12345).padStart(9, '0').slice(-9);
    return `890${paddedHash}`;
  };

  const handleCopyBarcode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredInventory = inventory.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.category.toLowerCase().includes(search.toLowerCase()) ||
    (i.barcode && i.barcode.toLowerCase().includes(search.toLowerCase()))
  );

  const currentStock = filteredInventory.filter(i => i.quantity > 0);
  const soldItems = filteredInventory.filter(i => i.quantity <= 0);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader 
        title="Inventory" 
        subtitle="Workshop Supplies & Stock" 
      >
        <div className="flex bg-white p-1 rounded-2xl border border-brand-border shadow-sm overflow-x-auto scrollbar-hide max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('current')}
            className={clsx(
              "px-4 sm:px-8 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full transition-all whitespace-nowrap",
              activeTab === 'current'
                ? "bg-brand-dark text-white shadow-lg" 
                : "text-brand-muted hover:text-brand-dark"
            )}
          >
            Current Stock ({currentStock.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sold')}
            className={clsx(
              "px-4 sm:px-8 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full transition-all whitespace-nowrap",
              activeTab === 'sold'
                ? "bg-brand-dark text-white shadow-lg" 
                : "text-brand-muted hover:text-brand-dark"
            )}
          >
            Sold Items ({soldItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('add-item')}
            className={clsx(
              "px-4 sm:px-8 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full transition-all whitespace-nowrap",
              activeTab === 'add-item'
                ? "bg-brand-dark text-white shadow-lg" 
                : "text-brand-muted hover:text-brand-dark"
            )}
          >
            Add Supply
          </button>
        </div>
      </PageHeader>

      {/* Stock Views */}
      {(activeTab === 'current' || activeTab === 'sold') && (
        <div className="space-y-6">
          <div className="premium-card p-6 sm:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-border pb-6 mb-6">
              <div className="space-y-1">
                <h3 className="font-display text-2xl font-black text-brand-dark">
                  {activeTab === 'current' ? 'Current Stock' : 'Sold Items Archive'}
                </h3>
                <p className="label-xs">Supply Management</p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
                <input
                  type="text"
                  placeholder="Filter supplies..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-brand-bg border-none rounded-full text-xs font-bold shadow-inner focus:ring-0"
                />
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-border">
                <thead>
                  <tr className="bg-brand-bg">
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Item Name</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Category</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Barcode</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">In Stock</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Price</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Status</th>
                    <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <motion.tbody 
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="bg-white divide-y divide-brand-border"
                >
                  <AnimatePresence>
                    {(activeTab === 'current' ? currentStock : soldItems).map((item) => {
                      const isLow = item.quantity <= item.minThreshold;
                      const resolvedBarcode = getItemBarcode(item);
                      return (
                        <motion.tr 
                          variants={itemAnim}
                          layout
                          exit={{ opacity: 0, x: -20 }}
                          key={item.id} 
                          className={clsx(
                            "cursor-pointer transition-colors group",
                            isLow ? "bg-red-50/30 hover:bg-red-50/60" : "hover:bg-brand-bg/40"
                          )}
                          onClick={() => setSelectedItem(item)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand-dark group-hover:text-brand-olive transition-colors">
                            <div className="flex items-center gap-2">
                              <span>{item.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-muted font-medium">{item.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-brand-muted">
                            <div className="flex items-center gap-1.5 text-xs text-brand-dark">
                              <Barcode className="w-4 h-4 text-brand-muted" />
                              <span>{resolvedBarcode}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-dark" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                value={item.quantity ?? 0} 
                                onChange={(e) => updateInventoryItem(item.id, { quantity: Number(e.target.value) })}
                                className="w-16 text-sm border border-brand-border rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-brand-dark bg-brand-bg text-center font-medium"
                              /> 
                              <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">{item.unit || 'pcs'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-dark" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-brand-muted font-bold">₹</span>
                              <input 
                                type="number" 
                                value={item.price ?? 0} 
                                onChange={(e) => updateInventoryItem(item.id, { price: Number(e.target.value) })}
                                className="w-20 text-sm border border-brand-border rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-brand-dark bg-brand-bg text-center font-medium"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border bg-red-50 text-red-700 border-red-200">
                                <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border bg-green-50 text-green-700 border-green-200">
                                Healthy
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm" onClick={e => e.stopPropagation()}>
                            <DeleteConfirmationButton 
                              onDelete={() => deleteInventoryItem(item.id)} 
                              itemName={item.name}
                              className="p-1"
                            />
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </motion.tbody>
              </table>
            </div>

            {/* Mobile Swipeable List */}
            <div className="lg:hidden space-y-4">
              <div className="px-4 py-2 bg-brand-bg/30 rounded-xl border border-brand-border/40 mb-2">
                <p className="text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] text-center italic">
                  Swipe left on a card to delete item
                </p>
              </div>
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                <AnimatePresence>
                  {(activeTab === 'current' ? currentStock : soldItems).map((item) => {
                    const isLow = item.quantity <= item.minThreshold;
                    const resolvedBarcode = getItemBarcode(item);
                    return (
                      <motion.div
                        key={item.id}
                        variants={itemAnim}
                        layout
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <SwipeToDelete onDelete={() => deleteInventoryItem(item.id)}>
                          <div 
                            className={clsx(
                              "p-5 border rounded-2xl bg-white shadow-sm space-y-4",
                              isLow ? "border-red-200 bg-red-50/10" : "border-brand-border"
                            )}
                            onClick={() => setSelectedItem(item)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center text-brand-olive font-display font-black text-sm">
                                  {item.category.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-brand-dark font-display">{item.name}</div>
                                  <div className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">{item.category}</div>
                                </div>
                              </div>
                              <div>
                                {isLow ? (
                                  <AlertTriangle className="w-4 h-4 text-red-500" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between gap-4 pt-4 border-t border-brand-border/60">
                              <div className="space-y-1">
                                <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest">In Stock</p>
                                <p className="text-xs font-bold text-brand-dark">
                                  {item.quantity} <span className="text-[10px] font-medium text-brand-muted">{item.unit || 'pcs'}</span>
                                </p>
                              </div>
                              <div className="space-y-1 text-right">
                                <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Unit Price</p>
                                <p className="text-xs font-bold text-brand-dark">₹{item.price || 0}</p>
                              </div>
                              <div className="space-y-1 text-right">
                                <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Barcode</p>
                                <p className="text-[10px] font-mono font-bold text-brand-muted">{resolvedBarcode.slice(-4)}</p>
                              </div>
                            </div>
                          </div>
                        </SwipeToDelete>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </div>

            {(activeTab === 'current' ? currentStock : soldItems).length === 0 && (
              <div className="text-center py-12 border border-dashed border-brand-border rounded-xl bg-brand-bg/10">
                <p className="text-sm text-brand-muted italic">
                  {search ? 'No supply records found matching your query.' : 'No supplies found in this category.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Item Tab */}
      {activeTab === 'add-item' && (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
          <form onSubmit={handleSubmit} className="premium-card overflow-hidden">
            <div className="p-6 sm:p-10 md:p-16 space-y-8 sm:space-y-10">
              <div className="text-center space-y-2 mb-6 sm:mb-10">
                <h3 className="font-display text-2xl sm:text-3xl font-black text-brand-dark">Register Supply</h3>
                <p className="label-xs">Resource Acquisition</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                <div className="md:col-span-2 space-y-2">
                  <label className="label-xs ml-1">Item Nomenclature</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-5 py-3 sm:px-6 sm:py-4 bg-brand-bg border-none rounded-[15px] sm:rounded-[20px] text-base sm:text-lg font-bold focus:ring-0" 
                    placeholder="Vibram Eton..." 
                  />
                </div>

                <div className="space-y-2">
                  <label className="label-xs ml-1">Category</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-5 py-3 sm:px-6 sm:py-4 bg-brand-bg border-none rounded-[15px] sm:rounded-[20px] text-xs font-bold focus:ring-0"
                  >
                    <option>Soles</option>
                    <option>Heels</option>
                    <option>Leather</option>
                    <option>Thread</option>
                    <option>Lasts</option>
                    <option>Hardware</option>
                    <option>Polish</option>
                    <option>Laces</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="md:col-span-1 space-y-2">
                  <label className="label-xs ml-1">Barcode Registry</label>
                  <div className="flex gap-4">
                    <input 
                      required
                      type="text" 
                      value={formData.barcode} 
                      onChange={e => setFormData({...formData, barcode: e.target.value})}
                      className="flex-1 px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-mono font-bold focus:ring-0" 
                      placeholder="890..." 
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, barcode: generateRandomBarcode()})}
                      className="px-6 py-4 bg-white border border-brand-border rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-bg transition-all"
                    >
                      Gen
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="label-xs ml-1">Initial Vol.</label>
                  <input 
                    required 
                    type="number" 
                    value={formData.quantity} 
                    onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                    className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-bold focus:ring-0" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="label-xs ml-1">Unit Valuation (₹)</label>
                  <input 
                    required 
                    type="number" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-bold focus:ring-0" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="label-xs ml-1">Alert Threshold</label>
                  <input 
                    required 
                    type="number" 
                    value={formData.minThreshold} 
                    onChange={e => setFormData({...formData, minThreshold: Number(e.target.value)})}
                    className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-bold focus:ring-0" 
                  />
                </div>
              </div>
            </div>

            <div className="bg-brand-bg p-6 sm:p-8 md:p-12 flex items-center justify-center sm:justify-end border-t border-brand-border">
              <button 
                type="submit" 
                className="w-full sm:w-auto px-12 py-4 bg-brand-dark text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent transition-all shadow-lg active:scale-95"
              >
                Commit Registry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Selected Item Detail & Barcode Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-brand-border rounded-xl p-8 shadow-2xl max-w-md w-full relative overflow-hidden"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 text-brand-muted hover:text-brand-dark p-1.5 rounded-full hover:bg-brand-bg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

            {/* Category */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-brand-border bg-brand-bg text-brand-olive mb-4">
              <Layers className="w-3 h-3" /> {selectedItem.category}
            </div>

            {/* Item Name */}
            <h3 className="font-display text-2xl font-bold text-brand-dark mb-1">
              {selectedItem.name}
            </h3>
            <p className="text-xs text-brand-muted mb-6 uppercase tracking-widest font-semibold">
              Premium Studio Resource
            </p>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 border-y border-brand-border py-4">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-1">In Stock</span>
                <span className="text-base font-bold text-brand-dark">
                  {selectedItem.quantity} <span className="text-xs font-normal text-brand-muted">{selectedItem.unit || 'pcs'}</span>
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-1">Unit Price</span>
                <span className="text-base font-bold text-brand-dark">
                  ₹{selectedItem.price || 0}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-1">Min Threshold</span>
                <span className="text-sm font-semibold text-brand-dark">
                  {selectedItem.minThreshold} {selectedItem.unit || 'pcs'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-1">Stock Status</span>
                {selectedItem.quantity <= selectedItem.minThreshold ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                    <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
                    Healthy
                  </span>
                )}
              </div>
            </div>

            {/* Barcode Display Container */}
            <div className="bg-brand-bg p-6 rounded-xl border border-brand-border flex flex-col items-center justify-center relative group/barcode">
              <VisualBarcode value={getItemBarcode(selectedItem)} />
              
              <button
                onClick={() => handleCopyBarcode(getItemBarcode(selectedItem))}
                className="absolute top-3 right-3 p-1.5 rounded-md bg-white border border-brand-border shadow-sm text-brand-muted hover:text-brand-dark transition-colors flex items-center justify-center"
                title="Copy Barcode Number"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleCopyBarcode(getItemBarcode(selectedItem))}
                  className="flex-1 flex items-center justify-center gap-2 border border-brand-border hover:bg-brand-bg text-brand-dark text-xs font-bold uppercase tracking-widest py-3 rounded transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 bg-brand-dark text-white text-xs font-bold uppercase tracking-widest py-3 rounded hover:bg-brand-muted transition-colors text-center"
                >
                  Close View
                </button>
              </div>
              <DeleteConfirmationButton 
                onDelete={() => {
                  deleteInventoryItem(selectedItem.id);
                  setSelectedItem(null);
                }}
                itemName={selectedItem.name}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold uppercase tracking-widest py-2.5 rounded transition-colors mt-2 border border-red-200"
                iconClassName="w-4 h-4"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        inventory={inventory}
        onUpdateStock={(id, quantity) => updateInventoryItem(id, { quantity })}
        onAddNewSupply={(barcode) => {
          setActiveTab('add-item');
          setFormData(prev => ({ ...prev, barcode }));
        }}
      />
    </div>
  );
}
