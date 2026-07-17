import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Edit, 
  Trash2, 
  Upload, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Search 
} from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function Insurance() {
  const navigate = useNavigate();
  const location = useLocation();
  const { repairs, insurance, addInsurance, updateRepair, deleteInsurance, updateInsurance } = useAppStore();
  
  const queryParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState<'history' | 'add-cover'>(() => {
    const tab = queryParams.get('tab');
    if (tab === 'add-cover') {
      return 'add-cover';
    }
    return 'history';
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPolicy, setEditingPolicy] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'add-cover') {
      setActiveTab('add-cover');
    } else if (tab === 'history') {
      setActiveTab('history');
    }
  }, [location.search]);

  // Combine repairs that have insurance, and standalone insurance policies
  const insuredRepairs = [
    ...repairs.filter(r => r.hasInsurance).map(r => ({
      id: r.id,
      customerName: r.customerName,
      shoeModel: r.shoeModel,
      invoiceNumber: r.invoiceNumber,
      insuranceType: r.insuranceType,
      createdAt: r.createdAt,
      insurancePrice: r.insurancePrice,
      isStandalone: false
    })),
    ...insurance.map(i => ({
      id: i.id,
      customerName: i.customerName,
      shoeModel: i.shoeModel,
      invoiceNumber: i.insurancePolicyNumber,
      insuranceType: i.insuranceType,
      createdAt: i.createdAt,
      insurancePrice: i.insurancePrice,
      isStandalone: true
    }))
  ];

  // Sort by date descending
  insuredRepairs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Apply search query
  const filteredCovers = insuredRepairs.filter(c => {
    const term = searchQuery.toLowerCase();
    return (
      c.customerName.toLowerCase().includes(term) ||
      (c.shoeModel && c.shoeModel.toLowerCase().includes(term)) ||
      (c.invoiceNumber && c.invoiceNumber.toLowerCase().includes(term)) ||
      (c.insuranceType && c.insuranceType.toLowerCase().includes(term))
    );
  });

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shoeModel: '',
    leatherType: 'Full-Grain',
    patinaDetails: '',
    serialNumber: '',
    purchaseDate: '',
    planName: '',
    agreementAccepted: false,
    signature: ''
  });

  const tiers = [
    {
      name: 'The Artisan Care Tier',
      price: '₹2,499',
      description: 'Covers accidental scuffs, deep leather staining, and premature sole or welt separation. Includes complimentary annual conditioning.',
      copay: '₹499'
    },
    {
      name: 'The Executive Travel Tier',
      price: '₹4,999',
      description: 'Adds coverage for transit damage, airline loss, and accidental liquid/chemical spills.',
      copay: '₹999'
    },
    {
      name: 'The Heritage Vault Tier',
      price: '₹9,999',
      description: 'Full replacement or expert restoration coverage against fire, theft, water damage, or catastrophic leather degradation.',
      copay: '₹1,999'
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreementAccepted) {
      alert("Please accept the terms to proceed.");
      return;
    }
    addInsurance({
      customerPhone: formData.customerPhone,
      shoeId: formData.serialNumber,
      planName: formData.planName,
      usageCount: 0,
      maxUsage: formData.planName === 'The Heritage Vault Tier' ? 5 : 3,
      status: 'Active',
      ...formData
    } as any);

    // Reset Form
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      shoeModel: '',
      leatherType: 'Full-Grain',
      patinaDetails: '',
      serialNumber: '',
      purchaseDate: '',
      planName: '',
      agreementAccepted: false,
      signature: ''
    });
    setCurrentStep(0);
    setActiveTab('history');
    navigate('/insurance?tab=history', { replace: true });
  };

  const nextStep = () => {
    if (currentStep === 0 && (!formData.customerName || !formData.customerPhone)) return alert('Please enter client details');
    if (currentStep === 1 && (!formData.shoeModel || !formData.serialNumber)) return alert('Please enter footwear details');
    if (currentStep === 2 && !formData.planName) return alert('Please select a coverage tier');
    setCurrentStep(s => s + 1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Toggle View Segmented Control */}
      <div className="flex justify-start">
        <div className="flex bg-brand-bg p-1 rounded-lg border border-brand-border shadow-sm">
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              navigate('/insurance?tab=history', { replace: true });
            }}
            className={clsx(
              "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1.5",
              activeTab === 'history'
                ? "bg-white text-brand-dark shadow-sm border border-brand-border/40" 
                : "text-brand-muted hover:text-brand-dark"
            )}
          >
            <span>📜 Care History ({insuredRepairs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('add-cover');
              navigate('/insurance?tab=add-cover', { replace: true });
              setCurrentStep(0);
            }}
            className={clsx(
              "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1.5",
              activeTab === 'add-cover'
                ? "bg-white text-brand-dark shadow-sm border border-brand-border/40" 
                : "text-brand-muted hover:text-brand-dark"
            )}
          >
            <span>✨ Add Cover</span>
          </button>
        </div>
      </div>

      {/* Care History (Policy List) Tab */}
      {activeTab === 'history' && (
        <div className="bg-white border border-brand-border rounded-xl shadow-xl overflow-hidden p-6 md:p-8 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-brand-border pb-6">
            <div>
              <h3 className="font-serif text-2xl font-bold text-brand-dark">Care History</h3>
              <p className="text-xs text-brand-muted uppercase tracking-wider mt-1">Track active and past protection policies</p>
            </div>
            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-brand-muted" />
              </div>
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-brand-border rounded-md text-sm placeholder-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-dark focus:border-brand-dark bg-brand-bg transition-colors"
              />
            </div>
          </div>

          {filteredCovers.length > 0 ? (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-brand-border">
                  <thead>
                    <tr className="bg-brand-bg">
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Policy No / Invoice</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Customer / Shoe</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Plan Name</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Date Issued</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Status</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-brand-olive tracking-widest uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border bg-white">
                    {filteredCovers.map((policy) => (
                      <tr key={policy.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-mono font-medium text-brand-dark">
                          {policy.invoiceNumber}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-brand-dark">{policy.customerName}</div>
                          <div className="text-xs text-brand-muted mt-0.5">{policy.shoeModel}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-brand-dark">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-brand-accent flex-shrink-0" />
                            <span>{policy.insuranceType || 'Standard Plan'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-xs text-brand-muted">
                          {format(new Date(policy.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border bg-green-50 text-green-700 border-green-200">
                            <ShieldCheck className="w-3.5 h-3.5" /> Active
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            type="button"
                            onClick={() => setEditingPolicy(policy)}
                            className="text-brand-muted hover:text-brand-dark mr-3 transition-colors p-1"
                            title="Edit Record"
                          >
                            <Edit className="w-4 h-4 inline" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this cover record?')) {
                                if (policy.isStandalone) {
                                  deleteInsurance(policy.id);
                                } else {
                                  updateRepair(policy.id, { hasInsurance: false, insuranceType: '' });
                                }
                              }
                            }}
                            className="text-brand-muted hover:text-red-500 transition-colors p-1"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {filteredCovers.map((policy) => (
                  <div key={policy.id} className="border border-brand-border rounded-lg p-4 space-y-3 bg-brand-bg/20 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono font-bold text-brand-dark">{policy.invoiceNumber}</span>
                        <h4 className="font-semibold text-sm text-brand-dark mt-1">{policy.customerName}</h4>
                        <p className="text-xs text-brand-muted">{policy.shoeModel}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border bg-green-50 text-green-700 border-green-200">
                        Active
                      </span>
                    </div>

                    <div className="text-xs text-brand-dark flex flex-wrap justify-between pt-2 border-t border-brand-border/60">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-brand-accent" />
                        <span className="font-medium">{policy.insuranceType || 'Standard Plan'}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 text-[10px] text-brand-muted border-t border-brand-border/60">
                      <span>{format(new Date(policy.createdAt), 'MMMM d, yyyy')}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingPolicy(policy)}
                          className="text-brand-muted hover:text-brand-dark font-bold uppercase tracking-widest text-[10px] flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this cover record?')) {
                              if (policy.isStandalone) {
                                deleteInsurance(policy.id);
                              } else {
                                updateRepair(policy.id, { hasInsurance: false, insuranceType: '' });
                              }
                            }
                          }}
                          className="text-red-500 hover:text-red-700 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 border border-dashed border-brand-border rounded-xl bg-brand-bg/10">
              <p className="text-sm text-brand-muted italic">
                {searchQuery ? 'No cover history records found matching your query.' : 'No protection policies registered yet.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Cover Tab */}
      {activeTab === 'add-cover' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
          
          {/* Progress Indicator */}
          <div className="max-w-2xl mx-auto px-4 md:px-0">
            <div className="flex justify-between mb-4">
              {['Client Details', 'Registry', 'Coverage', 'Terms', 'Sign-Off'].map((step, idx) => (
                <span key={step} className={clsx(
                  "text-[10px] font-bold uppercase tracking-widest transition-colors duration-500",
                  idx <= currentStep ? "text-brand-dark" : "text-brand-muted opacity-40",
                  "hidden md:block"
                )}>
                  {step}
                </span>
              ))}
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-dark md:hidden block">
                Step {currentStep + 1} of 5
              </span>
            </div>
            <div className="h-1 bg-brand-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-dark transition-all duration-700 ease-out"
                style={{ width: `${((currentStep + 1) / 5) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-brand-border rounded-xl shadow-xl overflow-hidden">
            
            {currentStep === 0 && (
              <div className="p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center mb-8">
                  <h3 className="font-serif text-2xl font-bold text-brand-dark mb-2">Client Registration</h3>
                  <p className="text-sm text-brand-muted">Please provide your details for our bespoke registry.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-brand-dark mb-2 uppercase tracking-widest">Full Name</label>
                    <input required type="text" name="customerName" value={formData.customerName} onChange={handleChange}
                      className="w-full border-b-2 border-brand-border bg-transparent p-3 text-lg focus:outline-none focus:border-brand-dark transition-colors placeholder-brand-muted/30" placeholder="e.g. Alistair Sterling" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-2 uppercase tracking-widest">Mobile Number</label>
                    <input required type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleChange}
                      className="w-full border-b-2 border-brand-border bg-transparent p-3 text-lg focus:outline-none focus:border-brand-dark transition-colors placeholder-brand-muted/30" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-2 uppercase tracking-widest">Email Address</label>
                    <input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange}
                      className="w-full border-b-2 border-brand-border bg-transparent p-3 text-lg focus:outline-none focus:border-brand-dark transition-colors placeholder-brand-muted/30" placeholder="client@estate.com" />
                  </div>
                </div>
              </div>
            )}
            
            {currentStep === 1 && (
              <div className="p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center mb-8">
                  <h3 className="font-serif text-2xl font-bold text-brand-dark mb-2">Bespoke Asset Registration</h3>
                  <p className="text-sm text-brand-muted">Details of the luxury footwear to be protected.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-brand-dark mb-2 uppercase tracking-widest">Collection / Model Name</label>
                    <input required type="text" name="shoeModel" value={formData.shoeModel} onChange={handleChange}
                      className="w-full border-b-2 border-brand-border bg-transparent p-3 text-lg focus:outline-none focus:border-brand-dark transition-colors" placeholder="e.g. The Oxford Heritage" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-2 uppercase tracking-widest">Leather Type</label>
                    <select name="leatherType" value={formData.leatherType} onChange={handleChange}
                      className="w-full border-b-2 border-brand-border bg-transparent p-3 text-lg focus:outline-none focus:border-brand-dark transition-colors appearance-none">
                      <option value="Full-Grain">Full-Grain Leather</option>
                      <option value="Calfskin">Premium Calfskin</option>
                      <option value="Suede">Luxury Suede</option>
                      <option value="Cordovan">Shell Cordovan</option>
                      <option value="Exotic">Exotic Hide</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-2 uppercase tracking-widest">Serial / Batch Number</label>
                    <input required type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange}
                      className="w-full border-b-2 border-brand-border bg-transparent p-3 text-lg focus:outline-none focus:border-brand-dark transition-colors font-mono" placeholder="e.g. CW-889-V2" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-brand-dark mb-2 uppercase tracking-widest">Hand-Burnished Patina Details (Optional)</label>
                    <input type="text" name="patinaDetails" value={formData.patinaDetails} onChange={handleChange}
                      className="w-full border-b-2 border-brand-border bg-transparent p-3 text-lg focus:outline-none focus:border-brand-dark transition-colors" placeholder="e.g. Midnight Blue to Obsidian gradient" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-2 uppercase tracking-widest">Date of Purchase</label>
                    <input required type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange}
                      className="w-full border-b-2 border-brand-border bg-transparent p-3 text-lg focus:outline-none focus:border-brand-dark transition-colors font-sans text-sm" />
                  </div>
                  <div className="md:col-span-2 mt-4">
                    <label className="block text-xs font-bold text-brand-dark mb-4 uppercase tracking-widest">Documentation</label>
                    <div className="border-2 border-dashed border-brand-border rounded-xl p-8 text-center hover:bg-brand-bg transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 text-brand-muted mx-auto mb-3" />
                      <p className="text-sm font-medium text-brand-dark mb-1">Upload Certificate of Authenticity & Original Invoice</p>
                      <p className="text-xs text-brand-muted">PDF, JPG, or PNG up to 10MB</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center mb-8">
                  <h3 className="font-serif text-2xl font-bold text-brand-dark mb-2">Premium Coverage Tiers</h3>
                  <p className="text-sm text-brand-muted">Select the level of assurance appropriate for your investment.</p>
                </div>
                <div className="space-y-4">
                  {tiers.map((tier) => (
                    <div 
                      key={tier.name}
                      onClick={() => setFormData(prev => ({ ...prev, planName: tier.name }))}
                      className={clsx(
                        "border-2 rounded-xl p-6 cursor-pointer transition-all duration-300",
                        formData.planName === tier.name 
                          ? "border-brand-dark bg-brand-dark text-white shadow-xl scale-[1.02]" 
                          : "border-brand-border hover:border-brand-muted bg-white text-brand-dark"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-serif text-xl font-bold">{tier.name}</h4>
                        <span className="font-mono text-lg">{tier.price}</span>
                      </div>
                      <p className={clsx(
                        "text-sm mb-4 leading-relaxed",
                        formData.planName === tier.name ? "text-white/80" : "text-brand-muted"
                      )}>
                        {tier.description}
                      </p>
                      <div className={clsx(
                        "inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-widest",
                        formData.planName === tier.name ? "bg-white/10" : "bg-brand-bg"
                      )}>
                        Restoration Co-pay: {tier.copay}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center mb-8">
                  <h3 className="font-serif text-2xl font-bold text-brand-dark mb-2">Artisanal Terms & Exclusions</h3>
                  <p className="text-sm text-brand-muted">The Terms of Preservation.</p>
                </div>
                
                <div className="prose prose-sm max-w-none text-brand-dark space-y-8">
                  <div>
                    <h4 className="font-bold uppercase tracking-widest text-xs border-b-2 border-brand-dark pb-2 mb-4">Included Coverages</h4>
                    <ul className="space-y-3 list-none pl-0">
                      <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-brand-olive mr-3 flex-shrink-0" /> Accidental tearing of internal lining.</li>
                      <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-brand-olive mr-3 flex-shrink-0" /> Deep gouges or lacerations to the leather upper.</li>
                      <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-brand-olive mr-3 flex-shrink-0" /> Heel block snapping or structural failure.</li>
                      <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-brand-olive mr-3 flex-shrink-0" /> Stitching failure under normal, respectful wear.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold uppercase tracking-widest text-xs border-b-2 border-brand-border pb-2 mb-4">Strict Exclusions</h4>
                    <ul className="space-y-3 list-none pl-0 text-brand-muted">
                      <li className="flex items-start"><span className="w-5 h-5 flex items-center justify-center mr-3 font-bold text-red-500">×</span> Normal, expected leather creasing (which constitutes natural character).</li>
                      <li className="flex items-start"><span className="w-5 h-5 flex items-center justify-center mr-3 font-bold text-red-500">×</span> Damage resulting from improper DIY conditioning, polishing, or harsh chemicals.</li>
                      <li className="flex items-start"><span className="w-5 h-5 flex items-center justify-center mr-3 font-bold text-red-500">×</span> Exposure to extreme heat sources (e.g. drying near radiators).</li>
                      <li className="flex items-start"><span className="w-5 h-5 flex items-center justify-center mr-3 font-bold text-red-500">×</span> Unauthorized modifications or repairs by third-party cobblers.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center mb-8">
                  <h3 className="font-serif text-2xl font-bold text-brand-dark mb-2">Restoration Requests & Sign-Off</h3>
                  <p className="text-sm text-brand-muted">Finalize your Cordwainers cover policy.</p>
                </div>

                <div className="bg-brand-bg p-6 rounded-xl mb-8">
                  <h4 className="font-bold uppercase tracking-widest text-xs mb-4">Restoration & Claims Protocol</h4>
                  <p className="text-sm text-brand-muted mb-4">
                    In the event that a restoration is required, you must initiate a request through this portal. High-resolution photographs of the affected leather or sole must be provided prior to shipping the item to our ateliers.
                  </p>
                  <div className="border-2 border-dashed border-brand-border bg-white rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="w-6 h-6 text-brand-muted mx-auto mb-2" />
                    <p className="text-xs font-medium text-brand-dark">Upload current condition photos (Optional for setup)</p>
                  </div>
                </div>

                <div className="border-t border-brand-border pt-8">
                  <h4 className="font-bold uppercase tracking-widest text-xs mb-6">Client Verification Statement</h4>
                  
                  <div className="space-y-6">
                    <label className="flex items-start space-x-4 cursor-pointer group">
                      <div className="pt-1">
                        <input 
                          type="checkbox" 
                          name="agreementAccepted"
                          checked={formData.agreementAccepted}
                          onChange={handleChange}
                          className="w-5 h-5 rounded border-brand-border text-brand-dark focus:ring-brand-dark cursor-pointer" 
                        />
                      </div>
                      <span className="text-sm text-brand-dark leading-relaxed group-hover:text-black transition-colors">
                        I, <span className="font-bold">{formData.customerName || '[Client Name]'}</span>, confirm the authenticity of the registered product and agree to abide by the standard luxury leather storage guidelines to maintain this protection active. I understand the exclusions listed within the Artisanal Terms.
                      </span>
                    </label>

                    <div>
                      <label className="block text-xs font-bold text-brand-dark mb-2 uppercase tracking-widest">Digital Signature</label>
                      <input required type="text" name="signature" value={formData.signature} onChange={handleChange}
                        className="w-full border-b-2 border-brand-border bg-transparent p-4 text-xl font-serif italic focus:outline-none focus:border-brand-dark transition-colors placeholder-brand-muted/30" placeholder="Type your full name to sign" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-6 md:p-8 flex items-center justify-between border-t border-brand-border">
              {currentStep > 0 ? (
                <button type="button" onClick={() => setCurrentStep(s => s - 1)} 
                  className="flex items-center space-x-2 text-brand-muted hover:text-brand-dark transition-colors font-bold uppercase tracking-widest text-xs px-4 py-3">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Return</span>
                </button>
              ) : <div></div>}
              
              {currentStep < 4 ? (
                <button type="button" onClick={nextStep} 
                  className="flex items-center space-x-2 bg-brand-dark text-white px-8 py-3 rounded text-xs font-bold uppercase tracking-widest hover:bg-brand-muted transition-colors">
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" 
                  className="flex items-center space-x-2 bg-brand-olive text-white px-8 py-3 rounded text-xs font-bold uppercase tracking-widest hover:bg-opacity-90 transition-colors shadow-lg">
                  <FileText className="w-4 h-4" />
                  <span>Activate Cover</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Editing Policy Modal */}
      {editingPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-md animate-in zoom-in-95">
            <h3 className="text-lg font-bold font-serif mb-4 text-brand-dark border-b border-brand-border pb-2">Edit Policy</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1 uppercase tracking-widest">Customer Name</label>
                <input type="text" value={editingPolicy.customerName} onChange={e => setEditingPolicy({...editingPolicy, customerName: e.target.value})} className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg focus:outline-none focus:border-brand-dark" />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1 uppercase tracking-widest">Plan Type</label>
                <input type="text" value={editingPolicy.insuranceType} onChange={e => setEditingPolicy({...editingPolicy, insuranceType: e.target.value})} className="w-full border border-brand-border rounded-md p-2 text-sm bg-brand-bg focus:outline-none focus:border-brand-dark" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-brand-border">
                <button onClick={() => setEditingPolicy(null)} className="px-4 py-2 border border-brand-border rounded-md text-xs font-bold uppercase tracking-widest hover:bg-brand-bg">Cancel</button>
                <button onClick={() => { 
                  if (editingPolicy.isStandalone) {
                    updateInsurance(editingPolicy.id, { customerName: editingPolicy.customerName, insuranceType: editingPolicy.insuranceType });
                  } else {
                    updateRepair(editingPolicy.id, { customerName: editingPolicy.customerName, insuranceType: editingPolicy.insuranceType });
                  }
                  setEditingPolicy(null); 
                }} className="px-4 py-2 bg-brand-dark text-white rounded-md text-xs font-bold uppercase tracking-widest hover:opacity-90">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
