import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Copy,
  Share2,
  Gift,
  Users,
  Trophy,
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
} from 'lucide-react-native';
import { referralsService } from '../api/services/referrals';
import { authService } from '../api/services/auth';
import { formatDateForDisplay } from '../api/utils/dateUtils';
import { useTheme } from '../contexts/ThemeContext';
import { textStyles, createResponsiveTextStyles } from '../constants/fonts';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { showToast } from '../utils/toast';

interface ReferralScreenProps {
  onBack: () => void;
}

export default function ReferralScreen({ onBack }: ReferralScreenProps) {
  const { t, i18n } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralUrl, setReferralUrl] = useState('');
  const [rewardDays, setRewardDays] = useState(30);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    pendingReferrals: 0,
    totalRewardsEarned: 0,
  });
  const [referrals, setReferrals] = useState<any[]>([]);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const user = await authService.getCurrentUser();
      setUserId(user.id);

      // Generate referral link if not exists
      const referralData = await referralsService.generateReferralLink() as any;
      setReferralCode(referralData.referralCode || referralData.referral_code || '');
      setReferralUrl(referralData.shareUrl || referralData.share_url || '');

      // Get reward days
      const rewardData = await referralsService.getReferralRewardDays() as any;
      setRewardDays(rewardData.referralRewardDays || rewardData.referral_reward_days || 30);

      // Get user referrals
      if (user.id) {
        const referralResponse = await referralsService.getUserReferrals(user.id);
        const refData = referralResponse.referrals || [];
        setReferrals(refData);
        
        const refStats = (referralResponse.stats || {}) as any;
        setStats({
          totalReferrals: refStats.total_referrals || refStats.totalReferrals || 0,
          activeReferrals: refStats.active_referrals || refStats.activeReferrals || 0,
          pendingReferrals: refStats.pending_rewards || refStats.pendingRewards || 0,
          totalRewardsEarned: refStats.rewards_earned || refStats.rewardsEarned || 0,
        });
      }
    } catch (error) {
      showToast.error(t('referral.failedToLoad') || 'Failed to load referral data', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    Clipboard.setString(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUrl = () => {
    Clipboard.setString(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      const message = t('referral.shareMessage', { code: referralCode });
      const result = await Share.share({
        message: `${message}\n\n${referralUrl}`,
        title: t('referral.shareTitle') || 'Join Spendly',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleShareVia = async (platform: 'email' | 'sms' | 'whatsapp') => {
    const message = t('referral.shareMessage', { code: referralCode });
    const fullMessage = `${message}\n\n${referralUrl}`;

    try {
      if (platform === 'email') {
        const emailUrl = `mailto:?subject=${encodeURIComponent(t('referral.shareTitle') || 'Join Spendly')}&body=${encodeURIComponent(fullMessage)}`;
        await Linking.openURL(emailUrl);
      } else if (platform === 'sms') {
        const smsUrl = `sms:?body=${encodeURIComponent(fullMessage)}`;
        await Linking.openURL(smsUrl);
      } else if (platform === 'whatsapp') {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
        await Linking.openURL(whatsappUrl);
      }
    } catch (error) {
      console.error(`Error opening ${platform}:`, error);
      showToast.error(`Failed to open ${platform}`, 'Error');
    }
  };

  // Calculate reward text
  const months = Math.round(rewardDays / 30);
  const rewardText = months === 1
    ? t('referral.rewardMonths', { count: 1 })
    : months < 1
      ? rewardDays === 1
        ? t('referral.rewardDays', { count: 1 })
        : t('referral.rewardDaysPlural', { count: rewardDays })
      : t('referral.rewardMonthsPlural', { count: months });

  const responsiveTextStyles = createResponsiveTextStyles(width);
  


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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#4CAF50', '#03A9F4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <Pressable onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, responsiveTextStyles.h3, { color: '#fff' }]}>
              {t('referral.title')}
            </Text>
            <Text style={[styles.headerSubtitle, responsiveTextStyles.bodySmall, { color: '#fff', opacity: 0.9 }]}>
              {t('referral.subtitle')}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Referral Code Card */}
          <LinearGradient
            colors={['#4CAF50', '#03A9F4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.referralCodeCard}
          >
            <Gift size={48} color="#fff" style={styles.giftIcon} />
            <Text style={[styles.referralCodeLabel, { color: '#fff', opacity: 0.9 }]}>
              {t('referral.yourReferralCode')}
            </Text>
            <Text style={[styles.referralCode, responsiveTextStyles.h2, { color: '#fff' }]}>
              {referralCode}
            </Text>
            <View style={styles.referralCodeActions}>
              <Pressable
                onPress={handleCopyCode}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                  pressed && { opacity: 0.7 },
                ]}
              >
                {copied ? (
                  <>
                    <CheckCircle size={16} color="#fff" />
                    <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                      {t('referral.copied')}
                    </Text>
                  </>
                ) : (
                  <>
                    <Copy size={16} color="#fff" />
                    <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                      {t('referral.copyCode')}
                    </Text>
                  </>
                )}
              </Pressable>
              <Pressable
                onPress={handleShare}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Share2 size={16} color="#fff" />
                <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                  {t('referral.share')}
                </Text>
              </Pressable>
            </View>
          </LinearGradient>

          {/* Share Options */}
          <View style={[styles.shareOptionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.shareOptionsHeader}>
              <Share2 size={20} color={colors.primary} />
              <Text style={[styles.shareOptionsTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>
                {t('referral.shareVia')}
              </Text>
            </View>
            <View style={styles.shareOptionsGrid}>
              <Pressable
                onPress={() => handleShareVia('email')}
                style={({ pressed }) => [
                  styles.shareOption,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Mail size={24} color="#4CAF50" />
                <Text style={[styles.shareOptionText, responsiveTextStyles.bodySmall, { color: colors.foreground }]}>
                  {t('referral.email')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleShareVia('sms')}
                style={({ pressed }) => [
                  styles.shareOption,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MessageSquare size={24} color="#03A9F4" />
                <Text style={[styles.shareOptionText, responsiveTextStyles.bodySmall, { color: colors.foreground }]}>
                  {t('referral.sms')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleShareVia('whatsapp')}
                style={({ pressed }) => [
                  styles.shareOption,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MessageSquare size={24} color="#4CAF50" />
                <Text style={[styles.shareOptionText, responsiveTextStyles.bodySmall, { color: colors.foreground }]}>
                  {t('referral.whatsapp')}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Users size={20} color="#4CAF50" />
                <Text style={[styles.statLabel, responsiveTextStyles.label, { color: colors.mutedForeground }]}>
                  {t('referral.totalReferrals')}
                </Text>
              </View>
              <Text style={[styles.statValue, responsiveTextStyles.h3, { color: colors.foreground }]}>
                {stats.totalReferrals}
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Trophy size={20} color="#FFC107" />
                <Text style={[styles.statLabel, responsiveTextStyles.label, { color: colors.mutedForeground }]}>
                  {t('referral.rewardsEarned')}
                </Text>
              </View>
              <Text style={[styles.statValue, responsiveTextStyles.h3, { color: colors.foreground }]}>
                {stats.totalRewardsEarned}
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <CheckCircle size={20} color="#4CAF50" />
                <Text style={[styles.statLabel, responsiveTextStyles.label, { color: colors.mutedForeground }]}>
                  {t('referral.active')}
                </Text>
              </View>
              <Text style={[styles.statValue, responsiveTextStyles.h3, { color: colors.foreground }]}>
                {stats.activeReferrals}
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Clock size={20} color="#FFC107" />
                <Text style={[styles.statLabel, responsiveTextStyles.label, { color: colors.mutedForeground }]}>
                  {t('referral.pending')}
                </Text>
              </View>
              <Text style={[styles.statValue, responsiveTextStyles.h3, { color: colors.foreground }]}>
                {stats.pendingReferrals}
              </Text>
            </View>
          </View>

          {/* How It Works */}
          <View style={[styles.howItWorksCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.howItWorksHeader}>
              <Gift size={20} color="#4CAF50" />
              <Text style={[styles.howItWorksTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>
                {t('referral.howItWorks')}
              </Text>
            </View>
            <View style={styles.stepsContainer}>
              <View style={styles.step}>
                <View style={[styles.stepNumber, { backgroundColor: '#4CAF50' }]}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, responsiveTextStyles.body, { color: colors.foreground, fontWeight: 'bold' }]}>
                    {t('referral.step1Title')}
                  </Text>
                  <Text style={[styles.stepDescription, responsiveTextStyles.bodySmall, { color: colors.mutedForeground }]}>
                    {t('referral.step1Description')}
                  </Text>
                </View>
              </View>
              <View style={styles.step}>
                <View style={[styles.stepNumber, { backgroundColor: '#03A9F4' }]}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, responsiveTextStyles.body, { color: colors.foreground, fontWeight: 'bold' }]}>
                    {t('referral.step2Title')}
                  </Text>
                  <Text style={[styles.stepDescription, responsiveTextStyles.bodySmall, { color: colors.mutedForeground }]}>
                    {t('referral.step2Description')}
                  </Text>
                </View>
              </View>
              <View style={styles.step}>
                <View style={[styles.stepNumber, { backgroundColor: '#FFC107' }]}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, responsiveTextStyles.body, { color: colors.foreground, fontWeight: 'bold' }]}>
                    {t('referral.step3Title')}
                  </Text>
                  <Text style={[styles.stepDescription, responsiveTextStyles.bodySmall, { color: colors.mutedForeground }]}>
                    {t('referral.step3Description', { rewardText })}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Referral List */}
          <View style={[styles.referralsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.referralsHeader}>
              <Users size={20} color="#4CAF50" />
              <Text style={[styles.referralsTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>
                {t('referral.yourReferralsCount', { count: referrals.length })}
              </Text>
            </View>
            {referrals.length === 0 ? (
              <View style={styles.emptyReferrals}>
                <Users size={48} color={colors.mutedForeground} style={styles.emptyIcon} />
                <Text style={[styles.emptyText, responsiveTextStyles.body, { color: colors.mutedForeground, fontWeight: '600' }]}>
                  {t('referral.noReferralsYet')}
                </Text>
                <Text style={[styles.emptySubtext, responsiveTextStyles.bodySmall, { color: colors.mutedForeground }]}>
                  {t('referral.startSharingMessage')}
                </Text>
              </View>
            ) : (
              <View style={styles.referralsList}>
                {referrals.map((referral) => {
                  const referredUser = referral.referred_user || referral.referredUser || {};
                  const status = referral.reward_status || referral.rewardStatus || 'pending';
                  const isActive = status === 'claimed' || status === 'active';
                  
                  return (
                    <View
                      key={referral.id}
                      style={[styles.referralItem, { backgroundColor: colors.muted, borderColor: colors.border }]}
                    >
                      <View style={styles.referralItemContent}>
                        <View style={styles.referralItemHeader}>
                          <Text style={[styles.referralName, responsiveTextStyles.body, { color: colors.foreground, fontWeight: '600' }]}>
                            {referredUser.name || 'Unknown'}
                          </Text>
                          {isActive ? (
                            <CheckCircle size={16} color="#4CAF50" />
                          ) : (
                            <Clock size={16} color="#FFC107" />
                          )}
                        </View>
                        <Text style={[styles.referralEmail, responsiveTextStyles.bodySmall, { color: colors.mutedForeground }]}>
                          {referredUser.email || ''}
                        </Text>
                        <Text style={[styles.referralDate, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                          {t('referral.joined', { date: formatDateForDisplay(referral.created_at || referral.createdAt, i18n.language) })}
                        </Text>
                      </View>
                      <View style={styles.referralItemStatus}>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor: isActive ? '#4CAF50' + '1A' : '#FFC107' + '1A',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              responsiveTextStyles.labelSmall,
                              { color: isActive ? '#4CAF50' : '#FFC107' },
                            ]}
                          >
                            {isActive ? t('referral.active') : t('referral.pending')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
    marginTop: 10,
    ...textStyles.body,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    padding: 8,
    marginBottom: 12,
  },
  headerTextContainer: {
    paddingHorizontal: 8,
  },
  headerTitle: {
    ...textStyles.h3,
    marginBottom: 4,
  },
  headerSubtitle: {
    lineHeight: 18,
  },
  content: {
    padding: 16,
    marginTop: -12,
  },
  referralCodeCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  giftIcon: {
    marginBottom: 12,
    opacity: 0.9,
  },
  referralCodeLabel: {
    ...textStyles.label,
    marginBottom: 8,
  },
  referralCode: {
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: 20,
  },
  referralCodeActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    ...textStyles.button,
    fontWeight: '600',
  },
  shareOptionsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  shareOptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  shareOptionsTitle: {
    fontWeight: 'bold',
  },
  shareOptionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  shareOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  shareOptionText: {
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statLabel: {
    flex: 1,
  },
  statValue: {
    fontWeight: 'bold',
    fontFamily: textStyles.display.fontFamily,
  },
  howItWorksCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  howItWorksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  howItWorksTitle: {
    fontWeight: 'bold',
  },
  stepsContainer: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    color: '#fff',
    ...textStyles.body,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    lineHeight: 18,
  },
  referralsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  referralsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  referralsTitle: {
    fontWeight: 'bold',
  },
  emptyReferrals: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtext: {
    textAlign: 'center',
  },
  referralsList: {
    gap: 12,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  referralItemContent: {
    flex: 1,
  },
  referralItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  referralName: {
    fontWeight: '600',
  },
  referralEmail: {
    marginBottom: 4,
  },
  referralDate: {
    ...textStyles.caption,
  },
  referralItemStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontWeight: '600',
  },
});

