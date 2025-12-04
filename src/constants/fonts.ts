import { Platform, TextStyle } from 'react-native';

/**
 * Font families matching the SpendlyApp web application
 * Web app uses: Roboto (sans), Roboto Mono (mono)
 * 
 * Mobile implementation:
 * - Main font: Roboto (Android, built-in) / San Francisco (iOS system font)
 * - Monospace font: Roboto Mono (Android, built-in) / Courier (iOS system font)
 * 
 * Note: Android has Roboto as the default system font, matching the web app perfectly.
 * iOS uses San Francisco by default, which provides a native iOS experience.
 * To use Roboto on iOS, you would need to load it as a custom font via expo-font.
 */
export const fonts = {
  // Main font family - system font stack matching web: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
  sans: Platform.select({
    ios: 'System', // -apple-system, BlinkMacSystemFont on iOS
    android: 'Roboto', // Roboto on Android
    default: 'System', // System font on other platforms
  }),
  
  // Header font - uses system font stack for headers
  header: Platform.select({
    ios: 'System', // -apple-system, BlinkMacSystemFont
    android: 'Roboto', // Roboto (matches web stack)
    default: 'System',
  }),
  
  // Monospace font family - matches 'Roboto Mono' from web app
  mono: Platform.select({
    android: 'Roboto Mono',
    ios: 'Courier', // iOS fallback
    default: 'monospace',
  }),
} as const;

/**
 * Typography System - Consistent font sizes and styles across the app
 * 
 * Based on standard typography scale:
 * - Headers: 24px, 20px, 14px (h3 - system font stack), 13px (h4)
 * - Body: 16px, 14px
 * - Small: 12px, 10px
 */
export const typography = {
  // Font Families
  fontFamily: {
    regular: fonts.sans,
    header: fonts.header, // System font stack for headers: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
    mono: fonts.mono,
  },

  // Font Sizes (base sizes, will be responsive) - MAXIMUM 16px
  fontSize: {
    // Headers
    h1: 16,      // Main page titles (capped at 16px)
    h2: 16,      // Section headers (capped at 16px)
    h3: 16,      // Headers (main page titles) - using system font stack
    h4: 13,      // Section titles
    
    // Body
    body: 16,     // Main body text
    bodySmall: 14, // Secondary body text
    
    // Labels & Captions
    label: 14,   // Form labels, button text
    labelSmall: 13, // Small labels
    caption: 12, // Captions, metadata
    captionSmall: 10, // Very small text (badges, hints)
    
    // Special
    display: 16, // Large display numbers (balance, totals) - capped at 16px
    displaySmall: 16, // Medium display numbers - capped at 16px
  },

  // Font Weights
  fontWeight: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

/**
 * Helper function to create responsive font size
 * Scales based on screen width (375px is base)
 */
export function getResponsiveFontSize(
  baseSize: number,
  width: number,
  minSize?: number,
  maxSize?: number
): number {
  const scale = width / 375;
  const scaledSize = baseSize * scale;
  
  let finalSize = scaledSize;
  if (minSize && finalSize < minSize) finalSize = minSize;
  if (maxSize && finalSize > maxSize) finalSize = maxSize;
  
  // Cap all font sizes at 16px maximum
  return Math.min(finalSize, 16);
}

/**
 * Predefined typography styles for common use cases
 * These can be used directly in StyleSheet or as inline styles
 */
export const textStyles = {
  // Headers
  h1: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.h1,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.h1 * typography.lineHeight.tight,
  },
  h2: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.h2 * typography.lineHeight.tight,
  },
  h3: {
    fontFamily: typography.fontFamily.header, // System font stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
    fontSize: typography.fontSize.h3, // 16px
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.h3 * typography.lineHeight.normal,
  },
  h4: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.h4, // 13px
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.h4 * typography.lineHeight.normal,
  },
  
  // Body
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
  
  // Labels
  label: {
    fontFamily: typography.fontFamily.regular,
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
  captionSmall: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.captionSmall,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.captionSmall * typography.lineHeight.normal,
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
} as const;

/**
 * Helper to create responsive typography styles
 * Usage: responsiveTextStyles.h1(width)
 */
export function createResponsiveTextStyles(width: number) {
  return {
    h1: {
      ...textStyles.h1,
      fontSize: getResponsiveFontSize(typography.fontSize.h1, width, 14, 16), // Capped at 16px
    },
    h2: {
      ...textStyles.h2,
      fontSize: getResponsiveFontSize(typography.fontSize.h2, width, 14, 16), // Capped at 16px
    },
    h3: {
      ...textStyles.h3,
      fontSize: getResponsiveFontSize(typography.fontSize.h3, width, 14, 16), // 16px base, responsive 14-16px
    },
    h4: {
      ...textStyles.h4,
      fontSize: getResponsiveFontSize(typography.fontSize.h4, width, 11, 15), // 13px base, responsive 11-15px
    },
    body: {
      ...textStyles.body,
      fontSize: getResponsiveFontSize(typography.fontSize.body, width, 14, 16), // Capped at 16px
    },
    bodySmall: {
      ...textStyles.bodySmall,
      fontSize: getResponsiveFontSize(typography.fontSize.bodySmall, width, 12, 16),
    },
    label: {
      ...textStyles.label,
      fontSize: getResponsiveFontSize(typography.fontSize.label, width, 12, 16),
    },
    labelSmall: {
      ...textStyles.labelSmall,
      fontSize: getResponsiveFontSize(typography.fontSize.labelSmall, width, 11, 15),
    },
    caption: {
      ...textStyles.caption,
      fontSize: getResponsiveFontSize(typography.fontSize.caption, width, 10, 14),
    },
    captionSmall: {
      ...textStyles.captionSmall,
      fontSize: getResponsiveFontSize(typography.fontSize.captionSmall, width, 9, 12),
    },
    display: {
      ...textStyles.display,
      fontSize: getResponsiveFontSize(typography.fontSize.display, width, 14, 16), // Capped at 16px
    },
    displaySmall: {
      ...textStyles.displaySmall,
      fontSize: getResponsiveFontSize(typography.fontSize.displaySmall, width, 14, 16), // Capped at 16px
    },
  };
}

