# In-App Purchase Implementation Guide

## ✅ Completed Steps

### 1. Dependencies Installed
- ✅ `react-native-iap@14.6.2` installed
- ✅ iOS pods updated (NitroIap, openiap)
- ✅ Created `/src/services/inAppPurchase.ts`

## 📋 Next Steps Required

### Step 2: Create Products in App Store Connect

You need to create subscription products in App Store Connect:

1. **Go to App Store Connect**: https://appstoreconnect.apple.com
2. **My Apps** > **Spendly**
3. **Features** > **In-App Purchases**
4. **Click (+)** to create new subscription

**Create Two Subscriptions:**

#### Monthly Pro Subscription
- **Reference Name**: Spendly Pro Monthly
- **Product ID**: `com.spendly.mobile.pro.monthly`
- **Subscription Group Name**: Spendly Pro
- **Subscription Duration**: 1 Month
- **Price**: (Set your price, e.g., $4.99)

#### Yearly Pro Subscription  
- **Reference Name**: Spendly Pro Yearly
- **Product ID**: `com.spendly.mobile.pro.yearly`
- **Subscription Group Name**: Spendly Pro (same group)
- **Subscription Duration**: 1 Year
- **Price**: (Set your price, e.g., $39.99)

**For each subscription, add:**
- Localization (English)
- Display Name: "Spendly Pro" (or "Spendly Pro Monthly/Yearly")
- Description: Your subscription benefits

### Step 3: Update SettingsScreen to Use IAP on iOS

Add this import at the top of `src/screens/SettingsScreen.tsx`:

```typescript
import { iapService } from '../services/inAppPurchase';
import type { Product } from 'react-native-iap';
```

Add state for IAP products:

```typescript
const [iapProducts, setIapProducts] = useState<Product[]>([]);
const [isLoadingProducts, setIsLoadingProducts] = useState(false);
```

Add useEffect to initialize IAP:

```typescript
useEffect(() => {
  if (Platform.OS === 'ios') {
    initializeIAP();
  }
  
  return () => {
    if (Platform.OS === 'ios') {
      iapService.cleanup();
    }
  };
}, []);

const initializeIAP = async () => {
  try {
    await iapService.initialize();
    setIsLoadingProducts(true);
    const products = await iapService.getProducts();
    setIapProducts(products);
  } catch (error) {
    console.error('Error initializing IAP:', error);
  } finally {
    setIsLoadingProducts(false);
  }
};
```

Update the subscription purchase handler:

```typescript
const handleUpgradeToPro = async (plan: 'monthly' | 'yearly') => {
  if (Platform.OS === 'ios') {
    // Use Apple In-App Purchase
    try {
      const productId = plan === 'monthly' 
        ? 'com.spendly.mobile.pro.monthly'
        : 'com.spendly.mobile.pro.yearly';
      
      await iapService.purchaseSubscription(productId);
      // Purchase result handled by listener
      showToast.success('Processing purchase...', 'Please wait');
    } catch (error) {
      showToast.error('Purchase failed', 'Error');
    }
  } else {
    // Use Stripe for Android/Web
    // Existing Stripe implementation
  }
};
```

### Step 4: Backend Receipt Validation

Add endpoint in Laravel backend:

**Route** (`routes/api.php`):
```php
Route::post('subscriptions/apple/verify', [AppleIAPController::class, 'verifyReceipt'])
    ->middleware('auth:sanctum');
```

**Controller** (`app/Http/Controllers/AppleIAPController.php`):
```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AppleIAPController extends Controller
{
    public function verifyReceipt(Request $request)
    {
        $validated = $request->validate([
            'receiptData' => 'required|string',
            'transactionId' => 'required|string',
            'productId' => 'required|string',
        ]);

        // Verify with Apple's servers
        $receiptData = $validated['receiptData'];
        
        // Try production first
        $response = $this->verifyWithApple($receiptData, false);
        
        // If sandbox receipt in production, try sandbox
        if ($response['status'] === 21007) {
            $response = $this->verifyWithApple($receiptData, true);
        }

        if ($response['status'] === 0) {
            // Receipt is valid
            $user = $request->user();
            
            // Update user's subscription
            $user->update([
                'pro_status' => true,
                'license_start_date' => now(),
                'license_end_date' => now()->addMonth(), // or addYear based on productId
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Subscription activated',
                'user' => $user,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Receipt verification failed',
        ], 400);
    }

    private function verifyWithApple(string $receiptData, bool $sandbox = false)
    {
        $url = $sandbox
            ? 'https://sandbox.itunes.apple.com/verifyReceipt'
            : 'https://buy.itunes.apple.com/verifyReceipt';

        $response = Http::post($url, [
            'receipt-data' => $receiptData,
            'password' => config('services.apple.shared_secret'), // Add to .env
        ]);

        return $response->json();
    }
}
```

**Add to `.env`**:
```
APPLE_SHARED_SECRET=your_shared_secret_from_app_store_connect
```

### Step 5: Update IAP Service to Call Backend

Update `src/services/inAppPurchase.ts`, in the `verifyPurchase` method:

```typescript
import { apiClient } from '../api/client';

private async verifyPurchase(purchase: SubscriptionPurchase): Promise<void> {
  try {
    const response = await apiClient.post('/subscriptions/apple/verify', {
      receiptData: purchase.transactionReceipt,
      transactionId: purchase.transactionId,
      productId: purchase.productId,
    });

    console.log('[IAP] Purchase verified:', response);
  } catch (error) {
    console.error('[IAP] Backend verification failed:', error);
    throw error;
  }
}
```

## 🧪 Testing

### Using Sandbox Tester Account

1. **Create Sandbox Tester**:
   - App Store Connect > Users and Access > Sandbox Testers
   - Create a new tester with unique email

2. **Sign Out of Real Apple ID on Device**:
   - Settings > App Store > Sign Out

3. **Test Purchase in App**:
   - Run the app
   - Go to subscription screen
   - Tap upgrade
   - Sign in with sandbox tester account when prompted
   - Complete test purchase

4. **Verify**:
   - Check subscription status in app
   - Check backend database for updated subscription

## 📝 Important Notes

1. **Sandbox Testing**: Always test with sandbox account before releasing
2. **Receipt Validation**: Always validate receipts server-side for security
3. **Subscription Lifecycle**: Handle renewals, cancellations, refunds
4. **Server-to-Server Notifications**: Set up Apple's webhook for subscription updates
5. **Restore Purchases**: Implement "Restore Purchases" button for users who reinstall

## 🚀 Deployment Checklist

- [ ] Products created in App Store Connect
- [ ] Shared secret obtained and added to backend `.env`
- [ ] Backend receipt validation endpoint implemented
- [ ] Frontend IAP service integrated in SettingsScreen
- [ ] Tested with sandbox account
- [ ] "Restore Purchases" button added
- [ ] Server-to-Server notifications configured (optional but recommended)
- [ ] Submit updated app to App Store

## 📖 Resources

- [App Store Connect Guide](https://developer.apple.com/app-store-connect/)
- [In-App Purchase Documentation](https://developer.apple.com/in-app-purchase/)
- [Receipt Validation Guide](https://developer.apple.com/documentation/appstorereceipts/verifyreceipt)
- [react-native-iap Documentation](https://github.com/dooboolab/react-native-iap)

---

**Current Status**: 
- ✅ iOS IAP library installed and configured
- ✅ Service layer created
- ⏳ Needs: App Store Connect product setup
- ⏳ Needs: Backend receipt validation
- ⏳ Needs: Frontend integration in Settings screen
