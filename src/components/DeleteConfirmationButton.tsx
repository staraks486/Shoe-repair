import { useState } from 'react';
import { Trash2, Check, X } from 'lucide-react';
import clsx from 'clsx';

interface DeleteConfirmationButtonProps {
  onDelete: () => void;
  itemName?: string;
  className?: string;
  iconClassName?: string;
}

export default function DeleteConfirmationButton({ 
  onDelete, 
  itemName, 
  className,
  iconClassName
}: DeleteConfirmationButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (isConfirming) {
    return (
      <div className={clsx("flex items-center gap-1 bg-red-50 rounded-lg p-1 animate-in fade-in zoom-in-95 duration-200", className)}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
            setIsConfirming(false);
          }}
          className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors flex items-center gap-1"
          title="Confirm Delete"
        >
          <Check className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Delete</span>
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsConfirming(false);
          }}
          className="p-2 text-brand-muted hover:bg-brand-bg rounded-md transition-colors"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        setIsConfirming(true);
      }} 
      className={clsx("p-3 text-brand-muted hover:text-red-600 transition-colors", className)} 
      title={itemName ? `Delete ${itemName}` : "Delete Item"}
    >
      <Trash2 className={clsx("w-5 h-5 sm:w-4 sm:h-4", iconClassName)} />
    </button>
  );
}
