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
  Platform,
  Modal as RNModal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fonts, textStyles, createResponsiveTextStyles } from '../constants/fonts';
import { useTranslation } from 'react-i18next';
import {
  DollarSign,
  CreditCard,
  X,
  Calendar,
  ChevronDown,
} from 'lucide-react-native';
import { transactionsService } from '../api/services/transactions';
import { categoriesService, Category } from '../api/services/categories';
import { currenciesService } from '../api/services/currencies';
import { authService } from '../api/services/auth';
import { Card, Button, Input, Modal } from '../components/ui';
import { getEmojiFromIcon } from '../utils/iconMapper';
import { useTheme } from '../contexts/ThemeContext';

interface AddTransactionScreenProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddTransactionScreen({
  onSuccess,
  onCancel,
}: AddTransactionScreenProps) {
  const { t } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [currency, setCurrency] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('monthly');
  const [reminderDays, setReminderDays] = useState('1');

  // Data loading
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Array<{ code: string; symbol: string; flag: string; name: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  // Responsive scaling
  const scale = Math.min(width / 375, 1);
  const isSmallScreen = width < 375;

  // Load user's default currency
  useEffect(() => {
    const loadUserCurrency = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrency(user.defaultCurrency || 'USD');
      } catch (error) {
        setCurrency('USD');
      }
    };
    loadUserCurrency();
  }, []);

  // Load currencies
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        setLoadingCurrencies(true);
        console.log('AddTransaction: Loading currencies from API...');
        const currenciesData = await currenciesService.getCurrencies();
        console.log('AddTransaction: Received currencies:', currenciesData?.length || 0);
        
        if (currenciesData && currenciesData.length > 0) {
          setCurrencies(currenciesData);
          // Set default currency if not already set
          if (!currency) {
            setCurrency(currenciesData[0].code);
          }
        } else {
          console.warn('AddTransaction: No currencies returned from API');
          // Set empty array to show empty state
          setCurrencies([]);
        }
      } catch (error: any) {
        console.error('AddTransaction: Error loading currencies:', error);
        Alert.alert(
          t('common.error') || 'Error',
          t('addTransaction.errorLoadingCurrencies') || 'Failed to load currencies. Please try again.'
        );
        setCurrencies([]);
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
        console.log('AddTransaction: Loading categories from API...');
        const response = await categoriesService.getCategories();
        console.log('AddTransaction: Received categories response:', response);
        
        // Handle different response formats
        let allCategories: Category[] = [];
        if (response.all && Array.isArray(response.all)) {
          allCategories = response.all;
        } else if (response.system || response.custom) {
          allCategories = [
            ...(response.system || []),
            ...(response.custom || []),
          ];
        } else if (Array.isArray(response)) {
          allCategories = response;
        }
        
        console.log('AddTransaction: Loaded categories:', allCategories.length);
        if (allCategories.length > 0) {
          setCategories(allCategories);
        } else {
          console.warn('AddTransaction: No categories returned from API');
          setCategories([]);
        }
      } catch (error: any) {
        console.error('AddTransaction: Error loading categories:', error);
        Alert.alert(
          t('common.error') || 'Error',
          t('addTransaction.errorLoadingCategories') || 'Failed to load categories. Please try again.'
        );
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  // Filter categories by transaction type
  const filteredCategories = categories.filter((cat) => {
    if (!cat || !('type' in cat)) {
      return false;
    }
    if (transactionType === 'income') {
      return cat.type === 'income' || cat.type === 'both';
    } else {
      return cat.type === 'expense' || cat.type === 'both';
    }
  });

  // Reset category when type changes
  useEffect(() => {
    setCategory('');
  }, [transactionType]);

  // Initialize selectedDate from date string
  useEffect(() => {
    if (date) {
      const dateObj = new Date(date + 'T00:00:00');
      if (!isNaN(dateObj.getTime())) {
        setSelectedDate(dateObj);
      }
    }
  }, []);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDateModal(false);
    }
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setDate(formattedDate);
    } else if (Platform.OS === 'android' && event.type === 'dismissed') {
      setShowDateModal(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !category || !description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await transactionsService.createTransaction({
        type: transactionType,
        amount: parseFloat(amount),
        category,
        currency,
        date,
        notes: description || notes, // Use description as notes, or combine both
        is_recurring: isRecurring,
        recurring_frequency: isRecurring ? frequency : undefined,
        reminder_days: isRecurring ? parseInt(reminderDays) : undefined,
      });

      Alert.alert('Success', 'Transaction added successfully', [
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
      console.error('Error creating transaction:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to create transaction'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.name === category);
  const selectedCurrency = currencies.find((c) => c.code === currency);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, responsiveTextStyles.h3]}>
          {t('addTransaction.title') || 'Add Transaction'}
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
          <Text style={styles.label}>{t('addTransaction.transactionType') || 'Transaction Type'}</Text>
          <View style={styles.typeContainer}>
            <Pressable
              style={[
                styles.typeButton,
                transactionType === 'income' && styles.typeButtonActive,
                { borderColor: transactionType === 'income' ? '#4CAF50' : '#E5E7EB' },
                { backgroundColor: transactionType === 'income' ? 'rgba(76, 175, 80, 0.1)' : 'transparent' },
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
                  { color: transactionType === 'income' ? '#4CAF50' : '#9CA3AF' },
                ]}
              >
                {t('addTransaction.income') || 'Income'}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.typeButton,
                transactionType === 'expense' && styles.typeButtonActive,
                { borderColor: transactionType === 'expense' ? '#FF5252' : '#E5E7EB' },
                { backgroundColor: transactionType === 'expense' ? 'rgba(255, 82, 82, 0.1)' : 'transparent' },
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
                  { color: transactionType === 'expense' ? '#FF5252' : '#9CA3AF' },
                ]}
              >
                {t('addTransaction.expense') || 'Expense'}
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Amount & Currency */}
        <Card style={{ marginBottom: 16 }}>
          <View style={styles.amountRow}>
            <View style={styles.amountInputContainer}>
              <Text style={styles.label}>{t('addTransaction.amount') || 'Amount'}</Text>
              <TextInput
                style={[styles.amountInput, { fontSize: Math.max(16, 18 * scale) }]}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.currencyContainer}>
              <Text style={styles.label}>{t('addTransaction.currency') || 'Currency'}</Text>
              <Pressable
                style={styles.selectButton}
                onPress={() => setShowCurrencyModal(true)}
                disabled={loadingCurrencies}
              >
                {loadingCurrencies ? (
                  <ActivityIndicator size="small" color="#03A9F4" />
                ) : (
                  <Text style={styles.selectButtonText}>
                    {selectedCurrency?.flag || currency || t('addTransaction.selectCurrency') || 'USD'}
                  </Text>
                )}
                <ChevronDown size={16 * scale} color="#666" />
              </Pressable>
            </View>
          </View>
        </Card>

        {/* Category */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={styles.label}>{t('addTransaction.category') || 'Category'}</Text>
          {loadingCategories ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.foreground }]}>{t('addTransaction.loadingCategories') || 'Loading categories...'}</Text>
            </View>
          ) : filteredCategories.length === 0 ? (
            <Text style={styles.emptyText}>{t('addTransaction.noCategoriesAvailable') || 'No categories available'}</Text>
          ) : (
            <>
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
                    {selectedCategory?.name || t('addTransaction.selectCategory') || 'Select Category'}
                  </Text>
                </View>
                <ChevronDown size={16 * scale} color="#666" />
              </Pressable>
            </>
          )}
        </Card>

        {/* Description & Date */}
        <Card style={{ marginBottom: 16 }}>
          <Input
            label={t('addTransaction.description') || 'Description'}
            placeholder={t('addTransaction.descriptionPlaceholder') || 'Enter description'}
            value={description}
            onChangeText={setDescription}
            containerStyle={{ marginBottom: 16 }}
          />
          <View>
            <Text style={styles.label}>{t('addTransaction.date') || 'Date'}</Text>
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
          <Text style={styles.label}>{t('addTransaction.notes') || 'Notes'}</Text>
          <TextInput
            style={[styles.notesInput, { fontSize: Math.max(14, 16 * scale) }]}
            placeholder={t('addTransaction.notesPlaceholder') || 'Add notes (optional)'}
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </Card>

        {/* Submit Button */}
        <Button
          title={submitting ? (t('common.saving') || 'Saving...') : (t('addTransaction.submit') || 'Add Transaction')}
          onPress={handleSubmit}
          disabled={submitting || !amount || !category || !description}
          loading={submitting}
          fullWidth
          style={{ marginBottom: 24 }}
        />
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={t('addTransaction.selectCategory') || 'Select Category'}
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
        onClose={() => {
          setShowCurrencyModal(false);
          setCurrencySearch('');
        }}
        title={t('addTransaction.selectCurrency') || 'Select Currency'}
      >
        <View style={styles.currencySearchContainer}>
          <TextInput
            style={styles.currencySearchInput}
            placeholder={t('addTransaction.searchCurrency') || 'Search currency...'}
            placeholderTextColor="#999"
            value={currencySearch}
            onChangeText={setCurrencySearch}
          />
        </View>
        <ScrollView
          style={styles.currencyListContainer}
          contentContainerStyle={styles.currencyListContent}
          showsVerticalScrollIndicator={true}
        >
          {loadingCurrencies ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.foreground }]}>{t('addTransaction.loadingCurrencies') || 'Loading currencies...'}</Text>
            </View>
          ) : currencies.length === 0 ? (
            <Text style={styles.emptyText}>{t('addTransaction.noCurrenciesAvailable') || 'No currencies available'}</Text>
          ) : (
            currencies
              .filter((curr) => {
                if (!currencySearch.trim()) return true;
                const q = currencySearch.toLowerCase();
                return (
                  curr.code.toLowerCase().includes(q) ||
                  (curr.name || '').toLowerCase().includes(q)
                );
              })
              .map((curr) => (
                <Pressable
                  key={curr.code}
                  style={[
                    styles.currencyItem,
                    currency === curr.code && styles.currencyItemSelected,
                  ]}
                  onPress={() => {
                    setCurrency(curr.code);
                    setShowCurrencyModal(false);
                    setCurrencySearch('');
                  }}
                >
                  <Text style={styles.currencyFlag}>{curr.flag || '💰'}</Text>
                  <View style={styles.currencyInfo}>
                    <Text style={styles.currencyCode}>{curr.code}</Text>
                    {curr.name && (
                      <Text style={styles.currencyName}>{curr.name}</Text>
                    )}
                  </View>
                  {currency === curr.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </Pressable>
              ))
          )}
        </ScrollView>
      </Modal>

      {/* Date Picker */}
      {showDateModal && Platform.OS === 'ios' && (
        <RNModal
          visible={showDateModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDateModal(false)}
        >
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <Pressable onPress={() => setShowDateModal(false)}>
                <Text style={styles.datePickerCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.datePickerTitle}>Select Date</Text>
              <Pressable
                onPress={() => {
                  const formattedDate = selectedDate.toISOString().split('T')[0];
                  setDate(formattedDate);
                  setShowDateModal(false);
                }}
              >
                <Text style={styles.datePickerDone}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                if (date) {
                  setSelectedDate(date);
                }
              }}
              maximumDate={new Date()}
            />
          </View>
        </RNModal>
      )}
      {showDateModal && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
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
    fontSize: 14,
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
    fontSize: 15,
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
    fontSize: 15,
    color: '#333',
  },
  selectedCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    fontSize: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
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
    fontSize: 32,
    marginBottom: 8,
  },
  categoryItemText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  categoryItemTextSelected: {
    color: '#03A9F4',
    fontWeight: '600',
  },
  currencySearchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  currencySearchInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f5f5f5',
    fontFamily: fonts.sans,
  },
  currencyListContainer: {
    flex: 1,
  },
  currencyListContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
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
    minHeight: 60,
  },
  currencyItemSelected: {
    borderColor: '#03A9F4',
    backgroundColor: 'rgba(3, 169, 244, 0.1)',
    borderWidth: 2,
  },
  currencyFlag: {
    fontSize: 28,
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  currencyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
    fontFamily: fonts.sans,
  },
  currencyName: {
    fontSize: 13,
    color: '#666',
    fontFamily: fonts.sans,
  },
  checkmark: {
    fontSize: 20,
    color: '#03A9F4',
    fontWeight: 'bold',
  },
  datePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#666',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  datePickerDone: {
    fontSize: 16,
    color: '#03A9F4',
    fontWeight: '600',
  },
});

