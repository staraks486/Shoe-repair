import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { AppNotification } from '../types';
import Toast from './Toast';
import { AnimatePresence } from 'motion/react';

export default function NotificationToastProvider() {
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
  const user = auth?.currentUser;

  useEffect(() => {
    if (!user || !db) return;

    // We only want to toast for NEW notifications created AFTER the app started
    const startTime = new Date().toISOString();

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('createdAt', '>', startTime),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newNotif = { id: change.doc.id, ...change.doc.data() } as AppNotification;
          
          // Avoid duplicate toasts if the listener re-triggers
          setActiveToasts(prev => {
            if (prev.some(t => t.id === newNotif.id)) return prev;
            return [newNotif, ...prev].slice(0, 3); // Max 3 toasts at once
          });
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  const removeToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed top-6 right-6 z-[200] flex flex-col gap-4 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {activeToasts.map((toast) => (
          <Toast 
            key={toast.id} 
            notification={toast} 
            onClose={removeToast} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
