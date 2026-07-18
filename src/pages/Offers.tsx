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
    <div className="max-w-5xl mx-auto space-y-10 pb-12 p-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-dark text-white p-8 md:p-12 shadow-xl border border-brand-border-dark flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute inset-0 bg-radial-gradient from-brand-olive/30 to-transparent opacity-50 pointer-events-none" />
        <div className="space-y-4 relative z-10 text-center md:text-left max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-olive text-brand-bg text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Special Promotions
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight leading-none text-white">
            Exclusive Restoration Packages & Offers
          </h2>
          <p className="text-sm text-brand-bg/80 leading-relaxed font-sans font-medium">
            Discover tailored restoration care plans and curated seasonal rewards crafted specifically for leather connoisseurs.
          </p>
        </div>
        <div className="relative shrink-0 w-32 h-32 md:w-40 md:h-40 flex items-center justify-center bg-brand-bg/10 rounded-full border border-white/10 backdrop-blur-sm">
          <Gift className="w-16 h-16 text-brand-accent animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Active Promotional Coupons */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-brand-olive" />
              <h3 className="font-serif text-xl font-bold text-brand-dark">Active Coupon Offers</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOfferModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-olive text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-brand-olive/90 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
          </div>

          {activeOffers.length === 0 ? (
            <div className="text-center py-10 bg-white border border-brand-border rounded-2xl p-6 space-y-2">
              <Gift className="w-8 h-8 text-brand-muted mx-auto opacity-50" />
              <p className="text-xs font-semibold text-brand-dark">No Active Coupons</p>
              <p className="text-[10px] text-brand-muted">Click 'Create' above to add custom discount codes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOffers.map((offer) => (
                <div 
                  key={offer.id} 
                  id={`offer-${offer.id}`}
                  className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex relative group"
                >
                  {/* Left Side Ticket Decoration */}
                  <div className="w-4 bg-brand-dark relative flex flex-col justify-between py-2 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-brand-bg absolute -top-1 -right-1" />
                    <div className="w-2 h-2 rounded-full bg-brand-bg absolute -bottom-1 -right-1" />
                    <div className="flex-1 flex flex-col justify-around items-center opacity-40">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-brand-bg" />
                      ))}
                    </div>
                  </div>

                  {/* Coupon Content */}
                  <div className="p-5 flex-1 space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-brand-olive font-bold">Limited Reward</span>
                        <h4 className="font-bold text-sm text-brand-dark mt-0.5">{offer.name}</h4>
                      </div>
                      <div className="bg-brand-bg text-brand-olive font-bold text-lg px-2.5 py-1 rounded-lg border border-brand-border shrink-0">
                        {offer.discountPercentage}% <span className="text-[9px] font-medium block text-center uppercase tracking-tight">OFF</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 bg-brand-bg/50 border border-brand-border p-2 rounded-xl">
                      <div className="font-mono text-xs font-bold text-brand-dark tracking-wider px-2">
                        {offer.code}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(offer.id, offer.code)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-dark text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-brand-muted transition-colors shrink-0"
                        >
                          {copiedId === offer.id ? (
                            <>
                              <Check className="w-3 h-3 text-green-400" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="p-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Info Box */}
          <div className="bg-brand-bg/30 border border-brand-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-brand-olive" />
              <h4 className="text-[11px] font-bold text-brand-dark uppercase tracking-wider">How to redeem</h4>
            </div>
            <p className="text-[11px] text-brand-muted leading-relaxed">
              When lodging a new footwear diagnostics request, click the <strong>Apply Offer</strong> option in the intake form, choose or type your code, and watch your total instantly update.
            </p>
          </div>
        </div>

        {/* Shoe Care Packages List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-olive" />
              <h3 className="font-serif text-xl font-bold text-brand-dark">Premium Shoe Care Packages</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] bg-brand-olive/10 text-brand-olive font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {carePackages.length} packages
              </span>
              <button
                type="button"
                onClick={() => setIsPackageModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-olive text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-brand-olive/90 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Create
              </button>
            </div>
          </div>

          {carePackages.length === 0 ? (
            <div className="text-center py-16 bg-white border border-brand-border rounded-2xl p-6 space-y-3">
              <Compass className="w-10 h-10 text-brand-muted mx-auto opacity-50" />
              <p className="text-xs font-semibold text-brand-dark">No Care Packages Configured</p>
              <p className="text-[10px] text-brand-muted">Click 'Create' above to design custom bespoke care plans.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {carePackages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  id={`pkg-${pkg.id}`}
                  className="bg-white border border-brand-border rounded-2xl p-6 space-y-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-serif font-extrabold text-base text-brand-dark leading-tight group-hover:text-brand-olive transition-colors">
                        {pkg.name}
                      </h4>
                      <span className="text-[11px] font-bold text-brand-olive bg-brand-bg px-2.5 py-1 rounded-lg border border-brand-border shrink-0">
                        ₹{pkg.price}
                      </span>
                    </div>
                    <p className="text-xs text-brand-muted leading-relaxed min-h-[3rem]">
                      {pkg.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-brand-bg/60 flex items-center justify-between text-[11px] font-bold text-brand-dark uppercase tracking-wider">
                    <span className="flex items-center gap-1 text-brand-olive">
                      <Flame className="w-3.5 h-3.5 text-brand-olive shrink-0" />
                      Popular choice
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeletePackage(pkg.id)}
                        className="text-[10px] text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg border border-red-100 transition-colors flex items-center justify-center cursor-pointer"
                        title="Delete Package"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                        Bespoke care <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Luxury Standard Notice */}
          <div className="border border-brand-border rounded-2xl p-6 bg-white flex items-start gap-4 shadow-sm">
            <TrendingUp className="w-8 h-8 text-brand-olive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">The Cordwainers Craft Standard</h4>
              <p className="text-xs text-brand-muted leading-relaxed">
                All packages employ organic essential conditioners, fine beeswax sealants, and premium imports from world-leading leather care labels. Your fine footwear deserves nothing short of museum-grade care.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* CREATE OFFER MODAL */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <div 
            className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsOfferModalOpen(false)}
          />
          
          {/* Modal Container */}
          <div className="bg-white rounded-3xl border border-brand-border shadow-2xl p-6 w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200">
            <button 
              type="button"
              onClick={() => setIsOfferModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-brand-muted hover:text-brand-dark bg-brand-bg rounded-xl hover:bg-brand-border/30 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-full bg-brand-olive/10 flex items-center justify-center">
                <Tag className="w-4 h-4 text-brand-olive" />
              </div>
              <div>
                <h3 className="font-serif font-extrabold text-lg text-brand-dark">Create Promo Coupon</h3>
                <p className="text-[10px] text-brand-muted uppercase tracking-wider">Add standard discounts</p>
              </div>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4">
              {offerError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium">
                  {offerError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Offer Title / Name</label>
                <input
                  type="text"
                  placeholder="e.g., Seasonal Festive Reward"
                  value={offerName}
                  onChange={(e) => setOfferName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl bg-brand-bg/35 text-brand-dark focus:ring-2 focus:ring-brand-olive/15 focus:border-brand-olive outline-none text-xs font-medium placeholder-gray-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Promo Code</label>
                  <input
                    type="text"
                    placeholder="e.g., FESTIVE15"
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl bg-brand-bg/35 text-brand-dark focus:ring-2 focus:ring-brand-olive/15 focus:border-brand-olive outline-none text-xs font-mono font-bold placeholder-gray-400 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Discount (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={offerDiscount}
                    onChange={(e) => setOfferDiscount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl bg-brand-bg/35 text-brand-dark focus:ring-2 focus:ring-brand-olive/15 focus:border-brand-olive outline-none text-xs font-bold transition-all"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-brand-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(false)}
                  className="px-4 py-2.5 bg-white text-brand-dark border border-brand-border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-bg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-brand-olive text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-olive/90 transition-all shadow-sm cursor-pointer"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PACKAGE MODAL */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <div 
            className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsPackageModalOpen(false)}
          />
          
          {/* Modal Container */}
          <div className="bg-white rounded-3xl border border-brand-border shadow-2xl p-6 w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200">
            <button 
              type="button"
              onClick={() => setIsPackageModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-brand-muted hover:text-brand-dark bg-brand-bg rounded-xl hover:bg-brand-border/30 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-full bg-brand-olive/10 flex items-center justify-center">
                <Award className="w-4 h-4 text-brand-olive" />
              </div>
              <div>
                <h3 className="font-serif font-extrabold text-lg text-brand-dark">Create Care Package</h3>
                <p className="text-[10px] text-brand-muted uppercase tracking-wider">Define custom premium treatment bundles</p>
              </div>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-4">
              {packageError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium">
                  {packageError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Package Name</label>
                <input
                  type="text"
                  placeholder="e.g., Ultimate Leather Rejuvenation"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl bg-brand-bg/35 text-brand-dark focus:ring-2 focus:ring-brand-olive/15 focus:border-brand-olive outline-none text-xs font-medium placeholder-gray-400 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Package Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={packagePrice}
                  onChange={(e) => setPackagePrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl bg-brand-bg/35 text-brand-dark focus:ring-2 focus:ring-brand-olive/15 focus:border-brand-olive outline-none text-xs font-bold transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the treatments included in this package..."
                  value={packageDesc}
                  onChange={(e) => setPackageDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl bg-brand-bg/35 text-brand-dark focus:ring-2 focus:ring-brand-olive/15 focus:border-brand-olive outline-none text-xs font-medium placeholder-gray-400 transition-all resize-none"
                />
              </div>

              <div className="pt-3 border-t border-brand-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2.5 bg-white text-brand-dark border border-brand-border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-bg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-brand-olive text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-olive/90 transition-all shadow-sm cursor-pointer"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
