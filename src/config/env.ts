import Constants from 'expo-constants';

// Get environment variables from app.config.js extra field
const getEnvVar = (key: string, fallback: string): string => {
  return Constants.expoConfig?.extra?.[key] || fallback;
};

export const config = {
  // API Configuration from environment variables
  apiBaseUrl: getEnvVar('apiBaseUrl', 'https://api.spendly.money/api'),
  apiTimeout: parseInt(getEnvVar('apiTimeout', '30000'), 10),
  // Storage URL for serving uploaded files (avatars, receipts, etc.)
  storageUrl: getEnvVar('apiStorageUrl', 'https://api.spendly.money/storage'),
  // Google Sign-In Configuration from environment variables
  googleWebClientId: getEnvVar('googleWebClientId', '913299133500-pn633h3t96sht7ama46r8736jjfann5v.apps.googleusercontent.com'),
  googleIosClientId: getEnvVar('googleIosClientId', '913299133500-c6hjl99i7q14h40ne17mm2e2jrh2q9pu.apps.googleusercontent.com'),
};


