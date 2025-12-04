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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
} from 'lucide-react-native';
import { authService } from '../api/services/auth';
import { usersService } from '../api/services/users';
import { currenciesService } from '../api/services/currencies';
import { dashboardService } from '../api/services/dashboard';
import { COUNTRIES, US_STATES, CA_PROVINCES } from '../constants/countries';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { textStyles, createResponsiveTextStyles } from '../constants/fonts';
import StripePaymentDialog from '../components/StripePaymentDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';

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
}

export default function SettingsScreen({ onLogout, onViewReferral, onViewGoals, onViewAnalytics, onViewReceipts }: SettingsScreenProps) {
  const { t, i18n } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { isDark, colors, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currencies, setCurrencies] = useState<Array<{ code: string; symbol: string; name?: string }>>([]);
  const [budgetCycleDay, setBudgetCycleDay] = useState(1);

  const responsiveTextStyles = createResponsiveTextStyles(width);
  
  const responsiveStyles = {
    sectionTitle: { fontSize: Math.max(16, Math.min(18 * (width / 375), 20)) },
    itemTitle: { fontSize: Math.max(14, Math.min(16 * (width / 375), 18)) },
    itemSubtitle: { fontSize: Math.max(12, Math.min(14 * (width / 375), 16)) },
    valueText: { fontSize: Math.max(14, Math.min(16 * (width / 375), 18)) },
    buttonText: { fontSize: Math.max(14, Math.min(16 * (width / 375), 18)) },
  };
  
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
  const [biometricLock, setBiometricLock] = useState(false);
  const [showStripePayment, setShowStripePayment] = useState(false);
  const [stripePaymentData, setStripePaymentData] = useState<{
    planType: 'monthly' | 'yearly';
    paymentMethod: 'card' | 'upi';
  } | null>(null);

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

  useEffect(() => {
    loadInitialData();
  }, []);

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
      setPreferredLocale(userData.preferredLocale || i18n.language || 'en');
      
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
        setNotifications(settings.settings?.notificationsEnabled !== false);
        setBiometricLock(settings.settings?.biometricLockEnabled || false);
        setBudgetCycleDay(settings.settings?.budgetCycleDay || 1);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      Alert.alert('Error', 'Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      Alert.alert('Error', 'Please fill in name and email.');
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
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long.');
      return;
    }

    try {
      setSavingPassword(true);
      await authService.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      
      Alert.alert('Success', 'Password changed successfully');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password. Please try again.');
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
      Alert.alert('Success', 'Currency updated successfully');
    } catch (error: any) {
      console.error('Error updating currency:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update currency. Please try again.');
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
      Alert.alert('Success', 'Language updated successfully');
    } catch (error: any) {
      console.error('Error updating language:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update language. Please try again.');
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
      Alert.alert('Success', `Budget cycle day updated to ${day}`);
    } catch (error: any) {
      console.error('Error updating budget cycle:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update budget cycle. Please try again.');
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
      Alert.alert('Error', 'Failed to update dark mode setting.');
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    try {
      await usersService.updateUserSettings({
        notifications_enabled: enabled,
      });
      setNotifications(enabled);
    } catch (error: any) {
      console.error('Error updating notifications:', error);
      Alert.alert('Error', 'Failed to update notifications setting.');
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
      Alert.alert('Error', 'Failed to update biometric lock setting.');
    }
  };

  const handleBackupData = async () => {
    try {
      setSaving(true);
      const backup = await usersService.backupData();
      
      // In React Native, we'd need to use a file system library to save the file
      // For now, just show the data
      Alert.alert('Backup Data', JSON.stringify(backup, null, 2));
    } catch (error: any) {
      console.error('Error backing up data:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to backup data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await usersService.deleteAccount();
              Alert.alert('Success', 'Account deleted successfully');
              onLogout();
            } catch (error: any) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete account. Please try again.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
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
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload photos!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const imageUri = result.assets[0].uri;
      const imageName = imageUri.split('/').pop() || 'avatar.jpg';
      const imageType = `image/${imageName.split('.').pop() || 'jpeg'}`;

      // Create FormData for React Native
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: imageType,
        name: imageName,
      } as any);

      setUploadingAvatar(true);
      const response = await usersService.uploadAvatar(formData as any);
      
      // Update user avatar
      const updatedUser = {
        ...user,
        avatar: response.avatar_url || usersService.getAvatarUrl(response.avatar),
      };
      setUser(updatedUser);
      
      Alert.alert('Success', 'Profile photo updated successfully');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || error.message || 'Failed to upload profile photo. Please try again.'
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getAvatarUrl = (avatarPath?: string | null): string | undefined => {
    if (!avatarPath) return undefined;
    return usersService.getAvatarUrl(avatarPath);
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
        <Text style={[styles.headerTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>{t('nav.settings')}</Text>
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
              <Text style={[styles.sectionTitle, responsiveStyles.sectionTitle, { color: colors.foreground }]}>{t('settings.profile')}</Text>
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
                  {getAvatarUrl(user.avatar) ? (
                    <Image source={{ uri: getAvatarUrl(user.avatar) }} style={styles.avatar} />
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
                  <DollarSign size={20} color={colors.primary} />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, { color: colors.foreground }]}>{t('settings.currency')}</Text>
                    <Text style={[styles.settingItemValue, { color: colors.mutedForeground }]}>{selectedCurrency}</Text>
                  </View>
                </View>
                <ChevronDown size={18} color={colors.mutedForeground} />
              </Pressable>

              <Pressable
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => setShowLanguageModal(true)}
              >
                <View style={styles.settingItemLeft}>
                  <Globe size={20} color={colors.primary} />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, { color: colors.foreground }]}>{t('settings.language')}</Text>
                    <Text style={[styles.settingItemValue, { color: colors.mutedForeground }]}>
                      {LANGUAGE_FLAGS[preferredLocale] || '🌐'} {SUPPORTED_LANGUAGES.find(l => l.code === preferredLocale)?.name || preferredLocale}
                    </Text>
                  </View>
                </View>
                <ChevronDown size={18} color={colors.mutedForeground} />
              </Pressable>

              <Pressable
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => setShowBudgetCycleModal(true)}
              >
                <View style={styles.settingItemLeft}>
                  <Calendar size={20} color={colors.primary} />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, { color: colors.foreground }]}>{t('settings.budgetCycleDay')}</Text>
                    <Text style={[styles.settingItemValue, { color: colors.mutedForeground }]}>{budgetCycleDay}</Text>
                  </View>
                </View>
                <ChevronDown size={18} color={colors.mutedForeground} />
              </Pressable>

              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <Moon size={20} color={colors.primary} />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, { color: colors.foreground }]}>{t('settings.darkMode')}</Text>
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

              <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                <View style={styles.settingItemLeft}>
                  <Bell size={20} color={colors.primary} />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, { color: colors.foreground }]}>{t('settings.notifications')}</Text>
                    <Text style={[styles.settingItemDescription, { color: colors.mutedForeground }]}>{t('settings.notificationsDescription')}</Text>
                  </View>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: '#ccc', true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
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
                  <Lock size={20} color={colors.primary} />
                  <Text style={[styles.settingItemLabel, { color: colors.foreground }]}>{t('settings.changePassword')}</Text>
                </View>
                <ChevronDown size={18} color={colors.mutedForeground} />
              </Pressable>

              <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                <View style={styles.settingItemLeft}>
                  <Shield size={20} color={colors.primary} />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, { color: colors.foreground }]}>{t('settings.biometricLock')}</Text>
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
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => setShowCountryModal(true)}
              >
                <View style={styles.settingItemLeft}>
                  <MapPin size={20} color={colors.primary} />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, { color: colors.foreground }]}>{t('settings.country')}</Text>
                    <Text style={[styles.settingItemValue, { color: colors.mutedForeground }]}>
                      {country ? COUNTRIES.find(c => c.code === country)?.name : t('settings.notSpecified')}
                    </Text>
                  </View>
                </View>
                <ChevronDown size={18} color={colors.mutedForeground} />
              </Pressable>

              {country && getAvailableStates(country).length > 0 && (
                <Pressable
                  style={[styles.settingItem, { borderBottomColor: colors.border }]}
                  onPress={() => setShowStateModal(true)}
                >
                  <View style={styles.settingItemLeft}>
                    <MapPin size={20} color={colors.primary} />
                    <View style={styles.settingItemInfo}>
                      <Text style={[styles.settingItemLabel, { color: colors.foreground }]}>{t('settings.state')}</Text>
                      <Text style={[styles.settingItemValue, { color: colors.mutedForeground }]}>{state || t('settings.notSpecified')}</Text>
                    </View>
                  </View>
                  <ChevronDown size={18} color={colors.mutedForeground} />
                </Pressable>
              )}
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
              {t('settings.rewards') || 'Features & Rewards'}
            </Text>
            {expandedSections.features ? (
              <ChevronUp size={20} color={colors.mutedForeground} />
            ) : (
              <ChevronDown size={20} color={colors.mutedForeground} />
            )}
          </Pressable>

          {expandedSections.features && (
            <View style={styles.sectionContent}>
              {/* Savings Goals */}
              <Pressable
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => onViewGoals?.()}
              >
                <View style={styles.settingItemLeft}>
                  <Target size={20} color="#9C27B0" />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, { color: colors.foreground }]}>
                      {t('goals.title') || 'Savings Goals'}
                    </Text>
                    <Text style={[styles.settingItemValue, { color: colors.mutedForeground }]}>
                      {t('goals.noGoalsSubtitle') ? 'Track your savings progress' : 'Track your savings progress'}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
              </Pressable>

              {/* Analytics */}
              <Pressable
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => onViewAnalytics?.()}
              >
                <View style={styles.settingItemLeft}>
                  <BarChart3 size={20} color="#03A9F4" />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, { color: colors.foreground }]}>
                      {t('reports.analytics') || 'Analytics'}
                    </Text>
                    <Text style={[styles.settingItemValue, { color: colors.mutedForeground }]}>
                      Smart insights & financial health
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
              </Pressable>

              {/* Receipts & OCR */}
              <Pressable
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => onViewReceipts?.()}
              >
                <View style={styles.settingItemLeft}>
                  <FileText size={20} color="#FF9800" />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, { color: colors.foreground }]}>
                      {t('receipts.title') || 'Receipts & OCR'}
                    </Text>
                    <Text style={[styles.settingItemValue, { color: colors.mutedForeground }]}>
                      Scan and organize receipts
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
              </Pressable>

              {/* Refer & Earn */}
              <Pressable
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => onViewReferral?.()}
              >
                <View style={styles.settingItemLeft}>
                  <Gift size={20} color="#FF9800" />
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemLabel, { color: colors.foreground }]}>
                      {t('settings.referAndEarn') || 'Refer & Earn'}
                    </Text>
                    <Text style={[styles.settingItemValue, { color: colors.mutedForeground }]}>
                      {t('settings.referAndEarnSubtitle') || 'Invite friends and get Pro free'}
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
                <View style={[styles.subscriptionCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
                  {/* Yellow Circle with Crown Icon */}
                  <View style={styles.subscriptionIconContainer}>
                    <Crown size={28} color="#FFFFFF" />
                  </View>
                  
                  {/* Text Content */}
                  <View style={styles.subscriptionTextContainer}>
                    <Text style={[styles.subscriptionTitle, { color: '#1F2937' }]}>
                      {t('settings.spendlyPremium') || 'Spendly Premium'} ✨
                    </Text>
                    <Text style={[styles.subscriptionStatus, { color: '#6B7280' }]}>
                      {t('settings.activePremiumMember') || 'Active Premium Member'}
                    </Text>
                    {user.licenseEndDate && (
                      <View style={styles.subscriptionDateRow}>
                        <Clock size={14} color="#6B7280" />
                        <Text style={[styles.subscriptionDate, { color: '#10B981' }]}>
                          Valid until {new Date(user.licenseEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </View>
                    )}
                  </View>
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
                  <Text style={[styles.settingItemLabel, { color: colors.foreground }]}>{t('settings.backupData')}</Text>
                </View>
              </Pressable>

              <Pressable
                style={[styles.settingItem, styles.dangerItem]}
                onPress={() => setShowDeleteAccountModal(true)}
              >
                <View style={styles.settingItemLeft}>
                  <Trash2 size={20} color={colors.destructive} />
                  <Text style={[styles.settingItemLabel, styles.dangerText, { color: colors.destructive }]}>{t('settings.deleteAccount')}</Text>
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
          <Text style={[styles.logoutText, responsiveStyles.buttonText, { color: colors.destructive }]}>{t('settings.logout')}</Text>
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
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('settings.currency')}</Text>
              <Pressable onPress={() => setShowCurrencyModal(false)}>
                <Text style={[styles.modalClose, { color: colors.mutedForeground }]}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {currencies.map((curr) => (
                <Pressable
                  key={curr.code}
                  style={[styles.modalItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    handleUpdateCurrency(curr.code);
                    setShowCurrencyModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    { color: colors.foreground },
                    selectedCurrency === curr.code && [styles.modalItemTextActive, { color: colors.primary }]
                  ]}>
                    {curr.code} - {curr.name || curr.code} ({curr.symbol})
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
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
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('settings.country')}</Text>
              <Pressable onPress={() => setShowCountryModal(false)}>
                <Text style={[styles.modalClose, { color: colors.mutedForeground }]}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              <Pressable
                style={[styles.modalItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setCountry('');
                  setState('');
                  handleSaveProfile();
                  setShowCountryModal(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  { color: colors.foreground },
                  !country && [styles.modalItemTextActive, { color: colors.primary }]
                ]}>
                  {t('settings.notSpecified')}
                </Text>
              </Pressable>
              {COUNTRIES.map((c) => (
                <Pressable
                  key={c.code}
                  style={[styles.modalItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setCountry(c.code);
                    setState('');
                    handleSaveProfile();
                    setShowCountryModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    { color: colors.foreground },
                    country === c.code && [styles.modalItemTextActive, { color: colors.primary }]
                  ]}>
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
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
                    setState('');
                    handleSaveProfile();
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
                      setState(s);
                      handleSaveProfile();
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
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...textStyles.h3,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 24,
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
    fontSize: 14,
    fontWeight: '600',
  },
  profileInfo: {
    marginTop: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  profileLocation: {
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: '500',
  },
  form: {
    marginTop: 8,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    // backgroundColor set dynamically
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent', // Set dynamically
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingItemInfo: {
    flex: 1,
  },
  settingItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingItemValue: {
    fontSize: 12,
  },
  settingItemDescription: {
    fontSize: 12,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subscriptionStatus: {
    fontSize: 14,
    color: '#6B7280',
  },
  subscriptionDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  subscriptionDate: {
    fontSize: 13,
    color: '#10B981',
  },
  upgradeButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 14,
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
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutText: {
    fontSize: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 24,
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
    fontSize: 16,
  },
  modalItemTextActive: {
    fontWeight: '600',
  },
  modalDescription: {
    fontSize: 14,
    padding: 20,
  },
  dangerButton: {
    backgroundColor: '#FF5252',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

