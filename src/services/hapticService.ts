import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback service for providing tactile feedback on user interactions
 */
class HapticService {
  private enabled: boolean = true;

  /**
   * Enable or disable haptic feedback globally
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Light impact - for subtle interactions like selection changes
   */
  async light() {
    if (!this.enabled || Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Silently fail if haptics not available
    }
  }

  /**
   * Medium impact - for standard button presses
   */
  async medium() {
    if (!this.enabled || Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Silently fail if haptics not available
    }
  }

  /**
   * Heavy impact - for significant actions like delete confirmations
   */
  async heavy() {
    if (!this.enabled || Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      // Silently fail if haptics not available
    }
  }

  /**
   * Success notification - for successful operations
   */
  async success() {
    if (!this.enabled || Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Silently fail if haptics not available
    }
  }

  /**
   * Warning notification - for warnings or cautions
   */
  async warning() {
    if (!this.enabled || Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      // Silently fail if haptics not available
    }
  }

  /**
   * Error notification - for error states
   */
  async error() {
    if (!this.enabled || Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      // Silently fail if haptics not available
    }
  }

  /**
   * Selection feedback - for picker/selection changes
   */
  async selection() {
    if (!this.enabled || Platform.OS === 'web') return;
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      // Silently fail if haptics not available
    }
  }
}

export const hapticService = new HapticService();
