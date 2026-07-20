import React, { useState, useEffect, useRef } from 'react';
import { Bell, Info, CheckCircle, AlertTriangle, XCircle, Trash2 } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { AppNotification } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = auth?.currentUser;

  useEffect(() => {
    if (!user || !db) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppNotification[];
      setNotifications(data);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const markAllAsRead = async () => {
    if (!db || !user) return;
    const batch = writeBatch(db);
    notifications.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { read: true });
    });
    await batch.commit();
  };

  const clearAll = async () => {
    if (!db || !user) return;
    const batch = writeBatch(db);
    notifications.forEach(n => {
      batch.delete(doc(db, 'notifications', n.id));
    });
    await batch.commit();
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white border border-brand-border shadow-sm flex items-center justify-center text-brand-dark hover:bg-brand-bg transition-colors group"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-brand-dark group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-[24px] border border-brand-border shadow-2xl z-[100] overflow-hidden"
          >
            <div className="p-4 border-b border-brand-border bg-brand-bg/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest">Notifications</h3>
                <p className="text-[10px] text-brand-muted font-bold mt-0.5">Workshop system updates</p>
              </div>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-[9px] font-black text-brand-olive uppercase tracking-widest hover:underline">
                    Read All
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline">
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-6 h-6 text-brand-muted/40" />
                  </div>
                  <p className="text-xs font-bold text-brand-muted">No notifications yet</p>
                  <p className="text-[10px] text-brand-muted/60 mt-1 uppercase tracking-widest">All caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-brand-border/40">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={clsx(
                        "p-4 hover:bg-brand-bg/20 transition-colors cursor-pointer flex gap-3",
                        !notification.read && "bg-brand-bg/40 border-l-2 border-brand-dark"
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="mt-0.5">{getIcon(notification.type)}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-black text-brand-dark leading-tight">{notification.title}</p>
                          <span className="text-[8px] font-bold text-brand-muted uppercase">
                            {format(new Date(notification.createdAt), 'HH:mm')}
                          </span>
                        </div>
                        <p className="text-[11px] text-brand-muted leading-relaxed">{notification.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 bg-brand-bg/10 border-t border-brand-border text-center">
                <span className="text-[9px] font-black text-brand-muted uppercase tracking-[0.2em]">
                  Real-time synchronization active
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
