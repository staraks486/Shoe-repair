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
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export default function Insurance() {
  const navigate = useNavigate();
  const location = useLocation();
  const { repairs, insurance, addInsurance, updateRepair, deleteInsurance, updateInsurance, settings, updateSettings } = useAppStore();
  
  const queryParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState<'history' | 'add-cover' | 'manage-plans'>(() => {
    const tab = queryParams.get('tab');
    if (tab === 'history') return 'history';
    if (tab === 'manage-plans') return 'manage-plans';
    return 'add-cover';
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 space-y-12 pb-24 animate-in fade-in duration-300">
      
      {/* HEADER: Matching Artisan style */}
      <header className="flex flex-col sm:flex-row justify-between items-center gap-6 py-8">
        <div className="flex bg-white p-1 rounded-full border border-brand-border shadow-premium shrink-0">
          {[
            { id: 'history', label: 'Archive' },
            { id: 'add-cover', label: 'Enroll' },
            { id: 'manage-plans', label: 'Tiers' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                navigate(`/insurance?tab=${tab.id}`, { replace: true });
              }}
              className={clsx(
                "px-8 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all",
                activeTab === tab.id
                  ? "bg-brand-dark text-white shadow-lg" 
                  : "text-brand-muted hover:text-brand-dark"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Care History (Policy List) Tab */}
      {activeTab === 'history' && (
        <div className="premium-card overflow-hidden p-8 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-brand-border pb-8">
            <div className="space-y-1">
              <h3 className="font-display text-2xl font-black text-brand-dark">Active Policies</h3>
              <p className="label-xs">Asset Preservation Status</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
              <input
                type="text"
                placeholder="Filter policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-brand-bg border-none rounded-full text-xs font-bold shadow-inner focus:ring-0"
              />
            </div>
          </div>

          {filteredCovers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCovers.map((policy) => (
                <div 
                  key={policy.id}
                  className="bg-white p-6 rounded-[32px] border border-brand-border hover:shadow-premium transition-all group flex flex-col justify-between min-h-[220px]"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">{policy.invoiceNumber}</p>
                        <h4 className="font-display text-lg font-bold text-brand-dark leading-tight">{policy.shoeModel}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-display font-black text-brand-dark tracking-tighter">₹{policy.insurancePrice?.toLocaleString() || '0'}</p>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-50 text-green-700 border border-green-100 mt-2">
                          Active
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 bg-brand-bg rounded-md text-[9px] font-black text-brand-muted uppercase tracking-tight">
                        {policy.insuranceType || 'Standard Plan'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end pt-4 border-t border-brand-border/40 mt-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">{policy.customerName}</p>
                      <p className="text-[9px] font-bold text-brand-olive uppercase tracking-widest">
                        {format(new Date(policy.createdAt), 'dd MMM, yyyy')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingPolicy(policy)}
                        className="p-2 text-brand-muted hover:text-brand-dark transition-colors"
                        title="Edit Record"
                      >
                        <Edit className="w-4 h-4" />
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
                        className="p-2 text-brand-muted hover:text-red-500 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-brand-border rounded-[32px] bg-brand-bg/5 space-y-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-brand-border">
                <Shield className="w-6 h-6 text-brand-muted opacity-40" />
              </div>
              <p className="text-[11px] font-bold text-brand-muted uppercase tracking-tighter leading-relaxed max-w-[200px] mx-auto">
                {searchQuery ? 'No matching protection records found.' : 'No active policies registered in the archive.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Cover Tab */}
      {activeTab === 'add-cover' && (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-300">
          
          {currentStep === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand-dark text-white p-8 md:p-12 rounded-[2.5rem] shadow-xl relative overflow-hidden group mb-8"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-brand-accent/20 transition-all duration-700" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-olive/20 rounded-full blur-[60px] -ml-24 -mb-24 group-hover:bg-brand-olive/30 transition-all duration-700" />
              
              <div className="relative z-10 flex flex-col items-center md:items-start">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                  <div className="px-3 py-1 rounded-full bg-brand-accent/20 border border-brand-accent/30">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-accent">
                      Asset Preservation
                    </span>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-brand-accent animate-pulse" />
                </div>
                
                <h2 className="font-display text-4xl md:text-5xl font-black mb-6 tracking-tight leading-none text-white text-center md:text-left">
                  The <span className="text-brand-accent">Cordwainers</span> Guarantee
                </h2>
                
                <p className="text-base text-brand-bg/80 max-w-xl leading-relaxed font-medium text-center md:text-left mb-8">
                  Register your luxury footwear in our global vault. CW Cover provides comprehensive protection against the elements, ensuring your investment retains its character for generations.
                </p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-8">
                  <div className="flex flex-col items-center md:items-start">
                    <span className="text-2xl font-display font-black text-white">Lifetime</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-brand-muted">Restoration Support</span>
                  </div>
                  <div className="h-10 w-px bg-white/10 hidden md:block" />
                  <div className="flex flex-col items-center md:items-start">
                    <span className="text-2xl font-display font-black text-white">Global</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-brand-muted">Registry Access</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Progress Indicator */}
          <div className="max-w-2xl mx-auto px-4 md:px-0">
            <div className="flex justify-between mb-4">
              {['Identity', 'Registry', 'Coverage', 'Mandates', 'Attestation'].map((step, idx) => (
                <span key={step} className={clsx(
                  "text-[10px] font-black uppercase tracking-widest transition-colors duration-500",
                  idx <= currentStep ? "text-brand-dark" : "text-brand-muted opacity-40",
                  "hidden md:block"
                )}>
                  {step}
                </span>
              ))}
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark md:hidden block">
                PHASE {currentStep + 1} OF 5
              </span>
            </div>
            <div className="h-1 bg-brand-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-dark transition-all duration-700 ease-out shadow-premium"
                style={{ width: `${((currentStep + 1) / 5) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="premium-card overflow-hidden">
            
            {currentStep === 0 && (
              <div className="p-10 md:p-16 space-y-10 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center space-y-2 mb-10">
                  <h3 className="font-display text-3xl font-black text-brand-dark">Client Identity</h3>
                  <p className="label-xs">Bespoke Registry Admission</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="md:col-span-2 space-y-2">
                    <label className="label-xs ml-1">Full Legal Name</label>
                    <input required type="text" name="customerName" value={formData.customerName} onChange={handleChange}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-lg font-bold focus:ring-0 placeholder-brand-muted/30" placeholder="Alistair Sterling" />
                  </div>
                  <div className="space-y-2">
                    <label className="label-xs ml-1">Secure Contact</label>
                    <input required type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleChange}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-bold focus:ring-0 placeholder-brand-muted/30" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="space-y-2">
                    <label className="label-xs ml-1">Digital Address</label>
                    <input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-bold focus:ring-0 placeholder-brand-muted/30" placeholder="client@estate.com" />
                  </div>
                </div>
              </div>
            )}
            
            {currentStep === 1 && (
              <div className="p-10 md:p-16 space-y-10 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center space-y-2 mb-10">
                  <h3 className="font-display text-3xl font-black text-brand-dark">Asset Registration</h3>
                  <p className="label-xs">Footwear Provenance Details</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="md:col-span-2 space-y-2">
                    <label className="label-xs ml-1">Model / Collection</label>
                    <input required type="text" name="shoeModel" value={formData.shoeModel} onChange={handleChange}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-lg font-bold focus:ring-0" placeholder="The Oxford Heritage" />
                  </div>
                  <div className="space-y-2">
                    <label className="label-xs ml-1">Hide Classification</label>
                    <select name="leatherType" value={formData.leatherType} onChange={handleChange}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-bold focus:ring-0 appearance-none">
                      <option value="Full-Grain">Full-Grain Leather</option>
                      <option value="Calfskin">Premium Calfskin</option>
                      <option value="Suede">Luxury Suede</option>
                      <option value="Cordovan">Shell Cordovan</option>
                      <option value="Exotic">Exotic Hide</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="label-xs ml-1">CW Serial Registry</label>
                    <input required type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-mono font-bold focus:ring-0" placeholder="CW-889-V2" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="label-xs ml-1">Patina Characteristics</label>
                    <input type="text" name="patinaDetails" value={formData.patinaDetails} onChange={handleChange}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-bold focus:ring-0" placeholder="Midnight Blue gradient..." />
                  </div>
                  <div className="space-y-2">
                    <label className="label-xs ml-1">Acquisition Date</label>
                    <input required type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-bold focus:ring-0" />
                  </div>
                  <div className="md:col-span-2 mt-4 space-y-4">
                    <label className="label-xs ml-1">Authentication Dossier</label>
                    <div className="border-2 border-dashed border-brand-border rounded-[24px] p-12 text-center hover:bg-brand-bg transition-colors cursor-pointer group">
                      <Upload className="w-10 h-10 text-brand-muted mx-auto mb-4 group-hover:text-brand-dark transition-colors" />
                      <p className="text-xs font-black uppercase tracking-widest text-brand-dark mb-2">Upload Certificates</p>
                      <p className="text-[10px] text-brand-muted uppercase font-bold tracking-tighter">PDF, JPG, or PNG up to 10MB</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="p-10 md:p-16 space-y-10 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center space-y-2 mb-10">
                  <h3 className="font-display text-3xl font-black text-brand-dark">Coverage Tiers</h3>
                  <p className="label-xs">Asset Protection Selection</p>
                </div>
                <div className="space-y-6">
                  {(settings.insurancePlans || []).map((tier) => (
                    <div 
                      key={tier.id}
                      onClick={() => setFormData(prev => ({ ...prev, planName: tier.name }))}
                      className={clsx(
                        "border rounded-[24px] p-8 cursor-pointer transition-all duration-500 relative overflow-hidden",
                        formData.planName === tier.name 
                          ? "bg-brand-dark text-white shadow-2xl scale-[1.01]" 
                          : "border-brand-border hover:bg-brand-bg bg-white text-brand-dark"
                      )}
                    >
                      <div className="flex justify-between items-start mb-4 gap-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="font-display text-2xl font-bold">{tier.name}</h4>
                          <span className={clsx(
                            "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                            formData.planName === tier.name 
                              ? "bg-white/10 text-white border-white/20" 
                              : "bg-brand-bg text-brand-dark border-brand-border"
                          )}>
                            {tier.timePeriod || '12 Months'}
                          </span>
                        </div>
                        <span className="font-mono text-xl font-bold shrink-0">
                          {typeof tier.price === 'number' ? `₹${tier.price.toLocaleString()}` : tier.price}
                        </span>
                      </div>
                      <p className={clsx(
                        "text-sm mb-6 leading-relaxed opacity-80",
                        formData.planName === tier.name ? "text-white" : "text-brand-muted"
                      )}>
                        {tier.description}
                      </p>

                      {tier.servicesIncluded && tier.servicesIncluded.length > 0 && (
                        <div className="mb-6">
                          <span className={clsx("label-xs mb-3 block", formData.planName === tier.name ? "text-white" : "text-brand-dark")}>Included Services:</span>
                          <div className="flex flex-wrap gap-2">
                            {tier.servicesIncluded.map((svc, idx) => (
                              <span key={idx} className={clsx("text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border", formData.planName === tier.name ? "bg-white/10 text-white border-white/10" : "bg-brand-bg text-brand-dark border-brand-border")}>
                                {svc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {tier.copay && (
                        <div className={clsx(
                          "inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                          formData.planName === tier.name ? "bg-white/10 text-white" : "bg-brand-bg text-brand-muted"
                        )}>
                          Co-pay: {tier.copay}
                        </div>
                      )}
                    </div>
                  ))}

                  {(settings.insurancePlans || []).length === 0 && (
                    <div className="text-center py-12 border border-dashed border-brand-border rounded-[24px] bg-brand-bg/10">
                      <p className="text-sm text-brand-muted italic">No cover plans are available. Please create them in the 'Cover Plans' tab.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="p-10 md:p-16 space-y-10 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center space-y-2 mb-10">
                  <h3 className="font-display text-3xl font-black text-brand-dark">Terms of Mandate</h3>
                  <p className="label-xs">Artisanal Preservation Rules</p>
                </div>
                
                <div className="max-w-none text-brand-dark space-y-10">
                  <div className="space-y-4">
                    <h4 className="label-xs text-brand-dark border-b border-brand-border pb-3">Included Coverages</h4>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-4 text-sm font-bold"><div className="w-2 h-2 rounded-full bg-brand-olive" /> Accidental tearing of internal lining</li>
                      <li className="flex items-center gap-4 text-sm font-bold"><div className="w-2 h-2 rounded-full bg-brand-olive" /> Deep gouges to the leather upper</li>
                      <li className="flex items-center gap-4 text-sm font-bold"><div className="w-2 h-2 rounded-full bg-brand-olive" /> Structural heel block failure</li>
                      <li className="flex items-center gap-4 text-sm font-bold"><div className="w-2 h-2 rounded-full bg-brand-olive" /> Stitching failure under respectful wear</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="label-xs text-brand-muted border-b border-brand-border pb-3">Strict Exclusions</h4>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-4 text-sm font-bold text-brand-muted"><div className="w-2 h-2 rounded-full bg-brand-border" /> Normal expected leather creasing</li>
                      <li className="flex items-center gap-4 text-sm font-bold text-brand-muted"><div className="w-2 h-2 rounded-full bg-brand-border" /> Improper DIY conditioning damage</li>
                      <li className="flex items-center gap-4 text-sm font-bold text-brand-muted"><div className="w-2 h-2 rounded-full bg-brand-border" /> Exposure to extreme heat sources</li>
                      <li className="flex items-center gap-4 text-sm font-bold text-brand-muted"><div className="w-2 h-2 rounded-full bg-brand-border" /> Unauthorized third-party repairs</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}            {currentStep === 4 && (
              <div className="p-10 md:p-16 space-y-10 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center space-y-2 mb-10">
                  <h3 className="font-display text-3xl font-black text-brand-dark">Attestation</h3>
                  <p className="label-xs">Final Policy Authorization</p>
                </div>

                <div className="bg-brand-bg p-8 rounded-[24px] mb-10 space-y-6">
                  <div className="space-y-2">
                    <h4 className="label-xs text-brand-dark">Restoration Protocol</h4>
                    <p className="text-[11px] font-bold text-brand-muted leading-relaxed uppercase tracking-tighter">
                      In the event that a restoration is required, you must initiate a request through this portal. High-resolution photographs of the affected leather or sole must be provided prior to shipping.
                    </p>
                  </div>
                  <div className="border-2 border-dashed border-brand-border bg-white rounded-[20px] p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors group">
                    <Upload className="w-8 h-8 text-brand-muted mx-auto mb-3 group-hover:text-brand-dark transition-colors" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark">Upload current condition photos</p>
                  </div>
                </div>

                <div className="pt-10 border-t border-brand-border space-y-10">
                  <div className="space-y-4">
                    <h4 className="label-xs text-brand-dark">Client Verification Statement</h4>
                    
                    <label className="flex items-start gap-5 cursor-pointer group">
                      <div className="pt-1">
                        <input 
                          type="checkbox" 
                          name="agreementAccepted"
                          checked={formData.agreementAccepted}
                          onChange={handleChange}
                          className="w-6 h-6 rounded-[8px] border-brand-border text-brand-dark focus:ring-0 cursor-pointer" 
                        />
                      </div>
                      <span className="text-sm font-bold text-brand-dark leading-relaxed group-hover:text-black transition-colors">
                        I, <span className="font-black underline decoration-brand-olive underline-offset-4">{formData.customerName || 'the client'}</span>, confirm the authenticity of the registered product and agree to abide by the standard luxury leather storage guidelines.
                      </span>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <label className="label-xs ml-1">Digital Autograph</label>
                    <input required type="text" name="signature" value={formData.signature} onChange={handleChange}
                      className="w-full px-6 py-6 bg-brand-bg border-none rounded-[20px] text-2xl font-display italic text-brand-dark focus:ring-0 placeholder-brand-muted/30 shadow-inner" placeholder="Type full name to sign" />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-brand-bg p-8 md:p-12 flex items-center justify-between border-t border-brand-border">
              {currentStep > 0 ? (
                <button type="button" onClick={() => setCurrentStep(s => s - 1)} 
                  className="px-8 py-3 bg-white text-brand-dark rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-border transition-all border border-brand-border flex items-center gap-2">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              ) : <div></div>}
              
              {currentStep < 4 ? (
                <button type="button" onClick={nextStep} 
                  className="px-12 py-3 bg-brand-dark text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent transition-all shadow-lg active:scale-95 flex items-center gap-2">
                  Continue
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button type="submit" 
                  className="px-12 py-3 bg-brand-olive text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-lg active:scale-95 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Activate Protection
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Cover Plans Management Tab */}
      {activeTab === 'manage-plans' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start animate-in fade-in duration-300">
          
          {/* Left Column: Plan Catalog */}
          <div className="lg:col-span-7 space-y-8">
            <div className="premium-card p-8 md:p-10 animate-in fade-in">
              <div className="flex justify-between items-center border-b border-brand-border pb-6 mb-8">
                <div className="space-y-1">
                  <h3 className="font-display text-2xl font-black text-brand-dark">Plan Catalog</h3>
                  <p className="label-xs">Active Protection Offerings</p>
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
                  className="bg-brand-dark text-white hover:bg-brand-accent px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  <Plus className="w-4 h-4" /> New Tier
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {(settings.insurancePlans || []).map((plan) => (
                  <div 
                    key={plan.id}
                    className="border border-brand-border hover:border-brand-muted rounded-[24px] p-6 bg-white transition-all duration-300 flex flex-col justify-between group hover:shadow-xl"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="font-display text-xl font-bold text-brand-dark">{plan.name}</h4>
                          <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-brand-bg text-brand-dark border border-brand-border">
                            {plan.timePeriod || '12 Months'}
                          </span>
                        </div>
                        <span className="font-mono text-lg font-bold text-brand-dark shrink-0">
                          {typeof plan.price === 'number' ? `₹${plan.price.toLocaleString()}` : plan.price}
                        </span>
                      </div>

                      <p className="text-[11px] font-bold text-brand-muted mb-6 leading-relaxed uppercase tracking-tighter">
                        {plan.description}
                      </p>

                      {plan.servicesIncluded && plan.servicesIncluded.length > 0 && (
                        <div className="mb-6">
                          <span className="label-xs text-brand-dark block mb-3">Included Services:</span>
                          <div className="flex flex-wrap gap-2">
                            {plan.servicesIncluded.map((svc, i) => (
                              <span key={i} className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-brand-bg text-brand-dark border border-brand-border">
                                {svc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {plan.copay && (
                        <div className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand-bg text-brand-muted">
                          Co-pay: <span className="text-brand-dark font-mono font-bold">{plan.copay}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-brand-bg mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPlan(plan);
                          setNewService('');
                        }}
                        className="text-brand-muted hover:text-brand-dark font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-colors"
                      >
                        <Edit className="w-4 h-4" /> Modify
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete the "${plan.name}" plan?`)) {
                            handleDeletePlan(plan.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                ))}

                {(settings.insurancePlans || []).length === 0 && (
                  <div className="text-center py-16 border border-dashed border-brand-border rounded-[24px] bg-brand-bg/10">
                    <p className="text-xs font-bold text-brand-muted uppercase tracking-widest">No plans registered</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Add/Edit Panel */}
          <div className="lg:col-span-5">
            <div className="premium-card p-8 md:p-10 lg:sticky lg:top-6">
              <div className="flex items-center gap-3 mb-8 border-b border-brand-border pb-4">
                <Shield className="w-5 h-5 text-brand-olive" />
                <h3 className="font-display text-xl font-bold text-brand-dark">
                  {editingPlan ? (isExistingPlan(editingPlan.id) ? 'Refine Tier' : 'Policy Forge') : 'Plan Designer'}
                </h3>
              </div>

              {editingPlan ? (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                  <div className="space-y-2">
                    <label className="label-xs ml-1">Tier Designation</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Platinum Reserve"
                      value={editingPlan.name} 
                      onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} 
                      className="w-full px-5 py-3.5 bg-brand-bg border-none rounded-[16px] text-sm font-bold focus:ring-0 placeholder-brand-muted/30" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="label-xs ml-1">Annual Premium</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 5500"
                        value={editingPlan.price || ''} 
                        onChange={e => setEditingPlan({...editingPlan, price: parseFloat(e.target.value) || 0})} 
                        className="w-full px-5 py-3.5 bg-brand-bg border-none rounded-[16px] text-sm font-mono font-bold focus:ring-0 placeholder-brand-muted/30" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="label-xs ml-1">Duration</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 12 Months"
                        value={editingPlan.timePeriod} 
                        onChange={e => setEditingPlan({...editingPlan, timePeriod: e.target.value})} 
                        className="w-full px-5 py-3.5 bg-brand-bg border-none rounded-[16px] text-sm font-bold focus:ring-0 placeholder-brand-muted/30" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="label-xs ml-1">Restoration Co-pay</label>
                    <input 
                      type="text" 
                      placeholder="e.g. ₹499"
                      value={editingPlan.copay || ''} 
                      onChange={e => setEditingPlan({...editingPlan, copay: e.target.value})} 
                      className="w-full px-5 py-3.5 bg-brand-bg border-none rounded-[16px] text-sm font-bold focus:ring-0 placeholder-brand-muted/30" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="label-xs ml-1">Tier Narrative</label>
                    <textarea 
                      placeholder="Describe the preservation limits..."
                      rows={3}
                      value={editingPlan.description} 
                      onChange={e => setEditingPlan({...editingPlan, description: e.target.value})} 
                      className="w-full px-5 py-3.5 bg-brand-bg border-none rounded-[16px] text-sm font-bold focus:ring-0 leading-relaxed resize-none placeholder-brand-muted/30" 
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-brand-bg">
                    <label className="label-xs ml-1">Inclusions Manifesto</label>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        placeholder="New service..."
                        value={newService} 
                        onChange={e => setNewService(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddService();
                          }
                        }}
                        className="flex-1 px-5 py-3.5 bg-brand-bg border-none rounded-[16px] text-sm font-bold focus:ring-0 placeholder-brand-muted/30" 
                      />
                      <button
                        type="button"
                        onClick={handleAddService}
                        className="bg-brand-dark text-white px-6 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-brand-accent transition-all active:scale-95 shadow-lg"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(editingPlan.servicesIncluded || []).map((svc: string, i: number) => (
                        <span key={i} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full bg-brand-bg text-brand-dark border border-brand-border">
                          <span>{svc}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(svc)}
                            className="text-brand-muted hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {(editingPlan.servicesIncluded || []).length === 0 && (
                        <span className="text-[10px] text-brand-muted font-bold uppercase tracking-tighter opacity-50 ml-1 italic">Manifest is empty</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-8">
                    <button 
                      type="button" 
                      onClick={() => setEditingPlan(null)} 
                      className="flex-1 px-6 py-3.5 bg-white border border-brand-border text-brand-muted rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-bg transition-all"
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
                      className="flex-1 px-6 py-3.5 bg-brand-olive text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-xl"
                    >
                      Commit Tier
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-brand-border rounded-[24px] bg-brand-bg/5 space-y-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-brand-border">
                    <Shield className="w-6 h-6 text-brand-muted opacity-40" />
                  </div>
                  <p className="text-[11px] font-bold text-brand-muted uppercase tracking-tighter leading-relaxed max-w-[200px] mx-auto">
                    Select a tier designation to refine its parameters or create a new catalog entry.
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
            <h3 className="text-lg font-bold font-display mb-4 text-brand-dark border-b border-brand-border pb-2">Edit Policy</h3>
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
