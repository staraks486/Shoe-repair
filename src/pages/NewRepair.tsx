import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { RepairStatus, ShoeRepairRequest } from '../types';

const PREDEFINED_ADDONS = {
  'Shoe Trees': 1499,
  'Waterproofing Spray': 499,
  'Leather Conditioner': 399,
  'Extra Laces': 150,
};

const MOTIVATIONAL_MESSAGES = [
  "Crafting excellence in every stitch.",
  "Quality is never an accident.",
  "Your shoes, reimagined.",
  "Precision meets passion.",
  "Walk with confidence.",
  "Mastering the art of cordwaining."
];

export default function NewRepair() {
  const navigate = useNavigate();
  const { addRepair, settings, repairs } = useAppStore();
  const [generatedInvoice, setGeneratedInvoice] = useState<ShoeRepairRequest | null>(null);
  const [randomFact, setRandomFact] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);
  
  const facts = [
    "The first shoes were made of simple leather wraps.",
    "The left and right shoe were the same until the mid-19th century.",
    "Stiletto heels were invented in the 1950s.",
    "Sneakers got their name because the rubber soles made them quiet.",
    "The most expensive pair of shoes ever sold at auction cost over $600,000."
  ];

  const generateFact = () => facts[Math.floor(Math.random() * facts.length)];

  const getTotalBreakdown = () => {
    const base = formData.price;
    const addons = formData.addons.reduce((sum, a) => sum + a.price, 0);
    const insurance = formData.hasInsurance ? formData.insurancePrice : 0;
    const discount = formData.discountAmount;
    const total = base + addons + insurance - discount;
    return { base, addons, insurance, discount, total };
  };

  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    email: '',
    shoeModel: '',
    repairType: [] as string[],
    description: '',
    price: 0,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    addonType: '',
    addonPrice: 0,
    addons: [],
    hasInsurance: false,
    insuranceType: '',
    insurancePrice: 0,
    insurancePolicyNumber: '',
    insuranceStartDate: '',
    insuranceProvider: '',
    salespersonId: '',
    discountCode: '',
    discountAmount: 0,
    shoeImage: '',
    advance: 0,
    balance: 0,
  });

  const toggleService = (service: string, price: number) => {
    setFormData(prev => {
        const isSelected = prev.repairType.includes(service);
        const newServices = isSelected
            ? prev.repairType.filter(s => s !== service)
            : [...prev.repairType, service];
        const newPrice = newServices.reduce((sum, s) => {
            const charge = (settings.repairCharges || []).find(c => c.service === s);
            return sum + (charge ? charge.price : 0);
        }, 0);
        return { ...prev, repairType: newServices, price: newPrice };
    });
  };

  const toggleAddon = (addon: string, price: number) => {
    setFormData(prev => {
        const isSelected = prev.addons.some(a => a.name === addon);
        const newAddons = isSelected
            ? prev.addons.filter(a => a.name !== addon)
            : [...prev.addons, { name: addon, price }];
        const newAddonPrice = newAddons.reduce((sum, a) => sum + a.price, 0);
        return { ...prev, addons: newAddons, addonPrice: newAddonPrice };
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, shoeImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const createdRepair = addRepair({
      ...formData,
      status: 'Received' as RepairStatus,
      photoUrl: formData.shoeImage,
      shoeIcon: 'default',
      dueDate: new Date(formData.dueDate).toISOString(),
      appliedOfferCode: formData.discountCode,
      discountAmount: formData.discountAmount,
      receivedBy: settings.employees?.find(e => e.id === formData.salespersonId)?.name || 'Unknown',
    });
    setGeneratedInvoice(createdRepair);
    setRandomFact(generateFact());
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    if (!generatedInvoice) return;
    const message = encodeURIComponent(
      settings.whatsappTemplate
        .replace('{customerName}', generatedInvoice.customerName)
        .replace('{repairType}', generatedInvoice.repairType)
        .replace('{status}', generatedInvoice.status)
        .replace('{invoiceNumber}', generatedInvoice.invoiceNumber)
    );
    window.open(`https://wa.me/${generatedInvoice.phoneNumber.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleDownloadImage = () => {
    // Placeholder for image generation
    alert("Downloading invoice as image...");
  };

  const handleDownloadPDF = () => {
    // Placeholder for PDF generation
    alert("Downloading invoice as PDF...");
  };

  const handleCloseModal = () => {
    setGeneratedInvoice(null);
    navigate('/');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (name === 'repairType') {
      return;
    }

    if (name === 'hasInsurance') {
      const isEnabled = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        hasInsurance: isEnabled,
        insurancePolicyNumber: isEnabled ? `POL-${Math.random().toString(36).substring(2, 9).toUpperCase()}` : '',
        insuranceStartDate: isEnabled ? new Date().toISOString().split('T')[0] : '',
        insuranceEndDate: isEnabled ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0] : '',
      }));
      return;
    }

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

    if (name === 'addonType') {
      // This is handled by toggleAddon now
      return;
    }

    if (name === 'discountCode') {
      const offer = (settings.offers || []).find(o => o.code === value);
      const subtotal = formData.price + (formData.addonType ? formData.addonPrice : 0) + (formData.hasInsurance ? formData.insurancePrice : 0);
      setFormData(prev => ({
        ...prev,
        discountCode: value,
        discountAmount: offer ? (subtotal * offer.discountPercentage) / 100 : 0
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
    <div className="max-w-2xl mx-auto space-y-4 p-2 md:p-6">
      <form className="bg-white border border-brand-border rounded-xl p-3 md:p-6 shadow-sm space-y-4">
        {currentStep === 0 && (
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-border pb-2">Start Repair</h3>
                <button type="button" onClick={() => setCurrentStep(1)} 
                    className="w-full py-4 bg-brand-dark text-white rounded-md text-sm font-bold uppercase tracking-widest hover:opacity-90">
                    New Repair
                </button>
                <div className="pt-4">
                    <h3 className="text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-border pb-2 mb-4">Saved Repairs</h3>
                    <div className="space-y-2">
                        {repairs.slice(0, 5).map(r => (
                            <div key={r.id} className="p-3 border border-brand-border rounded-md text-sm flex justify-between">
                                <span>{r.customerName} - {r.shoeModel}</span>
                                <span className="text-brand-muted">{r.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-border pb-2">Step 1: Customer Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] md:text-xs font-medium text-brand-dark mb-1 uppercase">Full Name</label>
                  <input required type="text" name="customerName" value={formData.customerName} onChange={handleChange}
                    className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-medium text-brand-dark mb-1 uppercase">Phone Number</label>
                  <input required type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                    className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] md:text-xs font-medium text-brand-dark mb-1 uppercase">Email Address (Optional)</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] md:text-xs font-medium text-brand-dark mb-1 uppercase">Salesperson</label>
                  <select required name="salespersonId" value={formData.salespersonId} onChange={handleChange}
                    className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg">
                    <option value="" disabled>Select a salesperson...</option>
                    {(settings.employees || []).map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="p-4 bg-brand-bg rounded-md text-sm border border-brand-border mt-4">
                <div className="flex justify-between font-bold"><span>Total Amount:</span><span>₹{getTotalBreakdown().total.toFixed(2)}</span></div>
              </div>
            </div>
        )}
        
        {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-border pb-2">Step 2: Repair Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] md:text-xs font-medium text-brand-dark mb-1 uppercase">Shoe Brand/Model</label>
                  <input required type="text" name="shoeModel" value={formData.shoeModel} onChange={handleChange}
                    className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-medium text-brand-dark mb-1 uppercase">Service Type (Select multiple)</label>
                  <div className="grid grid-cols-1 gap-2">
                    {(settings.repairCharges || []).map(charge => (
                      <label key={charge.id} className="flex items-center space-x-3 p-2 border border-brand-border rounded-md hover:bg-brand-bg cursor-pointer">
                        <input type="checkbox" checked={formData.repairType.includes(charge.service)} onChange={() => toggleService(charge.service, charge.price)}
                            className="h-4 w-4 text-brand-accent rounded" />
                        <span className="text-sm text-brand-dark">{charge.service} (₹{charge.price})</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] md:text-xs font-medium text-brand-dark mb-1 uppercase">Description / Notes</label>
                  <textarea name="description" rows={2} value={formData.description} onChange={handleChange}
                    className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-[10px] md:text-xs font-medium text-brand-dark mb-1 uppercase">Shoe Image</label>
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageChange}
                    className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
                  {formData.shoeImage && <img src={formData.shoeImage} alt="Preview" className="mt-2 h-24 w-auto rounded border border-brand-border" />}
                </div>

                <div className="hidden">
                  <label className="block text-[10px] md:text-xs font-medium text-brand-dark mb-1 uppercase">Base Price (₹)</label>
                  <input required type="number" readOnly min="0" step="0.01" name="price" value={formData.price}
                    className="w-full border border-brand-border rounded-md p-2 text-sm bg-gray-100" />
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-medium text-brand-dark mb-1 uppercase">Due Date</label>
                  <input required type="date" name="dueDate" value={formData.dueDate} onChange={handleChange}
                    className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
                </div>
              </div>
              <div className="p-4 bg-brand-bg rounded-md text-sm border border-brand-border mt-4">
                <div className="flex justify-between font-bold"><span>Total Amount:</span><span>₹{getTotalBreakdown().total.toFixed(2)}</span></div>
              </div>
            </div>
        )}

        {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-border pb-2">Step 3: Add-on Items (Optional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(PREDEFINED_ADDONS).map(([addon, price]) => (
                  <label key={addon} className="flex items-center space-x-3 p-2 border border-brand-border rounded-md hover:bg-brand-bg cursor-pointer">
                    <input type="checkbox" checked={formData.addons.some(a => a.name === addon)} onChange={() => toggleAddon(addon, price)}
                        className="h-4 w-4 text-brand-accent rounded" />
                    <span className="text-sm text-brand-dark">{addon} (+₹{price})</span>
                  </label>
                ))}
              </div>
              <div className="p-4 bg-brand-bg rounded-md text-sm border border-brand-border mt-4">
                <div className="flex justify-between font-bold"><span>Total Amount:</span><span>₹{getTotalBreakdown().total.toFixed(2)}</span></div>
              </div>
            </div>
        )}

        {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-border pb-2">Step 4: Shoe Insurance Option</h3>
              <div className="sm:col-span-2 flex items-center">
                <input type="checkbox" id="hasInsurance" name="hasInsurance" checked={formData.hasInsurance} onChange={handleChange}
                    className="h-4 w-4 text-brand-accent rounded" />
                <label htmlFor="hasInsurance" className="ml-2 text-xs uppercase font-medium text-brand-dark">
                    Purchase Shoe Insurance
                </label>
              </div>
              <div className="p-4 bg-brand-bg rounded-md text-sm border border-brand-border mt-4">
                <div className="flex justify-between font-bold"><span>Total Amount:</span><span>₹{getTotalBreakdown().total.toFixed(2)}</span></div>
              </div>
            </div>
        )}

        {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-border pb-2">Step 5: Shoe Insurance Details</h3>
              {formData.hasInsurance ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] md:text-xs font-medium text-brand-dark mb-1 uppercase">Insurance Provider</label>
                      <input type="text" name="insuranceProvider" value={formData.insuranceProvider} onChange={handleChange}
                        className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs font-medium text-brand-dark mb-1 uppercase">Policy Number</label>
                      <input type="text" name="insurancePolicyNumber" value={formData.insurancePolicyNumber} onChange={handleChange}
                        className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs font-medium text-brand-dark mb-1 uppercase">Start Date</label>
                      <input type="date" name="insuranceStartDate" value={formData.insuranceStartDate} onChange={handleChange}
                        className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
                    </div>
                    <div className="sm:col-span-2 grid grid-cols-1 gap-2">
                      <label className="block text-[10px] md:text-xs font-medium text-brand-dark mb-1 uppercase">Insurance Plan</label>
                        {(settings.insurancePlans || []).map(plan => (
                            <label key={plan.id} className={`p-3 border rounded-md cursor-pointer ${formData.insuranceType === plan.name ? 'border-brand-accent bg-brand-bg' : 'border-brand-border'}`}>
                              <input type="radio" name="insuranceType" value={plan.name} checked={formData.insuranceType === plan.name} onChange={handleChange} className="hidden" />
                              <div className="font-bold text-sm">{plan.name}</div>
                              <div className="text-xs text-brand-muted">{plan.description} - ₹{plan.price}</div>
                            </label>
                        ))}
                    </div>
                </div>
              ) : (
                <p className="text-sm text-brand-muted">Insurance not enabled. Please go back to enable it if needed.</p>
              )}
              <div className="p-4 bg-brand-bg rounded-md text-sm border border-brand-border mt-4">
                <div className="flex justify-between font-bold"><span>Total Amount:</span><span>₹{getTotalBreakdown().total.toFixed(2)}</span></div>
              </div>
            </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-border pb-2">Step 6: Payment Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-2 p-4 border border-brand-border rounded-md bg-brand-bg">
                <div className="flex justify-between text-sm"><span>Base Price:</span><span>₹{formData.price.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span>Add-ons:</span><span>₹{formData.addons.reduce((sum, a) => sum + a.price, 0).toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span>Insurance:</span><span>₹{(formData.hasInsurance ? (settings.insurancePlans?.find(p => p.name === formData.insuranceType)?.price || 0) : 0).toFixed(2)}</span></div>
                <div className="flex justify-between text-sm text-red-600"><span>Discount:</span><span>-₹{formData.discountAmount.toFixed(2)}</span></div>
                <div className="border-t border-brand-border pt-2 flex justify-between font-bold"><span>Total:</span><span>₹{getTotalBreakdown().total.toFixed(2)}</span></div>
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Offer Code</label>
                <select name="discountCode" value={formData.discountCode} onChange={handleChange}
                  className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg">
                  <option value="">None</option>
                  {(settings.offers || []).map(offer => (
                    <option key={offer.id} value={offer.code}>{offer.name} ({offer.discountPercentage}%)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Advance (₹)</label>
                <input type="number" min="0" step="0.01" name="advance" value={formData.advance} onChange={handleChange}
                  className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase">Balance (₹)</label>
                <input type="number" readOnly value={Math.max(0, getTotalBreakdown().total - formData.advance).toFixed(2)}
                  className="w-full border border-brand-border rounded-md p-2 text-sm bg-gray-100" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 7 && (
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-border pb-2">Step 7: Review Invoice</h3>
                <div className="p-4 bg-white border border-brand-border rounded-md shadow-sm text-sm space-y-2">
                    <img src={settings.logoUrl || "/logo.png"} alt="Logo" className="mx-auto h-16 w-16 mb-4" />
                    <div className="font-serif text-2xl font-bold text-center mb-4 text-brand-dark">Cordwainers Studio</div>
                    <div className="flex justify-between font-bold text-xs uppercase border-b border-brand-border pb-2 mb-2"><span>Invoice No:</span><span>{formData.invoiceNumber}</span></div>
                    <div className="flex justify-between"><span>Customer:</span><span>{formData.customerName}</span></div>
                    <div className="flex justify-between"><span>Services:</span><span>{formData.repairType.join(', ')}</span></div>
                    <div className="flex justify-between"><span>Base:</span><span>₹{formData.price.toFixed(2)}</span></div>
                    {formData.addons.length > 0 && (
                      <div>
                          <div className="font-bold mt-2">Add-ons:</div>
                          {formData.addons.map(a => <div key={a.name} className="flex justify-between ml-2"><span>{a.name}</span><span>₹{a.price.toFixed(2)}</span></div>)}
                      </div>
                    )}
                    {formData.hasInsurance && (
                        <div>
                            <div className="flex justify-between"><span>Insurance ({formData.insuranceType}):</span><span>₹{formData.insurancePrice.toFixed(2)}</span></div>
                            <div className="text-xs text-brand-muted ml-2">Provider: {formData.insuranceProvider}</div>
                            <div className="text-xs text-brand-muted ml-2">Policy: {formData.insurancePolicyNumber}</div>
                            <div className="text-xs text-brand-muted ml-2">Start Date: {formData.insuranceStartDate}</div>
                            <div className="text-xs text-brand-muted ml-2">End Date: {formData.insuranceEndDate}</div>
                            <div className="text-xs text-brand-muted ml-2">Services Included: {formData.servicesIncluded.join(', ')}</div>
                        </div>
                    )}
                    {formData.discountAmount > 0 && <div className="flex justify-between text-red-600"><span>Discount ({formData.discountCode}):</span><span>-₹{formData.discountAmount.toFixed(2)}</span></div>}
                    <div className="border-t border-brand-border pt-2 flex justify-between font-bold text-lg"><span>Total:</span><span>₹{getTotalBreakdown().total.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Advance:</span><span>₹{formData.advance.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold"><span>Balance:</span><span>₹{Math.max(0, getTotalBreakdown().total - formData.advance).toFixed(2)}</span></div>
                </div>
            </div>
        )}

        {currentStep === 8 && (
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-border pb-2">Step 8: Finalize</h3>
                <p>Click "Create Order" to finalize the invoice.</p>
            </div>
        )}
        
        <div className="pt-4 border-t border-brand-border flex items-center justify-between">
           {currentStep > 1 && (
             <button type="button" onClick={() => setCurrentStep(s => s - 1)}
                className="px-6 py-2 border border-brand-border text-brand-dark rounded-md text-sm font-bold uppercase tracking-widest hover:bg-brand-bg">
                Back
             </button>
           )}
           {currentStep === 1 && (
             <button type="button" onClick={() => setCurrentStep(0)}
                className="px-6 py-2 border border-brand-border text-brand-dark rounded-md text-sm font-bold uppercase tracking-widest hover:bg-brand-bg">
                Back
             </button>
           )}
           
           {currentStep > 0 && currentStep < 8 && (
             <button type="button" onClick={() => setCurrentStep(s => s + 1)}
                className="px-6 py-2 bg-brand-dark text-white rounded-md text-sm font-bold uppercase tracking-widest hover:opacity-90 ml-auto">
                Next
             </button>
           )}
           
           {currentStep === 3 && (
             <button type="button" onClick={() => setCurrentStep(s => s + 1)}
                className="px-6 py-2 border border-brand-border text-brand-dark rounded-md text-sm font-bold uppercase tracking-widest hover:bg-brand-bg ml-auto">
                Skip Add-on
             </button>
           )}
           
           {currentStep === 4 && (
             <button type="button" onClick={() => setCurrentStep(s => s + 2)}
                className="px-6 py-2 border border-brand-border text-brand-dark rounded-md text-sm font-bold uppercase tracking-widest hover:bg-brand-bg ml-auto">
                Skip Insurance
             </button>
           )}

           {currentStep === 8 && (
              <button type="button" onClick={handleSubmit}
                className="px-6 py-2 bg-brand-dark text-white rounded-md text-sm font-bold uppercase tracking-widest hover:opacity-90 ml-auto">
                Create Order
              </button>
           )}
        </div>
        <div className="mt-8 pt-6 border-t border-brand-border text-center text-xs font-medium italic text-brand-muted">
            {MOTIVATIONAL_MESSAGES[(currentStep - 1) % MOTIVATIONAL_MESSAGES.length]}
        </div>
      </form>

      {generatedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div id="printable-invoice" className="p-8 bg-white text-brand-dark">
              <div className="text-center mb-6 border-b border-brand-border-dark pb-6">
                <img src="/logo.png" alt="Logo" className="mx-auto h-20 w-20 mb-4" />
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
                        {generatedInvoice.repairType.join(', ')}
                        <div className="text-xs text-brand-muted">{generatedInvoice.shoeModel}</div>
                      </td>
                      <td className="text-right py-2">₹{generatedInvoice.price.toFixed(2)}</td>
                    </tr>
                    {generatedInvoice.addons.map(a => (
                      <tr key={a.name}>
                        <td className="py-2">Add-on: {a.name}</td>
                        <td className="text-right py-2">₹{a.price.toFixed(2)}</td>
                      </tr>
                    ))}
                    {generatedInvoice.hasInsurance && (
                      <tr>
                        <td className="py-2">Insurance: {generatedInvoice.insuranceType}</td>
                        <td className="text-right py-2">₹{generatedInvoice.insurancePrice.toFixed(2)}</td>
                      </tr>
                    )}
                    {generatedInvoice.discountAmount > 0 && (
                      <tr>
                        <td className="py-2">Discount ({generatedInvoice.appliedOfferCode}):</td>
                        <td className="text-right py-2 text-red-600">-₹{generatedInvoice.discountAmount.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-brand-dark font-bold text-lg">
                      <td className="pt-4 text-right pr-4">Total</td>
                      <td className="pt-4 text-right">
                        ₹{(
                          generatedInvoice.price +
                          generatedInvoice.addons.reduce((sum, a) => sum + a.price, 0) +
                          (generatedInvoice.hasInsurance ? generatedInvoice.insurancePrice : 0) -
                          generatedInvoice.discountAmount
                        ).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-right pr-4">Advance:</td>
                      <td className="text-right">₹{generatedInvoice.advance.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="text-right pr-4">Balance:</td>
                      <td className="text-right font-bold">₹{Math.max(0, (generatedInvoice.price + generatedInvoice.addons.reduce((sum, a) => sum + a.price, 0) + (generatedInvoice.hasInsurance ? generatedInvoice.insurancePrice : 0) - generatedInvoice.discountAmount) - generatedInvoice.advance).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="text-center text-xs text-brand-muted mt-8 italic">
                {randomFact && (
                   <p className="mb-4 text-brand-dark font-medium italic border-b border-brand-border-dark pb-2">
                     Did you know? {randomFact}
                   </p>
                )}
                {settings.termsAndConditions && (
                  <div className="mb-4 text-left whitespace-pre-line text-[10px] border-t border-brand-border-dark pt-2">
                    <p className="font-bold uppercase text-brand-dark">Terms and Conditions</p>
                    {settings.termsAndConditions}
                  </div>
                )}
                {settings.paymentLink && (
                  <div className="mb-4">
                    <p className="font-bold uppercase text-brand-dark text-[10px]">Payment Link</p>
                    <a href={settings.paymentLink} target="_blank" rel="noreferrer" className="text-brand-accent underline text-[10px]">{settings.paymentLink}</a>
                  </div>
                )}
                {settings.qrCode && (
                  <div className="mb-4">
                    <img src={settings.qrCode} alt="Payment QR" className="mx-auto h-32 w-32" />
                  </div>
                )}
                <div className="text-center font-bold text-brand-dark mt-4 border-t border-brand-border-dark pt-2">
                  Thank you for your business!
                </div>
                <div className="text-center text-xs text-brand-muted mt-2">
                  Due Date: {new Date(generatedInvoice.dueDate).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="bg-brand-bg p-4 flex gap-2 justify-end border-t border-brand-border-dark print:hidden flex-wrap">
              <button onClick={handlePrint} className="px-3 py-1.5 border border-brand-border-dark bg-white rounded-md text-[10px] font-bold text-brand-dark uppercase tracking-widest hover:bg-brand-bg">
                Print
              </button>
              <button onClick={handleSendWhatsApp} className="px-3 py-1.5 bg-green-600 text-white rounded-md text-[10px] font-bold uppercase tracking-widest hover:opacity-90">
                WhatsApp
              </button>
              <button onClick={handleDownloadImage} className="px-3 py-1.5 bg-brand-olive text-white rounded-md text-[10px] font-bold uppercase tracking-widest hover:opacity-90">
                Image
              </button>
              <button onClick={handleDownloadPDF} className="px-3 py-1.5 bg-brand-olive text-white rounded-md text-[10px] font-bold uppercase tracking-widest hover:opacity-90">
                PDF
              </button>
              <button onClick={handleCloseModal} className="px-3 py-1.5 bg-brand-dark text-white rounded-md text-[10px] font-bold uppercase tracking-widest hover:opacity-90">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
