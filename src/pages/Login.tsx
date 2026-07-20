import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { motion } from 'motion/react';
import { LogIn, Phone, Loader2, UserCircle } from 'lucide-react';

const GUEST_ID = 'guest@cordwainers.local';
const ADMIN_ID = 'admin@cordwainers.local';
const DEFAULT_PASSWORD = 'artisan_cobbler_pass';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
      console.error("Auth Error:", err);
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="font-display text-3xl font-black text-brand-dark uppercase tracking-tight">
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

            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border border-brand-border text-brand-dark rounded-2xl py-4 font-black uppercase tracking-[0.1em] text-xs flex items-center justify-center gap-3 hover:bg-brand-bg transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
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
            <div className="mt-4 pt-4 border-t border-brand-border/20">
              <p className="text-[8px] font-black text-brand-accent uppercase tracking-[0.2em] leading-none">
                App designed by Arvind Kumar Shukla
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

