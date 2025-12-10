# Hard-Coded English Strings Found in SpendlyMobileApp

This document lists all hard-coded English strings found in the application that need to be moved to translation files.

## Summary
- **Total hard-coded strings found**: ~50+ unique strings
- **Files affected**: 10+ files
- **Translation keys added**: Added to `src/locales/en/common.json`

## Hard-Coded Strings by File

### 1. App.tsx (Error Boundary)
- "Something went wrong"
- "Unknown error"
- "Please restart the app"
- **Translation keys added**: `errorBoundary.somethingWentWrong`, `errorBoundary.unknownError`, `errorBoundary.pleaseRestart`

### 2. src/utils/toast.ts
- "Success" (default title)
- "Error" (default title)
- "Info" (default title)
- **Translation keys added**: `common.success`, `common.error`, `common.info`

### 3. src/components/FreemiumLimitModal.tsx
- "You've Reached {{limit}} Transactions"
- "You're doing great with tracking your finances! To add more transactions and unlock all features, consider upgrading to Premium."
- "Unlimited Transactions"
- "Track as many expenses and income as you want"
- "Advanced Analytics"
- "Get detailed insights and custom reports"
- "Investment Portfolio"
- "Full investment tracking with no limits"
- "Priority Support"
- "Get help whenever you need it"
- "Premium Plan"
- "$9.99" (hard-coded price - should be dynamic)
- "/month"
- "Cancel anytime"
- "Upgrade to Premium"
- "Continue in Free Mode"
- "Don't worry! Your existing {{count}} transactions are safe. You can view and manage them anytime."
- **Translation keys added**: `freemium.*` (all keys)

### 4. src/components/StripePaymentDialog.tsx
- "1 Month Access"
- "1 Year Access"
- "Save 58%" (hard-coded percentage - should be dynamic)
- "One-time payment. You will be redirected to complete your payment securely."
- "Cannot open Razorpay URL"
- "UPI Payment Link not ready. Please try Card."
- "Amount and currency are required for payment. Please try again."
- "Cannot open Stripe URL"
- "No checkout URL returned"
- **Translation keys added**: `payment.oneMonthAccess`, `payment.oneYearAccess`, `payment.savePercent`, `payment.mobileNote`, `payment.cannotOpenRazorpayUrl`, `payment.upiPaymentLinkNotReady`, `payment.amountCurrencyRequired`, `payment.cannotOpenStripeUrl`, `payment.noCheckoutUrl`

### 5. src/screens/ReportsScreen.tsx
- "CSV" (button label)
- "PDF" (button label)
- "Please select a date range"
- "Share CSV report"
- "CSV Ready"
- "CSV file has been generated at: {{fileUri}}"
- "Failed to generate CSV report."
- "Share PDF report"
- "PDF Ready"
- "PDF file has been generated at: {{uri}}"
- "Failed to generate PDF report."
- "Income" (fallback)
- "Expenses" (fallback)
- "Savings" (fallback)
- "Transactions" (fallback)
- "Transaction" (fallback)
- "No transactions found" (fallback)
- "Investments" (fallback)
- "Investment" (fallback)
- "No investments found" (fallback)
- "No spending data available for the selected date range" (fallback)
- "Select Date Range" (fallback)
- "Select Currency" (fallback)
- "All Currencies" (fallback)
- "Start Date" (fallback)
- "End Date" (fallback)
- "Track your financial trends" (fallback)
- **Translation keys added**: `reports.csv`, `reports.pdf`, `reports.pleaseSelectDateRange`, `reports.shareCsv`, `reports.csvReady`, `reports.csvReadyDescription`, `reports.csvError`, `reports.sharePdf`, `reports.pdfReady`, `reports.pdfReadyDescription`, `reports.pdfError`

### 6. src/screens/EditTransactionScreen.tsx
- "Edit Transaction"
- "Update"
- "Delete"
- "Delete Transaction"
- "Are you sure you want to delete this transaction? This action cannot be undone."
- "Transaction deleted successfully"
- "Failed to delete transaction"
- "Transaction updated successfully"
- "Failed to update transaction"
- "Please fill in all required fields"
- "Deleting..." (fallback)
- **Translation keys added**: `editTransaction.*` (all keys)

### 7. src/screens/AllTransactionsScreen.tsx
- "Failed to load transactions. Please try again."
- "Failed to delete transaction. Please try again."
- "Uncategorized" (fallback)
- "Transaction" (fallback)
- "Custom Date Range" (fallback message)
- **Note**: Some strings already have translation keys but are using fallbacks

### 8. src/screens/AllPaymentsScreen.tsx
- "Recurring Payment" (fallback)
- "Other" (fallback category)
- **Note**: Most strings already use translations

### 9. src/screens/SupportTicketsScreen.tsx
- "Failed to load support tickets" (fallback)
- **Note**: Most strings already use translations

### 10. Other Files
- Various fallback strings in multiple files that use `|| 'fallback'` pattern
- Console log messages (these don't need translation)

## Translation Keys Added

### New Sections Added to common.json:
1. **errorBoundary** - Error boundary messages
2. **freemium** - Freemium limit modal messages
3. **editTransaction** - Edit transaction screen messages
4. **reports** - Additional report-related strings (csv, pdf, etc.)
5. **payment** - Additional payment-related strings
6. **common** - Added: info, deleting, view, dismiss

## Next Steps

1. ✅ Add translation keys to English file
2. ⏳ Add translations to all other language files (es, zh-CN, hi, ar, fr, pt-BR, de, ja, ru)
3. ⏳ Update code files to use translation keys instead of hard-coded strings
4. ⏳ Test the application to ensure all translations work correctly

## Files That Need Code Updates

1. `App.tsx` - Error boundary
2. `src/utils/toast.ts` - Toast default titles
3. `src/components/FreemiumLimitModal.tsx` - Already uses translations with fallbacks, but fallbacks should be removed
4. `src/components/StripePaymentDialog.tsx` - Update hard-coded strings
5. `src/screens/ReportsScreen.tsx` - Update hard-coded strings
6. `src/screens/EditTransactionScreen.tsx` - Update hard-coded strings
7. `src/screens/AllTransactionsScreen.tsx` - Update hard-coded strings

