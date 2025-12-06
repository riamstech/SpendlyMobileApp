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
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import {
  requestCameraPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
  launchCameraAsync,
  launchImageLibraryAsync,
  MediaTypeOptions,
  isImagePickerAvailable,
} from '../utils/imagePicker';
import { fonts, textStyles, createResponsiveTextStyles } from '../constants/fonts';
import {
  Camera,
  Image as ImageIcon,
  FileText,
  Upload,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  Store,
  Tag,
  ArrowLeft,
  X,
  Plus,
  ChevronDown,
} from 'lucide-react-native';
import { Receipt } from '../api/services/receipts';
import { apiClient } from '../api/client';
import { categoriesService } from '../api/services/categories';
import { authService } from '../api/services/auth';
import { useTheme } from '../contexts/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ReceiptsScreenProps {
  onBack?: () => void;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  type: string;
}

// Mobile-specific upload function
const uploadReceipt = async (
  imageUri: string,
  data: {
    amount?: number;
    merchant?: string;
    date?: string;
    category_id?: number;
  }
): Promise<Receipt> => {
  const formData = new FormData();
  
  // Get the file extension and MIME type
  const uriParts = imageUri.split('.');
  const fileType = uriParts[uriParts.length - 1];
  
  // Append file for mobile
  formData.append('file', {
    uri: imageUri,
    type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
    name: `receipt_${Date.now()}.${fileType}`,
  } as any);
  
  if (data.amount !== undefined) formData.append('amount', String(data.amount));
  if (data.merchant) formData.append('merchant', data.merchant);
  if (data.date) formData.append('date', data.date);
  if (data.category_id) formData.append('category_id', String(data.category_id));

  const response = await apiClient.post<Receipt>('/receipts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};

export default function ReceiptsScreen({ onBack }: ReceiptsScreenProps) {
  const { t } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currency, setCurrency] = useState('USD');
  
  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Preview modal
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const responsiveTextStyles = createResponsiveTextStyles(width);
  


  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Get user currency
      const userData = await authService.getCurrentUser();
      setCurrency(userData.defaultCurrency || 'USD');
      
      // Load categories
      try {
        const categoriesResponse = await categoriesService.getCategories();
        const allCats = [
          ...(categoriesResponse.system || []),
          ...(categoriesResponse.custom || []),
        ];
        setCategories(allCats.filter((cat: any) => cat.type === 'expense' || cat.type === 'both'));
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
      
      await fetchReceipts();
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setLoading(false);
    }
  };

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Receipt[]>('/receipts');
      const data = Array.isArray(response) ? response : (response as any).data || [];
      setReceipts(data);
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
      setReceipts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReceipts();
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      if (!isImagePickerAvailable()) {
        Alert.alert(
          'Feature Unavailable',
          'Image picker is not available. Please wait for the app rebuild to complete, or rebuild the app manually.'
        );
        return false;
      }

      try {
        const cameraPermission = await requestCameraPermissionsAsync();
        const libraryPermission = await requestMediaLibraryPermissionsAsync();
        
        if (cameraPermission.status !== 'granted' || libraryPermission.status !== 'granted') {
          Alert.alert(
            'Permissions needed',
            'Camera and photo library permissions are required to upload receipts.'
          );
          return false;
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to request permissions');
        return false;
      }
    }
    return true;
  };

  const pickFromCamera = async () => {
    if (!isImagePickerAvailable()) {
      Alert.alert(
        'Feature Unavailable',
        'Image picker is not available. Please wait for the app rebuild to complete.'
      );
      return;
    }

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const result = await launchCameraAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setShowUploadModal(true);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to open camera');
    }
  };

  const pickFromGallery = async () => {
    if (!isImagePickerAvailable()) {
      Alert.alert(
        'Feature Unavailable',
        'Image picker is not available. Please wait for the app rebuild to complete.'
      );
      return;
    }

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setShowUploadModal(true);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to open gallery');
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    try {
      setUploading(true);
      await uploadReceipt(selectedImage, {
        amount: amount ? parseFloat(amount) : undefined,
        merchant: merchant || undefined,
        date: receiptDate.toISOString().split('T')[0],
        category_id: categoryId || undefined,
      });
      
      // Reset form
      resetUploadForm();
      setShowUploadModal(false);
      
      // Refresh list
      await fetchReceipts();
      Alert.alert('Success', 'Receipt uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload receipt:', error);
      Alert.alert('Error', 'Failed to upload receipt. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setSelectedImage(null);
    setAmount('');
    setMerchant('');
    setReceiptDate(new Date());
    setCategoryId(null);
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/receipts/${id}`);
              await fetchReceipts();
            } catch (error) {
              console.error('Failed to delete receipt:', error);
              Alert.alert('Error', 'Failed to delete receipt.');
            }
          },
        },
      ]
    );
  };

  const viewReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowPreview(true);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No date';
    return new Date(dateStr).toLocaleDateString();
  };

  const getCategoryName = (catId: number | null) => {
    if (!catId) return 'Uncategorized';
    const cat = categories.find(c => c.id === catId);
    return cat?.name || 'Uncategorized';
  };

  const getSelectedCategoryName = () => {
    if (!categoryId) return 'Select category';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'Select category';
  };

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
            <FileText size={28} color="#FF9800" />
            <Text style={[styles.headerTitle, themedStyles.text, responsiveTextStyles.h3]}>
              {t('receipts.title') || 'Receipts & OCR'}
            </Text>
          </View>
        </View>
      </View>

      {/* Upload Buttons */}
      <View style={styles.uploadContainer}>
        <Pressable
          style={[styles.uploadButton, { backgroundColor: '#03A9F4' }]}
          onPress={pickFromCamera}
        >
          <Camera size={24} color="#fff" />
          <Text style={styles.uploadButtonText}>Camera</Text>
        </Pressable>
        <Pressable
          style={[styles.uploadButton, { backgroundColor: '#9C27B0' }]}
          onPress={pickFromGallery}
        >
          <ImageIcon size={24} color="#fff" />
          <Text style={styles.uploadButtonText}>Gallery</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={[styles.sectionTitle, themedStyles.text, responsiveTextStyles.h3]}>
          {t('receipts.myReceipts') || 'My Receipts'}
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF9800" />
            <Text style={[styles.loadingText, themedStyles.textMuted]}>
              {t('common.loading')}
            </Text>
          </View>
        ) : receipts.length === 0 ? (
          <View style={[styles.emptyCard, themedStyles.card]}>
            <FileText size={64} color={colors.mutedForeground} style={{ opacity: 0.3 }} />
            <Text style={[styles.emptyTitle, themedStyles.text]}>
              {t('receipts.noReceipts') || 'No receipts uploaded yet'}
            </Text>
            <Text style={[styles.emptySubtitle, themedStyles.textMuted]}>
              Use the camera or gallery buttons above to upload your first receipt
            </Text>
          </View>
        ) : (
          <View style={styles.receiptsList}>
            {receipts.map((receipt) => (
              <View key={receipt.id} style={[styles.receiptCard, themedStyles.card]}>
                <View style={styles.receiptHeader}>
                  <View style={styles.receiptInfo}>
                    <View style={styles.receiptIconContainer}>
                      <FileText size={24} color="#FF9800" />
                    </View>
                    <View style={styles.receiptDetails}>
                      <Text style={[styles.receiptMerchant, themedStyles.text]} numberOfLines={1}>
                        {receipt.merchant || 'Unknown Merchant'}
                      </Text>
                      <Text style={[styles.receiptDate, themedStyles.textMuted]}>
                        {formatDate(receipt.date)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.receiptAmount}>
                    {receipt.amount ? `${currency}${receipt.amount.toFixed(2)}` : '--'}
                  </Text>
                </View>

                {/* OCR Text Preview */}
                {receipt.ocr_text && (
                  <View style={[styles.ocrPreview, themedStyles.border]}>
                    <Text style={[styles.ocrLabel, themedStyles.textMuted]}>OCR Text:</Text>
                    <Text style={[styles.ocrText, themedStyles.text]} numberOfLines={2}>
                      {receipt.ocr_text}
                    </Text>
                  </View>
                )}

                {/* Category Badge */}
                <View style={styles.receiptMeta}>
                  <View style={styles.categoryBadge}>
                    <Tag size={14} color="#03A9F4" />
                    <Text style={styles.categoryBadgeText}>
                      {getCategoryName(receipt.category_id)}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.receiptActions}>
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: '#E3F2FD' }]}
                    onPress={() => viewReceipt(receipt)}
                  >
                    <Eye size={18} color="#03A9F4" />
                    <Text style={[styles.actionButtonText, { color: '#03A9F4' }]}>
                      {t('receipts.viewDetails') || 'View'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: '#FFEBEE' }]}
                    onPress={() => handleDelete(receipt.id)}
                  >
                    <Trash2 size={18} color="#FF5252" />
                    <Text style={[styles.actionButtonText, { color: '#FF5252' }]}>
                      Delete
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          resetUploadForm();
          setShowUploadModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, themedStyles.card]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Upload size={24} color="#FF9800" />
                <Text style={[styles.modalTitle, themedStyles.text]}>
                  {t('receipts.uploadReceipt') || 'Upload Receipt'}
                </Text>
              </View>
              <Pressable onPress={() => {
                resetUploadForm();
                setShowUploadModal(false);
              }}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Image Preview */}
              {selectedImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.imagePreview}
                    resizeMode="contain"
                  />
                </View>
              )}

              {/* Amount */}
              <View style={styles.formGroup}>
                <View style={styles.formLabelRow}>
                  <DollarSign size={16} color={colors.mutedForeground} />
                  <Text style={[styles.formLabel, themedStyles.text]}>
                    Amount (Optional)
                  </Text>
                </View>
                <TextInput
                  style={[styles.formInput, themedStyles.card, themedStyles.border, themedStyles.text]}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Merchant */}
              <View style={styles.formGroup}>
                <View style={styles.formLabelRow}>
                  <Store size={16} color={colors.mutedForeground} />
                  <Text style={[styles.formLabel, themedStyles.text]}>
                    Merchant (Optional)
                  </Text>
                </View>
                <TextInput
                  style={[styles.formInput, themedStyles.card, themedStyles.border, themedStyles.text]}
                  value={merchant}
                  onChangeText={setMerchant}
                  placeholder="e.g., Walmart, Target"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              {/* Date */}
              <View style={styles.formGroup}>
                <View style={styles.formLabelRow}>
                  <Calendar size={16} color={colors.mutedForeground} />
                  <Text style={[styles.formLabel, themedStyles.text]}>
                    Date
                  </Text>
                </View>
                <Pressable
                  style={[styles.formInput, themedStyles.card, themedStyles.border]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={themedStyles.text}>
                    {receiptDate.toLocaleDateString()}
                  </Text>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={receiptDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        setReceiptDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>

              {/* Category */}
              <View style={styles.formGroup}>
                <View style={styles.formLabelRow}>
                  <Tag size={16} color={colors.mutedForeground} />
                  <Text style={[styles.formLabel, themedStyles.text]}>
                    Category (Optional)
                  </Text>
                </View>
                <Pressable
                  style={[styles.formInput, themedStyles.card, themedStyles.border, styles.selectButton]}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Text style={[themedStyles.text, !categoryId && { color: colors.mutedForeground }]}>
                    {getSelectedCategoryName()}
                  </Text>
                  <ChevronDown size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSecondary, themedStyles.border]}
                onPress={() => {
                  resetUploadForm();
                  setShowUploadModal(false);
                }}
              >
                <Text style={themedStyles.text}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>Upload</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, themedStyles.card, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, themedStyles.text]}>Select Category</Text>
              <Pressable onPress={() => setShowCategoryModal(false)}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    themedStyles.border,
                    categoryId === cat.id && styles.categoryOptionSelected,
                  ]}
                  onPress={() => {
                    setCategoryId(cat.id);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={[styles.categoryOptionText, themedStyles.text]}>
                    {cat.name}
                  </Text>
                  {categoryId === cat.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Receipt Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, themedStyles.card]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, themedStyles.text]}>Receipt Details</Text>
              <Pressable onPress={() => setShowPreview(false)}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {selectedReceipt && (
              <ScrollView style={styles.modalBody}>
                {/* Receipt Image */}
                {selectedReceipt.file_path && (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: selectedReceipt.file_path }}
                      style={styles.imagePreview}
                      resizeMode="contain"
                    />
                  </View>
                )}

                {/* Details */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Store size={18} color="#03A9F4" />
                    </View>
                    <View>
                      <Text style={[styles.detailLabel, themedStyles.textMuted]}>Merchant</Text>
                      <Text style={[styles.detailValue, themedStyles.text]}>
                        {selectedReceipt.merchant || 'Unknown'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <DollarSign size={18} color="#4CAF50" />
                    </View>
                    <View>
                      <Text style={[styles.detailLabel, themedStyles.textMuted]}>Amount</Text>
                      <Text style={[styles.detailValue, themedStyles.text]}>
                        {selectedReceipt.amount ? `${currency}${selectedReceipt.amount.toFixed(2)}` : 'Not specified'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Calendar size={18} color="#9C27B0" />
                    </View>
                    <View>
                      <Text style={[styles.detailLabel, themedStyles.textMuted]}>Date</Text>
                      <Text style={[styles.detailValue, themedStyles.text]}>
                        {formatDate(selectedReceipt.date)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Tag size={18} color="#FF9800" />
                    </View>
                    <View>
                      <Text style={[styles.detailLabel, themedStyles.textMuted]}>Category</Text>
                      <Text style={[styles.detailValue, themedStyles.text]}>
                        {getCategoryName(selectedReceipt.category_id)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* OCR Text */}
                {selectedReceipt.ocr_text && (
                  <View style={[styles.ocrSection, themedStyles.border]}>
                    <Text style={[styles.ocrSectionTitle, themedStyles.text]}>
                      OCR Extracted Text
                    </Text>
                    <Text style={[styles.ocrFullText, themedStyles.textMuted]}>
                      {selectedReceipt.ocr_text}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary, { flex: 1 }]}
                onPress={() => setShowPreview(false)}
              >
                <Text style={styles.modalButtonPrimaryText}>Close</Text>
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
  uploadContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  uploadButtonText: {
    ...textStyles.button,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    ...textStyles.h3,
    fontWeight: '700',
    marginBottom: 16,
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
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
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
  receiptsList: {
    gap: 12,
  },
  receiptCard: {
    borderRadius: 16,
    padding: 16,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  receiptIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  receiptDetails: {
    flex: 1,
  },
  receiptMerchant: {
    ...textStyles.h3,
    fontWeight: '600',
  },
  receiptDate: {
    ...textStyles.caption,
    marginTop: 2,
  },
  receiptAmount: {
    ...textStyles.h3,
    fontWeight: '700',
    fontFamily: fonts.mono,
    color: '#4CAF50',
  },
  ocrPreview: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  ocrLabel: {
    ...textStyles.labelSmall,
    marginBottom: 4,
  },
  ocrText: {
    ...textStyles.caption,
    fontFamily: fonts.mono,
  },
  receiptMeta: {
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 4,
  },
  categoryBadgeText: {
    ...textStyles.caption,
    color: '#03A9F4',
  },
  receiptActions: {
    flexDirection: 'row',
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
  actionButtonText: {
    ...textStyles.button,
    fontWeight: '500',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
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
  modalBody: {
    padding: 20,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  formLabel: {
    ...textStyles.label,
    fontWeight: '500',
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    ...textStyles.body,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
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
    backgroundColor: '#FF9800',
  },
  modalButtonPrimaryText: {
    color: '#fff',
    ...textStyles.button,
    fontWeight: '600',
  },
  // Category Modal
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  categoryOptionSelected: {
    backgroundColor: '#FFF3E0',
  },
  categoryOptionText: {
    ...textStyles.body,
  },
  checkmark: {
    color: '#FF9800',
    ...textStyles.h2,
    fontWeight: '700',
  },
  // Preview Modal
  detailsGrid: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    ...textStyles.caption,
    marginBottom: 2,
  },
  detailValue: {
    ...textStyles.body,
    fontWeight: '600',
  },
  ocrSection: {
    marginTop: 20,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  ocrSectionTitle: {
    ...textStyles.label,
    fontWeight: '600',
    marginBottom: 8,
  },
  ocrFullText: {
    ...textStyles.caption,
    fontFamily: fonts.mono,
    lineHeight: 20,
  },
});
