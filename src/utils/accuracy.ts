/**
 * Financial & Calculation Accuracy Utilities
 * Modern precision arithmetic and validation for error-free transactions
 */

/**
 * IEEE 754 Floating-point exact currency rounding to 2 decimal places.
 * Avoids precision bugs like 19.990000000000002 or 0.1 + 0.2 floating point drift.
 */
export function roundCurrency(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates complete repair item breakdown with exact precision rounding.
 */
export interface RepairFinancialSummary {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  depositPaid: number;
  balanceDue: number;
}

export function calculateRepairFinancials(params: {
  cost: number;
  taxRate?: number; // e.g. 0.18 for 18% GST/VAT
  discount?: number;
  deposit?: number;
}): RepairFinancialSummary {
  const cost = roundCurrency(params.cost || 0);
  const discountAmount = roundCurrency(params.discount || 0);
  const discountedSubtotal = Math.max(0, cost - discountAmount);
  
  const taxRate = params.taxRate || 0;
  const taxAmount = roundCurrency(discountedSubtotal * taxRate);
  const totalAmount = roundCurrency(discountedSubtotal + taxAmount);
  
  const depositPaid = roundCurrency(params.deposit || 0);
  const balanceDue = roundCurrency(Math.max(0, totalAmount - depositPaid));

  return {
    subtotal: cost,
    taxAmount,
    discountAmount,
    totalAmount,
    depositPaid,
    balanceDue
  };
}

/**
 * Strict Phone Number Validator (International / Local formats)
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; formatted: string } {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 15) {
    if (digits.length === 10) {
      return {
        isValid: true,
        formatted: `+1 (${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
      };
    }
    return {
      isValid: true,
      formatted: `+${digits}`
    };
  }
  return {
    isValid: digits.length >= 7,
    formatted: phone.trim()
  };
}

/**
 * Strict Email Format Validator
 */
export function validateEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

/**
 * Formats pricing into Indian Rupee (INR - ₹) with standard Indian numbering system
 */
export function formatIndianPrice(amount: number | string | undefined | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Calculates average rating score and review metrics
 */
export function calculateAverageRating(ratings: number[]): { average: number; formatted: string; total: number } {
  if (!ratings || ratings.length === 0) return { average: 5.0, formatted: '5.0', total: 0 };
  const sum = ratings.reduce((acc, curr) => acc + curr, 0);
  const avg = roundCurrency(sum / ratings.length);
  return {
    average: avg,
    formatted: avg.toFixed(1),
    total: ratings.length
  };
}
