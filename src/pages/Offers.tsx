import React, { useState } from 'react';
import { useAppStore } from '../store';
import { 
  Tag, 
  Copy, 
  Check, 
  Sparkles, 
  Flame, 
  Gift, 
  Compass, 
  Coins, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  Award,
  Plus,
  Trash2,
  X
} from 'lucide-react';

export default function Offers() {
  const { settings, updateSettings } = useAppStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal display toggles
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);

  // New Coupon/Offer Form State
  const [offerName, setOfferName] = useState('');
  const [offerCode, setOfferCode] = useState('');
  const [offerDiscount, setOfferDiscount] = useState<number>(10);
  const [offerError, setOfferError] = useState('');

  // New Package Form State
  const [packageName, setPackageName] = useState('');
  const [packageDesc, setPackageDesc] = useState('');
  const [packagePrice, setPackagePrice] = useState<number>(499);
  const [packageError, setPackageError] = useState('');

  const activeOffers = settings.offers || [];
  const carePackages = settings.shoeCarePackages || [];

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerName.trim()) {
      setOfferError('Offer description/name is required');
      return;
    }
    if (!offerCode.trim()) {
      setOfferError('Promo code is required');
      return;
    }
    
    const cleanCode = offerCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode) {
      setOfferError('Promo code must be alphanumeric');
      return;
    }
    if (offerDiscount < 1 || offerDiscount > 100) {
      setOfferError('Discount percentage must be between 1% and 100%');
      return;
    }

    if (activeOffers.some(o => o.code === cleanCode)) {
      setOfferError('An offer with this promo code already exists');
      return;
    }

    const newOffer = {
      id: Math.random().toString(36).substring(2, 9),
      name: offerName.trim(),
      code: cleanCode,
      discountPercentage: offerDiscount
    };

    updateSettings({
      offers: [...activeOffers, newOffer]
    });

    // Reset Form
    setOfferName('');
    setOfferCode('');
    setOfferDiscount(10);
    setOfferError('');
    setIsOfferModalOpen(false);
  };

  const handleDeleteOffer = (id: string) => {
    updateSettings({
      offers: activeOffers.filter(o => o.id !== id)
    });
  };

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageName.trim()) {
      setPackageError('Package name is required');
      return;
    }
    if (!packageDesc.trim()) {
      setPackageError('Package description is required');
      return;
    }
    if (packagePrice < 0) {
      setPackageError('Price must be greater than or equal to 0');
      return;
    }

    const newPackage = {
      id: Math.random().toString(36).substring(2, 9),
      name: packageName.trim(),
      description: packageDesc.trim(),
      price: packagePrice
    };

    updateSettings({
      shoeCarePackages: [...carePackages, newPackage]
    });

    // Reset Form
    setPackageName('');
    setPackageDesc('');
    setPackagePrice(499);
    setPackageError('');
    setIsPackageModalOpen(false);
  };

  const handleDeletePackage = (id: string) => {
    updateSettings({
      shoeCarePackages: carePackages.filter(p => p.id !== id)
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 px-4 sm:px-6">
      {/* HEADER: Matching Care Portal style */}
      <header className="flex flex-col sm:flex-row justify-between items-center gap-6 py-8">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="font-display text-3xl font-bold text-brand-dark tracking-tight">Catalog</h2>
          <p className="label-xs">Offers & Care Packages</p>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => setIsPackageModalOpen(true)}
            className="px-8 py-2.5 bg-brand-dark text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent transition-all shadow-lg active:scale-95"
          >
            + Create Package
          </button>
          <button
            onClick={() => setIsOfferModalOpen(true)}
            className="px-8 py-2.5 bg-white text-brand-dark border border-brand-border rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-bg transition-all shadow-premium active:scale-95"
          >
            + New Promo
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* RIGHT: Shoe Care Packages (Main Content) */}
        <div className="lg:col-span-8 space-y-8 order-1 lg:order-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl font-black text-brand-dark">Service Add-ons</h3>
            <span className="label-xs bg-brand-bg px-4 py-1.5 rounded-full border border-brand-border">
              {carePackages.length} Collections
            </span>
          </div>

          {carePackages.length === 0 ? (
            <div className="text-center py-24 premium-card border-dashed">
              <Compass className="w-10 h-10 text-brand-muted mx-auto mb-4 opacity-20" />
              <p className="label-xs">Catalog is empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {carePackages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  className="premium-card p-8 flex flex-col justify-between min-h-[240px] group"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="font-display font-black text-xl text-brand-dark leading-tight group-hover:text-brand-accent transition-colors">
                        {pkg.name}
                      </h4>
                      <p className="text-2xl font-display font-black text-brand-dark tracking-tighter">
                        ₹{pkg.price.toLocaleString()}
                      </p>
                    </div>
                    <p className="text-xs text-brand-muted leading-relaxed font-medium">
                      {pkg.description}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-brand-border/40 flex items-center justify-between">
                    <span className="label-xs text-brand-accent flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      Premium Service
                    </span>
                    <button
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="p-2 text-brand-muted hover:text-red-500 bg-brand-bg rounded-full border border-brand-border/40 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LEFT: Active Promotional Coupons (Sidebar) */}
        <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
          <h3 className="font-display text-2xl font-black text-brand-dark">Promo Bank</h3>
          
          {activeOffers.length === 0 ? (
            <div className="premium-card p-10 text-center border-dashed">
              <Gift className="w-8 h-8 text-brand-muted mx-auto mb-3 opacity-20" />
              <p className="label-xs">No active rewards</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeOffers.map((offer) => (
                <div 
                  key={offer.id} 
                  className="premium-card p-6 space-y-6 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="label-xs">Loyalty Reward</p>
                      <h4 className="font-display font-black text-base text-brand-dark">{offer.name}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-display font-black text-brand-accent tracking-tighter">
                        {offer.discountPercentage}%
                      </p>
                      <p className="label-xs text-[7px]">Off</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-brand-bg rounded-2xl p-4 border border-brand-border/40">
                    <span className="font-mono text-xs font-black text-brand-dark tracking-[0.2em] flex-1">
                      {offer.code}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyCode(offer.id, offer.code)}
                        className="p-2 bg-brand-dark text-white rounded-xl hover:bg-brand-accent transition-colors"
                      >
                        {copiedId === offer.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="p-2 bg-white text-red-500 rounded-xl border border-red-100 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="premium-card p-8 bg-brand-dark space-y-4">
            <h4 className="label-xs text-brand-accent">Redemption</h4>
            <p className="text-[11px] text-white/70 leading-relaxed font-bold uppercase tracking-tight">
              Coupons can be applied during customer intake at the <span className="text-brand-accent">Care Portal</span> to adjust diagnostics pricing instantly.
            </p>
          </div>
        </div>
      </div>

      {/* CREATE OFFER MODAL */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-brand-dark/20 backdrop-blur-xl transition-opacity" onClick={() => setIsOfferModalOpen(false)} />
          <div className="bg-white rounded-[40px] border border-brand-border shadow-2xl p-10 w-full max-w-md relative z-10 animate-in zoom-in-95 duration-300">
            <h3 className="font-display font-black text-2xl text-brand-dark mb-2">Create Promo</h3>
            <p className="label-xs mb-8">Loyalty Program Engine</p>

            <form onSubmit={handleCreateOffer} className="space-y-8">
              {offerError && <p className="label-xs text-red-500 mb-4">{offerError}</p>}
              
              <div className="space-y-2">
                <label className="label-xs ml-1">Campaign Name</label>
                <input
                  type="text"
                  placeholder="Seasonal Reward..."
                  value={offerName}
                  onChange={(e) => setOfferName(e.target.value)}
                  className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-bold focus:ring-0"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-xs ml-1">Code</label>
                  <input
                    type="text"
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                    className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-mono font-bold focus:ring-0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-xs ml-1">Discount %</label>
                  <input
                    type="number"
                    value={offerDiscount}
                    onChange={(e) => setOfferDiscount(Number(e.target.value))}
                    className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-bold focus:ring-0"
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(false)}
                  className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-dark transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-brand-dark text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent transition-all shadow-lg"
                >
                  Save Reward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PACKAGE MODAL */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-brand-dark/20 backdrop-blur-xl transition-opacity" onClick={() => setIsPackageModalOpen(false)} />
          <div className="bg-white rounded-[40px] border border-brand-border shadow-2xl p-10 w-full max-w-lg relative z-10 animate-in zoom-in-95 duration-300">
            <h3 className="font-display font-black text-2xl text-brand-dark mb-2">New Care Package</h3>
            <p className="label-xs mb-8">Service Catalog Definition</p>

            <form onSubmit={handleCreatePackage} className="space-y-8">
              {packageError && <p className="label-xs text-red-500 mb-4">{packageError}</p>}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-xs ml-1">Package Name</label>
                  <input
                    type="text"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-bold focus:ring-0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-xs ml-1">Price (₹)</label>
                  <input
                    type="number"
                    value={packagePrice}
                    onChange={(e) => setPackagePrice(Number(e.target.value))}
                    className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-bold focus:ring-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-xs ml-1">Service Description</label>
                <textarea
                  rows={4}
                  value={packageDesc}
                  onChange={(e) => setPackageDesc(e.target.value)}
                  className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-bold focus:ring-0 resize-none"
                />
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-dark transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-brand-dark text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent transition-all shadow-lg"
                >
                  Define Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
