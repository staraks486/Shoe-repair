import React, { useState } from 'react';
import { useAppStore } from '../store';
import { MessageSquare, UserPlus, X, Check, Search, AlertCircle, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

interface DetectedContact {
  name: string;
  phone: string;
  selected: boolean;
  isDuplicate: boolean;
}

interface WhatsAppImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhatsAppImportModal({ isOpen, onClose }: WhatsAppImportModalProps) {
  const { customers, addCustomer } = useAppStore();
  const [pastedText, setPastedText] = useState('');
  const [detectedContacts, setDetectedContacts] = useState<DetectedContact[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseText = () => {
    if (!pastedText.trim()) return;
    setIsProcessing(true);

    // Using setTimeout to allow the UI to update the loading state before heavy regex work
    setTimeout(() => {
      // Simple regex to find phone numbers (looking for 10+ digits with potential country codes)
      const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3}[-.\s]?\d{3,4}/g;
      
      // Split by lines to try and find names associated with numbers
      const lines = pastedText.split('\n').slice(0, 500); // Safety limit for extreme pastes
      const seen = new Set<string>();
      const found: DetectedContact[] = [];

      lines.forEach(line => {
        const phones = line.match(phoneRegex);
        if (phones) {
          phones.forEach(rawPhone => {
            const phone = rawPhone.replace(/\D/g, '');
            if (phone.length >= 10 && !seen.has(phone)) {
              seen.add(phone);
              
              // Try to extract name: often names are at the start of the line or before a colon in WhatsApp exports
              let name = 'Unknown Customer';
              const nameMatch = line.match(/^([^:\n\d]+):/);
              if (nameMatch && nameMatch[1]) {
                name = nameMatch[1].trim();
              } else if (line.length < 50 && !line.includes(':')) {
                // If the line is short and contains a number, the rest might be the name
                const cleanName = line.replace(rawPhone, '').replace(/[^a-zA-Z\s]/g, '').trim();
                if (cleanName) name = cleanName;
              }

              const isDuplicate = customers.some(c => c.phoneNumber.includes(phone) || phone.includes(c.phoneNumber));
              
              found.push({
                name,
                phone,
                selected: !isDuplicate,
                isDuplicate
              });
            }
          });
        }
      });

      setDetectedContacts(found);
      setIsProcessing(false);
    }, 100);
  };

  const handleImport = () => {
    const toImport = detectedContacts.filter(c => c.selected);
    toImport.forEach(contact => {
      addCustomer({
        name: contact.name,
        phoneNumber: contact.phone,
        email: '',
        totalOrders: 0,
        lastVisit: new Date().toISOString()
      });
    });
    onClose();
  };

  const toggleSelect = (index: number) => {
    const newContacts = [...detectedContacts];
    newContacts[index].selected = !newContacts[index].selected;
    setDetectedContacts(newContacts);
  };

  const selectAll = () => {
    setDetectedContacts(prev => prev.map(c => ({ ...c, selected: !c.isDuplicate })));
  };

  const deselectAll = () => {
    setDetectedContacts(prev => prev.map(c => ({ ...c, selected: false })));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-[#F8F6F2] rounded-[2rem] shadow-2xl overflow-hidden border border-brand-border"
          >
            {/* Header */}
            <div className="bg-white px-8 py-6 border-b border-brand-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center border border-green-100">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-black text-brand-dark uppercase tracking-tighter">WhatsApp Bulk Sync</h3>
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Paste chat text to extract contacts</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-brand-bg rounded-full transition-colors">
                <X className="w-5 h-5 text-brand-muted" />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto">
              {detectedContacts.length === 0 ? (
                <div className="space-y-6">
                  <div className="bg-brand-bg p-6 rounded-2xl border border-brand-border/50">
                    <p className="text-[11px] font-bold text-brand-dark uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Copy className="w-3 h-3" /> How it works
                    </p>
                    <ol className="text-[10px] font-medium text-brand-muted space-y-2 uppercase tracking-wider list-decimal list-inside">
                      <li>Open your WhatsApp chat or a contact list</li>
                      <li>Copy the text (e.g., "919876543210 - John Doe")</li>
                      <li>Paste it into the box below</li>
                      <li>Review and confirm the detected numbers</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <textarea
                      placeholder="Paste your WhatsApp data here..."
                      className="w-full h-48 bg-white border border-brand-border rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all resize-none shadow-inner"
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                    />
                    <button
                      onClick={parseText}
                      disabled={!pastedText.trim() || isProcessing}
                      className="w-full bg-brand-dark text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isProcessing ? 'Scanning Archive...' : 'Scan for Contacts'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-brand-dark uppercase tracking-widest">
                      {detectedContacts.length} Contacts Detected
                    </p>
                    <div className="flex gap-4">
                      <button onClick={selectAll} className="text-[9px] font-black text-brand-accent uppercase tracking-tighter hover:underline">Select All</button>
                      <button onClick={deselectAll} className="text-[9px] font-black text-brand-muted uppercase tracking-tighter hover:underline">Deselect All</button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {detectedContacts.map((contact, idx) => (
                      <div 
                        key={idx}
                        onClick={() => !contact.isDuplicate && toggleSelect(idx)}
                        className={clsx(
                          "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                          contact.isDuplicate ? "bg-brand-bg border-brand-border opacity-60 cursor-not-allowed" : 
                          contact.selected ? "bg-white border-brand-accent shadow-sm" : "bg-white/50 border-brand-border hover:border-brand-accent/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={clsx(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            contact.isDuplicate ? "bg-brand-muted/10" : contact.selected ? "bg-brand-accent/10" : "bg-brand-bg"
                          )}>
                            <UserPlus className={clsx("w-4 h-4", contact.selected ? "text-brand-accent" : "text-brand-muted")} />
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-brand-dark uppercase tracking-tighter">{contact.name}</p>
                            <p className="text-[9px] font-bold text-brand-muted uppercase tracking-[0.2em]">+{contact.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {contact.isDuplicate && (
                            <span className="text-[8px] font-black bg-brand-muted/20 text-brand-muted px-2 py-0.5 rounded uppercase">Already in Archive</span>
                          )}
                          {!contact.isDuplicate && (
                            <div className={clsx(
                              "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                              contact.selected ? "bg-brand-accent border-brand-accent text-white" : "border-brand-border"
                            )}>
                              {contact.selected && <Check className="w-3 h-3" />}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setDetectedContacts([])}
                      className="flex-1 px-6 py-4 bg-white border border-brand-border text-brand-dark rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-brand-bg transition-all"
                    >
                      Clear & Rescan
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={!detectedContacts.some(c => c.selected)}
                      className="flex-[2] px-6 py-4 bg-brand-dark text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      Import {detectedContacts.filter(c => c.selected).length} Contacts
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
