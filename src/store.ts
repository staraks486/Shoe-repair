import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  ShoeRepairRequest, 
  Customer, 
  InventoryItem, 
  ShoeInsurance, 
  Settings, 
  VoiceNote,
  AppNotification,
  UserProfile,
  Appointment
} from './types';
import { NotificationService } from './services/NotificationService';
import { db, auth } from './services/firebase';
import { User } from 'firebase/auth';
import { format, parseISO } from 'date-fns';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  getDoc,
  writeBatch
} from 'firebase/firestore';

interface AppState {
  user: User | null;
  repairs: ShoeRepairRequest[];
  customers: Customer[];
  inventory: InventoryItem[];
  insurance: ShoeInsurance[];
  appointments: Appointment[];
  settings: Settings;
  syncErrorLogs: Array<{ id: string; timestamp: string; message: string; payloadCount: number }>;
  lastSyncStatus: 'idle' | 'success' | 'error' | 'syncing';
  lastSyncTime: string | null;
  
  setUser: (user: User | null) => void;
  fetchFromFirestore: () => Promise<void>;
  addRepair: (repair: Omit<ShoeRepairRequest, 'id' | 'isSynced' | 'createdAt' | 'invoiceNumber'>) => ShoeRepairRequest;
  updateRepairStatus: (id: string, status: ShoeRepairRequest['status']) => void;
  updateRepair: (id: string, data: Partial<ShoeRepairRequest>) => void;
  deleteRepair: (id: string) => void;
  syncAllPending: () => Promise<void>;
  clearSyncErrorLogs: () => void;
  
  addCustomer: (customer: Customer) => void;
  updateCustomer: (phoneNumber: string, data: Partial<Customer>) => void;
  
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  
  addInsurance: (policy: Omit<ShoeInsurance, 'id' | 'createdAt'>) => void;
  updateInsurance: (id: string, data: Partial<ShoeInsurance>) => void;
  deleteInsurance: (id: string) => void;
  
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateAppointment: (id: string, data: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  
  updateSettings: (settings: Partial<Settings>) => void;
  addVoiceNote: (repairId: string, voiceNote: Omit<VoiceNote, 'id'>) => void;
  deleteVoiceNote: (repairId: string, noteId: string) => void;
  
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt' | 'userId'>) => Promise<void>;
}

const generateId = () => Math.random().toString(36).substring(2, 9);
const generateInvoice = () => 'INV-' + Math.floor(100000 + Math.random() * 900000);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      repairs: [],
      customers: [],
      inventory: [
        { id: '1', name: 'Premium Leather Soles', category: 'Soles', quantity: 50, unit: 'pairs', minThreshold: 10 },
        { id: '2', name: 'Rubber Heels', category: 'Heels', quantity: 5, unit: 'pairs', minThreshold: 20 },
        { id: '3', name: 'Black Polish', category: 'Polish', quantity: 15, unit: 'tins', minThreshold: 5 },
      ],
      insurance: [],
      appointments: [],
      settings: {
        storeName: 'Cordwainers Studio',
        address: '123 Main St, Cityville',
        hours: 'Mon-Sat: 9AM - 6PM',
        logo: '',
        logoUrl: '',
        cobblerBio: 'Master cobbler with 20 years of experience.',
        googleSheetsId: '',
        googleSheetsToken: '',
        googleSheetsWebAppUrl: '',
        paymentLink: '',
        qrCode: '',
        instagramLink: 'https://instagram.com/cordwainers_studio',
        facebookLink: 'https://facebook.com/cordwainers',
        twitterLink: '',
        linkedinLink: 'https://linkedin.com/company/cordwainers',
        websiteLink: 'https://cordwainers.com',
        isOfflineMode: false,
        whatsappTemplate: 'Hello {customerName}, your shoe repair ({repairType}) is now {status}. Invoice: {invoiceNumber}',
        insurancePlans: [
          {
            id: 'plan-1',
            name: 'The Artisan Care Tier',
            description: 'Covers accidental scuffs, deep leather staining, and premature sole or welt separation. Includes complimentary annual conditioning.',
            price: 2499,
            timePeriod: '12 Months',
            servicesIncluded: ['Accidental Scuffs', 'Deep Stain Extraction', 'Annual Conditioning', 'Sole & Welt Separation'],
            copay: '₹499'
          },
          {
            id: 'plan-2',
            name: 'The Executive Travel Tier',
            description: 'Adds coverage for transit damage, airline loss, and accidental liquid/chemical spills.',
            price: 4999,
            timePeriod: '24 Months',
            servicesIncluded: ['Transit Damage', 'Airline Loss', 'Chemical Spill Protection', 'Bi-annual Deep Shine'],
            copay: '₹999'
          },
          {
            id: 'plan-3',
            name: 'The Heritage Vault Tier',
            description: 'Full replacement or expert restoration coverage against fire, theft, water damage, or catastrophic leather degradation.',
            price: 9999,
            timePeriod: 'Lifetime',
            servicesIncluded: ['Fire & Water Damage', 'Catastrophic Degradation', 'Theft Protection', 'Unlimited Restorations'],
            copay: '₹1,999'
          }
        ],
        offers: [
          { id: '1', name: 'Welcome 10%', code: 'WELCOME10', discountPercentage: 10 },
          { id: '2', name: 'Artisan 20%', code: 'ARTISAN20', discountPercentage: 20 }
        ],
        shoeCarePackages: [
          { id: '1', name: 'The Refresh & Polish', description: 'Deep leather cleansing, conditioning, minor scuff removal, edge dressing, and a hand-burnished cream polish finish.', price: 2499 },
          { id: '2', name: 'The Signature Recrafting', description: 'Includes everything in the Refresh package, plus a full out-sole replacement and new premium stacked leather heel blocks.', price: 8999 },
          { id: '3', name: 'The Master Restoration', description: 'A complete strip-down and rebuilding of the shoe, full re-sole, interior lining repair, and a complete hand-dyed patina restoration.', price: 14999 }
        ],
        employees: [
          { id: 'SP-001', name: 'Arvind Shukla', role: 'Store Lead', mobile: '', email: '' },
          { id: 'SP-002', name: 'Pooja Sharma', role: 'Specialist', mobile: '', email: '' },
          { id: 'SP-003', name: 'Rahul Deshmukh', role: 'Senior Artisan', mobile: '', email: '' }
        ],
        cobblers: [
          { id: 'C-001', name: 'Devendra Vishwakarma', specialty: 'Goodyear-Welt', mobile: '', email: '' },
          { id: 'C-002', name: 'Baldev Prasad', specialty: 'Patina Master', mobile: '', email: '' }
        ],
        repairCharges: [
          { id: '1', service: 'Heel Repair', price: 200 },
          { id: '2', service: 'Sole Repair', price: 500 }
        ],
        theme: 'olive',
        autoNotifyPickup: true
      },
      syncErrorLogs: [],
      lastSyncStatus: 'idle',
      lastSyncTime: null,

      fetchFromFirestore: async () => {
        if (!db) {
          console.warn("Firestore is not initialized. Skipping fetch.");
          return;
        }
        set({ lastSyncStatus: 'syncing' });
        try {
          const repairsSnapshot = await getDocs(collection(db, 'repairs'));
          const repairsList: ShoeRepairRequest[] = [];
          repairsSnapshot.forEach((doc) => {
            repairsList.push(doc.data() as ShoeRepairRequest);
          });

          const customersSnapshot = await getDocs(collection(db, 'customers'));
          const customersList: Customer[] = [];
          customersSnapshot.forEach((doc) => {
            customersList.push(doc.data() as Customer);
          });

          const inventorySnapshot = await getDocs(collection(db, 'inventory'));
          const inventoryList: InventoryItem[] = [];
          inventorySnapshot.forEach((doc) => {
            inventoryList.push(doc.data() as InventoryItem);
          });

          const insuranceSnapshot = await getDocs(collection(db, 'insurance'));
          const insuranceList: ShoeInsurance[] = [];
          insuranceSnapshot.forEach((doc) => {
            insuranceList.push(doc.data() as ShoeInsurance);
          });

          const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
          const appointmentsList: Appointment[] = [];
          appointmentsSnapshot.forEach((doc) => {
            appointmentsList.push(doc.data() as Appointment);
          });

          const settingsSnapshot = await getDocs(collection(db, 'settings'));
          let settingsObj: Settings | null = null;
          settingsSnapshot.forEach((doc) => {
            if (doc.id === 'global_settings') {
              settingsObj = doc.data() as Settings;
            }
          });

          if (repairsList.length > 0 || customersList.length > 0 || inventoryList.length > 0 || insuranceList.length > 0 || appointmentsList.length > 0 || settingsObj) {
            set((state) => ({
              repairs: repairsList.length > 0 ? repairsList : state.repairs,
              customers: customersList.length > 0 ? customersList : state.customers,
              inventory: inventoryList.length > 0 ? inventoryList : state.inventory,
              insurance: insuranceList.length > 0 ? insuranceList : state.insurance,
              appointments: appointmentsList.length > 0 ? appointmentsList : state.appointments,
              settings: settingsObj ? { ...state.settings, ...settingsObj } : state.settings,
              lastSyncStatus: 'success',
              lastSyncTime: new Date().toISOString()
            }));
          } else {
            set({ lastSyncStatus: 'success', lastSyncTime: new Date().toISOString() });
          }
        } catch (error: any) {
          if (error.message?.includes('client is offline')) {
            console.warn("Firestore fetch deferred: client is offline. Using local cache.");
            set({ lastSyncStatus: 'success' });
          } else {
            console.error("Failed to fetch initial data from Firestore:", error);
            set({ lastSyncStatus: 'error' });
          }
        }
      },

      addRepair: (repairData) => {
        let createdRepair: ShoeRepairRequest | null = null;
        let newCustomers: Customer[] = [];
        set((state) => {
          createdRepair = {
            ...repairData,
            id: generateId(),
            isSynced: false,
            createdAt: new Date().toISOString(),
            invoiceNumber: generateInvoice(),
            statusHistory: [{
              timestamp: new Date().toISOString(),
              user: repairData.receivedBy || 'System',
              status: repairData.status
            }]
          };
          
          const existingCustomerIndex = state.customers.findIndex(c => c.phoneNumber === repairData.phoneNumber);
          newCustomers = [...state.customers];
          
          if (existingCustomerIndex >= 0) {
            newCustomers[existingCustomerIndex] = {
              ...newCustomers[existingCustomerIndex],
              totalOrders: newCustomers[existingCustomerIndex].totalOrders + 1,
              lastVisit: new Date().toISOString()
            };
          } else {
            newCustomers.push({
              phoneNumber: repairData.phoneNumber,
              name: repairData.customerName,
              email: repairData.email,
              totalOrders: 1,
              lastVisit: new Date().toISOString()
            });
          }
          
          return {
            repairs: [createdRepair, ...state.repairs],
            customers: newCustomers
          };
        });
        
        // Write to Firestore asynchronously
        if (createdRepair && db) {
          const rep = createdRepair as ShoeRepairRequest;
          setDoc(doc(db, 'repairs', rep.id), rep).catch(e => console.error("Firestore repairs set failed", e));
          
          const cust = newCustomers.find(c => c.phoneNumber === rep.phoneNumber);
          if (cust) {
            setDoc(doc(db, 'customers', cust.phoneNumber), cust).catch(e => console.error("Firestore customers set failed", e));
          }
        }
        
        // Trigger background sync to Google Sheets
        setTimeout(async () => {
          if (createdRepair) {
            await get().addNotification({
              title: 'New Repair Created',
              message: `Ticket ${createdRepair.invoiceNumber} for ${createdRepair.customerName} has been recorded.`,
              type: 'info'
            });
          }
          get().syncAllPending().catch(err => console.error("Auto sync failed:", err));
        }, 100);

        return createdRepair!;
      },
      
      updateRepairStatus: (id, status) => {
        let updatedRepair: ShoeRepairRequest | undefined;
        const settings = get().settings;
        set((state) => {
          const newRepairs = state.repairs.map(r => {
            if (r.id === id) {
              updatedRepair = { 
                ...r, 
                status, 
                isSynced: false,
                statusHistory: [...r.statusHistory, {
                  timestamp: new Date().toISOString(),
                  user: 'Staff',
                  status
                }]
              };
              return updatedRepair;
            }
            return r;
          });
          return { repairs: newRepairs };
        });

        if (updatedRepair && db) {
          const rep = updatedRepair as ShoeRepairRequest;
          setDoc(doc(db, 'repairs', id), rep).catch(e => console.error("Firestore repairs update status failed", e));
        }

        if (status === 'Completed' && updatedRepair && settings.autoNotifyPickup) {
          NotificationService.sendStatusUpdateEmail(updatedRepair, settings);
          NotificationService.sendStatusUpdateSms(updatedRepair, settings);
        }

        // Trigger background sync to Google Sheets
        setTimeout(async () => {
          if (updatedRepair) {
            await get().addNotification({
              title: 'Status Updated',
              message: `Ticket ${(updatedRepair as ShoeRepairRequest).invoiceNumber} is now ${status}.`,
              type: 'info'
            });
          }
          get().syncAllPending().catch(err => console.error("Auto sync failed:", err));
        }, 100);
      },

      updateRepair: (id, data) => {
        let updatedRepair: ShoeRepairRequest | undefined;
        set((state) => {
          const newRepairs = state.repairs.map(r => {
            if (r.id === id) {
              updatedRepair = { ...r, ...data, isSynced: false };
              return updatedRepair;
            }
            return r;
          });
          return { repairs: newRepairs };
        });

        if (updatedRepair && db) {
          setDoc(doc(db, 'repairs', id), updatedRepair).catch(e => console.error("Firestore repairs update failed", e));
        }

        // Trigger background sync to Google Sheets
        setTimeout(() => {
          get().syncAllPending().catch(err => console.error("Auto sync failed:", err));
        }, 100);
      },

      deleteRepair: (id) => {
        set((state) => ({
          repairs: state.repairs.filter(r => r.id !== id)
        }));
        if (db) {
          deleteDoc(doc(db, 'repairs', id)).catch(e => console.error("Firestore repairs delete failed", e));
        }
      },
      
      syncAllPending: async () => {
        const { settings, repairs } = get();
        if (settings.isOfflineMode) return;
        
        const pending = repairs.filter(r => !r.isSynced);
        if (pending.length === 0) {
          set({ lastSyncStatus: 'success', lastSyncTime: new Date().toISOString() });
          return;
        }
        
        set({ lastSyncStatus: 'syncing' });
        
        try {
          if (settings.googleSheetsWebAppUrl) {
            console.log('Syncing to Google Sheets via Proxy', pending);
            const response = await fetch('/api/sync/google-sheets', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: settings.googleSheetsWebAppUrl,
                payload: {
                  action: 'syncRepairs',
                  repairs: pending.map(r => ({
                    invoiceNumber: r.invoiceNumber,
                    date: r.createdAt,
                    customerName: r.customerName,
                    phoneNumber: r.phoneNumber,
                    email: r.email,
                    shoeModel: r.shoeModel,
                    price: r.price,
                    status: r.status,
                    repairType: r.repairType,
                    advance: r.advance,
                    receivedBy: r.receivedBy
                  }))
                }
              })
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
              throw new Error(errorData.error || `Server returned ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
              throw new Error(result.data?.message || result.error || "Failed to sync to Google Sheets");
            }
          } else {
            throw new Error("Google Sheets Web App URL is not configured in settings.");
          }
          
          set((state) => ({
            lastSyncStatus: 'success',
            lastSyncTime: new Date().toISOString(),
            repairs: state.repairs.map(r => {
              if (pending.some(p => p.id === r.id)) {
                return { ...r, isSynced: true };
              }
              return r;
            })
          }));

          await get().addNotification({
            title: 'Sync Successful',
            message: `Synchronized ${pending.length} repairs to Google Sheets.`,
            type: 'success'
          });
        } catch (error: any) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error("Failed to sync to Google Sheets:", errorMessage);
          
          set((state) => ({
            lastSyncStatus: 'error',
            syncErrorLogs: [
              {
                id: generateId(),
                timestamp: new Date().toISOString(),
                message: errorMessage,
                payloadCount: pending.length
              },
              ...state.syncErrorLogs
            ].slice(0, 50) // Keep last 50 logs max
          }));
          
          await get().addNotification({
            title: 'Sync Failed',
            message: `Failed to synchronize repairs: ${errorMessage}`,
            type: 'error'
          });
          
          throw error;
        }
      },

      clearSyncErrorLogs: () => set({ syncErrorLogs: [] }),
      
      addCustomer: (customer) => {
        set((state) => ({
          customers: [...state.customers, customer]
        }));
        if (db) {
          setDoc(doc(db, 'customers', customer.phoneNumber), customer).catch(e => console.error("Firestore customer add failed", e));
        }
      },
      
      updateCustomer: (phone, data) => {
        let updatedCustomer: Customer | undefined;
        set((state) => {
          const newCustomers = state.customers.map(c => {
            if (c.phoneNumber === phone) {
              updatedCustomer = { ...c, ...data };
              return updatedCustomer;
            }
            return c;
          });
          return { customers: newCustomers };
        });
        if (updatedCustomer && db) {
          setDoc(doc(db, 'customers', phone), updatedCustomer).catch(e => console.error("Firestore customer update failed", e));
        }
      },
      
      addInventoryItem: (item) => {
        const id = generateId();
        const newItem = { ...item, id };
        set((state) => ({
          inventory: [...state.inventory, newItem]
        }));
        if (db) {
          setDoc(doc(db, 'inventory', id), newItem).catch(e => console.error("Firestore inventory add failed", e));
        }
      },
      
      updateInventoryItem: (id, data) => {
        let updatedItem: InventoryItem | undefined;
        set((state) => {
          const newInventory = state.inventory.map(i => {
            if (i.id === id) {
              updatedItem = { ...i, ...data };
              return updatedItem;
            }
            return i;
          });
          return { inventory: newInventory };
        });
        if (updatedItem && db) {
          setDoc(doc(db, 'inventory', id), updatedItem).catch(e => console.error("Firestore inventory update failed", e));
        }
      },
      
      deleteInventoryItem: (id) => {
        set((state) => ({
          inventory: state.inventory.filter(i => i.id !== id)
        }));
        if (db) {
          deleteDoc(doc(db, 'inventory', id)).catch(e => console.error("Firestore inventory delete failed", e));
        }
      },
      
      addInsurance: (policy) => {
        const id = generateId();
        const createdAt = new Date().toISOString();
        const newPolicy = { ...policy, id, createdAt };
        set((state) => ({
          insurance: [...state.insurance, newPolicy]
        }));
        if (db) {
          setDoc(doc(db, 'insurance', id), newPolicy).catch(e => console.error("Firestore insurance add failed", e));
        }
      },

      updateInsurance: (id, data) => {
        let updatedInsurance: ShoeInsurance | undefined;
        set((state) => {
          const newInsurance = state.insurance.map(i => {
            if (i.id === id) {
              updatedInsurance = { ...i, ...data };
              return updatedInsurance;
            }
            return i;
          });
          return { insurance: newInsurance };
        });
        if (updatedInsurance && db) {
          setDoc(doc(db, 'insurance', id), updatedInsurance).catch(e => console.error("Firestore insurance update failed", e));
        }
      },

      deleteInsurance: (id) => {
        set((state) => ({
          insurance: state.insurance.filter(i => i.id !== id)
        }));
        if (db) {
          deleteDoc(doc(db, 'insurance', id)).catch(e => console.error("Firestore insurance delete failed", e));
        }
      },

      addAppointment: async (appointmentData) => {
        const id = generateId();
        const createdAt = new Date().toISOString();
        const newAppointment: Appointment = {
          ...appointmentData,
          id,
          status: 'Pending',
          createdAt
        };
        
        set((state) => ({
          appointments: [newAppointment, ...state.appointments]
        }));
        
        if (db) {
          try {
            await setDoc(doc(db, 'appointments', id), newAppointment);
            
            // Add notification for the artisan
            await get().addNotification({
              title: 'New Appointment Booked',
              message: `${newAppointment.customerName} has scheduled a ${newAppointment.serviceType} for ${format(parseISO(newAppointment.date), 'MMM dd')} at ${newAppointment.time}.`,
              type: 'info'
            });
          } catch (e) {
            console.error("Firestore appointment add failed", e);
          }
        }
      },

      updateAppointment: (id, data) => {
        let updatedAppointment: Appointment | undefined;
        set((state) => {
          const newAppointments = state.appointments.map(a => {
            if (a.id === id) {
              updatedAppointment = { ...a, ...data };
              return updatedAppointment;
            }
            return a;
          });
          return { appointments: newAppointments };
        });
        if (updatedAppointment && db) {
          setDoc(doc(db, 'appointments', id), updatedAppointment).catch(e => console.error("Firestore appointment update failed", e));
        }
      },

      deleteAppointment: (id) => {
        set((state) => ({
          appointments: state.appointments.filter(a => a.id !== id)
        }));
        if (db) {
          deleteDoc(doc(db, 'appointments', id)).catch(e => console.error("Firestore appointment delete failed", e));
        }
      },
      
      updateSettings: (newSettings) => {
        set((state) => {
          const updatedSettings = { ...state.settings, ...newSettings };
          if (db) {
            setDoc(doc(db, 'settings', 'global_settings'), updatedSettings).catch(e => console.error("Firestore settings update failed", e));
          }
          return { settings: updatedSettings };
        });
      },

      setUser: async (user) => {
        set({ user });
        if (user && db) {
          try {
            // Sync profile
            const profileRef = doc(db, 'profiles', user.uid);
            const profileSnap = await getDoc(profileRef);
            if (!profileSnap.exists()) {
              const initialProfile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || user.email?.split('@')[0] || 'Artisan',
                role: 'cobbler',
                createdAt: new Date().toISOString()
              };
              await setDoc(profileRef, initialProfile);
            }
          } catch (error: any) {
            if (error.message?.includes('client is offline')) {
              console.warn("Profile sync deferred: client is offline.");
            } else {
              console.error("Profile sync failed:", error);
            }
          }
        }
      },

      addVoiceNote: (repairId, voiceNoteData) => {
        const id = generateId();
        const newVoiceNote = { ...voiceNoteData, id };
        
        let updatedRepair: ShoeRepairRequest | undefined;
        set((state) => {
          const newRepairs = state.repairs.map(r => {
            if (r.id === repairId) {
              const voiceNotes = r.voiceNotes ? [...r.voiceNotes, newVoiceNote] : [newVoiceNote];
              updatedRepair = { ...r, voiceNotes, isSynced: false };
              return updatedRepair;
            }
            return r;
          });
          return { repairs: newRepairs };
        });

        if (updatedRepair && db) {
          setDoc(doc(db, 'repairs', repairId), updatedRepair).catch(e => console.error("Firestore voice note add failed", e));
        }
      },

      deleteVoiceNote: (repairId, noteId) => {
        let updatedRepair: ShoeRepairRequest | undefined;
        set((state) => {
          const newRepairs = state.repairs.map(r => {
            if (r.id === repairId) {
              const voiceNotes = r.voiceNotes?.filter(n => n.id !== noteId) || [];
              updatedRepair = { ...r, voiceNotes, isSynced: false };
              return updatedRepair;
            }
            return r;
          });
          return { repairs: newRepairs };
        });

        if (updatedRepair && db) {
          setDoc(doc(db, 'repairs', repairId), updatedRepair).catch(e => console.error("Firestore voice note delete failed", e));
        }
      },

      addNotification: async (notificationData) => {
        const user = get().user;
        if (!user || !db) return;

        const id = generateId();
        const notification: AppNotification = {
          ...notificationData,
          id,
          userId: user.uid,
          read: false,
          createdAt: new Date().toISOString()
        };

        try {
          await setDoc(doc(db, 'notifications', id), notification);
        } catch (e) {
          console.error("Failed to add notification:", e);
        }
      },
    }),
    {
      name: 'cobbler-storage',
    }
  )
);
