import React, { useState } from 'react';
import { useAppStore } from '../store';
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

export default function SyncContactsButton() {
  const { addCustomer, customers } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const clientId = process.env.GOOGLE_CLIENT_ID;

  const handleSync = async () => {
    if (!clientId) {
      setError('Google Client ID not configured. Please check environment variables.');
      setStatus('error');
      return;
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      setError('Google Identity Services not loaded. Please refresh.');
      setStatus('error');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setError(null);

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/contacts.readonly',
        callback: async (response: any) => {
          if (response.error !== undefined) {
            setError(response.error);
            setStatus('error');
            setLoading(false);
            return;
          }

          try {
            const res = await fetch(
              'https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,emailAddresses&pageSize=100',
              {
                headers: {
                  Authorization: `Bearer ${response.access_token}`,
                },
              }
            );

            if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.error?.message || 'Failed to fetch contacts');
            }

            const data = await res.json();
            const connections = data.connections || [];

            let syncedCount = 0;
            connections.forEach((person: any) => {
              const name = person.names?.[0]?.displayName || 'Unknown';
              const rawPhone = person.phoneNumbers?.[0]?.value || '';
              // Clean phone number: remove spaces, dashes, parentheses
              const phone = rawPhone.replace(/[\s\-\(\)]/g, '');
              const email = person.emailAddresses?.[0]?.value || '';

              if (phone) {
                const exists = customers.some(c => c.phoneNumber === phone);
                if (!exists) {
                  addCustomer({
                    name,
                    phoneNumber: phone,
                    email,
                    totalOrders: 0,
                    lastVisit: new Date().toISOString()
                  });
                  syncedCount++;
                }
              }
            });

            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);
          } catch (err: any) {
            console.error('Contact Sync Error:', err);
            setError(err.message);
            setStatus('error');
          } finally {
            setLoading(false);
          }
        },
      });

      tokenClient.requestAccessToken();
    } catch (err: any) {
      console.error('OAuth Init Error:', err);
      setError(err.message);
      setStatus('error');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleSync}
        disabled={loading}
        className={clsx(
          "flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border",
          status === 'success' 
            ? "bg-green-500 text-white border-green-500" 
            : status === 'error'
              ? "bg-red-500 text-white border-red-500"
              : "bg-white text-brand-dark border-brand-border hover:bg-brand-bg hover:border-brand-accent/50"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Syncing Archive...
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Archive Updated
          </>
        ) : status === 'error' ? (
          <>
            <AlertCircle className="w-4 h-4" />
            Sync Failed
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Sync Google Contacts
          </>
        )}
      </button>
      {error && (
        <p className="text-[9px] text-red-500 font-bold mt-2 uppercase tracking-tighter">
          {error}
        </p>
      )}
    </div>
  );
}
