# 🔐 Environment Variables Setup

## Overview

All hardcoded configuration values have been moved to environment variables for better security and flexibility.

---

## 📁 Files Created

### 1. `.env` (Local - Not committed to Git)
Contains your actual configuration values:
```env
API_BASE_URL=https://api.spendly.money/api
API_STORAGE_URL=https://api.spendly.money/storage
API_TIMEOUT=30000
GOOGLE_WEB_CLIENT_ID=913299133500-pn633h3t96sht7ama46r8736jjfann5v.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=913299133500-c6hjl99i7q14h40ne17mm2e2jrh2q9pu.apps.googleusercontent.com
GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.913299133500-c6hjl99i7q14h40ne17mm2e2jrh2q9pu
```

### 2. `.env.example` (Template - Committed to Git)
Template file showing required environment variables:
```env
API_BASE_URL=https://api.spendly.money/api
API_STORAGE_URL=https://api.spendly.money/storage
API_TIMEOUT=30000
GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.your-ios-client-id
```

---

## 🔄 Configuration Changes

### 1. `app.json` → `app.config.js`
- Converted `app.json` to `app.config.js` to support environment variables
- Environment variables are read via `dotenv` and exposed through `extra` field
- Accessible via `Constants.expoConfig.extra` in code

### 2. `src/config/env.ts`
Updated to read from environment variables:
```typescript
import Constants from 'expo-constants';

const getEnvVar = (key: string, fallback: string): string => {
  return Constants.expoConfig?.extra?.[key] || fallback;
};

export const config = {
  apiBaseUrl: getEnvVar('apiBaseUrl', 'https://api.spendly.money/api'),
  apiTimeout: parseInt(getEnvVar('apiTimeout', '30000'), 10),
  storageUrl: getEnvVar('apiStorageUrl', 'https://api.spendly.money/storage'),
  googleWebClientId: getEnvVar('googleWebClientId', '...'),
  googleIosClientId: getEnvVar('googleIosClientId', '...'),
};
```

### 3. `src/screens/LoginScreen.tsx`
Updated to use environment variables:
```typescript
import { config } from '../config/env';

const webClientId = config.googleWebClientId;
const iosClientId = config.googleIosClientId;
```

---

## 🚀 Setup Instructions

### For New Developers:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd SpendlyMobileApp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

4. **Update `.env` with your values:**
   - Edit `.env` file
   - Replace placeholder values with actual configuration

5. **Start the app:**
   ```bash
   npm start
   ```

---

## 📋 Environment Variables

### API Configuration
- `API_BASE_URL` - Backend API base URL
- `API_STORAGE_URL` - Storage URL for uploaded files
- `API_TIMEOUT` - API request timeout in milliseconds

### Google Sign-In Configuration
- `GOOGLE_WEB_CLIENT_ID` - Web OAuth client ID (for idToken generation)
- `GOOGLE_IOS_CLIENT_ID` - iOS OAuth client ID
- `GOOGLE_IOS_URL_SCHEME` - iOS URL scheme for Google Sign-In

---

## 🔒 Security Notes

1. **`.env` is in `.gitignore`** - Never commit actual values
2. **`.env.example` is committed** - Template for other developers
3. **Fallback values** - Code has fallback values if env vars are missing
4. **Production** - Use EAS Secrets or similar for production builds

---

## 🧪 Testing

After setting up environment variables:

1. **Verify configuration loads:**
   ```typescript
   import { config } from './src/config/env';
   console.log('API URL:', config.apiBaseUrl);
   console.log('Google Web Client ID:', config.googleWebClientId);
   ```

2. **Test Google Sign-In:**
   - Should use values from `.env`
   - Check logs for configured client IDs

3. **Test API calls:**
   - Should use API URL from `.env`

---

## 🔄 Migration from Hardcoded Values

### Before:
```typescript
apiBaseUrl: 'https://api.spendly.money/api',
webClientId: '913299133500-pn633h3t96sht7ama46r8736jjfann5v.apps.googleusercontent.com',
```

### After:
```typescript
apiBaseUrl: getEnvVar('apiBaseUrl', 'https://api.spendly.money/api'),
webClientId: config.googleWebClientId,
```

---

## 📝 Notes

- **Expo Configuration:** Uses `app.config.js` to read `.env` and expose via `extra` field
- **Runtime Access:** Access via `Constants.expoConfig.extra` in React Native code
- **Build Time:** Environment variables are embedded at build time
- **Restart Required:** After changing `.env`, restart Expo dev server

---

## ✅ Checklist

- [x] `.env` file created with all configuration
- [x] `.env.example` template created
- [x] `app.json` converted to `app.config.js`
- [x] `src/config/env.ts` updated to use environment variables
- [x] `LoginScreen.tsx` updated to use environment variables
- [x] `.gitignore` updated to exclude `.env`
- [ ] Test app with new configuration
- [ ] Verify Google Sign-In still works
- [ ] Verify API calls still work

---

**Last Updated:** After moving all hardcoded values to environment variables
