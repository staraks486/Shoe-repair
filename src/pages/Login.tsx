import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, userProfile, setUser, settings } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user || userProfile) {
      navigate('/', { replace: true });
    }
  }, [user, userProfile, navigate]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setError("Please enter your username, email, or mobile number");
      return;
    }
    if (!loginPassword) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Get credentials from settings
      const storedCredentials = settings?.userCredentials || [];
      
      // 2. Guarantee that the standard demo credentials always exist and are merged
      const defaultCredentials = [
        { email: 'admin@cordwainers.local', password: 'artisan_cobbler_pass', role: 'Admin' as const, displayName: 'Admin Studio', username: 'admin', mobile: '9999999999' },
        { email: 'guest@cordwainers.local', password: 'artisan_cobbler_pass', role: 'Staff' as const, displayName: 'Guest Staff', username: 'guest', mobile: '8888888888' }
      ];

      // Merge stored credentials. If any email matches default credentials, we enrich it.
      const credentials = [...storedCredentials];
      defaultCredentials.forEach(def => {
        const existingIdx = credentials.findIndex(c => c.email.toLowerCase() === def.email.toLowerCase());
        if (existingIdx === -1) {
          credentials.push(def);
        } else {
          // Fill missing properties (e.g., if Firestore contains credentials without 'username' or 'mobile')
          credentials[existingIdx] = {
            ...def,
            ...credentials[existingIdx],
            username: credentials[existingIdx].username || def.username,
            mobile: credentials[existingIdx].mobile || def.mobile,
          };
        }
      });

      const match = credentials.find(cred => {
        const identifier = loginIdentifier.trim().toLowerCase();
        
        // Robust fallback matching logic
        const matchesUsername = (cred.username || cred.email.split('@')[0] || '').toLowerCase() === identifier;
        const matchesEmail = cred.email.toLowerCase() === identifier;
        
        // Clean mobile string formatting for robust matching
        const cleanMobile = (cred.mobile || '').replace(/\D/g, '');
        const cleanIdentifier = identifier.replace(/\D/g, '');
        const matchesMobile = cleanMobile && cleanIdentifier && (cleanMobile === cleanIdentifier || cleanMobile.endsWith(cleanIdentifier) || cleanIdentifier.endsWith(cleanMobile));
        
        return (matchesUsername || matchesEmail || matchesMobile) && cred.password === loginPassword;
      });

      if (!match) {
        setError("Invalid username, mobile, email or password. Please check your credentials.");
        setLoading(false);
        return;
      }

      // Create secure mock session
      const mockUser = {
        uid: 'mock-' + match.email.replace(/[^a-zA-Z0-9]/g, '-'),
        email: match.email,
        displayName: match.displayName || match.username || match.email.split('@')[0],
        emailVerified: true,
        isAnonymous: false,
        phoneNumber: match.mobile || null,
        photoURL: null,
        providerId: 'firebase',
        metadata: {},
        providerData: [],
        refreshToken: 'mock-token',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'mock-id-token',
        getIdTokenResult: async () => ({}) as any,
        reload: async () => {},
        toJSON: () => ({})
      } as any;
      
      setUser(mockUser);
      
      useAppStore.setState({
        userProfile: {
          uid: mockUser.uid,
          email: match.email,
          displayName: mockUser.displayName,
          createdAt: new Date().toISOString(),
          role: match.role,
          isAdmin: match.role === 'Admin'
        }
      });

      navigate('/', { replace: true });
    } catch (err: any) {
      console.error("Login error", err);
      setError("An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EAE6DD] flex flex-col items-center justify-center p-4 py-12 md:py-16 relative">
      <div className="fixed inset-0 bg-noise opacity-5 pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <h1 className="font-display font-black text-4xl text-brand-dark tracking-tight mb-1">Cordwainers</h1>
          <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.25em]">Artisan Studio Portal</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="bg-white p-8 md:p-10 rounded-[2rem] shadow-2xl border border-brand-border/40"
        >
          <div className="mb-6">
            <h2 className="text-lg font-black text-brand-dark tracking-tight">Staff Authentication</h2>
            <p className="text-xs text-brand-muted font-medium mt-1">Please log in using your registered credentials.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 text-red-800 p-4 rounded-2xl text-xs font-bold border border-red-100"
                >
                  <p>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login identifier */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-brand-dark uppercase tracking-widest ml-1">
                Username / Mobile Number / Email
              </label>
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="Enter username, mobile, or email"
                className="w-full bg-[#F5F3EC] border border-[#E8E6DF] rounded-2xl py-3.5 px-5 text-brand-dark font-medium placeholder:text-brand-muted/40 focus:bg-white focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10 transition-all outline-none"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="block text-[10px] font-black text-brand-dark uppercase tracking-widest">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] font-black text-brand-muted hover:text-brand-dark uppercase tracking-wider cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F5F3EC] border border-[#E8E6DF] rounded-2xl py-3.5 px-5 text-brand-dark font-medium placeholder:text-brand-muted/40 focus:bg-white focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10 transition-all outline-none"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-dark hover:bg-[#8C6239] text-white rounded-2xl py-4 px-6 font-bold tracking-wide flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-center"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              </button>
            </div>
          </form>

        </motion.div>

        {/* App design attribution */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-center mt-8 select-none pointer-events-none"
        >
          <p className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em]">
            App design by Arvind Kumar Shukla
          </p>
        </motion.div>
      </div>
    </div>
  );
}
