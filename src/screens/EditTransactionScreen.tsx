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
  KeyboardAvoidingView,
} from 'react-native';
import { showToast } from '../utils/toast';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { transactionsService } from '../api/services/transactions';
import { categoriesService, Category } from '../api/services/categories';
import { currenciesService } from '../api/services/currencies';
import { Transaction } from '../api/types/transaction';
import { Card, Button, Input, Modal } from '../components/ui';
import { getEmojiFromIcon } from '../utils/iconMapper';
import { useTheme } from '../contexts/ThemeContext';
import { formatDateForDisplay } from '../api/utils/dateUtils';
import { translateCategoryName } from '../utils/categoryTranslator';
import { translateCurrencyName } from '../utils/currencyTranslator';
import { useCategories } from '../hooks/useCategories';

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
  const { t, i18n } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const responsiveTextStyles = createResponsiveTextStyles(width);

  // Parse initial date
  const parseDate = (dateStr: string) => {
    // If it's ISO, use it. If it's formatted (e.g., Dec 10, 2025), try to parse.
    // Ideally we prefer YYYY-MM-DD
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return new Date().toISOString().split('T')[0];
  };

  // Helper to safely get transaction data (handle potential { data: ... } wrapper)
  const txData = (transaction as any).data || transaction;

  const [transactionType, setTransactionType] = useState<'income' | 'expense'>(
    txData.type || 'expense'
  );
  
  const [amount, setAmount] = useState(() => {
    // Handle number, string, or missing amount
    const val = txData.amount;
    if (val === undefined || val === null || val === '') return '';
    
    const num = Number(val);
    if (isNaN(num)) return '';
    
    // Use absolute value
    const absVal = Math.abs(num);
    
    // Preserve decimal places
    if (absVal % 1 === 0) {
      return absVal.toString();
    }
    return absVal.toFixed(2);
  });

  const [category, setCategory] = useState(txData.category || '');
  const [currency, setCurrency] = useState(txData.currency || 'USD');
  // Use description if available, fallback to notes
  const [description, setDescription] = useState((txData as any).description || txData.notes || '');
  
  const [date, setDate] = useState(() => {
    return parseDate(txData.date || new Date().toISOString());
  });
  
  const [notes, setNotes] = useState(txData.notes || '');
  const [isRecurring, setIsRecurring] = useState((txData as any).isRecurring ?? txData.is_recurring ?? false);
  const [frequency, setFrequency] = useState(
    (txData as any).recurringFrequency || txData.recurring_frequency || 'monthly'
  );
  const [reminderDays, setReminderDays] = useState(
    ((txData as any).reminderDays ?? txData.reminder_days ?? 1).toString()
  );

  // Date Picker State
  const [selectedDate, setSelectedDate] = useState(new Date(date));
  const [showDateModal, setShowDateModal] = useState(false);

  // Data loading
  // Use useCategories hook for automatic refetch on language change
  const { categories, loading: loadingCategories } = useCategories();
  const [currencies, setCurrencies] = useState<
    Array<{ code: string; symbol: string; flag: string; name: string }>
  >([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  // Responsive scaling
  const scale = Math.min(width / 375, 1);
  const isSmallScreen = width < 375;

  // Load currencies with fallback
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        setLoadingCurrencies(true);
        const currenciesData = await currenciesService.getCurrencies();
        
        if (currenciesData && currenciesData.length > 0) {
          setCurrencies(currenciesData);
        } else {
          console.warn('No currencies returned from API, using fallback');
          setCurrencies([
            { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
            { code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Euro' },
            { code: 'GBP', symbol: '£', flag: '🇬🇧', name: 'British Pound' },
            { code: 'JPY', symbol: '¥', flag: '🇯🇵', name: 'Japanese Yen' },
            { code: 'CAD', symbol: 'CA$', flag: '🇨🇦', name: 'Canadian Dollar' },
            { code: 'AUD', symbol: 'A$', flag: '🇦🇺', name: 'Australian Dollar' },
            { code: 'CNY', symbol: '¥', flag: '🇨🇳', name: 'Chinese Yuan' },
            { code: 'INR', symbol: '₹', flag: '🇮🇳', name: 'Indian Rupee' },
            { code: 'SGD', symbol: 'S$', flag: '🇸🇬', name: 'Singapore Dollar' },
          ]);
        }
      } catch (error) {
        console.error('Error loading currencies:', error);
        // Fallback on error too
        setCurrencies([
          { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
          { code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Euro' },
          { code: 'GBP', symbol: '£', flag: '🇬🇧', name: 'British Pound' },
          { code: 'SGD', symbol: 'S$', flag: '🇸🇬', name: 'Singapore Dollar' },
        ]);
      } finally {
        setLoadingCurrencies(false);
      }
    };
    loadCurrencies();
  }, [i18n.language]);

  // Categories are now loaded automatically via useCategories hook
  // This hook automatically refetches categories when language changes

  // Filter categories... (keep existing)
  const filteredCategories = categories.filter((cat) => {
    if (transactionType === 'income') {
      return cat.type === 'income' || cat.type === 'both';
    } else {
      return cat.type === 'expense' || cat.type === 'both';
    }
  });

  // Reset category... (keep existing)
  useEffect(() => {
    // Only reset category if we have categories loaded and the current one isn't valid
    if (
      category &&
      filteredCategories.length > 0 && 
      !filteredCategories.find((c) => c.name === category)
    ) {
      // Don't reset if it matches the original category passed in (might need translation match)
      // Or if it's a legacy category that exists in transaction but not in current loaded list (edge case)
      // For now, being safer: only reset if we are sure it's invalid
      
      // Actually, if we are editing, we probably want to keep the existing category even if it's not in the list
      // So let's disable this auto-reset logic for EditScreen
      // setCategory('');
    }
  }, [transactionType, filteredCategories]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDateModal(false);
    }
    if (selectedDate) {
      setSelectedDate(selectedDate);
      // Format as YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
    }
  };

  const openDatePicker = () => {
    setShowDateModal(true);
  };

  const handleSubmit = async () => {
    if (!amount || !category || !description) {
      showToast.error(t('editTransaction.fillRequired', { defaultValue: 'Please fill in all required fields' }), t('common.error', { defaultValue: 'Error' }));
      return;
    }

    try {
      setSubmitting(true);
      await transactionsService.updateTransaction(Number(txData.id), {
        type: transactionType,
        amount: parseFloat(amount),
        category,
        currency,
        date,
        notes: description, 
        is_recurring: isRecurring,
        recurring_frequency: isRecurring ? frequency : undefined,
        reminder_days: isRecurring ? parseInt(reminderDays) : undefined,
      });

      showToast.success(t('editTransaction.updateSuccess', { defaultValue: 'Transaction updated successfully' }), t('common.success', { defaultValue: 'Success' }));
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      showToast.error(
        error?.response?.data?.message || t('editTransaction.updateError', { defaultValue: 'Failed to update transaction' }),
        t('common.error', { defaultValue: 'Error' })
      );
    } finally {
      setSubmitting(false);
    }
  };

  // handleDelete... (keep existing)
  const handleDelete = async () => {
    Alert.alert(
      t('editTransaction.deleteTitle', { defaultValue: 'Delete Transaction' }),
      t('editTransaction.deleteConfirm', { defaultValue: 'Are you sure you want to delete this transaction? This action cannot be undone.' }),
      [
        {
          text: t('common.cancel', { defaultValue: 'Cancel' }),
          style: 'cancel',
        },
        {
          text: t('common.delete', { defaultValue: 'Delete' }),
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await transactionsService.deleteTransaction(Number(txData.id));
              showToast.success(t('editTransaction.deleteSuccess', { defaultValue: 'Transaction deleted successfully' }), t('common.success', { defaultValue: 'Success' }));
              if (onSuccess) {
                setTimeout(() => {
                  onSuccess();
                }, 500);
              }
            } catch (error: any) {
              console.error('Error deleting transaction:', error);
              showToast.error(
                error?.response?.data?.message || t('editTransaction.deleteError', { defaultValue: 'Failed to delete transaction' }),
                t('common.error', { defaultValue: 'Error' })
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>
          {t('editTransaction.title', { defaultValue: 'Edit Transaction' })}
        </Text>
        <Pressable onPress={onCancel} style={styles.closeButton}>
          <X size={24 * scale} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Transaction Type */}
        <Card style={{ marginBottom: 16, backgroundColor: colors.card }}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            {t('addTransaction.transactionType')}
          </Text>
          <View style={styles.typeContainer}>
            <Pressable
              style={[
                styles.typeButton,
                transactionType === 'income' && styles.typeButtonActive,
                {
                  borderColor:
                    transactionType === 'income' ? '#4CAF50' : colors.border,
                },
                {
                  backgroundColor:
                    transactionType === 'income'
                      ? 'rgba(76, 175, 80, 0.1)'
                      : colors.inputBackground,
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
                  {
                    color: transactionType === 'income' ? '#4CAF50' : colors.mutedForeground,
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
                    transactionType === 'expense' ? '#FF5252' : colors.border,
                },
                {
                  backgroundColor:
                    transactionType === 'expense'
                      ? 'rgba(255, 82, 82, 0.1)'
                      : colors.inputBackground,
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
                  {
                    color: transactionType === 'expense' ? '#FF5252' : colors.mutedForeground,
                  },
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
                  responsiveTextStyles.body,
                  { 
                    backgroundColor: colors.inputBackground, 
                    color: colors.foreground,
                    borderColor: colors.border,
                    fontFamily: undefined 
                  }
                ]}
                placeholder={t('addTransaction.amountPlaceholder') || "0.00"}
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
                    borderColor: colors.border 
                  }
                ]}
                onPress={() => {
                  setShowCurrencyModal(true);
                }}
              >
                <Text style={[styles.selectButtonText, { color: colors.foreground }]}>
                  {loadingCurrencies
                    ? t('common.loading', { defaultValue: 'Loading...' })
                    : (selectedCurrency?.flag ? `${selectedCurrency.flag} ` : '') + (currency || 'USD')}
                </Text>
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
              <Text style={[styles.loadingText, { color: colors.foreground }]}>
                {t('addTransaction.loadingCategories')}
              </Text>
            </View>
          ) : filteredCategories.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {t('addTransaction.noCategoriesAvailable')}
            </Text>
          ) : (
            <Pressable
              style={[
                styles.selectButton,
                { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: colors.border 
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
                  {selectedCategory?.name ||
                    t('addTransaction.selectCategory')}
                </Text>
              </View>
              <ChevronDown size={16 * scale} color={colors.mutedForeground} />
            </Pressable>
          )}
        </Card>

        {/* Description & Date */}
        {/* Description & Date */}
        <Card style={{ marginBottom: 16, backgroundColor: colors.card }}>
          <Input
            label={t('addTransaction.description', { defaultValue: 'Description' })}
            placeholder={t('addTransaction.descriptionPlaceholder', { defaultValue: 'What is this for?' })}
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
                  borderColor: colors.border 
                }
              ]}
              onPress={openDatePicker}
            >
              <View style={styles.selectedCategoryContainer}>
                <Calendar size={18 * scale} color={colors.mutedForeground} />
                <Text style={[styles.selectButtonText, { color: colors.foreground }]}>{formatDateForDisplay(date, i18n.language)}</Text>
              </View>
              <ChevronDown size={16 * scale} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </Card>

        {/* Notes (Removed strictly, merging with description for now as per backend limitation) */}
        {/* But we keep it if user wants to add extra info, just append it? */}
        {/* For now, hiding Notes field to avoid confusion if we merge them. 
            Or keep it and fix the merge logic. 
            Let's keep it but ensure it's saved. */}
        <Card style={{ marginBottom: 16, backgroundColor: colors.card }}>
           <Text style={[styles.label, { color: colors.foreground }]}>{t('addTransaction.notes')}</Text>
          <TextInput
            style={[
              styles.notesInput, 
              responsiveTextStyles.body,
              { 
                backgroundColor: colors.inputBackground, 
                color: colors.foreground,
                borderColor: colors.border 
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
          title={deleting ? t('common.deleting', { defaultValue: 'Deleting...' }) : t('editTransaction.delete', { defaultValue: 'Delete' })}
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

      {/* Date Picker Modal */}
      {Platform.OS === 'ios' ? (
        <RNModal
          visible={showDateModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDateModal(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setShowDateModal(false)}
          >
            <View style={[styles.datePickerContainer, { backgroundColor: colors.card }]}>
              <View style={[styles.datePickerHeader, { borderBottomColor: colors.border }]}>
                <Pressable onPress={() => setShowDateModal(false)}>
                  <Text style={[styles.datePickerButton, { color: colors.primary }]}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable onPress={() => setShowDateModal(false)}>
                  <Text style={[styles.datePickerButton, { fontWeight: 'bold', color: colors.primary }]}>{t('common.done')}</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                textColor={isDark ? 'white' : 'black'}
              />
            </View>
          </Pressable>
        </RNModal>
      ) : (
        showDateModal && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )
      )}

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
                    {translateCategoryName(cat.name, t, cat.original_name)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </Modal>

      {/* Currency Selection Modal */}
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
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('addTransaction.selectCurrency')}</Text>
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
                    fontFamily: undefined,
                  }
                ]}
                placeholder={t('addTransaction.searchCurrency', { defaultValue: 'Search currency...' })}
                placeholderTextColor={colors.mutedForeground}
                value={currencySearch}
                onChangeText={setCurrencySearch}
              />
            </View>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {loadingCurrencies ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.foreground }]}>{t('addTransaction.loadingCurrencies', { defaultValue: 'Loading currencies...' })}</Text>
                </View>
              ) : currencies.length === 0 ? (
                <View style={styles.loadingContainer}>
                   <Text style={{ padding: 20, textAlign: 'center', color: colors.mutedForeground }}>
                    {t('addTransaction.noCurrencies', { defaultValue: 'No currencies available' })}
                  </Text>
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
                          {curr.flag ? `${curr.flag} ` : ''}{curr.code} {curr.name ? `- ${translateCurrencyName(curr.name, t)}` : ''}
                        </Text>
                      </Pressable>
                    );
                  })
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </RNModal>
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
    ...textStyles.body,
    fontWeight: '600',
    marginBottom: 4,
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
  currencySearchContainer: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 20,
  },
  currencySearchInput: {
    ...textStyles.bodySmall,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
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

  datePickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  datePickerButton: {
    color: '#007AFF',
    fontSize: 16,
  },
});

