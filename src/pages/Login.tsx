import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { motion } from 'motion/react';
import { LogIn, Phone, Loader2, UserCircle } from 'lucide-react';

const GUEST_ID = 'guest@cordwainers.local';
const ADMIN_ID = 'admin@cordwainers.local';
const DEFAULT_PASSWORD = 'artisan_cobbler_pass';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e?: React.FormEvent, customId?: string) => {
    if (e) e.preventDefault();
    if (!auth) return;
    
    // Normalize input: if it looks like a phone number, convert to mock email
    let finalId = customId || identifier;
    if (!finalId.includes('@')) {
      finalId = `${finalId.replace(/\D/g, '')}@mobile.local`;
    }
    
    setLoading(true);
    setError('');

    try {
      // Attempt sign in
      await signInWithEmailAndPassword(auth, finalId, DEFAULT_PASSWORD);
    } catch (err: any) {
      // If user doesn't exist, try to create them (seamless onboarding)
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email' || err.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, finalId, DEFAULT_PASSWORD);
        } catch (createErr: any) {
          setError(customId === GUEST_ID ? "Guest access failed" : "Please enter a valid email or mobile number");
          console.error("Auth Error:", createErr);
        }
      } else {
        setError(err.message);
        console.error("Auth Error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EAE6DD] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-noise opacity-5 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-[#D1CEC4] overflow-hidden relative"
      >
        <div className="p-10 md:p-14">
          <div className="text-center mb-10">
            <h1 className="font-serif text-3xl font-black text-brand-dark uppercase tracking-tight">
              Studio Access
            </h1>
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.3em] mt-2">
              Artisan Management Portal
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          <form onSubmit={(e) => handleAuth(e)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-dark uppercase tracking-widest ml-1">Email or Mobile</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                <input 
                  type="text" 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-brand-bg border-brand-border rounded-2xl py-5 pl-12 pr-4 text-sm font-bold focus:ring-brand-accent focus:border-brand-accent placeholder:text-brand-muted/40"
                  placeholder="admin@cordwainers.local"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !identifier}
              className="w-full bg-brand-dark text-white rounded-2xl py-5 font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-brand-olive transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Enter Studio
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                type="button"
                onClick={() => handleAuth(undefined, ADMIN_ID)}
                disabled={loading}
                className="bg-brand-bg border border-brand-border text-brand-dark rounded-xl py-3 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all active:scale-[0.98]"
              >
                <LogIn className="w-3 h-3" />
                Demo Login
              </button>
              <button 
                type="button"
                onClick={() => handleAuth(undefined, GUEST_ID)}
                disabled={loading}
                className="bg-brand-bg border border-brand-border text-brand-dark rounded-xl py-3 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all active:scale-[0.98]"
              >
                <UserCircle className="w-3 h-3" />
                Guest Access
              </button>
            </div>
          </form>

          <div className="mt-12 pt-8 border-t border-brand-border/40 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest">
                System Online
              </span>
            </div>
            <p className="text-[9px] font-bold text-brand-muted/60 uppercase tracking-widest leading-loose">
              By entering, you agree to the<br/>artisan workshop protocols
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

