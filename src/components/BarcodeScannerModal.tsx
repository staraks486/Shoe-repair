import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CameraOff, 
  X, 
  Barcode, 
  Plus, 
  Minus, 
  Check, 
  AlertTriangle, 
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';
import clsx from 'clsx';
import { InventoryItem } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  onUpdateStock: (id: string, quantity: number) => void;
  onAddNewSupply: (barcode: string) => void;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  inventory,
  onUpdateStock,
  onAddNewSupply
}: BarcodeScannerModalProps) {
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedItem, setDetectedItem] = useState<InventoryItem | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [simulatedSelectId, setSimulatedSelectId] = useState('');
  
  // Scanned item stock state
  const [tempQuantity, setTempQuantity] = useState<number>(0);
  const [showFlash, setShowFlash] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Beep Audio
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); // 1000Hz
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.08); // 80ms beep
    } catch (e) {
      console.log("Audio play failed or blocked", e);
    }
  };

  // Start Camera
  const startCamera = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setHasCamera(true);
      setCameraActive(true);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setHasCamera(false);
      setCameraActive(false);
      setErrorMessage("Could not access camera. This may be due to browser permission constraints, your device lacking a camera, or security policies in the sandbox preview.");
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Process video frames for barcode detection
  useEffect(() => {
    if (!cameraActive || !isOpen) return;

    let detector: any = null;
    if ('BarcodeDetector' in window) {
      try {
        detector = new (window as any).BarcodeDetector({
          formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e']
        });
      } catch (e) {
        console.warn("BarcodeDetector initialization failed:", e);
      }
    }

    const scanFrame = async () => {
      if (!videoRef.current || !canvasRef.current || !cameraActive) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (detector) {
          try {
            const barcodes = await detector.detect(canvas);
            if (barcodes && barcodes.length > 0) {
              const barcodeVal = barcodes[0].rawValue;
              handleBarcodeMatch(barcodeVal);
              // Stop camera temporarily on success to let user adjust
              stopCamera();
              return;
            }
          } catch (err) {
            console.error("Barcode detection error:", err);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraActive, isOpen]);

  // Clean up on unmount or close
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setDetectedItem(null);
      setScannedBarcode(null);
      setManualBarcode('');
      setSimulatedSelectId('');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Handle a successfully resolved barcode
  const handleBarcodeMatch = (code: string) => {
    playBeep();
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);

    setScannedBarcode(code);
    
    // Search inventory for matching barcode
    const item = inventory.find(i => i.barcode === code);
    if (item) {
      setDetectedItem(item);
      setTempQuantity(item.quantity);
    } else {
      setDetectedItem(null);
    }
  };

  // Simulate scanning via selector dropdown
  const handleSimulateSelect = (id: string) => {
    if (!id) return;
    const item = inventory.find(i => i.id === id);
    if (item) {
      const code = item.barcode || `890-${item.id.slice(0, 5)}`;
      handleBarcodeMatch(code);
    }
  };

  // Simulate scanning via custom manual entry
  const handleSimulateManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    handleBarcodeMatch(manualBarcode.trim());
  };

  // Save updated stock
  const handleSaveStock = () => {
    if (!detectedItem) return;
    onUpdateStock(detectedItem.id, tempQuantity);
    
    setSuccessAnimation(true);
    setTimeout(() => {
      setSuccessAnimation(false);
      // Reset scanning state so user can scan next
      setDetectedItem(null);
      setScannedBarcode(null);
      setSimulatedSelectId('');
      if (hasCamera && !cameraActive) {
        startCamera();
      }
    }, 1200);
  };

  // Navigate to Add Item pre-populating barcode
  const handleCreateNew = () => {
    if (!scannedBarcode) return;
    onAddNewSupply(scannedBarcode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-brand-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-brand-border flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center text-brand-dark">
              <Barcode className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-dark">Studio Barcode Scanner</h3>
              <p className="text-[10px] text-brand-muted uppercase tracking-wider font-semibold">Instantly check and update material stock levels</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-brand-muted hover:text-brand-dark p-1.5 rounded-full hover:bg-brand-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Flash Effect on Scanning */}
        {showFlash && (
          <div className="absolute inset-0 bg-white/70 pointer-events-none z-50 animate-out fade-out duration-300" />
        )}

        <div className="p-6 space-y-6 flex-1">
          
          {/* Main camera / viewfinder card */}
          {!scannedBarcode ? (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-brand-dark border border-brand-border shadow-inner flex flex-col items-center justify-center text-white">
                
                {cameraActive ? (
                  <>
                    <video 
                      ref={videoRef} 
                      className="absolute inset-0 w-full h-full object-cover"
                      playsInline 
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Viewfinder Target Framing Reticle */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-32 md:w-80 md:h-40 border-2 border-white/60 rounded-lg relative">
                        {/* Corners */}
                        <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr" />
                        <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br" />
                        
                        {/* Horizontal Laser Line scanning up & down */}
                        <div className="absolute left-1 right-1 h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] animate-bounce" style={{ top: '50%' }} />
                      </div>
                    </div>

                    <div className="absolute bottom-3 left-3 bg-black/70 px-2.5 py-1 rounded text-[10px] font-mono tracking-wider flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>LIVE VIEWPORT</span>
                    </div>

                    {/* Camera Control button */}
                    <button 
                      onClick={stopCamera}
                      className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-colors"
                    >
                      Disable Lens
                    </button>
                  </>
                ) : (
                  <div className="p-6 text-center max-w-sm space-y-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto text-brand-muted">
                      <CameraOff className="w-6 h-6 text-gray-300" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Camera Feed Disabled</h4>
                      <p className="text-xs text-gray-400 mt-1">Enable camera stream to automatically scan standard 1D and 2D barcodes on material boxes.</p>
                    </div>
                    {errorMessage && (
                      <p className="text-[11px] text-red-400 bg-red-950/40 p-2.5 rounded border border-red-900/30 font-medium">
                        {errorMessage}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-brand-dark hover:bg-brand-bg rounded-md text-xs font-bold uppercase tracking-widest transition-colors shadow"
                    >
                      <Camera className="w-4 h-4" /> Enable Lens
                    </button>
                  </div>
                )}
              </div>

              {/* Advanced Simulator Bar - Critical for flawless user experience */}
              <div className="bg-brand-bg border border-brand-border rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-brand-dark">
                  <Sparkles className="w-4 h-4 text-brand-olive" />
                  <span className="text-xs font-bold uppercase tracking-widest">Simulator Controls</span>
                  <span className="text-[9px] bg-brand-olive/10 text-brand-olive font-bold px-1.5 py-0.5 rounded uppercase ml-auto">No Box Needed</span>
                </div>
                <p className="text-xs text-brand-muted">
                  Use these controls to mock standard scanner beeps, test barcodes, and check stock-updating operations without a physical item.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select supply */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark">1. Select Studio Material</label>
                    <select
                      value={simulatedSelectId}
                      onChange={(e) => {
                        setSimulatedSelectId(e.target.value);
                        handleSimulateSelect(e.target.value);
                      }}
                      className="w-full text-xs border border-brand-border rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                    >
                      <option value="">-- Click to simulate barcode scan --</option>
                      {inventory.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Manual input */}
                  <form onSubmit={handleSimulateManual} className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark">2. Enter Custom Barcode</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. 890453894"
                        value={manualBarcode}
                        onChange={(e) => setManualBarcode(e.target.value)}
                        className="flex-1 text-xs border border-brand-border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-dark bg-white font-mono"
                      />
                      <button
                        type="submit"
                        className="px-3 bg-brand-dark text-white text-xs font-bold uppercase rounded-md hover:bg-brand-muted transition-colors"
                      >
                        Scan
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* Result Interface once a barcode is detected */
            <div className="animate-in slide-in-from-bottom-5 duration-300">
              {successAnimation ? (
                /* Success overlay animation */
                <div className="py-16 text-center space-y-4 animate-in zoom-in-90 duration-200">
                  <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-sm">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xl font-bold text-brand-dark">Stock Synced Successfully</h4>
                    <p className="text-xs text-brand-muted uppercase tracking-wider mt-1">
                      {detectedItem ? `Updated ${detectedItem.name} level to ${tempQuantity} ${detectedItem.unit || 'pcs'}` : ''}
                    </p>
                  </div>
                </div>
              ) : (
                /* Edit Stock levels */
                <div className="space-y-6">
                  <div className="bg-brand-bg rounded-xl border border-brand-border p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-brand-border flex items-center justify-center text-brand-dark shrink-0">
                      <Barcode className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-brand-olive uppercase tracking-widest">Scanned / Detected Item</div>
                      <h4 className="font-serif text-lg font-bold text-brand-dark">
                        {detectedItem ? detectedItem.name : 'Unknown Barcode'}
                      </h4>
                      <p className="text-xs font-mono text-brand-muted">
                        Barcode Number: <span className="font-bold text-brand-dark">{scannedBarcode}</span>
                      </p>
                    </div>
                  </div>

                  {detectedItem ? (
                    /* Registered item stock form */
                    <div className="bg-white border border-brand-border rounded-xl p-6 space-y-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h5 className="text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">Adjust Quantity Levels</h5>
                          <p className="text-xs text-brand-muted">Configure the stock level for this supply resource in real-time.</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-brand-muted uppercase bg-brand-bg px-2.5 py-1 rounded border border-brand-border">
                            {detectedItem.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-4 py-4">
                        <button
                          type="button"
                          onClick={() => setTempQuantity(q => Math.max(0, q - 1))}
                          className="w-12 h-12 rounded-full border border-brand-border flex items-center justify-center hover:bg-brand-bg text-brand-dark transition-colors shadow-sm"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        
                        <div className="text-center min-w-[120px]">
                          <input
                            type="number"
                            value={tempQuantity}
                            onChange={(e) => setTempQuantity(Math.max(0, Number(e.target.value)))}
                            className="w-full text-4xl font-extrabold text-brand-dark text-center focus:outline-none bg-transparent"
                          />
                          <span className="block text-xs font-bold uppercase tracking-wider text-brand-muted mt-1">
                            {detectedItem.unit || 'pcs'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setTempQuantity(q => q + 1)}
                          className="w-12 h-12 rounded-full border border-brand-border flex items-center justify-center hover:bg-brand-bg text-brand-dark transition-colors shadow-sm"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Rapid preset buttons */}
                      <div className="flex justify-center gap-2 border-t border-brand-border pt-4">
                        {[-5, -1, 1, 5].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setTempQuantity(q => Math.max(0, q + val))}
                            className={clsx(
                              "px-3 py-1.5 text-xs font-mono font-bold rounded border transition-all",
                              val < 0 
                                ? "bg-red-50/50 hover:bg-red-50 text-red-700 border-red-200"
                                : "bg-green-50/50 hover:bg-green-50 text-green-700 border-green-200"
                            )}
                          >
                            {val > 0 ? `+${val}` : val}
                          </button>
                        ))}
                      </div>

                      {/* Warning if stock level falls below threshold */}
                      {tempQuantity <= detectedItem.minThreshold && (
                        <div className="flex items-center gap-2.5 p-3 rounded-lg border bg-yellow-50 text-yellow-700 border-yellow-200 text-xs font-medium">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>This adjustment places the stock level at or below the minimum alert threshold ({detectedItem.minThreshold}).</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Barcode is not registered to any item */
                    <div className="bg-yellow-50/50 border border-yellow-200 rounded-xl p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-sm font-bold text-yellow-800">Unrecognized Studio Barcode</h5>
                          <p className="text-xs text-yellow-700 mt-1">
                            No supply item has been registered with the barcode <span className="font-mono font-bold">{scannedBarcode}</span> yet.
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-brand-muted">
                        Would you like to register this as a brand new premium material in the studio? We will pre-populate the barcode for you.
                      </p>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleCreateNew}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-dark text-white rounded-md text-xs font-bold uppercase tracking-wider hover:bg-brand-muted transition-colors"
                        >
                          <Plus className="w-4 h-4" /> Register New Supply
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setScannedBarcode(null);
                            if (hasCamera) startCamera();
                          }}
                          className="px-4 py-2.5 border border-brand-border rounded-md text-xs font-bold uppercase text-brand-dark hover:bg-brand-bg transition-colors"
                        >
                          Scan Again
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Save button (for recognized item) */}
                  {detectedItem && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setScannedBarcode(null);
                          if (hasCamera) startCamera();
                        }}
                        className="flex-1 py-3 border border-brand-border text-brand-dark hover:bg-brand-bg rounded-md text-xs font-bold uppercase tracking-wider transition-colors text-center"
                      >
                        Cancel / Scan Next
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveStock}
                        className="flex-1 py-3 bg-brand-dark hover:bg-brand-muted text-white rounded-md text-xs font-bold uppercase tracking-wider transition-colors text-center shadow-lg"
                      >
                        Confirm Stock Levels
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-brand-border rounded-b-xl flex items-center justify-between text-[10px] text-brand-muted">
          <span className="font-semibold uppercase tracking-wider">Device Camera Permissions Required</span>
          <span className="font-mono">V1.4.0-COBBLE</span>
        </div>

      </div>
    </div>
  );
}
