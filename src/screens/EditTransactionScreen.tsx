import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { fonts, textStyles, createResponsiveTextStyles } from '../constants/fonts';
import { useTranslation } from 'react-i18next';
import {
  DollarSign,
  CreditCard,
  X,
  Calendar,
  ChevronDown,
  Trash2,
} from 'lucide-react-native';
import { transactionsService } from '../api/services/transactions';
import { categoriesService, Category } from '../api/services/categories';
import { currenciesService } from '../api/services/currencies';
import { Transaction } from '../api/types/transaction';
import { Card, Button, Input, Modal } from '../components/ui';
import { getEmojiFromIcon } from '../utils/iconMapper';
import { useTheme } from '../contexts/ThemeContext';

interface EditTransactionScreenProps {
  transaction: Transaction;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EditTransactionScreen({
  transaction,
  onSuccess,
  onCancel,
}: EditTransactionScreenProps) {
  const { t } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const responsiveTextStyles = createResponsiveTextStyles(width);

  const [transactionType, setTransactionType] = useState<'income' | 'expense'>(
    transaction.type
  );
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [category, setCategory] = useState(transaction.category);
  const [currency, setCurrency] = useState(transaction.currency);
  const [description, setDescription] = useState(transaction.notes || '');
  const [date, setDate] = useState(transaction.date);
  const [notes, setNotes] = useState(transaction.notes || '');
  const [isRecurring, setIsRecurring] = useState(transaction.is_recurring || false);
  const [frequency, setFrequency] = useState(
    transaction.recurring_frequency || 'monthly'
  );
  const [reminderDays, setReminderDays] = useState(
    (transaction.reminder_days || 1).toString()
  );

  // Data loading
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<
    Array<{ code: string; symbol: string; flag: string; name: string }>
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Responsive scaling
  const scale = Math.min(width / 375, 1);
  const isSmallScreen = width < 375;

  // Load currencies
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        setLoadingCurrencies(true);
        const currenciesData = await currenciesService.getCurrencies();
        if (currenciesData.length > 0) {
          setCurrencies(currenciesData);
        }
      } catch (error) {
        console.error('Error loading currencies:', error);
      } finally {
        setLoadingCurrencies(false);
      }
    };
    loadCurrencies();
  }, []);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await categoriesService.getCategories();
        const allCategories =
          response.all || [...(response.system || []), ...(response.custom || [])];
        setCategories(allCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  // Filter categories by transaction type
  const filteredCategories = categories.filter((cat) => {
    if (transactionType === 'income') {
      return cat.type === 'income' || cat.type === 'both';
    } else {
      return cat.type === 'expense' || cat.type === 'both';
    }
  });

  // Reset category when type changes
  useEffect(() => {
    if (
      category &&
      !filteredCategories.find((c) => c.name === category)
    ) {
      setCategory('');
    }
  }, [transactionType, filteredCategories]);

  const handleSubmit = async () => {
    if (!amount || !category || !description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await transactionsService.updateTransaction(transaction.id, {
        type: transactionType,
        amount: parseFloat(amount),
        category,
        currency,
        date,
        notes: description || notes,
        is_recurring: isRecurring,
        recurring_frequency: isRecurring ? frequency : undefined,
        reminder_days: isRecurring ? parseInt(reminderDays) : undefined,
      });

      Alert.alert('Success', 'Transaction updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            if (onSuccess) {
              onSuccess();
            }
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to update transaction'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await transactionsService.deleteTransaction(transaction.id);
              Alert.alert('Success', 'Transaction deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => {
                    if (onSuccess) {
                      onSuccess();
                    }
                  },
                },
              ]);
            } catch (error: any) {
              console.error('Error deleting transaction:', error);
              Alert.alert(
                'Error',
                error?.response?.data?.message || 'Failed to delete transaction'
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const selectedCategory = categories.find((c) => c.name === category);
  const selectedCurrency = currencies.find((c) => c.code === currency);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, responsiveTextStyles.h3]}>
          {t('editTransaction.title') || 'Edit Transaction'}
        </Text>
        <Pressable onPress={onCancel} style={styles.closeButton}>
          <X size={24 * scale} color="#666" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Transaction Type */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={styles.label}>
            {t('addTransaction.transactionType')}
          </Text>
          <View style={styles.typeContainer}>
            <Pressable
              style={[
                styles.typeButton,
                transactionType === 'income' && styles.typeButtonActive,
                {
                  borderColor:
                    transactionType === 'income' ? '#4CAF50' : '#E5E7EB',
                },
                {
                  backgroundColor:
                    transactionType === 'income'
                      ? 'rgba(76, 175, 80, 0.1)'
                      : 'transparent',
                },
              ]}
              onPress={() => setTransactionType('income')}
            >
              <DollarSign
                size={20 * scale}
                color={transactionType === 'income' ? '#4CAF50' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  {
                    color: transactionType === 'income' ? '#4CAF50' : '#9CA3AF',
                  },
                ]}
              >
                {t('addTransaction.income')}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.typeButton,
                transactionType === 'expense' && styles.typeButtonActive,
                {
                  borderColor:
                    transactionType === 'expense' ? '#FF5252' : '#E5E7EB',
                },
                {
                  backgroundColor:
                    transactionType === 'expense'
                      ? 'rgba(255, 82, 82, 0.1)'
                      : 'transparent',
                },
              ]}
              onPress={() => setTransactionType('expense')}
            >
              <CreditCard
                size={20 * scale}
                color={transactionType === 'expense' ? '#FF5252' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  {
                    color: transactionType === 'expense' ? '#FF5252' : '#9CA3AF',
                  },
                ]}
              >
                {t('addTransaction.expense')}
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Amount & Currency */}
        <Card style={{ marginBottom: 16 }}>
          <View style={styles.amountRow}>
            <View style={styles.amountInputContainer}>
              <Text style={styles.label}>{t('addTransaction.amount')}</Text>
              <TextInput
                style={[
                  styles.amountInput,
                  responsiveTextStyles.body,
                ]}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.currencyContainer}>
              <Text style={styles.label}>{t('addTransaction.currency')}</Text>
              <Pressable
                style={styles.selectButton}
                onPress={() => setShowCurrencyModal(true)}
                disabled={loadingCurrencies}
              >
                <Text style={styles.selectButtonText}>
                  {loadingCurrencies
                    ? '...'
                    : selectedCurrency?.flag || currency || 'USD'}
                </Text>
                <ChevronDown size={16 * scale} color="#666" />
              </Pressable>
            </View>
          </View>
        </Card>

        {/* Category */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={styles.label}>{t('addTransaction.category')}</Text>
          {loadingCategories ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.foreground }]}>
                {t('addTransaction.loadingCategories')}
              </Text>
            </View>
          ) : filteredCategories.length === 0 ? (
            <Text style={styles.emptyText}>
              {t('addTransaction.noCategoriesAvailable')}
            </Text>
          ) : (
            <Pressable
              style={styles.selectButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <View style={styles.selectedCategoryContainer}>
                {selectedCategory && (
                  <Text style={styles.categoryIcon}>
                    {getEmojiFromIcon(selectedCategory.icon || '')}
                  </Text>
                )}
                <Text style={styles.selectButtonText}>
                  {selectedCategory?.name ||
                    t('addTransaction.selectCategory')}
                </Text>
              </View>
              <ChevronDown size={16 * scale} color="#666" />
            </Pressable>
          )}
        </Card>

        {/* Description & Date */}
        <Card style={{ marginBottom: 16 }}>
          <Input
            label={t('addTransaction.description')}
            placeholder={t('addTransaction.descriptionPlaceholder')}
            value={description}
            onChangeText={setDescription}
            containerStyle={{ marginBottom: 16 }}
          />
          <View>
            <Text style={styles.label}>{t('addTransaction.date')}</Text>
            <Pressable
              style={styles.selectButton}
              onPress={() => setShowDateModal(true)}
            >
              <View style={styles.selectedCategoryContainer}>
                <Calendar size={18 * scale} color="#666" />
                <Text style={styles.selectButtonText}>{date}</Text>
              </View>
              <ChevronDown size={16 * scale} color="#666" />
            </Pressable>
          </View>
        </Card>

        {/* Notes */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={styles.label}>{t('addTransaction.notes')}</Text>
          <TextInput
            style={[styles.notesInput, responsiveTextStyles.body]}
            placeholder={t('addTransaction.notesPlaceholder')}
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </Card>

        {/* Update Button */}
        <Button
          title={
            submitting ? t('common.saving') : t('editTransaction.update') || 'Update'
          }
          onPress={handleSubmit}
          disabled={submitting || !amount || !category || !description}
          loading={submitting}
          fullWidth
          style={{ marginBottom: 12 }}
        />

        {/* Delete Button */}
        <Button
          title={deleting ? t('common.deleting') || 'Deleting...' : t('editTransaction.delete') || 'Delete'}
          onPress={handleDelete}
          disabled={deleting}
          loading={deleting}
          variant="outline"
          fullWidth
          style={StyleSheet.flatten([
            styles.deleteButton,
            { borderColor: '#FF5252' },
          ])}
          textStyle={{ color: '#FF5252' }}
        />
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={t('addTransaction.selectCategory')}
        fullScreen
      >
        <ScrollView>
          <View style={styles.categoryGrid}>
            {filteredCategories.map((cat) => {
              const isSelected = category === cat.name;
              return (
                <Pressable
                  key={cat.id || cat.name}
                  style={[
                    styles.categoryItem,
                    isSelected && styles.categoryItemSelected,
                  ]}
                  onPress={() => {
                    setCategory(cat.name);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.categoryItemIcon}>
                    {getEmojiFromIcon(cat.icon || '')}
                  </Text>
                  <Text
                    style={[
                      styles.categoryItemText,
                      isSelected && styles.categoryItemTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </Modal>

      {/* Currency Selection Modal */}
      <Modal
        visible={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
        title={t('addTransaction.selectCurrency')}
      >
        <ScrollView>
          {currencies.map((curr) => (
            <Pressable
              key={curr.code}
              style={[
                styles.currencyItem,
                currency === curr.code && styles.currencyItemSelected,
              ]}
              onPress={() => {
                setCurrency(curr.code);
                setShowCurrencyModal(false);
              }}
            >
              <Text style={styles.currencyFlag}>{curr.flag}</Text>
              <View style={styles.currencyInfo}>
                <Text style={styles.currencyCode}>{curr.code}</Text>
                <Text style={styles.currencyName}>{curr.name}</Text>
              </View>
              {currency === curr.code && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    ...textStyles.h3,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  label: {
    ...textStyles.label,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  typeButtonActive: {
    // Active styling handled inline
  },
  typeButtonText: {
    ...textStyles.button,
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  amountInputContainer: {
    flex: 2,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    color: '#333',
    fontFamily: fonts.mono,
  },
  currencyContainer: {
    flex: 1,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    marginTop: 8,
  },
  selectButtonText: {
    ...textStyles.body,
    color: '#333',
  },
  selectedCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    ...textStyles.body,
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
  emptyText: {
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
    ...textStyles.body,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    color: '#333',
    marginTop: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  categoryItemSelected: {
    borderColor: '#03A9F4',
    backgroundColor: 'rgba(3, 169, 244, 0.1)',
  },
  categoryItemIcon: {
    ...textStyles.h3,
    marginBottom: 8,
  },
  categoryItemText: {
    ...textStyles.caption,
    color: '#666',
    textAlign: 'center',
  },
  categoryItemTextSelected: {
    color: '#03A9F4',
    fontWeight: '600',
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  currencyItemSelected: {
    borderColor: '#03A9F4',
    backgroundColor: 'rgba(3, 169, 244, 0.1)',
  },
  currencyFlag: {
    ...textStyles.h3,
    marginRight: 12,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    ...textStyles.h3,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  currencyName: {
    ...textStyles.caption,
    color: '#666',
  },
  checkmark: {
    ...textStyles.body,
    color: '#03A9F4',
    fontWeight: 'bold',
  },
  deleteButton: {
    borderColor: '#FF5252',
  },
});

