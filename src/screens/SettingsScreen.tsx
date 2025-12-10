import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  useWindowDimensions,
  Modal,
  ActivityIndicator,
  Switch,
  Image,
  Platform,
  AppState,
  KeyboardAvoidingView,
} from 'react-native';
import {
  requestMediaLibraryPermissionsAsync,
  getMediaLibraryPermissionsAsync,
  launchImageLibraryAsync,
  MediaTypeOptions,
  isImagePickerAvailable,
} from '../utils/imagePicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import {
  User,
  Mail,
  DollarSign,
  Moon,
  Bell,
  Lock,
  Download,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  MapPin,
  Calendar,
  Globe,
  LogOut,
  Shield,
  Eye,
  EyeOff,
  Crown,
  Clock,
  Target,
  Gift,
  BarChart3,
  FileText,
  RefreshCw,
  MessageSquare,
} from 'lucide-react-native';
import { authService } from '../api/services/auth';
import { usersService } from '../api/services/users';
import { currenciesService, Currency } from '../api/services/currencies';
import { dashboardService } from '../api/services/dashboard';
import { subscriptionsService } from '../api/services/subscriptions';
import { devicesService } from '../api/services/devices';
import * as Linking from 'expo-linking';
import { showToast } from '../utils/toast';
import { COUNTRIES, US_STATES, CA_PROVINCES } from '../constants/countries';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { textStyles, createResponsiveTextStyles, fonts } from '../constants/fonts';
import StripePaymentDialog from '../components/StripePaymentDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getCurrencyForCountry, convertUsdToCurrency, formatCurrencyAmount } from '../utils/currencyConverter';
import { notificationService } from '../services/notificationService';

const LANGUAGE_FLAGS: Record<string, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  'zh-CN': '🇨🇳',
  hi: '🇮🇳',
  ar: '🇸🇦',
  fr: '🇫🇷',
  'pt-BR': '🇧🇷',
  'pt-PT': '🇵🇹',
  ru: '🇷🇺',
  ja: '🇯🇵',
  de: '🇩🇪',
};

interface SettingsScreenProps {
  onLogout: () => void;
  onViewReferral?: () => void;
  onViewGoals?: () => void;
  onViewAnalytics?: () => void;
  onViewReceipts?: () => void;
  onViewSupportTickets?: () => void;
  onRenewLicense?: () => void;
}

export default function SettingsScreen({ onLogout, onViewReferral, onViewGoals, onViewAnalytics, onViewReceipts, onViewSupportTickets, onRenewLicense }: SettingsScreenProps) {
  const { t, i18n } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { isDark, colors, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [budgetCycleDay, setBudgetCycleDay] = useState(1);


  const responsiveTextStyles = createResponsiveTextStyles(width);

  // Calculate pricing based on user's country/currency
  const pricingData = React.useMemo(() => {
    if (!user) return null;
    
    // Default to USD if checking country fails or currencies not loaded
    // Prioritize user's selected defaultCurrency if available, otherwise fallback to country-based currency
    const userCurrencyCode = user.defaultCurrency || getCurrencyForCountry(user.country) || 'USD';
    
    // Use base prices from Web App logic: $2/mo and $10/yr
    const monthlyPrice = convertUsdToCurrency(2, userCurrencyCode, currencies);
    const yearlyPrice = convertUsdToCurrency(10, userCurrencyCode, currencies);
    
    return {
      monthly: `${monthlyPrice.symbol}${formatCurrencyAmount(monthlyPrice.amount, monthlyPrice.symbol)}`,
      yearly: `${yearlyPrice.symbol}${formatCurrencyAmount(yearlyPrice.amount, yearlyPrice.symbol)}`,
      monthlyAmount: monthlyPrice.amount,
      yearlyAmount: yearlyPrice.amount,
      currencyCode: userCurrencyCode
    };
  }, [user, currencies]);


  
  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    preferences: false,
    security: false,
    location: false,
    features: false,
    subscription: false,
    data: false,
  });

  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');

  // Preferences
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [preferredLocale, setPreferredLocale] = useState('en');
  const [notifications, setNotifications] = useState(true);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<'granted' | 'denied' | 'undetermined' | 'checking'>('checking');
  const [biometricLock, setBiometricLock] = useState(false);
  const [showStripePayment, setShowStripePayment] = useState(false);
  const [stripePaymentData, setStripePaymentData] = useState<{
    planType: 'monthly' | 'yearly';
    paymentMethod: 'card' | 'upi';
  } | null>(null);
  
  // Search states
  const [currencySearch, setCurrencySearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');

  // Security
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Modals
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showBudgetCycleModal, setShowBudgetCycleModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Saving states
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingBudgetCycle, setSavingBudgetCycle] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Listen for app state changes to refresh notification permission status
  // This ensures the toggle reflects the actual system permission when user returns from settings
  useEffect(() => {
    let appStateSubscription: any;

    const checkPermissionOnFocus = async () => {
      try {
        const status = await notificationService.getPermissionStatus();
        setNotificationPermissionStatus(status);
        
        // Sync toggle with actual permission status
        if (status === 'granted') {
          // Permission granted - check backend preference
          try {
            const settings = await usersService.getUserSettings();
            const backendEnabled = settings.settings?.notificationsEnabled !== false;
            setNotifications(backendEnabled);
          } catch (error) {
            console.error('Error checking backend settings:', error);
          }
        } else {
          // Permission not granted - toggle must be OFF
          setNotifications(false);
          // Update backend if it was enabled
          try {
            const settings = await usersService.getUserSettings();
            if (settings.settings?.notificationsEnabled) {
              await usersService.updateUserSettings({
                notifications_enabled: false,
              });
            }
          } catch (error) {
            console.error('Error updating notification setting:', error);
          }
        }
      } catch (error) {
        console.error('Error checking notification permission on focus:', error);
      }
    };

    // Check when app comes to foreground (user returns from settings)
    if (AppState.addEventListener) {
      appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          console.log('📱 App became active - checking notification permission status...');
          checkPermissionOnFocus();
        }
      });
    } else {
      // Fallback for older React Native versions
      appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          checkPermissionOnFocus();
        }
      });
    }

    return () => {
      if (appStateSubscription && appStateSubscription.remove) {
        appStateSubscription.remove();
      }
    };
  }, []);

  // Reset avatar load error when user changes
  useEffect(() => {
    if (user) {
      setAvatarLoadError(false);
    }
  }, [user?.avatar, (user as any)?.avatar_url]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load user data
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setName(userData.name || '');
      setEmail(userData.email || '');
      setCountry(userData.country || '');
      setState(userData.state || '');
      setSelectedCurrency(userData.defaultCurrency || 'USD');
      const userPreferredLocale = userData.preferredLocale || i18n.language || 'en';
      setPreferredLocale(userPreferredLocale);
      
      // Apply user's preferred language if it's different from current
      if (userData.preferredLocale && userData.preferredLocale !== i18n.language) {
        await i18n.changeLanguage(userData.preferredLocale);
      }
      
      // Load currencies
      try {
        const currenciesData = await currenciesService.getCurrencies();
        setCurrencies(currenciesData);
      } catch (error) {
        console.error('Failed to load currencies:', error);
      }
      
      // Load user settings
      try {
        const settings = await usersService.getUserSettings();
        const backendNotificationsEnabled = settings.settings?.notificationsEnabled !== false;
        setBiometricLock(settings.settings?.biometricLockEnabled || false);
        setBudgetCycleDay(settings.settings?.budgetCycleDay || 1);
        
        // Check actual notification permission status (without requesting)
        try {
          const status = await notificationService.getPermissionStatus();
          setNotificationPermissionStatus(status);
          
          // Sync toggle with actual system permission status
          // If system permission is not granted, toggle should be OFF regardless of backend setting
          if (status === 'granted') {
            // Permission granted - use backend preference
            setNotifications(backendNotificationsEnabled);
          } else {
            // Permission denied or undetermined - toggle must be OFF
            setNotifications(false);
            // If backend says enabled but system permission is not granted, update backend
            if (backendNotificationsEnabled) {
              console.log('⚠️ Backend has notifications enabled but system permission is not granted. Syncing...');
              try {
                await usersService.updateUserSettings({
                  notifications_enabled: false,
                });
              } catch (error) {
                console.error('Error syncing notification setting:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error checking notification permissions:', error);
          setNotificationPermissionStatus('undetermined');
          // On error, default to backend setting but show as undetermined
          setNotifications(backendNotificationsEnabled);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      showToast.error(t('settings.errorLoadSettings'), t('settings.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
        if (!event.url) return;
        
        try {
            const parsed = Linking.parse(event.url);
            const queryParams = parsed.queryParams;
            
            if (queryParams?.payment === 'success') {
                setLoading(true);
                
                // If it's a Razorpay Payment Link redirect, verify it
                if (queryParams.razorpay_payment_link_id) {
                     await subscriptionsService.verifyPayment({
                         payment_link_id: queryParams.razorpay_payment_link_id
                     });
                     await loadInitialData();
                     showToast.success(t('settings.successSubscriptionActive') || 'Subscription Activated!', t('settings.success'));
                } else {
                     // For Stripe or others, just refresh data (assuming Webhook handled it)
                     // Or wait a bit?
                     // Stripe webhook might take a second.
                     setTimeout(async () => {
                        await loadInitialData();
                        showToast.success(t('settings.successSubscriptionActive') || 'Payment Successful!', t('settings.success'));
                     }, 2000);
                }
            } else if (queryParams?.payment === 'cancel') {
                showToast.info('You have cancelled the payment.', t('settings.paymentCancelled') || 'Payment Cancelled');
            }
        } catch (error) {
            console.error('Deep link handling error:', error);
            showToast.error('Payment verification failed. If you were charged, please contact support.', t('settings.error'));
             await loadInitialData(); // Try to load anyway
        } finally {
            setLoading(false);
        }
    };

    Linking.getInitialURL().then((url) => {
        if (url) handleDeepLink({ url });
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getAvailableStates = (countryCode: string): string[] => {
    if (countryCode === 'US') return US_STATES;
    if (countryCode === 'CA') return CA_PROVINCES;
    return [];
  };

  const getInitials = (name: string | undefined): string => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return 'U';
    }
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSaveProfile = async () => {
    if (!name.trim() || !email.trim()) {
      showToast.error(t('settings.errorFillNameEmail'), t('settings.error'));
      return;
    }

    try {
      setSaving(true);
      await usersService.updateUser(user.id, {
        name: name.trim(),
        email: email.trim(),
        country: country || undefined,
        state: state || undefined,
      });
      
      await loadInitialData();
      setIsEditingProfile(false);
      showToast.success(t('settings.successProfileUpdated'), t('settings.success'));
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showToast.error(error.response?.data?.message || t('settings.errorUpdateProfile'), t('settings.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCountry = async (newCountry: string, newState: string = '') => {
    try {
      setSaving(true);
      await usersService.updateUser(user.id, {
        country: newCountry || undefined,
        state: newState || undefined,
      });
      
      setCountry(newCountry);
      setState(newState);
      await loadInitialData();
      showToast.success(t('settings.successProfileUpdated'), t('settings.success'));
    } catch (error: any) {
      console.error('Error updating country:', error);
      showToast.error(error.response?.data?.message || t('settings.errorUpdateProfile'), t('settings.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast.error(t('settings.errorFillPasswordFields'), t('settings.error'));
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast.error(t('settings.errorPasswordsNotMatch'), t('settings.error'));
      return;
    }

    if (newPassword.length < 8) {
      showToast.error(t('settings.errorPasswordLength'), t('settings.error'));
      return;
    }

    try {
      setSavingPassword(true);
      await authService.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      

      
      showToast.success(t('settings.successPasswordChanged'), t('settings.success'));
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      showToast.error(error.response?.data?.message || t('settings.errorChangePassword'), t('settings.error'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleUpdateCurrency = async (currency: string) => {
    try {
      setSaving(true);
      await usersService.updateUser(user.id, {
        defaultCurrency: currency,
      });
      
      setSelectedCurrency(currency);
      await loadInitialData();
      showToast.success(t('settings.successCurrencyUpdated'), t('settings.success'));
    } catch (error: any) {
      console.error('Error updating currency:', error);
      showToast.error(error.response?.data?.message || t('settings.errorUpdateCurrency'), t('settings.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLanguage = async (locale: string) => {
    try {
      setSavingLanguage(true);
      await usersService.updateUserSettings({
        preferred_locale: locale,
      });
      
      await i18n.changeLanguage(locale);
      setPreferredLocale(locale);
      showToast.success(t('settings.successLanguageUpdated'), t('settings.success'));
    } catch (error: any) {
      console.error('Error updating language:', error);
      showToast.error(error.response?.data?.message || t('settings.errorUpdateLanguage'), t('settings.error'));
    } finally {
      setSavingLanguage(false);
    }
  };

  const handleUpdateBudgetCycle = async (day: number) => {
    try {
      setSavingBudgetCycle(true);
      await usersService.updateUserSettings({
        budget_cycle_day: day,
      });
      
      setBudgetCycleDay(day);
      showToast.success(t('settings.successBudgetCycleUpdated', { day }), t('settings.success'));
    } catch (error: any) {
      console.error('Error updating budget cycle:', error);
      showToast.error(error.response?.data?.message || t('settings.errorUpdateBudgetCycle'), t('settings.error'));
    } finally {
      setSavingBudgetCycle(false);
    }
  };

  const handleToggleDarkMode = async (enabled: boolean) => {
    try {
      await usersService.updateUserSettings({
        dark_mode: enabled,
      });
      await toggleTheme();
    } catch (error: any) {
      console.error('Error updating dark mode:', error);
      showToast.error(t('settings.errorUpdateDarkMode'), t('settings.error'));
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    try {
      // First check current permission status
      const currentStatus = await notificationService.getPermissionStatus();
      setNotificationPermissionStatus(currentStatus);
      
      // If permission is denied, always open settings (regardless of toggle direction)
      if (currentStatus === 'denied') {
        console.log('📱 Permission denied - opening device settings...');
        Alert.alert(
          t('settings.notificationPermissionDenied') || 'Notification Permission Required',
          t('settings.notificationPermissionDeniedMessage') || 
          'Notifications are disabled in device Settings. Please enable them to receive push notifications.',
          [
            { 
              text: t('settings.cancel') || 'Cancel', 
              style: 'cancel'
            },
            { 
              text: t('settings.openSettings') || 'Open Settings', 
              onPress: async () => {
                try {
                  // Open device settings
                  await Linking.openSettings();
                  console.log('✅ Opened device settings');
                } catch (error) {
                  console.error('Error opening settings:', error);
                  Alert.alert(
                    t('settings.error') || 'Error',
                    t('settings.errorOpenSettings') || 'Could not open settings. Please go to Settings → Apps → Spendly Money → Notifications manually.'
                  );
                }
              }
            }
          ]
        );
        // Keep toggle off since permission is denied
        setNotifications(false);
        return;
      }
      
      // If enabling notifications, request system permissions first
      if (enabled) {
        console.log('🔔 Enabling notifications - requesting system permissions...');
        setNotificationPermissionStatus('checking');
        
        // Request permissions (will show dialog if undetermined)
        const permissionResult = await notificationService.requestPermissions();
        setNotificationPermissionStatus(permissionResult.status as 'granted' | 'denied' | 'undetermined');
        
        if (!permissionResult.granted) {
          console.log('⚠️ Notification permissions not granted');
          console.log('📊 Permission status:', permissionResult.status);
          
          // If still not granted after request, open settings
          if (permissionResult.status === 'denied') {
            Alert.alert(
              t('settings.notificationPermissionDenied') || 'Notification Permission Required',
              t('settings.notificationPermissionDeniedMessage') || 
              'To enable notifications, please enable them in your device settings.',
              [
                { 
                  text: t('settings.cancel') || 'Cancel', 
                  style: 'cancel', 
                  onPress: () => setNotifications(false) 
                },
                { 
                  text: t('settings.openSettings') || 'Open Settings', 
                  onPress: async () => {
                    try {
                      // Open device settings
                      await Linking.openSettings();
                      console.log('✅ Opened device settings');
                      setNotifications(false);
                    } catch (error) {
                      console.error('Error opening settings:', error);
                      Alert.alert(
                        t('settings.error') || 'Error',
                        t('settings.errorOpenSettings') || 'Could not open settings. Please go to Settings → Apps → Spendly Money → Notifications manually.'
                      );
                      setNotifications(false);
                    }
                  }
                }
              ]
            );
            return;
          } else {
            // Permission not granted but can ask again (undetermined) - this shouldn't happen after requestPermissions
            // But if it does, open settings as fallback
            Alert.alert(
              t('settings.notificationPermissionRequired') || 'Notification Permission Required',
              t('settings.notificationPermissionRequiredMessage') || 
              'Please enable notifications in your device settings.',
              [
                { 
                  text: t('settings.cancel') || 'Cancel', 
                  style: 'cancel',
                  onPress: () => setNotifications(false)
                },
                { 
                  text: t('settings.openSettings') || 'Open Settings', 
                  onPress: async () => {
                    try {
                      await Linking.openSettings();
                      setNotifications(false);
                    } catch (error) {
                      console.error('Error opening settings:', error);
                      setNotifications(false);
                    }
                  }
                }
              ]
            );
            return;
          }
        }
        
        console.log('✅ Notification permissions granted');
        
        // If permission granted, get push token and register device
        try {
          const pushToken = await notificationService.getExpoPushToken();
          if (pushToken) {
            const deviceUUID = await notificationService.getDeviceUUID();
            // Register device with backend
            await devicesService.registerDevice(deviceUUID, pushToken);
            console.log('✅ Notifications enabled and device registered');
          }
        } catch (error) {
          console.error('Error initializing notifications:', error);
          // Don't fail the toggle if this fails, but show a warning
          showToast.info(t('settings.notificationSetupIncomplete') || 'Notifications enabled but device registration failed. You may not receive notifications.', t('settings.warning') || 'Warning');
        }
      }
      
      // Update backend setting
      await usersService.updateUserSettings({
        notifications_enabled: enabled,
      });
      setNotifications(enabled);
      
    } catch (error: any) {
      console.error('Error updating notifications:', error);
      showToast.error(error.response?.data?.message || t('settings.errorUpdateNotifications'), t('settings.error'));
      // Revert toggle on error
      setNotifications(!enabled);
    }
  };

  const handleToggleBiometricLock = async (enabled: boolean) => {
    try {
      await usersService.updateUserSettings({
        biometric_lock_enabled: enabled,
      });
      setBiometricLock(enabled);
      // Note: Biometric lock implementation would go here
    } catch (error: any) {
      console.error('Error updating biometric lock:', error);
      showToast.error(t('settings.errorUpdateBiometricLock'), t('settings.error'));
    }
  };

  const handleBackupData = async () => {
    try {
      setSaving(true);
      const backup = await usersService.backupData();
      
      // In React Native, we'd need to use a file system library to save the file
      // For now, simple toast
      showToast.success('Backup data generated successfully', 'Success');
    } catch (error: any) {
      console.error('Error backing up data:', error);
      showToast.error(error.response?.data?.message || t('settings.errorBackupData'), t('settings.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      t('settings.deleteAccountTitle'),
      t('settings.deleteAccountConfirm'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await usersService.deleteAccount();
              showToast.success(t('settings.successAccountDeleted'), t('settings.success'));
              onLogout();
            } catch (error: any) {
              console.error('Error deleting account:', error);
              showToast.error(error.response?.data?.message || t('settings.errorDeleteAccount'), t('settings.error'));
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(t('settings.logoutTitle'), t('settings.logoutConfirm'), [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        onPress: async () => {
          try {
            await authService.logout();
            onLogout();
          } catch (error) {
            console.error('Error logging out:', error);
            // Still logout locally even if API call fails
            onLogout();
          }
        },
      },
    ]);
  };

  const handleUploadAvatar = async () => {
    try {
      // Check if ImagePicker is available - disabled check to fix availability issue
      // if (!isImagePickerAvailable()) return;


      // Only request permission when user explicitly tries to upload
      // Check current status first to avoid unnecessary permission dialogs
      let permissionStatus = await getMediaLibraryPermissionsAsync();
      
      // Only request if not already granted
      if (permissionStatus.status !== 'granted') {
        permissionStatus = await requestMediaLibraryPermissionsAsync();
        if (permissionStatus.status !== 'granted') {
          Alert.alert(t('settings.permissionDenied'), t('settings.permissionDeniedMessage'));
          return;
        }
      }

      // Launch image picker
      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const imageAsset = result.assets[0];
      const imageUri = imageAsset.uri;
      
      // Get file extension from URI or use default
      const uriParts = imageUri.split('.');
      const fileExtension = uriParts[uriParts.length - 1] || 'jpg';
      const imageName = `avatar_${Date.now()}.${fileExtension}`;
      
      // Determine MIME type based on extension
      let imageType = 'image/jpeg';
      if (fileExtension === 'png') {
        imageType = 'image/png';
      } else if (fileExtension === 'gif') {
        imageType = 'image/gif';
      } else if (fileExtension === 'webp') {
        imageType = 'image/webp';
      }

      // Create FormData for React Native
      // React Native FormData requires this specific format
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: imageType,
        name: imageName,
      } as any);

      console.log('Uploading avatar:', { 
        imageUri, 
        imageName, 
        imageType, 
        platform: Platform.OS,
        formDataKeys: Object.keys(formData)
      });

      setUploadingAvatar(true);
      const response = await usersService.uploadAvatar(formData as any);
      
      // Update user avatar
      const updatedUser = {
        ...user,
        avatar: response.avatar || response.avatar_url,
        avatar_url: response.avatar_url || response.avatar,
      };
      setUser(updatedUser);
      // Reset avatar load error to show new image
      setAvatarLoadError(false);
      
      Alert.alert(t('settings.success'), t('settings.successProfilePhotoUpdated'));
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      
      let errorMessage = t('settings.errorUploadProfilePhoto');
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle Laravel validation errors
        const errors = error.response.data.errors;
        if (errors.avatar && Array.isArray(errors.avatar)) {
          errorMessage = errors.avatar[0];
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        t('settings.error'),
        errorMessage
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getAvatarUrl = (avatarPath?: string | null): string | undefined => {
    if (!avatarPath) return undefined;
    // Handle both avatar and avatar_url fields
    const path = avatarPath || (user as any)?.avatar_url;
    if (!path) return undefined;
    return usersService.getAvatarUrl(path);
  };

  if (loading || !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <LoadingSpinner 
          size="large" 
          text={t('common.loading') || 'Loading...'} 
          fullScreen={true}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, responsiveTextStyles.h2, { color: colors.foreground }]}>{t('nav.settings')}</Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>{t('settings.subtitle')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Pressable
            style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
            onPress={() => toggleSection('profile')}
          >
            <View style={styles.sectionHeaderLeft}>
              <User size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('settings.profile')}</Text>
            </View>
            {expandedSections.profile ? (
              <ChevronUp size={20} color={colors.mutedForeground} />
            ) : (
              <ChevronDown size={20} color={colors.mutedForeground} />
            )}
          </Pressable>

          {expandedSections.profile && (
            <View style={styles.sectionContent}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  {getAvatarUrl(user.avatar || (user as any)?.avatar_url) && !avatarLoadError ? (
                    <Image 
                      source={{ uri: getAvatarUrl(user.avatar || (user as any)?.avatar_url) || '' }} 
                      onLoadStart={() => console.log('Loading avatar from:', getAvatarUrl(user.avatar || (user as any)?.avatar_url))}
                      style={styles.avatar}
                      onError={(error) => {
                        // Fallback to placeholder if image fails to load
                        console.log('Avatar image failed to load:', error.nativeEvent);
                        setAvatarLoadError(true);
                      }}
                      onLoad={() => {
                        // Reset error state if image loads successfully
                        console.log('Avatar loaded successfully');
                        setAvatarLoadError(false);
                      }}
                    />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                      <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
                    </View>
                  )}
                </View>
                {!isEditingProfile && (
                    <Pressable
                      style={[styles.editButton, { borderColor: colors.primary }]}
                      onPress={() => setIsEditingProfile(true)}
                    >
                      <Text style={[styles.editButtonText, { color: colors.primary }]}>{t('settings.edit')}</Text>
                    </Pressable>
                )}
              </View>

              {isEditingProfile ? (
                <View style={styles.form}>
                  <View style={styles.formField}>
                    <Text style={[styles.formLabel, { color: colors.foreground }]}>{t('settings.name')}</Text>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                      value={name}
                      onChangeText={setName}
                      placeholder={t('settings.name')}
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </View>
                  <View style={styles.formField}>
                    <Text style={[styles.formLabel, { color: colors.foreground }]}>{t('auth.email')}</Text>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                      value={email}
                      onChangeText={setEmail}
                      placeholder={t('auth.email')}
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.formActions}>
                    <Pressable
                      style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
                      onPress={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.saveButtonText}>{t('settings.save')}</Text>
                      )}
                    </Pressable>
                    <Pressable
                      style={[styles.button, styles.cancelButton, { backgroundColor: colors.muted }]}
                      onPress={() => {
                        setIsEditingProfile(false);
                        setName(user.name || '');
                        setEmail(user.email || '');
                        setCountry(user.country || '');
                        setState(user.state || '');
                      }}
                    >
                      <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>{t('settings.cancel')}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: colors.foreground }]}>{user.name || t('settings.user')}</Text>
                  <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{user.email || t('settings.noEmail')}</Text>
                  {(user.country || user.state) && (
                    <Text style={[styles.profileLocation, { color: colors.mutedForeground }]}>
                      {user.country && COUNTRIES.find(c => c.code === user.country)?.name}
                      {user.country && user.state && ', '}
                      {user.state}
                    </Text>
                  )}
                  <Pressable
                    style={[styles.changePhotoButton, { borderColor: colors.border }]}
                    onPress={handleUploadAvatar}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={[styles.changePhotoButtonText, { color: colors.foreground }]}>
                        {t('settings.changePhoto')}
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Preferences Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Pressable
            style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
            onPress={() => toggleSection('preferences')}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('settings.preferences')}</Text>
            {expandedSections.preferences ? (
              <ChevronUp size={20} color={colors.mutedForeground} />
            ) : (
              <ChevronDown size={20} color={colors.mutedForeground} />
            )}
          </Pressable>

          {expandedSections.preferences && (
            <View style={styles.sectionContent}>
              <Pressable
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => setShowCurrencyModal(true)}
              >
                <View style={styles.settingItemLeft}>
                  <DollarSign size={20} color="#10B981" />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, textStyles.caption, { color: colors.foreground }]}>
                      {t('settings.defaultCurrency') || 'Default Currency'}
                    </Text>
                    <Text style={[styles.settingItemDescription, { color: colors.mutedForeground }]}>
                      {(() => {
                        const curr = currencies.find(c => c.code === selectedCurrency);
                        return curr ? `${curr.code}${curr.name ? ` - ${curr.name}` : ''}` : selectedCurrency;
                      })()}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
              </Pressable>

              <Pressable
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => setShowLanguageModal(true)}
              >
                <View style={styles.settingItemLeft}>
                  <Globe size={20} color="#3B82F6" />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, textStyles.caption, { color: colors.foreground }]}>{t('settings.language')}</Text>
                    <Text style={[styles.settingItemDescription, { color: colors.mutedForeground }]}>
                      {SUPPORTED_LANGUAGES.find(l => l.code === preferredLocale)?.name || preferredLocale}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
              </Pressable>

              <Pressable
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => setShowBudgetCycleModal(true)}
              >
                <View style={styles.settingItemLeft}>
                  <Calendar size={20} color="#8B5CF6" />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, textStyles.caption, { color: colors.foreground }]}>{t('settings.budgetCycleDay')}</Text>
                    <Text style={[styles.settingItemDescription, { color: colors.mutedForeground }]}>
                      {budgetCycleDay}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
              </Pressable>

              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <Moon size={20} color="#6366F1" />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, textStyles.caption, { color: colors.foreground }]}>{t('settings.darkMode')}</Text>
                    <Text style={[styles.settingItemDescription, { color: colors.mutedForeground }]}>{t('settings.darkModeDescription')}</Text>
                  </View>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={handleToggleDarkMode}
                  trackColor={{ false: '#ccc', true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              <Pressable
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={async () => {
                  // If permission is denied, open settings directly when clicking anywhere on the item
                  if (notificationPermissionStatus === 'denied') {
                    try {
                      await Linking.openSettings();
                      console.log('✅ Opened device settings from notification item');
                    } catch (error) {
                      console.error('Error opening settings:', error);
                      Alert.alert(
                        t('settings.error') || 'Error',
                        t('settings.errorOpenSettings') || 'Could not open settings. Please go to Settings → Apps → Spendly Money → Notifications manually.'
                      );
                    }
                  } else {
                    // Otherwise, toggle normally
                    handleToggleNotifications(!notifications);
                  }
                }}
              >
                <View style={styles.settingItemLeft}>
                  <Bell size={20} color="#F59E0B" />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, textStyles.caption, { color: colors.foreground }]}>{t('settings.notifications')}</Text>
                    <Text style={[styles.settingItemDescription, { color: colors.mutedForeground }]}>
                      {notificationPermissionStatus === 'granted' 
                        ? (t('settings.notificationsDescription') || 'Enable push notifications to stay updated')
                        : notificationPermissionStatus === 'denied'
                        ? (t('settings.notificationsPermissionDenied') || 'Disabled in device Settings - tap to enable')
                        : (t('settings.notificationsDescription') || 'Enable push notifications to stay updated')}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notifications && notificationPermissionStatus === 'granted'}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: '#ccc', true: colors.primary }}
                  thumbColor="#fff"
                  disabled={notificationPermissionStatus === 'denied'}
                />
              </Pressable>
            </View>
          )}
        </View>

        {/* Security Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Pressable
            style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
            onPress={() => toggleSection('security')}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('settings.security')}</Text>
            {expandedSections.security ? (
              <ChevronUp size={20} color={colors.mutedForeground} />
            ) : (
              <ChevronDown size={20} color={colors.mutedForeground} />
            )}
          </Pressable>

          {expandedSections.security && (
            <View style={styles.sectionContent}>
              <Pressable
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => setShowChangePassword(true)}
              >
                <View style={styles.settingItemLeft}>
                  <Lock size={20} color="#EF4444" />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, textStyles.caption, { color: colors.foreground }]}>{t('settings.changePassword')}</Text>
                    <Text style={[styles.settingItemDescription, { color: colors.mutedForeground }]}>
                      {t('settings.changePasswordSubtitle') || 'Update your account password'}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
              </Pressable>

              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <Shield size={20} color="#10B981" />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, textStyles.caption, { color: colors.foreground }]}>{t('settings.biometricLock')}</Text>
                    <Text style={[styles.settingItemDescription, { color: colors.mutedForeground }]}>{t('settings.biometricLockDescription')}</Text>
                  </View>
                </View>
                <Switch
                  value={biometricLock}
                  onValueChange={handleToggleBiometricLock}
                  trackColor={{ false: '#ccc', true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          )}
        </View>

        {/* Location Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Pressable
            style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
            onPress={() => toggleSection('location')}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('settings.location')}</Text>
            {expandedSections.location ? (
              <ChevronUp size={20} color={colors.mutedForeground} />
            ) : (
              <ChevronDown size={20} color={colors.mutedForeground} />
            )}
          </Pressable>

          {expandedSections.location && (
            <View style={styles.sectionContent}>
              <Pressable
                style={styles.settingItem}
                onPress={() => setShowCountryModal(true)}
              >
                <View style={styles.settingItemLeft}>
                  <MapPin size={20} color="#3B82F6" />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, textStyles.caption, { color: colors.foreground }]}>
                      {t('settings.country') || 'Country'}
                    </Text>
                    <Text style={[styles.settingItemDescription, { color: colors.mutedForeground }]}>
                      {country ? COUNTRIES.find(c => c.code === country)?.name : t('settings.notSpecified') || 'Not specified'}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          )}
        </View>

        {/* Features Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Pressable
            style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
            onPress={() => toggleSection('features')}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('settings.featuresAndRewards')}
            </Text>
            {expandedSections.features ? (
              <ChevronUp size={20} color={colors.mutedForeground} />
            ) : (
              <ChevronDown size={20} color={colors.mutedForeground} />
            )}
          </Pressable>

          {expandedSections.features && (
            <View style={styles.sectionContent}>
              {/* Temporarily disabled - Savings Goals */}
              {/* <Pressable
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => onViewGoals?.()}
              >
                <View style={styles.settingItemLeft}>
                  <Target size={20} color="#9C27B0" />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, textStyles.caption, { color: colors.foreground }]}>
                      {t('goals.title') || 'Savings Goals'}
                    </Text>
                    <Text style={[styles.settingItemDescription, { color: colors.mutedForeground }]}>
                      {t('settings.trackSavingsProgress')}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
              </Pressable> */}

              {/* Temporarily disabled - Analytics */}
              {/* <Pressable
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => onViewAnalytics?.()}
              >
                <View style={styles.settingItemLeft}>
                  <BarChart3 size={20} color="#03A9F4" />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, textStyles.caption, { color: colors.foreground }]}>
                      {t('reports.analytics') || 'Analytics'}
                    </Text>
                    <Text style={[styles.settingItemDescription, { color: colors.mutedForeground }]}>
                      {t('settings.smartInsightsFinancialHealth')}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
              </Pressable> */}

              {/* Temporarily disabled - Receipts & OCR */}
              {/* <Pressable
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => onViewReceipts?.()}
              >
                <View style={styles.settingItemLeft}>
                  <FileText size={20} color="#FF9800" />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, textStyles.caption, { color: colors.foreground }]}>
                      {t('receipts.title') || 'Receipts & OCR'}
                    </Text>
                    <Text style={[styles.settingItemDescription, { color: colors.mutedForeground }]}>
                      {t('settings.scanOrganizeReceipts')}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
              </Pressable> */}




              {/* Refer & Earn */}
              <Pressable
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => onViewReferral?.()}
              >
                <View style={styles.settingItemLeft}>
                  <Gift size={20} color="#FF9800" />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, textStyles.caption, { color: colors.foreground }]}>
                      {t('settings.referAndEarn') || 'Refer & Earn'}
                    </Text>
                    <Text style={[styles.settingItemDescription, { color: colors.mutedForeground }]}>
                      {t('settings.referAndEarnSubtitle') || 'Invite friends and get Pro free'}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
              </Pressable>

              {/* Support Tickets */}
              <Pressable
                style={[styles.settingItem]}
                onPress={() => onViewSupportTickets?.()}
              >
                <View style={styles.settingItemLeft}>
                  <MessageSquare size={20} color="#3B82F6" />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, textStyles.caption, { color: colors.foreground }]}>
                      {t('mySupportTickets') || 'Support Tickets'}
                    </Text>
                    <Text style={[styles.settingItemDescription, { color: colors.mutedForeground }]}>
                      {t('mySupportTicketsSubtitle') || 'View and manage your tickets'}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          )}
        </View>



        {/* Subscription Section */}
        {user.proStatus !== undefined && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Pressable
              style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
              onPress={() => toggleSection('subscription')}
            >
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('settings.subscription')}</Text>
              {expandedSections.subscription ? (
                <ChevronUp size={20} color={colors.mutedForeground} />
              ) : (
                <ChevronDown size={20} color={colors.mutedForeground} />
              )}
            </Pressable>

            {expandedSections.subscription && (
              <View style={styles.sectionContent}>
                <View style={[styles.settingItem, { borderBottomColor: 'transparent', paddingVertical: 0 }]}>
                  <View style={styles.settingItemLeft}>
                    <Crown size={20} color="#FFD700" />
                    <View style={styles.settingItemInfo}>
                      <Text style={[styles.settingItemLabel, textStyles.caption, { color: colors.foreground }]}>
                        {t('settings.spendlyPremium') || 'Spendly Premium'}
                      </Text>
                      <Text style={[styles.settingItemDescription, { color: colors.mutedForeground }]}>
                        {user.licenseEndDate
                          ? t('settings.validUntil', { date: new Date(user.licenseEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) })
                          : t('settings.upgradeDescription') || 'Unlock unlimited features'}
                      </Text>
                    </View>
                  </View>
                  
                  <Pressable
                    style={{
                      backgroundColor: colors.primary,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                    }}
                    onPress={() => {
                      setStripePaymentData({
                        planType: 'yearly',
                        paymentMethod: 'card'
                      });
                      setShowStripePayment(true);
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>
                      {t('settings.extendLicense') || t('settings.renew') || 'Extend License'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Data Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Pressable
            style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
            onPress={() => toggleSection('data')}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('settings.dataManagement') || 'Data Management'}</Text>
            {expandedSections.data ? (
              <ChevronUp size={20} color={colors.mutedForeground} />
            ) : (
              <ChevronDown size={20} color={colors.mutedForeground} />
            )}
          </Pressable>

          {expandedSections.data && (
            <View style={styles.sectionContent}>
              <Pressable
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handleBackupData}
              >
                <View style={styles.settingItemLeft}>
                  <Download size={20} color={colors.primary} />
                  <Text style={[styles.settingItemLabel, textStyles.caption, { color: colors.foreground }]}>{t('settings.backupData')}</Text>
                </View>
              </Pressable>

              <Pressable
                style={[styles.settingItem, styles.dangerItem]}
                onPress={() => setShowDeleteAccountModal(true)}
              >
                <View style={styles.settingItemLeft}>
                  <Trash2 size={20} color={colors.destructive} />
                  <Text style={[styles.settingItemLabel, textStyles.caption, styles.dangerText, { color: colors.destructive }]}>{t('settings.deleteAccount')}</Text>
                </View>
              </Pressable>
            </View>
          )}
        </View>

        {/* Logout */}
        <Pressable
          style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <LogOut size={20} color={colors.destructive} />
          <Text style={[styles.logoutText, responsiveTextStyles.button, { color: colors.destructive }]}>{t('settings.logout')}</Text>
        </Pressable>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChangePassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('settings.changePassword')}</Text>
              <Pressable onPress={() => setShowChangePassword(false)}>
                <Text style={[styles.modalClose, { color: colors.mutedForeground }]}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.foreground }]}>{t('settings.currentPassword')}</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder={t('settings.currentPassword')}
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} color={colors.mutedForeground} /> : <Eye size={20} color={colors.mutedForeground} />}
                  </Pressable>
                </View>
              </View>
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.foreground }]}>{t('settings.newPassword')}</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder={t('settings.newPassword')}
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={!showNewPassword}
                  />
                  <Pressable
                    style={styles.passwordToggle}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={20} color={colors.mutedForeground} /> : <Eye size={20} color={colors.mutedForeground} />}
                  </Pressable>
                </View>
              </View>
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.foreground }]}>{t('settings.confirmPassword')}</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder={t('settings.confirmPassword')}
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <Pressable
                    style={styles.passwordToggle}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} color={colors.mutedForeground} /> : <Eye size={20} color={colors.mutedForeground} />}
                  </Pressable>
                </View>
              </View>
            </View>
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Pressable
                style={[styles.button, styles.cancelButton, { backgroundColor: colors.muted }]}
                onPress={() => setShowChangePassword(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>{t('settings.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleChangePassword}
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('settings.save')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Currency Selection Modal */}
      <Modal
        visible={showCurrencyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCurrencyModal(false);
          setCurrencySearch('');
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('settings.currency')}</Text>
              <Pressable onPress={() => {
                setShowCurrencyModal(false);
                setCurrencySearch('');
              }}>
                <Text style={[styles.modalClose, { color: colors.mutedForeground }]}>✕</Text>
              </Pressable>
            </View>
            <View style={[styles.currencySearchContainer, { borderBottomColor: colors.border }]}>
              <TextInput
                style={[styles.currencySearchInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                placeholder={t('reports.searchCurrency') || 'Search currency...'}
                placeholderTextColor={colors.mutedForeground}
                value={currencySearch}
                onChangeText={setCurrencySearch}
              />
            </View>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {currencies
                .filter((curr) => {
                  if (!currencySearch.trim()) return true;
                  const q = currencySearch.toLowerCase();
                  return (
                    curr.code.toLowerCase().includes(q) ||
                    (curr.name || '').toLowerCase().includes(q) ||
                    (curr.symbol || '').toLowerCase().includes(q)
                  );
                })
                .map((curr) => {
                  const isSelected = selectedCurrency === curr.code;
                  return (
                    <Pressable
                      key={curr.code}
                      style={[
                        styles.modalItem,
                        { borderBottomColor: colors.border },
                        isSelected && { backgroundColor: `${colors.primary}10` }
                      ]}
                      onPress={() => {
                        handleUpdateCurrency(curr.code);
                        setShowCurrencyModal(false);
                        setCurrencySearch('');
                      }}
                    >
                      <View style={styles.currencyItemRow}>
                        <Text style={styles.currencyFlag}>{curr.flag || '💰'}</Text>
                        <View style={styles.currencyItemInfo}>
                          <Text style={[
                            styles.modalItemText,
                            { color: colors.foreground },
                            isSelected && [styles.modalItemTextActive, { color: colors.primary }]
                          ]}>
                            {curr.code} {curr.name ? `- ${curr.name}` : ''}
                          </Text>
                          {curr.symbol && (
                            <Text style={[styles.currencySymbol, { color: colors.mutedForeground }]}>
                              {curr.symbol}
                            </Text>
                          )}
                        </View>
                        {isSelected && (
                          <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('settings.language')}</Text>
              <Pressable onPress={() => setShowLanguageModal(false)}>
                <Text style={[styles.modalClose, { color: colors.mutedForeground }]}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.code}
                  style={[styles.modalItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    handleUpdateLanguage(lang.code);
                    setShowLanguageModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    { color: colors.foreground },
                    preferredLocale === lang.code && [styles.modalItemTextActive, { color: colors.primary }]
                  ]}>
                    {LANGUAGE_FLAGS[lang.code] || '🌐'} {lang.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Country Selection Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCountryModal(false);
          setCountrySearch('');
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('settings.country')}</Text>
              <Pressable onPress={() => {
                setShowCountryModal(false);
                setCountrySearch('');
              }}>
                <Text style={[styles.modalClose, { color: colors.mutedForeground }]}>✕</Text>
              </Pressable>
            </View>
            <View style={[styles.currencySearchContainer, { borderBottomColor: colors.border }]}>
              <TextInput
                style={[styles.currencySearchInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                placeholder={t('settings.selectCountry') || 'Search country...'}
                placeholderTextColor={colors.mutedForeground}
                value={countrySearch}
                onChangeText={setCountrySearch}
              />
            </View>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              <Pressable
                style={[
                  styles.modalItem,
                  { borderBottomColor: colors.border },
                  !country && { backgroundColor: `${colors.primary}10` }
                ]}
                onPress={() => {
                  handleUpdateCountry('', '');
                  setShowCountryModal(false);
                  setCountrySearch('');
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  { color: colors.foreground },
                  !country && [styles.modalItemTextActive, { color: colors.primary }]
                ]}>
                  {t('settings.notSpecified')}
                </Text>
                {!country && (
                  <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                )}
              </Pressable>
              {COUNTRIES
                .filter((c) => {
                  if (!countrySearch.trim()) return true;
                  const q = countrySearch.toLowerCase();
                  return (
                    c.name.toLowerCase().includes(q) ||
                    c.code.toLowerCase().includes(q)
                  );
                })
                .map((c) => {
                  const isSelected = country === c.code;
                  return (
                    <Pressable
                      key={c.code}
                      style={[
                        styles.modalItem,
                        { borderBottomColor: colors.border },
                        isSelected && { backgroundColor: `${colors.primary}10` }
                      ]}
                      onPress={() => {
                        handleUpdateCountry(c.code, '');
                        setShowCountryModal(false);
                        setCountrySearch('');
                      }}
                    >
                      <View style={styles.currencyItemRow}>
                        <Text style={[styles.modalItemText, { flex: 1, color: colors.foreground }]}>
                          {c.name}
                        </Text>
                        {isSelected && (
                          <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* State Selection Modal */}
      {country && getAvailableStates(country).length > 0 && (
        <Modal
          visible={showStateModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowStateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('settings.state')}</Text>
                <Pressable onPress={() => setShowStateModal(false)}>
                  <Text style={[styles.modalClose, { color: colors.mutedForeground }]}>✕</Text>
                </Pressable>
              </View>
              <ScrollView style={styles.modalList}>
                <Pressable
                  style={[styles.modalItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    handleUpdateCountry(country, '');
                    setShowStateModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    { color: colors.foreground },
                    !state && [styles.modalItemTextActive, { color: colors.primary }]
                  ]}>
                    {t('settings.notSpecified')}
                  </Text>
                </Pressable>
                {getAvailableStates(country).map((s) => (
                  <Pressable
                    key={s}
                    style={[styles.modalItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      handleUpdateCountry(country, s);
                      setShowStateModal(false);
                    }}
                  >
                    <Text style={[
                      styles.modalItemText,
                      { color: colors.foreground },
                      state === s && [styles.modalItemTextActive, { color: colors.primary }]
                    ]}>
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Budget Cycle Day Modal */}
      <Modal
        visible={showBudgetCycleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBudgetCycleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('settings.budgetCycleDay')}</Text>
              <Pressable onPress={() => setShowBudgetCycleModal(false)}>
                <Text style={[styles.modalClose, { color: colors.mutedForeground }]}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <Pressable
                  key={day}
                  style={[styles.modalItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    handleUpdateBudgetCycle(day);
                    setShowBudgetCycleModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    { color: colors.foreground },
                    budgetCycleDay === day && [styles.modalItemTextActive, { color: colors.primary }]
                  ]}>
                    {day}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteAccountModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('settings.deleteAccount')}</Text>
            <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>
              {t('settings.deleteAccountConfirm')}
            </Text>
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Pressable
                style={[styles.button, styles.cancelButton, { backgroundColor: colors.muted }]}
                onPress={() => setShowDeleteAccountModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>{t('settings.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.dangerButton, { backgroundColor: colors.destructive }]}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.dangerButtonText}>{t('settings.delete')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Stripe Payment Dialog */}
      {stripePaymentData && (
        <StripePaymentDialog
          isOpen={showStripePayment}
          onClose={() => setShowStripePayment(false)}
          planType={stripePaymentData.planType}
          paymentMethod={stripePaymentData.paymentMethod}
          // onSuccess removed - payment success is handled by deep link handler
          monthlyPrice={pricingData?.monthly}
          yearlyPrice={pricingData?.yearly}
          monthlyAmount={pricingData?.monthlyAmount}
          yearlyAmount={pricingData?.yearlyAmount}
          currencyCode={pricingData?.currencyCode}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    ...textStyles.body,
    color: '#666',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...textStyles.h2,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...textStyles.bodySmall,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Increased to ensure logout button is fully visible
  },
  section: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    ...textStyles.h3,
  },
  sectionContent: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...textStyles.body,
    fontWeight: 'bold',
    color: '#fff',
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  editButtonText: {
    ...textStyles.bodySmall,
    fontWeight: '600',
  },
  profileInfo: {
    marginTop: 8,
  },
  profileName: {
    ...textStyles.h3,
    marginBottom: 4,
  },
  profileEmail: {
    ...textStyles.bodySmall,
    marginBottom: 4,
  },
  profileLocation: {
    ...textStyles.caption,
  },
  changePhotoButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  changePhotoButtonText: {
    ...textStyles.labelSmall,
    fontWeight: '500',
  },
  form: {
    marginTop: 8,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    ...textStyles.label,
    marginBottom: 8,
  },
  formInput: {
    ...textStyles.body,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  saveButtonText: {
    color: '#fff',
    ...textStyles.button,
    fontWeight: '600',
  },
  cancelButton: {
    // backgroundColor set dynamically
  },
  cancelButtonText: {
    ...textStyles.button,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent', // Set dynamically
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    marginRight: 12,
  },
  settingItemInfo: {
    flex: 1,
  },
  settingItemLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  settingItemLabel: {
    ...textStyles.body,
    fontWeight: '600',
  },
  settingItemValue: {
    ...textStyles.bodySmall,
  },
  settingItemDescription: {
    ...textStyles.caption,
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#FF5252',
  },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  subscriptionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionTextContainer: {
    flex: 1,
    gap: 4,
  },
  subscriptionTitle: {
    ...textStyles.h3,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subscriptionStatus: {
    ...textStyles.bodySmall,
    color: '#6B7280',
  },
  subscriptionDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  subscriptionDate: {
    ...textStyles.labelSmall,
    color: '#10B981',
  },
  renewSubscriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  renewSubscriptionButtonText: {
    ...textStyles.button,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  upgradeButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    ...textStyles.button,
    fontWeight: 'bold',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32, // Extra bottom margin to ensure visibility
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  logoutButtonText: {
    ...textStyles.button,
    fontWeight: '600',
  },
  logoutText: {
    ...textStyles.button,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...textStyles.h3,
    fontWeight: 'bold',
  },
  modalClose: {
    ...textStyles.h3,
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  modalItemText: {
    ...textStyles.body,
  },
  modalItemTextActive: {
    fontWeight: '600',
  },
  modalDescription: {
    ...textStyles.bodySmall,
    padding: 20,
  },
  dangerButton: {
    backgroundColor: '#FF5252',
  },
  dangerButtonText: {
    color: '#fff',
    ...textStyles.button,
    fontWeight: '600',
  },
  currencySearchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  currencySearchInput: {
    ...textStyles.body,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  currencyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencyItemInfo: {
    flex: 1,
  },
  currencySymbol: {
    ...textStyles.labelSmall,
    marginTop: 2,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    minWidth: 90,
    backgroundColor: 'transparent',
  },
  currencyFlag: {
    fontSize: 20,
  },
  currencyCode: {
    ...textStyles.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  checkmark: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

