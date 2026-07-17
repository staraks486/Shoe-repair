import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { RepairStatus, ShoeRepairRequest } from '../types';
import { Trash2, Mic, MicOff, CheckCircle2, ChevronRight, ChevronLeft, Upload, FileText, Search } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

const PACKAGES = [
  {
    name: 'The Refresh & Polish',
    price: 2499,
    description: 'Deep leather cleansing, conditioning, minor scuff removal, edge dressing, and a hand-burnished cream polish finish.'
  },
  {
    name: 'The Signature Recrafting',
    price: 8999,
    description: 'Includes everything in the Refresh package, plus a full out-sole replacement (Goodyear welted or Blake stitched reconstruction) and new premium stacked leather heel blocks.'
  },
  {
    name: 'The Master Restoration',
    price: 14999,
    description: 'A complete strip-down and rebuilding of the shoe, replacing the cork filling, welting (if damaged), full re-sole, interior lining repair, and a complete hand-dyed patina restoration.'
  }
];

export default function NewRepair() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addRepair, settings, repairs, deleteRepair } = useAppStore();
  
  const queryParams = new URLSearchParams(location.search);
  
  const [activeTab, setActiveTab] = useState<'history' | 'new-repair'>(() => {
    const mode = queryParams.get('mode');
    const tab = queryParams.get('tab');
    if (mode === 'step' || tab === 'new-repair') {
      return 'new-repair';
    }
    return 'history';
  });
  
  const [generatedInvoice, setGeneratedInvoice] = useState<ShoeRepairRequest | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    const tab = params.get('tab');
    
    if (mode === 'step' || tab === 'new-repair') {
      setActiveTab('new-repair');
    } else if (tab === 'history') {
      setActiveTab('history');
    }
  }, [location.search]);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredRepairs = repairs.filter(r => {
    const term = searchQuery.toLowerCase();
    const repairTypeStr = Array.isArray(r.repairType) ? r.repairType.join(', ') : r.repairType;
    return (
      r.customerName.toLowerCase().includes(term) ||
      (r.shoeModel && r.shoeModel.toLowerCase().includes(term)) ||
      (r.invoiceNumber && r.invoiceNumber.toLowerCase().includes(term)) ||
      (repairTypeStr && repairTypeStr.toLowerCase().includes(term))
    );
  });

  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    email: '',
    shoeModel: '',
    size: '',
    leatherType: 'Full-Grain',
    purchaseDate: '',
    conditions: [] as string[],
    description: '', // This will act as the Customer Notes
    package: '',
    packagePrice: 0,
    shoeImage: '',
    signature: '',
    agreementAccepted: false,
    receiveSmsUpdates: true,
  });

  const conditionOptions = [
    'Minor Upper Scuffs',
    'Worn-down Outsoles',
    'Heel Block Wear',
    'Lining Tears',
    'Thread Fraying'
  ];

  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }
    
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setFormData(prev => ({
          ...prev,
          description: prev.description ? `${prev.description} ${finalTranscript.trim()}` : finalTranscript.trim()
        }));
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone access was denied. Please allow microphone access in your browser settings to use voice notes.");
      }
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);
    
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleCondition = (condition: string) => {
    setFormData(prev => {
      const exists = prev.conditions.includes(condition);
      return {
        ...prev,
        conditions: exists ? prev.conditions.filter(c => c !== condition) : [...prev.conditions, condition]
      };
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

  const nextStep = () => {
    if (currentStep === 0 && (!formData.customerName || !formData.phoneNumber || !formData.shoeModel)) {
      return alert("Please fill in the required client and footwear details.");
    }
    if (currentStep === 1 && !formData.package) {
      return alert("Please select a restoration package.");
    }
    setCurrentStep(s => s + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreementAccepted) {
      return alert("Please authorize the diagnostic assessment to proceed.");
    }

    const createdRepair = addRepair({
      customerName: formData.customerName,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      shoeModel: `${formData.shoeModel} (Size: ${formData.size}, ${formData.leatherType})`,
      repairType: [formData.package],
      description: `Conditions: ${formData.conditions.join(', ')}\nNotes: ${formData.description}`,
      price: formData.packagePrice,
      photoUrl: formData.shoeImage,
      shoeIcon: 'default',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      appliedOfferCode: '',
      discountAmount: 0,
      receivedBy: 'Intake Staff',
      addonType: '',
      addonPrice: 0,
      addons: [],
      hasInsurance: false,
      insuranceType: '',
      insurancePrice: 0,
      insurancePolicyNumber: '',
      insuranceStartDate: '',
      insuranceEndDate: '',
      insuranceProvider: '',
      servicesIncluded: [],
      salespersonId: 'SYSTEM',
      statusHistory: [],
      advance: 0,
      balance: formData.packagePrice,
      receiveSmsUpdates: formData.receiveSmsUpdates,
      status: 'Received'
    } as any);

    setGeneratedInvoice(createdRepair);
  };

  if (generatedInvoice) {
    return (
      <div className="fixed inset-0 bg-brand-dark/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
          <div className="p-12 text-center border-b border-brand-border">
            <CheckCircle2 className="w-16 h-16 text-brand-olive mx-auto mb-4" />
            <h2 className="font-serif text-3xl font-bold text-brand-dark mb-2">Diagnostic Intake Confirmed</h2>
            <p className="text-brand-muted font-serif italic">Ticket: {generatedInvoice.invoiceNumber}</p>
          </div>
          <div className="p-12 space-y-6 text-brand-dark">
            <p>Thank you for entrusting your footwear to our artisans. We will conduct a thorough physical inspection and issue a final, itemized quotation shortly.</p>
            <div className="bg-brand-bg p-6 rounded-lg text-sm space-y-2 font-mono">
              <p><span className="font-bold">Client:</span> {generatedInvoice.customerName}</p>
              <p><span className="font-bold">Model:</span> {generatedInvoice.shoeModel}</p>
              <p><span className="font-bold">Selected Tier:</span> {formData.package}</p>
              <p><span className="font-bold">Est. Total:</span> ₹{generatedInvoice.price.toFixed(2)}</p>
            </div>
            <button onClick={() => navigate('/')} className="w-full py-4 bg-brand-dark text-white rounded font-bold uppercase tracking-widest hover:bg-opacity-90 transition-colors">
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Toggle View Segmented Control */}
      <div className="flex justify-start">
        <div className="flex bg-brand-bg p-1 rounded-lg border border-brand-border shadow-sm">
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              navigate('/new-repair', { replace: true });
            }}
            className={clsx(
              "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1.5",
              activeTab === 'history'
                ? "bg-white text-brand-dark shadow-sm border border-brand-border/40" 
                : "text-brand-muted hover:text-brand-dark"
            )}
          >
            <span>📜 Care History ({repairs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('new-repair');
              setCurrentStep(0);
            }}
            className={clsx(
              "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1.5",
              activeTab === 'new-repair'
                ? "bg-white text-brand-dark shadow-sm border border-brand-border/40" 
                : "text-brand-muted hover:text-brand-dark"
            )}
          >
            <span>⚡ New Repair Ticket</span>
          </button>
        </div>
      </div>

      {activeTab === 'new-repair' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Step Progress Bar */}
          <div className="bg-white border border-brand-border rounded-xl p-5 shadow-sm max-w-2xl mx-auto">
            <div className="flex justify-between mb-4">
              {['Diagnostics', 'Restoration Tier', 'Disclaimers', 'Sign-Off'].map((step, idx) => (
                <span key={step} className={clsx(
                  "text-[10px] font-bold uppercase tracking-widest transition-colors duration-500",
                  idx <= currentStep ? "text-brand-dark" : "text-brand-muted opacity-40",
                  "hidden md:block"
                )}>
                  {step}
                </span>
              ))}
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-dark md:hidden block">
                Step {currentStep + 1} of 4: {['Diagnostics', 'Restoration Tier', 'Disclaimers', 'Sign-Off'][currentStep]}
              </span>
            </div>
            <div className="h-1 bg-brand-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-dark transition-all duration-700 ease-out"
                style={{ width: `${((currentStep + 1) / 4) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-brand-border rounded-xl shadow-xl overflow-hidden max-w-4xl mx-auto">
            
            {/* Guided multi-step diagnostic wizard */}
            {currentStep === 0 && (
              <div className="p-5 sm:p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                
                {/* Client Details Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-brand-dark mb-4 border-b border-brand-border pb-2 flex items-center gap-2">
                      <span className="text-brand-olive text-sm font-mono bg-brand-bg px-2 py-0.5 rounded border">1</span>
                      Client Profile
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-widest mb-1.5">Full Name *</label>
                        <input 
                          required 
                          type="text" 
                          name="customerName" 
                          value={formData.customerName} 
                          onChange={handleChange}
                          placeholder="e.g. Arvind Kumar Shukla"
                          className="w-full border border-brand-border rounded-xl p-3 text-sm bg-brand-bg/10 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:border-brand-dark text-brand-dark placeholder-brand-muted/40 transition-all" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-widest mb-1.5">Mobile Number *</label>
                        <input 
                          required 
                          type="tel" 
                          name="phoneNumber" 
                          value={formData.phoneNumber} 
                          onChange={handleChange}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full border border-brand-border rounded-xl p-3 text-sm bg-brand-bg/10 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:border-brand-dark text-brand-dark placeholder-brand-muted/40 transition-all" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-widest mb-1.5">Email Address (Optional)</label>
                        <input 
                          type="email" 
                          name="email" 
                          value={formData.email} 
                          onChange={handleChange}
                          placeholder="e.g. arvind@example.com"
                          className="w-full border border-brand-border rounded-xl p-3 text-sm bg-brand-bg/10 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:border-brand-dark text-brand-dark placeholder-brand-muted/40 transition-all" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footwear Diagnostics Section */}
                  <div className="pt-4 border-t border-brand-border/40">
                    <h3 className="font-serif text-xl font-bold text-brand-dark mb-4 border-b border-brand-border pb-2 flex items-center gap-2">
                      <span className="text-brand-olive text-sm font-mono bg-brand-bg px-2 py-0.5 rounded border">2</span>
                      Footwear Diagnostics
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-widest mb-1.5">Model / Style Name *</label>
                        <input 
                          required 
                          type="text" 
                          name="shoeModel" 
                          value={formData.shoeModel} 
                          onChange={handleChange}
                          placeholder="e.g. Allen Edmonds Park Avenue Oxfords"
                          className="w-full border border-brand-border rounded-xl p-3 text-sm bg-brand-bg/10 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:border-brand-dark text-brand-dark placeholder-brand-muted/40 transition-all" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-widest mb-1.5">Size (Optional)</label>
                        <input 
                          type="text" 
                          name="size" 
                          value={formData.size} 
                          onChange={handleChange}
                          placeholder="e.g. UK 9 / EU 43"
                          className="w-full border border-brand-border rounded-xl p-3 text-sm bg-brand-bg/10 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:border-brand-dark text-brand-dark placeholder-brand-muted/40 transition-all" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-widest mb-1.5">Leather / Upper Material</label>
                        <select 
                          name="leatherType" 
                          value={formData.leatherType} 
                          onChange={handleChange}
                          className="w-full border border-brand-border rounded-xl p-3 text-sm bg-brand-bg/10 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:border-brand-dark text-brand-dark cursor-pointer transition-all"
                        >
                          <option value="Full-Grain">Full-Grain Leather</option>
                          <option value="Calfskin">Premium Calfskin</option>
                          <option value="Suede">Luxury Suede</option>
                          <option value="Cordovan">Shell Cordovan</option>
                          <option value="Exotic">Exotic Hide</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-widest mb-1.5">Original Purchase Date (Optional)</label>
                        <input 
                          type="date" 
                          name="purchaseDate" 
                          value={formData.purchaseDate} 
                          onChange={handleChange}
                          className="w-full border border-brand-border rounded-xl p-3 text-sm bg-brand-bg/10 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:border-brand-dark text-brand-dark transition-all" 
                        />
                      </div>
                    </div>

                    {/* Current Condition Checklist */}
                    <div className="mb-6 pt-4 border-t border-brand-border/40">
                      <label className="block text-[10px] font-bold text-brand-dark mb-3 uppercase tracking-widest">Current Condition Checklist</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {conditionOptions.map(condition => {
                          const isSelected = formData.conditions.includes(condition);
                          return (
                            <button
                              key={condition}
                              type="button"
                              onClick={() => toggleCondition(condition)}
                              className={clsx(
                                "flex items-center gap-3 p-3.5 rounded-xl border text-left text-xs transition-all",
                                isSelected 
                                  ? "border-brand-olive bg-brand-olive/5 text-brand-olive font-bold shadow-sm" 
                                  : "border-brand-border hover:bg-brand-bg/30 text-brand-dark bg-white"
                              )}
                            >
                              <div className={clsx(
                                "w-5 h-5 rounded border flex items-center justify-center transition-all",
                                isSelected ? "bg-brand-olive border-brand-olive text-white" : "border-brand-muted"
                              )}>
                                {isSelected && (
                                  <svg className="w-3.5 h-3.5 stroke-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className="select-none font-medium">{condition}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Voice & Notes Area */}
                    <div className="pt-4 border-t border-brand-border/40">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-widest">Customer Notes / Specific Requests</label>
                        <button
                          type="button"
                          onClick={toggleRecording}
                          className={`p-1 px-2.5 rounded-full transition-all flex items-center space-x-1 border ${isRecording ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-brand-bg text-brand-muted hover:text-brand-dark border-brand-border'}`}
                        >
                          {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                          <span className="text-[9px] font-bold uppercase tracking-wider">{isRecording ? 'Recording...' : 'Voice Note'}</span>
                        </button>
                      </div>
                      <textarea 
                        name="description" 
                        rows={3} 
                        value={formData.description} 
                        onChange={handleChange}
                        placeholder="Record or type any specific issues..."
                        className="w-full border border-brand-border bg-brand-bg/10 p-3 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-dark focus:border-brand-dark text-brand-dark resize-none transition-all" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {currentStep === 1 && (
              <div className="p-5 sm:p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center mb-8">
                  <h3 className="font-serif text-2xl font-bold text-brand-dark mb-2">Restoration Packages</h3>
                  <p className="text-sm text-brand-muted">Select the level of artisanship required for your footwear.</p>
                </div>
                <div className="space-y-4">
                  {PACKAGES.map((pkg) => {
                    const isSelected = formData.package === pkg.name;
                    return (
                      <div 
                        key={pkg.name}
                        onClick={() => setFormData(prev => ({ ...prev, package: pkg.name, packagePrice: pkg.price }))}
                        className={clsx(
                          "border-2 rounded-xl p-5 cursor-pointer transition-all duration-300",
                          isSelected 
                            ? "border-brand-dark bg-brand-dark text-white shadow-xl scale-[1.01]" 
                            : "border-brand-border hover:border-brand-muted bg-white text-brand-dark"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-serif text-lg font-bold">{pkg.name}</h4>
                          <span className="font-mono text-base font-bold">₹{pkg.price.toLocaleString()}</span>
                        </div>
                        <p className={clsx(
                          "text-xs leading-relaxed",
                          isSelected ? "text-white/80" : "text-brand-muted"
                        )}>
                          {pkg.description}
                        </p>
                      </div>
                    );
                  })}

                  {/* Bespoke Custom Option */}
                  <div 
                    onClick={() => {
                      if (formData.package && PACKAGES.some(p => p.name === formData.package)) {
                        setFormData(prev => ({ ...prev, package: 'Bespoke Custom Restoration', packagePrice: 1500 }));
                      } else if (!formData.package) {
                        setFormData(prev => ({ ...prev, package: 'Bespoke Custom Restoration', packagePrice: 1500 }));
                      }
                    }}
                    className={clsx(
                      "border-2 rounded-xl p-5 cursor-pointer transition-all duration-300 space-y-4",
                      formData.package && !PACKAGES.some(p => p.name === formData.package)
                        ? "border-brand-dark bg-brand-dark/5 ring-1 ring-brand-dark"
                        : "border-brand-border hover:border-brand-muted bg-white text-brand-dark"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-serif text-lg font-bold text-brand-dark">Bespoke Custom Restoration</h4>
                      <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-brand-olive bg-brand-bg px-2 py-0.5 rounded border border-brand-border">Bespoke</span>
                    </div>
                    <p className="text-xs text-brand-muted leading-relaxed">
                      Need a personalized quote or special premium treatments? Set a custom repair item and custom rate.
                    </p>
                    
                    {(formData.package && !PACKAGES.some(p => p.name === formData.package)) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-brand-border/40 animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div>
                          <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-widest mb-1.5">Custom Service Name</label>
                          <input 
                            type="text"
                            value={formData.package}
                            onChange={(e) => setFormData(prev => ({ ...prev, package: e.target.value }))}
                            className="w-full bg-white border border-brand-border rounded-xl p-2.5 text-xs text-brand-dark focus:outline-none focus:border-brand-accent transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-widest mb-1.5">Service Rate (₹)</label>
                          <input 
                            type="number"
                            value={formData.packagePrice || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, packagePrice: Math.max(0, parseFloat(e.target.value) || 0) }))}
                            className="w-full bg-white border border-brand-border rounded-xl p-2.5 text-xs font-mono text-brand-dark focus:outline-none focus:border-brand-accent transition-colors"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="p-5 sm:p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center mb-8">
                  <h3 className="font-serif text-2xl font-bold text-brand-dark mb-2">Artisanal Disclaimers & Limitations</h3>
                  <p className="text-sm text-brand-muted">Preservation Notes.</p>
                </div>
                
                <div className="prose prose-sm max-w-none text-brand-dark space-y-6 bg-brand-bg p-5 sm:p-8 rounded-xl">
                  <p className="font-serif italic text-base sm:text-lg text-center mb-6">"Every effort is made to restore your footwear to its original glory, honoring the craft."</p>
                  
                  <ul className="space-y-4 list-none pl-0">
                    <li className="flex items-start">
                      <span className="w-5 h-5 flex items-center justify-center mr-3 font-bold text-brand-olive">•</span> 
                      <span className="text-xs sm:text-sm"><strong className="uppercase text-[10px] tracking-widest block mb-1">Natural Characteristics:</strong> High-quality full-grain leather possesses natural characteristics. Variations in tone and texture are expected during recrafting.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-5 h-5 flex items-center justify-center mr-3 font-bold text-brand-olive">•</span> 
                      <span className="text-xs sm:text-sm"><strong className="uppercase text-[10px] tracking-widest block mb-1">Inherent Limitations:</strong> Existing deep scars, severe water rot, or heavily cracked uppers may set physical limitations on the final outcome of the restoration.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-5 h-5 flex items-center justify-center mr-3 font-bold text-brand-olive">•</span> 
                      <span className="text-xs sm:text-sm"><strong className="uppercase text-[10px] tracking-widest block mb-1">Third-Party Modifications:</strong> Cordwainers care is not responsible for structural failures caused by previous unauthorized modifications or repairs by third-party cobblers.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="p-5 sm:p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center mb-8">
                  <h3 className="font-serif text-2xl font-bold text-brand-dark mb-2">Submission & Sign-Off</h3>
                  <p className="text-sm text-brand-muted">Finalizing your service request.</p>
                </div>

                {/* Pricing Summary Review */}
                <div className="bg-brand-bg/50 border border-brand-border rounded-xl p-5 space-y-2.5 text-xs">
                  <h4 className="font-bold uppercase tracking-widest text-[10px] text-brand-dark border-b border-brand-border/40 pb-2 mb-2">Summary of Service</h4>
                  <div className="flex justify-between text-brand-muted">
                    <span>Service Level:</span>
                    <span className="font-serif text-brand-dark font-semibold truncate max-w-[200px]">{formData.package || 'None selected'}</span>
                  </div>
                  <div className="flex justify-between text-brand-muted">
                    <span>Base Service Cost:</span>
                    <span className="font-mono text-brand-dark font-medium">₹{(formData.packagePrice || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-brand-muted">
                    <span>GST (18% inclusive estimate):</span>
                    <span className="font-mono text-brand-dark">₹{Math.round((formData.packagePrice || 0) * 0.18).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-brand-dark font-serif font-bold pt-2.5 border-t border-brand-border/50">
                    <span className="uppercase text-[9px] tracking-wider font-sans font-bold">Estimated Total</span>
                    <span className="text-sm sm:text-base text-brand-dark">₹{Math.round((formData.packagePrice || 0) * 1.18).toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-brand-bg p-5 rounded-xl">
                  <h4 className="font-bold uppercase tracking-widest text-[10px] mb-3">Packing & Shipping Instructions</h4>
                  <p className="text-xs text-brand-muted mb-4">
                    Please safely pack your footwear in a rigid box, utilizing shoe trees if possible. We recommend wrapping each shoe in a dust bag to prevent transit scuffs.
                  </p>
                  <h4 className="font-bold uppercase tracking-widest text-[10px] mb-3 mt-6">Diagnostic Imagery</h4>
                  <div className="border border-dashed border-brand-border bg-white rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden">
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    {formData.shoeImage ? (
                      <img src={formData.shoeImage} alt="Uploaded" className="mx-auto max-h-32 rounded object-cover" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-brand-muted mx-auto mb-2" />
                        <p className="text-xs font-bold text-brand-dark mb-0.5">Upload High-Res Photo</p>
                        <p className="text-[10px] text-brand-muted">Profile, Sole, and Inner Lining (Max 10MB)</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-t border-brand-border pt-6">
                  <h4 className="font-bold uppercase tracking-widest text-[10px] mb-4">Authorization & Contact Options</h4>
                  
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="pt-0.5">
                        <input 
                          type="checkbox" 
                          name="agreementAccepted"
                          checked={formData.agreementAccepted}
                          onChange={handleChange}
                          className="w-4.5 h-4.5 rounded border-brand-border text-brand-dark focus:ring-0" 
                        />
                      </div>
                      <span className="text-xs text-brand-dark leading-normal group-hover:text-black transition-colors">
                        I approve this diagnostic assessment and understand that a final, itemized quotation will be issued upon physical inspection.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="pt-0.5">
                        <input 
                          type="checkbox" 
                          name="receiveSmsUpdates"
                          checked={formData.receiveSmsUpdates}
                          onChange={handleChange}
                          className="w-4.5 h-4.5 rounded border-brand-border text-brand-dark focus:ring-0" 
                        />
                      </div>
                      <span className="text-xs text-brand-dark leading-normal group-hover:text-black transition-colors">
                        Send automated real-time status updates via SMS / WhatsApp.
                      </span>
                    </label>

                    <div className="pt-2">
                      <label className="block text-[10px] font-bold text-brand-dark mb-1.5 uppercase tracking-widest">Digital Signature *</label>
                      <input 
                        required 
                        type="text" 
                        name="signature" 
                        value={formData.signature} 
                        onChange={handleChange}
                        className="w-full border border-brand-border rounded-xl p-3 text-sm font-serif italic bg-brand-bg/10 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:border-brand-dark text-brand-dark placeholder:font-sans placeholder:not-italic" 
                        placeholder="Type customer's name to sign" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 sm:p-6 md:p-8 flex items-center justify-between border-t border-brand-border">
              {currentStep > 0 ? (
                <button 
                  type="button" 
                  onClick={() => setCurrentStep(s => s - 1)} 
                  className="flex items-center space-x-1.5 text-brand-muted hover:text-brand-dark transition-colors font-bold uppercase tracking-widest text-[10px] sm:text-xs px-3 py-2"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Return</span>
                </button>
              ) : <div />}
              
              {currentStep < 3 ? (
                <button 
                  type="button" 
                  onClick={nextStep} 
                  className="flex items-center space-x-1.5 bg-brand-dark text-white px-5 sm:px-8 py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-brand-muted transition-all"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="flex items-center space-x-1.5 bg-brand-olive text-white px-5 sm:px-8 py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-md"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Submit for Assessment</span>
                </button>
              )}
            </div>

          </form>
        </div>
      )}

      {/* Care History Section */}
      {activeTab === 'history' && (
        <div className="bg-white border border-brand-border rounded-xl shadow-xl overflow-hidden p-6 md:p-8 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-brand-border pb-6">
            <div>
              <h3 className="font-serif text-2xl font-bold text-brand-dark">Care History</h3>
              <p className="text-xs text-brand-muted uppercase tracking-wider mt-1">View and search all footwear care records</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
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
          </div>

        {filteredRepairs.length > 0 ? (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-border">
                <thead>
                  <tr className="bg-brand-bg">
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Ticket</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Customer / Shoe</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Restoration Tier</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Date</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Est. Cost</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Status</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-brand-olive tracking-widest uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border bg-white">
                  {filteredRepairs.map((repair) => (
                    <tr key={repair.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-mono font-medium text-brand-dark">
                        {repair.invoiceNumber}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-brand-dark">{repair.customerName}</div>
                        <div className="text-xs text-brand-muted mt-0.5">{repair.shoeModel}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-brand-dark">
                        {Array.isArray(repair.repairType) ? repair.repairType.join(', ') : repair.repairType}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-brand-muted">
                        {format(new Date(repair.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-serif font-bold text-brand-dark">
                        ₹{(repair.price || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={clsx(
                          "inline-flex items-center px-2 py-1 rounded text-xs font-bold border",
                          repair.status === 'Received' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          repair.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          repair.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-slate-50 text-slate-700 border-slate-200'
                        )}>
                          {repair.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this repair record?')) {
                              deleteRepair(repair.id);
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
              {filteredRepairs.map((repair) => (
                <div key={repair.id} className="border border-brand-border rounded-lg p-4 space-y-3 bg-brand-bg/20 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono font-bold text-brand-dark">{repair.invoiceNumber}</span>
                      <h4 className="font-semibold text-sm text-brand-dark mt-1">{repair.customerName}</h4>
                      <p className="text-xs text-brand-muted">{repair.shoeModel}</p>
                    </div>
                    <span className={clsx(
                      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border",
                      repair.status === 'Received' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      repair.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      repair.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    )}>
                      {repair.status}
                    </span>
                  </div>

                  <div className="text-xs text-brand-dark flex flex-wrap justify-between pt-2 border-t border-brand-border/60">
                    <div>
                      <span className="text-brand-muted">Tier: </span>
                      <span className="font-medium">{Array.isArray(repair.repairType) ? repair.repairType.join(', ') : repair.repairType}</span>
                    </div>
                    <div className="font-serif font-bold text-brand-dark">
                      ₹{(repair.price || 0).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 text-[10px] text-brand-muted border-t border-brand-border/60">
                    <span>{format(new Date(repair.createdAt), 'MMMM d, yyyy')}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this repair record?')) {
                          deleteRepair(repair.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 border border-dashed border-brand-border rounded-xl bg-brand-bg/10">
            <p className="text-sm text-brand-muted italic">
              {searchQuery ? 'No care history records found matching your query.' : 'No care records logged in CW Care yet.'}
            </p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
