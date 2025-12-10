# Category Translation Implementation Plan

## Current Situation

1. **Backend API**: Already translates categories based on user's `preferred_locale` stored in database
2. **Backend Middleware**: `SetLocaleFromRequest` checks:
   - `Accept-Language` header (priority 1)
   - `lang` query parameter (priority 2)
   - User's `preferred_locale` from database (priority 3)
   - Falls back to app default

3. **Mobile App Issues**:
   - API client doesn't send `Accept-Language` header
   - Categories are fetched once and cached
   - When user changes language, categories don't update
   - Some screens use `translateCategoryName` utility, but not consistently

## Solution: Hybrid Approach

### Phase 1: Send Language Header to Backend ✅
- Update API client to send `Accept-Language` header with current i18n language
- Backend will translate categories automatically
- This ensures backend always uses current app language, not just database preference

### Phase 2: Client-Side Translation Fallback ✅
- Enhance `translateCategoryName` utility to handle all cases
- Use for:
  - Custom categories (not in backend translation)
  - Fallback when backend translation fails
  - Displaying category names in UI

### Phase 3: Refetch Categories on Language Change ✅
- Listen to language change events
- Refetch categories when language changes
- Update all screens that display categories

### Phase 4: Consistent Usage Across App ✅
- Update all screens to use `translateCategoryName`
- Ensure categories are displayed consistently everywhere

## Implementation Steps

1. ✅ Update API client to send `Accept-Language` header
2. ✅ Enhance `translateCategoryName` utility
3. ✅ Add language change listener to refetch categories
4. ✅ Update all screens to use translation consistently
5. ✅ Test with different languages

## Files to Modify

1. `src/api/client.ts` - Add Accept-Language header
2. `src/utils/categoryTranslator.ts` - Enhance translation logic
3. `src/screens/AddTransactionScreen.tsx` - Use translation
4. `src/screens/EditTransactionScreen.tsx` - Use translation
5. `src/screens/AllTransactionsScreen.tsx` - Use translation
6. `src/screens/DashboardScreen.tsx` - Use translation
7. `src/screens/BudgetScreen.tsx` - Use translation
8. `src/screens/ReportsScreen.tsx` - Already uses it, verify
9. `src/screens/InvestmentsScreen.tsx` - Already uses it, verify
10. `src/components/Analytics.tsx` - Already uses it, verify

