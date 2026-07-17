import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { RepairStatus, ShoeRepairRequest } from '../types';

const PREDEFINED_ADDONS = {
  'Shoe Trees': 1499,
  'Waterproofing Spray': 499,
  'Leather Conditioner': 399,
  'Extra Laces': 150,
};

export default function NewRepair() {
  const navigate = useNavigate();
  const { addRepair, settings } = useAppStore();

  const [generatedInvoice, setGeneratedInvoice] = useState<ShoeRepairRequest | null>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    email: '',
    shoeModel: '',
    repairType: 'Full Sole Replacement',
    description: '',
    price: 0,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    addonType: '',
    addonPrice: 0,
    hasInsurance: false,
    insuranceType: '',
    insurancePrice: 0,
    receivedBy: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const createdRepair = addRepair({
      ...formData,
      status: 'Received' as RepairStatus,
      photoUrl: '', // Placeholder for photo
      shoeIcon: 'default',
      dueDate: new Date(formData.dueDate).toISOString(),
    });
    setGeneratedInvoice(createdRepair);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCloseModal = () => {
    setGeneratedInvoice(null);
    navigate('/');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'insuranceType') {
      const plan = (settings.insurancePlans || []).find(p => p.name === value);
      setFormData(prev => ({
        ...prev,
        insuranceType: value,
        insurancePrice: plan ? plan.price : 0
      }));
      return;
    }

    if (name === 'addonType') {
      const addonPrice = PREDEFINED_ADDONS[value as keyof typeof PREDEFINED_ADDONS] || 0;
      setFormData(prev => ({
        ...prev,
        addonType: value,
        addonPrice: addonPrice > 0 ? addonPrice : prev.addonPrice
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? Number(value) : value
    }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="bg-white p-6 border-b border-brand-border rounded-xl shadow-sm">
        <h2 className="font-serif text-2xl font-bold text-brand-dark mb-1">New Repair Request</h2>
        <p className="text-xs font-sans text-brand-muted uppercase tracking-wider">Log a new shoe repair order</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white border border-brand-border rounded-xl p-8 shadow-sm space-y-8">
        
        {/* Customer Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">Customer Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Full Name</label>
              <input required type="text" name="customerName" value={formData.customerName} onChange={handleChange}
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Phone Number</label>
              <input required type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Email Address (Optional)</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Received By (Salesperson)</label>
              <input required type="text" name="receivedBy" value={formData.receivedBy} onChange={handleChange}
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
            </div>
          </div>
        </div>

        {/* Repair Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">Repair Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Shoe Brand/Model</label>
              <input required type="text" name="shoeModel" value={formData.shoeModel} onChange={handleChange}
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Service Type</label>
              <select name="repairType" value={formData.repairType} onChange={handleChange}
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg">
                <option>Full Sole Replacement</option>
                <option>Heel Replacement</option>
                <option>Bespoke Shoe Making</option>
                <option>Last Modification</option>
                <option>Pattern Drafting</option>
                <option>Upper Lasting</option>
                <option>Welt Stitching (Hand-sewn)</option>
                <option>Stretching</option>
                <option>Shine & Polish</option>
                <option>Stitching & Patching</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Description / Notes</label>
              <textarea name="description" rows={3} value={formData.description} onChange={handleChange}
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
            </div>
            
            <div className="md:col-span-2 p-6 border-2 border-dashed border-brand-border-dark rounded-xl text-center bg-brand-bg bg-opacity-50">
              <span className="text-sm text-brand-muted">Photo Upload Placeholder</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Base Price (₹)</label>
              <input required type="number" min="0" step="0.01" name="price" value={formData.price} onChange={handleChange}
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Due Date</label>
              <input required type="date" name="dueDate" value={formData.dueDate} onChange={handleChange}
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
            </div>
          </div>
        </div>

        {/* Add-ons & Insurance */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">Add-ons & Insurance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Add-on Item</label>
              <select name="addonType" value={formData.addonType} onChange={handleChange}
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg">
                <option value="">None</option>
                {Object.keys(PREDEFINED_ADDONS).map(addon => (
                  <option key={addon} value={addon}>{addon}</option>
                ))}
                <option value="Custom">Custom (Specify below)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Add-on Price (₹)</label>
              <input type="number" min="0" step="0.01" name="addonPrice" value={formData.addonPrice} onChange={handleChange}
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
            </div>
            
            <div className="md:col-span-2 flex items-center mt-2">
              <input type="checkbox" id="hasInsurance" name="hasInsurance" checked={formData.hasInsurance} onChange={handleChange}
                className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-brand-border-dark rounded bg-brand-bg" />
              <label htmlFor="hasInsurance" className="ml-2 block text-sm font-medium text-brand-dark">
                Purchase Shoe Insurance (Protection Plan)
              </label>
            </div>
            
            {formData.hasInsurance && (
              <>
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Insurance Tier</label>
                  <select name="insuranceType" value={formData.insuranceType} onChange={handleChange} required
                    className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg">
                    <option value="" disabled>Select a plan...</option>
                    {(settings.insurancePlans || []).map(plan => (
                      <option key={plan.id} value={plan.name}>{plan.name} - ₹{plan.price}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Insurance Price (₹)</label>
                  <input type="number" min="0" step="0.01" name="insurancePrice" value={formData.insurancePrice} readOnly
                    className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg opacity-70" />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-brand-border-dark flex justify-end items-center">
          <div className="text-right mr-8">
            <p className="text-xs font-bold text-brand-olive uppercase tracking-widest">Total</p>
            <p className="text-3xl font-serif font-bold text-brand-dark">
              ₹{(formData.price + formData.addonPrice + (formData.hasInsurance ? formData.insurancePrice : 0)).toFixed(2)}
            </p>
          </div>
          <button type="submit"
            className="inline-flex justify-center py-3 px-8 shadow-sm text-sm font-bold rounded-lg text-white bg-brand-olive hover:opacity-90 transition-opacity uppercase tracking-widest">
            Create Order
          </button>
        </div>

      </form>

      {generatedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div id="printable-invoice" className="p-8 bg-white text-brand-dark">
              <div className="text-center mb-6 border-b border-brand-border-dark pb-6">
                <h2 className="font-serif text-3xl font-bold mb-1">{settings.storeName}</h2>
                <p className="text-xs font-sans text-brand-muted uppercase tracking-wider">{settings.address}</p>
                <p className="text-xs font-sans text-brand-muted uppercase tracking-wider">{settings.hours}</p>
              </div>
              
              <div className="mb-6 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-brand-olive uppercase tracking-widest text-xs">Invoice:</span>
                  <span className="font-mono">{generatedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-brand-olive uppercase tracking-widest text-xs">Date:</span>
                  <span>{new Date(generatedInvoice.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-brand-olive uppercase tracking-widest text-xs">Customer:</span>
                  <span>{generatedInvoice.customerName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-brand-olive uppercase tracking-widest text-xs">Phone:</span>
                  <span>{generatedInvoice.phoneNumber}</span>
                </div>
                {generatedInvoice.receivedBy && (
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-brand-olive uppercase tracking-widest text-xs">Received By:</span>
                    <span>{generatedInvoice.receivedBy}</span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border-dark">
                      <th className="text-left font-bold text-brand-olive uppercase tracking-widest text-xs py-2">Service / Item</th>
                      <th className="text-right font-bold text-brand-olive uppercase tracking-widest text-xs py-2">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2">
                        {generatedInvoice.repairType}
                        <div className="text-xs text-brand-muted">{generatedInvoice.shoeModel}</div>
                      </td>
                      <td className="text-right py-2">₹{generatedInvoice.price.toFixed(2)}</td>
                    </tr>
                    {generatedInvoice.addonPrice > 0 && (
                      <tr>
                        <td className="py-2">{generatedInvoice.addonType || 'Add-on Item'}</td>
                        <td className="text-right py-2">₹{generatedInvoice.addonPrice.toFixed(2)}</td>
                      </tr>
                    )}
                    {generatedInvoice.hasInsurance && (
                      <tr>
                        <td className="py-2">Insurance: {generatedInvoice.insuranceType}</td>
                        <td className="text-right py-2">₹{generatedInvoice.insurancePrice.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-brand-dark font-bold text-lg">
                      <td className="pt-4 text-right pr-4">Total</td>
                      <td className="pt-4 text-right">
                        ₹{(
                          generatedInvoice.price +
                          generatedInvoice.addonPrice +
                          (generatedInvoice.hasInsurance ? generatedInvoice.insurancePrice : 0)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="text-center text-xs text-brand-muted mt-8 italic">
                Thank you for your business!<br/>
                Due Date: {new Date(generatedInvoice.dueDate).toLocaleDateString()}
              </div>
            </div>
            
            <div className="bg-brand-bg p-4 flex gap-4 justify-end border-t border-brand-border-dark print:hidden">
              <button onClick={handlePrint} className="px-4 py-2 border border-brand-border-dark bg-white rounded-md text-sm font-bold text-brand-dark uppercase tracking-widest hover:bg-brand-bg">
                Print Invoice
              </button>
              <button onClick={handleCloseModal} className="px-4 py-2 bg-brand-olive text-white rounded-md text-sm font-bold uppercase tracking-widest hover:opacity-90">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
