import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ShoeRepairRequest, Customer, InventoryItem, ShoeInsurance, Settings, ChatMessage } from './types';

interface AppState {
  repairs: ShoeRepairRequest[];
  customers: Customer[];
  inventory: InventoryItem[];
  insurance: ShoeInsurance[];
  settings: Settings;
  chatHistory: ChatMessage[];
  
  addRepair: (repair: Omit<ShoeRepairRequest, 'id' | 'isSynced' | 'createdAt' | 'invoiceNumber'>) => ShoeRepairRequest;
  updateRepairStatus: (id: string, status: ShoeRepairRequest['status']) => void;
  syncAllPending: () => Promise<void>;
  
  addCustomer: (customer: Customer) => void;
  updateCustomer: (phoneNumber: string, data: Partial<Customer>) => void;
  
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  
  addInsurance: (policy: Omit<ShoeInsurance, 'id' | 'createdAt'>) => void;
  
  updateSettings: (settings: Partial<Settings>) => void;
  
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);
const generateInvoice = () => 'INV-' + Math.floor(100000 + Math.random() * 900000);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      repairs: [],
      customers: [],
      inventory: [
        { id: '1', name: 'Premium Leather Soles', category: 'Soles', quantity: 50, unit: 'pairs', minThreshold: 10 },
        { id: '2', name: 'Rubber Heels', category: 'Heels', quantity: 5, unit: 'pairs', minThreshold: 20 },
        { id: '3', name: 'Black Polish', category: 'Polish', quantity: 15, unit: 'tins', minThreshold: 5 },
      ],
      insurance: [],
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
        isOfflineMode: false,
        whatsappTemplate: 'Hello {customerName}, your shoe repair ({repairType}) is now {status}. Invoice: {invoiceNumber}',
        insurancePlans: [
          { id: '1', name: 'Basic', description: '1 Year, Minor Fixes', price: 499 },
          { id: '2', name: 'Premium', description: 'Lifetime, All Fixes', price: 1499 }
        ],
        offers: [
          { id: '1', name: 'Welcome 10%', code: 'WELCOME10', discountPercentage: 10 }
        ],
        employees: [],
        cobblers: [],
        repairCharges: [
          { id: '1', service: 'Heel Repair', price: 200 },
          { id: '2', service: 'Sole Repair', price: 500 }
        ],
        theme: 'olive'
      },
      chatHistory: [],

      addRepair: (repairData) => {
        let createdRepair: ShoeRepairRequest | null = null;
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
          const newCustomers = [...state.customers];
          
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
        return createdRepair!;
      },
      
      updateRepairStatus: (id, status) => set((state) => ({
        repairs: state.repairs.map(r => r.id === id ? { 
          ...r, 
          status, 
          isSynced: false,
          statusHistory: [...r.statusHistory, {
            timestamp: new Date().toISOString(),
            user: 'Staff',
            status
          }]
        } : r)
      })),
      
      syncAllPending: async () => {
        const { settings, repairs } = get();
        if (settings.isOfflineMode) return;
        
        const pending = repairs.filter(r => !r.isSynced);
        if (pending.length === 0) return;
        
        try {
          if (settings.googleSheetsWebAppUrl) {
             console.log('Syncing to Google Sheets', pending);
          }
          
          set((state) => ({
            repairs: state.repairs.map(r => ({ ...r, isSynced: true }))
          }));
        } catch (error) {
          console.error("Failed to sync", error);
        }
      },
      
      addCustomer: (customer) => set((state) => ({
        customers: [...state.customers, customer]
      })),
      
      updateCustomer: (phone, data) => set((state) => ({
        customers: state.customers.map(c => c.phoneNumber === phone ? { ...c, ...data } : c)
      })),
      
      addInventoryItem: (item) => set((state) => ({
        inventory: [...state.inventory, { ...item, id: generateId() }]
      })),
      
      updateInventoryItem: (id, data) => set((state) => ({
        inventory: state.inventory.map(i => i.id === id ? { ...i, ...data } : i)
      })),
      
      deleteInventoryItem: (id) => set((state) => ({
        inventory: state.inventory.filter(i => i.id !== id)
      })),
      
      addInsurance: (policy) => set((state) => ({
        insurance: [...state.insurance, { ...policy, id: generateId(), createdAt: new Date().toISOString() }]
      })),
      
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      
      addChatMessage: (msg) => set((state) => ({
        chatHistory: [...state.chatHistory, { ...msg, id: generateId(), timestamp: new Date().toISOString() }]
      })),
      
      clearChat: () => set({ chatHistory: [] })
    }),
    {
      name: 'cobbler-storage',
    }
  )
);
