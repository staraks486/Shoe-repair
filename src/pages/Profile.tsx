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
      className="max-w-4xl mx-auto space-y-8 pb-12"
    >
      <div className="bg-white rounded-[32px] border border-brand-border shadow-sm overflow-hidden">
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
            <h1 className="font-serif text-3xl font-black text-brand-dark tracking-tight">
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
            <div className="text-center px-4 py-2 bg-brand-bg rounded-2xl border border-brand-border">
              <span className="block text-xl font-black text-brand-dark">{completedRepairs}</span>
              <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Mastered</span>
            </div>
            <div className="text-center px-4 py-2 bg-brand-bg rounded-2xl border border-brand-border">
              <span className="block text-xl font-black text-brand-dark">{inProgressRepairs}</span>
              <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">In Forge</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[32px] border border-brand-border shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-brand-border/40 pb-4">
              <SettingsIcon className="w-5 h-5 text-brand-dark" />
              <h2 className="font-serif text-xl font-black text-brand-dark uppercase tracking-tight">Account Settings</h2>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-brand-dark uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-brand-bg border-brand-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-brand-accent focus:border-brand-accent"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-brand-dark uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                    <input 
                      type="email" 
                      value={profile?.email}
                      disabled
                      className="w-full bg-brand-bg border-brand-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold opacity-60 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                {message && (
                  <span className="text-xs font-bold text-green-600 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    {message}
                  </span>
                )}
                <button 
                  type="submit" 
                  disabled={saving}
                  className="bg-brand-dark text-white rounded-2xl px-8 py-4 font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-brand-olive transition-all active:scale-[0.98] disabled:opacity-50 ml-auto"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-[32px] border border-brand-border shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-brand-border/40 pb-4">
              <Activity className="w-5 h-5 text-brand-dark" />
              <h2 className="font-serif text-sm font-black text-brand-dark uppercase tracking-widest">Performance</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-brand-bg border border-brand-border/50">
                <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest block mb-1">Success Rate</span>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-serif font-black text-brand-dark">98%</span>
                  <div className="w-24 h-1.5 bg-white rounded-full overflow-hidden border border-brand-border/20">
                    <div className="h-full bg-green-500 w-[98%]" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-brand-bg border border-brand-border/50">
                <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest block mb-1">Avg. TAT</span>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-serif font-black text-brand-dark">4.2d</span>
                  <span className="text-[9px] font-bold text-green-600 uppercase">-12% vs last mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
