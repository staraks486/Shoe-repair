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
  X,
  CreditCard,
  Search,
  Image as ImageIcon
} from 'lucide-react';

export default function Offers() {
  const { settings, updateSettings } = useAppStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'giftcards'>('catalog');

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

  // New Gift Card Form State
  const [gcRecipient, setGcRecipient] = useState('');
  const [gcAmount, setGcAmount] = useState<number>(2500);
  const [gcCode, setGcCode] = useState(() => 'GC-' + Math.floor(100000 + Math.random() * 900000));
  const [gcTheme, setGcTheme] = useState<'gold' | 'classic' | 'modern' | 'artisan'>('gold');
  const [gcMessage, setGcMessage] = useState('');
  const [gcCustomPrompt, setGcCustomPrompt] = useState('luxurious gold embossed leather textures, vintage cordwainer logo');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [gcError, setGcError] = useState('');
  const [gcSuccessMessage, setGcSuccessMessage] = useState('');

  // Balance Checker State
  const [checkCode, setCheckCode] = useState('');
  const [checkedCard, setCheckedCard] = useState<any>(null);
  const [checkError, setCheckError] = useState('');
  const [deductAmount, setDeductAmount] = useState<number>(0);
  const [deductSuccess, setDeductSuccess] = useState('');

  const activeOffers = settings.offers || [];
  const carePackages = settings.shoeCarePackages || [];
  const giftCards = settings.giftCards || [];

  const handleGenerateImage = async () => {
    if (!gcCustomPrompt.trim()) {
      setGcError('Please provide a prompt description for the background image.');
      return;
    }
    setIsGeneratingImage(true);
    setGcError('');
    try {
      const response = await fetch('/api/giftcards/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: gcCustomPrompt }),
      });
      const data = await response.json();
      if (data.success && data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        setGcSuccessMessage(data.message || 'Custom AI image generated successfully!');
        setTimeout(() => setGcSuccessMessage(''), 4000);
      } else {
        setGcError('Failed to generate image. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setGcError('Network or server error during image generation.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCreateGiftCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gcRecipient.trim()) {
      setGcError('Recipient name is required');
      return;
    }
    if (gcAmount < 100) {
      setGcError('Gift card minimum amount is ₹100');
      return;
    }
    if (!gcCode.trim()) {
      setGcError('Gift card code is required');
      return;
    }

    // Check if code already exists
    if (giftCards.some((c: any) => c.code.toUpperCase() === gcCode.trim().toUpperCase())) {
      setGcError('A gift card with this code already exists.');
      return;
    }

    const newCard = {
      id: Math.random().toString(36).substring(2, 9),
      code: gcCode.trim().toUpperCase(),
      recipientName: gcRecipient.trim(),
      amount: gcAmount,
      balance: gcAmount,
      message: gcMessage.trim(),
      designTheme: gcTheme,
      imageUrl: generatedImageUrl || undefined,
      createdAt: new Date().toISOString()
    };

    updateSettings({
      giftCards: [...giftCards, newCard]
    });

    // Reset fields
    setGcRecipient('');
    setGcAmount(2500);
    setGcCode('GC-' + Math.floor(100000 + Math.random() * 900000));
    setGcTheme('gold');
    setGcMessage('');
    setGeneratedImageUrl('');
    setGcError('');
    setGcSuccessMessage('Gift Card created and issued successfully!');
    setTimeout(() => setGcSuccessMessage(''), 5000);
  };

  const handleDeleteGiftCard = (id: string) => {
    updateSettings({
      giftCards: giftCards.filter((c: any) => c.id !== id)
    });
    // If the card was checked, clear check state
    if (checkedCard && checkedCard.id === id) {
      setCheckedCard(null);
    }
  };

  const handleCheckBalance = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckError('');
    setDeductSuccess('');
    const card = giftCards.find((c: any) => c.code.toUpperCase() === checkCode.trim().toUpperCase());
    if (card) {
      setCheckedCard(card);
      setDeductAmount(0);
    } else {
      setCheckedCard(null);
      setCheckError('No active gift card found with this code.');
    }
  };

  const handleDeductBalance = () => {
    if (!checkedCard) return;
    if (deductAmount <= 0) {
      setCheckError('Redemption amount must be greater than 0.');
      return;
    }
    if (deductAmount > checkedCard.balance) {
      setCheckError(`Insufficient balance. Card has ₹${checkedCard.balance.toLocaleString()}.`);
      return;
    }

    const updatedCards = giftCards.map((c: any) => {
      if (c.id === checkedCard.id) {
        const newBalance = c.balance - deductAmount;
        const updated = { ...c, balance: newBalance };
        setCheckedCard(updated); // Update visual checked card
        return updated;
      }
      return c;
    });

    updateSettings({
      giftCards: updatedCards
    });

    setDeductSuccess(`Successfully redeemed ₹${deductAmount.toLocaleString()}!`);
    setDeductAmount(0);
    setCheckError('');
    setTimeout(() => setDeductSuccess(''), 4000);
  };

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
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-300">
      <header className="flex flex-col items-center justify-center text-center gap-6">
        <div className="space-y-1 text-center flex flex-col items-center justify-center">
          <h2 className="font-display text-4xl font-black text-brand-dark tracking-tighter uppercase leading-none text-center">Catalog</h2>
          <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] mt-3 text-center">Offers & Care Packages</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="bg-white border border-brand-border/40 p-1.5 rounded-full shadow-premium flex gap-1 mx-auto">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'catalog'
                ? 'bg-brand-dark text-white shadow-md'
                : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            Promos & Packages
          </button>
          <button
            onClick={() => setActiveTab('giftcards')}
            className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'giftcards'
                ? 'bg-brand-dark text-white shadow-md'
                : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            Gift Cards Studio
          </button>
        </div>

        {activeTab === 'catalog' && (
          <div className="flex gap-4 justify-center flex-wrap">
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
        )}
      </header>

      {activeTab === 'catalog' ? (
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
      ) : (
        /* GIFT CARDS STUDIO VIEW */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          
          {/* Left Column: Create Gift Card Form & Live Preview */}
          <div className="xl:col-span-7 space-y-8">
            <div className="premium-card p-8 space-y-8">
              <div className="flex items-center justify-between border-b border-brand-border/40 pb-4">
                <div>
                  <h3 className="font-display text-2xl font-black text-brand-dark">Create Gift Card</h3>
                  <p className="label-xs text-brand-muted mt-1">Design & issue professional store vouchers</p>
                </div>
                <CreditCard className="w-6 h-6 text-brand-accent" />
              </div>

              {gcError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <p className="text-xs font-bold text-red-600">{gcError}</p>
                </div>
              )}
              {gcSuccessMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <p className="text-xs font-bold text-emerald-700">{gcSuccessMessage}</p>
                </div>
              )}

              <form onSubmit={handleCreateGiftCard} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-xs ml-1">Recipient Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={gcRecipient}
                      onChange={(e) => setGcRecipient(e.target.value)}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-bold focus:ring-1 focus:ring-brand-accent/40"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="label-xs ml-1">Gift Amount (₹)</label>
                    <input
                      type="number"
                      required
                      min="100"
                      value={gcAmount}
                      onChange={(e) => setGcAmount(Number(e.target.value))}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-bold focus:ring-1 focus:ring-brand-accent/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-xs ml-1">Voucher Code (Auto generated)</label>
                    <input
                      type="text"
                      required
                      value={gcCode}
                      onChange={(e) => setGcCode(e.target.value.toUpperCase())}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-mono font-black tracking-widest focus:ring-1 focus:ring-brand-accent/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="label-xs ml-1">Design Style Palette</label>
                    <select
                      value={gcTheme}
                      onChange={(e) => setGcTheme(e.target.value as any)}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-bold focus:ring-1 focus:ring-brand-accent/40"
                    >
                      <option value="gold">Aurum Leather (Gold)</option>
                      <option value="classic">Carbon Noir (Classic)</option>
                      <option value="modern">Royal Cobalt (Modern)</option>
                      <option value="artisan">Forest Cedar (Artisan)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="label-xs ml-1">Custom Greeting Message</label>
                  <input
                    type="text"
                    placeholder="Wishing you premium steps..."
                    value={gcMessage}
                    onChange={(e) => setGcMessage(e.target.value)}
                    className="w-full px-6 py-4 bg-brand-bg border-none rounded-[20px] text-xs font-bold focus:ring-1 focus:ring-brand-accent/40"
                  />
                </div>

                {/* AI BACKGROUND IMAGE GENERATION */}
                <div className="bg-brand-bg rounded-3xl p-6 border border-brand-border/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="label-xs text-brand-accent flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
                      Gemini-Powered Card Art Generator
                    </label>
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider">
                      Imagen Engine
                    </span>
                  </div>

                  <p className="text-[10px] text-brand-muted leading-relaxed font-medium">
                    Type a creative prompt to generate bespoke leather designs, golden foils, or cordwainer graphics directly via Gemini Image AI.
                  </p>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Prompt description..."
                      value={gcCustomPrompt}
                      onChange={(e) => setGcCustomPrompt(e.target.value)}
                      className="flex-1 px-5 py-3 bg-white border border-brand-border/50 rounded-[15px] text-xs font-bold focus:ring-1 focus:ring-brand-accent/40"
                    />
                    <button
                      type="button"
                      disabled={isGeneratingImage}
                      onClick={handleGenerateImage}
                      className="px-6 bg-brand-dark hover:bg-brand-accent text-white rounded-[15px] text-[10px] font-black uppercase tracking-widest transition-all shadow active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isGeneratingImage ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3.5 h-3.5" />
                          Create Art
                        </>
                      )}
                    </button>
                  </div>

                  {generatedImageUrl && (
                    <div className="pt-2 flex items-center gap-4">
                      <div className="w-16 h-10 rounded-lg overflow-hidden border border-brand-border/60 bg-white">
                        <img 
                          src={generatedImageUrl} 
                          alt="AI generated background" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-brand-accent uppercase tracking-wider">Bespoke Design Applied</p>
                        <button 
                          type="button"
                          onClick={() => setGeneratedImageUrl('')}
                          className="text-[9px] font-bold text-red-500 uppercase tracking-widest hover:underline mt-0.5"
                        >
                          Remove custom background
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-4 bg-brand-dark text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-accent transition-all shadow-lg active:scale-95"
                  >
                    Create & Issue Gift Card
                  </button>
                </div>
              </form>
            </div>

            {/* Live Card Preview */}
            <div className="space-y-4">
              <h4 className="label-xs ml-1">Live Card Design Preview</h4>
              <div 
                className={`relative h-64 rounded-[32px] p-8 shadow-2xl flex flex-col justify-between overflow-hidden border border-white/20 transition-all duration-500`}
                style={{
                  backgroundImage: generatedImageUrl ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${generatedImageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Fallback gradients if no image is generated */}
                {!generatedImageUrl && (
                  <div className={`absolute inset-0 z-0 transition-all duration-500 ${
                    gcTheme === 'gold' ? 'bg-gradient-to-br from-amber-900 via-amber-700 to-amber-950' :
                    gcTheme === 'classic' ? 'bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950' :
                    gcTheme === 'modern' ? 'bg-gradient-to-br from-[#8C6239] via-[#A67C52] to-[#5C3A21]' :
                    'bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950'
                  }`} />
                )}

                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black text-white/60 tracking-[0.3em] uppercase">Cordwainers Studio</span>
                    <h4 className="text-white text-xl font-display font-black tracking-tight mt-1">Artisan Gold Voucher</h4>
                  </div>
                  <Sparkles className="w-5 h-5 text-white/50 animate-pulse" />
                </div>

                <div className="relative z-10 space-y-1">
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Voucher Code</p>
                  <p className="text-white text-lg font-mono font-black tracking-[0.2em]">{gcCode || 'GC-XXXXXX'}</p>
                </div>

                <div className="relative z-10 flex justify-between items-end border-t border-white/10 pt-4">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Prepared for</p>
                    <p className="text-white text-xs font-black uppercase tracking-wider">{gcRecipient || 'Valued Patron'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Voucher Balance</p>
                    <p className="text-white text-2xl font-display font-black tracking-tight">₹{(gcAmount || 0).toLocaleString()}</p>
                  </div>
                </div>

                {gcMessage && (
                  <div className="absolute bottom-16 right-8 left-8 bg-black/30 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                    <p className="text-[9px] text-white/95 italic font-medium truncate">"{gcMessage}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Balance Checker & Issued Cards Grid */}
          <div className="xl:col-span-5 space-y-8">
            {/* Balance Checker & Redeemer Card */}
            <div className="premium-card p-8 bg-brand-dark text-white space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-accent/20 rounded-2xl">
                  <Coins className="w-5 h-5 text-brand-accent" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-black text-white uppercase tracking-wider">Redeem & Check</h3>
                  <p className="text-[9px] font-bold text-brand-muted/70 uppercase tracking-wider">Validate & deduct client voucher balance</p>
                </div>
              </div>

              <form onSubmit={handleCheckBalance} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Enter Voucher Code..."
                  value={checkCode}
                  onChange={(e) => setCheckCode(e.target.value.toUpperCase())}
                  className="flex-1 px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-mono font-bold tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-brand-accent"
                />
                <button
                  type="submit"
                  className="px-6 bg-brand-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-white hover:text-brand-dark transition-colors"
                >
                  Lookup
                </button>
              </form>

              {checkError && (
                <p className="text-[10px] font-bold text-red-400">{checkError}</p>
              )}

              {/* Verified Card Details */}
              {checkedCard && (
                <div className="bg-white/5 rounded-3xl p-5 border border-white/10 space-y-4 animate-in fade-in duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[8px] font-bold text-brand-muted uppercase tracking-widest">Patron Name</p>
                      <h4 className="text-white text-sm font-black uppercase tracking-wider mt-0.5">{checkedCard.recipientName}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-bold text-brand-muted uppercase tracking-widest">Remaining Balance</p>
                      <p className="text-brand-accent text-xl font-display font-black tracking-tight mt-0.5">₹{checkedCard.balance.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-3">
                    <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Voucher Deduction</p>
                    
                    {deductSuccess && (
                      <p className="text-[10px] font-bold text-emerald-400">{deductSuccess}</p>
                    )}

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/50">₹</span>
                        <input
                          type="number"
                          placeholder="Amount..."
                          value={deductAmount || ''}
                          onChange={(e) => setDeductAmount(Number(e.target.value))}
                          className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleDeductBalance}
                        className="px-5 bg-white text-brand-dark rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-brand-accent hover:text-white transition-colors"
                      >
                        Redeem
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Issued Cards Inventory */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-black text-brand-dark">Active Vouchers</h3>
                <span className="label-xs bg-brand-bg px-4 py-1.5 rounded-full border border-brand-border">
                  {giftCards.length} Issued
                </span>
              </div>

              {giftCards.length === 0 ? (
                <div className="text-center py-16 premium-card border-dashed">
                  <CreditCard className="w-10 h-10 text-brand-muted mx-auto mb-3 opacity-20" />
                  <p className="label-xs">No active vouchers in record</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {giftCards.map((card: any) => (
                    <div 
                      key={card.id}
                      className="premium-card p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-all duration-300"
                      style={{
                        backgroundImage: card.imageUrl ? `linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0.85)), url(${card.imageUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="flex justify-between items-start relative z-10 gap-4">
                        <div className="space-y-1">
                          <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            card.designTheme === 'gold' ? 'bg-amber-100 text-amber-800' :
                            card.designTheme === 'classic' ? 'bg-stone-200 text-stone-800' :
                            card.designTheme === 'modern' ? 'bg-[#F4EBE1] text-[#8C6239]' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {card.designTheme} Voucher
                          </span>
                          <h4 className="font-display font-black text-sm text-brand-dark uppercase tracking-wider mt-2">
                            {card.recipientName}
                          </h4>
                          <p className="font-mono text-[10px] font-black text-brand-muted tracking-widest mt-1">
                            {card.code}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-display font-black text-brand-accent tracking-tighter">
                            ₹{card.balance.toLocaleString()}
                          </p>
                          <p className="text-[7px] font-black text-brand-muted uppercase tracking-widest mt-0.5">
                            Original: ₹{card.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-brand-border/40 flex items-center justify-between relative z-10">
                        <span className="text-[8px] font-bold text-brand-muted uppercase tracking-widest">
                          Issued {new Date(card.createdAt).toLocaleDateString()}
                        </span>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(card.code);
                              setCopiedId(card.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="p-1.5 bg-brand-bg rounded-lg border border-brand-border/40 hover:bg-brand-dark hover:text-white transition-all"
                            title="Copy Code"
                          >
                            {copiedId === card.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => {
                              setCheckCode(card.code);
                              setCheckedCard(card);
                              setDeductAmount(0);
                            }}
                            className="p-1.5 bg-brand-bg rounded-lg border border-brand-border/40 hover:bg-brand-dark hover:text-white transition-all"
                            title="Validate Card"
                          >
                            <Search className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteGiftCard(card.id)}
                            className="p-1.5 bg-white text-red-500 rounded-lg border border-red-100 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                            title="Revoke Gift Card"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

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
