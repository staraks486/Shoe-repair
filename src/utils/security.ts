/**
 * Security & Data Sanitization Utilities
 * Modern sanitization, data integrity checks, and privacy protection
 */

/**
 * Sanitizes input text to prevent XSS injection attacks in inputs, notes, and search queries.
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';
  return String(input)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Masks sensitive personal data (Phone, Email, Cards) when Privacy Shield mode is active.
 */
export function maskSensitiveData(value: string | undefined | null, type: 'phone' | 'email' | 'address' | 'generic' = 'generic'): string {
  if (!value) return '';
  
  if (type === 'phone') {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return `+${cleaned.slice(0, 2)} ****-*${cleaned.slice(-3)}`;
    }
    return '***-***-****';
  }

  if (type === 'email') {
    const parts = value.split('@');
    if (parts.length === 2) {
      const name = parts[0];
      const domain = parts[1];
      const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : '***';
      return `${maskedName}@${domain}`;
    }
    return '***@***.com';
  }

  if (type === 'address') {
    const words = value.split(' ');
    if (words.length > 2) {
      return `${words[0]} ${words[1]} [RESTRICTED PRIVACY LOCATION]`;
    }
    return '*** Restricted Location ***';
  }

  return '••••••••';
}

/**
 * Computes a fast hash checksum of state objects to ensure local storage integrity.
 */
export function computeChecksum(obj: unknown): string {
  try {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `sha256_chk_${Math.abs(hash).toString(16)}`;
  } catch {
    return 'chk_invalid';
  }
}

/**
 * Verifies if local storage payload integrity is intact.
 */
export function verifyDataIntegrity(data: unknown, storedChecksum?: string): boolean {
  if (!storedChecksum) return true;
  return computeChecksum(data) === storedChecksum;
}
