import { Currency } from '../api/services/currencies';

// Map country codes to currency codes
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  'SG': 'SGD', // Singapore
  'IN': 'INR', // India
  'US': 'USD', // United States
  'GB': 'GBP', // United Kingdom
  'AU': 'AUD', // Australia
  'CA': 'CAD', // Canada
  'EU': 'EUR', // European Union
  'JP': 'JPY', // Japan
  'CN': 'CNY', // China
  'MY': 'MYR', // Malaysia
  'THB': 'THB', // Thailand
  'PH': 'PHP', // Philippines
  'ID': 'IDR', // Indonesia
  'VN': 'VND', // Vietnam
  'KR': 'KRW', // South Korea
  'HK': 'HKD', // Hong Kong
  'TW': 'TWD', // Taiwan
  'NZ': 'NZD', // New Zealand
  'ZA': 'ZAR', // South Africa
  'BR': 'BRL', // Brazil
  'MX': 'MXN', // Mexico
  'AR': 'ARS', // Argentina
  'CL': 'CLP', // Chile
  'CO': 'COP', // Colombia
  'PE': 'PEN', // Peru
  'AE': 'AED', // United Arab Emirates
  'SA': 'SAR', // Saudi Arabia
  'IL': 'ILS', // Israel
  'TR': 'TRY', // Turkey
  'RU': 'RUB', // Russia
  'PL': 'PLN', // Poland
  'NO': 'NOK', // Norway
  'SE': 'SEK', // Sweden
  'DK': 'DKK', // Denmark
  'CH': 'CHF', // Switzerland
  'EG': 'EGP', // Egypt
  'NG': 'NGN', // Nigeria
  'KE': 'KES', // Kenya
};

/**
 * Get currency code for a given country code
 */
export function getCurrencyForCountry(countryCode: string | undefined | null): string {
  if (!countryCode) return 'USD'; // Default to USD
  
  const currency = COUNTRY_TO_CURRENCY[countryCode.toUpperCase()];
  return currency || 'USD'; // Default to USD if country not found
}

/**
 * Convert USD amount to user's country currency
 */
export function convertUsdToCurrency(
  usdAmount: number,
  targetCurrency: string,
  currencies: Currency[]
): { amount: number; symbol: string; code: string } {
  // If target currency is USD, return as-is
  if (targetCurrency === 'USD' || targetCurrency.toUpperCase() === 'USD') {
    return { amount: usdAmount, symbol: '$', code: 'USD' };
  }

  // If currencies list is empty, return USD as fallback
  if (!currencies || currencies.length === 0) {
    return { amount: usdAmount, symbol: '$', code: 'USD' };
  }

  // Find target currency in currencies list
  const targetCurrencyData = currencies.find(
    (c) => c.code.toUpperCase() === targetCurrency.toUpperCase()
  );

  if (!targetCurrencyData || !targetCurrencyData.exchangeRate || targetCurrencyData.exchangeRate === 0) {
    // Fallback to USD if currency not found or exchange rate is invalid
    return { amount: usdAmount, symbol: '$', code: 'USD' };
  }

  // Find USD currency for base rate
  const usdCurrency = currencies.find((c) => c.code.toUpperCase() === 'USD');
  const usdRate = usdCurrency?.exchangeRate || 1.0;

  // Convert: (USD amount / USD rate) * target currency rate
  const convertedAmount = (usdAmount / usdRate) * targetCurrencyData.exchangeRate;

  return {
    amount: convertedAmount,
    symbol: targetCurrencyData.symbol || getDefaultCurrencySymbol(targetCurrency),
    code: targetCurrencyData.code,
  };
}

/**
 * Get default currency symbol if not provided
 */
function getDefaultCurrencySymbol(currencyCode: string): string {
  const symbolMap: Record<string, string> = {
    'SGD': 'S$',
    'INR': '₹',
    'USD': '$',
    'GBP': '£',
    'EUR': '€',
    'JPY': '¥',
    'CNY': '¥',
    'AUD': 'A$',
    'CAD': 'C$',
    'MYR': 'RM',
    'THB': '฿',
    'PHP': '₱',
    'IDR': 'Rp',
    'VND': '₫',
    'KRW': '₩',
    'HKD': 'HK$',
    'TWD': 'NT$',
    'NZD': 'NZ$',
    'ZAR': 'R',
    'BRL': 'R$',
    'MXN': '$',
    'ARS': '$',
    'CLP': '$',
    'COP': '$',
    'PEN': 'S/',
    'AED': 'د.إ',
    'SAR': '﷼',
    'ILS': '₪',
    'TRY': '₺',
    'RUB': '₽',
    'PLN': 'zł',
    'NOK': 'kr',
    'SEK': 'kr',
    'DKK': 'kr',
    'CHF': 'CHF',
    'EGP': 'E£',
    'NGN': '₦',
    'KES': 'KSh',
  };

  return symbolMap[currencyCode.toUpperCase()] || '$';
}

/**
 * Format currency amount for display
 */
export function formatCurrencyAmount(
  amount: number,
  symbol: string,
  decimals: number = 2
): string {
  // Round to specified decimals
  const rounded = Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
  
  // Format with commas for thousands
  return rounded.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Convert amount to smallest currency unit for payment processing (Stripe)
 * Most currencies use 2 decimal places (cents), but some use 0 (JPY, KRW, etc.)
 */
export function convertToSmallestUnit(amount: number, currencyCode: string): number {
  // Zero-decimal currencies (Stripe doesn't use cents for these)
  const zeroDecimalCurrencies = ['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'];
  
  const upperCode = currencyCode.toUpperCase();
  if (zeroDecimalCurrencies.includes(upperCode)) {
    return Math.round(amount);
  }
  
  // All other currencies use 2 decimal places (cents)
  return Math.round(amount * 100);
}
