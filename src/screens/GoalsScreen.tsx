import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
  useWindowDimensions,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { fonts, textStyles, createResponsiveTextStyles } from '../constants/fonts';
import {
  Target,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowLeft,
  X,
} from 'lucide-react-native';
import { goalsApi, SavingsGoal } from '../api/services/goals';
import { authService } from '../api/services/auth';
import { useTheme } from '../contexts/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

interface GoalsScreenProps {
  onBack?: () => void;
}

export default function GoalsScreen({ onBack }: GoalsScreenProps) {
  const { t } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currency, setCurrency] = useState('USD');
  
  // Form state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [creating, setCreating] = useState(false);

  // Responsive styles
  const responsiveTextStyles = createResponsiveTextStyles(width);
  


  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Get user currency
      const userData = await authService.getCurrentUser();
      setCurrency(userData.defaultCurrency || 'USD');
      
      await fetchGoals();
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await goalsApi.getAll();
      const data = Array.isArray(response) ? response : (response as any).data || [];
      setGoals(data);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGoals();
  };

  const handleCreate = async () => {
    if (!name.trim() || !targetAmount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      await goalsApi.create({
        name: name.trim(),
        target_amount: parseFloat(targetAmount),
        target_date: targetDate.toISOString().split('T')[0],
      });
      
      // Reset form
      setName('');
      setTargetAmount('');
      setTargetDate(new Date());
      setShowCreateModal(false);
      
      // Refresh list
      await fetchGoals();
    } catch (error) {
      console.error('Failed to create goal:', error);
      Alert.alert('Error', t('goals.errorCreate'));
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateProgress = async (goal: SavingsGoal) => {
    // For iOS, use Alert.prompt. For Android, we need a different approach
    if (Platform.OS === 'ios') {
      Alert.prompt(
        t('goals.updateProgress'),
        `${t('goals.enterNewAmount')} "${goal.name}" (current: ${currency}${goal.current_amount}):`,
        [
          { text: t('addTransaction.cancel'), style: 'cancel' },
          {
            text: t('settings.save'),
            onPress: async (value: string | undefined) => {
              if (value) {
                try {
                  await goalsApi.update(goal.id, { current_amount: parseFloat(value) });
                  await fetchGoals();
                } catch (error) {
                  console.error('Failed to update goal:', error);
                  Alert.alert('Error', t('goals.errorUpdate'));
                }
              }
            },
          },
        ],
        'plain-text',
        String(goal.current_amount),
        'decimal-pad'
      );
    } else {
      // For Android, show a simple alert with instructions
      Alert.alert(
        t('goals.updateProgress'),
        `Current amount: ${currency}${goal.current_amount}\n\nTo update, edit the goal and enter the new amount.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleStatusChange = async (goalId: number, status: 'active' | 'completed' | 'cancelled') => {
    try {
      await goalsApi.update(goalId, { status });
      await fetchGoals();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      t('goals.deleteGoal'),
      t('goals.confirmDelete'),
      [
        { text: t('addTransaction.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await goalsApi.delete(id);
              await fetchGoals();
            } catch (error) {
              console.error('Failed to delete goal:', error);
              Alert.alert('Error', t('goals.errorDelete'));
            }
          },
        },
      ]
    );
  };

  const getProgress = (goal: SavingsGoal) => {
    if (goal.target_amount === 0) return 0;
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const getDaysRemaining = (targetDateStr: string) => {
    const today = new Date();
    const target = new Date(targetDateStr);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getProgressColor = (progress: number, status: string) => {
    if (status === 'completed') return '#4CAF50';
    if (progress >= 75) return '#9C27B0';
    if (progress >= 50) return '#03A9F4';
    if (progress >= 25) return '#FFC107';
    return '#FF9800';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);

  const themedStyles = {
    container: { backgroundColor: colors.background },
    card: { backgroundColor: colors.card },
    text: { color: colors.foreground },
    textMuted: { color: colors.mutedForeground },
    border: { borderColor: colors.border },
  };

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
            <Target size={28} color="#9C27B0" />
            <Text style={[styles.headerTitle, themedStyles.text, responsiveTextStyles.h3]}>
              {t('goals.title')}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => setShowCreateModal(true)}
          style={styles.addButton}
        >
          <Plus size={24} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: '#E3F2FD' }]}>
            <Text style={[styles.summaryLabel, { color: '#1976D2' }]}>
              {t('goals.activeGoals')}
            </Text>
            <Text style={[styles.summaryValue, { color: '#0D47A1' }, responsiveTextStyles.h3]}>
              {activeGoals.length}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
            <Text style={[styles.summaryLabel, { color: '#388E3C' }]}>
              {t('goals.completed')}
            </Text>
            <Text style={[styles.summaryValue, { color: '#1B5E20' }, responsiveTextStyles.h3]}>
              {completedGoals.length}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#F3E5F5' }]}>
            <Text style={[styles.summaryLabel, { color: '#7B1FA2' }]}>
              {t('goals.totalSaved')}
            </Text>
            <Text style={[styles.summaryValue, { color: '#4A148C' }, responsiveTextStyles.h3]}>
              {currency}{totalSaved.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Goals List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9C27B0" />
            <Text style={[styles.loadingText, themedStyles.textMuted]}>
              {t('goals.loading')}
            </Text>
          </View>
        ) : goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Target size={64} color={colors.mutedForeground} style={{ opacity: 0.3 }} />
            <Text style={[styles.emptyTitle, themedStyles.text]}>
              {t('goals.noGoals')}
            </Text>
            <Text style={[styles.emptySubtitle, themedStyles.textMuted]}>
              {t('goals.noGoalsSubtitle')}
            </Text>
          </View>
        ) : (
          <View style={styles.goalsList}>
            {goals.map((goal) => {
              const progress = getProgress(goal);
              const daysRemaining = getDaysRemaining(goal.target_date);
              const isOverdue = daysRemaining < 0;
              const isCompleted = goal.status === 'completed';
              const isCancelled = goal.status === 'cancelled';

              return (
                <View
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    themedStyles.card,
                    isCompleted && styles.goalCardCompleted,
                    isCancelled && styles.goalCardCancelled,
                  ]}
                >
                  {/* Goal Header */}
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      <View style={styles.goalTitleRow}>
                        <Text style={[styles.goalName, themedStyles.text, responsiveTextStyles.h3]}>
                          {goal.name}
                        </Text>
                        {isCompleted && <CheckCircle size={20} color="#4CAF50" />}
                        {isCancelled && <XCircle size={20} color="#9E9E9E" />}
                      </View>
                      <View style={styles.goalMeta}>
                        <View style={styles.metaItem}>
                          <DollarSign size={14} color={colors.mutedForeground} />
                          <Text style={[styles.goalAmount, themedStyles.textMuted]}>
                            {currency}{goal.current_amount.toLocaleString()} / {currency}{goal.target_amount.toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Calendar size={14} color={colors.mutedForeground} />
                          <Text style={[
                            styles.goalAmount,
                            isOverdue && !isCompleted ? styles.overdueText : themedStyles.textMuted
                          ]}>
                            {isOverdue && !isCompleted
                              ? `${Math.abs(daysRemaining)} ${t('goals.daysOverdue')}`
                              : `${daysRemaining} ${t('goals.daysRemaining')}`
                            }
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => handleDelete(goal.id)}
                      style={styles.deleteButton}
                    >
                      <Trash2 size={20} color="#FF5252" />
                    </Pressable>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={[styles.progressLabel, themedStyles.textMuted]}>
                        {t('goals.progress')}
                      </Text>
                      <Text style={[styles.progressPercentage, { color: getProgressColor(progress, goal.status) }]}>
                        {progress.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={[styles.progressBarBg, themedStyles.border]}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { 
                            width: `${progress}%`,
                            backgroundColor: getProgressColor(progress, goal.status),
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.goalActions}>
                    {goal.status === 'active' && (
                      <>
                        <Pressable
                          onPress={() => handleUpdateProgress(goal)}
                          style={[styles.actionButton, styles.actionButtonPrimary]}
                        >
                          <TrendingUp size={16} color="#fff" />
                          <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                            {t('goals.updateProgress')}
                          </Text>
                        </Pressable>
                        {progress >= 100 && (
                          <Pressable
                            onPress={() => handleStatusChange(goal.id, 'completed')}
                            style={[styles.actionButton, styles.actionButtonSuccess]}
                          >
                            <CheckCircle size={16} color="#fff" />
                            <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                              {t('goals.markComplete')}
                            </Text>
                          </Pressable>
                        )}
                        <Pressable
                          onPress={() => handleStatusChange(goal.id, 'cancelled')}
                          style={[styles.actionButton, styles.actionButtonSecondary]}
                        >
                          <XCircle size={16} color="#9E9E9E" />
                          <Text style={[styles.actionButtonText, { color: '#9E9E9E' }]}>
                            {t('addTransaction.cancel')}
                          </Text>
                        </Pressable>
                      </>
                    )}
                    {goal.status !== 'active' && (
                      <Pressable
                        onPress={() => handleStatusChange(goal.id, 'active')}
                        style={[styles.actionButton, styles.actionButtonPrimary]}
                      >
                        <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                          {t('goals.reactivate')}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Goal Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, themedStyles.card]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Plus size={24} color="#9C27B0" />
                <Text style={[styles.modalTitle, themedStyles.text]}>
                  {t('goals.createTitle')}
                </Text>
              </View>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, themedStyles.text]}>
                {t('goals.goalName')}
              </Text>
              <TextInput
                style={[styles.formInput, themedStyles.card, themedStyles.border, themedStyles.text]}
                value={name}
                onChangeText={setName}
                placeholder={t('goals.goalNamePlaceholder')}
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, themedStyles.text]}>
                {t('goals.targetAmount')} ({currency})
              </Text>
              <TextInput
                style={[styles.formInput, themedStyles.card, themedStyles.border, themedStyles.text]}
                value={targetAmount}
                onChangeText={setTargetAmount}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, themedStyles.text]}>
                {t('goals.targetDate')}
              </Text>
              <Pressable
                style={[styles.formInput, themedStyles.card, themedStyles.border]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={themedStyles.text}>{formatDate(targetDate.toISOString())}</Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={targetDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setTargetDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSecondary, themedStyles.border]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={themedStyles.text}>{t('addTransaction.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleCreate}
                disabled={creating}
              >
                <Text style={styles.modalButtonPrimaryText}>
                  {creating ? t('goals.creating') : t('goals.createGoal')}
                </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addButton: {
    backgroundColor: '#9C27B0',
    borderRadius: 12,
    padding: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
  },
  summaryLabel: {
    ...textStyles.caption,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    ...textStyles.h3,
    fontWeight: '700',
    fontFamily: fonts.mono,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    ...textStyles.body,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    ...textStyles.h3,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    ...textStyles.body,
    marginTop: 8,
    textAlign: 'center',
  },
  goalsList: {
    gap: 16,
  },
  goalCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E1BEE7',
  },
  goalCardCompleted: {
    borderColor: '#A5D6A7',
    backgroundColor: '#E8F5E9',
  },
  goalCardCancelled: {
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  goalName: {
    ...textStyles.h3,
    fontWeight: '700',
  },
  goalMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goalAmount: {
    ...textStyles.caption,
  },
  overdueText: {
    color: '#FF5252',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    ...textStyles.caption,
    fontWeight: '500',
  },
  progressPercentage: {
    ...textStyles.labelSmall,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionButtonPrimary: {
    backgroundColor: '#03A9F4',
  },
  actionButtonSuccess: {
    backgroundColor: '#4CAF50',
  },
  actionButtonSecondary: {
    backgroundColor: '#F5F5F5',
  },
  actionButtonText: {
    ...textStyles.button,
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    ...textStyles.h3,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    ...textStyles.label,
    fontWeight: '500',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    ...textStyles.body,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    borderWidth: 1,
  },
  modalButtonPrimary: {
    backgroundColor: '#9C27B0',
  },
  modalButtonPrimaryText: {
    color: '#fff',
    ...textStyles.button,
    fontWeight: '600',
  },
});
