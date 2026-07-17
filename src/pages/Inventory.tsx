import React, { useState } from 'react';
import { useAppStore } from '../store';
import { PackagePlus, AlertTriangle, Trash2 } from 'lucide-react';
import clsx from 'clsx';

export default function Inventory() {
  const { inventory, addInventoryItem, deleteInventoryItem, updateInventoryItem } = useAppStore();
  
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: 'Soles',
    quantity: 0,
    unit: 'pcs',
    minThreshold: 10,
    price: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addInventoryItem(formData);
    setShowAdd(false);
    setFormData({ name: '', category: 'Soles', quantity: 0, unit: 'pcs', minThreshold: 10, price: 0 });
  };

  const filteredInventory = inventory.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center bg-white p-6 border-b border-brand-border rounded-xl shadow-sm">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-dark mb-1">Shoe Add-ons Management</h2>
          <p className="text-xs font-sans text-brand-muted uppercase tracking-wider">Track and manage shoe add-ons and supplies</p>
        </div>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Search..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-brand-border rounded-md p-2 text-sm bg-brand-bg w-48"
          />
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-brand-olive text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
          >
            <PackagePlus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </header>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-6 border border-brand-border rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-brand-olive uppercase tracking-widest mb-1">Item Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full border-brand-border-dark rounded-md shadow-sm sm:text-sm focus:border-brand-accent focus:ring-brand-accent bg-brand-bg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-olive uppercase tracking-widest mb-1">Category</label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full border-brand-border-dark rounded-md shadow-sm sm:text-sm focus:border-brand-accent focus:ring-brand-accent bg-brand-bg">
              <option>Soles</option><option>Heels</option><option>Leather</option><option>Thread</option><option>Lasts</option><option>Hardware</option><option>Polish</option><option>Laces</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-olive uppercase tracking-widest mb-1">Qty</label>
            <input required type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
              className="w-full border-brand-border-dark rounded-md shadow-sm sm:text-sm focus:border-brand-accent focus:ring-brand-accent bg-brand-bg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-olive uppercase tracking-widest mb-1">Price</label>
            <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})}
              className="w-full border-brand-border-dark rounded-md shadow-sm sm:text-sm focus:border-brand-accent focus:ring-brand-accent bg-brand-bg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-olive uppercase tracking-widest mb-1">Threshold</label>
            <input required type="number" value={formData.minThreshold} onChange={e => setFormData({...formData, minThreshold: Number(e.target.value)})}
              className="w-full border-brand-border-dark rounded-md shadow-sm sm:text-sm focus:border-brand-accent focus:ring-brand-accent bg-brand-bg" />
          </div>
          <div>
            <button type="submit" className="w-full py-2 bg-brand-accent text-brand-dark rounded-md text-sm font-medium hover:opacity-90">
              Save
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-brand-border-dark">
          <thead className="bg-brand-bg">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Item Name</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Category</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">In Stock</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Price</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Status</th>
              <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-border-dark">
            {filteredInventory.map((item) => {
              const isLow = item.quantity <= item.minThreshold;
              return (
                <tr key={item.id} className={clsx(isLow && "bg-red-50/50")}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-dark">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-muted">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-muted flex items-center gap-2">
                    <input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => updateInventoryItem(item.id, { quantity: Number(e.target.value) })}
                      className="w-16 text-sm border-brand-border-dark rounded-md p-1 focus:border-brand-accent focus:ring-brand-accent"
                    /> <span>{item.unit}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-muted">
                      <input 
                      type="number" 
                      value={item.price} 
                      onChange={(e) => updateInventoryItem(item.id, { price: Number(e.target.value) })}
                      className="w-16 text-sm border-brand-border-dark rounded-md p-1 focus:border-brand-accent focus:ring-brand-accent"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-brand-muted">
                        Healthy
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => deleteInventoryItem(item.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
