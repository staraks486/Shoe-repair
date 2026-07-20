import React from 'react';
import { ShoeRepairRequest } from '../types';
import { useAppStore } from '../store';

interface ReceiptDocumentProps {
  repair: ShoeRepairRequest;
}

export const ReceiptDocument = React.forwardRef<HTMLDivElement, ReceiptDocumentProps>(({ repair }, ref) => {
  const { settings, stores = [] } = useAppStore();
  const repairStore = repair.storeId ? stores.find(s => s.id === repair.storeId) : null;
  const storeName = repairStore?.storeName || settings.storeName;
  const storeAddress = repairStore?.address || settings.address;

  return (
    <div ref={ref} className="p-8 bg-white text-brand-dark w-[210mm]">
      <div className="text-center mb-6 border-b border-brand-border-dark pb-6">
        <h2 className="font-display text-3xl font-bold mb-1">{storeName}</h2>
        <p className="text-xs text-brand-muted uppercase tracking-wider">{storeAddress}</p>
      </div>
      <div className="mb-6">
        <p>Invoice: {repair.invoiceNumber}</p>
        <p>Customer: {repair.customerName}</p>
        <p>Model: {repair.shoeModel}</p>
      </div>
      {/* Add more fields here */}
    </div>
  );
});
