import React from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'motion/react';
import { Trash2 } from 'lucide-react';

interface SwipeToDeleteProps {
  onDelete: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const SwipeToDelete: React.FC<SwipeToDeleteProps> = ({ onDelete, children, disabled }) => {
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, -50, 0],
    ['rgb(239, 68, 68)', 'rgb(248, 113, 113)', 'transparent']
  );
  const opacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const scale = useTransform(x, [-100, -50, 0], [1, 0.8, 0.5]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -100) {
      onDelete();
    }
  };

  if (disabled) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-2xl group">
      {/* Background/Action layer */}
      <motion.div
        style={{ background, opacity }}
        className="absolute inset-0 flex items-center justify-end px-6 z-0"
      >
        <motion.div style={{ scale }}>
          <Trash2 className="w-5 h-5 text-white" />
        </motion.div>
      </motion.div>

      {/* Content layer */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative z-10 bg-white"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SwipeToDelete;
