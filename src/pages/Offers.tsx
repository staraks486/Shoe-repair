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
  Award
} from 'lucide-react';

export default function Offers() {
  const { settings } = useAppStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeOffers = settings.offers || [];
  const carePackages = settings.shoeCarePackages || [];

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
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
          <div className="flex items-center gap-2 border-b border-brand-border pb-3">
            <Tag className="w-5 h-5 text-brand-olive" />
            <h3 className="font-serif text-xl font-bold text-brand-dark">Active Coupon Offers</h3>
          </div>

          {activeOffers.length === 0 ? (
            <div className="text-center py-10 bg-white border border-brand-border rounded-2xl p-6 space-y-2">
              <Gift className="w-8 h-8 text-brand-muted mx-auto opacity-50" />
              <p className="text-xs font-semibold text-brand-dark">No Active Coupons</p>
              <p className="text-[10px] text-brand-muted">Check back later or configure some in Settings.</p>
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
                            Copy Code
                          </>
                        )}
                      </button>
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
            <span className="text-[10px] bg-brand-olive/10 text-brand-olive font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {carePackages.length} curated packages
            </span>
          </div>

          {carePackages.length === 0 ? (
            <div className="text-center py-16 bg-white border border-brand-border rounded-2xl p-6 space-y-3">
              <Compass className="w-10 h-10 text-brand-muted mx-auto opacity-50" />
              <p className="text-xs font-semibold text-brand-dark">No Care Packages Configured</p>
              <p className="text-[10px] text-brand-muted">You can configure bespoke shoe care packages in Settings &gt; Offers & Packages.</p>
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
                    <span className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      Bespoke care <ChevronRight className="w-3 h-3" />
                    </span>
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
    </div>
  );
}
