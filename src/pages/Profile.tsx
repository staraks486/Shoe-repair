import React, { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { UserProfile, ShoeRepairRequest } from '../types';
import { motion } from 'motion/react';
import { User, Mail, Shield, Calendar, Settings as SettingsIcon, Save, Loader2, Camera, Award, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore } from '../store';

export default function Profile() {
  const user = auth?.currentUser;
  const repairs = useAppStore((state) => state.repairs);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      if (!user || !db) return;
      try {
        const docRef = doc(db, 'profiles', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile(data);
          setDisplayName(data.displayName);
        } else {
          // Create initial profile if it doesn't exist
          const initialProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'Artisan',
            role: 'cobbler',
            createdAt: new Date().toISOString()
          };
          await setDoc(docRef, initialProfile);
          setProfile(initialProfile);
          setDisplayName(initialProfile.displayName);
        }
      } catch (error: any) {
        if (error.message?.includes('client is offline')) {
          console.warn("Profile fetch deferred: client is offline.");
          // We can use dummy data or just wait
          setProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'Artisan',
            role: 'cobbler',
            createdAt: new Date().toISOString()
          });
          setDisplayName(user.displayName || user.email?.split('@')[0] || 'Artisan');
        } else {
          console.error("Profile fetch failed:", error);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        displayName
      });
      setProfile(prev => prev ? { ...prev, displayName } : null);
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-brand-dark animate-spin" />
      </div>
    );
  }

  const completedRepairs = repairs.filter(r => r.status === 'Completed' || r.status === 'Delivered').length;
  const inProgressRepairs = repairs.filter(r => r.status !== 'Completed' && r.status !== 'Delivered').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-12 pb-24 px-4 sm:px-6 md:px-8"
    >
      {/* HEADER: Matching Artisan style */}
      <header className="flex flex-col sm:flex-row justify-between items-center gap-6 py-8">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="font-display text-3xl font-bold text-brand-dark tracking-tight">Artisan Profile</h2>
          <p className="label-xs">Personal Identity & Performance</p>
        </div>
      </header>

      <div className="bg-white rounded-[32px] border border-brand-border shadow-premium overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="h-32 bg-brand-dark relative">
          <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-[24px] border border-brand-border shadow-lg">
            <div className="w-24 h-24 rounded-[20px] bg-brand-bg flex items-center justify-center relative group">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover rounded-[20px]" />
              ) : (
                <User className="w-10 h-10 text-brand-muted" />
              )}
              <button className="absolute inset-0 bg-black/40 text-white rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-black text-brand-dark tracking-tight">
              {profile?.displayName}
            </h1>
            <div className="flex items-center gap-2 text-xs font-bold text-brand-muted uppercase tracking-widest">
              <Shield className="w-3 h-3" />
              <span>{profile?.role || 'Artisan'}</span>
              <span className="opacity-30">•</span>
              <Calendar className="w-3 h-3" />
              <span>Joined {profile?.createdAt ? format(new Date(profile.createdAt), 'MMM yyyy') : 'Recently'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center px-6 py-3 bg-brand-bg rounded-[20px] border border-brand-border">
              <span className="block text-2xl font-display font-black text-brand-dark">{completedRepairs}</span>
              <span className="text-[9px] font-black text-brand-muted uppercase tracking-[0.2em]">Completed</span>
            </div>
            <div className="text-center px-6 py-3 bg-brand-bg rounded-[20px] border border-brand-border">
              <span className="block text-2xl font-display font-black text-brand-dark">{inProgressRepairs}</span>
              <span className="text-[9px] font-black text-brand-muted uppercase tracking-[0.2em]">Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white p-8 rounded-[32px] border border-brand-border shadow-premium space-y-8">
            <h2 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] border-b border-brand-border pb-4">Account Settings</h2>

            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-brand-dark uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-brand-bg border-none rounded-[20px] p-5 text-sm font-bold focus:ring-0 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-brand-dark uppercase tracking-widest ml-1">Email</label>
                  <input 
                    type="email" 
                    value={profile?.email}
                    disabled
                    className="w-full bg-brand-bg/50 border-none rounded-[20px] p-5 text-sm font-bold opacity-60 cursor-not-allowed shadow-inner"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                {message && <span className="text-[10px] font-black text-green-600 uppercase tracking-widest animate-pulse">{message}</span>}
                <button 
                  type="submit" 
                  disabled={saving}
                  className="bg-brand-dark text-white rounded-full px-12 py-4 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-brand-accent transition-all active:scale-[0.95] disabled:opacity-50 ml-auto shadow-lg"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Confirm Updates
                </button>
              </div>
            </form>
          </div>
        </div>

        <div>
          <div className="bg-white p-8 rounded-[32px] border border-brand-border shadow-premium space-y-8">
            <h2 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] border-b border-brand-border pb-4">Performance</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Success Rate</span>
                  <span className="text-xl font-display font-black text-brand-dark">98%</span>
                </div>
                <div className="h-1 bg-brand-bg rounded-full overflow-hidden">
                  <div className="h-full bg-brand-dark w-[98%]" />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest block">Avg. TAT</span>
                <p className="text-xl font-display font-black text-brand-dark">4.2 Days</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
