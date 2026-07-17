import { useAppStore } from '../store';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function Insurance() {
  const { repairs } = useAppStore();
  
  // Filter for repairs that have insurance
  const insuredRepairs = repairs.filter(r => r.hasInsurance);

  return (
    <div className="space-y-6">
      <header className="bg-white p-6 border-b border-brand-border rounded-xl shadow-sm">
        <h2 className="font-serif text-2xl font-bold text-brand-dark mb-1">Insurance Policies</h2>
        <p className="text-xs font-sans text-brand-muted uppercase tracking-wider">Track active protection plans</p>
      </header>

      <div className="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-brand-border-dark">
          <thead className="bg-brand-bg">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Customer / Shoe</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Invoice</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Plan Type</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Date Issued</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-border-dark">
            {insuredRepairs.map((repair) => {
              const isExpired = false; // In a real app, calculate based on plan duration
              
              return (
                <tr key={repair.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-brand-dark">{repair.customerName}</div>
                    <div className="text-xs text-brand-muted mt-0.5">{repair.shoeModel}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-dark font-mono">
                    {repair.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-dark">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-brand-accent" />
                      {repair.insuranceType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-muted">
                    {format(new Date(repair.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border",
                      isExpired 
                        ? "bg-red-50 text-red-700 border-red-200" 
                        : "bg-green-50 text-green-700 border-green-200"
                    )}>
                      {isExpired ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                      {isExpired ? 'Expired' : 'Active'}
                    </span>
                  </td>
                </tr>
              );
            })}
            
            {insuredRepairs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-brand-muted italic">
                  No active insurance policies found. Add insurance to a repair request to see it here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
