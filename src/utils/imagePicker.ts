/**
 * Safe wrapper for expo-image-picker that handles missing native module gracefully
 * This prevents crashes when the native module isn't available (e.g., during development builds)
 */

let ImagePicker: any = null;
let isAvailable = false;

// Try to load the module, but don't crash if it's not available
try {
  ImagePicker = require('expo-image-picker');
  isAvailable = true;
} catch (error) {
  console.warn('expo-image-picker native module not available:', error);
  isAvailable = false;
}

export const isImagePickerAvailable = () => isAvailable;

export const requestMediaLibraryPermissionsAsync = async () => {
  if (!isAvailable || !ImagePicker) {
    throw new Error('ImagePicker native module is not available. Please rebuild the app with expo-image-picker plugin.');
  }
  return ImagePicker.requestMediaLibraryPermissionsAsync();
};

export const requestCameraPermissionsAsync = async () => {
  if (!isAvailable || !ImagePicker) {
    throw new Error('ImagePicker native module is not available. Please rebuild the app with expo-image-picker plugin.');
  }
  return ImagePicker.requestCameraPermissionsAsync();
};

export const launchImageLibraryAsync = async (options?: any) => {
  if (!isAvailable || !ImagePicker) {
    throw new Error('ImagePicker native module is not available. Please rebuild the app with expo-image-picker plugin.');
  }
  return ImagePicker.launchImageLibraryAsync(options);
};

export const launchCameraAsync = async (options?: any) => {
  if (!isAvailable || !ImagePicker) {
    throw new Error('ImagePicker native module is not available. Please rebuild the app with expo-image-picker plugin.');
  }
  return ImagePicker.launchCameraAsync(options);
};

// Export MediaTypeOptions if available
export const MediaTypeOptions = isAvailable && ImagePicker ? ImagePicker.MediaTypeOptions : {
  Images: 'images',
  Videos: 'videos',
  All: 'all',
};
