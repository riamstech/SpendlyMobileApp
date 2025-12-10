/**
 * Translate currency name using i18n
 * Handles both backend-translated names and original names
 * Falls back to the original name if translation is not available
 * 
 * @param currencyName - The currency name (may be already translated by backend or original)
 * @param t - i18n translation function
 * @param originalName - Optional original name from API (if backend provides original_name field)
 * @returns Translated currency name
 */
export function translateCurrencyName(
  currencyName: string, 
  t: any, 
  originalName?: string
): string {
  if (!currencyName) return '';
  
  // Priority 1: If backend already translated it (original_name exists and differs), use backend translation
  // This happens when Accept-Language header is sent and backend translates currencies
  if (originalName && currencyName !== originalName) {
    return currencyName; // Backend already translated it
  }
  
  // Priority 2: Try frontend translation for fallback cases
  // Normalize the name for translation key lookup
  const nameToTranslate = originalName || currencyName;
  const normalizedName = nameToTranslate.toLowerCase().replace(/[^a-z0-9]/g, '');
  const translationKey = `currencies.${normalizedName}`;
  
  // Try to translate using i18n
  const translated = t(translationKey, { defaultValue: currencyName });
  
  // If translation exists and is different from the key, use it
  if (translated && translated !== translationKey && translated !== currencyName) {
    return translated;
  }
  
  // Priority 3: Fallback to original name with capitalized first letter
  // Handle multi-word names (e.g., "US Dollar" -> "US Dollar")
  return currencyName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

