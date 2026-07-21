import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import clsx from 'clsx';
import { AppNotification } from '../types';

interface ToastProps {
  notification: AppNotification;
  onClose: (id: string) => void;
}

export default function Toast({ notification, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-[#B89C72]" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={clsx(
        "flex items-start gap-4 p-4 rounded-[20px] bg-white border border-brand-border shadow-[0_10px_30px_rgba(0,0,0,0.1)] pointer-events-auto min-w-[320px] max-w-[400px]",
        "hover:shadow-[0_15px_40px_rgba(0,0,0,0.15)] transition-shadow"
      )}
    >
      <div className="shrink-0 mt-0.5">
        {getIcon(notification.type)}
      </div>
      
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-black text-brand-dark uppercase tracking-widest">{notification.title}</h4>
        <p className="text-xs text-brand-muted leading-relaxed">{notification.message}</p>
      </div>

      <button 
        onClick={() => onClose(notification.id)}
        className="shrink-0 p-1 rounded-full hover:bg-brand-bg transition-colors"
      >
        <X className="w-4 h-4 text-brand-muted" />
      </button>
    </motion.div>
  );
}
