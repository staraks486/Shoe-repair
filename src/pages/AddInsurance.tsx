import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Shield } from 'lucide-react';

export default function AddInsurance() {
  const navigate = useNavigate();
  const { settings, addInsurance } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  
  const [formData, setFormData] = useState({
    customerName: '',
    shoeModel: '',
    shoeAmount: 0,
    insuranceProvider: '',
    insurancePolicyNumber: `POL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    insuranceStartDate: new Date().toISOString().split('T')[0],
    insuranceEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    insuranceType: '',
    insurancePrice: 0,
    servicesIncluded: [] as string[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'insuranceType') {
        const plan = (settings.insurancePlans || []).find(p => p.name === value);
        setFormData(prev => ({
            ...prev,
            insuranceType: value,
            insurancePrice: plan ? plan.price : 0,
            servicesIncluded: plan ? plan.servicesIncluded : []
        }));
        return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addInsurance(formData);
    navigate('/insurance');
  };

  const suggestedPlans = (settings.insurancePlans || []).filter(plan => plan.price <= formData.shoeAmount * 0.2);

  return (
    <div className="space-y-6">
      <header className="bg-white p-6 border-b border-brand-border rounded-xl shadow-sm">
        <h2 className="font-serif text-2xl font-bold text-brand-dark mb-1">Add Insurance Policy</h2>
        <p className="text-sm text-brand-muted">Step {currentStep + 1} of 6</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white border border-brand-border rounded-xl p-6 shadow-sm space-y-4">
        {currentStep === 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-border pb-2">Step 1: Customer Information</h3>
            <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Customer Name</label>
                <input required type="text" name="customerName" value={formData.customerName} onChange={handleChange}
                className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
            </div>
          </div>
        )}
        
        {currentStep === 1 && (
            <div className="space-y-4">
            <h3 className="text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-border pb-2">Step 2: Shoe Information</h3>
            <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Shoe Model</label>
                <input required type="text" name="shoeModel" value={formData.shoeModel} onChange={handleChange}
                className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
            </div>
            <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Shoe Amount</label>
                <input required type="number" name="shoeAmount" value={formData.shoeAmount} onChange={handleChange}
                className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
            </div>
          </div>
        )}

        {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-border pb-2">Step 3: Policy Plans</h3>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Insurance Plan (Suggested for your amount)</label>
                <select required name="insuranceType" value={formData.insuranceType} onChange={handleChange}
                className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg">
                <option value="">Select a plan</option>
                {suggestedPlans.map(plan => (
                    <option key={plan.id} value={plan.name}>{plan.name} - ₹{plan.price}</option>
                ))}
                </select>
            </div>
          </div>
        )}
        
        {currentStep === 3 && (
            <div className="space-y-4">
            <h3 className="text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-border pb-2">Step 4: Policy Details</h3>
            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Insurance Provider</label>
              <input required type="text" name="insuranceProvider" value={formData.insuranceProvider} onChange={handleChange}
              className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Policy Number</label>
              <input required type="text" name="insurancePolicyNumber" value={formData.insurancePolicyNumber} onChange={handleChange}
              className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Start Date</label>
              <input required type="date" name="insuranceStartDate" value={formData.insuranceStartDate} onChange={handleChange}
              className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">End Date</label>
              <input required type="date" name="insuranceEndDate" value={formData.insuranceEndDate} onChange={handleChange}
              className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
            </div>
          </div>
        )}

        {currentStep === 4 && (
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-border pb-2">Step 5: Review</h3>
                <div className="text-sm space-y-2">
                    <p>Customer: {formData.customerName}</p>
                    <p>Shoe: {formData.shoeModel} (₹{formData.shoeAmount})</p>
                    <p>Plan: {formData.insuranceType} (₹{formData.insurancePrice})</p>
                    <p>Provider: {formData.insuranceProvider}</p>
                    <p>Policy: {formData.insurancePolicyNumber}</p>
                </div>
            </div>
        )}
        
        {currentStep === 5 && (
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-border pb-2">Step 6: Payment</h3>
                <div className="text-sm font-bold">Total Amount to Pay: ₹{formData.insurancePrice}</div>
            </div>
        )}

        <div className="flex justify-between pt-4 border-t border-brand-border">
            {currentStep > 0 && (
                <button type="button" onClick={() => setCurrentStep(s => s - 1)} className="px-6 py-2 border border-brand-border rounded-md text-sm font-bold uppercase tracking-widest">Back</button>
            )}
            {currentStep < 5 ? (
                <button type="button" onClick={() => setCurrentStep(s => s + 1)} className="px-6 py-2 bg-brand-dark text-white rounded-md text-sm font-bold uppercase tracking-widest ml-auto">Next</button>
            ) : (
                <button type="submit" className="px-6 py-2 bg-brand-accent text-white rounded-md text-sm font-bold uppercase tracking-widest ml-auto">Create Policy & Pay</button>
            )}
        </div>
      </form>
    </div>
  );
}

