import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  useWindowDimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { fonts, textStyles, createResponsiveTextStyles } from '../constants/fonts';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertTriangle,
  BarChart3,
  Activity,
  Award,
  Info,
  HelpCircle,
  ArrowLeft,
  X,
} from 'lucide-react-native';
import {
  analyticsService,
  Insight,
  CategoryBreakdownItem,
  SpendingTrend,
  HealthScore,
} from '../api/services/analytics';
import { useTheme } from '../contexts/ThemeContext';
import { translateCategoryName } from '../utils/categoryTranslator';
import { getEmojiFromIcon } from '../utils/iconMapper';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

interface AnalyticsScreenProps {
  onBack?: () => void;
}

type TabType = 'insights' | 'categories' | 'trends' | 'health';

export default function AnalyticsScreen({ onBack }: AnalyticsScreenProps) {
  const { t, i18n } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('insights');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [spendingTrends, setSpendingTrends] = useState<SpendingTrend[]>([]);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [showImprovementTips, setShowImprovementTips] = useState(false);
  const [languageKey, setLanguageKey] = useState(i18n.language); // Force re-render on language change

  const responsiveTextStyles = createResponsiveTextStyles(width);
  
  // Listen to language changes and force re-render
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setLanguageKey(lng);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  useEffect(() => {
    loadAnalytics();
  }, [languageKey]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch all analytics data in parallel with individual error handling
      const [insightsData, categoryData, trendsData, healthData] = await Promise.all([
        analyticsService.getInsights().catch(err => {
          console.error('Failed to load insights:', err);
          return { insights: [] };
        }),
        analyticsService.getCategoryBreakdown({ months: 1, type: 'expense' }).catch(err => {
          console.error('Failed to load category breakdown:', err);
          return { breakdown: [] };
        }),
        analyticsService.getSpendingTrends({ period: 'monthly', months: 6 }).catch(err => {
          console.error('Failed to load spending trends:', err);
          return { trends: [] };
        }),
        analyticsService.getHealthScore().catch(err => {
          console.error('Failed to load health score:', err);
          return null;
        }),
      ]);

      setInsights(insightsData.insights || []);
      setCategoryBreakdown(categoryData.breakdown || []);
      setSpendingTrends(trendsData.trends || []);
      setHealthScore(healthData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const getSentimentStyles = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return { bg: '#E8F5E9', border: '#A5D6A7', text: '#2E7D32' };
      case 'negative':
        return { bg: '#FFEBEE', border: '#EF9A9A', text: '#C62828' };
      default:
        return { bg: '#E3F2FD', border: '#90CAF9', text: '#1565C0' };
    }
  };

  const getInsightIcon = (icon: string, color: string, size: number = 20) => {
    const props = { size, color };
    switch (icon) {
      case 'piggy-bank': return <PiggyBank {...props} />;
      case 'trending-up': return <TrendingUp {...props} />;
      case 'trending-down': return <TrendingDown {...props} />;
      case 'bar-chart': return <BarChart3 {...props} />;
      case 'alert-triangle': return <AlertTriangle {...props} />;
      case 'activity': return <Activity {...props} />;
      default: return <BarChart3 {...props} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#03A9F4';
      default: return '#FF9800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent': return t('analytics.statusExcellent');
      case 'good': return t('analytics.statusGood');
      case 'needs_improvement': return t('analytics.statusNeedsImprovement');
      default: return status.replace('_', ' ');
    }
  };

  const translateFactorName = (factorName: string): string => {
    const factorNameMap: { [key: string]: string } = {
      'Savings Rate': t('analytics.savingsRate'),
      'Spending Trend': t('analytics.spendingTrend'),
      'Top Spending Category': t('analytics.topSpendingCategory'),
      'Spending Pace': t('analytics.spendingPace'),
      'Solid Emergency Fund': t('analytics.solidEmergencyFund'),
      'Emergency Fund': t('analytics.emergencyFund'),
      'Transaction Tracking': t('analytics.transactionTracking'),
      'Tracking Consistency': t('analytics.trackingConsistency'),
    };
    return factorNameMap[factorName] || factorName;
  };

  const translateInsightTitle = (title: string): string => {
    const titleMap: { [key: string]: string } = {
      'Savings Rate': t('analytics.savingsRate'),
      'Spending Trend': t('analytics.spendingTrend'),
      'Top Spending Category': t('analytics.topSpendingCategory'),
      'Spending Pace': t('analytics.spendingPace'),
      'Solid Emergency Fund': t('analytics.solidEmergencyFund'),
      'Emergency Fund': t('analytics.emergencyFund'),
    };
    return titleMap[title] || title;
  };

  const translateInsightMessage = (message: string): string => {
    // Match "You're saving X% of your income this month." (Allow negative numbers, optional period)
    const savingsRateMatch = message.match(/You're saving\s+([-]?[\d.,]+)\s*%\s+of your income this month/i);
    if (savingsRateMatch) {
      return t('analytics.insightSavingPercentage', { 
        percentage: savingsRateMatch[1],
        defaultValue: `You're saving ${savingsRateMatch[1]}% of your income this month.`
      });
    }
    
    // Match "You've spent X% less compared to last month."
    const spendingTrendMatch = message.match(/You've spent\s+([\d.,]+)\s*%\s+less compared to last month/i);
    if (spendingTrendMatch) {
      return t('analytics.insightSpendingLess', { 
        percentage: spendingTrendMatch[1],
        defaultValue: `You've spent ${spendingTrendMatch[1]}% less compared to last month.`
      });
    }
    
    // Match "You've spent X% more compared to last month."
    const spendingMoreMatch = message.match(/You've spent\s+([\d.,]+)\s*%\s+more compared to last month/i);
    if (spendingMoreMatch) {
      return t('analytics.insightSpendingMore', { 
        percentage: spendingMoreMatch[1],
        defaultValue: `You've spent ${spendingMoreMatch[1]}% more compared to last month.`
      });
    }
    
    // Match "At your current pace, you'll spend $X this month."
    const spendingPaceMatch = message.match(/At your current pace, you'll spend\s+\$?([\d,]+\.?\d*)\s+this month/i);
    if (spendingPaceMatch) {
      return t('analytics.insightSpendingPace', { 
        amount: spendingPaceMatch[1],
        defaultValue: `At your current pace, you'll spend $${spendingPaceMatch[1]} this month.`
      });
    }
    
    // Match "Great job! Your emergency fund covers X months of expenses."
    const emergencyFundMatch = message.match(/Great job! Your emergency fund covers\s+([\d.]+)\s+months?/i);
    if (emergencyFundMatch) {
      return t('analytics.insightEmergencyFund', { 
        months: emergencyFundMatch[1],
        defaultValue: `Great job! Your emergency fund covers ${emergencyFundMatch[1]} months of expenses.`
      });
    }
    
    // Match "X is your biggest expense at Y% of total spending."
    const topCategoryMatch = message.match(/(.+?)\s+is your biggest expense at\s+([\d.]+)\s*%\s+of total spending/i);
    if (topCategoryMatch) {
      const categoryName = topCategoryMatch[1];
      const translatedCategory = translateCategoryName(categoryName, t);
      return t('analytics.insightTopCategory', { 
        category: translatedCategory, 
        percentage: topCategoryMatch[2],
        defaultValue: `${translatedCategory} is your biggest expense at ${topCategoryMatch[2]}% of total spending.`
      });
    }
    
    // If message doesn't match any pattern, return original message
    return message;
  };

  // Translate month labels like "Oct 2025" to localized format
  const translateMonthLabel = (label: string): string => {
    // Match patterns like "Oct 2025", "Nov 2025", "Dec 2025"
    const monthYearMatch = label.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i);
    if (monthYearMatch) {
      const monthAbbr = monthYearMatch[1];
      const year = monthYearMatch[2];
      
      // Map English month abbreviations to translation keys
      const monthMap: { [key: string]: string } = {
        'Jan': 'january',
        'Feb': 'february',
        'Mar': 'march',
        'Apr': 'april',
        'May': 'may',
        'Jun': 'june',
        'Jul': 'july',
        'Aug': 'august',
        'Sep': 'september',
        'Oct': 'october',
        'Nov': 'november',
        'Dec': 'december',
      };
      
      const monthKey = monthMap[monthAbbr];
      if (monthKey) {
        const translatedMonth = t(`common.months.${monthKey}`, { defaultValue: monthAbbr });
        return `${translatedMonth} ${year}`;
      }
    }
    
    // If no match, return original label
    return label;
  };

  // Translate health score factor values
  const translateFactorValue = (value: string): string => {
    if (!value) return '';
    
    // Match "X transactions" pattern
    const transactionsMatch = value.match(/^(\d+)\s+transactions?$/i);
    if (transactionsMatch) {
      return t('analytics.factorTransactions', { 
        count: transactionsMatch[1],
        defaultValue: `${transactionsMatch[1]} transactions`
      });
    }
    
    // Match "X/Y months active" pattern
    const monthsActiveMatch = value.match(/^(\d+)\/(\d+)\s+months?\s+active$/i);
    if (monthsActiveMatch) {
      return t('analytics.factorMonthsActive', { 
        active: monthsActiveMatch[1],
        total: monthsActiveMatch[2],
        defaultValue: `${monthsActiveMatch[1]}/${monthsActiveMatch[2]} months active`
      });
    }
    
    // Match "(X months)" pattern
    const monthsMatch = value.match(/^\((\d+)\s+months?\)$/i);
    if (monthsMatch) {
      return t('analytics.factorMonths', { 
        count: monthsMatch[1],
        defaultValue: `(${monthsMatch[1]} months)`
      });
    }

    // Match "Amount (X months)" pattern e.g. "$39,900.00 (4.1 months)"
    // Matches currency symbol or code optional, amount, and months in parens
    const amountMonthsMatch = value.match(/^([^\(]+)\s+\(([\d.]+)\s+months?\)$/i);
    if (amountMonthsMatch) {
      return `${amountMonthsMatch[1]} ${t('analytics.factorMonths', { 
        count: amountMonthsMatch[2],
        defaultValue: `(${amountMonthsMatch[2]} months)`
      })}`;
    }
    
    // Match "Try to save at least X% of your income each month."
    const saveRecommendationMatch = value.match(/Try to save at least ([\d.]+)% of your income each month/i);
    if (saveRecommendationMatch) {
      return t('analytics.recommendationSavePercentage', { 
        percentage: saveRecommendationMatch[1],
        defaultValue: `Try to save at least ${saveRecommendationMatch[1]}% of your income each month.`
      });
    }
    
    // Return original value if no pattern matches
    return value;
  };

  // Translate recommendations
  const translateRecommendation = (recommendation: string): string => {
    if (!recommendation) return '';
    
    // First try translateFactorValue for patterns like "X transactions", "X/Y months active", etc.
    const factorTranslated = translateFactorValue(recommendation);
    if (factorTranslated !== recommendation) {
      return factorTranslated;
    }
    
    // Handle full sentence recommendations
    const lowerRec = recommendation.toLowerCase().trim();
    
    // "Track all your expenses to get better insights."
    if (lowerRec.includes('track all your expenses') && lowerRec.includes('better insights')) {
      return t('analytics.recommendationTrackExpenses', { 
        defaultValue: 'Track all your expenses to get better insights.'
      });
    }
    
    // "Make it a habit to track expenses regularly."
    if (lowerRec.includes('make it a habit') && lowerRec.includes('track expenses regularly')) {
      return t('analytics.recommendationTrackRegularly', { 
        defaultValue: 'Make it a habit to track expenses regularly.'
      });
    }
    
    // "Build an emergency fund covering 3-6 months of expenses."
    if (lowerRec.includes('build an emergency fund') && lowerRec.includes('months of expenses')) {
      const monthsMatch = recommendation.match(/(\d+)-(\d+)\s+months/i) || recommendation.match(/(\d+)\s+months/i);
      if (monthsMatch) {
        if (monthsMatch[2]) {
          return t('analytics.recommendationEmergencyFundRange', { 
            min: monthsMatch[1],
            max: monthsMatch[2],
            defaultValue: `Build an emergency fund covering ${monthsMatch[1]}-${monthsMatch[2]} months of expenses.`
          });
        } else {
          return t('analytics.recommendationEmergencyFund', { 
            months: monthsMatch[1],
            defaultValue: `Build an emergency fund covering ${monthsMatch[1]} months of expenses.`
          });
        }
      }
      return t('analytics.recommendationEmergencyFundGeneral', { 
        defaultValue: 'Build an emergency fund covering 3-6 months of expenses.'
      });
    }
    
    // Return original if no pattern matches
    return recommendation;
  };

  const themedStyles = {
    container: { backgroundColor: colors.background },
    card: { backgroundColor: colors.card },
    text: { color: colors.foreground },
    textMuted: { color: colors.mutedForeground },
    border: { borderColor: colors.border },
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'insights', label: t('analytics.insights') },
    { key: 'categories', label: t('analytics.categories') },
    { key: 'trends', label: t('analytics.trends') },
    { key: 'health', label: t('analytics.health') },
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#03A9F4" />
          <Text style={[styles.loadingText, themedStyles.textMuted]}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <Pressable onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.foreground} />
          </Pressable>
        )}
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <BarChart3 size={28} color="#03A9F4" />
            <Text style={[styles.headerTitle, themedStyles.text, responsiveTextStyles.h3]}>
              {t('reports.analytics')}
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, themedStyles.border]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  responsiveTextStyles.bodySmall,
                  activeTab === tab.key ? styles.activeTabText : themedStyles.textMuted,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, themedStyles.text, responsiveTextStyles.h3]}>
              {t('analytics.smartInsights')}
            </Text>
            {insights.length === 0 ? (
              <View style={[styles.emptyCard, themedStyles.card]}>
                <BarChart3 size={48} color={colors.mutedForeground} style={{ opacity: 0.3 }} />
                <Text style={[styles.emptyText, themedStyles.textMuted]}>
                  {t('analytics.noInsightsAvailable', { defaultValue: 'No insights available yet' })}
                </Text>
              </View>
            ) : (
              insights.map((insight, index) => {
                const sentimentStyles = getSentimentStyles(insight.sentiment);
                return (
                  <View
                    key={index}
                    style={[
                      styles.insightCard,
                      {
                        backgroundColor: sentimentStyles.bg,
                        borderColor: sentimentStyles.border,
                      },
                    ]}
                  >
                    <View style={styles.insightIcon}>
                      {getInsightIcon(insight.icon, sentimentStyles.text)}
                    </View>
                    <View style={styles.insightContent}>
                      <Text style={[styles.insightTitle, { color: sentimentStyles.text }]}>
                        {translateInsightTitle(insight.title)}
                      </Text>
                      <Text style={[styles.insightMessage, { color: sentimentStyles.text }]}>
                        {translateInsightMessage(insight.message)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, themedStyles.text, responsiveTextStyles.h3]}>
              {t('analytics.spendingByCategory')}
            </Text>
            {categoryBreakdown.length === 0 ? (
              <View style={[styles.emptyCard, themedStyles.card]}>
                <BarChart3 size={48} color={colors.mutedForeground} style={{ opacity: 0.3 }} />
                <Text style={[styles.emptyText, themedStyles.textMuted]}>
                  {t('analytics.noSpendingData', { defaultValue: 'No spending data for this period' })}
                </Text>
              </View>
            ) : (
              categoryBreakdown.map((item, index) => (
                <View key={index} style={[styles.categoryCard, themedStyles.card]}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryLeft}>
                      <View
                        style={[
                          styles.categoryIcon,
                          { backgroundColor: (item.color || COLORS[index % COLORS.length]) + '20' },
                        ]}
                      >
                        <Text style={styles.categoryEmoji}>
                          {getEmojiFromIcon(item.icon)}
                        </Text>
                      </View>
                      <View style={styles.categoryInfo}>
                        <Text style={[styles.categoryName, themedStyles.text]}>
                          {translateCategoryName(item.category, t)}
                        </Text>
                        <Text style={[styles.categoryCount, themedStyles.textMuted]}>
                          {item.count} {t('analytics.transactions')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text style={[styles.categoryTotal, themedStyles.text]}>
                        ${item.total.toFixed(2)}
                      </Text>
                      <Text style={[styles.categoryPercentage, themedStyles.textMuted]}>
                        {item.percentage}%
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: colors.muted }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${item.percentage}%`,
                          backgroundColor: item.color || COLORS[index % COLORS.length],
                        },
                      ]}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, themedStyles.text, responsiveTextStyles.h3]}>
              {t('analytics.spendingTrends')}
            </Text>
            {spendingTrends.length === 0 ? (
              <View style={[styles.emptyCard, themedStyles.card]}>
                <TrendingUp size={48} color={colors.mutedForeground} style={{ opacity: 0.3 }} />
                <Text style={[styles.emptyText, themedStyles.textMuted]}>
                  {t('analytics.noTrendData', { defaultValue: 'No trend data available' })}
                </Text>
              </View>
            ) : (
              spendingTrends.map((trend, index) => {
                const savingsRate = trend.savingsRate ?? trend.savings_rate ?? 0;
                return (
                  <View key={index} style={[styles.trendCard, themedStyles.card]}>
                    <View style={styles.trendHeader}>
                      <Text style={[styles.trendLabel, themedStyles.text]}>
                        {translateMonthLabel(trend.label)}
                      </Text>
                      <Text
                        style={[
                          styles.trendSavingsRate,
                          { color: trend.net >= 0 ? '#4CAF50' : '#FF5252' },
                        ]}
                      >
                        {savingsRate.toFixed(1)}% {t('analytics.saved')}
                      </Text>
                    </View>
                    <View style={styles.trendDetails}>
                      <View style={styles.trendRow}>
                        <Text style={[styles.trendRowLabel, themedStyles.textMuted]}>
                          {t('dashboard.income')}
                        </Text>
                        <Text style={[styles.trendRowValue, { color: '#4CAF50' }]}>
                          ${trend.income.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.trendRow}>
                        <Text style={[styles.trendRowLabel, themedStyles.textMuted]}>
                          {t('dashboard.expenses')}
                        </Text>
                        <Text style={[styles.trendRowValue, { color: '#FF5252' }]}>
                          ${trend.expense.toFixed(2)}
                        </Text>
                      </View>
                      <View style={[styles.trendRow, styles.trendRowNet]}>
                        <Text style={[styles.trendRowLabel, themedStyles.text, { fontWeight: '600' }]}>
                          {t('analytics.net')}
                        </Text>
                        <Text
                          style={[
                            styles.trendRowValue,
                            { color: trend.net >= 0 ? '#4CAF50' : '#FF5252', fontWeight: '700' },
                          ]}
                        >
                          ${Math.abs(trend.net).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Health Score Tab */}
        {activeTab === 'health' && healthScore && (
          <View style={styles.tabContent}>
            {/* Score Card */}
            <View style={styles.healthScoreCard}>
              <Award size={48} color="#03A9F4" />
              <Text style={[styles.healthScoreValue, responsiveTextStyles.display]}>
                {healthScore.score.toFixed(1)}/{healthScore.maxScore ?? healthScore.max_score}
              </Text>
              <View style={styles.gradeRow}>
                <Text style={styles.healthGrade}>
                  {t('analytics.grade')} {healthScore.grade}
                </Text>
                {(healthScore.grade === 'C' || healthScore.grade === 'D' || healthScore.grade === 'F') && (
                  <Pressable
                    onPress={() => setShowImprovementTips(true)}
                    style={styles.infoButton}
                  >
                    <Info size={20} color="#03A9F4" />
                  </Pressable>
                )}
              </View>
              <Text style={styles.healthScoreLabel}>
                {t('analytics.financialHealthScore')}
              </Text>
            </View>

            {/* Score Breakdown */}
            <Text style={[styles.sectionTitle, themedStyles.text, responsiveTextStyles.h3]}>
              {t('analytics.scoreBreakdown')}
            </Text>
            {healthScore.factors.map((factor, index) => (
              <View key={index} style={[styles.factorCard, themedStyles.card]}>
                <View style={styles.factorHeader}>
                  <View>
                    <Text style={[styles.factorName, themedStyles.text]}>
                      {translateFactorName(factor.name)}
                    </Text>
                    <Text style={[styles.factorValue, themedStyles.textMuted]}>
                      {translateFactorValue(factor.value)}
                    </Text>
                  </View>
                  <View style={styles.factorRight}>
                    <Text style={[styles.factorScore, themedStyles.text]}>
                      {factor.score.toFixed(1)}/{factor.max}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(factor.status) + '20' },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: getStatusColor(factor.status) }]}
                      >
                        {getStatusLabel(factor.status)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: colors.muted }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${(factor.score / factor.max) * 100}%`,
                        backgroundColor: getStatusColor(factor.status),
                      },
                    ]}
                  />
                </View>
              </View>
            ))}

            {/* Recommendations */}
            <View style={[styles.recommendationsCard, themedStyles.card]}>
              <View style={styles.recommendationsHeader}>
                <AlertTriangle size={20} color="#03A9F4" />
                <Text style={[styles.recommendationsTitle, themedStyles.text]}>
                  {t('analytics.recommendations')}
                </Text>
              </View>
              {healthScore.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={styles.recommendationBullet}>•</Text>
                  <Text style={[styles.recommendationText, themedStyles.text]}>
                    {translateRecommendation(rec)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Improvement Tips Modal */}
      <Modal
        visible={showImprovementTips}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImprovementTips(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, themedStyles.card]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIconContainer}>
                  <HelpCircle size={24} color="#03A9F4" />
                </View>
                <View>
                  <Text style={[styles.modalTitle, themedStyles.text]}>
                    {t('analytics.improveFinancialHealth')}
                  </Text>
                  {healthScore && (
                    <Text style={[styles.modalSubtitle, themedStyles.textMuted]}>
                      {t('analytics.currentGrade')} {healthScore.grade}
                    </Text>
                  )}
                </View>
              </View>
              <Pressable onPress={() => setShowImprovementTips(false)}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Areas to Focus */}
              <Text style={[styles.modalSectionTitle, themedStyles.text]}>
                {t('analytics.keyAreasToFocusOn')}
              </Text>
              {healthScore?.factors
                .filter((factor) => factor.status === 'needs_improvement')
                .map((factor, index) => (
                  <View key={index} style={styles.focusAreaCard}>
                    <View style={styles.focusAreaHeader}>
                      <Text style={styles.focusAreaName}>
                        {translateFactorName(factor.name)}
                      </Text>
                      <Text style={styles.focusAreaScore}>
                        {factor.score.toFixed(1)}/{factor.max} {t('analytics.points')}
                      </Text>
                    </View>
                    <Text style={styles.focusAreaValue}>
                      {t('analytics.current')} {factor.value}
                    </Text>
                  </View>
                ))}

              {/* Quick Wins */}
              <View style={styles.quickWinsCard}>
                <View style={styles.quickWinsHeader}>
                  <TrendingUp size={20} color="#4CAF50" />
                  <Text style={styles.quickWinsTitle}>
                    {t('analytics.quickWinsToImproveScore')}
                  </Text>
                </View>
                <View style={styles.quickWinsList}>
                  <Text style={styles.quickWinItem}>✓ {t('analytics.actionTrack')}</Text>
                  <Text style={styles.quickWinItem}>✓ {t('analytics.actionReview')}</Text>
                  <Text style={styles.quickWinItem}>✓ {t('analytics.actionGoal')}</Text>
                  <Text style={styles.quickWinItem}>✓ {t('analytics.actionEmergency')}</Text>
                  <Text style={styles.quickWinItem}>✓ {t('analytics.actionBudget')}</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.modalButton}
                onPress={() => setShowImprovementTips(false)}
              >
                <Text style={styles.modalButtonText}>{t('analytics.gotIt')}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...textStyles.body,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    ...textStyles.h3,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#03A9F4',
  },
  tabText: {
    ...textStyles.bodySmall,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#03A9F4',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabContent: {
    paddingTop: 16,
  },
  sectionTitle: {
    ...textStyles.h3,
    marginBottom: 16,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...textStyles.body,
    marginTop: 12,
    textAlign: 'center',
  },
  // Insights
  insightCard: {
    flexDirection: 'row',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightIcon: {
    marginRight: 12,
    paddingTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...textStyles.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightMessage: {
    ...textStyles.bodySmall,
    lineHeight: 20,
  },
  // Categories
  categoryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    ...textStyles.h2,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...textStyles.body,
    fontWeight: '600',
  },
  categoryCount: {
    ...textStyles.caption,
    marginTop: 2,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryTotal: {
    ...textStyles.body,
    fontWeight: '700',
  },
  categoryPercentage: {
    ...textStyles.caption,
    marginTop: 2,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Trends
  trendCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendLabel: {
    ...textStyles.h3,
    fontWeight: '600',
  },
  trendSavingsRate: {
    ...textStyles.bodySmall,
    fontWeight: '500',
  },
  trendDetails: {
    gap: 8,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendRowNet: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: 4,
  },
  trendRowLabel: {
    ...textStyles.bodySmall,
  },
  trendRowValue: {
    ...textStyles.body,
    fontWeight: '500',
  },
  // Health Score
  healthScoreCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#90CAF9',
  },
  healthScoreValue: {
    ...textStyles.display,
    fontWeight: 'bold',
    color: '#03A9F4',
    marginBottom: 4,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  healthGrade: {
    ...textStyles.h2,
    fontWeight: '600',
    color: '#1976D2',
  },
  infoButton: {
    padding: 4,
  },
  healthScoreLabel: {
    ...textStyles.bodySmall,
    color: '#5C6BC0',
    marginTop: 4,
  },
  // Factor Cards
  factorCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  factorName: {
    ...textStyles.body,
    fontWeight: '600',
  },
  factorValue: {
    ...textStyles.bodySmall,
    marginTop: 4,
  },
  factorRight: {
    alignItems: 'flex-end',
  },
  factorScore: {
    ...textStyles.h3,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    ...textStyles.labelSmall,
    fontWeight: '500',
  },
  // Recommendations
  recommendationsCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recommendationsTitle: {
    ...textStyles.h3,
    fontWeight: '600',
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  recommendationBullet: {
    color: '#03A9F4',
    marginRight: 8,
    ...textStyles.bodySmall,
  },
  recommendationText: {
    ...textStyles.bodySmall,
    flex: 1,
    lineHeight: 20,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalIconContainer: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 8,
  },
  modalTitle: {
    ...textStyles.h3,
    fontWeight: '700',
  },
  modalSubtitle: {
    ...textStyles.caption,
    marginTop: 2,
  },
  modalBody: {
    padding: 20,
  },
  modalSectionTitle: {
    ...textStyles.h3,
    fontWeight: '600',
    marginBottom: 12,
  },
  focusAreaCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  focusAreaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  focusAreaName: {
    ...textStyles.bodySmall,
    fontWeight: '600',
    color: '#E65100',
  },
  focusAreaScore: {
    ...textStyles.caption,
    color: '#757575',
  },
  focusAreaValue: {
    ...textStyles.caption,
    color: '#424242',
  },
  quickWinsCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  quickWinsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  quickWinsTitle: {
    ...textStyles.bodySmall,
    fontWeight: '600',
    color: '#2E7D32',
  },
  quickWinsList: {
    gap: 8,
  },
  quickWinItem: {
    ...textStyles.caption,
    color: '#388E3C',
    lineHeight: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  modalButton: {
    backgroundColor: '#03A9F4',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    ...textStyles.button,
    fontWeight: '600',
    color: '#fff',
  },
});
