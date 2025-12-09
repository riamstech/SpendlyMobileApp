import * as ImagePicker from 'expo-image-picker';

const isAvailable = true;

export const isImagePickerAvailable = () => isAvailable;

/**
 * Check media library permission status without requesting
 */
export const getMediaLibraryPermissionsAsync = async () => {
  return ImagePicker.getMediaLibraryPermissionsAsync();
};

/**
 * Request media library permissions (only shows dialog if not already granted)
 */
export const requestMediaLibraryPermissionsAsync = async () => {
  // Check current status first
  const currentStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
  // Only request if not already granted
  if (currentStatus.status === 'granted') {
    return currentStatus;
  }
  return ImagePicker.requestMediaLibraryPermissionsAsync();
};

/**
 * Check camera permission status without requesting
 */
export const getCameraPermissionsAsync = async () => {
  return ImagePicker.getCameraPermissionsAsync();
};

/**
 * Request camera permissions (only shows dialog if not already granted)
 */
export const requestCameraPermissionsAsync = async () => {
  // Check current status first
  const currentStatus = await ImagePicker.getCameraPermissionsAsync();
  // Only request if not already granted
  if (currentStatus.status === 'granted') {
    return currentStatus;
  }
  return ImagePicker.requestCameraPermissionsAsync();
};

export const launchImageLibraryAsync = async (options?: any) => {
  return ImagePicker.launchImageLibraryAsync(options);
};

export const launchCameraAsync = async (options?: any) => {
  return ImagePicker.launchCameraAsync(options);
};

// Export MediaTypeOptions
export const MediaTypeOptions = ImagePicker.MediaTypeOptions;
