import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertTriangle,
  BarChart,
  Activity,
  Award,
} from 'lucide-react-native';
import { LineChart, PieChart, BarChart as RNBarChart } from 'react-native-chart-kit';
import { analyticsService, Insight, CategoryBreakdownItem, SpendingTrend, HealthScore } from '../api/services/analytics';
import { translateCategoryName } from '../utils/categoryTranslator';
import { CategoryIcon } from './CategoryIcon';
import { useTheme } from '../contexts/ThemeContext';
import { fonts, textStyles } from '../constants/fonts';

export default function Analytics() {
  const { t } = useTranslation('common');
  const { width, height } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [spendingTrends, setSpendingTrends] = useState<SpendingTrend[]>([]);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'categories' | 'trends' | 'health'>('insights');

  // Responsive sizing
  const chartWidth = width - 48; // Account for padding
  const chartHeight = Math.min(220, height * 0.25); // Max 220 or 25% of screen height

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [insightsData, categoryData, trendsData, healthData] = await Promise.all([
        analyticsService.getInsights(),
        analyticsService.getCategoryBreakdown({ months: 1, type: 'expense' }),
        analyticsService.getSpendingTrends({ period: 'monthly', months: 6 }),
        analyticsService.getHealthScore(),
      ]);

      setInsights(insightsData.insights);
      setCategoryBreakdown(categoryData.breakdown);
      setSpendingTrends(trendsData.trends);
      setHealthScore(healthData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (icon: string, sentiment: string) => {
    const iconSize = 24;
    const iconColor = sentiment === 'positive' ? '#4CAF50' : sentiment === 'negative' ? '#2196F3' : '#2196F3';
    
    switch (icon) {
      case 'piggy-bank': return <PiggyBank size={iconSize} color={iconColor} />;
      case 'trending-up': return <TrendingUp size={iconSize} color={iconColor} />;
      case 'trending-down': return <TrendingDown size={iconSize} color={iconColor} />;
      case 'bar-chart': return <BarChart size={iconSize} color={iconColor} />;
      case 'alert-triangle': return <AlertTriangle size={iconSize} color={iconColor} />;
      case 'activity': return <Activity size={iconSize} color={iconColor} />;
      default: return <BarChart size={iconSize} color={iconColor} />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    if (isDark) {
      switch (sentiment) {
        case 'positive': return { bg: 'rgba(76, 175, 80, 0.15)', border: 'rgba(76, 175, 80, 0.3)', text: colors.success };
        case 'negative': return { bg: 'rgba(3, 169, 244, 0.15)', border: 'rgba(3, 169, 244, 0.3)', text: colors.primary };
        default: return { bg: 'rgba(3, 169, 244, 0.15)', border: 'rgba(3, 169, 244, 0.3)', text: colors.primary };
      }
    } else {
    switch (sentiment) {
      case 'positive': return { bg: '#E8F5E9', border: '#C8E6C9', text: '#2E7D32' };
      case 'negative': return { bg: '#E3F2FD', border: '#BBDEFB', text: '#1565C0' };
      default: return { bg: '#E3F2FD', border: '#BBDEFB', text: '#1565C0' };
      }
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
    const savingsRateMatch = message.match(/You're saving ([\d.]+)% of your income this month\./i);
    if (savingsRateMatch) {
      return t('analytics.insightSavingPercentage', { percentage: savingsRateMatch[1] });
    }
    
    const spendingTrendMatch = message.match(/You've spent ([\d.]+)% less compared to last month\./i);
    if (spendingTrendMatch) {
      return t('analytics.insightSpendingLess', { percentage: spendingTrendMatch[1] });
    }
    
    const spendingMoreMatch = message.match(/You've spent ([\d.]+)% more compared to last month\./i);
    if (spendingMoreMatch) {
      return t('analytics.insightSpendingMore', { percentage: spendingMoreMatch[1] });
    }
    
    const spendingPaceMatch = message.match(/At your current pace, you'll spend \$?([\d,]+\.?\d*) this month\./i);
    if (spendingPaceMatch) {
      return t('analytics.insightSpendingPace', { amount: spendingPaceMatch[1] });
    }
    
    const emergencyFundMatch = message.match(/Great job! Your emergency fund covers ([\d.]+) months? of expenses\./i);
    if (emergencyFundMatch) {
      return t('analytics.insightEmergencyFund', { months: emergencyFundMatch[1] });
    }
    
    const topCategoryMatch = message.match(/(.+?) is your biggest expense at ([\d.]+)% of total spending\./i);
    if (topCategoryMatch) {
      const categoryName = topCategoryMatch[1];
      const translatedCategory = translateCategoryName(categoryName, t);
      return t('analytics.insightTopCategory', { category: translatedCategory, percentage: topCategoryMatch[2] });
    }
    
    return message;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {['insights', 'categories', 'trends', 'health'].map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && [styles.tabActive, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, { color: colors.mutedForeground }, activeTab === tab && [styles.tabTextActive, { color: colors.primary }]]}>
              {t(`analytics.${tab}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('analytics.smartInsights')}</Text>
            {insights.length > 0 ? (
              insights.map((insight, index) => {
                const sentimentColors = getSentimentColor(insight.sentiment);
                return (
                  <View
                    key={index}
                    style={[
                      styles.insightCard,
                      {
                        backgroundColor: sentimentColors.bg,
                        borderColor: sentimentColors.border,
                      },
                    ]}
                  >
                    <View style={styles.insightHeader}>
                      {getInsightIcon(insight.icon, insight.sentiment)}
                      <View style={styles.insightContent}>
                        <Text style={[styles.insightTitle, { color: sentimentColors.text }]}>
                          {translateInsightTitle(insight.title)}
                        </Text>
                        <Text style={[styles.insightMessage, { color: isDark ? colors.mutedForeground : sentimentColors.text }]}>
                          {translateInsightMessage(insight.message)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
                  {t('analytics.noInsights') || 'No insights available. Start adding transactions to see smart insights.'}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('analytics.spendingByCategory')}</Text>
            {categoryBreakdown.length > 0 ? (
              <>
                <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.chartTitle, { color: colors.foreground }]}>{t('analytics.categoryDistribution')}</Text>
                  <PieChart
                    data={categoryBreakdown.map(item => ({
                      name: translateCategoryName(item.category, t),
                      value: item.total,
                      color: item.color,
                      legendFontColor: isDark ? colors.foreground : '#333',
                      legendFontSize: 12,
                    }))}
                    width={chartWidth}
                    height={chartHeight}
                    chartConfig={{
                      backgroundColor: colors.card,
                      backgroundGradientFrom: colors.card,
                      backgroundGradientTo: colors.card,
                      decimalPlaces: 0,
                      color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                      labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor="value"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    style={styles.chart}
                  />
                </View>
                <View style={styles.categoryList}>
                  {categoryBreakdown.map((item, index) => (
                    <View key={index} style={[styles.categoryItem, { backgroundColor: colors.card }]}>
                      <View style={styles.categoryItemLeft}>
                        <View
                          style={[
                            styles.categoryIconContainer,
                            { backgroundColor: `${item.color}20` },
                          ]}
                        >
                          <CategoryIcon iconName={item.icon} size={20} color={item.color} />
                        </View>
                        <View style={styles.categoryItemInfo}>
                          <Text style={[styles.categoryItemName, { color: colors.foreground }]}>
                            {translateCategoryName(item.category, t)}
                          </Text>
                          <Text style={[styles.categoryItemCount, { color: colors.mutedForeground }]}>
                            {item.count} {t('analytics.transactions')}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.categoryItemRight}>
                        <Text style={[styles.categoryItemAmount, { color: colors.foreground }]}>
                          {item.total.toLocaleString()}
                        </Text>
                        <Text style={[styles.categoryItemPercentage, { color: colors.mutedForeground }]}>
                          {item.percentage.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>{t('reports.noSpendingData')}</Text>
              </View>
            )}
          </>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('analytics.spendingTrends')}</Text>
            {spendingTrends.length > 0 ? (
              <>
                <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.chartTitle, { color: colors.foreground }]}>{t('analytics.incomeVsExpenses')}</Text>
                  <LineChart
                    data={{
                      labels: spendingTrends.map(t => t.label),
                      datasets: [
                        {
                          data: spendingTrends.map(t => t.income),
                          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                          strokeWidth: 2,
                        },
                        {
                          data: spendingTrends.map(t => t.expense),
                          color: (opacity = 1) => `rgba(255, 82, 82, ${opacity})`,
                          strokeWidth: 2,
                        },
                        {
                          data: spendingTrends.map(t => t.net),
                          color: (opacity = 1) => `rgba(3, 169, 244, ${opacity})`,
                          strokeWidth: 2,
                        },
                      ],
                    }}
                    width={chartWidth}
                    height={chartHeight}
                    chartConfig={{
                      backgroundColor: colors.card,
                      backgroundGradientFrom: colors.card,
                      backgroundGradientTo: colors.card,
                      decimalPlaces: 0,
                      color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                      labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                      style: {
                        borderRadius: 16,
                      },
                      propsForDots: {
                        r: '4',
                        strokeWidth: '2',
                        stroke: colors.primary,
                      },
                      propsForBackgroundLines: {
                        strokeDasharray: '3, 3',
                        stroke: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0',
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                </View>
                <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.chartTitle, { color: colors.foreground }]}>{t('analytics.savingsRateOverTime')}</Text>
                  <RNBarChart
                    data={{
                      labels: spendingTrends.map(t => t.label),
                      datasets: [
                        {
                          data: spendingTrends.map(t => (t.savingsRate || t.savings_rate || 0)),
                        },
                      ],
                    }}
                    width={width - 64}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix="%"
                    chartConfig={{
                      backgroundColor: colors.card,
                      backgroundGradientFrom: colors.card,
                      backgroundGradientTo: colors.card,
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                      labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                      propsForBackgroundLines: {
                        strokeDasharray: '3, 3',
                        stroke: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0',
                      },
                    }}
                    style={styles.chart}
                  />
                </View>
                <View style={styles.trendsList}>
                  {spendingTrends.map((trend, index) => {
                    const savingsRate = (trend.savingsRate || trend.savings_rate || 0);
                    return (
                      <View key={index} style={[styles.trendItem, { backgroundColor: colors.card }]}>
                        <View style={styles.trendItemHeader}>
                          <Text style={[styles.trendLabel, { color: colors.foreground }]}>{trend.label}</Text>
                          <Text style={[styles.trendSavingsRate, { color: colors.success }]}>
                            {savingsRate.toFixed(1)}% {t('analytics.saved')}
                          </Text>
                        </View>
                      <View style={styles.trendValues}>
                          <View style={styles.trendValueRow}>
                            <Text style={[styles.trendValueLabel, { color: colors.foreground }]}>
                              {t('dashboard.income')}
                            </Text>
                            <Text style={[styles.trendValueAmount, { color: colors.success }]}>
                              {trend.income.toLocaleString()}
                            </Text>
                          </View>
                          <View style={styles.trendValueRow}>
                            <Text style={[styles.trendValueLabel, { color: colors.foreground }]}>
                              {t('dashboard.expenses')}
                        </Text>
                            <Text style={[styles.trendValueAmount, { color: colors.destructive }]}>
                              {trend.expense.toLocaleString()}
                        </Text>
                          </View>
                          <View style={[styles.trendValueDivider, { backgroundColor: colors.border }]} />
                          <View style={styles.trendValueRow}>
                            <Text style={[styles.trendValueLabel, { color: colors.foreground }]}>
                              {t('analytics.net')}
                        </Text>
                            <Text style={[styles.trendValueAmount, { color: colors.success }]}>
                              {trend.net.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>{t('reports.noSpendingData')}</Text>
              </View>
            )}
          </>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && healthScore && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('analytics.financialHealthScore')}</Text>
            <View style={[styles.healthScoreCard, { 
              backgroundColor: isDark ? '#1a1a2e' : colors.card,
            }]}>
              <View style={styles.healthScoreHeader}>
                <Award size={48} color={colors.primary} strokeWidth={1.5} />
                <Text style={[styles.healthScoreValue, { color: colors.foreground }]}>
                  {healthScore.score.toFixed(1)}/
                </Text>
                <Text style={[styles.healthScoreGrade, { color: colors.primary }]}>
                  {t('analytics.grade')} {healthScore.grade}
                </Text>
                <Text style={[styles.healthScoreLabel, { color: colors.mutedForeground }]}>
                  {t('analytics.financialHealthScore')}
                </Text>
              </View>
            </View>
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.foreground }]}>{t('analytics.scoreBreakdown')}</Text>
              <RNBarChart
                data={{
                  labels: healthScore.factors.map(f => translateFactorName(f.name).substring(0, 10)),
                  datasets: [
                    {
                      data: healthScore.factors.map(f => f.score),
                      colors: healthScore.factors.map(f => {
                        if (f.status === 'needs_improvement') {
                          return (opacity = 1) => `rgba(255, 152, 0, ${opacity})`; // Orange
                        }
                        return (opacity = 1) => `rgba(76, 175, 80, ${opacity})`; // Green
                      }),
                    },
                  ],
                }}
                width={width - 64}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: colors.card,
                  backgroundGradientFrom: colors.card,
                  backgroundGradientTo: colors.card,
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Default green
                  labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                  propsForBackgroundLines: {
                    strokeDasharray: '3, 3',
                    stroke: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0',
                  },
                }}
                style={styles.chart}
                withHorizontalLabels={true}
                withVerticalLabels={true}
                fromZero={true}
                showValuesOnTopOfBars={false}
              />
            </View>
            <View style={styles.factorsList}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 16 }]}>{t('analytics.scoreBreakdown')}</Text>
              {healthScore.factors.map((factor, index) => {
                const statusColors = isDark ? {
                  excellent: { bg: colors.card, badge: 'rgba(76, 175, 80, 0.2)', text: colors.success, progress: colors.success },
                  good: { bg: colors.card, badge: 'rgba(255, 193, 7, 0.2)', text: colors.warning, progress: colors.warning },
                  needs_improvement: { bg: colors.card, badge: 'rgba(255, 152, 0, 0.2)', text: '#FF9800', progress: '#FF9800' },
                } : {
                  excellent: { bg: '#E8F5E9', badge: '#4CAF50', text: '#2E7D32', progress: '#4CAF50' },
                  good: { bg: '#FFF3E0', badge: '#FF9800', text: '#F57C00', progress: '#FF9800' },
                  needs_improvement: { bg: '#FFEBEE', badge: '#FF5252', text: '#C62828', progress: '#FF5252' },
                };
                const factorColors = statusColors[factor.status] || statusColors.needs_improvement;
                const progressPercentage = (factor.score / factor.max) * 100;
                const statusLabel = factor.status === 'excellent' ? t('analytics.statusExcellent') || 'Excellent' :
                                  factor.status === 'good' ? t('analytics.statusGood') || 'Good' :
                                  t('analytics.statusNeedsImprovement') || 'Needs Improvement';
                return (
                  <View key={index} style={[styles.factorItem, { backgroundColor: factorColors.bg }]}>
                    <View style={styles.factorItemContent}>
                      <View style={styles.factorItemLeft}>
                        <Text style={[styles.factorName, { color: colors.foreground }]}>
                      {translateFactorName(factor.name)}
                    </Text>
                        <Text style={[styles.factorValue, { color: colors.mutedForeground }]}>
                          {factor.value}
                        </Text>
                      </View>
                      <View style={styles.factorItemRight}>
                        <Text style={[styles.factorScore, { color: colors.foreground }]}>
                          {factor.score.toFixed(1)}/{factor.max}
                    </Text>
                        <View style={[styles.factorBadge, { backgroundColor: factorColors.badge }]}>
                          <Text style={[styles.factorBadgeText, { color: factorColors.text }]}>
                            {statusLabel}
                    </Text>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.factorProgressBar, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0' }]}>
                      <View
                        style={[
                          styles.factorProgressFill,
                          {
                            width: `${Math.min(progressPercentage, 100)}%`,
                            backgroundColor: factorColors.progress,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
            {healthScore.recommendations.length > 0 && (
              <View style={[styles.recommendationsCard, { 
                backgroundColor: isDark ? 'rgba(3, 169, 244, 0.15)' : '#E3F2FD',
                borderColor: isDark ? 'rgba(3, 169, 244, 0.3)' : '#BBDEFB',
              }]}>
                <View style={styles.recommendationsHeader}>
                  <AlertTriangle size={20} color={colors.primary} />
                  <Text style={[styles.recommendationsTitle, { color: colors.foreground }]}>{t('analytics.recommendations')}</Text>
                </View>
                {healthScore.recommendations.map((rec, index) => (
                  <Text key={index} style={[styles.recommendationItem, { color: colors.foreground }]}>
                    • {rec}
                  </Text>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    ...textStyles.body,
    color: '#666',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    ...textStyles.body,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 120, // extra space so last tile isn't hidden behind bottom tab bar
  },
  sectionTitle: {
    ...textStyles.h2,
    color: '#1a1a1a',
    marginBottom: 16,
    marginTop: 0,
  },
  insightCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    maxWidth: '100%',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightContent: {
    flex: 1,
    flexShrink: 1,
  },
  insightTitle: {
    ...textStyles.h3,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  insightMessage: {
    ...textStyles.body,
    flexWrap: 'wrap',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  chartTitle: {
    ...textStyles.h2,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
  },
  categoryList: {
    marginTop: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    maxWidth: '100%',
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryItemInfo: {
    flex: 1,
  },
  categoryItemName: {
    ...textStyles.h4,
    color: '#333',
    marginBottom: 4,
  },
  categoryItemCount: {
    ...textStyles.caption,
    color: '#666',
  },
  categoryItemRight: {
    alignItems: 'flex-end',
  },
  categoryItemAmount: {
    ...textStyles.h4,
    color: '#333',
    marginBottom: 4,
  },
  categoryItemPercentage: {
    ...textStyles.caption,
    color: '#666',
  },
  trendsList: {
    marginTop: 8,
  },
  trendItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  trendItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendLabel: {
    ...textStyles.h3,
    color: '#333',
  },
  trendValues: {
    gap: 12,
  },
  trendValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendValueLabel: {
    ...textStyles.bodySmall,
    color: '#333',
  },
  trendValueAmount: {
    ...textStyles.monoMedium,
    fontWeight: '600',
  },
  trendValueDivider: {
    height: 1,
    marginVertical: 4,
  },
  trendValue: {
    ...textStyles.bodySmall,
    color: '#666',
  },
  trendNet: {
    fontWeight: '600',
    color: '#03A9F4',
  },
  trendSavingsRate: {
    ...textStyles.bodySmall,
    fontWeight: '600',
  },
  healthScoreCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  healthScoreHeader: {
    alignItems: 'center',
    width: '100%',
  },
  healthScoreValue: {
    ...textStyles.h2,
    fontWeight: 'bold',
    marginTop: 12,
    fontFamily: fonts.mono,
  },
  healthScoreGrade: {
    ...textStyles.h2,
    fontWeight: '600',
    marginTop: 8,
  },
  healthScoreLabel: {
    ...textStyles.bodySmall,
    marginTop: 8,
  },
  factorsList: {
    marginTop: 8,
  },
  factorItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  factorItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  factorItemLeft: {
    flex: 1,
  },
  factorItemRight: {
    alignItems: 'flex-end',
  },
  factorName: {
    ...textStyles.h3,
    fontWeight: '600',
    marginBottom: 4,
  },
  factorScore: {
    ...textStyles.h3,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: fonts.mono,
  },
  factorValue: {
    ...textStyles.bodySmall,
    marginTop: 4,
  },
  factorBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  factorBadgeText: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  factorProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  factorProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  recommendationsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recommendationsTitle: {
    ...textStyles.h3,
    fontWeight: 'bold',
  },
  recommendationItem: {
    ...textStyles.bodySmall,
    marginBottom: 8,
    lineHeight: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    ...textStyles.body,
    color: '#999',
    textAlign: 'center',
  },
});

