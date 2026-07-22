import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Globe, 
  QrCode, 
  CreditCard, 
  ArrowLeft, 
  Check, 
  Link, 
  Upload, 
  Trash2, 
  Phone,
  Coins,
  Star,
  MapPin,
  Clock,
  Store,
  Building2
} from 'lucide-react';
import clsx from 'clsx';

export default function SocialsPayments() {
  const navigate = useNavigate();
  const { 
    settings, 
    updateSettings, 
    stores = [], 
    currentStoreId, 
    setCurrentStoreId, 
    setDefaultStore, 
    updateStore 
  } = useAppStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Success state for saves
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Identify default store or current store
  const defaultStoreObj = stores.find(s => s.isDefault) || stores.find(s => s.id === currentStoreId) || stores[0];
  const [selectedStoreId, setSelectedStoreId] = useState<string>(defaultStoreObj?.id || '');

  useEffect(() => {
    if (!selectedStoreId && defaultStoreObj?.id) {
      setSelectedStoreId(defaultStoreObj.id);
    }
  }, [defaultStoreObj?.id, selectedStoreId]);

  const activeStore = stores.find(s => s.id === selectedStoreId) || defaultStoreObj;

  // Form states initialized from activeStore or settings fallback
  const [storeName, setStoreName] = useState(activeStore?.storeName || settings.storeName || 'Cordwainers Studio');
  const [address, setAddress] = useState(activeStore?.address || settings.address || '');
  const [phone, setPhone] = useState(activeStore?.phone || (settings as any).phone || '');
  const [hours, setHours] = useState(activeStore?.hours || settings.hours || '');

  const [instagram, setInstagram] = useState(activeStore?.instagramLink || settings.instagramLink || '');
  const [facebook, setFacebook] = useState(activeStore?.facebookLink || settings.facebookLink || '');
  const [twitter, setTwitter] = useState(activeStore?.twitterLink || settings.twitterLink || '');
  const [linkedin, setLinkedin] = useState(activeStore?.linkedinLink || (settings as any).linkedinLink || '');
  const [website, setWebsite] = useState(activeStore?.websiteLink || settings.websiteLink || '');
  const [whatsapp, setWhatsapp] = useState(activeStore?.whatsappLink || '');

  const [paymentLink, setPaymentLink] = useState(activeStore?.paymentLink || settings.paymentLink || '');
  const [qrCode, setQrCode] = useState(activeStore?.qrCode || settings.qrCode || '');
  const [isDefault, setIsDefault] = useState(activeStore?.isDefault === true);

  // Re-sync selected store ID if default store or stores list changes
  useEffect(() => {
    if (!selectedStoreId || !stores.some(s => s.id === selectedStoreId)) {
      if (defaultStoreObj?.id) {
        setSelectedStoreId(defaultStoreObj.id);
      }
    }
  }, [defaultStoreObj?.id, currentStoreId, stores, selectedStoreId]);

  // Update form fields when active store selection or store details in settings/stores change
  useEffect(() => {
    if (activeStore) {
      setStoreName(activeStore.storeName || settings.storeName || 'Cordwainers Studio');
      setAddress(activeStore.address || settings.address || '');
      setPhone(activeStore.phone || (settings as any).phone || '');
      setHours(activeStore.hours || settings.hours || '');

      setInstagram(activeStore.instagramLink || settings.instagramLink || '');
      setFacebook(activeStore.facebookLink || settings.facebookLink || '');
      setTwitter(activeStore.twitterLink || settings.twitterLink || '');
      setLinkedin(activeStore.linkedinLink || (settings as any).linkedinLink || '');
      setWebsite(activeStore.websiteLink || settings.websiteLink || '');
      setWhatsapp(activeStore.whatsappLink || '');

      setPaymentLink(activeStore.paymentLink || settings.paymentLink || '');
      setQrCode(activeStore.qrCode || settings.qrCode || '');
      setIsDefault(activeStore.isDefault === true);
    }
  }, [
    activeStore?.id,
    activeStore?.storeName,
    activeStore?.address,
    activeStore?.phone,
    activeStore?.hours,
    activeStore?.instagramLink,
    activeStore?.facebookLink,
    activeStore?.twitterLink,
    activeStore?.linkedinLink,
    activeStore?.websiteLink,
    activeStore?.whatsappLink,
    activeStore?.paymentLink,
    activeStore?.qrCode,
    activeStore?.isDefault,
    settings.storeName,
    settings.address,
    settings.hours,
    settings.paymentLink,
    settings.qrCode,
    settings.instagramLink,
    settings.facebookLink,
    settings.twitterLink,
    settings.websiteLink
  ]);

  const showSaveNotification = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => {
      setSaveStatus(null);
    }, 3000);
  };

  const handleSave = async () => {
    if (activeStore) {
      await updateStore(activeStore.id, {
        storeName: storeName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        hours: hours.trim(),
        instagramLink: instagram.trim(),
        facebookLink: facebook.trim(),
        twitterLink: twitter.trim(),
        linkedinLink: linkedin.trim(),
        websiteLink: website.trim(),
        whatsappLink: whatsapp.trim(),
        paymentLink: paymentLink.trim(),
        qrCode: qrCode,
        isDefault: isDefault
      });

      if (isDefault && !activeStore.isDefault) {
        await setDefaultStore(activeStore.id);
      }
    }

    updateSettings({
      storeName: storeName.trim(),
      address: address.trim(),
      instagramLink: instagram.trim(),
      facebookLink: facebook.trim(),
      twitterLink: twitter.trim(),
      linkedinLink: linkedin.trim(),
      websiteLink: website.trim(),
      paymentLink: paymentLink.trim(),
      qrCode: qrCode
    });

    showSaveNotification('Store details and social links saved successfully!');
  };

  const handleSetDefault = async (storeId: string) => {
    await setDefaultStore(storeId);
    setSelectedStoreId(storeId);
    setIsDefault(true);
    showSaveNotification('Set as default store location!');
  };

  // Process QR code image upload & turn into base64
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setQrCode(base64String);
        if (activeStore) {
          updateStore(activeStore.id, { qrCode: base64String });
        }
        updateSettings({ qrCode: base64String });
        showSaveNotification('QR Code uploaded and saved!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearQr = () => {
    setQrCode('');
    if (activeStore) {
      updateStore(activeStore.id, { qrCode: '' });
    }
    updateSettings({ qrCode: '' });
    showSaveNotification('QR Code removed.');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-300 pb-12">
      {/* HEADER: Standardized Artisan style */}
      <header className="flex flex-col items-center justify-center text-center gap-6 relative">
        <button 
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-brand-bg rounded-xl text-brand-dark transition-all border border-transparent hover:border-brand-border/40"
          title="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="space-y-1 text-center flex flex-col items-center justify-center">
          <h2 className="font-display text-4xl font-black text-brand-dark tracking-tight leading-none text-center">Artisan Link</h2>
          <p className="text-[10px] text-brand-accent font-black tracking-[0.3em] uppercase mt-3 text-center">Store Socials & Payments</p>
        </div>
      </header>

      {/* Floating Alert Feedback */}
      {saveStatus && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-brand-dark text-white text-[10px] font-bold uppercase tracking-widest py-3 px-6 rounded-full shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-brand-accent shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* DEFAULT STORE BANNER & SELECTOR */}
      <div className="bg-white border border-brand-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-brand-border/60">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  {activeStore?.isDefault ? 'Default Store Location' : 'Selected Store Workspace'}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-brand-dark mt-1">{activeStore?.storeName || 'Cordwainers Studio'}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {stores.length > 1 && (
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="bg-[#F5F3EC] border border-brand-border rounded-xl px-3 py-2 text-xs font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-accent/20 cursor-pointer"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.storeName} {s.isDefault ? '★ (Default)' : ''}
                  </option>
                ))}
              </select>
            )}

            {activeStore && !activeStore.isDefault && (
              <button
                type="button"
                onClick={() => handleSetDefault(activeStore.id)}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                Make Default Store
              </button>
            )}
          </div>
        </div>

        {/* Active Store Key Details Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
          <div className="flex items-start gap-2 text-brand-dark/80">
            <MapPin className="w-4 h-4 text-brand-olive shrink-0 mt-0.5" />
            <div>
              <span className="text-[9px] font-black uppercase text-brand-muted tracking-wider block">Address</span>
              <p className="font-medium text-brand-dark">{activeStore?.address || 'Address not specified'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-brand-dark/80">
            <Phone className="w-4 h-4 text-brand-olive shrink-0 mt-0.5" />
            <div>
              <span className="text-[9px] font-black uppercase text-brand-muted tracking-wider block">Contact Line</span>
              <p className="font-medium text-brand-dark">{activeStore?.phone || 'No phone set'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-brand-dark/80">
            <Clock className="w-4 h-4 text-brand-olive shrink-0 mt-0.5" />
            <div>
              <span className="text-[9px] font-black uppercase text-brand-muted tracking-wider block">Operating Hours</span>
              <p className="font-medium text-brand-dark">{activeStore?.hours || 'Hours not specified'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Digital Touchpoint Card Live Preview */}
      <div className="bg-gradient-to-br from-brand-dark to-[#1F2421] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-[-30%] right-[-10%] w-48 h-48 rounded-full bg-brand-accent/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 rounded-full bg-brand-olive/10 blur-2xl pointer-events-none" />
        
        {/* Header inside preview */}
        <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] bg-brand-accent/20 text-brand-accent border border-brand-accent/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest leading-none">
                Digital Touchpoint
              </span>
              {activeStore?.isDefault && (
                <span className="text-[8px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest leading-none flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" /> Default Store
                </span>
              )}
            </div>
            <h3 className="font-display text-base font-bold mt-1.5 text-white/95">{storeName || 'Cordwainers Studio'}</h3>
            <p className="text-[9px] text-white/70 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-brand-accent shrink-0" /> {address || 'Bespoke Footwear Restoration'}
            </p>
            {phone && (
              <p className="text-[8px] text-white/60 mt-0.5 flex items-center gap-1">
                <Phone className="w-2.5 h-2.5 text-brand-accent shrink-0" /> {phone}
              </p>
            )}
          </div>
          <Coins className="w-6 h-6 text-brand-accent shrink-0" />
        </div>

        {/* Dynamic Payment QR & Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
          <div className="sm:col-span-3 space-y-3">
            <p className="text-[9px] text-white/70 leading-relaxed">
              Scan the QR code or click below to settle balances, review custom estimates, or join our artisan circle.
            </p>
            
            <div className="flex flex-col gap-1.5">
              {paymentLink ? (
                <a 
                  href={paymentLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-brand-accent text-brand-dark font-extrabold text-[9px] uppercase tracking-wider rounded-lg hover:opacity-90 transition-all text-center shadow-sm"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Pay Invoice Online
                </a>
              ) : (
                <div className="py-2 px-3 bg-white/5 border border-white/10 text-white/40 font-bold text-[9px] uppercase tracking-wider rounded-lg text-center select-none italic">
                  No Payment Link Set
                </div>
              )}
            </div>
          </div>

          <div className="sm:col-span-2 flex flex-col items-center">
            <div className="w-24 h-24 bg-white p-2 rounded-xl flex items-center justify-center shadow-md relative group border border-white/10">
              {qrCode ? (
                <img 
                  src={qrCode} 
                  alt="Payment QR Code" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-brand-dark/40 text-center gap-1">
                  <QrCode className="w-7 h-7 text-brand-dark/30" />
                  <span className="text-[7px] font-bold uppercase tracking-wider">No QR</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Social Badges */}
        <div className="mt-5 pt-3.5 border-t border-white/10 flex flex-wrap gap-2 items-center justify-start">
          <span className="text-[8px] text-white/50 uppercase tracking-widest font-extrabold mr-1">Social Handles:</span>
          
          {instagram && (
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-md text-[9px] font-semibold text-white transition-all">
              <Instagram className="w-3 h-3 text-[#E1306C]" /> Instagram
            </a>
          )}
          {facebook && (
            <a href={facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-md text-[9px] font-semibold text-white transition-all">
              <Facebook className="w-3 h-3 text-[#1877F2]" /> Facebook
            </a>
          )}
          {twitter && (
            <a href={twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-md text-[9px] font-semibold text-white transition-all">
              <Twitter className="w-3 h-3 text-[#1DA1F2]" /> X / Twitter
            </a>
          )}
          {linkedin && (
            <a href={linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-md text-[9px] font-semibold text-white transition-all">
              <Linkedin className="w-3 h-3 text-[#0A66C2]" /> LinkedIn
            </a>
          )}
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-md text-[9px] font-semibold text-white transition-all">
              <Globe className="w-3 h-3 text-brand-accent" /> Website
            </a>
          )}
          {whatsapp && (
            <a href={whatsapp.startsWith('http') ? whatsapp : `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-md text-[9px] font-semibold text-white transition-all">
              <Phone className="w-3 h-3 text-green-400" /> WhatsApp
            </a>
          )}

          {!instagram && !facebook && !twitter && !linkedin && !website && !whatsapp && (
            <span className="text-[9px] text-white/40 italic">Add social handles below to populate badges</span>
          )}
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white border border-brand-border rounded-3xl shadow-xs overflow-hidden p-6 space-y-6">
        
        {/* Store Primary Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border/60 pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-olive" /> Store Information ({activeStore?.storeName})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1">Store Name</label>
              <input 
                type="text" 
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                placeholder="e.g. Cordwainers Main Studio"
                className="w-full border border-brand-border rounded-xl p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark font-medium"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1">Phone Line</label>
              <input 
                type="text" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full border border-brand-border rounded-xl p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1">Physical Address</label>
              <input 
                type="text" 
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 123 High Street, London"
                className="w-full border border-brand-border rounded-xl p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1">Operating Hours</label>
              <input 
                type="text" 
                value={hours}
                onChange={e => setHours(e.target.value)}
                placeholder="e.g. Mon - Sat: 9:00 AM - 7:00 PM"
                className="w-full border border-brand-border rounded-xl p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
              />
            </div>

            {/* Set as Default Store Checkbox Toggle */}
            <div className="sm:col-span-2 bg-[#F5F3EC]/60 p-4 rounded-2xl border border-brand-border flex items-center justify-between cursor-pointer hover:bg-[#F5F3EC] transition-all" onClick={() => setIsDefault(!isDefault)}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isDefault ? 'bg-amber-100 text-amber-700' : 'bg-brand-bg text-brand-muted'}`}>
                  <Star className={`w-4 h-4 ${isDefault ? 'fill-amber-500 text-amber-500' : ''}`} />
                </div>
                <div>
                  <span className="text-xs font-black text-brand-dark uppercase tracking-wider block">Set as Default Store Location</span>
                  <p className="text-[10px] text-brand-muted font-medium">Auto-selects this store workspace when launching the application</p>
                </div>
              </div>
              <input 
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-5 h-5 accent-brand-dark rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Payments configuration */}
        <div className="space-y-4 pt-2 border-t border-brand-bg">
          <h3 className="text-xs font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border/60 pb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-olive" /> Payment Channels
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1">Online Payment URL</label>
              <div className="relative">
                <input 
                  type="url" 
                  placeholder="e.g. https://rzp.io/l/cordwainers"
                  value={paymentLink}
                  onChange={e => setPaymentLink(e.target.value)}
                  className="w-full border border-brand-border rounded-xl p-2.5 pl-8 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark font-mono"
                />
                <Link className="w-3.5 h-3.5 text-brand-muted absolute left-2.5 top-3" />
              </div>
              <p className="text-[8px] text-brand-muted mt-1 leading-normal">
                Direct link to payment checkout form (Razorpay, Stripe, PayPal, custom checkout links).
              </p>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1">Shop UPI QR Code Image</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*" 
                    onChange={handleQrUpload}
                    className="hidden" 
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 border border-dashed border-brand-border hover:border-brand-dark rounded-xl text-[10px] font-bold uppercase tracking-widest text-brand-muted hover:text-brand-dark transition-all flex items-center justify-center gap-2 bg-brand-bg/20"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload QR Image
                  </button>
                </div>

                {qrCode && (
                  <button
                    type="button"
                    onClick={handleClearQr}
                    className="w-full py-2.5 border border-red-200 hover:border-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove QR Code
                  </button>
                )}
              </div>
              
              <div className="mt-3">
                <label className="block text-[8px] font-bold text-brand-muted uppercase tracking-wider mb-1">Or paste QR image / web link URL</label>
                <input 
                  type="text" 
                  placeholder="https://example.com/payment_qr.png"
                  value={qrCode.startsWith('data:') ? 'Custom Image Uploaded (Base64)' : qrCode}
                  onChange={e => {
                    if (!e.target.value.startsWith('Custom Image')) {
                      setQrCode(e.target.value);
                    }
                  }}
                  disabled={qrCode.startsWith('data:')}
                  className={clsx(
                    "w-full border border-brand-border rounded-xl p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark font-mono",
                    qrCode.startsWith('data:') && "opacity-60 bg-brand-bg cursor-not-allowed"
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social media links configuration */}
        <div className="space-y-4 pt-2 border-t border-brand-bg">
          <h3 className="text-xs font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border/60 pb-2 flex items-center gap-2">
            <Instagram className="w-4 h-4 text-brand-olive" /> Store Social Network Links
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1 flex items-center gap-1">
                <Instagram className="w-3.5 h-3.5 text-pink-600" /> Instagram Profile
              </label>
              <div className="relative">
                <input 
                  type="url" 
                  placeholder="https://instagram.com/yourstore"
                  value={instagram}
                  onChange={e => setInstagram(e.target.value)}
                  className="w-full border border-brand-border rounded-xl p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1 flex items-center gap-1">
                <Facebook className="w-3.5 h-3.5 text-blue-600" /> Facebook Page
              </label>
              <div className="relative">
                <input 
                  type="url" 
                  placeholder="https://facebook.com/yourstore"
                  value={facebook}
                  onChange={e => setFacebook(e.target.value)}
                  className="w-full border border-brand-border rounded-xl p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1 flex items-center gap-1">
                <Twitter className="w-3.5 h-3.5 text-sky-500" /> Twitter / X Profile
              </label>
              <div className="relative">
                <input 
                  type="url" 
                  placeholder="https://x.com/yourstore"
                  value={twitter}
                  onChange={e => setTwitter(e.target.value)}
                  className="w-full border border-brand-border rounded-xl p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1 flex items-center gap-1">
                <Linkedin className="w-3.5 h-3.5 text-blue-700" /> LinkedIn Profile
              </label>
              <div className="relative">
                <input 
                  type="url" 
                  placeholder="https://linkedin.com/company/yourstore"
                  value={linkedin}
                  onChange={e => setLinkedin(e.target.value)}
                  className="w-full border border-brand-border rounded-xl p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-emerald-600" /> Studio Website
              </label>
              <div className="relative">
                <input 
                  type="url" 
                  placeholder="https://yourstore.com"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  className="w-full border border-brand-border rounded-xl p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-green-600" /> WhatsApp Line / Link
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="https://wa.me/919876543210 or +91 98765 43210"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="w-full border border-brand-border rounded-xl p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save button actions */}
        <div className="pt-4 border-t border-brand-bg flex justify-end gap-3 select-none">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 border border-brand-border rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-brand-bg transition-all text-brand-dark cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-brand-olive text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-brand-dark transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Check className="w-4 h-4 text-brand-accent" /> Save Store Details & Links
          </button>
        </div>
      </div>
    </div>
  );
}

