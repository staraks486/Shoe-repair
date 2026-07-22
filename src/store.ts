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
  StoreDetails,
  UserCredential,
  Message
} from './types';
import { NotificationService } from './services/NotificationService';
import { db, auth, getDbForStore, getStoreCollectionRef, getStoreDocRef, markDatabaseAsFailed, isDatabaseFailed } from './services/firebase';
import { User } from 'firebase/auth';
import { format, parseISO } from 'date-fns';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  getDoc,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import {
  OfflineOperation,
  queueOfflineWrite,
  getQueuedWrites,
  removeQueuedWrite,
  clearQueue
} from './lib/offlineDb';

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
  unsubscribers: (() => void)[];
  offlineQueue: OfflineOperation[];
  profiles: UserProfile[];
  messages: Message[];
  
  setUser: (user: User | null) => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  fetchFromFirestore: () => Promise<void>;
  loadOfflineQueue: () => Promise<void>;
  processOfflineQueue: () => Promise<void>;
  performWrite: (collectionName: string, docId: string, action: 'set' | 'delete', data?: any, description?: string) => Promise<void>;
  sendMessage: (chatId: string, text: string, imageUrl?: string, quickReplyId?: string) => Promise<void>;
  markMessagesAsRead: (chatId: string) => Promise<void>;

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
  
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'status'> & { id?: string }) => Promise<void>;
  updateAppointment: (id: string, data: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  
  updateSettings: (settings: Partial<Settings>) => void;
  addVoiceNote: (repairId: string, voiceNote: Omit<VoiceNote, 'id'>) => void;
  deleteVoiceNote: (repairId: string, noteId: string) => void;
  
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt' | 'userId'>) => Promise<void>;
  setCurrentStoreId: (storeId: string) => Promise<void>;
  addStore: (store: Omit<StoreDetails, 'id'>) => Promise<void>;
  updateStore: (id: string, store: Partial<StoreDetails>) => Promise<void>;
  setDefaultStore: (id: string) => Promise<void>;
  deleteStore: (id: string) => Promise<void>;
  
  addUserCredential: (credential: UserCredential) => void;
  deleteUserCredential: (email: string) => void;
  updateUserCredential: (email: string, data: Partial<UserCredential>) => void;
  
  isPrivacyMasked: boolean;
  togglePrivacyMask: () => void;
  
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
    return (obj as any[])
      .filter(item => item !== undefined)
      .map(item => cleanUndefined(item)) as any;
  }
  if (typeof obj === 'object') {
    // Check if it's a built-in object like Date or RegExp
    if (obj instanceof Date || obj instanceof RegExp) {
      return obj;
    }
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined && val !== null) {
          const cleaned = cleanUndefined(val);
          if (cleaned !== undefined) {
            newObj[key] = cleaned;
          }
        } else if (val === null) {
          newObj[key] = null;
        }
      }
    }
    return newObj;
  }
  return obj;
}

const safeSetDoc = async (docRef: any, data: any) => {
  const cleaned = cleanUndefined(data);
  try {
    return await setDoc(docRef, cleaned);
  } catch (err) {
    console.warn("[safeSetDoc Warning] Direct write failed, attempting extreme deep clean of undefined values:", err);
    // Extreme defensive check: iterate keys on the cleaned object and delete any undefineds
    if (cleaned && typeof cleaned === 'object') {
      Object.keys(cleaned).forEach(key => {
        if ((cleaned as any)[key] === undefined) {
          delete (cleaned as any)[key];
        }
      });
    }
    return await setDoc(docRef, cleaned);
  }
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
      isPrivacyMasked: false,
      backups: [],
      unsubscribers: [],
      profiles: [],
      messages: [],
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
          { id: 'SP-001', name: 'Arvind Shukla', role: 'Store Lead', mobile: '', email: '', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' },
          { id: 'SP-002', name: 'Pooja Sharma', role: 'Specialist', mobile: '', email: '', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop' },
          { id: 'SP-003', name: 'Rahul Deshmukh', role: 'Senior Artisan', mobile: '', email: '', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop' }
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
        ],
        userCredentials: [
          { email: 'admin@cordwainers.local', password: 'artisan_cobbler_pass', role: 'Admin', displayName: 'Admin Studio', username: 'admin', mobile: '9999999999' },
          { email: 'guest@cordwainers.local', password: 'artisan_cobbler_pass', role: 'Staff', displayName: 'Guest Staff', username: 'guest', mobile: '8888888888' }
        ]
      },
      syncErrorLogs: [],
      lastSyncStatus: 'idle',
      lastSyncTime: null,
      offlineQueue: [],

      loadOfflineQueue: async () => {
        try {
          const ops = await getQueuedWrites();
          set({ offlineQueue: ops });
        } catch (err) {
          console.error("Failed to load offline queue:", err);
        }
      },

      processOfflineQueue: async () => {
        if (!navigator.onLine || !db) {
          console.log("Cannot process offline queue: currently offline or Firestore not ready.");
          return;
        }

        const ops = await getQueuedWrites();
        if (ops.length === 0) return;

        set({ lastSyncStatus: 'syncing' });
        console.log(`Processing offline sync queue of ${ops.length} operations...`);

        let successCount = 0;
        for (const op of ops) {
          try {
            let docRef;
            if (op.collectionName === 'profiles') {
              docRef = doc(db, 'profiles', op.docId);
            } else if (op.collectionName === 'notifications') {
              docRef = doc(db, 'notifications', op.docId);
            } else if (op.collectionName === 'messages') {
              docRef = doc(db, 'messages', op.docId);
            } else if (op.collectionName === 'stores') {
              docRef = doc(db, 'stores', op.docId);
            } else {
              docRef = getStoreDocRef(op.storeId, op.collectionName, op.docId);
            }

            if (op.action === 'set') {
              await safeSetDoc(docRef, op.data);
            } else {
              await deleteDoc(docRef);
            }

            await removeQueuedWrite(op.id);
            successCount++;
          } catch (err: any) {
            console.error(`Error syncing offline operation ${op.id} (${op.description}):`, err);

            // If separate database failed, mark as failed and retry immediately with default database subcollection fallback
            const isSeparateDbActive = op.storeId && op.storeId !== 'default' && op.storeId !== '(default)' && !isDatabaseFailed(op.storeId);
            if (isSeparateDbActive && op.collectionName !== 'profiles' && op.collectionName !== 'notifications' && op.collectionName !== 'messages' && op.collectionName !== 'stores') {
              markDatabaseAsFailed(op.storeId);
              try {
                const fallbackDocRef = getStoreDocRef(op.storeId, op.collectionName, op.docId);
                if (op.action === 'set') {
                  await safeSetDoc(fallbackDocRef, op.data);
                } else {
                  await deleteDoc(fallbackDocRef);
                }
                await removeQueuedWrite(op.id);
                successCount++;
                continue; // Move to next operation successfully!
              } catch (retryErr) {
                console.error(`Error retrying synced operation with fallback default database:`, retryErr);
              }
            }

            const isNetworkError = err.message?.includes('offline') || 
                                   err.message?.includes('network') || 
                                   err.code === 'unavailable' || 
                                   err.code === 'deadline-exceeded';
            if (!isNetworkError) {
              await removeQueuedWrite(op.id);
            }
          }
        }

        await get().loadOfflineQueue();
        set({ lastSyncStatus: 'success', lastSyncTime: new Date().toISOString() });

        if (successCount > 0) {
          console.log(`Successfully synchronized ${successCount} offline changes to Firebase!`);
          get().fetchFromFirestore();
          get().addNotification({
            title: 'Offline Sync Completed',
            message: `Successfully synchronized ${successCount} offline changes to Firebase!`,
            type: 'success'
          }).catch(() => {});
        }
      },

      performWrite: async (collectionName: string, docId: string, action: 'set' | 'delete', data?: any, description: string = '') => {
        const storeId = get().currentStoreId || 'default';
        const isOnline = navigator.onLine;

        if (isOnline && db) {
          try {
            let docRef;
            if (collectionName === 'profiles') {
              docRef = doc(db, 'profiles', docId);
            } else if (collectionName === 'notifications') {
              docRef = doc(db, 'notifications', docId);
            } else if (collectionName === 'messages') {
              docRef = doc(db, 'messages', docId);
            } else if (collectionName === 'stores') {
              docRef = doc(db, 'stores', docId);
            } else {
              docRef = getStoreDocRef(storeId, collectionName, docId);
            }

            if (action === 'set') {
              await safeSetDoc(docRef, data);
            } else {
              await deleteDoc(docRef);
            }
            return;
          } catch (err: any) {
            console.error(`Direct Firestore write failed for ${collectionName}/${docId}:`, err);
            // If we attempted to write to a separate database, and it failed, mark it as failed and retry with default database subcollection fallback
            const isSeparateDbActive = storeId && storeId !== 'default' && storeId !== '(default)' && !isDatabaseFailed(storeId);
            if (isSeparateDbActive && collectionName !== 'profiles' && collectionName !== 'notifications' && collectionName !== 'messages' && collectionName !== 'stores') {
              console.warn(`[FIREBASE] Writing to separate database for store "${storeId}" failed. Marking as failed and retrying with fallback default database subcollection...`);
              markDatabaseAsFailed(storeId);
              try {
                const fallbackDocRef = getStoreDocRef(storeId, collectionName, docId);
                if (action === 'set') {
                  await safeSetDoc(fallbackDocRef, data);
                } else {
                  await deleteDoc(fallbackDocRef);
                }
                return; // Successfully recovered!
              } catch (retryErr) {
                console.error(`[FIREBASE] Retry with fallback default database failed:`, retryErr);
              }
            }
          }
        }

        try {
          const queuedOp = await queueOfflineWrite({
            storeId,
            collectionName,
            docId,
            action,
            data: data ? cleanUndefined(data) : undefined,
            description: description || `${action === 'set' ? 'Save' : 'Delete'} ${collectionName} item`
          });
          console.log("Queued offline write in IndexedDB:", queuedOp);
          await get().loadOfflineQueue();

          if ('serviceWorker' in navigator) {
            try {
              const reg = await navigator.serviceWorker.ready;
              if ('sync' in reg) {
                await (reg as any).sync.register('sync-offline-data');
              }
            } catch (swErr) {
              console.warn('SW Sync registration skipped:', swErr);
            }
          }
        } catch (idbErr) {
          console.error("Failed to queue offline write in IndexedDB:", idbErr);
        }
      },

      fetchFromFirestore: async () => {
        if (!db) {
          console.warn("Firestore is not initialized. Skipping fetch.");
          return;
        }

        // Unsubscribe from any existing listeners to avoid duplicate subscriptions
        const currentUnsubscribers = get().unsubscribers || [];
        currentUnsubscribers.forEach((unsub) => {
          try {
            unsub();
          } catch (e) {
            console.error("Error unsubscribing:", e);
          }
        });
        set({ unsubscribers: [] });

        set({ lastSyncStatus: 'syncing' });
        try {
          // Resolve initial target active store ID immediately from memory/state
          let activeStoreId = get().currentStoreId || 'default';
          if (!get().currentStoreId) {
            set({ currentStoreId: activeStoreId });
          }

          const setupStoreListener = (
            colName: string, 
            onNext: (snapshot: any) => void, 
            onError: (err: any) => void
          ) => {
            return onSnapshot(collection(db, 'stores', activeStoreId, colName), onNext, onError);
          };

          const unsubRepairs = setupStoreListener('repairs', (snapshot) => {
            const repairsList: ShoeRepairRequest[] = [];
            snapshot.forEach((doc) => {
              const item = doc.data() as ShoeRepairRequest;
              if (!item.storeId || item.storeId === activeStoreId || activeStoreId === 'default' || item.storeId === 'default') {
                repairsList.push(item);
              }
            });
            if (repairsList.length === 0 && get().repairs.length > 0 && !snapshot.metadata.fromCache) {
              // Keep existing local repairs if snapshot is empty from server
              return;
            }
            repairsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            set({ repairs: repairsList, lastSyncTime: new Date().toISOString() });
          }, (error) => {
            console.error("Failed to sync repairs:", error);
          });

          const unsubCustomers = setupStoreListener('customers', (snapshot) => {
            const customersList: Customer[] = [];
            snapshot.forEach((doc) => {
              const item = doc.data() as Customer;
              if (!item.storeId || item.storeId === activeStoreId || activeStoreId === 'default' || item.storeId === 'default') {
                customersList.push(item);
              }
            });
            if (customersList.length === 0 && get().customers.length > 0 && !snapshot.metadata.fromCache) {
              return;
            }
            set({ customers: customersList });
          }, (error) => {
            console.error("Failed to sync customers:", error);
          });

          const unsubInventory = setupStoreListener('inventory', (snapshot) => {
            const inventoryList: InventoryItem[] = [];
            snapshot.forEach((doc) => {
              const item = doc.data() as InventoryItem;
              if (!item.storeId || item.storeId === activeStoreId || activeStoreId === 'default' || item.storeId === 'default') {
                inventoryList.push(item);
              }
            });
            if (inventoryList.length === 0 && get().inventory.length > 0 && !snapshot.metadata.fromCache) {
              return;
            }
            set({ inventory: inventoryList });
          }, (error) => {
            console.error("Failed to sync inventory:", error);
          });

          const unsubInsurance = setupStoreListener('insurance', (snapshot) => {
            const insuranceList: ShoeInsurance[] = [];
            snapshot.forEach((doc) => {
              const item = doc.data() as ShoeInsurance;
              if (!item.storeId || item.storeId === activeStoreId || activeStoreId === 'default' || item.storeId === 'default') {
                insuranceList.push(item);
              }
            });
            if (insuranceList.length === 0 && get().insurance.length > 0 && !snapshot.metadata.fromCache) {
              return;
            }
            set({ insurance: insuranceList });
          }, (error) => {
            console.error("Failed to sync insurance:", error);
          });

          const unsubAppointments = setupStoreListener('appointments', (snapshot) => {
            const appointmentsList: Appointment[] = [];
            snapshot.forEach((doc) => {
              const item = doc.data() as Appointment;
              if (!item.storeId || item.storeId === activeStoreId || activeStoreId === 'default' || item.storeId === 'default') {
                appointmentsList.push(item);
              }
            });
            if (appointmentsList.length === 0 && get().appointments.length > 0 && !snapshot.metadata.fromCache) {
              return;
            }
            set({ appointments: appointmentsList });
          }, (error) => {
            console.error("Failed to sync appointments:", error);
          });

          const unsubSettings = setupStoreListener('settings', (snapshot) => {
            let settingsObj: Settings | null = null;
            snapshot.forEach((doc) => {
              if (doc.id === 'global_settings') {
                settingsObj = doc.data() as Settings;
              }
            });
            if (settingsObj) {
              set((state) => ({
                settings: { 
                  ...state.settings, 
                  ...settingsObj,
                  userCredentials: settingsObj.userCredentials || state.settings.userCredentials
                }
              }));
            } else {
              const currentSettings = get().settings;
              get().performWrite('settings', 'global_settings', 'set', currentSettings, `Initialize Store Settings for ${activeStoreId}`);
            }
          }, (error) => {
            console.error("Failed to sync settings:", error);
          });

          // Also set up a listener for the stores collection in real-time
          const unsubStores = onSnapshot(collection(db, 'stores'), (snapshot) => {
            const fetchedStores: StoreDetails[] = [];
            snapshot.forEach((doc) => {
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
                isDefault: data.isDefault === true,
                instagramLink: data.instagramLink || '',
                facebookLink: data.facebookLink || '',
                twitterLink: data.twitterLink || '',
                websiteLink: data.websiteLink || '',
                whatsappLink: data.whatsappLink || '',
                createdAt: data.createdAt || new Date().toISOString()
              });
            });

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
                isDefault: true,
                createdAt: new Date().toISOString()
              };
              safeSetDoc(doc(db, 'stores', 'default'), defaultStore).catch(console.error);
              fetchedStores.push(defaultStore);
            }

            set({ stores: fetchedStores });
          }, (error) => {
            console.error("Failed to sync stores collection:", error);
          });

          // Listener for profiles
          const unsubProfiles = onSnapshot(collection(db, 'profiles'), (snapshot) => {
            const profilesList: UserProfile[] = [];
            snapshot.forEach((doc) => {
              profilesList.push(doc.data() as UserProfile);
            });
            set({ profiles: profilesList });
          }, (error) => {
            console.error("Failed to sync profiles collection:", error);
          });

          // Listener for messages
          const unsubMessages = onSnapshot(collection(db, 'messages'), (snapshot) => {
            const messagesList: Message[] = [];
            snapshot.forEach((doc) => {
              messagesList.push(doc.data() as Message);
            });
            // Sort by createdAt ascending for chat layout
            messagesList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            set({ messages: messagesList });
          }, (error) => {
            console.error("Failed to sync messages collection:", error);
          });

          // Save unsubscribers and set sync state
          set({
            unsubscribers: [
              unsubRepairs,
              unsubCustomers,
              unsubInventory,
              unsubInsurance,
              unsubAppointments,
              unsubSettings,
              unsubStores,
              unsubProfiles,
              unsubMessages
            ],
            lastSyncStatus: 'success'
          });

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
        let updatedInventoryItems: { id: string, item: InventoryItem }[] = [];
        const currentStoreId = get().currentStoreId || 'default';
        set((state) => {
          createdRepair = {
            ...repairData,
            id: generateId(),
            storeId: currentStoreId,
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
              storeId: currentStoreId,
              totalOrders: newCustomers[existingCustomerIndex].totalOrders + 1,
              lastVisit: new Date().toISOString()
            };
          } else {
            newCustomers.push({
              phoneNumber: repairData.phoneNumber,
              storeId: currentStoreId,
              name: repairData.customerName,
              email: repairData.email,
              totalOrders: 1,
              lastVisit: new Date().toISOString()
            });
          }
          
          // Decrement stock for inventory items sold/used in repair addons
          const addonsList = repairData.addons as any[];
          const newInventory = state.inventory.map(invItem => {
            const addon = addonsList?.find((a: any) => a.id === invItem.id);
            if (addon) {
              const qtyUsed = typeof addon.quantity === 'number' ? addon.quantity : 1;
              const updatedItem = {
                ...invItem,
                quantity: Math.max(0, (invItem.quantity ?? 0) - qtyUsed)
              };
              updatedInventoryItems.push({ id: invItem.id, item: updatedItem });
              return updatedItem;
            }
            return invItem;
          });
          
          return {
            repairs: [createdRepair, ...state.repairs],
            customers: newCustomers,
            inventory: newInventory
          };
        });
        
        // Write to Firestore asynchronously with support for Offline Sync Queue
        if (createdRepair) {
          const rep = createdRepair as ShoeRepairRequest;
          get().performWrite('repairs', rep.id, 'set', rep, `Create Repair Ticket ${rep.invoiceNumber}`);
          
          const cust = newCustomers.find(c => c.phoneNumber === rep.phoneNumber);
          if (cust) {
            get().performWrite('customers', cust.phoneNumber, 'set', cust, `Register customer ${cust.name}`);
          }

          // Write updated inventory items to Firestore
          updatedInventoryItems.forEach(({ id, item }) => {
            get().performWrite('inventory', id, 'set', item, `Update stock of ${item.name}`);
          });
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

        if (updatedRepair) {
          get().performWrite('repairs', id, 'set', updatedRepair, `Update Repair Status to ${status}`);
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

        if (updatedRepair) {
          get().performWrite('repairs', id, 'set', updatedRepair, `Update Repair Ticket ${updatedRepair.invoiceNumber}`);
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
        get().performWrite('repairs', id, 'delete', undefined, `Delete Repair Ticket`);
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
        const storeId = get().currentStoreId || 'default';
        const customerWithStore = { ...customer, storeId };
        set((state) => ({
          customers: [...state.customers, customerWithStore]
        }));
        get().performWrite('customers', customer.phoneNumber, 'set', customerWithStore, `Add Customer ${customer.name}`);
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
        if (updatedCustomer) {
          get().performWrite('customers', phone, 'set', updatedCustomer, `Update Customer ${updatedCustomer.name}`);
        }
      },

      deleteCustomer: (phone) => {
        set((state) => ({
          customers: state.customers.filter(c => c.phoneNumber !== phone)
        }));
        get().performWrite('customers', phone, 'delete', undefined, `Delete Customer`);
      },
      
      addInventoryItem: (item) => {
        const id = generateId();
        const storeId = get().currentStoreId || 'default';
        const newItem = { ...item, id, storeId };
        set((state) => ({
          inventory: [...state.inventory, newItem]
        }));
        get().performWrite('inventory', id, 'set', newItem, `Add Inventory Item ${newItem.name}`);
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
        if (updatedItem) {
          get().performWrite('inventory', id, 'set', updatedItem, `Update Stock for ${updatedItem.name}`);
        }
      },
      
      deleteInventoryItem: (id) => {
        set((state) => ({
          inventory: state.inventory.filter(i => i.id !== id)
        }));
        get().performWrite('inventory', id, 'delete', undefined, `Delete Inventory Item`);
      },
      
      addInsurance: (policy) => {
        const id = generateId();
        const createdAt = new Date().toISOString();
        const storeId = get().currentStoreId || 'default';
        const newPolicy = { ...policy, id, storeId, createdAt };
        set((state) => ({
          insurance: [...state.insurance, newPolicy]
        }));
        get().performWrite('insurance', id, 'set', newPolicy, `Add Insurance Policy ${newPolicy.planName}`);
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
        if (updatedInsurance) {
          get().performWrite('insurance', id, 'set', updatedInsurance, `Update Insurance Policy ${updatedInsurance.planName}`);
        }
      },

      deleteInsurance: (id) => {
        set((state) => ({
          insurance: state.insurance.filter(i => i.id !== id)
        }));
        get().performWrite('insurance', id, 'delete', undefined, `Delete Insurance Policy`);
      },

      addAppointment: async (appointmentData) => {
        const id = appointmentData.id || generateId();
        const createdAt = new Date().toISOString();
        const storeId = get().currentStoreId || 'default';
        const newAppointment: Appointment = {
          ...appointmentData,
          id,
          storeId,
          status: 'Pending',
          createdAt
        };
        
        set((state) => ({
          appointments: [newAppointment, ...state.appointments]
        }));
        
        try {
          await get().performWrite('appointments', id, 'set', newAppointment, `Book Appointment for ${newAppointment.customerName}`);
          
          let dateText = newAppointment.date;
          try {
            dateText = format(parseISO(newAppointment.date), 'MMM dd');
          } catch (dErr) {
            console.warn("Date parsing error in appointment notification:", dErr);
          }

          await get().addNotification({
            title: 'New Appointment Booked',
            message: `${newAppointment.customerName} has scheduled a ${newAppointment.serviceType} for ${dateText} at ${newAppointment.time}.`,
            type: 'info'
          });
        } catch (e) {
          console.error("Appointment performWrite failed", e);
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
        if (updatedAppointment) {
          get().performWrite('appointments', id, 'set', updatedAppointment, `Update Appointment for ${updatedAppointment.customerName}`);
        }

        if (updatedAppointment && data.status) {
          setTimeout(async () => {
            if (updatedAppointment) {
              await get().addNotification({
                title: 'Booking Status Updated',
                message: `${updatedAppointment.customerName}'s booking status is now ${data.status}.`,
                type: 'success'
              });
            }
          }, 100);
        }
      },

      deleteAppointment: (id) => {
        set((state) => ({
          appointments: state.appointments.filter(a => a.id !== id)
        }));
        get().performWrite('appointments', id, 'delete', undefined, `Cancel Appointment`);
      },
      
      updateSettings: (newSettings) => {
        const profile = get().userProfile;
        // Block only if explicitly logged in under a restricted Staff profile
        if (profile && profile.role === 'Staff' && !profile.isAdmin) {
          console.warn("[SECURITY] Blocked updateSettings from restricted Staff user profile:", profile.email);
          return;
        }

        const currentStoreId = get().currentStoreId || 'default';
        const updatedSettings = { ...get().settings, ...newSettings };

        get().performWrite('settings', 'global_settings', 'set', updatedSettings, `Update Global Studio Settings`);

        const currentStore = get().stores.find(s => s.id === currentStoreId);
        if (currentStore) {
          const updatedStoreDoc: StoreDetails = {
            ...currentStore,
            storeName: updatedSettings.storeName || currentStore.storeName,
            address: updatedSettings.address || currentStore.address,
            hours: updatedSettings.hours || currentStore.hours,
            phone: (updatedSettings as any).phone || currentStore.phone || '',
            logoUrl: updatedSettings.logoUrl || currentStore.logoUrl || '',
            paymentLink: updatedSettings.paymentLink || currentStore.paymentLink || '',
            qrCode: updatedSettings.qrCode || currentStore.qrCode || '',
            instagramLink: updatedSettings.instagramLink || currentStore.instagramLink || '',
            facebookLink: updatedSettings.facebookLink || currentStore.facebookLink || '',
            twitterLink: updatedSettings.twitterLink || currentStore.twitterLink || '',
            linkedinLink: (updatedSettings as any).linkedinLink || (currentStore as any).linkedinLink || '',
            websiteLink: updatedSettings.websiteLink || currentStore.websiteLink || '',
            whatsappLink: (updatedSettings as any).whatsappLink || (currentStore as any).whatsappLink || ''
          };
          get().performWrite('stores', currentStoreId, 'set', updatedStoreDoc, `Sync Store Document`);

          set((state) => ({
            settings: updatedSettings,
            stores: state.stores.map(s => s.id === currentStoreId ? updatedStoreDoc : s)
          }));
        } else {
          set({ settings: updatedSettings });
        }
      },

      togglePrivacyMask: () => {
        set((state) => ({ isPrivacyMasked: !state.isPrivacyMasked }));
      },

      addUserCredential: (credential) => {
        const profile = get().userProfile;
        if (profile && profile.role === 'Staff' && !profile.isAdmin) return;
        
        const currentCreds = get().settings.userCredentials || [];
        get().updateSettings({ userCredentials: [...currentCreds, credential] });
      },

      deleteUserCredential: (email) => {
        const profile = get().userProfile;
        if (profile && profile.role === 'Staff' && !profile.isAdmin) return;
        
        const currentCreds = get().settings.userCredentials || [];
        get().updateSettings({ userCredentials: currentCreds.filter(c => c.email !== email) });
      },

      updateUserCredential: (email, data) => {
        const profile = get().userProfile;
        if (profile && profile.role === 'Staff' && !profile.isAdmin) return;
        
        const currentCreds = get().settings.userCredentials || [];
        get().updateSettings({ 
          userCredentials: currentCreds.map(c => c.email === email ? { ...c, ...data } : c) 
        });
      },

      setUser: async (user) => {
        set({ user });
        if (user) {
          const credentials = get().settings?.userCredentials || [];
          const matchedCred = credentials.find(c => c.email.toLowerCase() === user.email?.toLowerCase());
          const isExplicitStaff = matchedCred?.role === 'Staff';
          const isAdminEmail = user.email === 'star.aks486@gmail.com' || 
                               user.email === 'admin@cordwainers.local' || 
                               matchedCred?.role === 'Admin' ||
                               !isExplicitStaff;
          
          const defaultProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: matchedCred?.displayName || user.displayName || user.email?.split('@')[0] || 'Artisan Studio Owner',
            createdAt: new Date().toISOString(),
            role: isAdminEmail ? 'Admin' : 'Staff',
            isAdmin: isAdminEmail
          };

          if (!db) {
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

      sendMessage: async (chatId, text, imageUrl, quickReplyId) => {
        const { user, userProfile } = get();
        if (!user || !userProfile) {
          console.error("Cannot send message: User is not logged in.");
          return;
        }

        const newMessage: Message = {
          id: generateId(),
          chatId,
          senderId: user.uid,
          senderName: userProfile.displayName || user.email || 'Anonymous Cobbler',
          senderPhoto: userProfile.photoURL || undefined,
          text,
          imageUrl,
          quickReplyId,
          createdAt: new Date().toISOString(),
          readBy: [user.uid],
          status: 'sent'
        };

        // Update local state optimistically
        set((state) => ({
          messages: [...state.messages, newMessage]
        }));

        // Clean up undefined properties for Firestore
        const dbMessage: Record<string, any> = {
          id: newMessage.id,
          chatId: newMessage.chatId,
          senderId: newMessage.senderId,
          senderName: newMessage.senderName,
          text: newMessage.text,
          createdAt: newMessage.createdAt,
          readBy: newMessage.readBy,
          status: newMessage.status
        };
        if (newMessage.senderPhoto) dbMessage.senderPhoto = newMessage.senderPhoto;
        if (newMessage.imageUrl) dbMessage.imageUrl = newMessage.imageUrl;
        if (newMessage.quickReplyId) dbMessage.quickReplyId = newMessage.quickReplyId;

        if (db) {
          try {
            await safeSetDoc(doc(db, 'messages', newMessage.id), dbMessage);
          } catch (err) {
            console.error("Failed to write message to Firestore, using offline queue:", err);
            await get().performWrite('messages', newMessage.id, 'set', dbMessage, 'Send internal message');
          }
        } else {
          await get().performWrite('messages', newMessage.id, 'set', dbMessage, 'Send internal message');
        }
      },

      markMessagesAsRead: async (chatId) => {
        const { user, messages } = get();
        if (!user || !db) return;

        const unreadMessages = messages.filter(m => m.chatId === chatId && (!m.readBy || !m.readBy.includes(user.uid)));
        if (unreadMessages.length === 0) return;

        // Optimistically update locally
        set((state) => ({
          messages: state.messages.map(m => {
            if (m.chatId === chatId && (!m.readBy || !m.readBy.includes(user.uid))) {
              return {
                ...m,
                readBy: [...(m.readBy || []), user.uid],
                status: 'read' as const
              };
            }
            return m;
          })
        }));

        try {
          const batch = writeBatch(db);
          unreadMessages.forEach(m => {
            const docRef = doc(db, 'messages', m.id);
            batch.update(docRef, {
              readBy: [...(m.readBy || []), user.uid],
              status: 'read'
            });
          });
          await batch.commit();
        } catch (err) {
          console.error("Failed to batch update message read statuses:", err);
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
          const docRef = getStoreDocRef(storeId, 'repairs', repairId);
          safeSetDoc(docRef, updatedRepair).catch(e => console.error("Firestore voice note add failed", e));
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
          const docRef = getStoreDocRef(storeId, 'repairs', repairId);
          safeSetDoc(docRef, updatedRepair).catch(e => console.error("Firestore voice note delete failed", e));
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
          await safeSetDoc(doc(db, 'notifications', id), notification);
        } catch (e) {
          console.error("Failed to add notification:", e);
        }
      },

      setCurrentStoreId: async (storeId) => {
        const targetStore = get().stores.find(s => s.id === storeId);
        set((state) => ({
          currentStoreId: storeId,
          settings: {
            ...state.settings,
            storeName: targetStore?.storeName || state.settings.storeName,
            address: targetStore?.address || state.settings.address,
            hours: targetStore?.hours || state.settings.hours,
            phone: targetStore?.phone || (state.settings as any).phone || '',
            logoUrl: targetStore?.logoUrl || state.settings.logoUrl || '',
            paymentLink: targetStore?.paymentLink || state.settings.paymentLink || '',
            qrCode: targetStore?.qrCode || state.settings.qrCode || '',
            instagramLink: targetStore?.instagramLink || state.settings.instagramLink || '',
            facebookLink: targetStore?.facebookLink || state.settings.facebookLink || '',
            twitterLink: targetStore?.twitterLink || state.settings.twitterLink || '',
            linkedinLink: targetStore?.linkedinLink || (state.settings as any).linkedinLink || '',
            websiteLink: targetStore?.websiteLink || state.settings.websiteLink || '',
            whatsappLink: targetStore?.whatsappLink || (state.settings as any).whatsappLink || ''
          }
        }));
        await get().fetchFromFirestore();
      },

      addStore: async (storeData) => {
        const profile = get().userProfile;
        if (profile && profile.role === 'Staff' && !profile.isAdmin) {
          console.warn("[SECURITY] Blocked addStore from restricted Staff user profile");
          return;
        }
        
        const id = generateId();
        const existingStores = get().stores;
        const shouldBeDefault = storeData.isDefault === true || existingStores.length === 0;

        const newStore: StoreDetails = {
          ...storeData,
          id,
          isDefault: shouldBeDefault,
          createdAt: new Date().toISOString()
        };

        // If new store is default, update existing stores to not be default
        const updatedStores: StoreDetails[] = shouldBeDefault 
          ? [...existingStores.map(s => ({ ...s, isDefault: false })), newStore]
          : [...existingStores.filter(s => s.id !== id), newStore];

        const targetStoreId = shouldBeDefault || !get().currentStoreId ? id : get().currentStoreId;

        // Synchronously update local state so the store is instantly visible
        set((state) => ({
          stores: updatedStores,
          currentStoreId: targetStoreId,
          settings: shouldBeDefault ? {
            ...state.settings,
            storeName: newStore.storeName,
            address: newStore.address,
            hours: newStore.hours,
            phone: newStore.phone || '',
            logoUrl: newStore.logoUrl || '',
            paymentLink: newStore.paymentLink || '',
            qrCode: newStore.qrCode || '',
            instagramLink: newStore.instagramLink || '',
            facebookLink: newStore.facebookLink || '',
            twitterLink: newStore.twitterLink || '',
            linkedinLink: newStore.linkedinLink || '',
            websiteLink: newStore.websiteLink || '',
            whatsappLink: newStore.whatsappLink || ''
          } : state.settings
        }));

        if (db) {
          try {
            if (shouldBeDefault) {
              for (const st of updatedStores) {
                await safeSetDoc(doc(db, 'stores', st.id), st);
              }
            } else {
              await safeSetDoc(doc(db, 'stores', id), newStore);
            }

            // Save custom settings for this new store using active defaults
            const defaultSettings = get().settings;
            const storeSettings = {
              ...defaultSettings,
              storeName: storeData.storeName,
              address: storeData.address,
              hours: storeData.hours,
              phone: storeData.phone || ''
            };
            try {
              const docRef = getStoreDocRef(id, 'settings', 'global_settings');
              await safeSetDoc(docRef, storeSettings);
            } catch (error) {
              console.warn(`[FIREBASE] Failed to write settings to separate database for new store "${id}". falling back to default database:`, error);
              markDatabaseAsFailed(id);
              const fallbackDocRef = getStoreDocRef(id, 'settings', 'global_settings');
              await safeSetDoc(fallbackDocRef, storeSettings);
            }
          } catch (err) {
            console.error("Firestore store write failed, kept in local state:", err);
          }
        }

        await get().fetchFromFirestore();
      },

      updateStore: async (id, storeData) => {
        const profile = get().userProfile;
        if (profile && profile.role === 'Staff' && !profile.isAdmin) {
          console.warn("[SECURITY] Blocked updateStore from restricted Staff user profile");
          return;
        }

        const existingStores = get().stores;
        const existingStore = existingStores.find(s => s.id === id);
        if (!existingStore) return;

        const isBecomingDefault = storeData.isDefault === true;

        const updatedStores = existingStores.map(s => {
          if (s.id === id) {
            return { ...s, ...storeData };
          }
          if (isBecomingDefault) {
            return { ...s, isDefault: false };
          }
          return s;
        });

        const updatedStore = updatedStores.find(s => s.id === id)!;
        const newCurrentStoreId = isBecomingDefault ? id : get().currentStoreId;
        const isCurrentActive = id === get().currentStoreId || isBecomingDefault;

        // Immediately update local state & settings
        set((state) => ({
          stores: updatedStores,
          currentStoreId: newCurrentStoreId,
          ...(isCurrentActive ? {
            settings: {
              ...state.settings,
              storeName: updatedStore.storeName || state.settings.storeName,
              address: updatedStore.address || state.settings.address,
              hours: updatedStore.hours || state.settings.hours,
              phone: updatedStore.phone || (state.settings as any).phone || '',
              logoUrl: updatedStore.logoUrl || state.settings.logoUrl || '',
              paymentLink: updatedStore.paymentLink || state.settings.paymentLink || '',
              qrCode: updatedStore.qrCode || state.settings.qrCode || '',
              instagramLink: updatedStore.instagramLink || state.settings.instagramLink || '',
              facebookLink: updatedStore.facebookLink || state.settings.facebookLink || '',
              twitterLink: updatedStore.twitterLink || state.settings.twitterLink || '',
              linkedinLink: updatedStore.linkedinLink || (state.settings as any).linkedinLink || '',
              websiteLink: updatedStore.websiteLink || state.settings.websiteLink || '',
              whatsappLink: updatedStore.whatsappLink || (state.settings as any).whatsappLink || ''
            }
          } : {})
        }));

        if (db) {
          try {
            if (isBecomingDefault) {
              for (const st of updatedStores) {
                await safeSetDoc(doc(db, 'stores', st.id), st);
              }
            } else {
              await safeSetDoc(doc(db, 'stores', id), updatedStore);
            }
          } catch (err) {
            console.error("Firestore store update failed, kept in local state:", err);
          }
        }

        if (isCurrentActive) {
          const updatedSettings = {
            ...get().settings,
            storeName: updatedStore.storeName || get().settings.storeName,
            address: updatedStore.address || get().settings.address,
            hours: updatedStore.hours || get().settings.hours,
            phone: updatedStore.phone || (get().settings as any).phone || '',
            logoUrl: updatedStore.logoUrl || get().settings.logoUrl || '',
            paymentLink: updatedStore.paymentLink || get().settings.paymentLink || '',
            qrCode: updatedStore.qrCode || get().settings.qrCode || '',
            instagramLink: updatedStore.instagramLink || get().settings.instagramLink || '',
            facebookLink: updatedStore.facebookLink || get().settings.facebookLink || '',
            twitterLink: updatedStore.twitterLink || get().settings.twitterLink || '',
            linkedinLink: updatedStore.linkedinLink || (get().settings as any).linkedinLink || '',
            websiteLink: updatedStore.websiteLink || get().settings.websiteLink || '',
            whatsappLink: updatedStore.whatsappLink || (get().settings as any).whatsappLink || ''
          };
          get().performWrite('settings', 'global_settings', 'set', updatedSettings, `Update Store Global Settings ${id}`);
        }

        if (isBecomingDefault || id === get().currentStoreId) {
          await get().fetchFromFirestore();
        }
      },

      setDefaultStore: async (id: string) => {
        const profile = get().userProfile;
        if (profile && profile.role === 'Staff' && !profile.isAdmin) {
          console.warn("[SECURITY] Blocked setDefaultStore from restricted Staff user profile");
          return;
        }

        const stores = get().stores;
        const targetStore = stores.find(s => s.id === id);
        if (!targetStore) return;

        const updatedStores = stores.map(s => ({
          ...s,
          isDefault: s.id === id
        }));

        set((state) => ({
          stores: updatedStores,
          currentStoreId: id,
          settings: {
            ...state.settings,
            storeName: targetStore.storeName || state.settings.storeName,
            address: targetStore.address || state.settings.address,
            hours: targetStore.hours || state.settings.hours,
            phone: targetStore.phone || (state.settings as any).phone || '',
            logoUrl: targetStore.logoUrl || state.settings.logoUrl || '',
            paymentLink: targetStore.paymentLink || state.settings.paymentLink || '',
            qrCode: targetStore.qrCode || state.settings.qrCode || '',
            instagramLink: targetStore.instagramLink || state.settings.instagramLink || '',
            facebookLink: targetStore.facebookLink || state.settings.facebookLink || '',
            twitterLink: targetStore.twitterLink || state.settings.twitterLink || '',
            linkedinLink: targetStore.linkedinLink || (state.settings as any).linkedinLink || '',
            websiteLink: targetStore.websiteLink || state.settings.websiteLink || '',
            whatsappLink: targetStore.whatsappLink || (state.settings as any).whatsappLink || ''
          }
        }));

        if (db) {
          try {
            for (const st of updatedStores) {
              await safeSetDoc(doc(db, 'stores', st.id), st);
            }
          } catch (err) {
            console.error("Firestore update for default store failed:", err);
          }
        }

        await get().fetchFromFirestore();
      },

      deleteStore: async (id) => {
        const profile = get().userProfile;
        if (profile && profile.role === 'Staff' && !profile.isAdmin) {
          console.warn("[SECURITY] Blocked deleteStore from restricted Staff user profile");
          return;
        }
        if (get().stores.length <= 1) {
          alert("Cannot delete the only registered store location.");
          return;
        }

        const storeToBackup = get().stores.find(s => s.id === id);
        const storeName = storeToBackup?.storeName || 'Unnamed Store';
        const updatedStores = get().stores.filter(s => s.id !== id);
        let nextStoreId = get().currentStoreId;
        const wasActive = get().currentStoreId === id;
        if (wasActive) {
          nextStoreId = updatedStores[0]?.id || 'default';
        }
        const activeNextStore = updatedStores.find(s => s.id === nextStoreId) || updatedStores[0];

        // Immediately update local state
        set((state) => ({
          stores: updatedStores,
          currentStoreId: nextStoreId,
          ...(wasActive && activeNextStore ? {
            settings: {
              ...state.settings,
              storeName: activeNextStore.storeName || state.settings.storeName,
              address: activeNextStore.address || state.settings.address,
              hours: activeNextStore.hours || state.settings.hours,
              phone: activeNextStore.phone || (state.settings as any).phone || '',
              logoUrl: activeNextStore.logoUrl || state.settings.logoUrl || '',
              paymentLink: activeNextStore.paymentLink || state.settings.paymentLink || '',
              qrCode: activeNextStore.qrCode || state.settings.qrCode || '',
              instagramLink: activeNextStore.instagramLink || state.settings.instagramLink || '',
              facebookLink: activeNextStore.facebookLink || state.settings.facebookLink || '',
              twitterLink: activeNextStore.twitterLink || state.settings.twitterLink || '',
              linkedinLink: activeNextStore.linkedinLink || (state.settings as any).linkedinLink || '',
              websiteLink: activeNextStore.websiteLink || state.settings.websiteLink || '',
              whatsappLink: activeNextStore.whatsappLink || (state.settings as any).whatsappLink || ''
            }
          } : {})
        }));

        if (db) {
          try {
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

            await deleteDoc(doc(db, 'stores', id));
          } catch (error) {
            console.error("Firestore store delete failed, removed locally:", error);
          }
        }

        await get().fetchFromFirestore();
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
            getDocs(getStoreCollectionRef(storeId, 'repairs')),
            getDocs(getStoreCollectionRef(storeId, 'customers')),
            getDocs(getStoreCollectionRef(storeId, 'inventory')),
            getDocs(getStoreCollectionRef(storeId, 'insurance')),
            getDocs(getStoreCollectionRef(storeId, 'appointments')),
            getDocs(getStoreCollectionRef(storeId, 'settings'))
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
        if (!profile || (profile.role !== 'Admin' && !profile.isAdmin)) {
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
                if (rep.id) writePromises.push(safeSetDoc(getStoreDocRef(stId, 'repairs', rep.id), rep));
              });
              st.customers?.forEach((cust: any) => {
                if (cust.phoneNumber) writePromises.push(safeSetDoc(getStoreDocRef(stId, 'customers', cust.phoneNumber), cust));
              });
              st.inventory?.forEach((inv: any) => {
                if (inv.id) writePromises.push(safeSetDoc(getStoreDocRef(stId, 'inventory', inv.id), inv));
              });
              st.insurance?.forEach((ins: any) => {
                if (ins.id) writePromises.push(safeSetDoc(getStoreDocRef(stId, 'insurance', ins.id), ins));
              });
              st.appointments?.forEach((app: any) => {
                if (app.id) writePromises.push(safeSetDoc(getStoreDocRef(stId, 'appointments', app.id), app));
              });
              st.settings?.forEach((setObj: any) => {
                if (setObj.id) {
                  const { id, ...data } = setObj;
                  writePromises.push(safeSetDoc(getStoreDocRef(stId, 'settings', id), data));
                }
              });
            }
          } else {
            const stId = backupData.storeId || backupData.storeDetails?.id;
            if (stId) {
              writePromises.push(safeSetDoc(doc(db, 'stores', stId), backupData.storeDetails));

              backupData.repairs?.forEach((rep: any) => {
                if (rep.id) writePromises.push(safeSetDoc(getStoreDocRef(stId, 'repairs', rep.id), rep));
              });
              backupData.customers?.forEach((cust: any) => {
                if (cust.phoneNumber) writePromises.push(safeSetDoc(getStoreDocRef(stId, 'customers', cust.phoneNumber), cust));
              });
              backupData.inventory?.forEach((inv: any) => {
                if (inv.id) writePromises.push(safeSetDoc(getStoreDocRef(stId, 'inventory', inv.id), inv));
              });
              backupData.insurance?.forEach((ins: any) => {
                if (ins.id) writePromises.push(safeSetDoc(getStoreDocRef(stId, 'insurance', ins.id), ins));
              });
              backupData.appointments?.forEach((app: any) => {
                if (app.id) writePromises.push(safeSetDoc(getStoreDocRef(stId, 'appointments', app.id), app));
              });
              backupData.settings?.forEach((setObj: any) => {
                if (setObj.id) {
                  const { id, ...data } = setObj;
                  writePromises.push(safeSetDoc(getStoreDocRef(stId, 'settings', id), data));
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
      partialize: (state) => {
        const { unsubscribers, ...rest } = state;
        return rest;
      }
    }
  )
);
