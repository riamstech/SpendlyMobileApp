# Typography System Guide

This document explains how to use the centralized typography system across all screens.

## Overview

The typography system is defined in `src/constants/fonts.ts` and provides:
- Consistent font families (sans, mono)
- Standardized font sizes (h1-h4, body, label, caption, display)
- Font weights (regular, medium, semibold, bold)
- Responsive font sizing based on screen width

## Usage

### 1. Import the typography utilities

```typescript
import { createResponsiveTextStyles, textStyles, fonts } from '../constants/fonts';
```

### 2. Create responsive text styles in your component

```typescript
const { width } = useWindowDimensions();
const textStyles = createResponsiveTextStyles(width);
```

### 3. Use in responsive styles object

```typescript
const responsiveStyles = {
  headerTitle: textStyles.h3,        // 18px - Main page title
  headerSubtitle: textStyles.caption, // 12px - Subtitle
  sectionTitle: textStyles.h4,       // 16px - Section headers
  bodyText: textStyles.body,         // 16px - Body text
  label: textStyles.label,           // 14px - Labels
  caption: textStyles.caption,       // 12px - Captions
  // ... etc
};
```

### 4. Use in StyleSheet definitions

```typescript
import { textStyles as baseTextStyles } from '../constants/fonts';

const styles = StyleSheet.create({
  headerTitle: {
    ...baseTextStyles.h3,  // Spreads fontFamily, fontSize, fontWeight, lineHeight
  },
  sectionTitle: {
    ...baseTextStyles.h4,
  },
});
```

## Typography Scale

### Headers
- **h1**: 24px - Main page titles (large screens)
- **h2**: 20px - Section headers
- **h3**: 18px - Subsection headers, card titles
- **h4**: 16px - Small headers, card titles

### Body
- **body**: 16px - Main body text
- **bodySmall**: 14px - Secondary body text

### Labels & Captions
- **label**: 14px - Form labels, button text
- **labelSmall**: 13px - Small labels
- **caption**: 12px - Captions, metadata
- **captionSmall**: 10px - Very small text (badges, hints)

### Display (for numbers)
- **display**: 28px - Large display numbers (balance, totals)
- **displaySmall**: 20px - Medium display numbers

## Font Families

**Spendly now uses professional custom fonts:**

- **sans**: `Inter` - Modern, highly readable sans-serif font family
  - `Inter_400Regular` - Regular weight for body text
  - `Inter_500Medium` - Medium weight for emphasis
  - `Inter_600SemiBold` - Semibold weight for headers
  - `Inter_700Bold` - Bold weight for strong emphasis
  
- **mono**: `JetBrains Mono` - Professional monospace font for numbers and financial data
  - `JetBrainsMono_400Regular` - Regular weight for amounts
  - `JetBrainsMono_500Medium` - Medium weight for emphasis
  - `JetBrainsMono_700Bold` - Bold weight for highlighted numbers

**Why these fonts?**
- ✅ Used by fintech companies like Stripe and GitHub
- ✅ Exceptional readability at all sizes
- ✅ Professional, trustworthy appearance
- ✅ Clear distinction between similar characters (0 vs O, 1 vs l)
- ✅ Consistent appearance across all platforms

## Font Weights

- **regular**: 400
- **medium**: 500
- **semibold**: 600
- **bold**: 700

## Examples

### Header
```typescript
<Text style={[styles.headerTitle, responsiveStyles.headerTitle, { color: colors.foreground }]}>
  Dashboard
</Text>
```

### Section Title
```typescript
<Text style={[styles.sectionTitle, responsiveStyles.sectionTitle, { color: colors.foreground }]}>
  Recent Transactions
</Text>
```

### Body Text
```typescript
<Text style={[textStyles.body, { color: colors.foreground }]}>
  This is body text
</Text>
```

### Caption
```typescript
<Text style={[textStyles.caption, { color: colors.mutedForeground }]}>
  Last updated 2 hours ago
</Text>
```

### Display Number (Monospace)
```typescript
<Text style={[textStyles.display, { color: colors.foreground }]}>
  $1,234.56
</Text>
```

## Migration Checklist

When updating a screen to use the typography system:

1. ✅ Import `createResponsiveTextStyles` and `textStyles`
2. ✅ Create `textStyles` using `createResponsiveTextStyles(width)`
3. ✅ Replace all hardcoded `fontSize` calculations in `responsiveStyles` with typography styles
4. ✅ Update StyleSheet definitions to use `...baseTextStyles.*` spread syntax
5. ✅ Remove hardcoded `fontFamily` and `fontWeight` from styles
6. ✅ Test on different screen sizes to ensure responsive sizing works

## Common Patterns

### Header Section
```typescript
// Responsive
headerTitle: textStyles.h3,
headerSubtitle: textStyles.caption,

// StyleSheet
headerTitle: {
  ...baseTextStyles.h3,
  marginBottom: 2,
},
```

### Section Headers
```typescript
// Responsive
sectionTitle: textStyles.h4,

// StyleSheet
sectionTitle: {
  ...baseTextStyles.h4,
},
```

### Labels and Captions
```typescript
// Responsive
label: textStyles.label,
caption: textStyles.caption,
meta: textStyles.captionSmall,

// StyleSheet
label: {
  ...baseTextStyles.label,
},
```

### Numbers/Amounts
```typescript
// Responsive
amount: textStyles.displaySmall,  // For medium numbers
largeAmount: textStyles.display,  // For large numbers

// StyleSheet
amount: {
  ...baseTextStyles.displaySmall,
  fontFamily: fonts.mono,  // Already included in display styles
},
```

