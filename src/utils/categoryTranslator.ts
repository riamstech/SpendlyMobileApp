/**
 * Translate category name using i18n
 * Falls back to the original name if translation is not available
 */
export function translateCategoryName(categoryName: string, t: any): string {
  if (!categoryName) return '';
  
  // Try to translate using i18n
  // Try to translate using i18n
  // Remove all non-alphanumeric characters and convert to lowercase to match common.json keys
  const translationKey = `categories.${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const translated = t(translationKey);
  
  // If translation exists and is different from the key, use it
  if (translated && translated !== translationKey) {
    return translated;
  }
  
  // Fallback to original name with capitalized first letter
  return categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
}

