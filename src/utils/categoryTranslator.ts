/**
 * Translate category name using i18n
 * Handles both backend-translated names and original names
 * Falls back to the original name if translation is not available
 * 
 * @param categoryName - The category name (may be already translated by backend or original)
 * @param t - i18n translation function
 * @param originalName - Optional original name from API (if backend provides original_name field)
 * @returns Translated category name
 */
export function translateCategoryName(
  categoryName: string, 
  t: any, 
  originalName?: string
): string {
  if (!categoryName) return '';
  
  // Priority 1: If backend already translated it (original_name exists and differs), use backend translation
  // This happens when Accept-Language header is sent and backend translates categories
  if (originalName && categoryName !== originalName) {
    return categoryName; // Backend already translated it
  }
  
  // Priority 2: Try frontend translation using original name (if available) or category name
  // Always use originalName for translation lookup if available, as it's the English name
  const nameToTranslate = originalName || categoryName;
  
  // Normalize the name for translation key lookup (remove spaces, special chars, lowercase)
  const normalizedName = nameToTranslate.toLowerCase().replace(/[^a-z0-9]/g, '');
  const translationKey = `categories.${normalizedName}`;
  
  // Try to translate using i18n
  const translated = t(translationKey, { defaultValue: null });
  
  // If translation exists and is different from the key and the original name, use it
  if (translated && translated !== translationKey && translated !== nameToTranslate) {
    return translated;
  }
  
  // Priority 3: If backend didn't translate and frontend translation doesn't exist,
  // return the category name as-is (it might already be translated by backend)
  // or return the original name if available
  return originalName || categoryName;
}

