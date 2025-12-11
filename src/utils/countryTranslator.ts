/**
 * Utility function to translate country names
 * Uses i18n translation keys if available, otherwise falls back to backend-provided translation
 */
export function translateCountryName(
  countryName: string,
  t: any,
  originalName?: string
): string {
  if (!countryName) return '';
  
  // If backend already translated it and it's different from original, use it
  if (originalName && countryName !== originalName) {
    return countryName; // Backend already translated it
  }
  
  // Try to find translation using the original name or country name
  const nameToTranslate = originalName || countryName;
  
  // Normalize the country name for translation key lookup
  // Convert to lowercase and remove spaces/special characters
  const normalizedName = nameToTranslate.toLowerCase().replace(/[^a-z0-9]/g, '');
  const translationKey = `countries.${normalizedName}`;
  
  // Try to get translation
  const translated = t(translationKey, { defaultValue: null });
  
  // If translation exists and is different from the key, return it
  if (translated && translated !== translationKey && translated !== nameToTranslate) {
    return translated;
  }
  
  // Fallback to backend-provided name or original name
  return countryName || originalName || '';
}
