/**
 * Map i18n language codes to proper locale codes for date formatting
 */
function getLocaleForLanguage(lang?: string): string {
  if (!lang) return 'en-US';
  
  const localeMap: { [key: string]: string } = {
    'en': 'en-US',
    'es': 'es-ES',
    'zh-CN': 'zh-CN',
    'hi': 'hi-IN',
    'ar': 'ar-SA',
    'fr': 'fr-FR',
    'pt-BR': 'pt-BR',
    'pt-PT': 'pt-PT',
    'ru': 'ru-RU',
    'ja': 'ja-JP',
    'de': 'de-DE',
  };
  
  return localeMap[lang] || lang || 'en-US';
}

/**
 * Convert API date format (YYYY-MM-DD) to display format (MMM DD, YYYY)
 * @param dateString - Date string in YYYY-MM-DD format
 * @param locale - Optional locale code (defaults to 'en-US'). If not provided, will use browser/i18n language
 */
export function formatDateForDisplay(dateString: string, locale?: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }
  // Use provided locale or try to get from i18n if available
  const displayLocale = locale ? getLocaleForLanguage(locale) : (typeof window !== 'undefined' && (window as any).i18n?.language ? getLocaleForLanguage((window as any).i18n.language) : 'en-US');
  return date.toLocaleDateString(displayLocale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Convert display date format (MMM DD, YYYY) or Date object to API format (YYYY-MM-DD)
 */
export function formatDateForAPI(date: string | Date): string {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    // Try parsing the date string
    dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      // If parsing fails, assume it's already in YYYY-MM-DD format
      return date;
    }
  } else {
    dateObj = date;
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get current month start and end dates in API format
 */
export function getCurrentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  
  return {
    from: formatDateForAPI(from),
    to: formatDateForAPI(to)
  };
}

/**
 * Convert date range string to from/to dates
 * @param dateRange - One of: "currentMonth", "currentYear", "1month", "3months", "6months", "1year", "all"
 * @returns Object with from and to dates in API format (YYYY-MM-DD)
 */
export function getDateRangeFromString(dateRange: string): { from: string; to: string } {
  const now = new Date();
  let from: Date;
  let to: Date;

  switch (dateRange) {
    case 'currentMonth':
      // Current Month: From first day of current month to today
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now);
      break;
    case 'currentYear':
      // Current Year: From first day of current year to today
      from = new Date(now.getFullYear(), 0, 1);
      to = new Date(now);
      break;
    case '1month':
      // Last Month: Entire previous calendar month
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      from = new Date(lastMonthYear, lastMonth, 1); // First day of last month
      to = new Date(lastMonthYear, lastMonth + 1, 0); // Last day of last month
      break;
    case '3months':
      // Last 3 Months: Rolling period from exactly 3 months ago to today
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      from = threeMonthsAgo;
      to = new Date(now);
      break;
    case '6months':
      // Last 6 Months: Rolling period from exactly 6 months ago to today
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      from = sixMonthsAgo;
      to = new Date(now);
      break;
    case '1year':
      // Last Year: From 1 year ago (same month, first day) to today
      from = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      to = new Date(now);
      break;
    case 'all':
      // Use a very old date for "all time"
      from = new Date(2000, 0, 1);
      to = new Date(now);
      break;
    default:
      // Default to current month: From first day of current month to today
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now);
  }

  return {
    from: formatDateForAPI(from),
    to: formatDateForAPI(to)
  };
}

/**
 * Calculate budget period dates based on budget cycle day
 * If cycle_day = 15 and today is Nov 20: Period = Nov 15 - Dec 14
 * If cycle_day = 15 and today is Nov 10: Period = Oct 15 - Nov 14
 * @param cycleDay - Day of the month when budget cycle starts (1-31)
 * @returns Object with start and end dates in API format (YYYY-MM-DD)
 */
export function getBudgetPeriodFromCycleDay(cycleDay: number): { start: string; end: string } {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  let startDate: Date;
  let endDate: Date;
  
  // If today's day is >= cycle day, period starts this month
  if (currentDay >= cycleDay) {
    // Start: current month, cycle day
    startDate = new Date(currentYear, currentMonth, cycleDay);
    // End: next month, cycle day - 1
    const nextMonth = currentMonth + 1;
    const nextMonthYear = nextMonth > 11 ? currentYear + 1 : currentYear;
    const actualNextMonth = nextMonth > 11 ? 0 : nextMonth;
    endDate = new Date(nextMonthYear, actualNextMonth, cycleDay);
    endDate.setDate(endDate.getDate() - 1); // Subtract 1 day to get the day before cycle day
  } else {
    // Otherwise, period started last month
    // Start: last month, cycle day
    const lastMonth = currentMonth - 1;
    const lastMonthYear = lastMonth < 0 ? currentYear - 1 : currentYear;
    const actualLastMonth = lastMonth < 0 ? 11 : lastMonth;
    startDate = new Date(lastMonthYear, actualLastMonth, cycleDay);
    // End: current month, cycle day - 1
    endDate = new Date(currentYear, currentMonth, cycleDay);
    endDate.setDate(endDate.getDate() - 1); // Subtract 1 day to get the day before cycle day
  }
  
  return {
    start: formatDateForAPI(startDate),
    end: formatDateForAPI(endDate)
  };
}

