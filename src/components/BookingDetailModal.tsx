import { useRef, useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Appointment } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Barcode, 
  CreditCard, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  MapPin, 
  AlertCircle,
  Clock3,
  CalendarCheck2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO, isValid } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Barcode generator matching Booking.tsx
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

interface BookingDetailModalProps {
  appointment: Appointment;
  onClose: () => void;
}

export default function BookingDetailModal({ appointment, onClose }: BookingDetailModalProps) {
  const { updateAppointment, settings } = useAppStore();
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [currentApt, setCurrentApt] = useState<Appointment>(appointment);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const bookingId = currentApt.id || 'BKS-' + currentApt.createdAt.replace(/\D/g, '').slice(-6);

  const safeFormatDate = (dateStr: string, formatPattern: string = 'dd MMM yyyy') => {
    if (!dateStr) return 'N/A';
    try {
      const parsed = parseISO(dateStr);
      if (isValid(parsed)) return format(parsed, formatPattern);
      const parsedFallback = new Date(dateStr);
      if (isValid(parsedFallback)) return format(parsedFallback, formatPattern);
    } catch (e) {
      console.warn("Invalid date format", dateStr);
    }
    return dateStr;
  };

  const handleStatusChange = (status: Appointment['status']) => {
    try {
      updateAppointment(currentApt.id, { status });
      setCurrentApt(prev => ({ ...prev, status }));
      setToastMessage({
        type: 'success',
        message: `Booking status updated to ${status}`
      });
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        message: `Failed to update status: ${err?.message || String(err)}`
      });
    }
  };

  const triggerWhatsApp = () => {
    const isFull = currentApt.paymentMode === 'Full';
    const totalAmount = currentApt.amount || '0';
    const paidAmount = isFull ? totalAmount : (currentApt.partialAmount || '0');
    const balanceAmount = (parseInt(totalAmount) - parseInt(paidAmount)).toString();

    const message = `*CORDWAINERS CARE - OFFICIAL BOOKING UPDATE*\n\nHello *${currentApt.customerName}*,\nYour studio booking registry status has been updated!\n\n*Booking ID:* ${bookingId}\n*Service:* ${currentApt.serviceType}\n*Date:* ${safeFormatDate(currentApt.date, 'eeee, dd MMM yyyy')}\n*Time Slot:* ${currentApt.time || 'Scheduled'}\n*Current Status:* ${currentApt.status}\n\n${currentApt.shoeModel ? `*Footwear:* ${currentApt.shoeModel}\n*Total Cost:* ₹${totalAmount}\n*Paid:* ₹${paidAmount}\n*Balance Due:* ₹${balanceAmount}` : ''}\n\nWe look forward to hosting you at our luxury workshop. Thank you for choosing Cordwainers Studio!`;
    const url = `https://wa.me/${currentApt.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

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
      pdf.save(`Booking-Receipt-${bookingId}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF receipt:", err);
      alert("Failed to generate PDF receipt. Please use the Print option.");
    }
  };

  const downloadReceiptAsText = () => {
    const isFull = currentApt.paymentMode === 'Full';
    const totalAmount = currentApt.amount || '0';
    const paidAmount = isFull ? totalAmount : (currentApt.partialAmount || '0');
    const balanceAmount = (parseInt(totalAmount) - parseInt(paidAmount)).toString();

    const content = `========================================
CORDWAINERS STUDIO BOOKING RECEIPT
========================================
Booking ID: ${bookingId}
Date: ${safeFormatDate(currentApt.createdAt, 'yyyy-MM-dd HH:mm')}
Client Name: ${currentApt.customerName}
Phone Number: ${currentApt.phone}
Email: ${currentApt.email || 'None'}

SERVICE DETAILS:
-----------------
Booking Type: ${currentApt.serviceType}
Scheduled Date: ${safeFormatDate(currentApt.date)}
Scheduled Time: ${currentApt.time || 'N/A'}

FOOTWEAR DETAILS:
-----------------
Model/Style: ${currentApt.shoeModel || 'N/A'}
Size: ${currentApt.shoeSize || 'N/A'}
Color: ${currentApt.shoeColor || 'N/A'}
Total Amount: ₹${totalAmount}

PAYMENT SUMMARY:
------------------
Payment Mode: ${currentApt.paymentMode || 'Full'}
Amount Paid: ₹${paidAmount}
Balance Due: ₹${balanceAmount}
Pickup Target: ${safeFormatDate(currentApt.pickupDate || '')}

----------------------------------------
Thank you for booking with Cordwainers Studio!
========================================`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Booking-${bookingId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const isFull = currentApt.paymentMode === 'Full';
  const totalAmount = parseInt(currentApt.amount || '0');
  const paidAmount = isFull ? totalAmount : parseInt(currentApt.partialAmount || '0');
  const balanceAmount = totalAmount - paidAmount;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
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
                <CheckCircle2 className="w-5 h-5" />
              ) : toastMessage.type === 'error' ? (
                <XCircle className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
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

      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-60 transition-opacity backdrop-blur-xs" 
        onClick={onClose}
      />
      
      {/* Drawer Container */}
      <div className="relative w-full max-w-xl bg-brand-bg h-full shadow-2xl overflow-y-auto transform transition-transform border-l border-brand-border flex flex-col z-10">
        
        {/* Header bar */}
        <div className="bg-white px-6 py-4 border-b border-brand-border/60 flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className={clsx(
              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
              currentApt.status === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
              currentApt.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
              currentApt.status === 'Completed' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
              'bg-red-100 text-red-700 border-red-200'
            )}>
              {currentApt.status}
            </span>
            <span className="font-mono text-xs font-bold text-brand-muted">{bookingId}</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-brand-bg text-brand-muted hover:text-brand-dark transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Quick Info Grid */}
          <div className="bg-white rounded-[24px] border border-brand-border p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-brand-dark uppercase tracking-widest border-b border-brand-border/40 pb-2">Client & Session</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-brand-muted uppercase tracking-widest block">Customer</span>
                <span className="text-sm font-black text-brand-dark block uppercase">{currentApt.customerName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-brand-muted uppercase tracking-widest block">Contact Mobile</span>
                <span className="text-xs font-mono font-bold text-brand-dark block">{currentApt.phone}</span>
              </div>
              {currentApt.email && (
                <div className="space-y-1 col-span-2">
                  <span className="text-[9px] font-bold text-brand-muted uppercase tracking-widest block">Email Address</span>
                  <span className="text-xs font-medium text-brand-muted block truncate">{currentApt.email}</span>
                </div>
              )}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-brand-muted uppercase tracking-widest block">Scheduled Date</span>
                <span className="text-xs font-semibold text-brand-dark block flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-olive" />
                  {safeFormatDate(currentApt.date)}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-brand-muted uppercase tracking-widest block">Scheduled Time</span>
                <span className="text-xs font-semibold text-brand-dark block flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-brand-olive" />
                  {currentApt.time || 'N/A'}
                </span>
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-[9px] font-bold text-brand-muted uppercase tracking-widest block">Service Type</span>
                <span className="text-xs font-extrabold text-brand-olive block uppercase tracking-wide">
                  {currentApt.serviceType}
                </span>
              </div>
            </div>
            {currentApt.notes && (
              <div className="bg-brand-bg/40 rounded-xl p-4 border border-brand-border/30 mt-2">
                <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest block mb-1">Artisan Notes</span>
                <p className="text-xs text-brand-dark italic font-medium">"{currentApt.notes}"</p>
              </div>
            )}
          </div>

          {/* Workflow status updater */}
          <div className="bg-white rounded-[24px] border border-brand-border p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-brand-dark uppercase tracking-widest">Update Booking Status</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button 
                onClick={() => handleStatusChange('Confirmed')}
                disabled={currentApt.status === 'Confirmed'}
                className={clsx(
                  "py-3 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 transition-all border",
                  currentApt.status === 'Confirmed' 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 opacity-60" 
                    : "bg-white border-brand-border text-brand-dark hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Slot
              </button>
              <button 
                onClick={() => handleStatusChange('Completed')}
                disabled={currentApt.status === 'Completed'}
                className={clsx(
                  "py-3 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 transition-all border",
                  currentApt.status === 'Completed' 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-800 opacity-60" 
                    : "bg-white border-brand-border text-brand-dark hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300"
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Attended
              </button>
              <button 
                onClick={() => handleStatusChange('Cancelled')}
                disabled={currentApt.status === 'Cancelled'}
                className={clsx(
                  "py-3 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 transition-all border",
                  currentApt.status === 'Cancelled' 
                    ? "bg-red-50 border-red-200 text-red-800 opacity-60" 
                    : "bg-white border-brand-border text-brand-dark hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                )}
              >
                <XCircle className="w-3.5 h-3.5" /> Cancel Slot
              </button>
              <button 
                onClick={() => handleStatusChange('Pending')}
                disabled={currentApt.status === 'Pending'}
                className={clsx(
                  "py-3 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 transition-all border",
                  currentApt.status === 'Pending' 
                    ? "bg-amber-50 border-amber-200 text-amber-800 opacity-60" 
                    : "bg-white border-brand-border text-brand-dark hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300"
                )}
              >
                <Clock3 className="w-3.5 h-3.5" /> Reset Pending
              </button>
            </div>
          </div>

          {/* Footwear details if they exist */}
          {currentApt.shoeModel && (
            <div className="bg-white rounded-[24px] border border-brand-border p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-brand-dark uppercase tracking-widest border-b border-brand-border/40 pb-2">Footwear Specification</h3>
              
              {currentApt.shoeImage && (
                <div className="relative rounded-2xl overflow-hidden border border-brand-border max-h-48 flex items-center justify-center bg-brand-bg/50">
                  <img 
                    src={currentApt.shoeImage} 
                    alt={currentApt.shoeModel} 
                    className="w-full h-full object-cover max-h-48"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3 space-y-1">
                  <span className="text-[9px] font-bold text-brand-muted uppercase tracking-widest">Model / Style</span>
                  <span className="text-sm font-black text-brand-dark uppercase">{currentApt.shoeModel}</span>
                </div>
                {currentApt.shoeColor && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-widest">Color</span>
                    <span className="text-xs font-bold text-brand-dark uppercase">{currentApt.shoeColor}</span>
                  </div>
                )}
                {currentApt.shoeSize && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-widest">Size</span>
                    <span className="text-xs font-bold text-brand-dark uppercase font-mono">{currentApt.shoeSize}</span>
                  </div>
                )}
                {currentApt.pickupDate && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-widest">Target Pickup</span>
                    <span className="text-xs font-bold text-brand-olive font-mono">{safeFormatDate(currentApt.pickupDate)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick receipt share / export buttons */}
          <div className="flex gap-2">
            <button 
              onClick={triggerWhatsApp}
              className="flex-1 bg-brand-olive text-white py-3.5 rounded-full font-black uppercase tracking-[0.15em] text-[10px] hover:bg-brand-dark transition-all flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" /> WhatsApp Alert
            </button>
            <button 
              onClick={downloadReceiptAsPDF}
              className="bg-brand-accent text-white px-5 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-brand-accent/95 transition-all flex items-center justify-center gap-1.5"
            >
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button 
              onClick={handlePrint}
              className="bg-brand-dark text-white px-5 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-brand-muted transition-all flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>

          {/* PRINTABLE RECEIPT TEMPLATE DOCUMENT */}
          <div className="border border-brand-border/80 rounded-[32px] overflow-hidden bg-white mt-4 shadow-sm">
            <div className="p-4 bg-brand-bg/40 border-b border-brand-border/60 flex items-center justify-between">
              <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Archival Document Preview</span>
              <button 
                onClick={downloadReceiptAsText}
                className="text-[9px] font-black text-brand-olive hover:text-brand-dark uppercase tracking-widest flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Raw Text
              </button>
            </div>
            
            {/* Embedded print container ref */}
            <div className="bg-white p-4">
              <div 
                ref={receiptRef} 
                className="bg-white border border-brand-border p-6 space-y-6 text-left relative"
                style={{ backgroundColor: '#FFFFFF', color: '#1A1A1A' }}
              >
                {/* Receipt Header */}
                <div className="text-center space-y-2 border-b pb-4 border-dashed border-gray-300">
                  <h4 className="text-xl font-black tracking-widest uppercase font-display text-[#1A1A1A]">Cordwainers Studio</h4>
                  <p className="text-[8px] font-bold tracking-[0.25em] text-gray-500 uppercase">In-Store Registry & Diagnostics</p>
                  <div className="pt-2 flex justify-center">
                    <BarcodeSVG value={bookingId} />
                  </div>
                </div>

                {/* Client Profile */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Client Profile</span>
                    <p className="font-black uppercase text-brand-dark">{currentApt.customerName}</p>
                    <p className="font-mono text-[9px] text-gray-500">{currentApt.phone}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Registered Date</span>
                    <p className="font-bold text-brand-dark">{safeFormatDate(currentApt.createdAt, 'dd MMM yyyy • HH:mm')}</p>
                    <p className="text-[8px] font-black uppercase text-brand-olive">Representative: Store Lead</p>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2 border-t pt-4 border-dashed border-gray-200">
                  <div className="flex justify-between items-start text-xs">
                    <div>
                      <p className="font-black uppercase tracking-tight text-[#1A1A1A]">{currentApt.serviceType}</p>
                      {currentApt.shoeModel && (
                        <p className="text-[9px] text-gray-500 mt-0.5">
                          Footwear: {currentApt.shoeModel} {currentApt.shoeColor ? `| Color: ${currentApt.shoeColor}` : ''} {currentApt.shoeSize ? `| Size: ${currentApt.shoeSize}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-[#1A1A1A]">₹{totalAmount.toLocaleString()}</p>
                    </div>
                  </div>

                  {currentApt.pickupDate && (
                    <div className="flex justify-between items-center text-[9px] text-gray-500 italic pt-1">
                      <span>Estimated Pickup Protection Date</span>
                      <span className="font-mono font-semibold">{safeFormatDate(currentApt.pickupDate)}</span>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="border-t-2 pt-3 space-y-1.5 border-brand-dark">
                  <div className="flex justify-between text-[9px] font-bold uppercase text-gray-500">
                    <span>Base Assessment</span>
                    <span className="font-mono">₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black uppercase pt-1 border-t border-dashed border-gray-200 text-[#1A1A1A]">
                    <span>Grand Total</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-600 pt-1">
                    <span>Paid Amount ({currentApt.paymentMode || 'Full'})</span>
                    <span className="font-mono">₹{paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black uppercase text-red-600 pt-0.5">
                    <span>Balance Due</span>
                    <span>₹{balanceAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="p-3 rounded-lg border border-dashed text-left space-y-0.5 border-gray-300 bg-brand-bg/5 mt-2">
                  <p className="text-[8px] font-black uppercase text-amber-800">✦ Artisan Protection Note</p>
                  <p className="text-[9px] text-gray-500 leading-relaxed">
                    Always store luxury leather footwear using custom cedar shoe trees. This preserves lining structure, keeps insoles dry, and retains original lasting contour lines.
                  </p>
                </div>

                <div className="text-center pt-4 border-t border-dashed border-gray-200">
                  <p className="text-[8px] font-black uppercase text-gray-400">Cordwainers Care Studio</p>
                  <p className="text-[7px] text-gray-400 uppercase tracking-widest mt-0.5">Digitally Archival Log • Subject to CW Policy</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
