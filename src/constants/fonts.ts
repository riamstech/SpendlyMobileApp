import { Platform, TextStyle } from 'react-native';

/**
 * Font Configuration - System Fonts for Optimal Performance
 * 
 * iOS: SF Pro (system default) + Courier (monospace)
 * Android: Roboto + Roboto Mono
 * 
 * Benefits:
 * - Better performance (no custom font loading)
 * - Native platform feel
 * - Automatic font fallbacks
 * - Smaller app size
 */

export const fonts = {
  // Main text font - system default on each platform
  sans: Platform.select({
    ios: 'System', // SF Pro (explicitly use System)
    android: 'Roboto',
    default: 'System',
  }) as string | undefined,
  
  sansMedium: Platform.select({
    ios: 'System', // SF Pro Medium (weight handled separately)
    android: 'Roboto-Medium',
    default: 'System',
  }) as string | undefined,
  
  sansSemibold: Platform.select({
    ios: 'System', // SF Pro Semibold (weight handled separately)
    android: 'sans-serif-medium', // Roboto Medium (Android weight)
    default: 'System',
  }) as string | undefined,
  
  sansBold: Platform.select({
    ios: 'System', // SF Pro Bold (weight handled separately)
    android: 'Roboto-Bold',
    default: 'System',
  }) as string | undefined,
  
  // Header font - same as sans (system default)
  header: Platform.select({
    ios: 'System', // SF Pro (explicitly use System)
    android: 'Roboto',
    default: 'System',
  }) as string | undefined,
  
  // Monospace font for numbers
  mono: Platform.select({
    ios: 'Courier', // iOS system monospace
    android: 'monospace', // Roboto Mono on Android
    default: 'monospace',
  }),
  
  monoMedium: Platform.select({
    ios: 'Courier', // Courier doesn't have weights on iOS
    android: 'monospace', // Roboto Mono Medium
    default: 'monospace',
  }),
  
  monoBold: Platform.select({
    ios: 'Courier-Bold',
    android: 'monospace', // Roboto Mono Bold
    default: 'monospace',
  }),
} as const;

/**
 * Typography System - Consistent font sizes and styles across the app
 * 
 * Standardized typography scale:
 * - Headers: 20px, 18px, 16px, 14px (h1-h4)
 * - Body: 16px, 14px
 * - UI Elements: 16px (buttons, inputs), 14px (labels)
 * - Small: 12px, 10px (captions)
 * - Display: 24px, 20px (numbers)
 */
export const typography = {
  // Font Families
  fontFamily: {
    regular: fonts.sans,
    medium: fonts.sansMedium,
    semibold: fonts.sansSemibold,
    bold: fonts.sansBold,
    header: fonts.header,
    mono: fonts.mono,
    monoMedium: fonts.monoMedium,
    monoBold: fonts.monoBold,
  },

  // Font Sizes - Matching Web Version (Tailwind)
  // Web uses: text-xs=12px, text-sm=14px, text-base=16px, text-lg=18px, text-xl=20px
  fontSize: {
    // Headers
    h1: 18,      // text-lg (web main headers)
    h2: 16,      // text-base (web section headers)
    h3: 14,      // text-sm (web subsection headers)
    h4: 12,      // text-xs (web small headers)
    
    // Body
    body: 16,     // text-base (main body text)
    bodySmall: 14, // text-sm (secondary body text)
    
    // UI Elements
    button: 14,   // text-sm (button text)
    input: 14,    // text-sm (input fields)
    label: 12,    // text-xs (form labels)
    
    // Labels & Captions
    labelSmall: 12, // text-xs (small labels)
    caption: 12, // text-xs (captions, metadata)
    small: 10, // Very small text (badges, hints)
    
    // Display (for balance/important numbers)
    display: 20, // text-xl (large display - matches web sm:text-xl)
    displaySmall: 18, // text-lg (medium display - matches web text-lg)
  },

  // Font Weights
  fontWeight: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
  },

  // Line Heights (optimized for readability)
  lineHeight: {
    tight: 1.2,    // Headers, numbers
    normal: 1.5,   // Body text
    relaxed: 1.7,  // Long paragraphs
  },

  // Letter Spacing (platform-specific)
  letterSpacing: Platform.select({
    ios: {
      tight: -0.2,
      normal: 0,
      wide: 0.5,
    },
    android: {
      tight: 0,
      normal: 0.15,
      wide: 0.5,
    },
    default: {
      tight: 0,
      normal: 0,
      wide: 0.5,
    },
  }),
} as const;

/**
 * Pre-defined text styles for common use cases
 * These combine fontSize, fontFamily, fontWeight, and lineHeight
 */
export const textStyles = {
  // Headers
  h1: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.h1,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.h1 * typography.lineHeight.tight,
  },
  h2: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.h2 * typography.lineHeight.tight,
  },
  h3: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.h3 * typography.lineHeight.tight,
  },
  h4: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.h4 * typography.lineHeight.normal,
  },
  
  // Body text
  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
  },
  bodySmall: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.bodySmall,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.bodySmall * typography.lineHeight.normal,
  },
  
  // UI Elements
  button: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.button,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.button * typography.lineHeight.normal,
  },
  input: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.input,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.input * typography.lineHeight.normal,
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.label * typography.lineHeight.normal,
  },
  labelSmall: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.labelSmall,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.labelSmall * typography.lineHeight.normal,
  },
  
  // Captions
  caption: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.caption * typography.lineHeight.normal,
  },
  small: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.small * typography.lineHeight.normal,
  },
  
  // Display (for numbers)
  display: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.display * typography.lineHeight.tight,
  },
  displaySmall: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.displaySmall,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.displaySmall * typography.lineHeight.tight,
  },
  monoMedium: {
    fontFamily: typography.fontFamily.monoMedium,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
  },
} as const;

/**
 * Helper function to get responsive font size based on screen width
 * @param baseSize - The base font size
 * @param screenWidth - The current screen width
 * @param minSize - Minimum font size (optional)
 * @param maxSize - Maximum font size (optional)
 */
export const getResponsiveFontSize = (
  baseSize: number,
  screenWidth: number,
  minSize?: number,
  maxSize?: number
): number => {
  const scale = screenWidth / 375; // 375 is a common base width (iPhone)
  let fontSize = baseSize * scale;
  
  if (minSize !== undefined) {
    fontSize = Math.max(fontSize, minSize);
  }
  
  if (maxSize !== undefined) {
    fontSize = Math.min(fontSize, maxSize);
  }
  
  return fontSize;
};

/**
 * Create responsive text styles based on screen width
 * Matching web version responsive behavior
 * @param screenWidth - The current screen width
 */
export function createResponsiveTextStyles(screenWidth: number) {
  return {
    h1: {
      ...textStyles.h1,
      fontSize: getResponsiveFontSize(typography.fontSize.h1, screenWidth, 16, 20), // text-base to text-xl
    },
    h2: {
      ...textStyles.h2,
      fontSize: getResponsiveFontSize(typography.fontSize.h2, screenWidth, 14, 18), // text-sm to text-lg
    },
    h3: {
      ...textStyles.h3,
      fontSize: getResponsiveFontSize(typography.fontSize.h3, screenWidth, 13, 16), // text-sm to text-base
    },
    h4: {
      ...textStyles.h4,
      fontSize: getResponsiveFontSize(typography.fontSize.h4, screenWidth, 11, 14), // text-xs to text-sm
    },
    body: {
      ...textStyles.body,
      fontSize: getResponsiveFontSize(typography.fontSize.body, screenWidth, 14, 16), // text-sm to text-base
    },
    bodySmall: {
      ...textStyles.bodySmall,
      fontSize: getResponsiveFontSize(typography.fontSize.bodySmall, screenWidth, 12, 14), // text-xs to text-sm
    },
    button: {
      ...textStyles.button,
      fontSize: getResponsiveFontSize(typography.fontSize.button, screenWidth, 13, 14), // text-sm
    },
    input: {
      ...textStyles.input,
      fontSize: getResponsiveFontSize(typography.fontSize.input, screenWidth, 13, 14), // text-sm
    },
    label: {
      ...textStyles.label,
      fontSize: getResponsiveFontSize(typography.fontSize.label, screenWidth, 11, 13), // text-xs to text-sm
    },
    labelSmall: {
      ...textStyles.labelSmall,
      fontSize: getResponsiveFontSize(typography.fontSize.labelSmall, screenWidth, 10, 12), // text-xs
    },
    caption: {
      ...textStyles.caption,
      fontSize: getResponsiveFontSize(typography.fontSize.caption, screenWidth, 11, 14), // text-xs to text-sm
    },
    small: {
      ...textStyles.small,
      fontSize: getResponsiveFontSize(typography.fontSize.small, screenWidth, 10, 10), // 10px fixed
    },
    display: {
      ...textStyles.display,
      fontSize: getResponsiveFontSize(typography.fontSize.display, screenWidth, 18, 20), // text-lg to text-xl
    },
    displaySmall: {
      ...textStyles.displaySmall,
      fontSize: getResponsiveFontSize(typography.fontSize.displaySmall, screenWidth, 16, 18), // text-base to text-lg
    },
  };
}
