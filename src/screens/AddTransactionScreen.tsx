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
  const responsiveTextStyles = createResponsiveTextStyles(width);

  // Load currencies and user's default currency
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user's default currency first
        let userCurrency = 'USD';
        try {
          const user = await authService.getCurrentUser();
          userCurrency = user.defaultCurrency || 'USD';
        } catch (error) {
          console.warn('AddTransaction: Could not load user currency, using USD');
        }

        // Load currencies from API
        setLoadingCurrencies(true);
        console.log('AddTransaction: Loading currencies from API...');
        const currenciesData = await currenciesService.getCurrencies();
        console.log('AddTransaction: Received currencies:', currenciesData?.length || 0);
        
        if (currenciesData && currenciesData.length > 0) {
          setCurrencies(currenciesData);
          // Set user's default currency or first available currency
          const defaultCurrency = currenciesData.find(c => c.code === userCurrency) 
            ? userCurrency 
            : currenciesData[0].code;
          setCurrency(defaultCurrency);
        } else {
          console.warn('AddTransaction: No currencies returned from API');
          setCurrencies([]);
          setCurrency(userCurrency);
        }
      } catch (error: any) {
        console.error('AddTransaction: Error loading currencies:', error);
        Alert.alert(
          t('common.error'),
          t('addTransaction.errorLoadingCurrencies')
        );
        setCurrencies([]);
        setCurrency('USD');
      } finally {
        setLoadingCurrencies(false);
      }
    };
    loadData();
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
          t('common.error'),
          t('addTransaction.errorLoadingCategories')
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
      Alert.alert(t('common.error'), t('addTransaction.fillRequiredFields'));
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

      Alert.alert(t('common.success'), t('addTransaction.success'), [
        {
          text: t('common.ok'),
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
        t('common.error'),
        error?.response?.data?.message || t('addTransaction.errorCreate')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.name === category);
  const selectedCurrency = currencies.find((c) => c.code === currency);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>
          {t('addTransaction.title')}
        </Text>
        <Pressable onPress={onCancel} style={styles.closeButton}>
          <X size={24 * scale} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Transaction Type */}
        <Card style={{ marginBottom: 16, backgroundColor: colors.card }}>
          <Text style={[styles.label, { color: colors.foreground }]}>{t('addTransaction.transactionType')}</Text>
          <View style={styles.typeContainer}>
            <Pressable
              style={[
                styles.typeButton,
                transactionType === 'income' && styles.typeButtonActive,
                { 
                  borderColor: transactionType === 'income' ? '#4CAF50' : colors.border,
                  backgroundColor: transactionType === 'income' ? 'rgba(76, 175, 80, 0.1)' : colors.inputBackground,
                },
              ]}
              onPress={() => setTransactionType('income')}
            >
              <DollarSign
                size={20 * scale}
                color={transactionType === 'income' ? '#4CAF50' : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  { color: transactionType === 'income' ? '#4CAF50' : colors.mutedForeground },
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
                  borderColor: transactionType === 'expense' ? '#FF5252' : colors.border,
                  backgroundColor: transactionType === 'expense' ? 'rgba(255, 82, 82, 0.1)' : colors.inputBackground,
                },
              ]}
              onPress={() => setTransactionType('expense')}
            >
              <CreditCard
                size={20 * scale}
                color={transactionType === 'expense' ? '#FF5252' : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  { color: transactionType === 'expense' ? '#FF5252' : colors.mutedForeground },
                ]}
              >
                {t('addTransaction.expense')}
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Amount & Currency */}
        <Card style={{ marginBottom: 16, backgroundColor: colors.card }}>
          <View style={styles.amountRow}>
            <View style={styles.amountInputContainer}>
              <Text style={[styles.label, { color: colors.foreground }]}>{t('addTransaction.amount')}</Text>
              <TextInput
                style={[
                  styles.amountInput, 
                  { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.foreground,
                    fontSize: Math.max(14, Math.min(16 * scale, 16))
                  }
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.currencyContainer}>
              <Text style={[styles.label, { color: colors.foreground }]}>{t('addTransaction.currency')}</Text>
              <Pressable
                style={[
                  styles.selectButton,
                  { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => setShowCurrencyModal(true)}
                disabled={loadingCurrencies}
              >
                {loadingCurrencies ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.selectButtonText, { color: colors.foreground }]}>
                    {selectedCurrency?.flag || currency || t('addTransaction.selectCurrency')}
                  </Text>
                )}
                <ChevronDown size={16 * scale} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>
        </Card>

        {/* Category */}
        <Card style={{ marginBottom: 16, backgroundColor: colors.card }}>
          <Text style={[styles.label, { color: colors.foreground }]}>{t('addTransaction.category')}</Text>
          {loadingCategories ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.foreground }]}>{t('addTransaction.loadingCategories')}</Text>
            </View>
          ) : filteredCategories.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t('addTransaction.noCategoriesAvailable')}</Text>
          ) : (
            <>
              <Pressable
                style={[
                  styles.selectButton,
                  { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => setShowCategoryModal(true)}
              >
                <View style={styles.selectedCategoryContainer}>
                  {selectedCategory && (
                    <Text style={styles.categoryIcon}>
                      {getEmojiFromIcon(selectedCategory.icon || '')}
                    </Text>
                  )}
                  <Text style={[styles.selectButtonText, { color: colors.foreground }]}>
                    {selectedCategory?.name || t('addTransaction.selectCategory')}
                  </Text>
                </View>
                <ChevronDown size={16 * scale} color={colors.mutedForeground} />
              </Pressable>
            </>
          )}
        </Card>

        {/* Description & Date */}
        <Card style={{ marginBottom: 16, backgroundColor: colors.card }}>
          <Input
            label={t('addTransaction.description')}
            placeholder={t('addTransaction.descriptionPlaceholder')}
            value={description}
            onChangeText={setDescription}
            containerStyle={{ marginBottom: 16 }}
          />
          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>{t('addTransaction.date')}</Text>
            <Pressable
              style={[
                styles.selectButton,
                { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => setShowDateModal(true)}
            >
              <View style={styles.selectedCategoryContainer}>
                <Calendar size={18 * scale} color={colors.mutedForeground} />
                <Text style={[styles.selectButtonText, { color: colors.foreground }]}>{date}</Text>
              </View>
              <ChevronDown size={16 * scale} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </Card>

        {/* Notes */}
        <Card style={{ marginBottom: 16, backgroundColor: colors.card }}>
          <Text style={[styles.label, { color: colors.foreground }]}>{t('addTransaction.notes')}</Text>
          <TextInput
            style={[
              styles.notesInput, 
              { 
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.foreground,
                fontSize: Math.max(14, 16 * scale)
              }
            ]}
            placeholder={t('addTransaction.notesPlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </Card>

        {/* Submit Button */}
        <Button
          title={submitting ? t('common.saving') : t('addTransaction.submit')}
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
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? `${colors.primary}20` : colors.card,
                    }
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
                      {
                        color: isSelected ? colors.primary : colors.mutedForeground,
                      }
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
        <View style={[styles.currencySearchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TextInput
            style={[
              styles.currencySearchInput,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.foreground,
              }
            ]}
            placeholder={t('addTransaction.searchCurrency')}
            placeholderTextColor={colors.mutedForeground}
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
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t('addTransaction.noCurrenciesAvailable')}</Text>
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
              .map((curr) => {
                const isSelected = currency === curr.code;
                return (
                  <Pressable
                    key={curr.code}
                    style={[
                      styles.currencyItem,
                      isSelected && styles.currencyItemSelected,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? `${colors.primary}20` : colors.card,
                      }
                    ]}
                    onPress={() => {
                      setCurrency(curr.code);
                      setShowCurrencyModal(false);
                      setCurrencySearch('');
                    }}
                  >
                    <Text style={styles.currencyFlag}>{curr.flag || '💰'}</Text>
                    <View style={styles.currencyInfo}>
                      <Text style={[styles.currencyCode, { color: colors.foreground }]}>{curr.code}</Text>
                      {curr.name && (
                        <Text style={[styles.currencyName, { color: colors.mutedForeground }]}>{curr.name}</Text>
                      )}
                    </View>
                    {isSelected && (
                      <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                    )}
                  </Pressable>
                );
              })
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
            <Pressable 
              style={{ flex: 1 }}
              onPress={() => setShowDateModal(false)}
            />
            <View style={[styles.datePickerContent, { backgroundColor: colors.card }]}>
              <View style={[styles.datePickerHeader, { borderBottomColor: colors.border }]}>
                <Pressable onPress={() => setShowDateModal(false)}>
                  <Text style={[styles.datePickerCancel, { color: colors.mutedForeground }]}>{t('addTransaction.cancel')}</Text>
                </Pressable>
                <Text style={[styles.datePickerTitle, { color: colors.foreground }]}>{t('addTransaction.selectDate')}</Text>
                <Pressable
                  onPress={() => {
                    const formattedDate = selectedDate.toISOString().split('T')[0];
                    setDate(formattedDate);
                    setShowDateModal(false);
                  }}
                >
                  <Text style={[styles.datePickerDone, { color: colors.primary }]}>{t('addTransaction.done')}</Text>
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
                textColor={isDark ? '#fff' : '#000'}
                themeVariant={isDark ? 'dark' : 'light'}
              />
            </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
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
    ...textStyles.displaySmall,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencyContainer: {
    flex: 1,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  selectButtonText: {
    ...textStyles.bodySmall,
  },
  selectedCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    fontSize: 16,
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
    ...textStyles.bodySmall,
    textAlign: 'center',
    paddingVertical: 20,
  },
  notesInput: {
    ...textStyles.body,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  },
  categoryItemSelected: {
    // Selected styling handled inline with theme colors
  },
  categoryItemIcon: {
    fontSize: 16,
    marginBottom: 8,
  },
  categoryItemText: {
    ...textStyles.caption,
    textAlign: 'center',
  },
  categoryItemTextSelected: {
    fontWeight: '600',
  },
  currencySearchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  currencySearchInput: {
    ...textStyles.bodySmall,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    marginBottom: 8,
    minHeight: 60,
  },
  currencyItemSelected: {
    borderWidth: 2,
  },
  currencyFlag: {
    fontSize: 16,
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  currencyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  currencyCode: {
    ...textStyles.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  currencyName: {
    ...textStyles.bodySmall,
  },
  checkmark: {
    fontSize: 16,
    color: '#03A9F4',
    fontWeight: 'bold',
  },
  datePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
  },
  datePickerCancel: {
    ...textStyles.body,
  },
  datePickerTitle: {
    ...textStyles.body,
    fontWeight: '600',
  },
  datePickerDone: {
    ...textStyles.body,
    fontWeight: '600',
  },
});

