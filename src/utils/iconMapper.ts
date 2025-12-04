// Icon name to emoji mapping for categories
export const iconToEmoji: Record<string, string> = {
  // Home & Living
  'Home': '🏠',
  'Sofa': '🛋️',
  'Tv': '📺',
  'Package': '📦',
  'Hammer': '🔨',
  'Sparkles': '✨',
  
  // Food & Dining
  'ShoppingCart': '🛒',
  'ShoppingBag': '🛍️',
  'ShoppingBasket': '🧺',
  'Utensils': '🍽️',
  'Coffee': '☕',
  'UtensilsCrossed': '🍴',
  
  // Groceries
  'Apple': '🍎',
  'Carrot': '🥕',
  
  // Transportation
  'Car': '🚗',
  'CarTaxiFront': '🚕',
  'Plane': '✈️',
  'Train': '🚆',
  'Bus': '🚌',
  'Bike': '🚲',
  'ParkingSquare': '🅿️',
  'Ticket': '🎫',
  'Wrench': '🔧',
  'Waves': '🌊',
  
  // Utilities & Bills
  'Zap': '⚡',
  'Flame': '🔥',
  'Droplet': '💧',
  'Wifi': '📶',
  'Smartphone': '📱',
  'CreditCard': '💳',
  'Landmark': '🏛️',
  'Shield': '🛡️',
  'ShieldCheck': '✅',
  'ShieldPlus': '🛡️',
  
  // Entertainment
  'Film': '🎬',
  'Play': '▶️',
  'PartyPopper': '🎉',
  'Music': '🎵',
  'Gamepad2': '🎮',
  
  // Health & Medical
  'HeartPulse': '💗',
  'Stethoscope': '🩺',
  'Hospital': '🏥',
  'Pill': '💊',
  
  // Education
  'BookOpen': '📖',
  'GraduationCap': '🎓',
  'School': '🏫',
  'Pencil': '✏️',
  
  // Family & Kids
  'Baby': '👶',
  'Users': '👥',
  'User': '👤',
  
  // Gifts & Personal
  'Gift': '🎁',
  'HandHeart': '💝',
  'PawPrint': '🐾',
  
  // Finance & Investment
  'DollarSign': '$',
  'PiggyBank': '🐷',
  'TrendingUp': '📈',
  'TrendingDown': '📉',
  'PieChart': '📊',
  'BarChart3': '📊',
  'Bitcoin': '₿',
  'Gem': '💎',
  'Building': '🏢',
  'Building2': '🏗️',
  'Briefcase': '💼',
  'Award': '🏆',
  'Percent': '%',
  'RotateCcw': '🔄',
  'Banknote': '💵',
  'BadgeDollarSign': '💰',
  'Bot': '🤖',
  'Rocket': '🚀',
  
  // Misc
  'MoreHorizontal': '⋯',
  'WashingMachine': '🧺',
  'HandCoins': '💰',
  'Ban': '🚫',
  'Siren': '🚨',
  
  // Default fallback
  'default': '📊',
};

export function getEmojiFromIcon(iconName: string | undefined | null): string {
  if (!iconName) return iconToEmoji.default;
  return iconToEmoji[iconName] || iconToEmoji.default;
}

