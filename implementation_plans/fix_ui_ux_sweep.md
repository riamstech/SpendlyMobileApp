# Comprehensive UI/UX & Bug Fix Plan

This plan addresses a list of 16 issues reported by the user regarding the Spendly mobile application.

## Priority 1: Data Integrity & Core Transaction Flow (Add/Edit)
- [ ] **Fix 4, 5, 9: Date Picker Issues**
    - Investigation: Check `AddTransactionScreen.tsx` for timezone issues or date object mutation. Ensure "Add" and "Loan" date pickers work consistently.
    - Fix: Ensure date selection reflects the user's intent without off-by-one errors.
- [ ] **Fix 6: Loan Amount Precision**
    - Investigation: Check why 50000 becomes 49998. Likely a floating-point issue or currency conversion/masking side effect.
    - Fix: Ensure exact integer or 2-decimal precision is sent to backend.
- [ ] **Fix 2, 12: Edit Transaction Screen**
    - Investigation: Check why existing data isn't pre-filled (params passing vs fetching). Verify `t()` usage for translations.
    - Fix: Ensure form populates with existing transaction data and all labels are localized.
- [ ] **Fix 13: Delete Transaction Feedback**
    - Fix: Add a Toast/Alert success message upon successful deletion.

## Priority 2: Reports & Analytics
- [ ] **Fix 1, 14: CSV Download**
    - Investigation: Check `exportCsv` function in `ReportsScreen.tsx` and permissions/file system usage (iOS specifically).
    - Fix: Ensure file is generated and share sheet is presented.
- [ ] **Fix 7: Reports Totals (Verify)**
    - Note: Recently updated logic.
    - Action: Verify `ReportsScreen.tsx` correctly sums income/expenses for the *current month* specifically.
- [ ] **Fix 8: Reports Typography**
    - Action: Audit `ReportsScreen` and `AnalyticsScreen` to remove any remaining `fonts.mono`.
- [ ] **Fix 16: Analytics No Records**
    - Investigation: Debug `AnalyticsScreen.tsx` data fetching. Check if backend returns empty or frontend fails to map it.

## Priority 3: Feature Enhancements & Other Screens
- [ ] **Fix 15: Settings Email Editing**
    - Fix: Make email field read-only in `SettingsScreen.tsx`.
- [ ] **Fix 10: Dashboard Budget Overview**
    - Investigation: Check `DashboardScreen.tsx` rendering logic for `BudgetOverview`.
- [ ] **Fix 11: All Transactions UI**
    - Fix: Add Duration (Month) and Currency dropdowns to header/top of `AllTransactionsScreen.tsx`. Default to Current Month & Base Currency.
- [ ] **Fix 3: Inbox Mark as Read**
    - Investigation: Check `NotificationsScreen.tsx` API call for marking read.

## Workflow
1. Apply Quick Fix (Settings Email).
2. Deep dive into Add/Edit Transaction logic (Date pickers, Loading data).
3. Tackle Reports/Analytics (CSV, Logic verification).
4. Implement remaining UI changes (Dashboard, All Transactions).
