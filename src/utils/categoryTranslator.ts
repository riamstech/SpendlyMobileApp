/**
 * Translate category name using i18n
 * Falls back to the original name if translation is not available
 */
export function translateCategoryName(categoryName: string, t: any): string {
  if (!categoryName) return '';
  
  // Try to translate using i18n
  const translationKey = `categories.${categoryName.toLowerCase().replace(/\s+/g, '_')}`;
  const translated = t(translationKey);
  
  // If translation exists and is different from the key, use it
  if (translated && translated !== translationKey) {
    return translated;
  }
  
  // Fallback to original name with capitalized first letter
  return categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
}

