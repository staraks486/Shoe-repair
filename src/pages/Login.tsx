import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { motion } from 'motion/react';
import { LogIn, Phone, Loader2 } from 'lucide-react';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const DEFAULT_PASSWORD = 'artisan_cobbler_pass';

  const handleSimpleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    // Simple normalization: convert phone to a mock email for Firebase Auth
    const identifier = `${phone.replace(/\D/g, '')}@mobile.local`;
    
    setLoading(true);
    setError('');

    try {
      // Try to sign in first
      await signInWithEmailAndPassword(auth, identifier, DEFAULT_PASSWORD);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        // Auto-create account for simple "mobile" login experience
        try {
          await createUserWithEmailAndPassword(auth, identifier, DEFAULT_PASSWORD);
        } catch (createErr: any) {
          setError("Please enter a valid mobile number");
        }
      } else {
        setError(err.message);
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

          <form onSubmit={handleSimpleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-dark uppercase tracking-widest ml-1">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-brand-bg border-brand-border rounded-2xl py-5 pl-12 pr-4 text-sm font-bold focus:ring-brand-accent focus:border-brand-accent placeholder:text-brand-muted/40"
                  placeholder="+1 (555) 000-0000"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !phone}
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

