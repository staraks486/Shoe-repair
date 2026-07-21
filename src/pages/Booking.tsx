import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock3,
  CalendarCheck2,
  Loader2,
  MessageSquare,
  Receipt,
  Upload,
  Camera,
  Download,
  Printer,
  FileCheck,
  FileText,
  Barcode,
  Search,
  Check,
  CreditCard,
  Trash2,
  XCircle,
  X
} from 'lucide-react';
import clsx from 'clsx';
import { format, addDays, startOfToday, eachDayOfInterval } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const safeFormat = (dateStr: string, formatStr: string, fallback = 'N/A') => {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    return format(d, formatStr);
  } catch (err) {
    return fallback;
  }
};

const TIME_SLOTS = [
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', 
  '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', 
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', 
  '05:00 PM', '05:30 PM'
];

const SERVICE_TYPES = [
  { id: 'Drop-off', name: 'In-Studio Drop-off', desc: 'Visit our luxury workshop for a physical inspection and ticket creation.', icon: MapPin },
  { id: 'In-store Booking', name: 'In-store Shoe Booking', desc: 'Securely register a brand new pair of footwear directly into our studio database.', icon: CalendarCheck2 },
  { id: 'Consultation', name: 'Artisan Consultation', desc: 'A dedicated 15-minute diagnostic session with our chief cordwainer.', icon: User },
  { id: 'Home Pickup', name: 'Concierge Pickup', desc: 'Premium white-glove collection service from your doorstep.', icon: ShieldCheck }
] as const;

// Barcode Generator to match the intake wizard
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

export default function Booking() {
  const { addAppointment, addCustomer, updateCustomer, customers, appointments, settings, updateSettings } = useAppStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [showDropdown, setShowDropdown] = useState(true);
  const [isEditingTerms, setIsEditingTerms] = useState(false);
  const [termsText, setTermsText] = useState(settings?.termsAndConditions || 'Advance is non-refundable. Reserved pairs are held for up to 7 days from arrival notification.');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Auto-clear toast after 4 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Sync terms text if settings changes or loads later
  useEffect(() => {
    if (settings?.termsAndConditions) {
      setTermsText(settings.termsAndConditions);
    }
  }, [settings?.termsAndConditions]);

  // Form Data State matching current fields plus image options
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '+91 ',
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    time: '11:00 AM',
    serviceType: 'In-store Booking' as 'Drop-off' | 'Consultation' | 'Home Pickup' | 'In-store Booking',
    notes: '',
    paymentMode: 'Full' as 'Full' | 'Partial',
    partialAmount: '',
    pickupDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    termsAccepted: true,
    shoeModel: '',
    shoeColor: '',
    shoeSize: '',
    amount: '',
    paidAmount: '',
    shoeImage: '',
    representative: 'Arvind Shukla'
  });

  // Camera integration refs & states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [bookingRefId, setBookingRefId] = useState('');

  const salespersons = settings?.employees?.length > 0 ? settings.employees : [
    { id: 'SP-001', name: 'Arvind Shukla', role: 'Store Lead', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' },
    { id: 'SP-002', name: 'Pooja Sharma', role: 'Specialist', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop' },
    { id: 'SP-003', name: 'Rahul Deshmukh', role: 'Senior Artisan', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop' }
  ];

  // Camera cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [step]);

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
        setFormData(prev => ({ ...prev, shoeImage: dataUrl }));
        stopCamera();
      }
    }
  };

  // Image file handler
  const handleShoeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, shoeImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Step 1 Validation
    if (!formData.serviceType) {
      errors.serviceType = "Please select a service type.";
    }

    // Step 2 Validation
    if (!formData.date) {
      errors.date = "Target schedule date is required.";
    }

    // Step 3 Validation
    if (!formData.shoeModel || !formData.shoeModel.trim()) {
      errors.shoeModel = "Shoe model or style description is required.";
    }
    
    const amountVal = parseFloat(formData.amount || '0');
    if (formData.serviceType === 'In-store Booking') {
      if (!formData.amount || isNaN(amountVal) || amountVal <= 0) {
        errors.amount = "Please provide valid assessment charges (greater than 0).";
      }
      if (formData.paymentMode === 'Partial') {
        const partialVal = parseFloat(formData.partialAmount || '0');
        if (!formData.partialAmount || isNaN(partialVal) || partialVal <= 0) {
          errors.partialAmount = "Please provide a valid partial advance amount (greater than 0).";
        } else if (partialVal > amountVal) {
          errors.partialAmount = "Partial advance amount cannot exceed the total charges.";
        }
      }
    }

    // Step 4 Validation
    if (!formData.customerName || !formData.customerName.trim()) {
      errors.customerName = "Customer name is required.";
    } else if (formData.customerName.trim().length < 3) {
      errors.customerName = "Customer name must be at least 3 characters long.";
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    const digitsOnly = cleanPhone.startsWith('91') && cleanPhone.length > 2 ? cleanPhone.slice(2) : cleanPhone;
    if (!digitsOnly || digitsOnly.length < 10) {
      errors.phone = "Please enter a valid 10-digit mobile number.";
    }

    if (!formData.termsAccepted) {
      errors.termsAccepted = "You must accept the terms & conditions.";
    }

    setValidationErrors(errors);

    // If there are errors, automatically direct the user to the step of the first error
    if (Object.keys(errors).length > 0) {
      const errorKeys = Object.keys(errors);
      let targetStep = 5;
      if (errors.serviceType) {
        targetStep = 1;
      } else if (errors.date) {
        targetStep = 2;
      } else if (errors.shoeModel || errors.amount || errors.partialAmount) {
        targetStep = 3;
      } else if (errors.customerName || errors.phone) {
        targetStep = 4;
      }
      setStep(targetStep);
      setToastMessage({ type: 'error', message: errors[errorKeys[0]] });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Reset errors
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const generatedId = 'BKS-' + Math.floor(100000 + Math.random() * 900000);
      setBookingRefId(generatedId);

      // Save to store
      await addAppointment({
        id: generatedId,
        customerName: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        date: formData.date,
        time: formData.time,
        serviceType: formData.serviceType,
        notes: formData.notes,
        paymentMode: formData.paymentMode,
        partialAmount: formData.partialAmount,
        pickupDate: formData.pickupDate,
        shoeModel: formData.shoeModel,
        shoeColor: formData.shoeColor,
        shoeSize: formData.shoeSize,
        amount: formData.amount,
        paidAmount: formData.paymentMode === 'Full' ? formData.amount : (formData.partialAmount || '0'),
        shoeImage: formData.shoeImage
      });

      // Save or update customer record in the database
      const customerExists = customers.find(c => {
        const cleanC = c.phoneNumber.replace(/\D/g, '');
        const cleanF = formData.phone.replace(/\D/g, '');
        return cleanC.endsWith(cleanF) || cleanF.endsWith(cleanC);
      });

      if (!customerExists) {
        addCustomer({
          phoneNumber: formData.phone,
          name: formData.customerName,
          email: formData.email,
          totalOrders: 1,
          lastVisit: new Date().toISOString()
        });
      } else {
        updateCustomer(customerExists.phoneNumber, {
          name: formData.customerName,
          email: formData.email || customerExists.email,
          totalOrders: (customerExists.totalOrders || 0) + 1,
          lastVisit: new Date().toISOString()
        });
      }

      setToastMessage({ type: 'success', message: 'Booking entry successfully registered & synchronized!' });
      setSubmitted(true);
    } catch (err: any) {
      console.error("Booking submission failed:", err);
      setToastMessage({ type: 'error', message: `Booking failed: ${err?.message || String(err)}` });
      alert(`Booking submission failed: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Receipt Downloaders
  const downloadReceiptAsPDF = async () => {
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
      pdf.save(`Receipt-${bookingRefId}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF receipt:", err);
      alert("Failed to generate PDF receipt. Please use the Print option.");
    }
  };

  const downloadReceiptAsImage = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Booking-${bookingRefId || 'draft'}.png`;
      link.click();
    } catch (err) {
      console.error("Failed to generate Image receipt:", err);
      alert("Failed to generate Image receipt.");
    }
  };

  const handleSendWhatsApp = () => {
    const isFull = formData.paymentMode === 'Full';
    const totalAmount = parseInt(formData.amount || '0');
    const paidAmount = isFull ? totalAmount : parseInt(formData.partialAmount || '0');
    const balanceAmount = totalAmount - paidAmount;

    const message = `*CORDWAINERS CARE - IN-STUDIO BOOKING REGISTRY*\n\n` +
      `Hello *${formData.customerName}*,\n` +
      `We have registered your studio booking successfully at *${settings?.storeName || 'Cordwainers Studio'}*!\n\n` +
      `*Booking ID:* ${bookingRefId || 'Draft'}\n` +
      `*Service Type:* ${formData.serviceType}\n` +
      `*Schedule:* ${formData.date} at ${formData.time}\n\n` +
      `*FOOTWEAR DETAILS:*\n` +
      `*Model/Style:* ${formData.shoeModel || 'N/A'}\n` +
      `*Size:* ${formData.shoeSize || 'N/A'}\n` +
      `*Color:* ${formData.shoeColor || 'N/A'}\n` +
      `*Total Cost:* ₹${totalAmount.toLocaleString()}\n` +
      `*Amount Paid (${formData.paymentMode}):* ₹${paidAmount.toLocaleString()}\n` +
      `*Balance Due:* ₹${balanceAmount.toLocaleString()}\n` +
      `*Estimated Pickup Date:* ${formData.pickupDate}\n\n` +
      `*Terms & Conditions:*\n${termsText}\n\n` +
      `Thank you for choosing Cordwainers Studio!`;

    const url = `https://wa.me/${formData.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const downloadReceiptAsText = () => {
    const content = `========================================
CORDWAINERS STUDIO BOOKING RECEIPT
========================================
Booking ID: ${bookingRefId}
Date: ${format(new Date(), 'yyyy-MM-dd HH:mm')}
Client Name: ${formData.customerName}
Phone Number: ${formData.phone}
Email: ${formData.email || 'None'}

SERVICE DETAILS:
-----------------
Booking Type: ${formData.serviceType}
Scheduled Date: ${formData.date}
Scheduled Time: ${formData.time || 'N/A'}

FOOTWEAR DETAILS:
-----------------
Model/Style: ${formData.shoeModel || 'N/A'}
Size: ${formData.shoeSize || 'N/A'}
Color: ${formData.shoeColor || 'N/A'}
Total Amount: ₹${formData.amount || '0'}

PAYMENT SUMMARY:
------------------
Payment Mode: ${formData.paymentMode}
Amount Paid: ₹${formData.paymentMode === 'Full' ? (formData.amount || '0') : (formData.partialAmount || '0')}
Balance Due: ₹${formData.paymentMode === 'Full' ? '0' : (parseInt(formData.amount || '0') - parseInt(formData.partialAmount || '0')).toString()}
Pickup Target: ${formData.pickupDate || 'N/A'}

Staff Representative: ${formData.representative}
----------------------------------------
Thank you for booking with Cordwainers Studio!
========================================`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Booking-${bookingRefId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Step Nav validation
  const handleNextPhase = () => {
    if (step === 1 && !formData.serviceType) {
      alert("Please select a booking type.");
      return;
    }
    if (step === 2) {
      if (!formData.date) {
        alert("Please specify a valid date.");
        return;
      }
    }
    if (step === 3) {
      if (!formData.shoeModel) {
        alert("Please provide the Footwear model name.");
        return;
      }
    }
    if (step === 4) {
      if (!formData.customerName || formData.customerName.trim() === '') {
        alert("Please enter the customer name.");
        return;
      }
      if (!formData.phone || formData.phone.trim() === '+91') {
        alert("Please enter a valid mobile number.");
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  // Re-usable Receipt document
  const ReceiptDocument = () => {
    const isFull = formData.paymentMode === 'Full';
    const totalAmount = parseInt(formData.amount || '0');
    const paidAmount = isFull ? totalAmount : parseInt(formData.partialAmount || '0');
    const balanceAmount = totalAmount - paidAmount;

    return (
      <div ref={receiptRef} className="max-w-2xl mx-auto bg-white border border-brand-border p-0 relative" style={{ backgroundColor: '#FFFFFF', color: '#1A1A1A' }}>
        {/* Receipt Header */}
        <div className="p-8 text-center space-y-2" style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
          <h2 className="text-2xl font-black tracking-widest uppercase font-display">{settings?.storeName || 'Cordwainers Studio'}</h2>
          <p className="text-[9px] font-bold tracking-[0.3em]" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>In-Store Studio Booking • Archival Registry</p>
          <div className="text-[10px] space-y-0.5 opacity-80 font-medium pt-1">
            <p>{settings?.address || '123 Main St, Cityville'}</p>
            <p>Mobile: {(settings as any)?.phone || '+91 98765 43210'}</p>
          </div>
          {bookingRefId ? (
            <div className="pt-4 flex justify-center">
              <BarcodeSVG value={bookingRefId} />
            </div>
          ) : (
            <div className="pt-4 text-center">
              <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] border border-dashed border-white/20 px-3.5 py-1.5 rounded-xl text-white/40">
                Draft Booking • Barcode Hidden
              </span>
            </div>
          )}
        </div>

        <div className="p-8 space-y-8 text-left font-sans">
          {/* Metadata */}
          <div className="flex justify-between items-start border-b pb-6 border-brand-border/40">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Customer Profile</p>
              <p className="text-sm font-black uppercase tracking-tight text-brand-dark">{formData.customerName}</p>
              <p className="text-[10px] font-medium text-gray-500 font-mono">{formData.phone}</p>
              {formData.email && <p className="text-[10px] font-medium text-gray-400">{formData.email}</p>}
            </div>
            <div className="text-right space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Date & Time</p>
              <p className="text-[10px] font-bold uppercase text-brand-dark">{format(new Date(), 'dd MMM yyyy • HH:mm')}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-brand-accent">Representative: {formData.representative}</p>
            </div>
          </div>

          {/* Service Details Table */}
          <div className="space-y-4">
            <div className="grid grid-cols-4 text-[9px] font-black uppercase tracking-widest border-b pb-2 border-brand-border/40 text-gray-400">
              <div className="col-span-2">Description / Details</div>
              <div className="text-center">Schedule</div>
              <div className="text-right">Charges</div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-4 text-[11px] items-center text-brand-dark">
                <div className="col-span-2">
                  <p className="font-black uppercase tracking-tight">{formData.serviceType}</p>
                  {formData.shoeModel && (
                    <p className="text-[9px] font-medium mt-0.5 text-gray-500">
                      Footwear: {formData.shoeModel} {formData.shoeColor ? `| Color: ${formData.shoeColor}` : ''} {formData.shoeSize ? `| Size: ${formData.shoeSize}` : ''}
                    </p>
                  )}
                </div>
                <div className="text-center text-[10px] font-mono font-semibold text-brand-olive">
                  {safeFormat(formData.date, 'dd MMM')} {formData.serviceType !== 'In-store Booking' && `@ ${formData.time}`}
                </div>
                <div className="text-right font-mono font-bold">
                  ₹{totalAmount.toLocaleString()}
                </div>
              </div>

              {formData.serviceType === 'In-store Booking' && (
                <div className="grid grid-cols-4 text-[10px] items-center text-gray-500">
                  <div className="col-span-2 italic">
                    Estimated Pickup Protection Date
                  </div>
                  <div className="text-center font-mono font-semibold">
                    {safeFormat(formData.pickupDate, 'dd MMM yyyy')}
                  </div>
                  <div className="text-right font-mono">
                    Included
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Totals Section */}
          <div className="border-t-2 pt-4 space-y-2 border-brand-dark">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
              <span>Assessment Cost</span>
              <span className="font-mono text-brand-dark">₹{totalAmount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-base font-black uppercase tracking-tight pt-2 border-t border-brand-border/40 text-brand-dark">
              <span>Grand Total</span>
              <span className="font-display">₹{totalAmount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest pt-2 text-gray-600">
              <span>Amount Paid ({formData.paymentMode})</span>
              <span className="font-mono">₹{paidAmount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-sm font-black uppercase tracking-tight pt-1 text-red-600">
              <span>Balance Due</span>
              <span className="font-display">₹{balanceAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Shoe Care tip recommendation */}
          <div className="p-4 rounded-xl border border-dashed text-left space-y-1 border-gray-300 bg-brand-bg/10">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-amber-800">✦ Meticulous Care Recommendation</p>
            <p className="text-[10px] font-medium leading-relaxed text-gray-600">
              Keep your handcrafted footwear in soft cotton shoe bags to protect them from dust and ambient humidity. Allow the leather to rest for at least 24 hours between wears.
            </p>
          </div>

          {/* Terms & Conditions Display */}
          <div className="p-4 rounded-xl border text-left space-y-1 border-brand-border/40 bg-brand-bg/5">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-brand-dark">✦ Booking Terms & Conditions</p>
            <p className="text-[10px] font-semibold leading-relaxed text-brand-muted italic whitespace-pre-line">
              {termsText}
            </p>
          </div>

          {/* Footer T&C */}
          <div className="pt-8 border-t text-center space-y-4 border-brand-border/40">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark">Thank you for choosing Cordwainers Studio</p>
              <p className="text-[8px] font-medium text-gray-500">We look forward to rendering high artisan diagnostics for your luxury pairs.</p>
            </div>
            <p className="text-[8px] uppercase tracking-[0.2em] font-bold leading-relaxed text-gray-400">
              Digital archival document. Handcrafted restoration & booking processes entail minor variations. Terms apply under standard CW policy.
            </p>
          </div>
        </div>

        {/* Decorative Jagged Edge */}
        <div className="h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSI0IiB2aWV3Qm94PSIwIDAgMTYgNCI+PHBhdGggZD0iTTAgNEw0IDBMODQgTDEyIDBMMTYgNFoiIGZpbGw9IiNmOWY5ZjkiLz48L3N2Zz4=')] bg-repeat-x opacity-10" />
      </div>
    );
  };

  const BookingHistory = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {appointments.length === 0 ? (
        <div className="text-center py-12 text-brand-muted col-span-full font-bold uppercase tracking-widest text-xs">No appointments or store bookings found.</div>
      ) : (
        appointments.map((app) => (
          <div key={app.id} className="bg-white rounded-[2rem] border border-brand-border p-6 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-olive" />
            <div className="flex justify-between items-start pl-2">
              <div>
                <h4 className="font-display text-base font-black text-brand-dark uppercase tracking-tight group-hover:text-brand-accent transition-colors">{app.customerName}</h4>
                <p className="text-[10px] text-brand-muted uppercase tracking-widest font-black mt-1">{app.serviceType}</p>
              </div>
              <span className={clsx(
                "text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full",
                app.status === 'Pending' ? "bg-amber-100 text-amber-800 border border-amber-200" :
                app.status === 'Confirmed' ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                "bg-brand-bg text-brand-muted border border-brand-border"
              )}>
                {app.status || 'Pending'}
              </span>
            </div>

            <div className="border-t border-brand-border/40 pt-4 pl-2 grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-brand-muted uppercase tracking-widest">Schedule</p>
                <p className="font-mono font-bold text-brand-dark flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-olive" />
                  {format(new Date(app.date), 'MMM dd, yyyy')}
                </p>
                {app.time && (
                  <p className="font-mono font-bold text-brand-muted flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-olive" />
                    {app.time}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-brand-muted uppercase tracking-widest">Contact Profile</p>
                <p className="font-semibold text-brand-dark truncate">{app.phone || 'No Phone'}</p>
                {app.email && <p className="font-semibold text-brand-muted truncate text-[11px]">{app.email}</p>}
              </div>
            </div>

            {app.shoeModel && (
              <div className="bg-brand-bg/25 rounded-2xl p-4 pl-5 border border-brand-border/30 text-xs text-brand-dark flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {app.shoeImage ? (
                    <img src={app.shoeImage} alt={app.shoeModel} className="w-10 h-10 rounded-lg object-cover border border-brand-border shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 bg-brand-bg rounded-lg border border-brand-border flex items-center justify-center shrink-0">
                      <Barcode className="w-5 h-5 text-brand-muted" />
                    </div>
                  )}
                  <div>
                    <span className="font-bold block uppercase tracking-tight">{app.shoeModel}</span>
                    {app.shoeColor && <span className="text-[10px] text-brand-muted font-semibold block">{app.shoeColor} | Size: {app.shoeSize}</span>}
                  </div>
                </div>
                {app.amount && <span className="font-mono font-bold text-brand-olive text-sm">₹{parseInt(app.amount).toLocaleString()}</span>}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-500">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h1 className="font-display text-4xl font-black text-brand-dark uppercase tracking-tight">Booking Committed</h1>
            <p className="text-brand-muted font-black uppercase tracking-[0.2em] text-[10px]">Studio slot reservation registry completed</p>
          </div>
        </div>

        {/* Archival printable document container */}
        <div className="bg-white border border-brand-border rounded-[40px] p-6 md:p-10 shadow-premium">
          <ReceiptDocument />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-brand-border print:hidden">
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest py-4 px-4 rounded-full transition-all shadow-md"
            >
              <MessageSquare className="w-4 h-4" /> Send WhatsApp
            </button>
            <button
              onClick={downloadReceiptAsPDF}
              className="flex items-center justify-center gap-2.5 bg-brand-accent hover:bg-brand-accent/90 text-white font-black text-[10px] uppercase tracking-widest py-4 px-4 rounded-full transition-all shadow-premium"
            >
              <FileText className="w-4 h-4" /> Download PDF
            </button>
            <button
              onClick={downloadReceiptAsImage}
              className="flex items-center justify-center gap-2.5 bg-brand-olive hover:bg-brand-dark text-white font-black text-[10px] uppercase tracking-widest py-4 px-4 rounded-full transition-all shadow-sm"
            >
              <Download className="w-4 h-4" /> Download Image
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2.5 bg-brand-dark hover:bg-brand-muted text-white font-black text-[10px] uppercase tracking-widest py-4 px-4 rounded-full transition-all"
            >
              <Printer className="w-4 h-4" /> Print Document
            </button>
          </div>

          <div className="flex justify-center mt-4 print:hidden">
            <button
              onClick={downloadReceiptAsText}
              className="flex items-center justify-center gap-2 bg-brand-bg hover:bg-white text-brand-dark border border-brand-border font-black text-[9px] uppercase tracking-widest py-2.5 px-6 rounded-full transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Download Raw Text Data
            </button>
          </div>

          <button 
            onClick={() => { 
              setSubmitted(false); 
              setActiveTab('new'); 
              setStep(1); 
              setFormData({
                customerName: '',
                email: '',
                phone: '+91 ',
                date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
                time: '11:00 AM',
                serviceType: 'In-store Booking',
                notes: '',
                paymentMode: 'Full',
                partialAmount: '',
                pickupDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
                termsAccepted: true,
                shoeModel: '',
                shoeColor: '',
                shoeSize: '',
                amount: '',
                paidAmount: '',
                shoeImage: '',
                representative: 'Arvind Shukla'
              });
            }}
            className="w-full mt-6 bg-brand-olive text-white py-5 rounded-full font-black uppercase tracking-[0.2em] text-xs hover:bg-brand-dark transition-all shadow-xl active:scale-95 text-center block print:hidden"
          >
            Create New Booking Entry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[250] flex items-center gap-3 bg-brand-dark border border-brand-border/40 text-white rounded-2xl px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] min-w-[320px] max-w-sm pointer-events-auto"
          >
            <div className={clsx(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              toastMessage.type === 'success' ? "bg-emerald-500/10 text-emerald-400" :
              toastMessage.type === 'error' ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
            )}>
              {toastMessage.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : toastMessage.type === 'error' ? (
                <XCircle className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-brand-muted">
                System Notification
              </p>
              <p className="text-xs font-bold leading-relaxed mt-0.5">
                {toastMessage.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-white/40 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TABS HEADER */}
      <div className="flex border-b border-brand-border print:hidden">
        <button
          onClick={() => setActiveTab('new')}
          className={clsx(
            "px-6 py-3 text-xs font-black uppercase tracking-widest transition-colors relative", 
            activeTab === 'new' ? "text-brand-dark border-b-2 border-brand-dark" : "text-brand-muted hover:text-brand-dark"
          )}
        >
          New Booking Entry
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={clsx(
            "px-6 py-3 text-xs font-black uppercase tracking-widest transition-colors relative", 
            activeTab === 'history' ? "text-brand-dark border-b-2 border-brand-dark" : "text-brand-muted hover:text-brand-dark"
          )}
        >
          Bookings History ({appointments.length})
        </button>
      </div>

      {activeTab === 'new' ? (
        <div className="max-w-4xl mx-auto space-y-12 print:hidden">
          {/* Header Description */}
          <header className="text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-accent/10 rounded-full border border-brand-accent/20"
            >
              <Sparkles className="w-3 h-3 text-brand-accent" />
              <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em]">Artisan In-Store Booking</span>
            </motion.div>
            <h1 className="font-display text-4xl md:text-5xl font-black text-brand-dark tracking-tighter uppercase leading-none">CW Booking Registry</h1>
          </header>

          {/* COMPACT MULTI-STEP WIZARD CONTAINER */}
          <div className="bg-white border border-brand-border rounded-[40px] shadow-premium overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-accent via-brand-olive to-brand-accent opacity-20" />
            
            {/* Stepper progress dots & headers */}
            <div className="bg-brand-bg/30 border-b border-brand-border p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-display text-2xl font-black text-brand-dark uppercase tracking-tight">Studio Booking Wizard</h2>
                <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.2em] mt-1">
                  Step {step} of 5: {['Service Type', 'Schedule & Payment', 'Footwear Details', 'Customer Profile', 'Booking Review'][step - 1]}
                </p>
              </div>

              {/* Stepper Dots */}
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      if (s > step) {
                        if (step === 1 && !formData.serviceType) return;
                        if (step === 2 && !formData.date) return;
                        if (step === 3 && !formData.shoeModel) return;
                        if (step === 4 && (!formData.customerName || !formData.phone)) return;
                      }
                      setStep(s);
                    }}
                    className={clsx(
                      "w-8 h-1.5 rounded-full transition-all duration-500",
                      s === step ? "bg-brand-dark" : "bg-brand-border hover:bg-brand-muted"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* FORM CONTAINER */}
            <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
              
              <AnimatePresence mode="wait">
                {/* STEP 1: SERVICE CATEGORY SELECTION */}
                {step === 1 && (
                  <motion.div 
                    key="step1" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }} 
                    className="space-y-8 animate-in slide-in-from-right-4 duration-300"
                  >
                    <div className="flex items-center gap-3 border-b border-brand-border pb-4">
                      <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-brand-olive" />
                      </div>
                      <h3 className="text-[11px] font-black text-brand-dark uppercase tracking-[0.2em]">Select Studio Service Type</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {SERVICE_TYPES.map((service) => {
                        const isSelected = formData.serviceType === service.id;
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, serviceType: service.id as any }));
                              setStep(2);
                            }}
                            className={clsx(
                              "flex items-start gap-5 p-6 rounded-3xl border transition-all text-left group relative overflow-hidden",
                              isSelected
                                ? "bg-brand-dark border-transparent shadow-xl scale-[1.01]"
                                : "bg-brand-bg/10 border-brand-border hover:border-brand-accent/40 hover:bg-white"
                            )}
                          >
                            <div className={clsx(
                              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all",
                              isSelected ? "bg-white/10 text-white" : "bg-white border border-brand-border text-brand-olive"
                            )}>
                              <service.icon className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                              <p className={clsx(
                                "font-display text-base font-black uppercase tracking-tight",
                                isSelected ? "text-white" : "text-brand-dark"
                              )}>
                                {service.name}
                              </p>
                              <p className={clsx(
                                "text-[11px] leading-relaxed",
                                isSelected ? "text-white/70 font-semibold" : "text-brand-muted font-medium"
                              )}>
                                {service.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: SCHEDULE & METHOD */}
                {step === 2 && (
                  <motion.div 
                    key="step2" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }} 
                    className="space-y-8 animate-in slide-in-from-right-4 duration-300"
                  >
                    <div className="flex items-center gap-3 border-b border-brand-border pb-4">
                      <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                        <Clock3 className="w-4 h-4 text-brand-olive" />
                      </div>
                      <h3 className="text-[11px] font-black text-brand-dark uppercase tracking-[0.2em]">Schedule & Payment Node</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="relative group">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-4">Target Schedule Date *</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-6 flex items-center text-brand-muted group-focus-within:text-brand-accent transition-colors">
                            <Calendar className="w-4 h-4" />
                          </span>
                          <input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            className="w-full bg-brand-bg/30 border border-brand-border rounded-full pl-14 pr-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold text-brand-dark"
                          />
                          {validationErrors.date && (
                            <p className="text-red-500 text-[10px] font-black uppercase tracking-wider mt-1.5 ml-4">{validationErrors.date}</p>
                          )}
                        </div>
                      </div>

                      {formData.serviceType !== 'In-store Booking' ? (
                        <div className="relative group">
                          <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-4">Select Slot Time *</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-6 flex items-center text-brand-muted group-focus-within:text-brand-accent transition-colors">
                              <Clock className="w-4 h-4" />
                            </span>
                            <select
                              value={formData.time}
                              onChange={e => setFormData({ ...formData, time: e.target.value })}
                              className="w-full bg-brand-bg/30 border border-brand-border rounded-full pl-14 pr-10 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold text-brand-dark appearance-none"
                            >
                              {TIME_SLOTS.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-brand-muted">
                              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="relative group">
                            <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-4">Payment Method Option *</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-6 flex items-center text-brand-muted group-focus-within:text-brand-accent transition-colors">
                                <CreditCard className="w-4 h-4" />
                              </span>
                              <select
                                value={formData.paymentMode}
                                onChange={e => setFormData({ ...formData, paymentMode: e.target.value as any })}
                                className="w-full bg-brand-bg/30 border border-brand-border rounded-full pl-14 pr-10 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold text-brand-dark appearance-none"
                              >
                                <option value="Full">Full Payment</option>
                                <option value="Partial">Partial Payment / Advance Deposit</option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-brand-muted">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                </svg>
                              </div>
                            </div>
                          </div>

                          {formData.paymentMode === 'Partial' && (
                            <div className="relative group sm:col-span-2">
                              <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-4">Partial Advance Amount (₹) *</label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-6 flex items-center text-brand-muted group-focus-within:text-brand-accent transition-colors">
                                  <span className="font-bold text-xs">₹</span>
                                </span>
                                <input
                                  type="number"
                                  placeholder="e.g. 1000"
                                  value={formData.partialAmount}
                                  onChange={e => setFormData({ ...formData, partialAmount: e.target.value })}
                                  className="w-full bg-brand-bg/30 border border-brand-border rounded-full pl-14 pr-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold text-brand-dark"
                                />
                                {validationErrors.partialAmount && (
                                  <p className="text-red-500 text-[10px] font-black uppercase tracking-wider mt-1.5 ml-4">{validationErrors.partialAmount}</p>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="relative group sm:col-span-2">
                            <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-4">Estimated Target Pickup Date *</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-6 flex items-center text-brand-muted group-focus-within:text-brand-accent transition-colors">
                                <Calendar className="w-4 h-4" />
                              </span>
                              <input
                                type="date"
                                value={formData.pickupDate}
                                onChange={e => setFormData({ ...formData, pickupDate: e.target.value })}
                                className="w-full bg-brand-bg/30 border border-brand-border rounded-full pl-14 pr-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold text-brand-dark"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: FOOTWEAR DETAILS */}
                {step === 3 && (
                  <motion.div 
                    key="step3" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }} 
                    className="space-y-8 animate-in slide-in-from-right-4 duration-300"
                  >
                    <div className="flex items-center gap-3 border-b border-brand-border pb-4">
                      <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                        <Barcode className="w-4 h-4 text-brand-olive" />
                      </div>
                      <h3 className="text-[11px] font-black text-brand-dark uppercase tracking-[0.2em]">Footwear Diagnostics Information</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="sm:col-span-2 relative group">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-4">Shoe Model / Style *</label>
                        <input
                          type="text"
                          placeholder="e.g. Allen Edmonds Oxford Black"
                          value={formData.shoeModel}
                          onChange={e => setFormData({ ...formData, shoeModel: e.target.value })}
                          className="w-full bg-brand-bg/30 border border-brand-border rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold text-brand-dark"
                        />
                        {validationErrors.shoeModel && (
                          <p className="text-red-500 text-[10px] font-black uppercase tracking-wider mt-1.5 ml-4">{validationErrors.shoeModel}</p>
                        )}
                      </div>

                      <div className="relative group">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-4">Primary Color</label>
                        <input
                          type="text"
                          placeholder="e.g. Walnut"
                          value={formData.shoeColor}
                          onChange={e => setFormData({ ...formData, shoeColor: e.target.value })}
                          className="w-full bg-brand-bg/30 border border-brand-border rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold text-brand-dark"
                        />
                      </div>

                      <div className="relative group">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-4">Specific Footwear Size (UK/India)</label>
                        <input
                          type="text"
                          placeholder="e.g. UK 9.5"
                          value={formData.shoeSize}
                          onChange={e => setFormData({ ...formData, shoeSize: e.target.value })}
                          className="w-full bg-brand-bg/30 border border-brand-border rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold text-brand-dark"
                        />
                      </div>

                      <div className="relative group sm:col-span-2">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-4">Assessment Charges Amount (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g. 2499"
                          value={formData.amount}
                          onChange={e => setFormData({ ...formData, amount: e.target.value })}
                          className="w-full bg-brand-bg/30 border border-brand-border rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold text-brand-dark"
                        />
                        {validationErrors.amount && (
                          <p className="text-red-500 text-[10px] font-black uppercase tracking-wider mt-1.5 ml-4">{validationErrors.amount}</p>
                        )}
                      </div>

                      {/* Photo Upload / Device Camera */}
                      <div className="sm:col-span-2 pt-4 border-t border-brand-border/40 space-y-3">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest ml-4">Footwear Cover Image</label>
                        
                        {isCameraActive ? (
                          <div className="border border-brand-border rounded-3xl p-4 bg-black text-center space-y-4">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              className="w-full max-h-60 rounded-2xl object-cover bg-black mx-auto"
                            />
                            <div className="flex gap-3 justify-center">
                              <button
                                type="button"
                                onClick={capturePhoto}
                                className="bg-brand-olive text-white font-bold text-xs uppercase tracking-widest py-2.5 px-5 rounded-full hover:bg-brand-olive/90 transition-all flex items-center gap-1.5"
                              >
                                <Camera className="w-4 h-4" />
                                Capture Photo
                              </button>
                              <button
                                type="button"
                                onClick={stopCamera}
                                className="bg-brand-bg text-brand-dark font-bold text-xs uppercase tracking-widest py-2.5 px-5 rounded-full border border-brand-border hover:bg-white transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="border-2 border-dashed border-brand-border hover:border-brand-dark rounded-[2rem] p-6 text-center cursor-pointer transition-all bg-brand-bg/10 relative overflow-hidden group">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleShoeImageChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                              {formData.shoeImage ? (
                                <div className="space-y-2">
                                  <img src={formData.shoeImage} alt="Uploaded Shoe" className="mx-auto max-h-40 rounded-xl object-cover shadow-md" referrerPolicy="no-referrer" />
                                  <p className="text-[10px] text-red-500 font-semibold group-hover:underline">Click or drag to replace image</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="w-10 h-10 bg-white border border-brand-border rounded-full flex items-center justify-center mx-auto shadow-sm">
                                    <Upload className="w-4 h-4 text-brand-muted" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-brand-dark">Upload High-Res Footwear Photo</p>
                                    <p className="text-[9px] text-brand-muted mt-1">Accepts PNG, JPG (Max 10MB)</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {!formData.shoeImage && (
                              <button
                                type="button"
                                onClick={startCamera}
                                className="w-full flex items-center justify-center gap-2 bg-brand-bg hover:bg-white text-brand-dark border border-brand-border font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-full transition-all shadow-sm"
                              >
                                <Camera className="w-4 h-4" />
                                Use Device Camera
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: CUSTOMER PROFILE & REPRESENTATIVE */}
                {step === 4 && (
                  <motion.div 
                    key="step4" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }} 
                    className="space-y-8 animate-in slide-in-from-right-4 duration-300"
                  >
                    <div className="flex items-center gap-3 border-b border-brand-border pb-4">
                      <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                        <User className="w-4 h-4 text-brand-olive" />
                      </div>
                      <h3 className="text-[11px] font-black text-brand-dark uppercase tracking-[0.2em]">Customer Profile & representative</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Phone Look-up */}
                      <div className="sm:col-span-2 relative">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-4">Mobile Number Look-up *</label>
                        <div className="relative group">
                          <span className="absolute inset-y-0 left-0 pl-6 flex items-center text-brand-muted group-focus-within:text-brand-accent transition-colors">
                            <Phone className="w-4 h-4" />
                          </span>
                          <input
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={formData.phone}
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
                              setFormData(prev => ({ ...prev, phone: updatedVal }));
                              setShowDropdown(true);

                              // Auto populate if matched exactly
                              const cleanVal = updatedVal.replace(/\D/g, '');
                              const searchDigits = cleanVal.startsWith('91') && cleanVal.length > 2 ? cleanVal.slice(2) : cleanVal;
                              if (searchDigits.length >= 10) {
                                const exactMatch = customers.find(c => {
                                  const cleanC = c.phoneNumber.replace(/\D/g, '');
                                  const matchDigits = cleanC.startsWith('91') && cleanC.length > 2 ? cleanC.slice(2) : cleanC;
                                  return matchDigits.endsWith(searchDigits) || searchDigits.endsWith(matchDigits);
                                });
                                if (exactMatch) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    customerName: exactMatch.name, 
                                    email: exactMatch.email || prev.email 
                                  }));
                                }
                              }
                            }}
                            className="w-full bg-brand-bg/30 border border-brand-border rounded-full pl-14 pr-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold text-brand-dark"
                          />
                          {validationErrors.phone && (
                            <p className="text-red-500 text-[10px] font-black uppercase tracking-wider mt-1.5 ml-4">{validationErrors.phone}</p>
                          )}
                        </div>

                        {/* Customer auto suggest matches */}
                        {(() => {
                          const cleanVal = formData.phone.replace(/\D/g, '');
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
                                        setFormData(prev => ({
                                          ...prev,
                                          phone: c.phoneNumber,
                                          customerName: c.name,
                                          email: c.email || prev.email
                                        }));
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

                      <div className="sm:col-span-2 relative group">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-4">Full Customer Name *</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-6 flex items-center text-brand-muted group-focus-within:text-brand-accent transition-colors">
                            <User className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. Preeti Roy"
                            value={formData.customerName}
                            onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                            className="w-full bg-brand-bg/30 border border-brand-border rounded-full pl-14 pr-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold text-brand-dark font-display"
                          />
                          {validationErrors.customerName && (
                            <p className="text-red-500 text-[10px] font-black uppercase tracking-wider mt-1.5 ml-4">{validationErrors.customerName}</p>
                          )}
                        </div>
                      </div>

                      <div className="sm:col-span-2 relative group">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-4">Email Address</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-6 flex items-center text-brand-muted group-focus-within:text-brand-accent transition-colors">
                            <Mail className="w-4 h-4" />
                          </span>
                          <input
                            type="email"
                            placeholder="e.g. preeti@luxury.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-brand-bg/30 border border-brand-border rounded-full pl-14 pr-6 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold text-brand-dark"
                          />
                        </div>
                      </div>

                      {/* Notes / Special Instructions */}
                      <div className="sm:col-span-2 relative group">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-4">Diagnostic Notes / Special Instructions</label>
                        <textarea
                          placeholder="Note any specific creasing, sole separation, color scuffs, or dynamic instructions here..."
                          value={formData.notes}
                          onChange={e => setFormData({ ...formData, notes: e.target.value })}
                          rows={3}
                          className="w-full bg-brand-bg/30 border border-brand-border rounded-3xl p-5 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-semibold text-brand-dark"
                        />
                      </div>

                      {/* Store Representative Selection */}
                      <div className="sm:col-span-2 pt-4 border-t border-brand-border/40 relative group">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-4">Store Representative *</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-6 flex items-center text-brand-muted group-focus-within:text-brand-accent transition-colors">
                            <User className="w-4 h-4" />
                          </span>
                          <select
                            value={formData.representative}
                            onChange={e => setFormData({ ...formData, representative: e.target.value })}
                            className="w-full bg-brand-bg/30 border border-brand-border rounded-full pl-14 pr-10 py-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all font-bold text-brand-dark appearance-none"
                          >
                            {salespersons.map(sp => (
                              <option key={sp.id} value={sp.name}>{sp.name} — {sp.role}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-brand-muted">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                            </svg>
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* STEP 5: REVIEW REGISTRY & PDF RECEIPT PREVIEW */}
                {step === 5 && (
                  <motion.div 
                    key="step5" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }} 
                    className="space-y-10 animate-in fade-in zoom-in-95 duration-500"
                  >
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center gap-2 bg-brand-olive/10 text-brand-olive border border-brand-olive/20 px-4 py-1.5 rounded-full">
                        <Barcode className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Digital Registry Preview</span>
                      </div>
                      <h3 className="font-display text-3xl font-black text-brand-dark tracking-tight uppercase">Verify Booking Entry</h3>
                      <p className="text-xs text-brand-muted font-bold uppercase tracking-widest max-w-md mx-auto">Please review the actual booking receipt format below. Once verified, finalize the registry entry.</p>
                    </div>

                    <ReceiptDocument />

                    <div className="pt-6 border-t border-brand-border space-y-4 text-left bg-brand-bg/20 p-5 rounded-2xl border border-dashed relative">
                      <div className="flex justify-between items-center border-b border-brand-border/40 pb-1.5">
                        <h4 className="text-[10px] font-black text-brand-dark uppercase tracking-widest">
                          Shoe Booking Terms & Conditions
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsEditingTerms(!isEditingTerms)}
                          className="text-[9px] font-black text-brand-olive uppercase tracking-wider hover:underline"
                        >
                          {isEditingTerms ? 'Cancel' : 'Edit Terms ✎'}
                        </button>
                      </div>

                      {isEditingTerms ? (
                        <div className="space-y-3 pt-1">
                          <textarea
                            value={termsText}
                            onChange={(e) => setTermsText(e.target.value)}
                            rows={3}
                            className="w-full bg-white border border-brand-border rounded-xl p-3 text-xs font-semibold text-brand-dark outline-none focus:ring-1 focus:ring-brand-olive"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingTerms(false);
                              try {
                                if (updateSettings) {
                                  updateSettings({ termsAndConditions: termsText });
                                }
                              } catch (e) {
                                console.warn("Failed to update global settings (non-admin):", e);
                              }
                            }}
                            className="bg-brand-olive text-white px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-brand-dark"
                          >
                            Apply Terms
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-brand-muted leading-relaxed font-semibold whitespace-pre-line italic">
                          {termsText}
                        </p>
                      )}

                      <div className="pt-1">
                        <a 
                          href="https://cordwainers.com/care-terms" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] font-black text-brand-olive uppercase tracking-widest hover:underline border-b border-brand-olive/40 pb-0.5 inline-flex items-center gap-1"
                        >
                          View Detailed Terms & Conditions →
                        </a>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer select-none pt-2 border-t border-brand-border/30">
                        <input
                          type="checkbox"
                          checked={formData.termsAccepted}
                          onChange={e => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                          className="w-4.5 h-4.5 border-brand-border rounded focus:ring-0 text-brand-dark"
                        />
                        <span className="text-[11px] font-black text-brand-dark uppercase tracking-wide">
                          The client authorizes and accepts these studio booking terms.
                        </span>
                      </label>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        type="button"
                        onClick={() => setStep(4)}
                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-brand-border text-brand-dark px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-bg transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" /> Back to Profile
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !formData.termsAccepted}
                        className="flex-[2] flex items-center justify-center gap-3 bg-brand-olive text-white px-10 py-5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] hover:bg-brand-dark transition-all shadow-premium disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <FileCheck className="w-5 h-5" />
                        )}
                        Commit Studio Entry
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ACTION NAVIGATION BUTTONS */}
              <div className={clsx(
                "flex flex-col sm:flex-row justify-between items-center gap-4 pt-10 border-t border-brand-border mt-10",
                step === 5 && "hidden"
              )}>
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(prev => prev - 1)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-dark px-6 py-4 rounded-full border border-transparent hover:border-brand-border transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous Phase
                  </button>
                ) : <div className="hidden sm:block" />}

                {step < 5 && (
                  <button
                    type="button"
                    onClick={handleNextPhase}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-dark text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-olive transition-all shadow-premium"
                  >
                    Next Phase <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-12">
          <header className="text-center space-y-2">
            <h1 className="font-display text-4xl font-black text-brand-dark tracking-tighter uppercase">Bookings Archival History</h1>
            <p className="text-xs text-brand-muted uppercase tracking-widest font-black">History of Drop-off, In-store Bookings, and Artisan Consultations</p>
          </header>
          <BookingHistory />
        </div>
      )}
    </div>
  );
}
