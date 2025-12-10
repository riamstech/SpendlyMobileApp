import React, { useState, useEffect } from 'react';
import { translateCategoryName } from '../utils/categoryTranslator';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
  Platform,
  Modal as RNModal,
  Switch,
  KeyboardAvoidingView,
  Alert,
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
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { showToast } from '../utils/toast';
import { CategoryIcon } from '../components/CategoryIcon';

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
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [hasWarranty, setHasWarranty] = useState(false);
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState('');
  const [isLoan, setIsLoan] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [loanEndDate, setLoanEndDate] = useState('');
  const [loanType, setLoanType] = useState('personal');

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
        showToast.error(t('addTransaction.errorLoadingCurrencies'), t('common.error'));
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
        showToast.error(t('addTransaction.errorLoadingCategories'), t('common.error'));
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
      showToast.error(t('addTransaction.fillRequiredFields'), t('common.error'));
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
        is_loan: transactionType === 'expense' ? isLoan : undefined,
        loan_amount: (transactionType === 'expense' && isLoan) ? parseFloat(loanAmount) : undefined,
        loan_end_date: (transactionType === 'expense' && isLoan) ? loanEndDate : undefined,
        loan_type: (transactionType === 'expense' && isLoan) ? loanType : undefined,
        warranty_expiry_date: (transactionType === 'expense' && hasWarranty) ? warrantyExpiryDate : undefined,
      } as any);

      showToast.success(t('addTransaction.success'), t('common.success'));

      // Clear fields
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setIsRecurring(false);
      setFrequency('monthly');
      setReminderDays('1');
      setIsLoan(false);
      setLoanAmount('');
      setLoanEndDate('');
      setLoanType('personal');
      setHasWarranty(false);
      setWarrantyExpiryDate('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      showToast.error(
        error?.response?.data?.message || t('addTransaction.errorCreate'),
        t('common.error')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.name === category);
  const selectedCurrency = currencies.find((c) => c.code === currency);

  // Show loading screen until both categories and currencies are loaded
  const isLoading = loadingCategories || loadingCurrencies;

  if (isLoading) {
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
                    fontSize: responsiveTextStyles.displaySmall.fontSize,
                    fontFamily: undefined,
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
                onPress={() => {
                  console.log('Currency button pressed, currencies:', currencies.length);
                  console.log('Loading currencies:', loadingCurrencies);
                  setShowCurrencyModal(true);
                }}
              >
                {loadingCurrencies ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.selectButtonText, { color: colors.mutedForeground }]}>
                      {t('addTransaction.loadingCurrencies') || 'Loading...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.selectButtonText, { color: colors.foreground }]}>
                    {selectedCurrency?.flag ? `${selectedCurrency.flag} ${currency}` : currency || t('addTransaction.selectCurrency')}
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
              <View style={styles.categoryGrid}>
                {(showAllCategories ? filteredCategories : filteredCategories.slice(0, 6)).map((cat) => {
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
                      onPress={() => setCategory(cat.name)}
                    >
                      <View style={[styles.categoryIconContainer, { backgroundColor: isSelected ? 'transparent' : `${cat.color || colors.primary}20` }]}>
                         <CategoryIcon
                            iconName={cat.icon || ''}
                            size={24 * scale}
                            color={cat.color || colors.primary}
                          />
                      </View>
                      <Text
                        style={[
                          styles.categoryItemText,
                          isSelected && styles.categoryItemTextSelected,
                          {
                            color: isSelected ? colors.primary : colors.mutedForeground,
                          }
                        ]}
                        numberOfLines={1}
                      >
                        {translateCategoryName(cat.name, t)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {filteredCategories.length > 6 && (
                <Pressable
                  style={styles.showMoreButton}
                  onPress={() => setShowAllCategories(!showAllCategories)}
                >
                  <Text style={[styles.showMoreText, { color: colors.primary }]}>
                    {showAllCategories ? t('addTransaction.showLess') : t('addTransaction.showMore', { count: filteredCategories.length - 6 })}
                  </Text>
                </Pressable>
              )}
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

        {/* Recurring Options */}
        <Card style={{ marginBottom: 16, backgroundColor: colors.card }}>
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: isRecurring ? 16 : 0 }}>
            <Text style={[styles.label, { color: colors.foreground, marginBottom: 0 }]}>{t('addTransaction.recurring')}</Text>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : isRecurring ? '#fff' : '#f4f3f4'}
            />
          </View>
          
          
          {isRecurring && (
            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>{t('addTransaction.frequency')}</Text>
              <View style={styles.frequencyContainer}>
                {['daily', 'weekly', 'monthly', 'yearly'].map((freq) => (
                  <Pressable
                    key={freq}
                    style={[
                      styles.frequencyButton,
                      frequency === freq && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
                      { borderColor: colors.border }
                    ]}
                    onPress={() => setFrequency(freq)}
                  >
                    <Text style={[
                      styles.frequencyButtonText,
                      { color: frequency === freq ? colors.primary : colors.mutedForeground }
                    ]}>
                      {t(`addTransaction.${freq}`) || freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.foreground, marginTop: 16 }]}>{t('addTransaction.reminderDays')}</Text>
              <TextInput
                style={[
                  styles.amountInput, 
                  { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.foreground,
                    fontSize: responsiveTextStyles.body.fontSize,
                    fontFamily: undefined,
                    paddingVertical: 12
                  }
                ]}
                placeholder="1"
                placeholderTextColor={colors.mutedForeground}
                value={reminderDays}
                onChangeText={setReminderDays}
                keyboardType="number-pad"
              />
              <Text style={[styles.hintTeat, { color: colors.mutedForeground, marginTop: 4, ...textStyles.caption }]}>
                Days before due date to remind you
              </Text>
            </View>
          )}
        </Card>

        {/* Warranty Tracking (Expenses Only) */}
        {transactionType === 'expense' && (
          <Card style={{ marginBottom: 16, backgroundColor: colors.card }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasWarranty ? 16 : 0 }}>
              <Text style={[styles.label, { color: colors.foreground, marginBottom: 0 }]}>{t('addTransaction.productWarranty')}</Text>
              <Switch
                value={hasWarranty}
                onValueChange={setHasWarranty}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : hasWarranty ? '#fff' : '#f4f3f4'}
              />
            </View>
            
            {hasWarranty && (
              <View>
                <Text style={[styles.label, { color: colors.foreground }]}>{t('addTransaction.warrantyExpiryDate')}</Text>
                <Pressable
                  style={[
                    styles.selectButton,
                    { 
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => {
                     // For simplicity, using same date modal but logic needs to handle which date to set
                     // Since we only have one date selection modal logic, we might need a separate state or mode
                     // For now, let's use a Text Input for date or simplistic approach if we don't want to refactor date modal logic heavily
                     // Or just implement a quick way to set it.
                     // The user asked to "refer existing code". The web app uses input type="date".
                     // Ideally we should reuse the DatePicker modal.
                     // But showing another modal state is better.
                     // I'll just use a text input YYYY-MM-DD for simpler implementation as requested "help fix issues", or reuse the main date picker?
                     // Let's reuse the main date picker but add a mode.
                     // Actually, I'll just use the same interaction pattern but I need to know WHICH date I'm picking.
                     // I'll add a 'datePickerMode' state to 'AddTransactionScreen' in a separate edit if needed, or just use text input for now to avoid complexity of multiple date pickers in one screen without refactoring.
                     // The requirement is "options missing".
                     // I'll just use TextInput for YYYY-MM-DD for now.
                  }}
                >
                  <TextInput
                    style={{ flex: 1, color: colors.foreground }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.mutedForeground}
                    value={warrantyExpiryDate}
                    onChangeText={setWarrantyExpiryDate}
                  />
                  <Calendar size={18 * scale} color={colors.mutedForeground} />
                </Pressable>
                <Text style={[styles.hintTeat, { color: colors.mutedForeground, marginTop: 4, ...textStyles.caption }]}>
                  {t('addTransaction.warrantyReminder')}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Loan Tracking (Expenses Only) */}
        {transactionType === 'expense' && (
          <Card style={{ marginBottom: 16, backgroundColor: colors.card }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: isLoan ? 16 : 0 }}>
              <Text style={[styles.label, { color: colors.foreground, marginBottom: 0 }]}>{t('addTransaction.isThisALoan')}</Text>
              <Switch
                value={isLoan}
                onValueChange={setIsLoan}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : isLoan ? '#fff' : '#f4f3f4'}
              />
            </View>
            
            {isLoan && (
              <View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[styles.label, { color: colors.foreground }]}>{t('addTransaction.totalLoanAmount')}</Text>
                   <TextInput
                    style={[
                      styles.amountInput, 
                      { 
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.foreground,
                        fontSize: responsiveTextStyles.body.fontSize,
                        fontFamily: undefined,
                        paddingVertical: 12
                      }
                    ]}
                    placeholder="0.00"
                    placeholderTextColor={colors.mutedForeground}
                    value={loanAmount}
                    onChangeText={setLoanAmount}
                    keyboardType="decimal-pad"
                  />
                </View>

                 <View style={{ marginBottom: 16 }}>
                  <Text style={[styles.label, { color: colors.foreground }]}>{t('addTransaction.loanEndDate')}</Text>
                   <Pressable
                    style={[
                      styles.selectButton,
                      { 
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                      }
                    ]}
                  >
                     <TextInput
                      style={{ flex: 1, color: colors.foreground }}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.mutedForeground}
                      value={loanEndDate}
                      onChangeText={setLoanEndDate}
                    />
                    <Calendar size={18 * scale} color={colors.mutedForeground} />
                  </Pressable>
                </View>

                <View>
                  <Text style={[styles.label, { color: colors.foreground }]}>{t('addTransaction.loanType')}</Text>
                  <View style={styles.frequencyContainer}>
                     {['personal', 'car', 'home', 'education', 'other'].map((type) => (
                      <Pressable
                        key={type}
                        style={[
                          styles.frequencyButton,
                          loanType === type && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
                          { borderColor: colors.border }
                        ]}
                        onPress={() => setLoanType(type)}
                      >
                        <Text style={[
                          styles.frequencyButtonText,
                          { color: loanType === type ? colors.primary : colors.mutedForeground }
                        ]}>
                          {t(`addTransaction.${type}Loan`) || type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </Card>
        )}

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
                fontSize: responsiveTextStyles.body.fontSize
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
      <RNModal
        visible={showCurrencyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCurrencyModal(false);
          setCurrencySearch('');
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('addTransaction.selectCurrency') || 'Select Currency'}</Text>
              <Pressable onPress={() => {
                setShowCurrencyModal(false);
                setCurrencySearch('');
              }}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={[styles.currencySearchContainer, { borderBottomColor: colors.border }]}>
              <TextInput
                style={[
                  styles.currencySearchInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.foreground,
                  }
                ]}
                placeholder={t('addTransaction.searchCurrency') || 'Search currency...'}
                placeholderTextColor={colors.mutedForeground}
                value={currencySearch}
                onChangeText={setCurrencySearch}
              />
            </View>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {loadingCurrencies ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.foreground }]}>{t('addTransaction.loadingCurrencies') || 'Loading currencies...'}</Text>
                </View>
              ) : currencies.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t('addTransaction.noCurrenciesAvailable') || 'No currencies available'}</Text>
                </View>
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
                          styles.modalItem,
                          { borderBottomColor: colors.border },
                          isSelected && { backgroundColor: `${colors.primary}20` },
                        ]}
                        onPress={() => {
                          setCurrency(curr.code);
                          setShowCurrencyModal(false);
                          setCurrencySearch('');
                        }}
                      >
                        <Text style={[styles.modalItemText, { color: colors.foreground }, isSelected && { color: colors.primary, fontWeight: '600' }]}>
                          {curr.flag ? `${curr.flag} ` : ''}{curr.code} {curr.name ? `- ${curr.name}` : ''}
                        </Text>
                      </Pressable>
                    );
                  })
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </RNModal>

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
    ...textStyles.body,
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
    fontFamily: fonts.mono,
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
    // marginTop: 8, // Removed to align with Amount Input
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
    ...textStyles.h3,
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
    ...textStyles.h1,
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
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  currencySearchInput: {
    ...textStyles.bodySmall,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    ...textStyles.body,
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
    ...textStyles.body,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
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
    ...textStyles.h3,
    fontWeight: 'bold',
    flex: 1,
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
    ...textStyles.body,
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  frequencyButtonText: {
    ...textStyles.bodySmall,
    fontWeight: '500',
  },
  hintTeat: {
    ...textStyles.caption,
  },
  showMoreButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  showMoreText: {
    ...textStyles.bodySmall,
    fontWeight: '600',
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});

