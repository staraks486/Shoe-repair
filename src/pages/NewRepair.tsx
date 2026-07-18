import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { ShoeRepairRequest } from '../types';
import { 
  User, 
  Phone, 
  Mail, 
  Sparkles, 
  Layers, 
  Barcode, 
  X, 
  Copy, 
  Check, 
  Info, 
  Trash2, 
  Upload, 
  Printer, 
  Share2, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Plus, 
  Minus, 
  ShieldCheck, 
  Percent, 
  FileCheck, 
  AlertTriangle,
  Camera,
  Download
} from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

const PACKAGES = [
  {
    id: 'pkg-1',
    name: 'The Refresh & Polish',
    price: 2499,
    description: 'Deep leather cleansing, conditioning, minor scuff removal, edge dressing, and a hand-burnished cream polish finish.'
  },
  {
    id: 'pkg-2',
    name: 'The Signature Recrafting',
    price: 8999,
    description: 'Includes everything in the Refresh package, plus a full out-sole replacement (Goodyear welted or Blake stitched reconstruction) and new premium stacked leather heel blocks.'
  },
  {
    id: 'pkg-3',
    name: 'The Master Restoration',
    price: 14999,
    description: 'A complete strip-down and rebuilding of the shoe, replacing the cork filling, welting (if damaged), full re-sole, interior lining repair, and a complete hand-dyed patina restoration.'
  }
];

const INSURANCE_PLANS = [
  { id: 'none', name: 'No Insurance Protection', price: 0, description: 'Standard service warranty only (30 days)' },
  { id: 'basic', name: 'Basic Care Cover', price: 499, description: '1 Year accidental scuff cover & minor stitching repairs' },
  { id: 'premium', name: 'Premium Lifetime Shield', price: 1499, description: 'Lifetime wear warranty & comprehensive material replacement discount' }
];

const OFFER_CODES = [
  { code: 'NONE', label: 'No Offer Applied', percentage: 0 },
  { code: 'WELCOME10', label: 'Welcome Intake Discount (10%)', percentage: 10 },
  { code: 'FESTIVE15', label: 'Festive Season Offer (15%)', percentage: 15 },
  { code: 'ARTISAN20', label: 'Exclusive Artisan Circle (20%)', percentage: 20 }
];

const SALESPERSONS = [
  {
    id: 'SP-001',
    name: 'Arvind Kumar Shukla',
    role: 'Store Lead & Chief Inspector'
  },
  {
    id: 'SP-002',
    name: 'Pooja Sharma',
    role: 'Boutique Specialist'
  },
  {
    id: 'SP-003',
    name: 'Rahul Deshmukh',
    role: 'Senior Artisan & Cordwainer'
  },
  {
    id: 'SP-004',
    name: 'Amit Patel',
    role: 'Associate Intake Specialist'
  }
];

// Helper to render high-fidelity print-safe barcode SVG
function BarcodeSVG({ value }: { value: string }) {
  const bars: number[] = [];
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    bars.push((code % 3) + 1, ((code >> 1) % 3) + 1, ((code >> 2) % 3) + 1, 1);
  }
  let currentX = 10;
  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="40" className="text-black overflow-visible">
        <g fill="currentColor">
          <rect x={2} y={0} width={2} height={40} />
          <rect x={5} y={0} width={1} height={40} />
          {bars.map((w, idx) => {
            const x = currentX;
            currentX += w * 1.5;
            if (idx % 2 === 0) {
              return <rect key={idx} x={x} y={0} width={w * 1.5} height={40} />;
            }
            return null;
          })}
          <rect x={currentX + 2} y={0} width={1} height={40} />
          <rect x={currentX + 4} y={0} width={2} height={40} />
        </g>
      </svg>
      <span className="font-mono text-[9px] tracking-[0.25em] mt-1 text-gray-500 font-bold">{value}</span>
    </div>
  );
}

const FALLBACK_COBBLERS = [
  { id: 'C-001', name: 'Devendra Vishwakarma', specialty: 'Goodyear-Welt Recrafting' },
  { id: 'C-002', name: 'Baldev Prasad', specialty: 'Exotic Patina & Dyeing' },
  { id: 'C-003', name: 'Rajesh Solanki', specialty: 'Stitch Reconstruction' }
];

export default function NewRepair() {
  const navigate = useNavigate();
  const location = useLocation();
  const { repairs, addRepair, deleteRepair, inventory, settings, updateSettings } = useAppStore();

  const carePackages = settings?.shoeCarePackages && settings.shoeCarePackages.length > 0
    ? settings.shoeCarePackages
    : PACKAGES;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<{ id: string; name: string; price: number; description: string } | null>(null);

  const activeCobblers = settings?.cobblers?.length > 0 ? settings.cobblers : FALLBACK_COBBLERS;
  const [assignedCobblerId, setAssignedCobblerId] = useState<string>(activeCobblers[0].id);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Bank Transfer'>('Cash');
  const [transactionId, setTransactionId] = useState<string>('');

  const queryParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState<'history' | 'new-repair' | 'manage-services'>(() => {
    const tab = queryParams.get('tab');
    if (tab === 'new-repair' || queryParams.get('mode') === 'step') {
      return 'new-repair';
    }
    if (tab === 'manage-services') {
      return 'manage-services';
    }
    return 'history';
  });

  // State wizard
  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [submittedInvoice, setSubmittedInvoice] = useState<any>(null);

  // Form Fields State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  
  const [salesperson, setSalesperson] = useState(SALESPERSONS[0]);
  const [customSalespersonName, setCustomSalespersonName] = useState('');

  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [shoeModel, setShoeModel] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [leatherType, setLeatherType] = useState('Full-Grain');
  const [shoeImage, setShoeImage] = useState('');
  const [basePrice, setBasePrice] = useState(1500); // Base value/diagnostics fee of the footwear

  const [selectedPackage, setSelectedPackage] = useState(() => carePackages[0] || PACKAGES[0]);
  const [customPackageName, setCustomPackageName] = useState('');
  const [customPackagePrice, setCustomPackagePrice] = useState(2500);
  const [isBespoke, setIsBespoke] = useState(false);

  // Shoe plus items (supplies added to care ticket)
  const [plusItems, setPlusItems] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const [plusSearch, setPlusSearch] = useState('');

  // Insurance Plan
  const [insurancePlan, setInsurancePlan] = useState(INSURANCE_PLANS[0]);

  // Offers and Custom discounts
  const [selectedOffer, setSelectedOffer] = useState(OFFER_CODES[0]);
  const [customDiscountType, setCustomDiscountType] = useState<'percent' | 'absolute'>('percent');
  const [customDiscountValue, setCustomDiscountValue] = useState(0);

  // Terms and notes
  const [notes, setNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Live Calculations
  const getPackageCost = () => {
    return isBespoke ? customPackagePrice : selectedPackage.price;
  };

  const getPackageName = () => {
    return isBespoke ? (customPackageName || 'Bespoke Custom Restoration') : selectedPackage.name;
  };

  const getPlusItemsTotal = () => {
    return plusItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getInsuranceCost = () => {
    return insurancePlan.price;
  };

  const getSubtotal = () => {
    return basePrice + getPackageCost() + getPlusItemsTotal() + getInsuranceCost();
  };

  const getDiscountAmount = () => {
    const sub = getSubtotal();
    let discount = 0;
    if (selectedOffer.percentage > 0) {
      discount += sub * (selectedOffer.percentage / 100);
    }
    if (customDiscountValue > 0) {
      if (customDiscountType === 'percent') {
        discount += sub * (customDiscountValue / 100);
      } else {
        discount += customDiscountValue;
      }
    }
    return Math.min(discount, sub);
  };

  const getGrandTotal = () => {
    const total = getSubtotal() - getDiscountAmount();
    return Math.max(0, Math.round(total));
  };

  // Keep location tab query in sync
  useEffect(() => {
    const tab = queryParams.get('tab');
    if (tab === 'new-repair') {
      setActiveTab('new-repair');
    } else if (tab === 'history') {
      setActiveTab('history');
    } else if (tab === 'manage-services') {
      setActiveTab('manage-services');
    }
  }, [location.search]);

  // Ensure selectedPackage stays valid if packages list is edited
  useEffect(() => {
    if (carePackages.length > 0 && !carePackages.some(p => p.id === selectedPackage.id || p.name === selectedPackage.name)) {
      setSelectedPackage(carePackages[0]);
    }
  }, [carePackages, selectedPackage]);

  // Handle footwear image upload
  const handleShoeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setShoeImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Could not access camera. Please check your browser's camera permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setShoeImage(dataUrl);
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentStep]);

  // Add Item from Inventory to Shoe Plus list
  const addPlusItem = (inv: any) => {
    const existing = plusItems.find(item => item.id === inv.id);
    if (existing) {
      setPlusItems(plusItems.map(item => 
        item.id === inv.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setPlusItems([...plusItems, {
        id: inv.id,
        name: inv.name,
        price: inv.price || 350, // Fallback price
        quantity: 1
      }]);
    }
  };

  // Decrease/Remove Shoe Plus item
  const updatePlusQuantity = (id: string, delta: number) => {
    setPlusItems(plusItems.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as any);
  };

  // Submit Ticket creation to store
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName || !clientPhone || !shoeModel) {
      alert('Please fill out the required Client Name, Phone, and Shoe Model fields.');
      return;
    }

    if (!termsAccepted) {
      alert('You must accept the handcrafted care terms & conditions to proceed.');
      return;
    }

    const salespersonNameVal = customSalespersonName || salesperson.name;

    const requestPayload = {
      customerName: clientName,
      phoneNumber: clientPhone,
      email: clientEmail || 'no-email@cordwainers.com',
      shoeModel: `${shoeModel} ${shoeSize ? `(Size: ${shoeSize})` : ''} - Material: ${leatherType}`,
      repairType: [getPackageName()],
      description: `Footwear Base Price: ₹${basePrice}\nSupplies: ${plusItems.map(i => `${i.name} x${i.quantity}`).join(', ') || 'None'}\nDiagnostics notes: ${notes}`,
      photoUrl: shoeImage || 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&q=80&w=300',
      status: 'Received' as const,
      shoeIcon: 'default',
      price: getGrandTotal(),
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      receivedBy: salespersonNameVal,
      addonType: plusItems.length > 0 ? 'Shoe Plus Bundle' : '',
      addonPrice: getPlusItemsTotal(),
      addons: plusItems,
      hasInsurance: insurancePlan.id !== 'none',
      insuranceType: insurancePlan.name,
      insurancePrice: insurancePlan.price,
      insurancePolicyNumber: insurancePlan.id !== 'none' ? `POL-${Math.floor(100000 + Math.random() * 900000)}` : '',
      insuranceStartDate: insurancePlan.id !== 'none' ? new Date().toISOString() : '',
      insuranceEndDate: insurancePlan.id !== 'none' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : '',
      insuranceProvider: insurancePlan.id !== 'none' ? 'CW Protection Group' : '',
      servicesIncluded: [getPackageName()],
      appliedOfferCode: selectedOffer.code !== 'NONE' ? selectedOffer.code : '',
      discountAmount: getDiscountAmount(),
      salespersonId: salesperson.id,
      salespersonName: salespersonNameVal,
      basePrice: basePrice,
      discountPercentage: selectedOffer.percentage || (customDiscountType === 'percent' ? customDiscountValue : 0),
      advance: advanceAmount,
      balance: Math.max(0, getGrandTotal() - advanceAmount),
      paymentMethod: (advanceAmount > 0 ? advancePaymentMethod : 'None') as 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Net Banking' | 'None',
      paymentStatus: (advanceAmount === 0 ? 'Unpaid' : (advanceAmount >= getGrandTotal() ? 'Fully Paid' : 'Partially Paid')) as 'Unpaid' | 'Partially Paid' | 'Fully Paid',
      transactionId: transactionId || '',
      assignedCobblerId: assignedCobblerId,
      assignedCobblerName: activeCobblers.find(c => c.id === assignedCobblerId)?.name || 'Unassigned',
      receiveSmsUpdates: true,
      statusHistory: [],
    };

    const newTicket = addRepair(requestPayload);
    setSubmittedInvoice(newTicket);
  };

  const getWhatsAppURL = (ticket: any) => {
    if (!ticket) return '#';
    const text = `*CORDWAINERS CARE - OFFICIAL INTAKE CONFIRMATION*%0A%0AHello *${ticket.customerName}*, your footwear has been registered successfully for luxury restoration!%0A%0A*Ticket ID:* ${ticket.invoiceNumber}%0A*Footwear:* ${ticket.shoeModel}%0A*Salesperson:* ${ticket.receivedBy}%0A%0A*SERVICE SUMMARY:*%0A- Base Assessment Value: ₹${ticket.basePrice || 1500}%0A- Package: ${ticket.repairType?.join(', ')}%0A- Shoe Plus Add-ons: ₹${ticket.addonPrice || 0}%0A- Insurance Cover: ${ticket.insuranceType} (₹${ticket.insurancePrice || 0})%0A- Discount: -₹${ticket.discountAmount || 0}%0A%0A*TOTAL RESTORATION COST:* ₹${ticket.price}%0A%0AView Terms & Conditions: https://cordwainers.com/care-terms%0AThank you for trusting Cordwainers Studio!`;
    return `https://api.whatsapp.com/send?phone=${ticket.phoneNumber.replace(/[^0-9]/g, '')}&text=${text}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadReceipt = (ticket: any) => {
    if (!ticket) return;
    const content = `========================================
CORDWAINERS STUDIO CARE INTAKE RECEIPT
========================================
Invoice: ${ticket.invoiceNumber}
Date: ${format(new Date(), 'yyyy-MM-dd HH:mm')}
Client Name: ${ticket.customerName}
Phone Number: ${ticket.phoneNumber}
Email: ${ticket.email || 'None'}

FOOTWEAR DETAILS:
-----------------
Model/Style: ${ticket.shoeModel}
Size: ${ticket.shoeSize || 'N/A'}
Leather Type: ${ticket.leatherType || 'N/A'}
Diagnostic Base Price: ₹${ticket.basePrice || 1500}

RESTORATION ITEMS:
------------------
Services: ${ticket.repairType?.join(', ') || 'None'}
Add-on Price: ₹${ticket.addonPrice || 0}
Insurance: ${ticket.insuranceType || 'No Insurance Protection'} (₹${ticket.insurancePrice || 0})

TOTAL:
------
Discount Applied: -₹${ticket.discountAmount || 0}
GRAND TOTAL COST: ₹${ticket.price}
Advance Paid: ₹${ticket.advance || 0} (${ticket.paymentMethod || 'N/A'})
Remaining Balance: ₹${ticket.balance || 0}
Payment Status: ${ticket.paymentStatus || 'Unpaid'}
${ticket.transactionId ? `Transaction Ref: ${ticket.transactionId}` : ''}

Artisan Assigned: ${ticket.assignedCobblerName || 'Unassigned'}
Staff Inspector: ${ticket.receivedBy}
----------------------------------------
Thank you for trusting Cordwainers Studio!
========================================`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt-${ticket.invoiceNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSavePackage = () => {
    if (!editingPackage || !editingPackage.name) {
      alert('Please fill out the Care Name.');
      return;
    }

    const currentPackages = settings?.shoeCarePackages && settings.shoeCarePackages.length > 0
      ? settings.shoeCarePackages
      : PACKAGES;

    let updatedPackages;
    if (editingPackage.id) {
      // Edit existing
      updatedPackages = currentPackages.map(p => 
        (p.id === editingPackage.id || p.name === editingPackage.id)
          ? { id: p.id || editingPackage.id, name: editingPackage.name, price: editingPackage.price, description: editingPackage.description }
          : p
      );
    } else {
      // Create new
      const newPkg = {
        id: `pkg-${Date.now()}`,
        name: editingPackage.name,
        price: editingPackage.price,
        description: editingPackage.description
      };
      updatedPackages = [...currentPackages, newPkg];
    }

    updateSettings({ shoeCarePackages: updatedPackages });
    setIsFormOpen(false);
    setEditingPackage(null);
  };

  const handleDeletePackage = (id: string) => {
    const currentPackages = settings?.shoeCarePackages && settings.shoeCarePackages.length > 0
      ? settings.shoeCarePackages
      : PACKAGES;

    const updatedPackages = currentPackages.filter(p => p.id !== id && p.name !== id);
    updateSettings({ shoeCarePackages: updatedPackages });
  };

  const resetForm = () => {
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setShoeModel('');
    setShoeSize('');
    setLeatherType('Full-Grain');
    setShoeImage('');
    setBasePrice(1500);
    setPlusItems([]);
    setSelectedPackage(carePackages[0] || PACKAGES[0]);
    setIsBespoke(false);
    setInsurancePlan(INSURANCE_PLANS[0]);
    setSelectedOffer(OFFER_CODES[0]);
    setCustomDiscountValue(0);
    setNotes('');
    setAdvanceAmount(0);
    setTransactionId('');
    if (activeCobblers.length > 0) {
      setAssignedCobblerId(activeCobblers[0].id);
    }
    setSubmittedInvoice(null);
    setCurrentStep(0);
  };

  const filteredRepairs = repairs.filter(r => {
    const term = searchQuery.toLowerCase();
    return (
      r.customerName.toLowerCase().includes(term) ||
      (r.shoeModel && r.shoeModel.toLowerCase().includes(term)) ||
      (r.invoiceNumber && r.invoiceNumber.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-24 print:bg-white print:p-0 print:space-y-0 print:pb-0">
      
      {/* HEADER CONTROLS - Hidden when printing */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-dark tracking-tight">CW Care Professional</h1>
          <p className="text-xs text-brand-muted uppercase tracking-wider mt-1">Official internal intake form & invoice generator</p>
        </div>
        
        <div className="flex bg-brand-bg p-1 rounded-lg border border-brand-border shadow-sm">
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              resetForm();
            }}
            className={clsx(
              "px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all flex items-center gap-1.5",
              activeTab === 'history'
                ? "bg-white text-brand-dark shadow-sm border border-brand-border/40" 
                : "text-brand-muted hover:text-brand-dark"
            )}
          >
            📜 Care History ({repairs.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('new-repair');
              setCurrentStep(0);
            }}
            className={clsx(
              "px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all flex items-center gap-1.5",
              activeTab === 'new-repair'
                ? "bg-white text-brand-dark shadow-sm border border-brand-border/40" 
                : "text-brand-muted hover:text-brand-dark"
            )}
          >
            ⚡ New Intake Ticket
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('manage-services');
              resetForm();
            }}
            className={clsx(
              "px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all flex items-center gap-1.5",
              activeTab === 'manage-services'
                ? "bg-white text-brand-dark shadow-sm border border-brand-border/40" 
                : "text-brand-muted hover:text-brand-dark"
            )}
          >
            ✨ Care Catalog ({carePackages.length})
          </button>
        </div>
      </div>

      {/* SUCCESS SCREEN */}
      {submittedInvoice && (
        <div className="bg-white border border-brand-border rounded-2xl shadow-xl p-6 md:p-12 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300 print:hidden">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-100 shadow-sm">
              <FileCheck className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-brand-dark">Invoice Generated Successfully</h2>
            <p className="text-sm text-brand-muted font-mono bg-brand-bg py-1.5 px-4 rounded-full inline-block">
              Intake Ticket: {submittedInvoice.invoiceNumber}
            </p>
            <p className="text-sm text-brand-muted max-w-md mx-auto">
              The intake ticket has been registered in the database. Choose from the professional actions below to communicate, save, or print the invoice.
            </p>
          </div>

          <div className="border-t border-brand-border pt-8 space-y-4 max-w-md mx-auto">
            <h3 className="font-serif text-base font-bold text-brand-dark text-center mb-4">Professional Intake Actions</h3>
            
            <a
              href={getWhatsAppURL(submittedInvoice)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xs uppercase tracking-widest py-3.5 px-6 rounded-xl transition-all shadow-md"
            >
              <Share2 className="w-4 h-4" />
              Send via WhatsApp
            </a>

            <button
              type="button"
              onClick={() => downloadReceipt(submittedInvoice)}
              className="flex items-center justify-center gap-3 w-full bg-brand-olive hover:bg-brand-olive/90 text-white font-bold text-xs uppercase tracking-widest py-3.5 px-6 rounded-xl transition-all shadow-md"
            >
              <Download className="w-4 h-4" />
              Save & Download Invoice (.txt)
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-3 w-full bg-brand-dark hover:bg-brand-muted text-white font-bold text-xs uppercase tracking-widest py-3.5 px-6 rounded-xl transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="flex items-center justify-center gap-3 w-full bg-brand-bg hover:bg-white text-brand-dark border border-brand-border font-bold text-xs uppercase tracking-widest py-3.5 px-6 rounded-xl transition-all"
            >
              Create Another Ticket
            </button>
          </div>
        </div>
      )}

      {/* INTAKE FORM LAYOUT */}
      {activeTab === 'new-repair' && !submittedInvoice && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: STEPPED FORMS (8 Columns) */}
          <div className="lg:col-span-7 bg-white border border-brand-border rounded-2xl shadow-lg overflow-hidden animate-in fade-in duration-300 print:hidden">
            
            {/* Form Headers */}
            <div className="bg-brand-bg/50 border-b border-brand-border p-6 flex justify-between items-center">
              <div>
                <h2 className="font-serif text-xl font-bold text-brand-dark">Care Intake Wizard</h2>
                <p className="text-xs text-brand-muted mt-0.5">Step {currentStep + 1} of 4: {['Client & Expert', 'Footwear Details', 'Services & Add-ons', 'Summary & Discount'][currentStep]}</p>
              </div>
              
              {/* Stepper Dots */}
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map(step => (
                  <button
                    key={step}
                    onClick={() => {
                      // Client side basic validation
                      if (step > currentStep) {
                        if (currentStep === 0 && (!clientName || !clientPhone)) return;
                        if (currentStep === 1 && !shoeModel) return;
                      }
                      setCurrentStep(step);
                    }}
                    className={clsx(
                      "w-7 h-2 rounded-full transition-all duration-300",
                      step === currentStep ? "bg-brand-dark" : "bg-brand-border hover:bg-brand-muted"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Form Container */}
            <form onSubmit={handleFormSubmit} className="p-6 md:p-8 space-y-8">
              
              {/* STEP 1: CLIENT & SALESPERSON */}
              {currentStep === 0 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                  
                  {/* Client Details */}
                  <div className="space-y-4">
                    <h3 className="font-serif text-lg font-bold text-brand-dark border-b border-brand-border pb-1.5">
                      Client Contact Profile
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-1.5">Client Full Name *</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-muted"><User className="w-4 h-4" /></span>
                          <input
                            required
                            type="text"
                            placeholder="e.g. Arvind Kumar Shukla"
                            value={clientName}
                            onChange={e => setClientName(e.target.value)}
                            className="w-full border border-brand-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-dark bg-brand-bg/10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-1.5">Mobile Number *</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-muted"><Phone className="w-4 h-4" /></span>
                          <input
                            required
                            type="tel"
                            placeholder="e.g. +91 99000 88776"
                            value={clientPhone}
                            onChange={e => setClientPhone(e.target.value)}
                            className="w-full border border-brand-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-dark bg-brand-bg/10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-1.5">Email Address</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-muted"><Mail className="w-4 h-4" /></span>
                          <input
                            type="email"
                            placeholder="e.g. customer@luxury.com"
                            value={clientEmail}
                            onChange={e => setClientEmail(e.target.value)}
                            className="w-full border border-brand-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-dark bg-brand-bg/10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Salesperson Identity Section */}
                  <div className="space-y-4 pt-4 border-t border-brand-border/60">
                    <h3 className="font-serif text-lg font-bold text-brand-dark">
                      Store Representative (Salesperson)
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {SALESPERSONS.map(sp => {
                        const isSelected = salesperson.id === sp.id && !customSalespersonName;
                        return (
                          <button
                            key={sp.id}
                            type="button"
                            onClick={() => {
                              setSalesperson(sp);
                              setCustomSalespersonName('');
                            }}
                            className={clsx(
                              "flex flex-col items-center p-3.5 rounded-xl border transition-all text-center space-y-2",
                              isSelected 
                                ? "border-brand-olive bg-brand-olive/5 text-brand-dark ring-1 ring-brand-olive font-bold"
                                : "border-brand-border bg-white hover:bg-brand-bg/30 text-brand-muted"
                            )}
                          >
                            <div className="w-12 h-12 rounded-full bg-brand-bg/50 border border-brand-border/40 flex items-center justify-center text-brand-muted">
                              <User className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-[11px] leading-tight font-semibold text-brand-dark">{sp.name.split(' ')[0]}</p>
                              <p className="text-[9px] text-brand-muted tracking-tight mt-0.5">{sp.role.split(' ')[0]}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Representative option */}
                    <div className="bg-brand-bg/20 p-4 border border-brand-border rounded-xl space-y-3">
                      <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Or Register Custom Salesperson</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          placeholder="Representative Name"
                          value={customSalespersonName}
                          onChange={e => setCustomSalespersonName(e.target.value)}
                          className="flex-1 border border-brand-border rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-brand-dark focus:outline-none bg-white"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* STEP 2: FOOTWEAR DETAILS */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                  <div className="space-y-4">
                    <h3 className="font-serif text-lg font-bold text-brand-dark border-b border-brand-border pb-1.5">
                      Footwear Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-1.5">Shoe Model / Style *</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Park Avenue Oxford Black"
                          value={shoeModel}
                          onChange={e => setShoeModel(e.target.value)}
                          className="w-full border border-brand-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-dark bg-brand-bg/10"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-1.5">Size</label>
                        <input
                          type="text"
                          placeholder="e.g. UK 9 / EU 43"
                          value={shoeSize}
                          onChange={e => setShoeSize(e.target.value)}
                          className="w-full border border-brand-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-dark bg-brand-bg/10"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-1.5">Leather / Upper Material</label>
                        <select
                          value={leatherType}
                          onChange={e => setLeatherType(e.target.value)}
                          className="w-full border border-brand-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-dark bg-brand-bg/10 cursor-pointer"
                        >
                          <option value="Full-Grain">Full-Grain Leather</option>
                          <option value="Calfskin">Premium Calfskin</option>
                          <option value="Suede">Luxury Suede</option>
                          <option value="Cordovan">Shell Cordovan</option>
                          <option value="Exotic Suede">Exotic Hide</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Footwear Value Assessment (₹)</label>
                          <span className="text-[10.5px] font-mono text-brand-olive font-black bg-brand-olive/10 px-2.5 py-0.5 rounded border border-brand-olive/20">₹{basePrice.toLocaleString()}</span>
                        </div>
                        <div className="space-y-2.5 bg-brand-bg/15 p-3 rounded-xl border border-brand-border/40">
                          <input
                            type="range"
                            min="500"
                            max="30000"
                            step="500"
                            value={basePrice}
                            onChange={e => setBasePrice(parseInt(e.target.value) || 500)}
                            className="w-full accent-brand-olive h-1.5 bg-brand-border rounded-lg cursor-pointer transition-all"
                          />
                          <div className="flex justify-between text-[7.5px] text-brand-muted font-bold uppercase tracking-wider">
                            <span>Standard</span>
                            <span>Premium Leather</span>
                            <span>Cordovan Masterpiece</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Photo Upload & Camera Container */}
                  <div className="space-y-3 pt-4 border-t border-brand-border/60">
                    <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Footwear Photo *</label>
                    
                    {isCameraActive ? (
                      <div className="border border-brand-border rounded-2xl p-4 bg-black text-center space-y-4">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full max-h-60 rounded-xl object-cover bg-black mx-auto"
                        />
                        <div className="flex gap-3 justify-center">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="bg-brand-olive text-white font-bold text-xs uppercase tracking-widest py-2 px-4 rounded-lg hover:bg-brand-olive/90 transition-all flex items-center gap-1.5"
                          >
                            <Camera className="w-4 h-4" />
                            Capture Photo
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="bg-brand-bg text-brand-dark font-bold text-xs uppercase tracking-widest py-2 px-4 rounded-lg border border-brand-border hover:bg-white transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="border-2 border-dashed border-brand-border hover:border-brand-dark rounded-2xl p-6 text-center cursor-pointer transition-all bg-brand-bg/10 relative overflow-hidden group">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleShoeImageChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          {shoeImage ? (
                            <div className="space-y-2">
                              <img src={shoeImage} alt="Uploaded Shoe" className="mx-auto max-h-40 rounded-xl object-cover shadow-md" referrerPolicy="no-referrer" />
                              <p className="text-[10px] text-red-500 font-semibold group-hover:underline">Click or drag to replace image</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="w-10 h-10 bg-white border border-brand-border rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <Upload className="w-4 h-4 text-brand-muted" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-brand-dark">Upload High-Res Footwear Diagnostics Photo</p>
                                <p className="text-[9px] text-brand-muted mt-1">Accepts PNG, JPG (Max 10MB)</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {!shoeImage && (
                          <button
                            type="button"
                            onClick={startCamera}
                            className="w-full flex items-center justify-center gap-2 bg-brand-bg hover:bg-white text-brand-dark border border-brand-border font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition-all shadow-sm"
                          >
                            <Camera className="w-4 h-4" />
                            Use Device Camera
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* STEP 3: SERVICES, ACCESSORIES & INSURANCE */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                  
                  {/* Package tier picker */}
                  <div className="space-y-4">
                    <h3 className="font-serif text-lg font-bold text-brand-dark border-b border-brand-border pb-1.5">
                      Select Restoration Package
                    </h3>

                    <div className="space-y-3">
                      {carePackages.map(pkg => {
                        const isSelected = selectedPackage.name === pkg.name && !isBespoke;
                        return (
                          <div
                            key={pkg.id || pkg.name}
                            onClick={() => {
                              setSelectedPackage(pkg);
                              setIsBespoke(false);
                            }}
                            className={clsx(
                              "border rounded-xl p-4 cursor-pointer transition-all flex justify-between items-start",
                              isSelected 
                                ? "border-brand-dark bg-brand-dark text-white shadow-md scale-[1.01]"
                                : "border-brand-border bg-white text-brand-dark hover:border-brand-muted"
                            )}
                          >
                            <div className="space-y-1">
                              <h4 className="font-serif text-sm font-bold">{pkg.name}</h4>
                              <p className={clsx("text-xs leading-relaxed", isSelected ? "text-gray-200" : "text-brand-muted")}>
                                {pkg.description}
                              </p>
                            </div>
                            <span className="font-mono text-sm font-bold pl-4">₹{pkg.price.toLocaleString()}</span>
                          </div>
                        );
                      })}

                      {/* Custom Bespoke Restoration selection */}
                      <div
                        onClick={() => setIsBespoke(true)}
                        className={clsx(
                          "border rounded-xl p-4 cursor-pointer transition-all space-y-3",
                          isBespoke 
                            ? "border-brand-dark bg-brand-dark/5 ring-1 ring-brand-dark"
                            : "border-brand-border bg-white text-brand-dark hover:border-brand-muted"
                        )}
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-serif text-sm font-bold text-brand-dark">Bespoke Custom Restoration</h4>
                          <span className="text-[9px] font-bold text-brand-olive uppercase tracking-wider bg-brand-bg border border-brand-border/60 px-2 py-0.5 rounded">Custom Rate</span>
                        </div>
                        <p className="text-xs text-brand-muted">
                          Establish a custom-built artisanal care program and price rate.
                        </p>
                        
                        {isBespoke && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-brand-border/40 animate-in slide-in-from-top-2 duration-150" onClick={e => e.stopPropagation()}>
                            <div>
                              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1">Custom Service Name</label>
                              <input
                                type="text"
                                placeholder="Bespoke Sole & upper patina dye"
                                value={customPackageName}
                                onChange={e => setCustomPackageName(e.target.value)}
                                className="w-full border border-brand-border rounded-lg p-2 text-xs focus:ring-1 focus:ring-brand-dark bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1">Custom Price Rate (₹)</label>
                              <input
                                type="number"
                                value={customPackagePrice}
                                onChange={e => setCustomPackagePrice(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full border border-brand-border rounded-lg p-2 text-xs focus:ring-1 focus:ring-brand-dark bg-white font-mono"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shoe Plus items (supplies search and append) */}
                  <div className="space-y-4 pt-4 border-t border-brand-border/60">
                    <h3 className="font-serif text-lg font-bold text-brand-dark">
                      Shoe Plus Accessories & Supplies
                    </h3>
                    
                    {/* Add-on selector from real inventory */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-muted" />
                      <input
                        type="text"
                        placeholder="Search premium soles, laces, wood trees..."
                        value={plusSearch}
                        onChange={e => setPlusSearch(e.target.value)}
                        className="w-full border border-brand-border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-dark bg-brand-bg/20"
                      />
                    </div>

                    {/* Stock listing filtered */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto border border-brand-border rounded-xl p-3 bg-brand-bg/10">
                      {inventory.filter(i => i.name.toLowerCase().includes(plusSearch.toLowerCase())).map(item => (
                        <div key={item.id} className="bg-white border border-brand-border/60 p-2.5 rounded-lg flex justify-between items-center text-xs">
                          <div>
                            <p className="font-semibold text-brand-dark">{item.name}</p>
                            <p className="text-[10px] text-brand-muted mt-0.5">₹{item.price || 350} • In Stock: {item.quantity}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addPlusItem(item)}
                            className="bg-brand-dark hover:bg-brand-muted text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                          >
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Current chosen shoe plus bundle */}
                    {plusItems.length > 0 && (
                      <div className="bg-white border border-brand-border rounded-xl p-4 space-y-2.5">
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-widest border-b border-brand-border/40 pb-1">Chosen Shoe Plus Items</label>
                        {plusItems.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-xs text-brand-dark">
                            <span className="font-medium">{item.name} (₹{item.price})</span>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => updatePlusQuantity(item.id, -1)} className="p-1 border border-brand-border rounded hover:bg-brand-bg"><Minus className="w-3 h-3" /></button>
                              <span className="font-mono font-bold w-4 text-center">{item.quantity}</span>
                              <button type="button" onClick={() => updatePlusQuantity(item.id, 1)} className="p-1 border border-brand-border rounded hover:bg-brand-bg"><Plus className="w-3 h-3" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Insurance cover protection */}
                  <div className="space-y-4 pt-4 border-t border-brand-border/60">
                    <h3 className="font-serif text-lg font-bold text-brand-dark">
                      Shoe Insurance Cover Plan
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {INSURANCE_PLANS.map(plan => {
                        const isSelected = insurancePlan.id === plan.id;
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setInsurancePlan(plan)}
                            className={clsx(
                              "p-4 rounded-xl border text-left flex flex-col justify-between transition-all space-y-2",
                              isSelected 
                                ? "border-brand-olive bg-brand-olive/5 text-brand-dark ring-1 ring-brand-olive font-bold"
                                : "border-brand-border bg-white hover:bg-brand-bg/30 text-brand-muted"
                            )}
                          >
                            <div className="space-y-1">
                              <div className="flex justify-between items-center w-full">
                                <span className="font-serif text-xs font-extrabold text-brand-dark">{plan.name}</span>
                                {plan.price > 0 && <span className="font-mono text-[10px] font-bold text-brand-olive bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border">Cover</span>}
                              </div>
                              <p className="text-[10px] leading-snug text-brand-muted">{plan.description}</p>
                            </div>
                            <span className="font-mono text-xs font-bold text-brand-dark block pt-2">₹{plan.price.toLocaleString()}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* STEP 4: DISCOUNT & CONFIRMATION */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                  
                  {/* Offers Dropdown */}
                  <div className="space-y-4">
                    <h3 className="font-serif text-lg font-bold text-brand-dark border-b border-brand-border pb-1.5">
                      Coupon Offers & Custom Discounts
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-1.5">Apply Standard Offer Promo</label>
                        <select
                          value={selectedOffer.code}
                          onChange={e => {
                            const chosen = OFFER_CODES.find(o => o.code === e.target.value);
                            if (chosen) setSelectedOffer(chosen);
                          }}
                          className="w-full border border-brand-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-dark bg-brand-bg/10 cursor-pointer font-sans"
                        >
                          {OFFER_CODES.map(o => (
                            <option key={o.code} value={o.code}>{o.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Discount Field */}
                      <div>
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-1.5">Or Manual Discount</label>
                        <div className="flex gap-2">
                          <select
                            value={customDiscountType}
                            onChange={e => setCustomDiscountType(e.target.value as any)}
                            className="border border-brand-border rounded-xl p-3 text-xs bg-brand-bg/10 focus:outline-none"
                          >
                            <option value="percent">% Off</option>
                            <option value="absolute">₹ Off</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Value"
                            value={customDiscountValue || ''}
                            onChange={e => setCustomDiscountValue(Math.max(0, parseInt(e.target.value) || 0))}
                            className="flex-1 border border-brand-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-dark bg-brand-bg/10 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cobbler & Payment Details Section */}
                  <div className="space-y-4 pt-4 border-t border-brand-border/60">
                    <h3 className="font-serif text-lg font-bold text-brand-dark">
                      Artisan & Payment Allocation
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Cobbler Assignment */}
                      <div>
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-1.5">Assign Master Cobbler</label>
                        <select
                          value={assignedCobblerId}
                          onChange={e => setAssignedCobblerId(e.target.value)}
                          className="w-full border border-brand-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-dark bg-brand-bg/10 cursor-pointer font-sans"
                        >
                          {activeCobblers.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.specialty ? `— (${c.specialty})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Advance Paid */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Advance Deposit (₹)</label>
                          <span className="text-[10.5px] font-mono text-brand-olive font-black bg-brand-olive/10 px-2.5 py-0.5 rounded border border-brand-olive/20">₹{advanceAmount.toLocaleString()}</span>
                        </div>
                        <div className="space-y-2.5 bg-brand-bg/15 p-3 rounded-xl border border-brand-border/40">
                          <input
                            type="range"
                            min="0"
                            max={getGrandTotal() || 5000}
                            step="50"
                            value={advanceAmount}
                            onChange={e => setAdvanceAmount(parseInt(e.target.value) || 0)}
                            className="w-full accent-brand-olive h-1.5 bg-brand-border rounded-lg cursor-pointer transition-all"
                          />
                          <div className="flex justify-between text-[7.5px] text-brand-muted font-bold uppercase tracking-wider">
                            <span>0% (Pay Later)</span>
                            <span>Partial Deposit</span>
                            <span>100% Fully Paid</span>
                          </div>
                        </div>
                      </div>

                      {advanceAmount > 0 && (
                        <>
                          {/* Payment Method */}
                          <div>
                            <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-1.5">Payment Method</label>
                            <select
                              value={advancePaymentMethod}
                              onChange={e => setAdvancePaymentMethod(e.target.value as any)}
                              className="w-full border border-brand-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-dark bg-brand-bg/10 cursor-pointer font-sans"
                            >
                              <option value="Cash">Cash</option>
                              <option value="Card">Card</option>
                              <option value="UPI">UPI</option>
                              <option value="Bank Transfer">Bank Transfer</option>
                            </select>
                          </div>

                          {/* Transaction ID */}
                          <div>
                            <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-1.5">Transaction ID / Reference</label>
                            <input
                              type="text"
                              placeholder="e.g. TXN987654321"
                              value={transactionId}
                              onChange={e => setTransactionId(e.target.value)}
                              className="w-full border border-brand-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-dark bg-brand-bg/10 font-mono"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notes input */}
                  <div className="space-y-4 pt-4 border-t border-brand-border/60">
                    <h3 className="font-serif text-lg font-bold text-brand-dark">
                      Studio Inspector Notes / Instructions
                    </h3>
                    <textarea
                      rows={3}
                      placeholder="e.g. Inspect heel counter stitching meticulously. Avoid excess cream on burnished toe caps."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full border border-brand-border bg-brand-bg/10 p-3.5 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-dark text-brand-dark resize-none transition-all placeholder-brand-muted/45"
                    />
                  </div>

                  {/* Authorization Disclaimers */}
                  <div className="bg-brand-bg/40 border border-brand-border rounded-xl p-5 space-y-4">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-brand-dark border-b border-brand-border pb-1">Diagnostic Legal Terms & Limited Warranty</h4>
                    <p className="text-[10.5px] leading-relaxed text-brand-muted">
                      Every handcrafted care program involves unique material characteristics. Minor tonal variation is expected. The client understands that pre-existing structural damage or severe leather rot poses physical limitations. Cordwainers holds a standard liability limit.
                    </p>
                    
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={e => setTermsAccepted(e.target.checked)}
                        className="w-4.5 h-4.5 border-brand-border rounded focus:ring-0 text-brand-dark"
                      />
                      <span className="text-[11px] font-semibold text-brand-dark">The client authorizes these diagnostic assessment terms.</span>
                    </label>
                  </div>

                </div>
              )}

              {/* NAVIGATION BUTTONS */}
              <div className="flex justify-between items-center pt-6 border-t border-brand-border mt-6">
                {currentStep > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand-muted hover:text-brand-dark px-2 py-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Return
                  </button>
                ) : <div />}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStep === 0 && (!clientName || !clientPhone)) {
                        alert('Required: Name and Mobile Number.');
                        return;
                      }
                      if (currentStep === 1 && !shoeModel) {
                        alert('Required: Shoe model name.');
                        return;
                      }
                      setCurrentStep(currentStep + 1);
                    }}
                    className="flex items-center gap-1 bg-brand-dark text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-muted transition-all"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 bg-brand-olive text-white px-7 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-md"
                  >
                    <FileCheck className="w-4 h-4" /> Generate Invoice & Save
                  </button>
                )}
              </div>

            </form>

          </div>

          {/* RIGHT SIDE: LIVE RECALCULATING INVOICE PREVIEW (5 Columns) */}
          <div className="lg:col-span-5 bg-white border border-brand-border rounded-2xl shadow-xl p-6 space-y-6 print:block print:border-none print:shadow-none print:p-0">
            <h3 className="font-serif text-lg font-bold text-gray-900 border-b border-brand-border/60 pb-2 flex items-center justify-between print:hidden">
              <span>Live Receipt Invoice</span>
              <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-brand-olive bg-brand-bg border border-brand-border/60 px-2 py-0.5 rounded animate-pulse">Live</span>
            </h3>

            {/* Skeuomorphic Printed-Paper Container */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl space-y-5 font-mono text-xs text-gray-800 shadow-sm relative overflow-hidden">
              
              {/* Receipt Header */}
              <div className="text-center space-y-1">
                <h4 className="font-serif text-sm font-extrabold uppercase tracking-wider text-black">Cordwainers Studio</h4>
                <p className="text-[10px] text-gray-500">Luxury Shoe Restoration & Cobblers</p>
                <p className="text-[9px] text-gray-500">Phone: +91 99000 88776 • Bangalore</p>
              </div>

              <hr className="border-dashed border-gray-300" />

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-y-1 text-[11px]">
                <span className="text-gray-500">Client Profile:</span>
                <span className="text-black font-semibold font-sans text-right">{clientName || 'Arvind K. Shukla'}</span>
                
                <span className="text-gray-500">Mobile No:</span>
                <span className="text-black text-right">{clientPhone || '+91 99000 88776'}</span>

                <span className="text-gray-500">Email ID:</span>
                <span className="text-black text-right truncate pl-2">{clientEmail || 'no-email@cordwainers.com'}</span>
              </div>

              <hr className="border-dashed border-gray-300" />

              {/* Assigned Representative Profile */}
              <div className="flex items-center gap-3 bg-brand-bg/25 border border-brand-border/40 p-2.5 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-brand-bg border border-brand-border/30 flex items-center justify-center text-brand-muted">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold font-sans">Assigned Specialist</p>
                  <p className="text-[11px] font-bold text-gray-900 font-sans">{customSalespersonName || salesperson.name}</p>
                </div>
              </div>

              <hr className="border-dashed border-gray-300" />

              {/* Footwear Diagnostics */}
              <div className="space-y-2">
                <p className="font-bold text-black font-sans text-[11px] tracking-wide">DIAGNOSED FOOTWEAR:</p>
                <div className="flex items-start gap-3">
                  {shoeImage ? (
                    <img
                      src={shoeImage}
                      alt="Diagnosed shoe"
                      className="w-14 h-14 rounded object-cover border border-brand-border/30"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400">
                      No Photo
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <p className="font-sans font-bold text-[11px] text-gray-900 line-clamp-2">{shoeModel || 'Bespoke Allen Edmonds'}</p>
                    <p className="text-[10px] text-gray-500">Size: {shoeSize || 'UK 9'} • {leatherType}</p>
                  </div>
                </div>
              </div>

              <hr className="border-dashed border-gray-300" />

              {/* Detailed itemized breakdown of repair cost */}
              <div className="space-y-1.5 text-[11px]">
                <p className="font-bold text-black font-sans text-[11px] tracking-wide mb-1">TOTAL RESTORATION DETAIL COST:</p>
                
                {/* Base Value */}
                <div className="flex justify-between">
                  <span className="text-gray-500">- Initial Diagnostics/Base Fee:</span>
                  <span className="text-black font-semibold">₹{basePrice}</span>
                </div>

                {/* Restoration package */}
                <div className="flex justify-between">
                  <span className="text-gray-500">- Program: {getPackageName()}</span>
                  <span className="text-black font-semibold">₹{getPackageCost()}</span>
                </div>

                {/* Shoe plus items */}
                {plusItems.map(item => (
                  <div key={item.id} className="flex justify-between pl-3 text-gray-600">
                    <span>* Plus Add-on: {item.name} (x{item.quantity})</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}

                {/* Insurance plan */}
                <div className="flex justify-between">
                  <span className="text-gray-500">- protection: {insurancePlan.name}</span>
                  <span className="text-black font-semibold">₹{getInsuranceCost()}</span>
                </div>
              </div>

              <hr className="border-dashed border-gray-300" />

              {/* Total Calculation Area */}
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal Cost:</span>
                  <span>₹{getSubtotal()}</span>
                </div>

                {getDiscountAmount() > 0 && (
                  <div className="flex justify-between text-red-600 font-semibold">
                    <span>Coupon/Offer Discount:</span>
                    <span>-₹{getDiscountAmount()}</span>
                  </div>
                )}

                <div className="flex justify-between font-sans font-bold text-black text-xs pt-1.5 border-t border-gray-200">
                  <span className="uppercase tracking-wider">Estimated Grand Total</span>
                  <span className="text-sm">₹{getGrandTotal()}</span>
                </div>
                <p className="text-[8px] text-gray-400 font-sans italic text-right mt-1">Inclusive of estimated standard GST charges (18%)</p>
              </div>

              <hr className="border-dashed border-gray-300" />

              {/* Print Footer / Terms Clickable Link */}
              <div className="text-center pt-2 space-y-3">
                <BarcodeSVG value="INV-CARE-PENDING" />
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-[9px] font-sans font-bold uppercase tracking-widest text-brand-dark hover:underline border-b border-brand-dark mt-2.5 print:hidden"
                >
                  Intake Terms & Conditions Link
                </button>
                <p className="hidden print:block text-[8px] text-gray-400 text-center font-sans">
                  Official Terms Link: https://cordwainers.com/care-terms
                </p>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* MANAGE SERVICES TIER CATALOG */}
      {activeTab === 'manage-services' && (
        <div className="bg-white border border-brand-border rounded-2xl shadow-xl overflow-hidden p-6 md:p-8 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-brand-border pb-6">
            <div>
              <h3 className="font-serif text-2xl font-bold text-brand-dark">CW Care Services</h3>
              <p className="text-xs text-brand-muted uppercase tracking-wider mt-1">Configure luxury shoe restoration services, diagnostic options, and custom charges</p>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setEditingPackage({ id: '', name: '', price: 1000, description: '' });
                setIsFormOpen(true);
              }}
              className="px-4 py-2.5 bg-brand-dark hover:bg-brand-muted text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add New Care Service
            </button>
          </div>

          {/* Form Modal / Inline editor for adding/editing */}
          {isFormOpen && editingPackage && (
            <div className="mb-8 p-6 bg-brand-bg/30 border border-brand-border rounded-xl space-y-4 animate-in slide-in-from-top-4 duration-200">
              <h4 className="font-serif text-sm font-bold text-brand-dark uppercase tracking-wide">
                {editingPackage.id ? 'Edit Care Service' : 'Create Custom Care Service'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1">Care Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Exotic Polish & Conditioning"
                    value={editingPackage.name}
                    onChange={e => setEditingPackage({ ...editingPackage, name: e.target.value })}
                    className="w-full border border-brand-border rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1">Charges / Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1500"
                    value={editingPackage.price}
                    onChange={e => setEditingPackage({ ...editingPackage, price: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full border border-brand-border rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1">Description / Services Included</label>
                  <input
                    type="text"
                    placeholder="e.g. Saphir cream finish, minor scuff removal..."
                    value={editingPackage.description}
                    onChange={e => setEditingPackage({ ...editingPackage, description: e.target.value })}
                    className="w-full border border-brand-border rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-brand-border/40">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingPackage(null);
                  }}
                  className="px-4 py-2 border border-brand-border rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white transition-all text-brand-dark"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePackage}
                  className="px-4 py-2 bg-brand-olive text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-brand-olive/95 transition-all"
                >
                  {editingPackage.id ? 'Save Changes' : 'Add Care Service'}
                </button>
              </div>
            </div>
          )}

          {/* List of active Care Services */}
          {carePackages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {carePackages.map(pkg => (
                <div 
                  key={pkg.id || pkg.name}
                  className="border border-brand-border rounded-xl p-5 bg-white flex flex-col justify-between hover:border-brand-dark hover:shadow-md transition-all group"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-serif text-sm font-bold text-brand-dark leading-tight">{pkg.name}</h4>
                      <span className="font-mono text-xs font-bold text-brand-olive bg-brand-olive/10 px-2 py-0.5 rounded border border-brand-olive/20 shrink-0">
                        ₹{pkg.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-brand-muted leading-relaxed">
                      {pkg.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end mt-5 pt-3 border-t border-brand-bg">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPackage({
                          id: pkg.id || pkg.name,
                          name: pkg.name,
                          price: pkg.price,
                          description: pkg.description || ''
                        });
                        setIsFormOpen(true);
                      }}
                      className="p-1.5 hover:bg-brand-bg rounded-lg text-brand-accent hover:text-brand-dark transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the care service "${pkg.name}"?`)) {
                          handleDeletePackage(pkg.id || pkg.name);
                        }
                      }}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-brand-muted hover:text-red-600 transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-brand-border rounded-2xl bg-brand-bg/10">
              <p className="text-xs text-brand-muted italic">
                No care services or restoration packages configured yet. Click above to add a new service!
              </p>
            </div>
          )}
        </div>
      )}

      {/* CARE RECORDS HISTORY TABLE */}
      {activeTab === 'history' && (
        <div className="bg-white border border-brand-border rounded-2xl shadow-xl overflow-hidden p-6 md:p-8 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-brand-border pb-6">
            <div>
              <h3 className="font-serif text-2xl font-bold text-brand-dark">CW Care Intake Logs</h3>
              <p className="text-xs text-brand-muted uppercase tracking-wider mt-1">Search or delete customer care records & premium diagnostic assessments</p>
            </div>
            
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-brand-muted" />
              </span>
              <input
                type="text"
                placeholder="Search Client, Model or Ticket ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-brand-border rounded-xl text-xs placeholder-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-dark bg-brand-bg transition-colors"
              />
            </div>
          </div>

          {filteredRepairs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-border">
                <thead>
                  <tr className="bg-brand-bg">
                    <th className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Ticket ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Client Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Diagnosed Footwear</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Care Specialist</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Intake Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-brand-olive uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-brand-olive uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-brand-border">
                  {filteredRepairs.map(item => (
                    <tr key={item.id} className="hover:bg-brand-bg/25 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-brand-dark">
                        {item.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-brand-dark">
                        {item.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-brand-muted">
                        {item.shoeModel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-brand-dark">
                        {item.receivedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-brand-muted">
                        {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-serif font-bold text-brand-dark">
                        ₹{(item.price || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to permanently delete intake record for ${item.customerName}?`)) {
                              deleteRepair(item.id);
                            }
                          }}
                          className="text-brand-muted hover:text-red-500 transition-colors p-1"
                          title="Delete Intake Log"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-brand-border rounded-2xl bg-brand-bg/10">
              <p className="text-xs text-brand-muted italic">
                {searchQuery ? 'No intake logs matched your search filters.' : 'No customer intake records registered in CW Care yet.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TERMS AND CONDITIONS MODAL LINK */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-brand-border rounded-2xl p-6 md:p-8 max-w-lg w-full relative space-y-5 animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setShowTermsModal(false)}
              className="absolute top-4 right-4 text-brand-muted hover:text-brand-dark p-1.5 rounded-full hover:bg-brand-bg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 text-center border-b border-brand-border pb-4">
              <ShieldCheck className="w-10 h-10 text-brand-olive mx-auto" />
              <h3 className="font-serif text-xl font-bold text-brand-dark">CW Care Handcrafted Terms</h3>
              <p className="text-[10px] text-brand-muted uppercase tracking-widest font-semibold">Official Code of Handcrafted Restoration Service</p>
            </div>

            <div className="max-h-72 overflow-y-auto text-xs text-brand-muted space-y-4 pr-1 leading-relaxed">
              <p>
                <strong>1. Diagnostics Inspection:</strong> Every incoming shoe undergoes manual inspection by our chief inspection team before being allocated to specialized cordwainers.
              </p>
              <p>
                <strong>2. Material Character & Aging:</strong> Cordwainers utilizes high-grade, vegetable-tanned full grain leathers and premium stack blocks. Slight variations in density, patina, or dye absorption are a natural feature of fine-grade skins.
              </p>
              <p>
                <strong>3. Pre-existing Failures:</strong> Inherent structural failures (severe leather rot, dry-rot, and previous sub-standard cobbler modifications) place objective physical boundaries on recovery results. We communicate these limits prior to repair.
              </p>
              <p>
                <strong>4. Guarantee & Limit of Liability:</strong> Completed works hold a 30-day standard satisfaction guarantee. Claims are subject to assessment. Cordwainers’ liability is capped at twice the total cost of service.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowTermsModal(false)}
              className="w-full py-3 bg-brand-dark text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-muted transition-colors text-center"
            >
              Understand & Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
