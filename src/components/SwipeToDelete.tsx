import React, { useState } from 'react';
import { motion, PanInfo } from 'motion/react';
import { Trash2 } from 'lucide-react';

interface SwipeToDeleteProps {
  onDelete: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const SwipeToDelete: React.FC<SwipeToDeleteProps> = ({ onDelete, children, disabled }) => {
  const [isSwiped, setIsSwiped] = useState(false);

  const handleDragEnd = (_: any, info: PanInfo) => {
    // Highly responsive thresholds: swipe left if dragged more than 30px or swiped with velocity
    if (info.offset.x < -30 || info.velocity.x < -100) {
      setIsSwiped(true);
    } else if (info.offset.x > 25 || info.velocity.x > 100) {
      setIsSwiped(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setIsSwiped(false);
  };

  if (disabled) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-2xl w-full bg-red-500 shadow-sm">
      {/* Background/Action layer */}
      <div className="absolute inset-0 bg-red-600 flex items-center justify-end px-6 z-0">
        <button
          onClick={handleDelete}
          type="button"
          className="flex flex-col items-center justify-center gap-1 text-white hover:scale-105 active:scale-95 transition-transform"
          title="Delete Item"
        >
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shadow">
            <Trash2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest text-white">Delete</span>
        </button>
      </div>

      {/* Content layer */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={{ left: 0.15, right: 0.05 }}
        onDragEnd={handleDragEnd}
        animate={{ x: isSwiped ? -100 : 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 220 }}
        className="relative z-10 bg-white"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SwipeToDelete;
