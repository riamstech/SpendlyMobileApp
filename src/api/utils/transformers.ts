/**
 * Transform snake_case object keys to camelCase
 */
export function toCamelCase<T extends Record<string, any>>(obj: T): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  const transformed: Record<string, any> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = snakeToCamel(key);
      transformed[camelKey] = toCamelCase(obj[key]);
    }
  }
  
  return transformed;
}

/**
 * Transform camelCase object keys to snake_case
 */
export function toSnakeCase<T extends Record<string, any>>(obj: T): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  const transformed: Record<string, any> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = camelToSnake(key);
      transformed[snakeKey] = toSnakeCase(obj[key]);
    }
  }
  
  return transformed;
}

/**
 * Convert snake_case string to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase string to snake_case
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Transform transaction from API format to app format
 * Maps notes -> description and handles date formatting
 */
export function transformTransaction(transaction: any): any {
  return {
    ...toCamelCase(transaction),
    description: transaction.notes || '',
    notes: transaction.notes || '',
    date: transaction.date // Keep as YYYY-MM-DD for form inputs
  };
}

/**
 * Transform transaction from app format to API format
 * Maps description -> notes
 */
export function transformTransactionForAPI(transaction: any): any {
  const transformed = toSnakeCase(transaction);
  // Use description as notes if notes is empty
  if (transformed.description && !transformed.notes) {
    transformed.notes = transformed.description;
  }
  // Remove description field as API doesn't use it
  delete transformed.description;
  return transformed;
}

/**
 * Transform investment from API format to app format
 */
export function transformInvestment(investment: any): any {
  // API client already transforms to camelCase, so handle both cases
  const transformed = toCamelCase(investment);
  return {
    ...transformed,
    // Use camelCase first (from API client), then fallback to snake_case (direct from backend)
    investedAmount: investment.investedAmount ?? investment.invested_amount,
    currentValue: investment.currentValue ?? investment.current_value,
    date: investment.startDate ?? investment.start_date ?? investment.date
  };
}

/**
 * Transform investment from app format to API format
 */
export function transformInvestmentForAPI(investment: any): any {
  const transformed = toSnakeCase(investment);
  if (transformed.date) {
    transformed.start_date = transformed.date;
    delete transformed.date;
  }
  // Handle category object if present
  if (transformed.category && typeof transformed.category === 'object' && transformed.category.id) {
    transformed.category_id = transformed.category.id;
    delete transformed.category;
  }
  return transformed;
}

/**
 * Transform recurring payment from API format to app format
 * Maps category -> name, next_due_date -> dueDate
 */
export function transformRecurringPayment(payment: any): any {
  return {
    ...toCamelCase(payment),
    name: payment.category,
    dueDate: payment.next_due_date,
    icon: getCategoryIcon(payment.category)
  };
}

/**
 * Transform recurring payment from app format to API format
 */
export function transformRecurringPaymentForAPI(payment: any): any {
  const transformed = toSnakeCase(payment);
  if (transformed.name) {
    transformed.category = transformed.name;
    delete transformed.name;
  }
  if (transformed.dueDate) {
    transformed.next_due_date = transformed.dueDate;
    delete transformed.dueDate;
  }
  delete transformed.icon; // Remove icon as it's not in API
  return transformed;
}

/**
 * Get icon name based on category
 */
export function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'Rent': 'home',
    'Groceries': 'ShoppingCart',
    'Transport': 'car',
    'Food & Dining': 'Utensils',
    'Entertainment': 'Film',
    'Shopping': 'Gift',
    'Bills & EMI': 'CreditCard',
    'Software Subscription': 'CreditCard',
    'Netflix': 'Film',
    'Internet': 'wifi',
    'Utilities': 'Home'
  };
  
  return iconMap[category] || 'CreditCard';
}

/**
 * Transform budget from API format to app format
 */
export function transformBudget(budget: any): any {
  return {
    ...toCamelCase(budget),
    budget: budget.budget_amount,
    spent: budget.spent || 0
  };
}

/**
 * Transform budget from app format to API format
 */
export function transformBudgetForAPI(budget: any): any {
  const transformed = toSnakeCase(budget);
  if (transformed.budget !== undefined) {
    transformed.budget_amount = transformed.budget;
    delete transformed.budget;
  }
  return transformed;
}

