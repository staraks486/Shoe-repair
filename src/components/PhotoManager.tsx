import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RepairPhoto } from '../types';
import clsx from 'clsx';

interface PhotoManagerProps {
  photos: RepairPhoto[];
  onAdd: (photo: RepairPhoto) => void;
  onRemove: (id: string) => void;
  label: string;
  maxPhotos?: number;
}

export default function PhotoManager({ photos, onAdd, onRemove, label, maxPhotos = 5 }: PhotoManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        const promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
        });
        
        reader.readAsDataURL(file);
        const base64 = await promise;

        onAdd({
          id: crypto.randomUUID(),
          url: base64,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Photo upload failed:', error);
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();
  const triggerCamera = () => cameraInputRef.current?.click();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <label className="label-xs ml-1">{label}</label>
          <p className="text-[10px] text-brand-muted uppercase tracking-widest font-black">
            {photos.length} / {maxPhotos} Photos
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={triggerCamera}
            disabled={photos.length >= maxPhotos || isUploading}
            className="p-3 bg-brand-bg hover:bg-brand-border/40 text-brand-dark rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Take Photo"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={triggerUpload}
            disabled={photos.length >= maxPhotos || isUploading}
            className="p-3 bg-brand-dark text-white rounded-full transition-all hover:bg-brand-olive shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="Upload Photo"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <AnimatePresence>
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative aspect-square group"
            >
              <img
                src={photo.url}
                alt="Shoe condition"
                className="w-full h-full object-cover rounded-2xl border border-brand-border shadow-sm"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => onRemove(photo.id)}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[8px] text-white font-black uppercase tracking-widest truncate">
                  {new Date(photo.timestamp).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))}
          
          {photos.length === 0 && !isUploading && (
            <div 
              onClick={triggerUpload}
              className="aspect-square rounded-2xl border-2 border-dashed border-brand-border flex flex-col items-center justify-center gap-2 text-brand-muted hover:text-brand-dark hover:border-brand-dark transition-all cursor-pointer"
            >
              <ImageIcon className="w-6 h-6 opacity-20" />
              <span className="text-[8px] font-black uppercase tracking-widest">No Photos</span>
            </div>
          )}

          {isUploading && (
            <div className="aspect-square rounded-2xl border border-brand-border bg-brand-bg flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
