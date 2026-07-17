import { useState } from 'react';
import { useAppStore } from '../store';
import { format } from 'date-fns';

export default function Customers() {
  const { customers } = useAppStore();
  const [search, setSearch] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phoneNumber.includes(search)
  );

  return (
    <div className="space-y-6">
      <header className="bg-white p-6 border-b border-brand-border rounded-xl shadow-sm flex justify-between items-center">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-dark mb-1">Customers</h2>
          <p className="text-xs font-sans text-brand-muted uppercase tracking-wider">View customer history and details</p>
        </div>
        <input 
          type="text" 
          placeholder="Search by name or phone..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-brand-border rounded-md p-2 text-sm bg-brand-bg w-64"
        />
      </header>

      <div className="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-brand-border-dark">
          <thead className="bg-brand-bg">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Name</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Contact</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Total Orders</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Last Visit</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-border-dark">
            {filteredCustomers.map((c) => (
              <tr key={c.phoneNumber}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-dark">{c.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-dark">
                  {c.phoneNumber}
                  {c.email && <div className="text-xs text-brand-muted mt-0.5">{c.email}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-muted">
                  <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-bold bg-brand-bg text-brand-dark border border-brand-border-dark">
                    {c.totalOrders}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-muted">
                  {format(new Date(c.lastVisit), 'MMM d, yyyy')}
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-sm text-brand-muted italic">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
