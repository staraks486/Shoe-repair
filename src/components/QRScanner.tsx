import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, RefreshCw, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
      },
      /* verbose= */ false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // Success
        scanner.clear();
        onScan(decodedText);
      },
      (errorMessage) => {
        // Ignored as it happens frequently while searching for QR code
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [onScan]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-brand-dark/90 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-6"
    >
      <div className="w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-olive/10 flex items-center justify-center">
              <Camera className="w-5 h-5 text-brand-olive" />
            </div>
            <div>
              <h3 className="font-serif font-black text-brand-dark uppercase tracking-tight">Receipt Scanner</h3>
              <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Scan ticket QR code</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-brand-bg text-brand-muted hover:text-brand-dark transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-6">
          <div id="qr-reader" className="overflow-hidden rounded-2xl border-2 border-brand-olive/20" />
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          <div className="mt-6 flex flex-col items-center text-center space-y-2">
            <p className="text-xs font-bold text-brand-muted">
              Position the QR code within the frame to automatically scan.
            </p>
            <p className="text-[9px] text-brand-muted/60 uppercase tracking-[0.2em] font-black">
              Works with all Cordwainers Studio receipts
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-brand-bg/50 border-t border-brand-border text-center">
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 mx-auto text-[10px] font-black uppercase tracking-widest text-brand-olive hover:text-brand-dark transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Trouble Scanning? Reload
          </button>
        </div>
      </div>
    </motion.div>
  );
}
