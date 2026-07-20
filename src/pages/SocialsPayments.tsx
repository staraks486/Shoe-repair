import React, { useState, useRef } from 'react';
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
  Sparkles,
  Phone,
  Coins
} from 'lucide-react';
import clsx from 'clsx';

export default function SocialsPayments() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Success state for saves
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Form states initialized with existing values
  const [instagram, setInstagram] = useState(settings.instagramLink || '');
  const [facebook, setFacebook] = useState(settings.facebookLink || '');
  const [twitter, setTwitter] = useState(settings.twitterLink || '');
  const [linkedin, setLinkedin] = useState(settings.linkedinLink || '');
  const [website, setWebsite] = useState(settings.websiteLink || '');
  
  const [paymentLink, setPaymentLink] = useState(settings.paymentLink || '');
  const [qrCode, setQrCode] = useState(settings.qrCode || '');

  const showSaveNotification = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => {
      setSaveStatus(null);
    }, 3000);
  };

  const handleSave = () => {
    updateSettings({
      instagramLink: instagram.trim(),
      facebookLink: facebook.trim(),
      twitterLink: twitter.trim(),
      linkedinLink: linkedin.trim(),
      websiteLink: website.trim(),
      paymentLink: paymentLink.trim(),
      qrCode: qrCode
    });
    showSaveNotification('Configuration saved successfully!');
  };

  // Process QR code image upload & turn into base64
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setQrCode(base64String);
        updateSettings({ qrCode: base64String });
        showSaveNotification('QR Code uploaded and saved!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearQr = () => {
    setQrCode('');
    updateSettings({ qrCode: '' });
    showSaveNotification('QR Code removed.');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
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
          <p className="text-[10px] text-brand-accent font-black tracking-[0.3em] uppercase mt-3 text-center">Socials & Payments</p>
        </div>
      </header>

      {/* Floating Alert Feedback */}
      {saveStatus && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-brand-dark text-white text-[10px] font-bold uppercase tracking-widest py-3 px-6 rounded-full shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-brand-accent shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Interactive Card Live Preview */}
      <div className="bg-gradient-to-br from-brand-dark to-[#1F2421] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-white/5">
        <div className="absolute top-[-30%] right-[-10%] w-48 h-48 rounded-full bg-brand-accent/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 rounded-full bg-brand-olive/10 blur-2xl pointer-events-none" />
        
        {/* Header inside preview */}
        <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-4">
          <div>
            <span className="text-[8px] bg-brand-accent/20 text-brand-accent border border-brand-accent/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest leading-none">
              Digital Touchpoint
            </span>
            <h3 className="font-display text-sm font-bold mt-1.5 text-white/95">{settings.storeName || 'Cordwainers Studio'}</h3>
            <p className="text-[8px] text-white/65 mt-0.5">Bespoke Footwear Restoration</p>
          </div>
          <Coins className="w-5 h-5 text-brand-accent" />
        </div>

        {/* Dynamic Payment QR & Actions */}
        <div className="grid grid-cols-5 gap-4 items-center">
          <div className="col-span-3 space-y-3">
            <p className="text-[9px] text-white/70 leading-relaxed">
              Scan the QR code or click below to settle balances, review custom estimates, or join the artisan circle.
            </p>
            
            <div className="flex flex-col gap-1.5">
              {paymentLink ? (
                <a 
                  href={paymentLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-brand-accent text-brand-dark font-extrabold text-[9px] uppercase tracking-wider rounded-lg hover:opacity-90 transition-all text-center"
                >
                  <CreditCard className="w-3 h-3" /> Pay Invoice Online
                </a>
              ) : (
                <div className="py-1.5 px-3 bg-white/5 border border-white/10 text-white/40 font-bold text-[9px] uppercase tracking-wider rounded-lg text-center select-none italic">
                  No Payment Link Set
                </div>
              )}
            </div>
          </div>

          <div className="col-span-2 flex flex-col items-center">
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
          <span className="text-[7px] text-white/50 uppercase tracking-widest font-extrabold mr-1">Handles:</span>
          
          {instagram && (
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-[8px] font-semibold text-white/90 transition-all">
              <Instagram className="w-2.5 h-2.5 text-[#E1306C]" /> IG
            </a>
          )}
          {facebook && (
            <a href={facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-[8px] font-semibold text-white/90 transition-all">
              <Facebook className="w-2.5 h-2.5 text-[#1877F2]" /> FB
            </a>
          )}
          {twitter && (
            <a href={twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-[8px] font-semibold text-white/90 transition-all">
              <Twitter className="w-2.5 h-2.5 text-[#1DA1F2]" /> X
            </a>
          )}
          {linkedin && (
            <a href={linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-[8px] font-semibold text-white/90 transition-all">
              <Linkedin className="w-2.5 h-2.5 text-[#0A66C2]" /> LN
            </a>
          )}
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-[8px] font-semibold text-white/90 transition-all">
              <Globe className="w-2.5 h-2.5 text-brand-accent" /> WEB
            </a>
          )}

          {!instagram && !facebook && !twitter && !linkedin && !website && (
            <span className="text-[8px] text-white/40 italic">Add social handles below to populate badges</span>
          )}
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white border border-brand-border rounded-2xl shadow-xs overflow-hidden p-6 space-y-6">
        
        {/* Payments configuration */}
        <div className="space-y-4">
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
                  className="w-full border border-brand-border rounded-lg p-2.5 pl-8 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark font-mono"
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
                    "w-full border border-brand-border rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark font-mono",
                    qrCode.startsWith('data:') && "opacity-60 bg-brand-bg cursor-not-allowed"
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social media links configuration */}
        <div className="space-y-4 pt-4 border-t border-brand-bg">
          <h3 className="text-xs font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border/60 pb-2 flex items-center gap-2">
            <Instagram className="w-4 h-4 text-brand-olive" /> Social Handles & Portfolio
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1">Instagram URL</label>
              <div className="relative">
                <input 
                  type="url" 
                  placeholder="https://instagram.com/handle"
                  value={instagram}
                  onChange={e => setInstagram(e.target.value)}
                  className="w-full border border-brand-border rounded-lg p-2.5 pl-8 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
                <Instagram className="w-3.5 h-3.5 text-brand-muted absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1">Facebook URL</label>
              <div className="relative">
                <input 
                  type="url" 
                  placeholder="https://facebook.com/handle"
                  value={facebook}
                  onChange={e => setFacebook(e.target.value)}
                  className="w-full border border-brand-border rounded-lg p-2.5 pl-8 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
                <Facebook className="w-3.5 h-3.5 text-brand-muted absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1">Twitter / X URL</label>
              <div className="relative">
                <input 
                  type="url" 
                  placeholder="https://x.com/handle"
                  value={twitter}
                  onChange={e => setTwitter(e.target.value)}
                  className="w-full border border-brand-border rounded-lg p-2.5 pl-8 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
                <Twitter className="w-3.5 h-3.5 text-brand-muted absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1">LinkedIn URL</label>
              <div className="relative">
                <input 
                  type="url" 
                  placeholder="https://linkedin.com/company/handle"
                  value={linkedin}
                  onChange={e => setLinkedin(e.target.value)}
                  className="w-full border border-brand-border rounded-lg p-2.5 pl-8 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
                <Linkedin className="w-3.5 h-3.5 text-brand-muted absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-brand-dark uppercase tracking-wider mb-1">Studio Website URL</label>
              <div className="relative">
                <input 
                  type="url" 
                  placeholder="https://yourbrand.com"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  className="w-full border border-brand-border rounded-lg p-2.5 pl-8 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
                <Globe className="w-3.5 h-3.5 text-brand-muted absolute left-2.5 top-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Save button actions */}
        <div className="pt-4 border-t border-brand-bg flex justify-end gap-3 select-none">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-brand-border rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-brand-bg transition-all text-brand-dark"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-brand-olive text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
