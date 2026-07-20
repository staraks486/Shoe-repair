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
  Appointment,
  StoreDetails
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
  userProfile: UserProfile | null;
  repairs: ShoeRepairRequest[];
  customers: Customer[];
  inventory: InventoryItem[];
  insurance: ShoeInsurance[];
  appointments: Appointment[];
  settings: Settings;
  syncErrorLogs: Array<{ id: string; timestamp: string; message: string; payloadCount: number }>;
  lastSyncStatus: 'idle' | 'success' | 'error' | 'syncing';
  lastSyncTime: string | null;
  stores: StoreDetails[];
  currentStoreId: string;
  
  setUser: (user: User | null) => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  fetchFromFirestore: () => Promise<void>;
  addRepair: (repair: Omit<ShoeRepairRequest, 'id' | 'isSynced' | 'createdAt' | 'invoiceNumber'>) => ShoeRepairRequest;
  updateRepairStatus: (id: string, status: ShoeRepairRequest['status']) => void;
  updateRepair: (id: string, data: Partial<ShoeRepairRequest>) => void;
  deleteRepair: (id: string) => void;
  syncAllPending: () => Promise<void>;
  clearSyncErrorLogs: () => void;
  
  addCustomer: (customer: Customer) => void;
  updateCustomer: (phoneNumber: string, data: Partial<Customer>) => void;
  deleteCustomer: (phoneNumber: string) => void;
  
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
  setCurrentStoreId: (storeId: string) => Promise<void>;
  addStore: (store: Omit<StoreDetails, 'id'>) => Promise<void>;
  updateStore: (id: string, store: Partial<StoreDetails>) => Promise<void>;
  deleteStore: (id: string) => Promise<void>;
  
  backups: Array<{ id: string; name: string; type: 'store' | 'app'; timestamp: string; data: any }>;
  createStoreBackup: (storeId: string) => Promise<any>;
  createAppBackup: () => Promise<any>;
  importBackup: (backupData: any) => Promise<void>;
  deleteBackupRecord: (backupId: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);
const generateInvoice = () => 'INV-' + Math.floor(100000 + Math.random() * 900000);

function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as any;
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          newObj[key] = cleanUndefined(val);
        }
      }
    }
    return newObj;
  }
  return obj;
}

const safeSetDoc = (docRef: any, data: any) => {
  return setDoc(docRef, cleanUndefined(data));
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      userProfile: null,
      repairs: [],
      customers: [],
      stores: [],
      currentStoreId: '',
      backups: [],
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
        whatsappIntakeTemplate: '*CORDWAINERS CARE - OFFICIAL INTAKE CONFIRMATION*\n\nHello *{customerName}*, your footwear ({shoeModel}) has been registered successfully for luxury restoration!\n\n*Ticket ID:* {invoiceNumber}\n*Status:* Received\n\n*TOTAL RESTORATION COST:* ₹{price}\n\nView Terms & Conditions: https://cordwainers.com/care-terms\nThank you for trusting Cordwainers Studio!',
        whatsappReadyTemplate: 'Great news {customerName}! Your {shoeModel} is ready for pickup. \n\n*Balance due:* ₹{balance}\n*Ticket ID:* {invoiceNumber}\n\nPlease visit the studio at your convenience. Thank you!',
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
        autoNotifyPickup: true,
        giftCards: [
          {
            id: 'gc-1',
            code: 'ARTISAN-GIFT-5000',
            recipientName: 'Sumit Saxena',
            amount: 5000,
            balance: 5000,
            message: 'To the craft that stays forever. Happy walking!',
            designTheme: 'gold',
            imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop',
            createdAt: '2026-07-15T12:00:00Z'
          },
          {
            id: 'gc-2',
            code: 'CORDWAINER-999',
            recipientName: 'Preeti Roy',
            amount: 2500,
            balance: 2500,
            message: 'In deep appreciation of artisan shoemaking and restoration craftsmanship.',
            designTheme: 'artisan',
            imageUrl: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=600&auto=format&fit=crop',
            createdAt: '2026-07-18T10:30:00Z'
          }
        ]
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
          // 1. Fetch all stores from the central "stores" collection
          const storesSnapshot = await getDocs(collection(db, 'stores'));
          const fetchedStores: StoreDetails[] = [];
          storesSnapshot.forEach((doc) => {
            const data = doc.data();
            fetchedStores.push({
              id: doc.id,
              storeName: data.storeName || 'Cordwainers Studio',
              address: data.address || '123 Main St, Cityville',
              hours: data.hours || 'Mon-Sat: 9AM - 6PM',
              phone: data.phone || '',
              logoUrl: data.logoUrl || '',
              paymentLink: data.paymentLink || '',
              qrCode: data.qrCode || '',
              createdAt: data.createdAt || new Date().toISOString()
            });
          });

          // 2. If no stores exist, create the default store
          if (fetchedStores.length === 0) {
            const defaultStore: StoreDetails = {
              id: 'default',
              storeName: 'Cordwainers Studio',
              address: '123 Main St, Cityville',
              hours: 'Mon-Sat: 9AM - 6PM',
              phone: '',
              logoUrl: '',
              paymentLink: '',
              qrCode: '',
              createdAt: new Date().toISOString()
            };
            await safeSetDoc(doc(db, 'stores', 'default'), defaultStore);
            fetchedStores.push(defaultStore);
          }

          set({ stores: fetchedStores });

          // 3. Resolve active store ID
          let storeId = get().currentStoreId;
          if (!storeId || !fetchedStores.some(s => s.id === storeId)) {
            storeId = fetchedStores[0].id;
            set({ currentStoreId: storeId });
          }

          // 4. Fetch the specific subcollections for this store!
          const [
            repairsSnapshot,
            customersSnapshot,
            inventorySnapshot,
            insuranceSnapshot,
            appointmentsSnapshot,
            settingsSnapshot
          ] = await Promise.all([
            getDocs(collection(db, 'stores', storeId, 'repairs')),
            getDocs(collection(db, 'stores', storeId, 'customers')),
            getDocs(collection(db, 'stores', storeId, 'inventory')),
            getDocs(collection(db, 'stores', storeId, 'insurance')),
            getDocs(collection(db, 'stores', storeId, 'appointments')),
            getDocs(collection(db, 'stores', storeId, 'settings'))
          ]);

          const repairsList: ShoeRepairRequest[] = [];
          repairsSnapshot.forEach((doc) => {
            repairsList.push(doc.data() as ShoeRepairRequest);
          });

          const customersList: Customer[] = [];
          customersSnapshot.forEach((doc) => {
            customersList.push(doc.data() as Customer);
          });

          const inventoryList: InventoryItem[] = [];
          inventorySnapshot.forEach((doc) => {
            inventoryList.push(doc.data() as InventoryItem);
          });

          const insuranceList: ShoeInsurance[] = [];
          insuranceSnapshot.forEach((doc) => {
            insuranceList.push(doc.data() as ShoeInsurance);
          });

          const appointmentsList: Appointment[] = [];
          appointmentsSnapshot.forEach((doc) => {
            appointmentsList.push(doc.data() as Appointment);
          });

          let settingsObj: Settings | null = null;
          settingsSnapshot.forEach((doc) => {
            if (doc.id === 'global_settings') {
              settingsObj = doc.data() as Settings;
            }
          });

          set((state) => ({
            repairs: repairsList,
            customers: customersList,
            inventory: inventoryList.length > 0 ? inventoryList : state.inventory,
            insurance: insuranceList,
            appointments: appointmentsList,
            settings: settingsObj ? { ...state.settings, ...settingsObj } : state.settings,
            lastSyncStatus: 'success',
            lastSyncTime: new Date().toISOString()
          }));
        } catch (error: any) {
          const isOffline = error.message?.includes('offline') || 
                            error.message?.includes('network') || 
                            error.code === 'unavailable' || 
                            error.code === 'deadline-exceeded';

          if (isOffline) {
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
          const storeId = get().currentStoreId || 'default';
          const rep = createdRepair as ShoeRepairRequest;
          safeSetDoc(doc(db, 'stores', storeId, 'repairs', rep.id), rep).catch(e => console.error("Firestore repairs set failed", e));
          
          const cust = newCustomers.find(c => c.phoneNumber === rep.phoneNumber);
          if (cust) {
            safeSetDoc(doc(db, 'stores', storeId, 'customers', cust.phoneNumber), cust).catch(e => console.error("Firestore customers set failed", e));
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
          const storeId = get().currentStoreId || 'default';
          const rep = updatedRepair as ShoeRepairRequest;
          safeSetDoc(doc(db, 'stores', storeId, 'repairs', id), rep).catch(e => console.error("Firestore repairs update status failed", e));
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
          const storeId = get().currentStoreId || 'default';
          safeSetDoc(doc(db, 'stores', storeId, 'repairs', id), updatedRepair).catch(e => console.error("Firestore repairs update failed", e));
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
          const storeId = get().currentStoreId || 'default';
          deleteDoc(doc(db, 'stores', storeId, 'repairs', id)).catch(e => console.error("Firestore repairs delete failed", e));
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
          const storeId = get().currentStoreId || 'default';
          safeSetDoc(doc(db, 'stores', storeId, 'customers', customer.phoneNumber), customer).catch(e => console.error("Firestore customer add failed", e));
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
          const storeId = get().currentStoreId || 'default';
          safeSetDoc(doc(db, 'stores', storeId, 'customers', phone), updatedCustomer).catch(e => console.error("Firestore customer update failed", e));
        }
      },

      deleteCustomer: (phone) => {
        set((state) => ({
          customers: state.customers.filter(c => c.phoneNumber !== phone)
        }));
        if (db) {
          const storeId = get().currentStoreId || 'default';
          deleteDoc(doc(db, 'stores', storeId, 'customers', phone)).catch(e => console.error("Firestore customer delete failed", e));
        }
      },
      
      addInventoryItem: (item) => {
        const id = generateId();
        const newItem = { ...item, id };
        set((state) => ({
          inventory: [...state.inventory, newItem]
        }));
        if (db) {
          const storeId = get().currentStoreId || 'default';
          safeSetDoc(doc(db, 'stores', storeId, 'inventory', id), newItem).catch(e => console.error("Firestore inventory add failed", e));
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
          const storeId = get().currentStoreId || 'default';
          safeSetDoc(doc(db, 'stores', storeId, 'inventory', id), updatedItem).catch(e => console.error("Firestore inventory update failed", e));
        }
      },
      
      deleteInventoryItem: (id) => {
        set((state) => ({
          inventory: state.inventory.filter(i => i.id !== id)
        }));
        if (db) {
          const storeId = get().currentStoreId || 'default';
          deleteDoc(doc(db, 'stores', storeId, 'inventory', id)).catch(e => console.error("Firestore inventory delete failed", e));
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
          const storeId = get().currentStoreId || 'default';
          safeSetDoc(doc(db, 'stores', storeId, 'insurance', id), newPolicy).catch(e => console.error("Firestore insurance add failed", e));
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
          const storeId = get().currentStoreId || 'default';
          safeSetDoc(doc(db, 'stores', storeId, 'insurance', id), updatedInsurance).catch(e => console.error("Firestore insurance update failed", e));
        }
      },

      deleteInsurance: (id) => {
        set((state) => ({
          insurance: state.insurance.filter(i => i.id !== id)
        }));
        if (db) {
          const storeId = get().currentStoreId || 'default';
          deleteDoc(doc(db, 'stores', storeId, 'insurance', id)).catch(e => console.error("Firestore insurance delete failed", e));
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
            const storeId = get().currentStoreId || 'default';
            await safeSetDoc(doc(db, 'stores', storeId, 'appointments', id), newAppointment);
            
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
          const storeId = get().currentStoreId || 'default';
          safeSetDoc(doc(db, 'stores', storeId, 'appointments', id), updatedAppointment).catch(e => console.error("Firestore appointment update failed", e));
        }
      },

      deleteAppointment: (id) => {
        set((state) => ({
          appointments: state.appointments.filter(a => a.id !== id)
        }));
        if (db) {
          const storeId = get().currentStoreId || 'default';
          deleteDoc(doc(db, 'stores', storeId, 'appointments', id)).catch(e => console.error("Firestore appointment delete failed", e));
        }
      },
      
      updateSettings: (newSettings) => {
        const profile = get().userProfile;
        if (profile && profile.role !== 'Admin' && !profile.isAdmin) {
          console.warn("[SECURITY] Blocked updateSettings from guest/demo user profile:", profile.email);
          return;
        }

        set((state) => {
          const updatedSettings = { ...state.settings, ...newSettings };
          if (db) {
            const storeId = get().currentStoreId || 'default';
            safeSetDoc(doc(db, 'stores', storeId, 'settings', 'global_settings'), updatedSettings).catch(e => console.error("Firestore settings update failed", e));
          }
          return { settings: updatedSettings };
        });
      },

      setUser: async (user) => {
        set({ user });
        if (user) {
          const isAdminEmail = user.email === 'star.aks486@gmail.com' || user.email === 'admin@cordwainers.local';
          const defaultProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'Artisan',
            createdAt: new Date().toISOString(),
            role: isAdminEmail ? 'Admin' : 'Staff',
            isAdmin: isAdminEmail
          };

          if (user.uid.startsWith('mock-') || !db) {
            set({ userProfile: defaultProfile });
            return;
          }

          try {
            // Sync profile
            const profileRef = doc(db, 'profiles', user.uid);
            const profileSnap = await getDoc(profileRef);
            let profile: UserProfile;

            if (!profileSnap.exists()) {
              profile = defaultProfile;
              await safeSetDoc(profileRef, profile);
            } else {
              profile = profileSnap.data() as UserProfile;
              if (isAdminEmail && (!profile.role || !profile.isAdmin)) {
                profile.role = 'Admin';
                profile.isAdmin = true;
                await safeSetDoc(profileRef, profile);
              }
            }
            set({ userProfile: profile });
          } catch (error: any) {
            const isOffline = error.message?.includes('offline') || 
                              error.message?.includes('network') || 
                              error.code === 'unavailable' || 
                              error.code === 'deadline-exceeded';
                              
            if (isOffline) {
              console.warn("Profile sync deferred: client is offline. Using local or cached profile.");
            } else {
              console.error("Profile sync failed:", error);
            }
            // Always set fallback profile so application keeps working
            if (!get().userProfile) {
              set({ userProfile: defaultProfile });
            }
          }
        } else {
          set({ userProfile: null });
        }
      },

      updateProfile: async (data) => {
        const { user, userProfile } = get();
        if (!user || !userProfile || !db) return;

        const updatedProfile = { ...userProfile, ...data };
        set({ userProfile: updatedProfile });

        try {
          await safeSetDoc(doc(db, 'profiles', user.uid), updatedProfile);
        } catch (e) {
          console.error("Failed to update profile:", e);
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
          const storeId = get().currentStoreId || 'default';
          safeSetDoc(doc(db, 'stores', storeId, 'repairs', repairId), updatedRepair).catch(e => console.error("Firestore voice note add failed", e));
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
          const storeId = get().currentStoreId || 'default';
          safeSetDoc(doc(db, 'stores', storeId, 'repairs', repairId), updatedRepair).catch(e => console.error("Firestore voice note delete failed", e));
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
          const storeId = get().currentStoreId || 'default';
          await safeSetDoc(doc(db, 'stores', storeId, 'notifications', id), notification);
        } catch (e) {
          console.error("Failed to add notification:", e);
        }
      },

      setCurrentStoreId: async (storeId) => {
        set({ currentStoreId: storeId });
        await get().fetchFromFirestore();
      },

      addStore: async (storeData) => {
        const profile = get().userProfile;
        if (profile && profile.role !== 'Admin' && !profile.isAdmin) {
          console.warn("[SECURITY] Blocked addStore from guest/demo user profile");
          return;
        }
        if (!db) return;
        const id = generateId();
        const newStore: StoreDetails = {
          ...storeData,
          id,
          createdAt: new Date().toISOString()
        };
        await safeSetDoc(doc(db, 'stores', id), newStore);

        // Save custom settings for this new store using the active defaults
        const defaultSettings = get().settings;
        const storeSettings = {
          ...defaultSettings,
          storeName: storeData.storeName,
          address: storeData.address,
          hours: storeData.hours,
          phone: storeData.phone || ''
        };
        await safeSetDoc(doc(db, 'stores', id, 'settings', 'global_settings'), storeSettings);

        set((state) => ({
          stores: [...state.stores, newStore]
        }));
      },

      updateStore: async (id, storeData) => {
        const profile = get().userProfile;
        if (profile && profile.role !== 'Admin' && !profile.isAdmin) {
          console.warn("[SECURITY] Blocked updateStore from guest/demo user profile");
          return;
        }
        if (!db) return;
        const existingStore = get().stores.find(s => s.id === id);
        if (!existingStore) return;

        const updatedStore = {
          ...existingStore,
          ...storeData
        };
        await safeSetDoc(doc(db, 'stores', id), updatedStore);

        if (id === get().currentStoreId) {
          get().updateSettings({
            storeName: updatedStore.storeName,
            address: updatedStore.address,
            hours: updatedStore.hours,
          });
        }

        set((state) => ({
          stores: state.stores.map(s => s.id === id ? updatedStore : s)
        }));
      },

      deleteStore: async (id) => {
        const profile = get().userProfile;
        if (profile && profile.role !== 'Admin' && !profile.isAdmin) {
          console.warn("[SECURITY] Blocked deleteStore from guest/demo user profile");
          return;
        }
        if (!db) return;
        if (get().stores.length <= 1) {
          alert("Cannot delete the only registered store location.");
          return;
        }

        try {
          const storeToBackup = get().stores.find(s => s.id === id);
          const storeName = storeToBackup?.storeName || 'Unnamed Store';
          
          // 1. Take a full store backup before deletion
          const backupData = await get().createStoreBackup(id);
          if (backupData) {
            const backupId = generateId();
            const newBackup = {
              id: backupId,
              name: `Pre-deletion Backup: ${storeName}`,
              type: 'store' as const,
              timestamp: new Date().toISOString(),
              data: backupData
            };
            
            set((state) => ({
              backups: [newBackup, ...(state.backups || [])]
            }));

            // Also trigger an automatic file download
            try {
              const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(backupData, null, 2)
              )}`;
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute('href', jsonString);
              downloadAnchor.setAttribute('download', `store_backup_${storeName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            } catch (downloadErr) {
              console.error("Auto download failed, saved in app backups list.", downloadErr);
            }
          }

          // 2. Proceed with Firestore deletion
          await deleteDoc(doc(db, 'stores', id));
          
          let nextStoreId = get().currentStoreId;
          const updatedStores = get().stores.filter(s => s.id !== id);
          
          if (get().currentStoreId === id) {
            nextStoreId = updatedStores[0]?.id || 'default';
          }

          set({
            stores: updatedStores,
            currentStoreId: nextStoreId
          });

          // Fetch the database details for the active store if switched
          await get().fetchFromFirestore();
        } catch (error) {
          console.error("Firestore store delete failed", error);
        }
      },

      createStoreBackup: async (storeId) => {
        if (!db) return null;
        try {
          const storeDoc = await getDoc(doc(db, 'stores', storeId));
          const storeDetails = storeDoc.exists() ? storeDoc.data() : null;
          
          const [
            repairsSnapshot,
            customersSnapshot,
            inventorySnapshot,
            insuranceSnapshot,
            appointmentsSnapshot,
            settingsSnapshot
          ] = await Promise.all([
            getDocs(collection(db, 'stores', storeId, 'repairs')),
            getDocs(collection(db, 'stores', storeId, 'customers')),
            getDocs(collection(db, 'stores', storeId, 'inventory')),
            getDocs(collection(db, 'stores', storeId, 'insurance')),
            getDocs(collection(db, 'stores', storeId, 'appointments')),
            getDocs(collection(db, 'stores', storeId, 'settings'))
          ]);

          const repairsList: any[] = [];
          repairsSnapshot.forEach(d => repairsList.push(d.data()));

          const customersList: any[] = [];
          customersSnapshot.forEach(d => customersList.push(d.data()));

          const inventoryList: any[] = [];
          inventorySnapshot.forEach(d => inventoryList.push(d.data()));

          const insuranceList: any[] = [];
          insuranceSnapshot.forEach(d => insuranceList.push(d.data()));

          const appointmentsList: any[] = [];
          appointmentsSnapshot.forEach(d => appointmentsList.push(d.data()));

          const settingsList: any[] = [];
          settingsSnapshot.forEach(d => settingsList.push({ id: d.id, ...d.data() }));

          return {
            version: '1.0',
            storeId,
            storeDetails,
            repairs: repairsList,
            customers: customersList,
            inventory: inventoryList,
            insurance: insuranceList,
            appointments: appointmentsList,
            settings: settingsList
          };
        } catch (error) {
          console.error("Store backup failed, attempting in-memory fallback:", error);
          
          // Fallback logic for offline mode
          if (storeId === get().currentStoreId) {
            const storeToBackup = get().stores.find(s => s.id === storeId);
            const storeDetails = storeToBackup ? {
              storeName: storeToBackup.storeName,
              address: storeToBackup.address,
              hours: storeToBackup.hours,
              phone: storeToBackup.phone || '',
              logoUrl: storeToBackup.logoUrl || '',
              paymentLink: storeToBackup.paymentLink || '',
              qrCode: storeToBackup.qrCode || '',
              createdAt: storeToBackup.createdAt || new Date().toISOString()
            } : null;

            return {
              version: '1.0',
              storeId,
              storeDetails,
              repairs: get().repairs || [],
              customers: get().customers || [],
              inventory: get().inventory || [],
              insurance: get().insurance || [],
              appointments: get().appointments || [],
              settings: get().settings ? [{ id: 'general', ...get().settings }] : []
            };
          }

          // If different store, try to use its stored details from State
          const storeToBackup = get().stores.find(s => s.id === storeId);
          if (storeToBackup) {
            return {
              version: '1.0',
              storeId,
              storeDetails: {
                storeName: storeToBackup.storeName,
                address: storeToBackup.address,
                hours: storeToBackup.hours,
                phone: storeToBackup.phone || '',
                logoUrl: storeToBackup.logoUrl || '',
                paymentLink: storeToBackup.paymentLink || '',
                qrCode: storeToBackup.qrCode || '',
                createdAt: storeToBackup.createdAt || new Date().toISOString()
              },
              repairs: [],
              customers: [],
              inventory: [],
              insurance: [],
              appointments: [],
              settings: []
            };
          }

          return null;
        }
      },

      createAppBackup: async () => {
        if (!db) return null;
        try {
          const activeStores = get().stores;
          const storesBackups = [];

          for (const s of activeStores) {
            const b = await get().createStoreBackup(s.id);
            if (b) {
              storesBackups.push(b);
            }
          }

          return {
            version: '1.0',
            backupType: 'full_app',
            timestamp: new Date().toISOString(),
            stores: storesBackups,
            globalSettings: get().settings
          };
        } catch (error) {
          console.error("Full app backup failed:", error);
          return null;
        }
      },

      importBackup: async (backupData) => {
        const profile = get().userProfile;
        if (profile && profile.role !== 'Admin' && !profile.isAdmin) {
          console.warn("[SECURITY] Blocked importBackup from guest/demo user profile");
          throw new Error("Permission Denied: Only administrators can restore database configuration.");
        }
        if (!db) return;
        try {
          if (!backupData || (backupData.backupType !== 'full_app' && !backupData.storeDetails)) {
            throw new Error("Invalid backup payload format.");
          }

          const writePromises: Promise<any>[] = [];

          if (backupData.backupType === 'full_app') {
            for (const st of backupData.stores) {
              const stId = st.storeId || st.storeDetails?.id;
              if (!stId) continue;

              writePromises.push(safeSetDoc(doc(db, 'stores', stId), st.storeDetails));

              st.repairs?.forEach((rep: any) => {
                if (rep.id) writePromises.push(safeSetDoc(doc(db, 'stores', stId, 'repairs', rep.id), rep));
              });
              st.customers?.forEach((cust: any) => {
                if (cust.phoneNumber) writePromises.push(safeSetDoc(doc(db, 'stores', stId, 'customers', cust.phoneNumber), cust));
              });
              st.inventory?.forEach((inv: any) => {
                if (inv.id) writePromises.push(safeSetDoc(doc(db, 'stores', stId, 'inventory', inv.id), inv));
              });
              st.insurance?.forEach((ins: any) => {
                if (ins.id) writePromises.push(safeSetDoc(doc(db, 'stores', stId, 'insurance', ins.id), ins));
              });
              st.appointments?.forEach((app: any) => {
                if (app.id) writePromises.push(safeSetDoc(doc(db, 'stores', stId, 'appointments', app.id), app));
              });
              st.settings?.forEach((setObj: any) => {
                if (setObj.id) {
                  const { id, ...data } = setObj;
                  writePromises.push(safeSetDoc(doc(db, 'stores', stId, 'settings', id), data));
                }
              });
            }
          } else {
            const stId = backupData.storeId || backupData.storeDetails?.id;
            if (stId) {
              writePromises.push(safeSetDoc(doc(db, 'stores', stId), backupData.storeDetails));

              backupData.repairs?.forEach((rep: any) => {
                if (rep.id) writePromises.push(safeSetDoc(doc(db, 'stores', stId, 'repairs', rep.id), rep));
              });
              backupData.customers?.forEach((cust: any) => {
                if (cust.phoneNumber) writePromises.push(safeSetDoc(doc(db, 'stores', stId, 'customers', cust.phoneNumber), cust));
              });
              backupData.inventory?.forEach((inv: any) => {
                if (inv.id) writePromises.push(safeSetDoc(doc(db, 'stores', stId, 'inventory', inv.id), inv));
              });
              backupData.insurance?.forEach((ins: any) => {
                if (ins.id) writePromises.push(safeSetDoc(doc(db, 'stores', stId, 'insurance', ins.id), ins));
              });
              backupData.appointments?.forEach((app: any) => {
                if (app.id) writePromises.push(safeSetDoc(doc(db, 'stores', stId, 'appointments', app.id), app));
              });
              backupData.settings?.forEach((setObj: any) => {
                if (setObj.id) {
                  const { id, ...data } = setObj;
                  writePromises.push(safeSetDoc(doc(db, 'stores', stId, 'settings', id), data));
                }
              });
            }
          }

          await Promise.all(writePromises);
          await get().fetchFromFirestore();
        } catch (error) {
          console.error("Restore from backup failed:", error);
          throw error;
        }
      },

      deleteBackupRecord: (backupId) => {
        set((state) => ({
          backups: state.backups.filter(b => b.id !== backupId)
        }));
      },
    }),
    {
      name: 'cobbler-storage',
    }
  )
);
