import React from 'react';
import { ShoeRepairRequest } from '../types';
import { useAppStore } from '../store';

interface InvoiceModalProps {
  invoice: ShoeRepairRequest | null;
  onClose: () => void;
  randomFact?: string;
}

export default function InvoiceModal({ invoice, onClose, randomFact }: InvoiceModalProps) {
  const { settings, stores = [] } = useAppStore();

  if (!invoice) return null;

  const invoiceStore = invoice.storeId ? stores.find(s => s.id === invoice.storeId) : null;
  const storeName = invoiceStore?.storeName || settings.storeName;
  const storeAddress = invoiceStore?.address || settings.address;
  const storeHours = invoiceStore?.hours || settings.hours;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const input = document.getElementById('printable-invoice');
    if (input) {
      const { generateRepairPDF } = await import('../lib/pdfUtils');
      await generateRepairPDF(input as HTMLDivElement, `receipt-${invoice.invoiceNumber}`);
    }
  };

  const handleSendWhatsApp = () => {
    if (!invoice) return;
    
    let template = '';
    const status = invoice.status;
    
    if (status === 'Received') {
      template = settings.whatsappIntakeTemplate || 'Hello {customerName}, your shoe repair ({repairType}) has been received successfully. Ticket: {invoiceNumber}';
    } else if (status === 'Completed') {
      template = settings.whatsappReadyTemplate || 'Great news {customerName}! Your {shoeModel} is ready for pickup. Balance due: ₹{balance}. Ticket: {invoiceNumber}';
    } else {
      template = settings.whatsappTemplate || 'Hello {customerName}, your repair status ({repairType}) is now: {status}. Ticket: {invoiceNumber}';
    }

    const message = template
      .replace(/{customerName}/g, invoice.customerName)
      .replace(/{repairType}/g, Array.isArray(invoice.repairType) ? invoice.repairType.join(', ') : invoice.repairType)
      .replace(/{status}/g, status === 'Completed' ? 'Ready for Pickup' : status)
      .replace(/{invoiceNumber}/g, invoice.invoiceNumber)
      .replace(/{shoeModel}/g, invoice.shoeModel)
      .replace(/{price}/g, invoice.price.toString())
      .replace(/{balance}/g, (invoice.price - (invoice.advance || 0)).toString());

    const url = `https://wa.me/${invoice.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const hasInsurance = invoice.insurancePrice > 0;
  const addonsCost = invoice.addons && invoice.addons.length > 0 
    ? invoice.addons.reduce((sum, a) => sum + a.price, 0) 
    : invoice.addonPrice || 0;
  const total = invoice.price;
  const baseServicePrice = invoice.basePrice || Math.max(0, invoice.price - addonsCost - (hasInsurance ? invoice.insurancePrice : 0) + (invoice.discountAmount || 0));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden max-h-screen overflow-y-auto">
        <div id="printable-invoice" className="p-8 bg-white text-brand-dark">
          <div className="text-center mb-6 border-b border-brand-border-dark pb-6">
            <h2 className="font-display text-3xl font-bold mb-1">{storeName}</h2>
            <p className="text-xs font-sans text-brand-muted uppercase tracking-wider">{storeAddress}</p>
            <p className="text-xs font-sans text-brand-muted uppercase tracking-wider">{storeHours}</p>
          </div>
          
          <div className="mb-6 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-bold text-brand-olive uppercase tracking-widest text-xs">Invoice:</span>
              <span className="font-mono">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-bold text-brand-olive uppercase tracking-widest text-xs">Date:</span>
              <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-bold text-brand-olive uppercase tracking-widest text-xs">Customer:</span>
              <span>{invoice.customerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-bold text-brand-olive uppercase tracking-widest text-xs">Phone:</span>
              <span>{invoice.phoneNumber}</span>
            </div>
            {invoice.receivedBy && (
              <div className="flex justify-between text-sm">
                <span className="font-bold text-brand-olive uppercase tracking-widest text-xs">Received By:</span>
                <span>{invoice.receivedBy}</span>
              </div>
            )}
            {invoice.assignedCobblerName && (
              <div className="flex justify-between text-sm">
                <span className="font-bold text-brand-olive uppercase tracking-widest text-xs">Artisan:</span>
                <span className="font-semibold text-brand-dark">{invoice.assignedCobblerName}</span>
              </div>
            )}
            {invoice.paymentMethod && invoice.paymentMethod !== 'None' && (
              <div className="flex justify-between text-sm">
                <span className="font-bold text-brand-olive uppercase tracking-widest text-xs">Paid Via:</span>
                <span>{invoice.paymentMethod}</span>
              </div>
            )}
            {invoice.transactionId && (
              <div className="flex justify-between text-sm">
                <span className="font-bold text-brand-olive uppercase tracking-widest text-xs">Transaction ID:</span>
                <span className="font-mono text-xs text-brand-muted">{invoice.transactionId}</span>
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
                    {Array.isArray(invoice.repairType) ? invoice.repairType.join(', ') : invoice.repairType}
                    <div className="text-xs text-brand-muted">{invoice.shoeModel}</div>
                  </td>
                  <td className="text-right py-2">₹{(baseServicePrice || 0).toFixed(2)}</td>
                </tr>
                {invoice.addons && invoice.addons.map(a => (
                  <tr key={a.name}>
                    <td className="py-2">Add-on: {a.name}</td>
                    <td className="text-right py-2">₹{a.price.toFixed(2)}</td>
                  </tr>
                ))}
                {invoice.addonPrice > 0 && (!invoice.addons || invoice.addons.length === 0) && (
                  <tr>
                    <td className="py-2">Add-on: {invoice.addonType || 'Misc'}</td>
                    <td className="text-right py-2">₹{invoice.addonPrice.toFixed(2)}</td>
                  </tr>
                )}
                {hasInsurance && (
                  <tr>
                    <td className="py-2">Cordwainers cover: {invoice.insuranceType}</td>
                    <td className="text-right py-2">₹{invoice.insurancePrice.toFixed(2)}</td>
                  </tr>
                )}
                {(invoice.discountAmount || 0) > 0 && (
                  <tr>
                    <td className="py-2">Discount ({invoice.appliedOfferCode}):</td>
                    <td className="text-right py-2 text-red-600">-₹{invoice.discountAmount.toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-brand-dark font-bold text-lg">
                  <td className="pt-4 text-right pr-4">Total</td>
                  <td className="pt-4 text-right">
                    ₹{total.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="text-right pr-4">Advance:</td>
                  <td className="text-right">₹{(invoice.advance || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="text-right pr-4">Balance:</td>
                  <td className="text-right font-bold text-amber-600">₹{Math.max(0, total - (invoice.advance || 0)).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {((invoice.beforePhotos && invoice.beforePhotos.length > 0) || (invoice.afterPhotos && invoice.afterPhotos.length > 0)) && (
            <div className="mb-8 border-t border-brand-border-dark pt-6 print:block">
              <h3 className="text-[10px] font-bold text-brand-olive uppercase tracking-[0.2em] mb-4 text-center">Visual Restoration Documentation</h3>
              <div className="grid grid-cols-2 gap-3">
                {invoice.beforePhotos?.slice(0, 2).map(p => (
                  <div key={p.id} className="relative aspect-[4/3] group">
                    <img src={p.url} alt="Condition Before" className="w-full h-full object-cover rounded-lg border border-brand-border-dark shadow-sm" referrerPolicy="no-referrer" />
                    <span className="absolute top-2 left-2 bg-brand-dark/80 text-[7px] text-white font-black px-2 py-1 rounded uppercase tracking-widest backdrop-blur-sm">Before Restoration</span>
                  </div>
                ))}
                {invoice.afterPhotos?.slice(0, 2).map(p => (
                  <div key={p.id} className="relative aspect-[4/3] group">
                    <img src={p.url} alt="Condition After" className="w-full h-full object-cover rounded-lg border border-brand-olive shadow-sm" referrerPolicy="no-referrer" />
                    <span className="absolute top-2 left-2 bg-brand-olive/80 text-[7px] text-white font-black px-2 py-1 rounded uppercase tracking-widest backdrop-blur-sm">After Restoration</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
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
              Due Date: {new Date(invoice.dueDate).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="bg-brand-bg p-4 flex gap-2 justify-end border-t border-brand-border-dark print:hidden flex-wrap">
          <button onClick={handlePrint} className="px-3 py-1.5 border border-brand-border-dark bg-white rounded-md text-[10px] font-bold text-brand-dark uppercase tracking-widest hover:bg-brand-bg">
            Print
          </button>
          <button onClick={handleDownload} className="px-3 py-1.5 border border-brand-border-dark bg-white rounded-md text-[10px] font-bold text-brand-dark uppercase tracking-widest hover:bg-brand-bg">
            Download PDF
          </button>
          <button onClick={handleSendWhatsApp} className="px-3 py-1.5 bg-green-600 text-white rounded-md text-[10px] font-bold uppercase tracking-widest hover:opacity-90">
            WhatsApp
          </button>
          <button onClick={onClose} className="px-3 py-1.5 bg-brand-dark text-white rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-brand-muted">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
