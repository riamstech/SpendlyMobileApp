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
  
  // Priority 2: Try frontend translation for custom categories or fallback cases
  // Normalize the name for translation key lookup
  const nameToTranslate = originalName || categoryName;
  const normalizedName = nameToTranslate.toLowerCase().replace(/[^a-z0-9]/g, '');
  const translationKey = `categories.${normalizedName}`;
  
  // Try to translate using i18n
  const translated = t(translationKey, { defaultValue: categoryName });
  
  // If translation exists and is different from the key, use it
  if (translated && translated !== translationKey && translated !== categoryName) {
    return translated;
  }
  
  // Priority 3: Fallback to original name with capitalized first letter
  // Handle multi-word names (e.g., "Dining Out" -> "Dining Out")
  return categoryName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

