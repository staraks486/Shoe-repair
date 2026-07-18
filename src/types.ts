export type RepairStatus = 'Received' | 'In Progress' | 'Polishing' | 'Completed' | 'Delivered';
export type PriorityLevel = 'Low' | 'Medium' | 'High';

export interface StatusHistory {
  timestamp: string;
  user: string;
  status: RepairStatus;
}

export interface ShoeRepairRequest {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  shoeModel: string;
  repairType: string[];
  description: string;
  photoUrl: string;
  status: RepairStatus;
  priority?: PriorityLevel;
  shoeIcon: string;
  price: number;
  dueDate: string; // ISO date string
  isSynced: boolean;
  createdAt: string; // ISO date string
  receivedBy: string;
  invoiceNumber: string;
  addonType: string;
  addonPrice: number;
  addons: {name: string, price: number}[];
  hasInsurance: boolean;
  insuranceType: string;
  insurancePrice: number;
  insurancePolicyNumber: string;
  insuranceStartDate: string;
  insuranceEndDate: string;
  insuranceProvider: string;
  servicesIncluded: string[];
  appliedOfferCode: string;
  discountAmount: number;
  salespersonId: string;
  salespersonName?: string;
  salespersonPhoto?: string;
  basePrice?: number;
  discountPercentage?: number;
  statusHistory: StatusHistory[];
  advance: number;
  balance: number;
  receiveSmsUpdates?: boolean;
  paymentStatus?: 'Unpaid' | 'Partially Paid' | 'Fully Paid';
  paymentMethod?: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Net Banking' | 'None';
  transactionId?: string;
  assignedCobblerId?: string;
  assignedCobblerName?: string;
  payments?: PaymentRecord[];
  voiceNotes?: VoiceNote[];
}

export interface VoiceNote {
  id: string;
  blobUrl: string;
  timestamp: string;
  duration?: number;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  method: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Net Banking' | 'None';
  date: string; // ISO string
  transactionId: string;
  notes?: string;
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
  price?: number;
  unit: string;
  minThreshold: number;
  barcode?: string;
}

export interface ShoeInsurance {
  id: string;
  customerPhone: string;
  shoeId: string;
  planName: string;
  usageCount: number;
  maxUsage: number;
  status: 'Active' | 'Expired';
  customerName?: string;
  shoeModel?: string;
  insurancePolicyNumber?: string;
  insuranceType?: string;
  createdAt?: string;
  insurancePrice?: number;
}

export interface InsurancePlan {
  id: string;
  name: string;
  description: string;
  price: number;
  timePeriod?: string;
  servicesIncluded?: string[];
  copay?: string;
}

export interface Employee { id: string; name: string; role: string; mobile: string; email: string; }
export interface Cobbler { id: string; name: string; specialty: string; mobile: string; email: string; }
export interface RepairCharge { id: string; service: string; price: number; }

export interface Offer {
  id: string;
  name: string;
  code: string;
  discountPercentage: number;
}

export interface ShoeCarePackage {
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
  logoUrl: string;
  cobblerBio: string;
  googleSheetsId: string;
  googleSheetsToken: string;
  googleSheetsWebAppUrl: string;
  paymentLink: string;
  qrCode: string;
  instagramLink?: string;
  facebookLink?: string;
  twitterLink?: string;
  linkedinLink?: string;
  websiteLink?: string;
  isOfflineMode: boolean;
  whatsappTemplate: string;
  insurancePlans: InsurancePlan[];
  offers: Offer[];
  shoeCarePackages?: ShoeCarePackage[];
  employees: Employee[];
  cobblers: Cobbler[];
  repairCharges: RepairCharge[];
  theme: 'light' | 'dark' | 'olive';
  termsAndConditions?: string;
}
