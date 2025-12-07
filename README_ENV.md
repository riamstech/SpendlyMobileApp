# 🔐 Environment Variables - Quick Reference

## Setup

1. **Copy `.env.example` to `.env`:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your actual values**

3. **Restart Expo dev server:**
   ```bash
   npm start
   ```

## Available Environment Variables

```env
# API Configuration
API_BASE_URL=https://api.spendly.money/api
API_STORAGE_URL=https://api.spendly.money/storage
API_TIMEOUT=30000

# Google Sign-In
GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.your-ios-client-id
```

## Usage in Code

```typescript
import { config } from './src/config/env';

// API Configuration
const apiUrl = config.apiBaseUrl;
const storageUrl = config.storageUrl;

// Google Sign-In
const webClientId = config.googleWebClientId;
const iosClientId = config.googleIosClientId;
```

## Important Notes

- ✅ `.env` is in `.gitignore` - Never commit it
- ✅ `.env.example` is committed - Template for team
- ✅ Fallback values provided if env vars missing
- ⚠️ Restart Expo after changing `.env`
