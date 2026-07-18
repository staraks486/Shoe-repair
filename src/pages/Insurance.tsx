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
  Search,
  Plus,
  X,
  Clock
} from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function Insurance() {
  const navigate = useNavigate();
  const location = useLocation();
  const { repairs, insurance, addInsurance, updateRepair, deleteInsurance, updateInsurance, settings, updateSettings } = useAppStore();
  
  const queryParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState<'history' | 'add-cover' | 'manage-plans'>(() => {
    const tab = queryParams.get('tab');
    if (tab === 'add-cover') return 'add-cover';
    if (tab === 'manage-plans') return 'manage-plans';
    return 'history';
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  
  // Custom Plan Management State
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [newService, setNewService] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'add-cover') {
      setActiveTab('add-cover');
    } else if (tab === 'history') {
      setActiveTab('history');
    } else if (tab === 'manage-plans') {
      setActiveTab('manage-plans');
    }
  }, [location.search]);

  const isExistingPlan = (planId: string) => {
    return (settings.insurancePlans || []).some(p => p.id === planId);
  };

  const handleAddService = () => {
    if (!newService.trim() || !editingPlan) return;
    const services = editingPlan.servicesIncluded || [];
    if (!services.includes(newService.trim())) {
      setEditingPlan({
        ...editingPlan,
        servicesIncluded: [...services, newService.trim()]
      });
    }
    setNewService('');
  };

  const handleRemoveService = (serviceName: string) => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      servicesIncluded: (editingPlan.servicesIncluded || []).filter((s: string) => s !== serviceName)
    });
  };

  const handleSavePlan = (plan: any) => {
    const currentPlans = settings.insurancePlans || [];
    let updatedPlans;
    if (currentPlans.some(p => p.id === plan.id)) {
      updatedPlans = currentPlans.map(p => p.id === plan.id ? plan : p);
    } else {
      updatedPlans = [...currentPlans, plan];
    }
    updateSettings({ insurancePlans: updatedPlans });
  };

  const handleDeletePlan = (id: string) => {
    const currentPlans = settings.insurancePlans || [];
    const updatedPlans = currentPlans.filter(p => p.id !== id);
    updateSettings({ insurancePlans: updatedPlans });
  };

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
    const chosenPlan = (settings.insurancePlans || []).find(p => p.name === formData.planName);
    const maxUsage = chosenPlan ? (chosenPlan.name.includes('Heritage') || chosenPlan.price > 5000 ? 5 : 3) : 3;
    const insurancePrice = chosenPlan ? chosenPlan.price : 0;
    
    addInsurance({
      customerPhone: formData.customerPhone,
      shoeId: formData.serialNumber,
      planName: formData.planName,
      usageCount: 0,
      maxUsage,
      status: 'Active',
      insurancePrice,
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
          <button
            type="button"
            onClick={() => {
              setActiveTab('manage-plans');
              navigate('/insurance?tab=manage-plans', { replace: true });
            }}
            className={clsx(
              "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1.5",
              activeTab === 'manage-plans'
                ? "bg-white text-brand-dark shadow-sm border border-brand-border/40" 
                : "text-brand-muted hover:text-brand-dark"
            )}
          >
            <span>🛡️ Cover Plans ({(settings.insurancePlans || []).length})</span>
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
                  {(settings.insurancePlans || []).map((tier) => (
                    <div 
                      key={tier.id}
                      onClick={() => setFormData(prev => ({ ...prev, planName: tier.name }))}
                      className={clsx(
                        "border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 relative overflow-hidden",
                        formData.planName === tier.name 
                          ? "border-brand-dark bg-brand-dark text-white shadow-xl scale-[1.02]" 
                          : "border-brand-border hover:border-brand-muted bg-white text-brand-dark"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="font-serif text-xl font-bold">{tier.name}</h4>
                          <span className={clsx(
                            "text-[9px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                            formData.planName === tier.name 
                              ? "bg-white/15 text-white border-white/20" 
                              : "bg-brand-bg text-brand-dark border-brand-border/40"
                          )}>
                            {tier.timePeriod || '12 Months'}
                          </span>
                        </div>
                        <span className="font-mono text-lg font-bold shrink-0">
                          {typeof tier.price === 'number' ? `₹${tier.price.toLocaleString()}` : tier.price}
                        </span>
                      </div>
                      <p className={clsx(
                        "text-sm mb-4 leading-relaxed",
                        formData.planName === tier.name ? "text-white/80" : "text-brand-muted"
                      )}>
                        {tier.description}
                      </p>

                      {tier.servicesIncluded && tier.servicesIncluded.length > 0 && (
                        <div className="mb-4">
                          <span className={clsx("text-[9px] font-bold uppercase tracking-wider block mb-1.5", formData.planName === tier.name ? "text-white/80" : "text-brand-muted")}>Included Services:</span>
                          <div className="flex flex-wrap gap-1">
                            {tier.servicesIncluded.map((svc, idx) => (
                              <span key={idx} className={clsx("text-[9.5px] font-semibold px-2 py-0.5 rounded-sm border", formData.planName === tier.name ? "bg-white/10 text-white border-white/10" : "bg-brand-bg text-brand-dark border-brand-border/30")}>
                                {svc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {tier.copay && (
                        <div className={clsx(
                          "inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-widest",
                          formData.planName === tier.name ? "bg-white/15" : "bg-brand-bg"
                        )}>
                          Restoration Co-pay: {tier.copay}
                        </div>
                      )}
                    </div>
                  ))}

                  {(settings.insurancePlans || []).length === 0 && (
                    <div className="text-center py-12 border border-dashed border-brand-border rounded-xl bg-brand-bg/10">
                      <p className="text-sm text-brand-muted italic">No cover plans are available. Please create them in the 'Cover Plans' tab.</p>
                    </div>
                  )}
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

      {/* Cover Plans Management Tab */}
      {activeTab === 'manage-plans' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
          
          {/* Left Column: Plan Catalog */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-brand-border rounded-xl shadow-xl p-6 md:p-8 animate-in fade-in">
              <div className="flex justify-between items-center border-b border-brand-border pb-4 mb-6">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-brand-dark">Cover Plans Catalog</h3>
                  <p className="text-xs text-brand-muted uppercase tracking-wider mt-1">Manage active protection tiers and catalogs</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPlan({
                      id: 'plan-' + Math.random().toString(36).substring(2, 9),
                      name: '',
                      description: '',
                      price: 0,
                      timePeriod: '12 Months',
                      servicesIncluded: [],
                      copay: ''
                    });
                    setNewService('');
                  }}
                  className="bg-brand-dark text-white hover:bg-brand-muted px-4 py-2 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Plan
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {(settings.insurancePlans || []).map((plan) => (
                  <div 
                    key={plan.id}
                    className="border border-brand-border hover:border-brand-muted rounded-xl p-5 bg-white transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="font-serif text-lg font-bold text-brand-dark">{plan.name}</h4>
                          <span className="text-[9px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded bg-brand-bg text-brand-dark border border-brand-border/45">
                            {plan.timePeriod || '12 Months'}
                          </span>
                        </div>
                        <span className="font-mono text-base font-bold text-brand-dark shrink-0">
                          {typeof plan.price === 'number' ? `₹${plan.price.toLocaleString()}` : plan.price}
                        </span>
                      </div>

                      <p className="text-xs text-brand-muted mb-4 leading-relaxed">
                        {plan.description}
                      </p>

                      {plan.servicesIncluded && plan.servicesIncluded.length > 0 && (
                        <div className="mb-4">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-brand-dark block mb-1.5 font-sans">Included Services:</span>
                          <div className="flex flex-wrap gap-1">
                            {plan.servicesIncluded.map((svc, i) => (
                              <span key={i} className="text-[9.5px] font-semibold px-2 py-0.5 rounded-sm bg-brand-bg text-brand-dark border border-brand-border/30">
                                {svc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {plan.copay && (
                        <div className="inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-widest bg-brand-bg text-brand-muted text-[10px]">
                          Restoration Co-pay: <span className="text-brand-dark font-mono font-bold">{plan.copay}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-brand-bg mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPlan(plan);
                          setNewService('');
                        }}
                        className="text-brand-muted hover:text-brand-dark font-bold uppercase tracking-widest text-[9px] flex items-center gap-1 p-1 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> Modify
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete the "${plan.name}" plan?`)) {
                            handleDeletePlan(plan.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 font-bold uppercase tracking-widest text-[9px] flex items-center gap-1 p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}

                {(settings.insurancePlans || []).length === 0 && (
                  <div className="text-center py-12 border border-dashed border-brand-border rounded-xl bg-brand-bg/10">
                    <p className="text-sm text-brand-muted italic">No cover plans registered yet. Click 'Add Plan' to start designing.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Add/Edit Panel */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-brand-border rounded-xl shadow-xl p-6 md:p-8 space-y-6 lg:sticky lg:top-6">
              <div>
                <h3 className="font-serif text-xl font-bold text-brand-dark">
                  {editingPlan ? (isExistingPlan(editingPlan.id) ? 'Modify Cover Plan' : 'Create Custom Plan') : 'Plan Designer'}
                </h3>
                <p className="text-xs text-brand-muted uppercase tracking-wider mt-1">
                  {editingPlan ? 'Refine pricing, coverage structure & services' : 'Select a plan to edit or create a brand new tier'}
                </p>
              </div>

              {editingPlan ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-dark mb-1 uppercase tracking-widest">Plan Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. The Sapphire Shield"
                      value={editingPlan.name} 
                      onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} 
                      className="w-full border border-brand-border rounded-md p-2.5 text-sm bg-brand-bg focus:outline-none focus:border-brand-dark" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-brand-dark mb-1 uppercase tracking-widest">Price (₹)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 3500"
                        value={editingPlan.price || ''} 
                        onChange={e => setEditingPlan({...editingPlan, price: parseFloat(e.target.value) || 0})} 
                        className="w-full border border-brand-border rounded-md p-2.5 text-sm bg-brand-bg focus:outline-none focus:border-brand-dark font-mono" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-brand-dark mb-1 uppercase tracking-widest">Time Period</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 12 Months, Lifetime"
                        value={editingPlan.timePeriod} 
                        onChange={e => setEditingPlan({...editingPlan, timePeriod: e.target.value})} 
                        className="w-full border border-brand-border rounded-md p-2.5 text-sm bg-brand-bg focus:outline-none focus:border-brand-dark" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-brand-dark mb-1 uppercase tracking-widest">Restoration Co-pay (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. ₹499, Free"
                      value={editingPlan.copay || ''} 
                      onChange={e => setEditingPlan({...editingPlan, copay: e.target.value})} 
                      className="w-full border border-brand-border rounded-md p-2.5 text-sm bg-brand-bg focus:outline-none focus:border-brand-dark" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-brand-dark mb-1 uppercase tracking-widest">Description</label>
                    <textarea 
                      placeholder="Bespoke protection details..."
                      rows={3}
                      value={editingPlan.description} 
                      onChange={e => setEditingPlan({...editingPlan, description: e.target.value})} 
                      className="w-full border border-brand-border rounded-md p-2.5 text-sm bg-brand-bg focus:outline-none focus:border-brand-dark leading-relaxed" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-brand-dark mb-1.5 uppercase tracking-widest">Included Services List</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="e.g. Annual Conditioning"
                        value={newService} 
                        onChange={e => setNewService(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddService();
                          }
                        }}
                        className="flex-1 border border-brand-border rounded-md p-2.5 text-sm bg-brand-bg focus:outline-none focus:border-brand-dark" 
                      />
                      <button
                        type="button"
                        onClick={handleAddService}
                        className="bg-brand-dark text-white px-4 rounded font-bold text-xs uppercase tracking-widest hover:bg-brand-muted transition-colors cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(editingPlan.servicesIncluded || []).map((svc: string, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1.5 text-[9.5px] font-semibold px-2.5 py-1 rounded bg-brand-bg text-brand-dark border border-brand-border/40">
                          <span>{svc}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(svc)}
                            className="text-brand-muted hover:text-red-500 font-bold focus:outline-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {(editingPlan.servicesIncluded || []).length === 0 && (
                        <span className="text-[10px] text-brand-muted italic">No specific services added yet</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-brand-border">
                    <button 
                      type="button" 
                      onClick={() => setEditingPlan(null)} 
                      className="flex-1 px-4 py-2.5 border border-brand-border rounded text-xs font-bold uppercase tracking-widest hover:bg-brand-bg text-center cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        if (!editingPlan.name.trim()) return alert('Plan Name is required');
                        handleSavePlan(editingPlan);
                        setEditingPlan(null);
                      }} 
                      className="flex-1 px-4 py-2.5 bg-brand-olive text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-opacity-95 text-center shadow-md border border-brand-olive/20 cursor-pointer"
                    >
                      Save Plan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-brand-border rounded-xl bg-brand-bg/5 space-y-2">
                  <Shield className="w-8 h-8 text-brand-muted mx-auto opacity-40" />
                  <p className="text-xs text-brand-muted font-medium max-w-[200px] mx-auto">
                    Select a plan from the list to modify its details, or create a new custom tier catalog.
                  </p>
                </div>
              )}
            </div>
          </div>

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
