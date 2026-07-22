import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import PhotoManager from '../components/PhotoManager';
import { ShoeRepairRequest, RepairPhoto } from '../types';
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
  Download,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import VoiceToText from '../components/VoiceToText';

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
    role: 'Store Lead & Chief Inspector',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'SP-002',
    name: 'Pooja Sharma',
    role: 'Boutique Specialist',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'SP-003',
    name: 'Rahul Deshmukh',
    role: 'Senior Artisan & Cordwainer',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'SP-004',
    name: 'Amit Patel',
    role: 'Associate Intake Specialist',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop'
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
      <svg width="180" height="40" style={{ color: '#000000', overflow: 'visible' }}>
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
  const { repairs, addRepair, deleteRepair, inventory, settings, updateSettings, customers } = useAppStore();

  const carePackages = settings?.shoeCarePackages && settings.shoeCarePackages.length > 0
    ? settings.shoeCarePackages
    : PACKAGES;

  const salespersons = settings?.employees?.length > 0 ? settings.employees : SALESPERSONS;

  const insurancePlans = settings?.insurancePlans?.length > 0 ? settings.insurancePlans : [
    { id: 'basic', name: 'Basic Care Cover', price: 499, description: '1 Year accidental scuff cover & minor stitching repairs' },
    { id: 'premium', name: 'Premium Lifetime Shield', price: 1499, description: 'Lifetime wear warranty & comprehensive material replacement discount' }
  ];

  const offerCodes = settings?.offers?.length > 0 ? settings.offers.map(o => ({ code: o.code, label: o.name, percentage: o.discountPercentage })) : [
    { code: 'NONE', label: 'No Offer Applied', percentage: 0 },
    { code: 'WELCOME10', label: 'Welcome Intake Discount (10%)', percentage: 10 },
    { code: 'FESTIVE15', label: 'Festive Season Offer (15%)', percentage: 15 },
    { code: 'ARTISAN20', label: 'Exclusive Artisan Circle (20%)', percentage: 20 }
  ];

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<{ id: string; name: string; price: number; description: string } | null>(null);
  const [newItem, setNewItem] = useState<{ name: string; category: string; quantity: number; unit: string; price: number }>({ name: '', category: '', quantity: 0, unit: '', price: 0 });

  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Bank Transfer'>('Cash');
  const [transactionId, setTransactionId] = useState<string>('');
  const [pickupCharge, setPickupCharge] = useState<number>(0);

  const queryParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState<'history' | 'new-repair' | 'manage-services'>(() => {
    const tab = queryParams.get('tab');
    if (tab === 'history') {
      return 'history';
    }
    if (tab === 'manage-services') {
      return 'manage-services';
    }
    return 'new-repair';
  });

  // State wizard
  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [submittedInvoice, setSubmittedInvoice] = useState<any>(null);

  // Form Fields State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('+91 ');
  const [showDropdown, setShowDropdown] = useState(true);
  const [clientEmail, setClientEmail] = useState('');
  const [shoeColor, setShoeColor] = useState('');
  
  const [salesperson, setSalesperson] = useState(() => {
    const list = settings?.employees?.length > 0 ? settings.employees : SALESPERSONS;
    return list[0];
  });
  const [customSalespersonName, setCustomSalespersonName] = useState('');

  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [shoeModel, setShoeModel] = useState('');
  const [sizeCategory, setSizeCategory] = useState<'mens' | 'ladies'>('mens');
  const [shoeSize, setShoeSize] = useState('');
  const MENS_SIZES = ['UK 6', 'UK 6.5', 'UK 7', 'UK 7.5', 'UK 8', 'UK 8.5', 'UK 9', 'UK 9.5', 'UK 10', 'UK 10.5', 'UK 11', 'UK 12'];
  const LADIES_SIZES = ['UK 3', 'UK 3.5', 'UK 4', 'UK 4.5', 'UK 5', 'UK 5.5', 'UK 6', 'UK 6.5', 'UK 7', 'UK 7.5', 'UK 8'];
  const [shoeImage, setShoeImage] = useState('');
  const [beforePhotos, setBeforePhotos] = useState<RepairPhoto[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<RepairPhoto[]>([]);
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

  // Expected Delivery Date (Default 10 days from now in YYYY-MM-DD)
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(() => {
    const defaultDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    return defaultDate.toISOString().split('T')[0];
  });

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
    return getPackageCost() + getPlusItemsTotal() + getInsuranceCost() + pickupCharge;
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
    const stockItem = inventory.find(item => item.id === inv.id) || inv;
    const stockQty = stockItem.quantity ?? 0;
    
    const existing = plusItems.find(item => item.id === inv.id);
    const currentQty = existing ? existing.quantity : 0;
    
    if (currentQty >= stockQty) {
      alert(`Cannot add more "${inv.name}". Only ${stockQty} units are in stock.`);
      return;
    }

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
    const stockItem = inventory.find(item => item.id === id);
    const stockQty = stockItem ? stockItem.quantity : 999;

    setPlusItems(plusItems.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (delta > 0 && newQty > stockQty) {
          alert(`Cannot add more. Only ${stockQty} units of "${item.name}" are in stock.`);
          return item;
        }
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
      shoeModel: `${shoeModel} ${shoeSize ? `(Size: ${shoeSize})` : ''}`,
      shoeColor: shoeColor,
      shoeSize: shoeSize,
      repairType: [getPackageName()],
      description: `Footwear Base Price: ₹${basePrice}\nSupplies: ${plusItems.map(i => `${i.name} x${i.quantity}`).join(', ') || 'None'}\nDiagnostics notes: ${notes}`,
      photoUrl: shoeImage || 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&q=80&w=300',
      beforePhotos,
      afterPhotos,
      status: 'Received' as const,
      shoeIcon: 'default',
      price: getGrandTotal(),
      dueDate: new Date(expectedDeliveryDate).toISOString(),
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
      pickupCharge: pickupCharge,
      salespersonId: salesperson.id,
      salespersonName: salespersonNameVal,
      basePrice: basePrice,
      packagePrice: getPackageCost(),
      discountPercentage: selectedOffer.percentage || (customDiscountType === 'percent' ? customDiscountValue : 0),
      advance: advanceAmount,
      balance: Math.max(0, getGrandTotal() - advanceAmount),
      paymentMethod: (advanceAmount > 0 ? advancePaymentMethod : 'None') as 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Net Banking' | 'None',
      paymentStatus: (advanceAmount === 0 ? 'Unpaid' : (advanceAmount >= getGrandTotal() ? 'Fully Paid' : 'Partially Paid')) as 'Unpaid' | 'Partially Paid' | 'Fully Paid',
      transactionId: transactionId || '',
      receiveSmsUpdates: true,
      statusHistory: [],
    };

    const newTicket = addRepair(requestPayload);
    setSubmittedInvoice(newTicket);
  };

  const getWhatsAppURL = (ticket: any) => {
    if (!ticket) return '#';
    
    const template = settings.whatsappIntakeTemplate || '*CORDWAINERS CARE - OFFICIAL INTAKE CONFIRMATION*%0A%0AHello *{customerName}*, your footwear has been registered successfully for luxury restoration!%0A%0A*Ticket ID:* {invoiceNumber}%0A*Footwear:* {shoeModel}%0A%0A*TOTAL RESTORATION COST:* ₹{price}%0A%0AView Terms & Conditions: https://cordwainers.com/care-terms%0AThank you for trusting Cordwainers Studio!';
    
    const text = template
      .replace(/{customerName}/g, ticket.customerName)
      .replace(/{repairType}/g, Array.isArray(ticket.repairType) ? ticket.repairType.join(', ') : ticket.repairType)
      .replace(/{status}/g, 'Received')
      .replace(/{invoiceNumber}/g, ticket.invoiceNumber)
      .replace(/{shoeModel}/g, ticket.shoeModel)
      .replace(/{price}/g, ticket.price.toString())
      .replace(/{balance}/g, (ticket.price - (ticket.advance || 0)).toString());

    return `https://api.whatsapp.com/send?phone=${ticket.phoneNumber.replace(/\D/g, '')}&text=${encodeURIComponent(text.replace(/%0A/g, '\n'))}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const receiptRef = useRef<HTMLDivElement>(null);

  const downloadReceiptAsImage = async (ticket: any) => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Receipt-${ticket.invoiceNumber}.png`;
      link.click();
    } catch (err) {
      console.error("Failed to generate image receipt:", err);
      alert("Failed to generate image receipt. Please try using the Print option.");
    }
  };

  const downloadReceiptAsPDF = async (ticket: any) => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Receipt-${ticket.invoiceNumber}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF receipt:", err);
      alert("Failed to generate PDF receipt. Please try using the Print option.");
    }
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
Pickup Charges: ₹${ticket.pickupCharge || 0}
Insurance: ${ticket.insuranceType || 'No Insurance Protection'} (₹${ticket.insurancePrice || 0})

TOTAL:
------
Discount Applied: -₹${ticket.discountAmount || 0}
GRAND TOTAL COST: ₹${ticket.price}
Advance Paid: ₹${ticket.advance || 0} (${ticket.paymentMethod || 'N/A'})
Remaining Balance: ₹${ticket.balance || 0}
Payment Status: ${ticket.paymentStatus || 'Unpaid'}
${ticket.transactionId ? `Transaction Ref: ${ticket.transactionId}` : ''}

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

  const ReceiptDocument = ({ ticket }: { ticket: any }) => {
    const basePr = ticket.basePrice || 1500;
    const addonsPriceSum = ticket.addons?.reduce((sum: number, item: any) => sum + (item.price * (item.quantity || 1)), 0) || ticket.addonPrice || 0;
    const insCost = ticket.hasInsurance ? (ticket.insurancePrice || 0) : 0;
    const pickCost = ticket.pickupCharge || 0;
    const isOldInvoice = ticket.price >= (basePr + addonsPriceSum + insCost + pickCost);
    const restorationCost = ticket.packagePrice !== undefined 
      ? ticket.packagePrice 
      : (isOldInvoice 
          ? Math.max(0, ticket.price - basePr - addonsPriceSum - insCost - pickCost + (ticket.discountAmount || 0))
          : Math.max(0, ticket.price - addonsPriceSum - insCost - pickCost + (ticket.discountAmount || 0))
        );

    const safeFormatDate = (dateVal: any) => {
      try {
        return format(new Date(dateVal || Date.now()), 'dd MMM yyyy • HH:mm');
      } catch (e) {
        return 'N/A';
      }
    };

    const safeFormatDueDate = (dateVal: any) => {
      try {
        return format(new Date(dateVal), 'dd MMM yyyy');
      } catch (e) {
        return 'N/A';
      }
    };

    return (
      <div ref={receiptRef} className="max-w-2xl mx-auto bg-white border rounded-none p-0 relative" style={{ backgroundColor: '#FFFFFF', color: '#1A1A1A', borderColor: '#E5E7EB' }}>
        {/* Receipt Header */}
        <div className="p-8 text-center space-y-2" style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
          <h2 className="text-2xl font-black tracking-widest uppercase" style={{ fontFamily: 'Outfit, sans-serif' }}>{settings.storeName}</h2>
          <p className="text-[9px] font-bold tracking-[0.3em]" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Luxury Footwear Restoration • Archive Registry</p>
          {ticket.invoiceNumber && !ticket.invoiceNumber.includes('PENDING') && !ticket.invoiceNumber.includes('DRAFT') ? (
            <div className="pt-4 flex justify-center">
              <div className="bg-white px-5 py-2.5 rounded-xl inline-block shadow-md border border-brand-border/20">
                <BarcodeSVG value={ticket.invoiceNumber} />
              </div>
            </div>
          ) : (
            <div className="pt-4 text-center">
              <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] border border-dashed border-white/20 px-3.5 py-1.5 rounded-xl text-white/40">
                Draft Repair Intake • Barcode Hidden
              </span>
            </div>
          )}
        </div>

        <div className="p-8 space-y-8 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
          {/* Receipt Metadata */}
          <div className="flex justify-between items-start border-b pb-6" style={{ borderColor: '#E5E7EB' }}>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#6B7280' }}>Customer</p>
              <p className="text-sm font-black uppercase tracking-tight" style={{ color: '#1A1A1A' }}>{ticket.customerName}</p>
              <p className="text-[10px] font-medium" style={{ color: '#6B7280' }}>{ticket.phoneNumber}</p>
              {ticket.dueDate && (
                <div className="pt-2">
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#6B7280' }}>Expected Delivery</p>
                  <p className="text-[11px] font-black text-amber-600 uppercase tracking-wide">
                    {safeFormatDueDate(ticket.dueDate)}
                  </p>
                </div>
              )}
            </div>
            <div className="text-right space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#6B7280' }}>Studio Location</p>
              <p className="text-[10px] font-bold uppercase" style={{ color: '#1A1A1A' }}>{settings.storeName}</p>
              <p className="text-[9px] text-gray-500 font-medium">{settings.address}</p>
              <p className="text-[9px] text-brand-olive font-bold">Call: {(settings as any).phone || '+91 98765 43210'}</p>
              <div className="pt-2">
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#6B7280' }}>Date / Time</p>
                <p className="text-[10px] font-bold uppercase" style={{ color: '#1A1A1A' }}>{safeFormatDate(ticket.createdAt)}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#3B82F6]">Inspector: {ticket.receivedBy}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-4">
            <div className="grid grid-cols-4 text-[9px] font-black uppercase tracking-widest border-b pb-2" style={{ color: '#6B7280', borderColor: '#E5E7EB' }}>
              <div className="col-span-2">Description</div>
              <div className="text-center">Rate</div>
              <div className="text-right">Amount</div>
            </div>

            <div className="space-y-3">
              {/* 1. Footwear Diagnostics & Base Assessment */}
              <div className="grid grid-cols-4 text-[11px] items-center pb-2 border-b border-dashed border-gray-100" style={{ color: '#1A1A1A' }}>
                <div className="col-span-2">
                  <p className="font-black uppercase tracking-tight">Footwear Diagnostics & Base Assessment</p>
                  <p className="text-[9px] font-medium mt-0.5" style={{ color: '#6B7280' }}>
                    {ticket.shoeModel} {ticket.shoeColor ? `| Color: ${ticket.shoeColor}` : ''} {ticket.shoeSize ? `| Size: ${ticket.shoeSize}` : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                  ₹{basePr.toLocaleString()}
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: isOldInvoice ? '#1A1A1A' : '#6B7280' }}>
                  {isOldInvoice ? `₹${basePr.toLocaleString()}` : 'Declared Value'}
                </div>
              </div>

              {/* 2. Restoration Service */}
              <div className="grid grid-cols-4 text-[11px] items-center pb-2 border-b border-dashed border-gray-100" style={{ color: '#1A1A1A' }}>
                <div className="col-span-2">
                  <p className="font-black uppercase tracking-tight">Restoration: {ticket.repairType?.[0]}</p>
                  <p className="text-[9px] font-medium mt-0.5" style={{ color: '#6B7280' }}>
                    Artisan restoration package fee
                  </p>
                </div>
                <div style={{ textAlign: 'center', fontFamily: 'monospace' }}>₹{restorationCost.toLocaleString()}</div>
                <div style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>₹{restorationCost.toLocaleString()}</div>
              </div>

              {ticket.addons?.map((item: any) => (
                <div key={item.id} className="grid grid-cols-4 text-[11px] items-center" style={{ color: '#1A1A1A' }}>
                  <div className="col-span-2 italic" style={{ color: '#6B7280' }}>
                    {item.name} (x{item.quantity})
                  </div>
                  <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '10px' }}>₹{item.price}</div>
                  <div style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>₹{(item.price * item.quantity).toLocaleString()}</div>
                </div>
              ))}

              {ticket.hasInsurance && (
                <div className="grid grid-cols-4 text-[11px] items-center" style={{ color: '#1A1A1A' }}>
                  <div className="col-span-2 italic" style={{ color: '#6B7280' }}>
                    {ticket.insuranceType} Protection
                  </div>
                  <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '10px' }}>₹{ticket.insurancePrice}</div>
                  <div style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>₹{(ticket.insurancePrice || 0).toLocaleString()}</div>
                </div>
              )}

              {(ticket.pickupCharge || 0) > 0 && (
                <div className="grid grid-cols-4 text-[11px] items-center" style={{ color: '#1A1A1A' }}>
                  <div className="col-span-2 italic" style={{ color: '#6B7280' }}>
                    Pickup & Handling Charges
                  </div>
                  <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '10px' }}>₹{ticket.pickupCharge}</div>
                  <div style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>₹{(ticket.pickupCharge || 0).toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>

          {/* Totals Section */}
          <div className="border-t-2 pt-4 space-y-2" style={{ borderTop: '2px solid #1A1A1A' }}>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>
              <span>Subtotal Assessment</span>
              <span style={{ fontFamily: 'monospace', color: '#1A1A1A' }}>₹{(ticket.price + (ticket.discountAmount || 0)).toLocaleString()}</span>
            </div>
            
            {(ticket.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3B82F6' }}>
                <span>Promotional Savings {ticket.appliedOfferCode ? `(${ticket.appliedOfferCode})` : ''}</span>
                <span style={{ fontFamily: 'monospace' }}>-₹{(ticket.discountAmount || 0).toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-black uppercase tracking-tight pt-2 border-t" style={{ color: '#1A1A1A', borderTop: '1px solid #E5E7EB' }}>
              <span>Grand Total</span>
              <span style={{ fontFamily: 'Outfit, sans-serif' }}>₹{ticket.price.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest pt-2" style={{ color: '#4B5563' }}>
              <span>Advance Paid ({ticket.paymentMethod})</span>
              <span style={{ fontFamily: 'monospace' }}>₹{(ticket.advance || 0).toLocaleString()}</span>
            </div>

            {ticket.transactionId && (
              <div className="text-right">
                <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Ref: {ticket.transactionId}</p>
              </div>
            )}

            <div className="flex justify-between text-sm font-black uppercase tracking-tight pt-1" style={{ color: '#DC2626' }}>
              <span>Balance Payable</span>
              <span style={{ fontFamily: 'Outfit, sans-serif' }}>₹{(ticket.balance || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Shoe Care Tip Section */}
          <div className="p-4 rounded-xl border border-dashed text-left space-y-1" style={{ borderColor: '#D1D5DB', backgroundColor: '#F9FAFB' }}>
            <p className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: '#92400E' }}>✦ Meticulous Care Recommendation</p>
            <p className="text-[10px] font-medium leading-relaxed" style={{ color: '#4B5563' }}>
              {(() => {
                const tips = [
                  "Store your luxury leather footwear in soft cotton shoe bags to protect them from dust and moisture.",
                  "Never dry wet leather shoes near a direct heat source or radiator, as this can cause the leather to stiffen and crack.",
                  "Use cedar shoe trees after every wear to absorb ambient moisture, maintain original shape, and reduce creasing.",
                  "Apply premium wax polish once every two weeks to establish a safe, water-resistant outer barrier.",
                  "For suede footwear, always use a specialized crepe brush to gently lift and restore the nap of the material.",
                  "Allow your handcrafted footwear to rest for at least 24 hours between wears to let the natural moisture evaporate."
                ];
                const index = ticket.invoiceNumber ? (ticket.invoiceNumber.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % tips.length) : 0;
                return tips[index];
              })()}
            </p>
          </div>

          {/* Footer Terms */}
          <div className="pt-8 border-t text-center space-y-4" style={{ borderColor: '#E5E7EB' }}>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#1A1A1A' }}>Thank you for choosing Cordwainers Studio</p>
              <p className="text-[8px] font-medium" style={{ color: '#6B7280' }}>We appreciate your trust in our artisanal restoration process.</p>
            </div>
            <p className="text-[8px] uppercase tracking-[0.2em] font-bold leading-relaxed" style={{ color: '#6B7280' }}>
              This is a digital archival document. Terms & Conditions apply as per CW standard liability policy. Handcrafted restoration entails minor artisanal variations.
            </p>
          </div>
        </div>
        
        {/* Decorative Receipt Edge */}
        <div className="h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSI0IiB2aWV3Qm94PSIwIDAgMTYgNCI+PHBhdGggZD0iTTAgNEw0IDBMODQgTDEyIDBMMTYgNFoiIGZpbGw9IiNmOWY5ZjkiLz48L3N2Zz4=')] bg-repeat-x" style={{ opacity: 0.1 }} />
      </div>
    );
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
    setShoeImage('');
    setBeforePhotos([]);
    setAfterPhotos([]);
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
    setPickupCharge(0);
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
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-300 print:bg-white print:p-0 print:space-y-0 print:pb-0">
      
      <header className="flex flex-col items-center justify-center text-center gap-6">
        <div className="space-y-1">
          <h2 className="font-display text-4xl font-black text-brand-dark tracking-tighter uppercase leading-none text-center">Cordwainers Intake</h2>
          <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] mt-3 text-center">Repair & Registry Management</p>
        </div>
        <div className="flex bg-white/50 p-1 rounded-2xl border border-brand-border backdrop-blur-sm shadow-sm shrink-0 overflow-x-auto scrollbar-hide max-w-full justify-center">
          {[
            { id: 'history', label: 'Records' },
            { id: 'new-repair', label: 'Intake' },
            { id: 'manage-services', label: 'Services' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id !== 'new-repair') resetForm();
              }}
              className={clsx(
                "px-4 sm:px-8 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-brand-dark text-white shadow-premium" 
                  : "text-brand-muted hover:text-brand-dark"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* SUCCESS SCREEN */}
      {submittedInvoice && (
        <div className="bg-white border border-brand-border rounded-[40px] shadow-premium p-8 md:p-16 max-w-3xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-500 print:hidden relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 opacity-20" />
          
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-100 shadow-premium">
              <FileCheck className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-4xl font-black text-brand-dark tracking-tight uppercase">Intake Successful</h2>
              <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em]">Handcrafted Care Registry Updated</p>
            </div>
            <div className="inline-block bg-brand-bg px-8 py-3 rounded-full border border-brand-border">
              <p className="text-xs font-black text-brand-dark uppercase tracking-widest">
                Ticket ID: <span className="font-mono text-brand-accent ml-2">{submittedInvoice.invoiceNumber}</span>
              </p>
            </div>
            <p className="text-[11px] text-brand-muted font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed">
              The intake ticket has been securely committed to the artisanal vault. Choose an action below to proceed with client communication.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-8 border-t border-brand-border max-w-2xl mx-auto">
            <a
              href={getWhatsAppURL(submittedInvoice)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase tracking-widest py-4 px-6 rounded-full transition-all shadow-premium"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp Dispatch
            </a>

            <button
              type="button"
              onClick={() => downloadReceiptAsImage(submittedInvoice)}
              className="flex items-center justify-center gap-3 bg-brand-olive hover:bg-brand-olive/90 text-white font-black text-[10px] uppercase tracking-widest py-4 px-6 rounded-full transition-all shadow-premium"
            >
              <ImageIcon className="w-4 h-4" />
              Download Image (.png)
            </button>

            <button
              type="button"
              onClick={() => downloadReceiptAsPDF(submittedInvoice)}
              className="flex items-center justify-center gap-3 bg-brand-accent hover:bg-brand-accent/90 text-white font-black text-[10px] uppercase tracking-widest py-4 px-6 rounded-full transition-all shadow-premium"
            >
              <FileText className="w-4 h-4" />
              Download Receipt (PDF)
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-3 bg-brand-dark hover:bg-brand-muted text-white font-black text-[10px] uppercase tracking-widest py-4 px-6 rounded-full transition-all shadow-premium"
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </button>

            <button
              type="button"
              onClick={() => downloadReceipt(submittedInvoice)}
              className="flex items-center justify-center gap-3 bg-brand-bg hover:bg-white text-brand-dark border border-brand-border font-black text-[10px] uppercase tracking-widest py-4 px-6 rounded-full transition-all"
            >
              <Download className="w-4 h-4" />
              Raw Data (.txt)
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="flex items-center justify-center gap-3 bg-brand-bg hover:bg-white text-brand-dark border border-brand-border font-black text-[10px] uppercase tracking-widest py-4 px-6 rounded-full transition-all"
            >
              <Plus className="w-4 h-4" />
              New Intake
            </button>
          </div>

          <div className="mt-12 pt-12 border-t border-brand-border">
            <h4 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-6">Archive Document Preview</h4>
            <ReceiptDocument ticket={submittedInvoice} />
          </div>
        </div>
      )}

      {/* INTAKE FORM LAYOUT */}
      {activeTab === 'new-repair' && !submittedInvoice && (
        <div className="max-w-4xl mx-auto">
          
          {/* STEPPED FORMS */}
          <div className="bg-white border border-brand-border rounded-[40px] shadow-premium overflow-hidden animate-in fade-in duration-300 print:hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-accent via-brand-olive to-brand-accent opacity-20" />
            
            {/* Form Headers */}
            <div className="bg-brand-bg/30 border-b border-brand-border p-8 flex justify-between items-center">
              <div>
                <h2 className="font-display text-2xl font-black text-brand-dark uppercase tracking-tight">Care Intake Wizard</h2>
                <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.2em] mt-1">Step {currentStep + 1} of 5: {['Client & Expert', 'Footwear Details', 'Services & Add-ons', 'Allocation & Discounts', 'Final Review'][currentStep]}</p>
              </div>
              
              {/* Stepper Dots */}
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map(step => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => {
                      if (step > currentStep) {
                        if (currentStep === 0 && (!clientName || !clientPhone)) return;
                        if (currentStep === 1 && !shoeModel) return;
                      }
                      setCurrentStep(step);
                    }}
                    className={clsx(
                      "w-8 h-1.5 rounded-full transition-all duration-500",
                      step === currentStep ? "bg-brand-dark" : "bg-brand-border hover:bg-brand-muted"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Form Container */}
            <form onSubmit={handleFormSubmit} className="p-8 md:p-12 space-y-10">
              
              {/* STEP 1: CLIENT & SALESPERSON */}
              {currentStep === 0 && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                  
                  {/* Client Details */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 border-b border-brand-border pb-4">
                      <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                        <User className="w-4 h-4 text-brand-olive" />
                      </div>
                      <h3 className="text-[11px] font-black text-brand-dark uppercase tracking-[0.2em]">Client Identity Node</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="sm:col-span-2 relative">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-4">Mobile Hub *</label>
                        <div className="relative group">
                          <span className="absolute inset-y-0 left-0 pl-6 flex items-center text-brand-muted group-focus-within:text-brand-accent transition-colors"><Phone className="w-4 h-4" /></span>
                          <input
                            required
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={clientPhone}
                            onChange={e => {
                              const val = e.target.value;
                              let updatedVal = val;
                              if (val.startsWith('+91 ')) {
                                updatedVal = val;
                              } else if (val === '+91' || val === '+9' || val === '+') {
                                updatedVal = '+91 ';
                              } else if (!val.startsWith('+')) {
                                updatedVal = '+91 ' + val;
                              }
                              setClientPhone(updatedVal);
                              setShowDropdown(true);

                              // Search and auto-populate if there is an exact match (last 10 digits)
                              const cleanVal = updatedVal.replace(/\D/g, '');
                              const searchDigits = cleanVal.startsWith('91') && cleanVal.length > 2 ? cleanVal.slice(2) : cleanVal;
                              if (searchDigits.length >= 10) {
                                const exactMatch = customers.find(c => {
                                  const cleanC = c.phoneNumber.replace(/\D/g, '');
                                  const matchDigits = cleanC.startsWith('91') && cleanC.length > 2 ? cleanC.slice(2) : cleanC;
                                  return matchDigits.endsWith(searchDigits) || searchDigits.endsWith(matchDigits);
                                });
                                if (exactMatch) {
                                  setClientName(exactMatch.name);
                                  if (exactMatch.email) setClientEmail(exactMatch.email);
                                }
                              }
                            }}
                            className="w-full bg-brand-bg/30 border border-brand-border rounded-full pl-14 pr-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold text-brand-dark"
                          />
                        </div>
                        {/* Auto-suggest dropdown of matching customers from the directory */}
                        {(() => {
                          const cleanVal = clientPhone.replace(/\D/g, '');
                          const searchDigits = cleanVal.startsWith('91') && cleanVal.length > 2 ? cleanVal.slice(2) : cleanVal;
                          if (searchDigits.length >= 3) {
                            const matches = customers.filter(c => {
                              const cleanC = c.phoneNumber.replace(/\D/g, '');
                              const matchDigits = cleanC.startsWith('91') && cleanC.length > 2 ? cleanC.slice(2) : cleanC;
                              return matchDigits.includes(searchDigits);
                            });
                            if (showDropdown && matches.length > 0) {
                              return (
                                <div className="absolute z-50 left-0 right-0 mt-2 bg-[#F5F3EC] border border-brand-border rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-brand-border/40 p-1">
                                  <div className="px-4 py-1.5 text-[9px] font-black text-brand-muted uppercase tracking-widest bg-brand-bg/30 rounded-t-xl">
                                    Existing Customer Profiles Found
                                  </div>
                                  {matches.map(c => (
                                    <button
                                      key={c.phoneNumber}
                                      type="button"
                                      onClick={() => {
                                        setClientPhone(c.phoneNumber);
                                        setClientName(c.name);
                                        if (c.email) setClientEmail(c.email);
                                        setShowDropdown(false);
                                      }}
                                      className="w-full text-left px-4 py-2.5 hover:bg-brand-bg/60 transition-colors flex items-center justify-between group"
                                    >
                                      <div>
                                        <p className="text-xs font-black text-brand-dark group-hover:text-brand-accent transition-colors">{c.name}</p>
                                        <p className="text-[10px] text-brand-muted font-bold font-mono">{c.phoneNumber}</p>
                                      </div>
                                      <span className="text-[9px] font-black uppercase tracking-wider text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-full">
                                        Select
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              );
                            }
                          }
                          return null;
                        })()}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-4">Full Name (Handwritten Registry) *</label>
                        <div className="relative group">
                          <span className="absolute inset-y-0 left-0 pl-6 flex items-center text-brand-muted group-focus-within:text-brand-accent transition-colors"><User className="w-4 h-4" /></span>
                          <input
                            required
                            type="text"
                            placeholder="e.g. Arvind Kumar Shukla"
                            value={clientName}
                            onChange={e => setClientName(e.target.value)}
                            className="w-full bg-brand-bg/30 border border-brand-border rounded-full pl-14 pr-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-display font-bold text-brand-dark"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-4">Email Archive</label>
                        <div className="relative group">
                          <span className="absolute inset-y-0 left-0 pl-6 flex items-center text-brand-muted group-focus-within:text-brand-accent transition-colors"><Mail className="w-4 h-4" /></span>
                          <input
                            type="email"
                            placeholder="e.g. customer@luxury.com"
                            value={clientEmail}
                            onChange={e => setClientEmail(e.target.value)}
                            className="w-full bg-brand-bg/30 border border-brand-border rounded-full pl-14 pr-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-medium text-brand-dark"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Salesperson Identity Section */}
                  <div className="space-y-4 pt-4 border-t border-brand-border/60">
                    <h3 className="font-display text-lg font-bold text-brand-dark">
                      Store Representative (Salesperson)
                    </h3>
                    
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-6 flex items-center text-brand-muted group-focus-within:text-brand-accent transition-colors">
                        <User className="w-4 h-4" />
                      </span>
                      <select
                        value={customSalespersonName ? "CUSTOM" : salesperson.id}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "CUSTOM") {
                            setCustomSalespersonName("New Representative");
                          } else {
                            const selected = salespersons.find(sp => sp.id === val);
                            if (selected) {
                              setSalesperson(selected);
                              setCustomSalespersonName('');
                            }
                          }
                        }}
                        className="w-full bg-white border border-brand-border rounded-full pl-14 pr-10 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold text-brand-dark appearance-none"
                      >
                        {salespersons.map(sp => (
                          <option key={sp.id} value={sp.id}>
                            {sp.name} — {sp.role}
                          </option>
                        ))}
                        <option value="CUSTOM">Other Representative (Custom Name)...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-brand-muted">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>

                    {/* Custom Representative option */}
                    {customSalespersonName !== '' && (
                      <div className="bg-brand-bg/20 p-4 border border-brand-border rounded-xl space-y-3">
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Representative Name</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="text"
                            placeholder="Representative Name"
                            value={customSalespersonName === "New Representative" ? "" : customSalespersonName}
                            onChange={e => setCustomSalespersonName(e.target.value)}
                            className="flex-1 border border-brand-border rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-brand-dark focus:outline-none bg-white font-bold text-brand-dark"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* STEP 2: FOOTWEAR DETAILS */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                  <div className="space-y-4">
                    <h3 className="font-display text-lg font-bold text-brand-dark border-b border-brand-border pb-1.5">
                      Footwear Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-1.5">Primary Color</label>
                        <input
                          type="text"
                          placeholder="e.g. Oxblood"
                          value={shoeColor}
                          onChange={e => setShoeColor(e.target.value)}
                          className="w-full border border-brand-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-dark bg-brand-bg/10"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-3.5 bg-brand-bg/5 p-4 rounded-xl border border-brand-border/40">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/30 pb-3">
                          <div>
                            <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Footwear Size Category</label>
                            <span className="text-[9.5px] text-brand-muted">Select profile for precise size mapping</span>
                          </div>
                          
                          <div className="flex bg-brand-bg/25 p-1 rounded-lg border border-brand-border/60 w-fit">
                            <button
                              type="button"
                              onClick={() => {
                                setSizeCategory('mens');
                              }}
                              className={clsx(
                                "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all",
                                sizeCategory === 'mens'
                                  ? "bg-brand-dark text-white shadow-sm"
                                  : "text-brand-muted hover:text-brand-dark"
                              )}
                            >
                              Men's
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSizeCategory('ladies');
                              }}
                              className={clsx(
                                "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all",
                                sizeCategory === 'ladies'
                                  ? "bg-brand-dark text-white shadow-sm"
                                  : "text-brand-muted hover:text-brand-dark"
                              )}
                            >
                              Women's
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Specific Size (UK/India) *</label>
                          <div className="flex flex-wrap gap-1.5">
                            {(sizeCategory === 'mens' ? MENS_SIZES : LADIES_SIZES).map(size => {
                              const isSelected = shoeSize === size;
                              return (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => setShoeSize(size)}
                                  className={clsx(
                                    "px-3 py-2 text-[11px] font-black border rounded-lg transition-all min-w-[54px] text-center",
                                    isSelected
                                      ? "bg-brand-olive text-white border-brand-olive shadow-sm"
                                      : "bg-white text-brand-dark border-brand-border hover:bg-brand-bg/30"
                                  )}
                                >
                                  {size.replace('UK ', '')}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
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

                      {/* Photo Upload & Camera Container */}
                      <div className="space-y-6 pt-4 border-t border-brand-border/60">
                        <PhotoManager 
                          label="Intake Diagnostics (Before Photos)"
                          photos={beforePhotos}
                          onAdd={(p) => setBeforePhotos([...beforePhotos, p])}
                          onRemove={(id) => setBeforePhotos(beforePhotos.filter(p => p.id !== id))}
                          maxPhotos={5}
                        />
                        
                        <div className="space-y-3">
                          <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Primary Footwear Cover *</label>
                          
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

                      {/* Expected Delivery Date selection */}
                      <div className="pt-6 border-t border-brand-border/60 space-y-4">
                        <div>
                          <h4 className="font-display text-md font-bold text-brand-dark">
                            Expected Delivery Date
                          </h4>
                          <p className="text-[10px] text-brand-muted uppercase tracking-wider font-semibold">Define when the footwear is expected to be ready for collection</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Quick Presets */}
                          <div className="md:col-span-2 space-y-2">
                            <label className="block text-[9px] font-black text-brand-muted uppercase tracking-widest ml-1">Speed Presets</label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { label: 'Overnight (1d)', days: 1 },
                                { label: 'Express (3d)', days: 3 },
                                { label: 'Standard (10d)', days: 10 },
                              ].map((preset) => {
                                const calculatedDate = new Date(Date.now() + preset.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                const isPresetSelected = expectedDeliveryDate === calculatedDate;
                                return (
                                  <button
                                    key={preset.days}
                                    type="button"
                                    onClick={() => setExpectedDeliveryDate(calculatedDate)}
                                    className={clsx(
                                      "py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center",
                                      isPresetSelected
                                        ? "bg-brand-dark border-brand-dark text-white shadow-sm"
                                        : "bg-white border-brand-border hover:bg-brand-bg/30 text-brand-dark"
                                    )}
                                  >
                                    {preset.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Date Picker */}
                          <div className="space-y-2">
                            <label className="block text-[9px] font-black text-brand-muted uppercase tracking-widest ml-1">Custom Delivery Date</label>
                            <input
                              type="date"
                              value={expectedDeliveryDate}
                              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full border border-brand-border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-dark bg-white font-bold text-brand-dark"
                            />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              {/* STEP 3: SERVICES, ACCESSORIES & INSURANCE */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                  
                  {/* Package tier picker */}
                  <div className="space-y-4">
                    <h3 className="font-display text-lg font-bold text-brand-dark border-b border-brand-border pb-1.5">
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
                              <h4 className="font-display text-sm font-bold">{pkg.name}</h4>
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
                          <h4 className="font-display text-sm font-bold text-brand-dark">Bespoke Custom Restoration</h4>
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
                    <h3 className="font-display text-lg font-bold text-brand-dark">
                      Shoe Plus Accessories & Supplies
                    </h3>
                    
                    {/* Stock listing filtered */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto border border-brand-border rounded-xl p-3 bg-brand-bg/10">
                      {inventory.map(item => {
                        const existing = plusItems.find(p => p.id === item.id);
                        const addedQty = existing ? existing.quantity : 0;
                        const isMaxed = addedQty >= item.quantity;
                        return (
                          <div key={item.id} className="bg-white border border-brand-border/60 p-2.5 rounded-lg flex justify-between items-center text-xs">
                            <div>
                              <p className="font-semibold text-brand-dark">{item.name}</p>
                              <p className="text-[10px] text-brand-muted mt-0.5">₹{item.price || 350} • In Stock: {item.quantity}</p>
                            </div>
                            <button
                              type="button"
                              disabled={item.quantity <= 0 || isMaxed}
                              onClick={() => addPlusItem(item)}
                              className={clsx(
                                "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all",
                                (item.quantity <= 0 || isMaxed)
                                  ? "bg-brand-border text-brand-muted cursor-not-allowed"
                                  : "bg-brand-dark hover:bg-brand-muted text-white"
                              )}
                            >
                              <Plus className="w-3 h-3" /> {item.quantity <= 0 ? 'Out of Stock' : (isMaxed ? 'Max Limit' : 'Add')}
                            </button>
                          </div>
                        );
                      })}
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
                    <h3 className="font-display text-lg font-bold text-brand-dark">
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
                                <span className="font-display text-xs font-extrabold text-brand-dark">{plan.name}</span>
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
                    <h3 className="font-display text-lg font-bold text-brand-dark border-b border-brand-border pb-1.5">
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

                  {/* Pickup & Payment Details Section */}
                  <div className="space-y-4 pt-4 border-t border-brand-border/60">
                    <h3 className="font-display text-lg font-bold text-brand-dark">
                      Handling & Payment Allocation
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Pickup/Handling Charges */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Pickup / Handling Charges (₹)</label>
                          <span className="text-[10.5px] font-mono text-brand-olive font-black bg-brand-olive/10 px-2.5 py-0.5 rounded border border-brand-olive/20">₹{pickupCharge.toLocaleString()}</span>
                        </div>
                        <input
                          type="number"
                          placeholder="e.g. 250"
                          value={pickupCharge || ''}
                          onChange={e => setPickupCharge(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full border border-brand-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-dark bg-brand-bg/10 font-mono"
                        />
                      </div>

                      {/* Advance Paid */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Advance Deposit (₹)</label>
                          <span className="text-[10.5px] font-mono text-brand-olive font-black bg-brand-olive/10 px-2.5 py-0.5 rounded border border-brand-olive/20">₹{advanceAmount.toLocaleString()}</span>
                        </div>
                        <div className="space-y-3 bg-brand-bg/15 p-3 rounded-xl border border-brand-border/40">
                          <input
                            type="range"
                            min="0"
                            max={getGrandTotal() || 5000}
                            step="50"
                            value={advanceAmount}
                            onChange={e => setAdvanceAmount(Math.min(getGrandTotal(), parseInt(e.target.value) || 0))}
                            className="w-full accent-brand-olive h-1.5 bg-brand-border rounded-lg cursor-pointer transition-all"
                          />
                          <div className="flex justify-between text-[7.5px] text-brand-muted font-bold uppercase tracking-wider mb-2">
                            <span>0% (Pay Later)</span>
                            <span>Partial Deposit</span>
                            <span>100% Fully Paid</span>
                          </div>

                          {/* Exact Numeric Input for Advance Deposit */}
                          <div className="pt-2 border-t border-brand-border/30 flex gap-2 items-center">
                            <span className="text-[10px] font-bold text-brand-dark uppercase tracking-wider">Exact Amount:</span>
                            <div className="relative flex-1">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted text-xs">₹</span>
                              <input
                                type="number"
                                min="0"
                                max={getGrandTotal()}
                                placeholder="0"
                                value={advanceAmount || ''}
                                onChange={e => {
                                  const val = Math.min(getGrandTotal(), Math.max(0, parseInt(e.target.value) || 0));
                                  setAdvanceAmount(val);
                                }}
                                className="w-full border border-brand-border rounded-lg pl-7 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-brand-dark bg-white font-mono text-brand-dark"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setAdvanceAmount(getGrandTotal())}
                              className="bg-brand-dark hover:bg-brand-muted text-white px-2 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all"
                            >
                              100% Paid
                            </button>
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
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-bold text-brand-dark">
                        Studio Inspector Notes / Instructions
                      </h3>
                      <VoiceToText 
                        onTranscription={(text) => setNotes(prev => prev ? `${prev} ${text}` : text)}
                      />
                    </div>
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

              {/* STEP 5: FINAL REVIEW / ACTUAL CUSTOMER RECEIPT PREVIEW */}
              {currentStep === 4 && (
                <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 bg-brand-olive/10 text-brand-olive border border-brand-olive/20 px-4 py-1.5 rounded-full">
                      <Barcode className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Customer Receipt Preview</span>
                    </div>
                    <h3 className="font-display text-3xl font-black text-brand-dark tracking-tight uppercase">Verify Archival Receipt</h3>
                    <p className="text-xs text-brand-muted font-bold uppercase tracking-widest max-w-md mx-auto">Please review the actual customer receipt layout below. Once committed, this document will be generated for the client.</p>
                  </div>

                  <ReceiptDocument ticket={{
                    customerName: clientName,
                    phoneNumber: clientPhone,
                    receivedBy: customSalespersonName || salesperson.name,
                    shoeModel,
                    shoeColor,
                    shoeSize,
                    repairType: [getPackageName()],
                    basePrice,
                    packagePrice: getPackageCost(),
                    addons: plusItems,
                    hasInsurance: insurancePlan.id !== 'none',
                    insuranceType: insurancePlan.name,
                    insurancePrice: insurancePlan.price,
                    pickupCharge,
                    price: getGrandTotal(),
                    discountAmount: getDiscountAmount(),
                    advance: advanceAmount,
                    balance: getGrandTotal() - advanceAmount,
                    paymentMethod: advancePaymentMethod,
                    transactionId: transactionId
                  }} />

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="flex-1 flex items-center justify-center gap-2 bg-white border border-brand-border text-brand-dark px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-bg transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to Allocation
                    </button>
                    <button
                      type="submit"
                      className="flex-[2] flex items-center justify-center gap-3 bg-brand-olive text-white px-10 py-5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] hover:bg-brand-dark transition-all shadow-premium"
                    >
                      <FileCheck className="w-5 h-5" /> Commit Archival Entry
                    </button>
                  </div>
                </div>
              )}

              {/* NAVIGATION BUTTONS */}
              <div className={clsx(
                "flex flex-col sm:flex-row justify-between items-center gap-4 pt-10 border-t border-brand-border mt-10",
                currentStep === 4 && "hidden"
              )}>
                {currentStep > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-dark px-6 py-4 rounded-full border border-transparent hover:border-brand-border transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous Phase
                  </button>
                ) : <div className="hidden sm:block" />}

                {currentStep < 4 ? (
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
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-dark text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-olive transition-all shadow-premium"
                  >
                    {currentStep === 3 ? 'Review Draft' : 'Next Phase'} <ChevronRight className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

            </form>

          </div>

          <hr className="border-dashed border-gray-300 mt-12" />

          {/* Print Footer / Terms Clickable Link */}
          <div className="text-center pt-8 space-y-3">
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
      )}

      {/* MANAGE SERVICES TIER CATALOG */}
      {activeTab === 'manage-services' && (
        <div className="bg-white border border-brand-border rounded-2xl shadow-xl overflow-hidden p-6 md:p-8 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-brand-border pb-6">
            <div>
              <h3 className="font-display text-2xl font-bold text-brand-dark">CW Care Services</h3>
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
              <h4 className="font-display text-sm font-bold text-brand-dark uppercase tracking-wide">
                {editingPackage.id ? 'Edit Care Service' : 'Create Custom Care Service'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1">Care Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Exotic Polish & Conditioning"
                    value={editingPackage.name || ''}
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
                    value={editingPackage.price ?? 0}
                    onChange={e => setEditingPackage({ ...editingPackage, price: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full border border-brand-border rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1">Description / Services Included</label>
                  <input
                    type="text"
                    placeholder="e.g. Saphir cream finish, minor scuff removal..."
                    value={editingPackage.description || ''}
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
                      <h4 className="font-display text-sm font-bold text-brand-dark leading-tight">{pkg.name}</h4>
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
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRepairs.map((repair) => (
              <div 
                key={repair.id}
                className="bg-white p-8 rounded-[40px] border border-brand-border hover:shadow-premium transition-all group flex flex-col justify-between min-h-[280px] relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-accent to-brand-olive opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest">{repair.invoiceNumber}</p>
                      <h4 className="font-display text-xl font-bold text-brand-dark leading-tight group-hover:text-brand-accent transition-colors">{repair.shoeModel}</h4>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-display font-black text-brand-dark tracking-tighter">₹{repair.price.toLocaleString()}</p>
                        <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mt-1 opacity-60">Total Cost</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {repair.repairType.map((t, i) => (
                      <span key={i} className="px-3 py-1 bg-brand-bg rounded-full text-[9px] font-black text-brand-dark border border-brand-border uppercase tracking-tight">{t}</span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-brand-border mt-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center text-brand-olive font-display font-black text-xs border border-brand-border">
                        {repair.customerName.charAt(0)}
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-brand-dark uppercase tracking-widest leading-none">{repair.customerName}</p>
                        <p className="text-[9px] font-black text-brand-accent uppercase tracking-[0.2em]">{repair.status}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (window.confirm(`Delete record for ${repair.customerName}?`)) {
                        deleteRepair(repair.id);
                      }
                    }}
                    className="p-2 text-brand-muted hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredRepairs.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[32px] border border-brand-border border-dashed">
              <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">No matching records found</p>
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
              <h3 className="font-display text-xl font-bold text-brand-dark">CW Care Handcrafted Terms</h3>
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
