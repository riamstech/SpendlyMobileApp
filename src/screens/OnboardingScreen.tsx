import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { showToast } from '../utils/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { currenciesService } from '../api/services/currencies';
import { countriesService, Country } from '../api/services/countries';
import { usersService } from '../api/services/users';
import { authService } from '../api/services/auth';
import { translateCountryName } from '../utils/countryTranslator';
import {
  Wallet,
  TrendingUp,
  PieChart,
  BarChart3,
  ChevronRight,
  Check,
  MapPin,
  Search,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { textStyles, createResponsiveTextStyles } from '../constants/fonts';

interface OnboardingScreenProps {
  isAuthenticated?: boolean;
  defaultCurrency?: string;
  onComplete: () => void;
}

type Step = 'splash' | 'welcome' | 'features' | 'currency' | 'location';

export default function OnboardingScreen({
  isAuthenticated = false,
  defaultCurrency: propDefaultCurrency,
  onComplete,
}: OnboardingScreenProps) {
  const { t } = useTranslation('common');
  const { width, height } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const responsiveTextStyles = createResponsiveTextStyles(width);
  const [step, setStep] = useState<Step>(isAuthenticated ? 'welcome' : 'splash');
  const [currency, setCurrency] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [currencies, setCurrencies] = useState<Array<{ code: string; symbol: string; flag: string; name: string }>>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');
  const [countrySearchQuery, setCountrySearchQuery] = useState('');

  // Responsive scaling
  const scale = Math.min(width / 375, height / 812);
  const isSmallScreen = width < 375;
  const isLargeScreen = width > 430;

  // Load currencies and countries
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingCurrencies(true);
        
        // Load currencies
        const currenciesData = await currenciesService.getCurrencies();
        if (currenciesData && currenciesData.length > 0) {
          setCurrencies(currenciesData);
          if (!currency) {
            setCurrency(propDefaultCurrency || currenciesData[0].code);
          }
        }
        
        // Load countries
        try {
          const countriesData = await countriesService.getCountries();
          if (countriesData && countriesData.length > 0) {
            setCountries(countriesData);
          } else {
            // Fallback to hardcoded countries
            const { COUNTRIES } = require('../constants/countries');
            setCountries(COUNTRIES.map((c: any) => ({ code: c.code, name: c.name, original_name: c.name })));
          }
        } catch (error) {
          console.error('Error loading countries:', error);
          // Fallback to hardcoded countries
          const { COUNTRIES } = require('../constants/countries');
          setCountries(COUNTRIES.map((c: any) => ({ code: c.code, name: c.name, original_name: c.name })));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoadingCurrencies(false);
      }
    };
    loadData();
  }, []);

  // Auto-transition from splash
  useEffect(() => {
    if (step === 'splash') {
      const timer = setTimeout(() => {
        setStep('welcome');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleGetLocation = async () => {
    // For React Native, we'll use a simplified approach
    // In production, you'd use expo-location for geolocation
    setLocationLoading(true);
    setLocationError(null);
    
    // Simulate location fetch (replace with actual expo-location in production)
    setTimeout(() => {
      showToast.info(t('onboarding.locationNotImplemented'), t('onboarding.location'));
      setLocationLoading(false);
    }, 1000);
  };

  const handleComplete = async () => {
    try {
      if (isAuthenticated) {
        const currentUser = await authService.getCurrentUser();
        const updateData: any = {};
        
        if (currency && currency !== currentUser.defaultCurrency) {
          updateData.defaultCurrency = currency;
        }
        if (country) {
          updateData.country = country;
        }
        if (state) {
          updateData.state = state;
        }
        
        if (Object.keys(updateData).length > 0) {
          await usersService.updateUser(currentUser.id, updateData);
        }
      }
      
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      onComplete(); // Still complete even if update fails
    }
  };

  // Responsive styles


  // Dynamic gradient colors
  const gradientColors = (isDark 
    ? ['#1a1a1a', '#2a2a2a'] 
    : ['#03A9F4', '#0288D1']) as [string, string, ...string[]];

  // Splash Screen
  if (step === 'splash') {
    return (
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.splashContainer}>
            <Image
              source={require('../../assets/logo-dark.png')}
              style={{ width: 80 * scale, height: 80 * scale }}
              resizeMode="contain"
            />
            <Text style={[styles.splashTitle, responsiveTextStyles.h3, { color: isDark ? '#fff' : '#fff' }]}>Spendly</Text>
            <Text style={[styles.splashSubtitle, responsiveTextStyles.body, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.9)' }]}>
              {t('footer.tagline')}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Welcome Screen
  if (step === 'welcome') {
    return (
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: isSmallScreen ? 16 : 24 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.logoContainer}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? colors.card : '#fff' }]}>
                <Wallet size={40 * scale} color="#03A9F4" />
              </View>
              <Text style={[styles.headerTitle, responsiveTextStyles.h3, { color: isDark ? '#fff' : '#fff' }]}>
                {t('onboarding.welcomeToSpendly')}
              </Text>
              <Text style={[styles.headerSubtitle, responsiveTextStyles.body, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.9)' }]}>
                {t('onboarding.personalFinanceCompanion')}
              </Text>
            </View>

            <View style={[styles.card, { padding: 20, backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t('onboarding.takeControlOfFinances')}</Text>
              <Text style={[styles.cardText, { color: colors.mutedForeground }]}>
                {t('onboarding.takeControlDescription')}
              </Text>
              <View style={styles.progressDots}>
                <View style={[styles.dot, styles.dotActive, { backgroundColor: colors.primary }]} />
                <View style={[styles.dot, { backgroundColor: colors.border }]} />
                <View style={[styles.dot, { backgroundColor: colors.border }]} />
              </View>
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                { paddingVertical: 14, backgroundColor: isDark ? colors.primary : '#fff' },
              ]}
              onPress={() => setStep('features')}
            >
              <Text style={[styles.primaryButtonText, responsiveTextStyles.button, { color: isDark ? '#fff' : '#03A9F4' }]}>
                {t('onboarding.getStarted')}
              </Text>
              <ChevronRight size={20 * scale} color={isDark ? '#fff' : '#03A9F4'} style={{ marginLeft: 8 }} />
            </Pressable>

            <Pressable
              style={styles.skipButton}
              onPress={() => setStep(isAuthenticated ? 'currency' : 'currency')}
            >
              <Text style={[styles.skipButtonText, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#fff' }]}>{t('onboarding.skip')}</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Features Screen
  if (step === 'features') {
    return (
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: isSmallScreen ? 16 : 24 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.logoContainer}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? colors.card : '#fff' }]}>
                <TrendingUp size={40 * scale} color="#03A9F4" />
              </View>
              <Text style={[styles.headerTitle, responsiveTextStyles.h3, { color: isDark ? '#fff' : '#fff' }]}>
                {t('onboarding.powerfulFeatures')}
              </Text>
            </View>

            <View style={styles.featuresContainer}>
              <View style={[styles.featureCard, { padding: 16, backgroundColor: colors.card }]}>
                <View style={styles.featureIconContainer}>
                  <Wallet size={20 * scale} color="#4CAF50" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.foreground }]}>{t('onboarding.trackExpenses')}</Text>
                  <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                    {t('onboarding.trackExpensesDescription')}
                  </Text>
                </View>
              </View>

              <View style={[styles.featureCard, { padding: 16, backgroundColor: colors.card }]}>
                <View style={[styles.featureIconContainer, { backgroundColor: 'rgba(3, 169, 244, 0.1)' }]}>
                  <PieChart size={20 * scale} color="#03A9F4" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.foreground }]}>{t('onboarding.budgetManagement')}</Text>
                  <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                    {t('onboarding.budgetManagementDescription')}
                  </Text>
                </View>
              </View>

              <View style={[styles.featureCard, { padding: 16, backgroundColor: colors.card }]}>
                <View style={[styles.featureIconContainer, { backgroundColor: 'rgba(255, 193, 7, 0.1)' }]}>
                  <BarChart3 size={20 * scale} color="#FFC107" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.foreground }]}>{t('onboarding.investmentTracking')}</Text>
                  <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                    {t('onboarding.investmentTrackingDescription')}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.progressDots}>
              <View style={[styles.dot, { backgroundColor: colors.border }]} />
              <View style={[styles.dot, styles.dotActive, { backgroundColor: colors.primary }]} />
              <View style={[styles.dot, { backgroundColor: colors.border }]} />
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                { paddingVertical: 14, backgroundColor: isDark ? colors.primary : '#fff' },
              ]}
              onPress={() => setStep('currency')}
            >
              <Text style={[styles.primaryButtonText, responsiveTextStyles.button, { color: isDark ? '#fff' : '#03A9F4' }]}>
                {t('onboarding.continue')}
              </Text>
              <ChevronRight size={20 * scale} color={isDark ? '#fff' : '#03A9F4'} style={{ marginLeft: 8 }} />
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Currency Selection Screen
  if (step === 'currency') {
    // Filter currencies based on search query
    const filteredCurrencies = currencies.filter((curr) => {
      const query = currencySearchQuery.toLowerCase();
      return (
        curr.name.toLowerCase().includes(query) ||
        curr.code.toLowerCase().includes(query) ||
        curr.symbol.toLowerCase().includes(query)
      );
    });

    return (
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: isSmallScreen ? 16 : 24 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.logoContainer}>
              <View style={[styles.iconCircle, { backgroundColor: '#4CAF50' }]}>
                <Check size={40 * scale} color="#fff" />
              </View>
              <Text style={[styles.headerTitle, responsiveTextStyles.h3, { color: isDark ? '#fff' : '#fff' }]}>
                {t('onboarding.almostDone')}
              </Text>
              <Text style={[styles.headerSubtitle, responsiveTextStyles.body, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.9)' }]}>
                {t('onboarding.selectDefaultCurrency')}
              </Text>
            </View>

            <View style={[styles.card, { padding: 20, backgroundColor: colors.card }]}>
              <Text style={[styles.label, { color: colors.foreground }]}>{t('onboarding.defaultCurrency')}</Text>
              
              {/* Search Input */}
              <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <Search size={18 * scale} color={colors.mutedForeground} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, responsiveTextStyles.body, { color: colors.foreground }]}
                  placeholder={t('onboarding.searchCurrency')}
                  placeholderTextColor={colors.mutedForeground}
                  value={currencySearchQuery}
                  onChangeText={setCurrencySearchQuery}
                />
              </View>

              {loadingCurrencies ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.foreground }]}>{t('onboarding.loadingCurrencies')}</Text>
                </View>
              ) : (
                <>
                  {filteredCurrencies.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                        {t('onboarding.noCurrenciesFound', { query: currencySearchQuery })}
                      </Text>
                    </View>
                  ) : (
                    <ScrollView style={styles.currencyList} nestedScrollEnabled>
                      {filteredCurrencies.map((curr) => (
                        <Pressable
                          key={curr.code}
                          style={[
                            styles.currencyItem,
                            { backgroundColor: currency === curr.code ? colors.accent : 'transparent' },
                          ]}
                          onPress={() => setCurrency(curr.code)}
                        >
                          <Text style={styles.currencyFlag}>{curr.flag}</Text>
                          <View style={styles.currencyInfo}>
                            <Text style={[styles.currencyName, { color: colors.foreground }]}>{curr.name}</Text>
                            <Text style={[styles.currencyCode, { color: colors.mutedForeground }]}>
                              {curr.code} ({curr.symbol})
                            </Text>
                          </View>
                          {currency === curr.code && (
                            <Check size={20 * scale} color={colors.primary} />
                          )}
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                </>
              )}
              <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                {t('onboarding.currencyHint')}
              </Text>
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                { paddingVertical: 14, backgroundColor: isDark ? colors.primary : '#fff' },
                !currency && styles.primaryButtonDisabled,
              ]}
              onPress={() => setStep('location')}
              disabled={!currency}
            >
              <Text style={[styles.primaryButtonText, responsiveTextStyles.button, { color: isDark ? '#fff' : '#03A9F4' }]}>
                {t('onboarding.continue')}
              </Text>
              <ChevronRight size={20 * scale} color={isDark ? '#fff' : '#03A9F4'} style={{ marginLeft: 8 }} />
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Location Selection Screen
  if (step === 'location') {
    const { COUNTRIES } = require('../constants/countries');
    const allCountries = (countries.length > 0 ? countries : COUNTRIES.map((c: any) => ({ code: c.code, name: c.name, original_name: c.name })))
      .sort((a: any, b: any) => {
        const nameA = translateCountryName(a.name, t, a.original_name);
        const nameB = translateCountryName(b.name, t, b.original_name);
        return nameA.localeCompare(nameB);
      });
    
    // Filter countries based on search query
    const filteredCountries = allCountries.filter((c: any) => {
      const query = countrySearchQuery.toLowerCase();
      const displayName = translateCountryName(c.name, t, c.original_name).toLowerCase();
      return (
        displayName.includes(query) ||
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query)
      );
    });

    return (
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: isSmallScreen ? 16 : 24 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.logoContainer}>
              <View style={[styles.iconCircle, { backgroundColor: '#4CAF50' }]}>
                <MapPin size={40 * scale} color="#fff" />
              </View>
              <Text style={[styles.headerTitle, responsiveTextStyles.h3, { color: isDark ? '#fff' : '#fff' }]}>
                {t('onboarding.shareYourLocation')}
              </Text>
              <Text style={[styles.headerSubtitle, responsiveTextStyles.body]}>
                {t('onboarding.personalizeExperience')}
              </Text>
            </View>

            <View style={[styles.card, { padding: 20, backgroundColor: colors.card }]}>
              <Text style={[styles.label, { color: colors.foreground }]}>{t('onboarding.country')}</Text>
              
              {/* Search Input */}
              <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <Search size={18 * scale} color={colors.mutedForeground} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, responsiveTextStyles.body, { color: colors.foreground }]}
                  placeholder={t('onboarding.searchCountry')}
                  placeholderTextColor={colors.mutedForeground}
                  value={countrySearchQuery}
                  onChangeText={setCountrySearchQuery}
                />
              </View>

              {filteredCountries.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    {t('onboarding.noCountriesFound', { query: countrySearchQuery })}
                  </Text>
                </View>
              ) : (
                <ScrollView style={styles.countryList} nestedScrollEnabled>
                  {filteredCountries.map((c: any) => {
                    const displayName = translateCountryName(c.name, t, c.original_name);
                    return (
                      <Pressable
                        key={c.code}
                        style={[
                          styles.countryItem,
                          { backgroundColor: country === c.code ? colors.accent : 'transparent' },
                        ]}
                        onPress={() => setCountry(c.code)}
                      >
                        <Text style={[styles.countryName, { color: colors.foreground }]}>{displayName}</Text>
                      {country === c.code && (
                        <Check size={20 * scale} color={colors.primary} />
                      )}
                    </Pressable>
                  );
                })}
                </ScrollView>
              )}

              <Text style={[styles.label, { marginTop: 16, color: colors.foreground }]}>
                {t('onboarding.stateProvince')}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                placeholder={t('onboarding.stateProvincePlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                value={state}
                onChangeText={setState}
              />

              <Pressable
                style={[
                  styles.locationButton,
                  { borderColor: colors.primary },
                  locationLoading && styles.locationButtonDisabled,
                ]}
                onPress={handleGetLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.locationButtonText, { color: colors.primary }]}>{t('onboarding.gettingLocation')}</Text>
                  </>
                ) : (
                  <>
                    <MapPin size={18 * scale} color={colors.primary} />
                    <Text style={[styles.locationButtonText, { color: colors.primary }]}>{t('onboarding.useMyCurrentLocation')}</Text>
                  </>
                )}
              </Pressable>
              {locationError && (
                <Text style={[styles.errorText, { color: colors.destructive }]}>{locationError}</Text>
              )}
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                { paddingVertical: 14, backgroundColor: isDark ? colors.primary : '#fff' },
                !country && styles.primaryButtonDisabled,
              ]}
              onPress={handleComplete}
              disabled={!country}
            >
              <Text style={[styles.primaryButtonText, responsiveTextStyles.button, { color: isDark ? '#fff' : '#03A9F4' }]}>
                {t('onboarding.completeSetup')}
              </Text>
              <Check size={20 * scale} color={isDark ? '#fff' : '#03A9F4'} style={{ marginLeft: 8 }} />
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashTitle: {
    ...textStyles.h2,
    color: '#fff',
    marginTop: 16,
  },
  splashSubtitle: {
    ...textStyles.body,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    ...textStyles.h2,
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    ...textStyles.body,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    ...textStyles.h3,
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardText: {
    ...textStyles.body,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#03A9F4',
    ...textStyles.button,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#fff',
    ...textStyles.body,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...textStyles.h4,
    color: '#212121',
    marginBottom: 4,
  },
  featureText: {
    ...textStyles.bodySmall,
    color: '#666',
    lineHeight: 18,
  },
  label: {
    ...textStyles.label,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    ...textStyles.body,
    paddingVertical: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    ...textStyles.body,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    ...textStyles.body,
    textAlign: 'center',
  },
  currencyList: {
    maxHeight: 200,
    marginBottom: 12,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  currencyFlag: {
    ...textStyles.body,
    marginRight: 12,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    ...textStyles.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  currencyCode: {
    ...textStyles.caption,
  },
  hintText: {
    ...textStyles.caption,
    marginTop: 8,
  },
  countryList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  countryName: {
    ...textStyles.body,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...textStyles.body,
    marginBottom: 16,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    marginTop: 8,
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    ...textStyles.button,
  },
  errorText: {
    ...textStyles.caption,
    marginTop: 8,
  },
});

