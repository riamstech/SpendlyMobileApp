import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  useWindowDimensions,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, textStyles, createResponsiveTextStyles } from '../constants/fonts';
import { useTranslation } from 'react-i18next';
import {
  Gift,
  ExternalLink,
  CreditCard,
  Home,
  Shield,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react-native';
import { promotionsService, Promotion } from '../api/services/promotions';
import { COUNTRIES } from '../constants/countries';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function OffersScreen() {
  const { t } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const responsiveTextStyles = createResponsiveTextStyles(width);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [userCountry, setUserCountry] = useState<string>('');
  const [userState, setUserState] = useState<string>('');
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [promotionsLoaded, setPromotionsLoaded] = useState(false);



  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadPromotions(), loadUserLocation()]);
    };
    loadData();
  }, []);

  const loadUserLocation = async () => {
    try {
      // Load from user settings or auth
      // For now, we'll get it from auth service
      const { authService } = await import('../api/services/auth');
      const user = await authService.getCurrentUser();
      setUserCountry((user as any).country || '');
      setUserState((user as any).state || '');
    } catch (error) {
      console.error('Failed to load user location:', error);
    } finally {
      setLocationLoaded(true);
    }
  };

  const loadPromotions = async () => {
    try {
      const data = await promotionsService.getPromotions();
      setPromotions(data);
    } catch (error) {
      console.error('Error loading promotions:', error);
    } finally {
      setPromotionsLoaded(true);
    }
  };

  useEffect(() => {
    if (locationLoaded && promotionsLoaded) {
      setLoading(false);
    }
  }, [locationLoaded, promotionsLoaded]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPromotions();
    setRefreshing(false);
  };

  // Filter promotions based on user's country and state
  const filteredPromotions = useMemo(() => {
    return promotions.filter((promo) => {
      // Only show active promotions
      if (!promo.isActive) {
        return false;
      }

      // If promotion has no target country, show to everyone
      if (!promo.targetCountry) {
        return true;
      }

      // Check if promotion matches user's country
      if (promo.targetCountry !== userCountry) {
        return false;
      }

      // If promotion has target state, check if it matches
      if (promo.targetState && userState && promo.targetState !== userState) {
        return false;
      }

      return true;
    });
  }, [promotions, userCountry, userState]);

  const getCategoryIcon = (type?: string) => {
    switch (type) {
      case 'credit_card':
        return CreditCard;
      case 'loan':
        return Home;
      case 'insurance':
        return Shield;
      case 'other':
        return TrendingUp;
      default:
        return Gift;
    }
  };

  const getTypeGradientColors = (type?: string): any => {
    switch (type) {
      case 'credit_card':
        return ['#03A9F4', '#0288D1'];
      case 'loan':
        return ['#4CAF50', '#388E3C'];
      case 'insurance':
        return ['#FF9800', '#F57C00'];
      default:
        return ['#9C27B0', '#7B1FA2'];
    }
  };

  const handlePromotionClick = async (promo: Promotion) => {
    const url = promo.actionUrl;
    if (url) {
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        }
      } catch (error) {
        console.error('Failed to open promotion link:', error);
      }
    }
  };

  if (loading) {
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>
              {t('offers.title') || 'Partner Offers'}
            </Text>
            <Text style={[styles.headerSubtitle, responsiveTextStyles.bodySmall, { color: colors.mutedForeground }]}>
              {t('offers.subtitle') || 'Exclusive deals curated for you'}
            </Text>
          </View>
        </View>

        {/* Promotions List */}
        {filteredPromotions.length === 0 ? (
          <>
            {/* Empty State Card */}
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Gift size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, responsiveTextStyles.h3, { color: colors.foreground }]}>
                {t('offers.noOffersAvailable') || 'No offers available'}
              </Text>
              <Text style={[styles.emptySubtext, responsiveTextStyles.body, { color: colors.mutedForeground }]}>
                {t('offers.checkBackLater') || 'Check back later for exclusive deals'}
              </Text>
            </View>

            <View style={styles.infoCardsContainer}>
              {/* Location-Based Offers Card */}
              <View style={[styles.locationCard, { 
                backgroundColor: isDark ? 'rgba(3, 169, 244, 0.1)' : '#E6F3FA' 
              }]}>
                <View style={styles.locationCardContent}>
                  <View style={styles.locationIconContainer}>
                    <LinearGradient
                      colors={['#03A9F4', '#0288D1']}
                      style={styles.locationIconGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Gift size={24} color="#fff" />
                    </LinearGradient>
                  </View>
                  <View style={styles.locationCardText}>
                    <Text style={[styles.locationCardTitle, responsiveTextStyles.h4, { color: colors.foreground }]}>
                      {t('offers.locationBasedOffers') || 'Location-Based Offers'}
                    </Text>
                    <Text style={[styles.locationCardDescription, responsiveTextStyles.bodySmall, { color: colors.mutedForeground }]}>
                      {t('offers.locationBasedDescription') || 'We show you exclusive deals available in your area'}
                      {userCountry && (() => {
                        const country = COUNTRIES.find(c => c.code === userCountry);
                        return country ? (
                          <Text style={{ color: '#03A9F4', fontWeight: '600' }}> ({country.name})</Text>
                        ) : null;
                      })()}
                      <Text>{t('offers.updateLocationMessage') || '. Update your location in Settings to see offers from different regions.'}</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* Disclaimer Card */}
              <View style={[styles.disclaimerCard, { 
                backgroundColor: isDark ? 'rgba(255, 193, 7, 0.1)' : '#FFFBE6',
                borderLeftColor: '#FFC107',
                borderLeftWidth: 4,
              }]}>
                <View style={styles.disclaimerContent}>
                  <Shield size={20} color="#FFC107" style={styles.disclaimerIcon} />
                  <View style={styles.disclaimerText}>
                    <Text style={[styles.disclaimerTextContent, responsiveTextStyles.bodySmall, { color: colors.foreground }]}>
                      <Text style={{ fontWeight: '600' }}>{t('offers.partnerOffersLabel') || 'Partner Offers:'}</Text>{' '}
                      {t('offers.disclaimer') || 'All offers are provided by our trusted partners. Terms and conditions apply to each offer. Please review the details before proceeding.'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.promotionsList}>
            {filteredPromotions.map((promo) => {
              const IconComponent = getCategoryIcon(promo.type);
              
              return (
                <Pressable
                  key={promo.id}
                  style={[styles.promotionCard, { backgroundColor: colors.card }]}
                  onPress={() => handlePromotionClick(promo)}
                >
                  {promo.imageUrl ? (
                    <Image
                      source={{ uri: promo.imageUrl }}
                      style={styles.promotionImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.promotionImagePlaceholder, { backgroundColor: colors.muted }]}>
                      <IconComponent size={32} color={colors.primary} />
                    </View>
                  )}
                  
                  <View style={styles.promotionContent}>
                    <View style={styles.promotionHeader}>
                      <View style={styles.promotionTitleContainer}>
                        <LinearGradient
                          colors={getTypeGradientColors(promo.type)}
                          style={styles.promotionIconContainer}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <IconComponent size={20} color="#fff" />
                        </LinearGradient>
                        <View style={styles.promotionTitleWrapper}>
                          <Text style={[styles.promotionTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>
                            {promo.title}
                          </Text>
                          <Text style={[styles.promotionType, { color: colors.mutedForeground }]}>
                            {promo.type ? promo.type.replace('_', ' ').toUpperCase() : 'OFFER'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    {promo.description && (
                      <Text style={[styles.promotionDescription, responsiveTextStyles.bodySmall, { color: colors.mutedForeground }]}>
                        {promo.description}
                      </Text>
                    )}
                    
                    {promo.actionUrl && (
                      <LinearGradient
                        colors={getTypeGradientColors(promo.type)}
                        style={styles.promotionFooter}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={[styles.promotionButtonText, responsiveTextStyles.button]}>
                          {t('offers.learnMore') || 'Learn More'}
                        </Text>
                        <ExternalLink size={16} color="#fff" />
                      </LinearGradient>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    ...textStyles.body,
  },
  header: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...textStyles.h3,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...textStyles.bodySmall,
  },
  promotionsList: {
    gap: 16,
  },
  promotionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  promotionImage: {
    width: '100%',
    height: 180,
  },
  promotionImagePlaceholder: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promotionContent: {
    padding: 16,
  },
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  promotionTitle: {
    ...textStyles.h3,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  promotionType: {
    ...textStyles.labelSmall,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  discountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: '#fff',
    ...textStyles.labelSmall,
    fontWeight: 'bold',
  },
  promotionDescription: {
    ...textStyles.bodySmall,
    lineHeight: 20,
    marginBottom: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  codeLabel: {
    ...textStyles.labelSmall,
    marginRight: 8,
  },
  codeValue: {
    ...textStyles.body,
    fontWeight: '600',
    fontFamily: fonts.mono,
  },
  promotionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  promotionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  promotionTitleWrapper: {
    flex: 1,
  },
  promotionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  promotionButtonText: {
    color: '#fff',
    ...textStyles.button,
    fontWeight: '600',
  },
  linkText: {
    ...textStyles.button,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    marginTop: 16,
    ...textStyles.h3,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    ...textStyles.body,
    textAlign: 'center',
  },
  infoCardsContainer: {
    marginTop: 24,
    gap: 16,
  },
  locationCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationCardContent: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIconContainer: {
    marginRight: 16,
  },
  locationIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#03A9F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  locationCardText: {
    flex: 1,
  },
  locationCardTitle: {
    ...textStyles.h4,
    fontWeight: '600',
    marginBottom: 8,
  },
  locationCardDescription: {
    ...textStyles.bodySmall,
    lineHeight: 20,
  },
  disclaimerCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  disclaimerContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  disclaimerIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  disclaimerText: {
    flex: 1,
  },
  disclaimerTextContent: {
    ...textStyles.bodySmall,
    lineHeight: 20,
  },
});

