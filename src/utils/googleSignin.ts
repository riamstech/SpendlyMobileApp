import { Platform } from 'react-native';

// Default mock implementation
let GoogleSigninModule: any = {
  configure: (params?: any) => {
  },
  hasPlayServices: async (params?: any) => {
    return Promise.resolve(true);
  },
  signIn: async () => {
    console.warn('Google Sign In is not available in this environment');
    throw new Error('Google Sign In is not available. Please check native configuration.');
  },
  getTokens: async () => {
    throw new Error('Google Sign In is not available');
  },
  signOut: async () => {
    return Promise.resolve();
  },
  isSignedIn: async () => {
    return Promise.resolve(false);
  },
  getCurrentUser: async () => {
    return Promise.resolve(null);
  },
};

let statusCodesModule = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
};

// Try to load the native module safely
try {
  // Use require within try-catch to prevent app crash if native module is missing
  const googleSigninPkg = require('@react-native-google-signin/google-signin');
  if (googleSigninPkg && googleSigninPkg.GoogleSignin) {
    GoogleSigninModule = googleSigninPkg.GoogleSignin;
    statusCodesModule = googleSigninPkg.statusCodes || statusCodesModule;
  }
} catch (error) {
  console.warn('Warning: @react-native-google-signin/google-signin native module could not be loaded.', error);
}

export const GoogleSignin = GoogleSigninModule;
export const statusCodes = statusCodesModule;
