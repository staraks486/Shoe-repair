/**
 * Utility function to extract a clean location name (e.g., City or Branch name) from an address or store name.
 * Prevents displaying detailed street addresses on the dashboard while displaying clean location identifiers.
 */
export function getLocationName(address?: string, storeName?: string): string {
  if (address && address.trim()) {
    const parts = address.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      // Filter out pure numeric zip/postal codes
      const nonZipParts = parts.filter(p => !/^\d{4,6}(-\d{4})?$/.test(p));
      if (nonZipParts.length > 1) {
        // Return the last non-zip part (usually City or State/Region) or second part
        return nonZipParts[nonZipParts.length - 1];
      }
    } else if (parts.length === 1 && !/^\d+\s/.test(parts[0])) {
      // If address is already just a location name (e.g. "London", "Cityville", "Downtown")
      return parts[0];
    }
  }
  
  if (storeName && storeName.trim()) {
    return storeName;
  }
  
  return 'Main Location';
}
