import { useState } from 'react';
import { useAppStore } from '../store';
import { format } from 'date-fns';
import { Search, User, Phone, Mail, Calendar, ChevronRight, Filter } from 'lucide-react';
import clsx from 'clsx';

export default function Customers() {
  const { customers } = useAppStore();
  const [search, setSearch] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phoneNumber.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-serif text-4xl font-black text-brand-dark tracking-tighter uppercase leading-none">Customers</h2>
          <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] mt-3">Artisan Client Archive & CRM</p>
        </div>
        <div className="relative group min-w-[320px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Search the archive..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-brand-border rounded-full pl-12 pr-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all shadow-sm font-medium"
          />
        </div>
      </header>

      <div className="bg-white rounded-[40px] border border-brand-border shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-border">
            <thead>
              <tr className="bg-brand-bg/50">
                <th scope="col" className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Client Identity</th>
                <th scope="col" className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Contact Node</th>
                <th scope="col" className="px-8 py-5 text-center text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Engagement</th>
                <th scope="col" className="px-8 py-5 text-right text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Last Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border bg-white">
              {filteredCustomers.map((c) => (
                <tr key={c.phoneNumber} className="hover:bg-brand-bg/20 transition-colors group">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center text-brand-olive font-serif font-black text-sm">
                        {c.name.charAt(0)}
                      </div>
                      <div className="text-sm font-bold text-brand-dark font-serif">{c.name}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-brand-dark">
                        <Phone className="w-3.5 h-3.5 text-brand-muted opacity-40" />
                        {c.phoneNumber}
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-2 text-[10px] text-brand-muted font-medium">
                          <Mail className="w-3.5 h-3.5 text-brand-muted opacity-40" />
                          {c.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-center">
                    <span className="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1 rounded-full text-[10px] font-black bg-brand-bg text-brand-dark border border-brand-border group-hover:bg-brand-accent group-hover:border-brand-accent transition-colors">
                      {c.totalOrders}
                    </span>
                    <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Total Orders</p>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 text-xs font-bold text-brand-dark">
                      <Calendar className="w-3.5 h-3.5 text-brand-muted opacity-40" />
                      {format(new Date(c.lastVisit), 'dd MMM, yyyy')}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-6 h-6 text-brand-muted opacity-40" />
                      </div>
                      <p className="text-[11px] font-black text-brand-dark uppercase tracking-tighter">No artisans found in the archive</p>
                      <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest leading-relaxed">Refine your search parameters or register a new client via the intake portal.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <footer className="text-center pt-8 opacity-40">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-dark">Cordwainers Studio CRM Portal</p>
      </footer>
    </div>
  );
}
