import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
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
  CircleDollarSign
} from 'lucide-react';
import clsx from 'clsx';

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
  
  const [activeTab, setActiveTab] = useState<'history' | 'add-item'>('history');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [copied, setCopied] = useState(false);

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
    setActiveTab('history');
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Toggle View Segmented Control */}
      <div className="flex justify-start">
        <div className="flex bg-brand-bg p-1 rounded-lg border border-brand-border shadow-sm">
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
            }}
            className={clsx(
              "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1.5",
              activeTab === 'history'
                ? "bg-white text-brand-dark shadow-sm border border-brand-border/40" 
                : "text-brand-muted hover:text-brand-dark"
            )}
          >
            <span>📜 Care History ({inventory.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('add-item');
            }}
            className={clsx(
              "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1.5",
              activeTab === 'add-item'
                ? "bg-white text-brand-dark shadow-sm border border-brand-border/40" 
                : "text-brand-muted hover:text-brand-dark"
            )}
          >
            <span>✨ Add Item</span>
          </button>
        </div>
      </div>

      {/* Care History (Stock List) Tab */}
      {activeTab === 'history' && (
        <div className="bg-white border border-brand-border rounded-xl shadow-xl overflow-hidden p-6 md:p-8 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-brand-border pb-6">
            <div>
              <h3 className="font-serif text-2xl font-bold text-brand-dark">Care History</h3>
              <p className="text-xs text-brand-muted uppercase tracking-wider mt-1">Track and manage shoe add-ons and supplies. Click an item to view details and generate its barcode.</p>
            </div>
            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-brand-muted" />
              </div>
              <input
                type="text"
                placeholder="Search supplies or barcode..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-brand-border rounded-md text-sm placeholder-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-dark focus:border-brand-dark bg-brand-bg transition-colors"
              />
            </div>
          </div>

          {filteredInventory.length > 0 ? (
            <div className="overflow-x-auto">
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
                <tbody className="bg-white divide-y divide-brand-border">
                  {filteredInventory.map((item) => {
                    const isLow = item.quantity <= item.minThreshold;
                    const resolvedBarcode = getItemBarcode(item);
                    return (
                      <tr 
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
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-brand-bg text-brand-muted text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                              Details
                            </span>
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
                              value={item.quantity} 
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
                              value={item.price} 
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
                          <button 
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
                                deleteInventoryItem(item.id);
                              }
                            }} 
                            className="text-brand-muted hover:text-red-500 transition-colors p-1"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-brand-border rounded-xl bg-brand-bg/10">
              <p className="text-sm text-brand-muted italic">
                {search ? 'No supply records found matching your query.' : 'No supplies registered in inventory yet.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Item Tab */}
      {activeTab === 'add-item' && (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
          <form onSubmit={handleSubmit} className="bg-white border border-brand-border rounded-xl shadow-xl overflow-hidden">
            <div className="p-8 md:p-12 space-y-8">
              <div className="text-center mb-8">
                <h3 className="font-serif text-2xl font-bold text-brand-dark mb-2">Register Premium Supply</h3>
                <p className="text-sm text-brand-muted">Add luxury leather, specialty soles, or bespoke hardware to the studio registry.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-brand-dark mb-2 uppercase tracking-widest">Item Name</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full border-b-2 border-brand-border bg-transparent p-3 text-lg focus:outline-none focus:border-brand-dark transition-colors placeholder-brand-muted/30" 
                    placeholder="e.g. Vibram Eton Rubber Sole" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-2 uppercase tracking-widest">Category</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full border-b-2 border-brand-border bg-transparent p-3 text-lg focus:outline-none focus:border-brand-dark transition-colors appearance-none"
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

                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-brand-dark mb-2 uppercase tracking-widest">Barcode Number</label>
                  <div className="flex gap-2">
                    <input 
                      required
                      type="text" 
                      value={formData.barcode} 
                      onChange={e => setFormData({...formData, barcode: e.target.value})}
                      className="flex-1 border-b-2 border-brand-border bg-transparent p-3 text-lg focus:outline-none focus:border-brand-dark transition-colors font-mono" 
                      placeholder="e.g. 890123456789" 
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, barcode: generateRandomBarcode()})}
                      className="px-4 py-2 bg-brand-bg border border-brand-border rounded-md text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-brand-dark transition-colors"
                      title="Generate random barcode"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-2 uppercase tracking-widest">Initial Quantity</label>
                  <input 
                    required 
                    type="number" 
                    value={formData.quantity} 
                    onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                    className="w-full border-b-2 border-brand-border bg-transparent p-3 text-lg focus:outline-none focus:border-brand-dark transition-colors" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-2 uppercase tracking-widest">Unit Price (₹)</label>
                  <input 
                    required 
                    type="number" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full border-b-2 border-brand-border bg-transparent p-3 text-lg focus:outline-none focus:border-brand-dark transition-colors" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-2 uppercase tracking-widest">Minimum Alert Threshold</label>
                  <input 
                    required 
                    type="number" 
                    value={formData.minThreshold} 
                    onChange={e => setFormData({...formData, minThreshold: Number(e.target.value)})}
                    className="w-full border-b-2 border-brand-border bg-transparent p-3 text-lg focus:outline-none focus:border-brand-dark transition-colors" 
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 md:p-8 flex items-center justify-end border-t border-brand-border">
              <button 
                type="submit" 
                className="flex items-center space-x-2 bg-brand-dark text-white px-8 py-3 rounded text-xs font-bold uppercase tracking-widest hover:bg-brand-muted transition-colors shadow-lg"
              >
                <span>Add Premium Supply</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Selected Item Detail & Barcode Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-brand-border rounded-xl p-8 shadow-2xl max-w-md w-full animate-in zoom-in-95 relative overflow-hidden">
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
            <h3 className="font-serif text-2xl font-bold text-brand-dark mb-1">
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
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to permanently delete ${selectedItem.name}?`)) {
                    deleteInventoryItem(selectedItem.id);
                    setSelectedItem(null);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold uppercase tracking-widest py-2.5 rounded transition-colors mt-2 border border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Item</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
