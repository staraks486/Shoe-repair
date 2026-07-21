import { useState } from 'react';
import { useAppStore } from '../store';
import { Trash2 } from 'lucide-react';

export default function Inventory() {
  const { inventory, addInventoryItem, deleteInventoryItem } = useAppStore();
  const [newItem, setNewItem] = useState({ name: '', category: '', quantity: 0, unit: '', price: 0, minThreshold: 5 });
  
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-[40px] shadow-premium space-y-8">
      <h2 className="font-display text-2xl font-black text-brand-dark uppercase tracking-tight">Inventory</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-brand-bg rounded-2xl border border-brand-border">
        <input placeholder="Name" className="p-2 border border-brand-border rounded-lg text-xs" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
        <input placeholder="Category" className="p-2 border border-brand-border rounded-lg text-xs" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} />
        <input type="number" placeholder="Qty" className="p-2 border border-brand-border rounded-lg text-xs" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})} />
        <input placeholder="Unit" className="p-2 border border-brand-border rounded-lg text-xs" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} />
        <input type="number" placeholder="Price" className="p-2 border border-brand-border rounded-lg text-xs" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseInt(e.target.value) || 0})} />
        <input type="number" placeholder="Min Threshold" className="p-2 border border-brand-border rounded-lg text-xs" value={newItem.minThreshold} onChange={e => setNewItem({...newItem, minThreshold: parseInt(e.target.value) || 5})} />
        <button onClick={() => {
          addInventoryItem(newItem);
          setNewItem({ name: '', category: '', quantity: 0, unit: '', price: 0, minThreshold: 5 });
        }} className="bg-brand-dark text-white rounded-lg text-xs font-black uppercase tracking-widest hover:opacity-90">Add Item</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {inventory.map(item => (
          <div key={item.id} className="p-4 border border-brand-border rounded-2xl bg-brand-bg space-y-1 relative group">
            <button onClick={() => deleteInventoryItem(item.id)} className="absolute top-2 right-2 text-brand-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-4 h-4" />
            </button>
            <p className="font-black text-xs text-brand-dark uppercase">{item.name}</p>
            <p className="text-[10px] text-brand-muted font-bold">{item.category} | Qty: {item.quantity} {item.unit}</p>
            <p className="text-xs font-black text-brand-accent">₹{item.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
