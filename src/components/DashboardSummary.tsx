import { useAppStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DashboardSummary() {
  const { repairs, inventory } = useAppStore();

  const totalRevenue = repairs.reduce((sum, r) => sum + r.price + r.addonPrice + (r.hasInsurance ? r.insurancePrice : 0) - r.discountAmount, 0);
  const pendingRepairs = repairs.filter(r => r.status !== 'Completed' && r.status !== 'Delivered').length;
  const lowInventory = inventory.filter(i => i.quantity <= i.minThreshold).length;

  const data = [
    { name: 'Revenue', value: totalRevenue },
    { name: 'Pending', value: pendingRepairs },
    { name: 'Low Stock', value: lowInventory },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl border border-brand-border shadow-sm">
        <h3 className="text-sm font-bold text-brand-muted uppercase">Total Revenue</h3>
        <p className="text-3xl font-serif font-bold text-brand-dark mt-2">₹{totalRevenue.toFixed(2)}</p>
      </div>
      <div className="bg-white p-6 rounded-xl border border-brand-border shadow-sm">
        <h3 className="text-sm font-bold text-brand-muted uppercase">Pending Repairs</h3>
        <p className="text-3xl font-serif font-bold text-brand-dark mt-2">{pendingRepairs}</p>
      </div>
      <div className="bg-white p-6 rounded-xl border border-brand-border shadow-sm">
        <h3 className="text-sm font-bold text-brand-muted uppercase">Low Inventory Alerts</h3>
        <p className="text-3xl font-serif font-bold text-brand-dark mt-2">{lowInventory}</p>
      </div>

      <div className="md:col-span-3 bg-white p-6 rounded-xl border border-brand-border shadow-sm h-64">
        <h3 className="text-sm font-bold text-brand-muted uppercase mb-4">Performance Overview</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#b5b682' : index === 1 ? '#4a5568' : '#e53e3e'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
