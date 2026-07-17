export type RepairStatus = 'Received' | 'In Progress' | 'Completed' | 'Delivered';

export interface ShoeRepairRequest {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  shoeModel: string;
  repairType: string;
  description: string;
  photoUrl: string;
  status: RepairStatus;
  shoeIcon: string;
  price: number;
  dueDate: string; // ISO date string
  isSynced: boolean;
  createdAt: string; // ISO date string
  receivedBy: string;
  invoiceNumber: string;
  addonType: string;
  addonPrice: number;
  hasInsurance: boolean;
  insuranceType: string;
  insurancePrice: number;
}

export interface Customer {
  phoneNumber: string; // Primary Key
  name: string;
  email: string;
  totalOrders: number;
  lastVisit: string; // ISO date string
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string; // 'Soles' | 'Heels' | 'Polish' | 'Laces' | 'Other'
  quantity: number;
  unit: string;
  minThreshold: number;
}

export interface ShoeInsurance {
  id: string;
  customerPhone: string;
  shoeId: string;
  planName: string;
  usageCount: number;
  maxUsage: number;
  status: 'Active' | 'Expired';
}

export interface InsurancePlan {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface Settings {
  storeName: string;
  address: string;
  hours: string;
  logo: string;
  cobblerBio: string;
  googleSheetsId: string;
  googleSheetsToken: string;
  googleSheetsWebAppUrl: string;
  isOfflineMode: boolean;
  whatsappTemplate: string;
  insurancePlans: InsurancePlan[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
