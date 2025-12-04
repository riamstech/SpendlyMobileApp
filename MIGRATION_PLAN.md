# React Native Migration Plan - Spendly Mobile App

## 📋 Overview
Complete migration plan to convert React+Cordova app to React Native, maintaining all features and functionality.

---

## ✅ Phase 0: Foundation (COMPLETED)
- [x] Project setup with Expo
- [x] Splash Screen
- [x] Login Screen with API integration
- [x] Dashboard Screen with API integration
- [x] i18n setup (translations copied)
- [x] API client and services copied
- [x] Basic navigation (state-based)

---

## 🎯 Phase 1: Authentication & Onboarding (Priority: HIGH)

### 1.1 Signup Screen
**Status**: Not Started  
**Estimated Time**: 2-3 hours  
**Dependencies**: None  
**Tasks**:
- Create `SignupScreen.tsx` matching web design
- Form fields: Name, Email, Password, Confirm Password, Currency selector
- Referral code support (from URL params)
- API integration with `authService.register()`
- Validation with i18n error messages
- Navigate to Dashboard on success
- Link to Login screen

**Files to Create**:
- `src/screens/SignupScreen.tsx`

**API Services**: ✅ Already available (`authService.register`)

---

### 1.2 Forgot Password Screen
**Status**: Not Started  
**Estimated Time**: 1-2 hours  
**Dependencies**: None  
**Tasks**:
- Create `ForgotPasswordScreen.tsx`
- Email input field
- API integration with `authService.forgotPassword()`
- Success/error handling
- Back to Login link

**Files to Create**:
- `src/screens/ForgotPasswordScreen.tsx`

---

### 1.3 Reset Password Screen
**Status**: Not Started  
**Estimated Time**: 1-2 hours  
**Dependencies**: None  
**Tasks**:
- Create `ResetPasswordScreen.tsx`
- Token validation from URL params
- Password + Confirm Password fields
- API integration with `authService.resetPassword()`
- Success handling with redirect to Login

**Files to Create**:
- `src/screens/ResetPasswordScreen.tsx`

---

### 1.4 Onboarding Screen
**Status**: Not Started  
**Estimated Time**: 3-4 hours  
**Dependencies**: None  
**Tasks**:
- Create `OnboardingScreen.tsx` (multi-step wizard)
- Step 1: Welcome & Currency selection
- Step 2: Budget setup (optional)
- Step 3: Categories selection
- API integration to save onboarding data
- Skip option
- Progress indicator
- Navigate to Dashboard on complete

**Files to Create**:
- `src/screens/OnboardingScreen.tsx`

**API Services**: ✅ Available (`usersService`, `budgetsService`)

---

## 🎯 Phase 2: Core Navigation & UI Components (Priority: HIGH)

### 2.1 Bottom Tab Navigation
**Status**: Not Started  
**Estimated Time**: 2-3 hours  
**Dependencies**: Phase 1 screens  
**Tasks**:
- Create `BottomTabNavigator.tsx` component
- Tabs: Home, Reports, Budget, Add (+), Investments, Offers, Settings
- Active tab highlighting
- Floating action button for "Add" tab
- Safe area handling
- Match web app design exactly

**Files to Create**:
- `src/components/BottomTabNavigator.tsx`

**Icons**: ✅ `lucide-react-native` already installed

---

### 2.2 Screen Navigation System
**Status**: Not Started  
**Estimated Time**: 2 hours  
**Dependencies**: Bottom Tab Navigator  
**Tasks**:
- Update `App.tsx` to use screen-based navigation
- Implement screen state management
- Handle deep linking (optional for now)
- Back button handling

**Files to Update**:
- `App.tsx`

---

### 2.3 Common UI Components
**Status**: Not Started  
**Estimated Time**: 4-5 hours  
**Dependencies**: None  
**Tasks**:
- Create reusable Button component
- Create reusable Input component
- Create reusable Card component
- Create reusable Modal/Dialog component
- Create LoadingSpinner component
- Create ErrorMessage component
- Match web app styling

**Files to Create**:
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/LoadingSpinner.tsx`
- `src/components/ui/ErrorMessage.tsx`

---

## 🎯 Phase 3: Transaction Management (Priority: HIGH)

### 3.1 Add Transaction Screen
**Status**: Not Started  
**Estimated Time**: 4-5 hours  
**Dependencies**: UI Components, Categories API  
**Tasks**:
- Create `AddTransactionScreen.tsx`
- Form fields: Type (Income/Expense), Amount, Currency, Category, Date, Notes
- Category picker with icons
- Currency selector
- Recurring transaction option
- API integration with `transactionsService.createTransaction()`
- Success handling with navigation back
- Validation

**Files to Create**:
- `src/screens/AddTransactionScreen.tsx`

**API Services**: ✅ Available (`transactionsService.createTransaction`)

---

### 3.2 Edit Transaction Screen
**Status**: Not Started  
**Estimated Time**: 3-4 hours  
**Dependencies**: Add Transaction Screen  
**Tasks**:
- Create `EditTransactionScreen.tsx`
- Pre-fill form with existing transaction data
- API integration with `transactionsService.updateTransaction()`
- Delete transaction option
- Success handling

**Files to Create**:
- `src/screens/EditTransactionScreen.tsx`

---

### 3.3 All Transactions Screen
**Status**: Not Started  
**Estimated Time**: 4-5 hours  
**Dependencies**: Transaction Management  
**Tasks**:
- Create `AllTransactionsScreen.tsx`
- List view with filters (Type, Category, Date Range)
- Search functionality
- Pagination or infinite scroll
- Edit/Delete actions
- Pull to refresh
- Empty state

**Files to Create**:
- `src/screens/AllTransactionsScreen.tsx`

**API Services**: ✅ Available (`transactionsService.getTransactions`)

---

### 3.4 Transaction Details Modal
**Status**: Not Started  
**Estimated Time**: 2 hours  
**Dependencies**: Transaction Management  
**Tasks**:
- Create transaction detail view
- Show all transaction fields
- Edit/Delete buttons
- Receipt image display (if available)

**Files to Create**:
- `src/components/TransactionDetailModal.tsx`

---

## 🎯 Phase 4: Financial Features (Priority: MEDIUM)

### 4.1 Reports Screen
**Status**: Not Started  
**Estimated Time**: 6-8 hours  
**Dependencies**: Charts library  
**Tasks**:
- Create `ReportsScreen.tsx`
- Date range selector
- Income vs Expenses chart
- Category breakdown chart
- Monthly/yearly reports
- Export functionality (optional)
- API integration with `reportsService`

**Files to Create**:
- `src/screens/ReportsScreen.tsx`

**Libraries Needed**: `react-native-chart-kit` ✅ (already installed)

**API Services**: ✅ Available (`reportsService`)

---

### 4.2 Budget Screen
**Status**: Not Started  
**Estimated Time**: 5-6 hours  
**Dependencies**: Categories API  
**Tasks**:
- Create `BudgetScreen.tsx`
- Category budget list
- Add/Edit category budget
- Progress bars for each category
- Monthly budget overview
- API integration with `budgetsService`

**Files to Create**:
- `src/screens/BudgetScreen.tsx`

**API Services**: ✅ Available (`budgetsService`)

---

### 4.3 Investments Screen
**Status**: Not Started  
**Estimated Time**: 4-5 hours  
**Dependencies**: None  
**Tasks**:
- Create `InvestmentsScreen.tsx`
- Investment list view
- Add/Edit investment
- Investment performance tracking
- API integration with `investmentsService`

**Files to Create**:
- `src/screens/InvestmentsScreen.tsx`

**API Services**: ✅ Available (`investmentsService`)

---

### 4.4 Financial Health Widget
**Status**: Not Started  
**Estimated Time**: 3-4 hours  
**Dependencies**: Financial API  
**Tasks**:
- Create `FinancialHealthWidget.tsx` component
- Display net worth, assets, liabilities
- Health score visualization
- API integration with `financialService`

**Files to Create**:
- `src/components/FinancialHealthWidget.tsx`

**API Services**: ✅ Available (`financialService`)

---

## 🎯 Phase 5: Additional Features (Priority: MEDIUM)

### 5.1 Offers/Promotions Screen
**Status**: Not Started  
**Estimated Time**: 3-4 hours  
**Tasks**:
- Create `OffersScreen.tsx`
- List of available offers
- Promotional banners
- API integration with `promotionsService`

**Files to Create**:
- `src/screens/OffersScreen.tsx`

---

### 5.2 Settings Screen
**Status**: Not Started  
**Estimated Time**: 5-6 hours  
**Tasks**:
- Create `SettingsScreen.tsx`
- Profile settings
- Currency preferences
- Language selection
- Dark mode toggle
- Notification settings
- Account management
- Logout functionality
- API integration with `usersService`

**Files to Create**:
- `src/screens/SettingsScreen.tsx`

---

### 5.3 Receipts Screen
**Status**: Not Started  
**Estimated Time**: 4-5 hours  
**Tasks**:
- Create `ReceiptsScreen.tsx`
- Receipt list with thumbnails
- Upload receipt (camera/gallery)
- Receipt OCR (if backend supports)
- Link receipt to transaction
- API integration with `receiptsService`

**Files to Create**:
- `src/screens/ReceiptsScreen.tsx`

**Libraries Needed**: `expo-image-picker`, `expo-camera`

---

### 5.4 Goals Screen
**Status**: Not Started  
**Estimated Time**: 4-5 hours  
**Tasks**:
- Create `GoalsScreen.tsx`
- Goal list view
- Add/Edit/Delete goals
- Progress tracking
- API integration with `goalsService`

**Files to Create**:
- `src/screens/GoalsScreen.tsx`

---

### 5.5 Notifications/Inbox Screen
**Status**: Not Started  
**Estimated Time**: 3-4 hours  
**Tasks**:
- Create `InboxScreen.tsx`
- Notification list
- Mark as read/unread
- Delete notifications
- Badge count
- API integration with `notificationsService`

**Files to Create**:
- `src/screens/InboxScreen.tsx`

---

### 5.6 Referral Screen
**Status**: Not Started  
**Estimated Time**: 3-4 hours  
**Tasks**:
- Create `ReferralScreen.tsx`
- Display referral code
- Share functionality
- Referral stats
- API integration with `referralsService`

**Files to Create**:
- `src/screens/ReferralScreen.tsx`

---

### 5.7 Currency Converter Screen
**Status**: Not Started  
**Estimated Time**: 2-3 hours  
**Tasks**:
- Create `CurrencyConverterScreen.tsx`
- Currency conversion calculator
- Real-time rates (if API available)
- API integration with `currenciesService`

**Files to Create**:
- `src/screens/CurrencyConverterScreen.tsx`

---

## 🎯 Phase 6: Enhancements & Polish (Priority: LOW)

### 6.1 Dark Mode Support
**Status**: Not Started  
**Estimated Time**: 4-5 hours  
**Tasks**:
- Create theme context/provider
- Define light/dark color schemes
- Update all screens to use theme
- System preference detection
- Manual toggle in Settings

**Files to Create**:
- `src/contexts/ThemeContext.tsx`
- `src/constants/colors.ts`

---

### 6.2 Animations & Transitions
**Status**: Not Started  
**Estimated Time**: 3-4 hours  
**Tasks**:
- Add screen transition animations
- Loading state animations
- Success/error toast animations
- Pull-to-refresh animations

**Libraries**: React Native `Animated` API (built-in)

---

### 6.3 Offline Support
**Status**: Not Started  
**Estimated Time**: 6-8 hours  
**Tasks**:
- Implement AsyncStorage for offline data
- Queue API calls when offline
- Sync when back online
- Offline indicator

**Libraries**: ✅ `@react-native-async-storage/async-storage` (already installed)

---

### 6.4 Push Notifications
**Status**: Not Started  
**Estimated Time**: 4-5 hours  
**Tasks**:
- Setup Expo notifications
- Register device token
- Handle notification taps
- Badge management

**Libraries**: `expo-notifications`

---

### 6.5 Biometric Authentication
**Status**: Not Started  
**Estimated Time**: 3-4 hours  
**Tasks**:
- Add fingerprint/face ID support
- Secure token storage
- Settings toggle

**Libraries**: `expo-local-authentication`

---

## 📊 Implementation Priority Summary

### High Priority (Core Features)
1. ✅ Splash Screen
2. ✅ Login Screen
3. ✅ Dashboard Screen
4. Signup Screen
5. Forgot/Reset Password
6. Onboarding
7. Bottom Navigation
8. Add Transaction
9. Edit Transaction
10. All Transactions
11. Reports
12. Budget

### Medium Priority (Important Features)
13. Investments
14. Settings
15. Offers
16. Receipts
17. Goals
18. Notifications

### Low Priority (Nice to Have)
19. Dark Mode
20. Animations
21. Offline Support
22. Push Notifications
23. Biometric Auth

---

## 🛠️ Technical Considerations

### State Management
- Currently using React `useState` and `useContext` (simple approach)
- Consider adding `zustand` or `redux` if state becomes complex

### Navigation
- Currently using state-based navigation (simple, works)
- Can add React Navigation later if needed for deep linking

### Styling
- Using StyleSheet (React Native standard)
- Consider `styled-components` or `nativewind` for consistency with web

### Testing
- Unit tests for utilities
- Integration tests for API services
- E2E tests for critical flows (optional)

---

## 📝 Notes

- All API services are already copied and working ✅
- i18n translations are already set up ✅
- Focus on matching web app design exactly
- Maintain responsive design for all screen sizes
- Test on both iOS and Android devices

---

## 🚀 Next Steps

**Starting with Phase 1.1: Signup Screen**

This will complete the authentication flow and allow new users to register.

