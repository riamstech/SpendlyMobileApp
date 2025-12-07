import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  useWindowDimensions,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  requestMediaLibraryPermissionsAsync,
  launchImageLibraryAsync,
  MediaTypeOptions,
  isImagePickerAvailable,
} from '../utils/imagePicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  Plus,
  Send,
  Paperclip,
  X,
  Edit2,
  Trash2,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  FileImage,
} from 'lucide-react-native';
import { supportApi, SupportTicket, TicketMessage } from '../api/services/support';
import { useTheme } from '../contexts/ThemeContext';
import { textStyles, createResponsiveTextStyles } from '../constants/fonts';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { usersService } from '../api/services/users';

interface SupportTicketsScreenProps {
  onBack: () => void;
}

export default function SupportTicketsScreen({ onBack }: SupportTicketsScreenProps) {
  const { t } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const responsiveTextStyles = createResponsiveTextStyles(width);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);

  // Create ticket form
  const [createSubject, setCreateSubject] = useState('');
  const [createMessage, setCreateMessage] = useState('');
  const [createScreenshot, setCreateScreenshot] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [creating, setCreating] = useState(false);

  // Edit ticket form
  const [editSubject, setEditSubject] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editing, setEditing] = useState(false);

  // Reply form
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachment, setReplyAttachment] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await supportApi.getAll();
      setTickets(data);
    } catch (error: any) {
      console.error('Failed to load tickets:', error);
      Alert.alert(t('settings.error') || 'Error', error.response?.data?.message || 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetail = async (ticketId: number) => {
    try {
      const ticket = await supportApi.getById(ticketId);
      setSelectedTicket(ticket);
      setShowTicketDetail(true);
    } catch (error: any) {
      console.error('Failed to load ticket:', error);
      Alert.alert(t('settings.error') || 'Error', error.response?.data?.message || 'Failed to load ticket details');
    }
  };

  const handleCreateTicket = async () => {
    if (!createSubject.trim() || !createMessage.trim()) {
      Alert.alert(t('settings.error') || 'Error', 'Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      
      // Prepare file object for React Native if screenshot exists
      const screenshotFile = createScreenshot ? {
        uri: createScreenshot.uri,
        type: createScreenshot.type,
        name: createScreenshot.name,
      } as any : undefined;

      await supportApi.create({
        subject: createSubject.trim(),
        message: createMessage.trim(),
        screenshot: screenshotFile,
      });
      
      Alert.alert(t('settings.success') || 'Success', 'Support ticket created successfully');
      setShowCreateModal(false);
      setCreateSubject('');
      setCreateMessage('');
      setCreateScreenshot(null);
      await loadTickets();
    } catch (error: any) {
      console.error('Failed to create ticket:', error);
      Alert.alert(t('settings.error') || 'Error', error.response?.data?.message || 'Failed to create support ticket');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    if (!editSubject.trim() || !editMessage.trim()) {
      Alert.alert(t('settings.error') || 'Error', 'Please fill in all required fields');
      return;
    }

    try {
      setEditing(true);
      await supportApi.update(selectedTicket.id, {
        subject: editSubject.trim(),
        message: editMessage.trim(),
      });
      
      Alert.alert(t('settings.success') || 'Success', 'Ticket updated successfully');
      setShowEditModal(false);
      await loadTickets();
      await loadTicketDetail(selectedTicket.id);
    } catch (error: any) {
      console.error('Failed to update ticket:', error);
      Alert.alert(t('settings.error') || 'Error', error.response?.data?.message || 'Failed to update ticket');
    } finally {
      setEditing(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket) return;
    if (!replyMessage.trim()) {
      Alert.alert(t('settings.error') || 'Error', 'Please enter a message');
      return;
    }

    try {
      setReplying(true);
      
      // Prepare file object for React Native if attachment exists
      const attachmentFile = replyAttachment ? {
        uri: replyAttachment.uri,
        type: replyAttachment.type,
        name: replyAttachment.name,
      } as any : undefined;

      await supportApi.reply(selectedTicket.id, replyMessage.trim(), attachmentFile);
      
      Alert.alert(t('settings.success') || 'Success', 'Reply sent successfully');
      setShowReplyModal(false);
      setReplyMessage('');
      setReplyAttachment(null);
      await loadTicketDetail(selectedTicket.id);
    } catch (error: any) {
      console.error('Failed to reply:', error);
      Alert.alert(t('settings.error') || 'Error', error.response?.data?.message || 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const handlePickImage = async (isScreenshot: boolean = false) => {
    try {
      if (!isImagePickerAvailable()) {
        Alert.alert(
          t('settings.featureUnavailable') || 'Feature Unavailable',
          'Image picker is not available. Please wait for the app rebuild to complete.'
        );
        return;
      }

      const { status } = await requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('settings.permissionDenied'), t('settings.permissionDeniedMessage'));
        return;
      }

      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const imageAsset = result.assets[0];
      const imageUri = imageAsset.uri;
      const uriParts = imageUri.split('.');
      const fileExtension = uriParts[uriParts.length - 1] || 'jpg';
      const imageName = `evidence_${Date.now()}.${fileExtension}`;
      const imageType = `image/${fileExtension === 'png' ? 'png' : 'jpeg'}`;

      const imageData = {
        uri: imageUri,
        type: imageType,
        name: imageName,
      };

      if (isScreenshot) {
        setCreateScreenshot(imageData);
      } else {
        setReplyAttachment(imageData);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('settings.error') || 'Error', 'Failed to pick image');
    }
  };

  const handleDeleteTicket = async (ticket: SupportTicket) => {
    Alert.alert(
      'Delete Ticket',
      'Are you sure you want to delete this ticket?',
      [
        { text: t('settings.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('settings.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supportApi.delete(ticket.id);
              Alert.alert(t('settings.success') || 'Success', 'Ticket deleted successfully');
              await loadTickets();
              if (selectedTicket?.id === ticket.id) {
                setShowTicketDetail(false);
                setSelectedTicket(null);
              }
            } catch (error: any) {
              console.error('Failed to delete ticket:', error);
              Alert.alert(t('settings.error') || 'Error', error.response?.data?.message || 'Failed to delete ticket');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#3B82F6';
      case 'in_progress':
        return '#F59E0B';
      case 'resolved':
        return '#10B981';
      case 'closed':
        return '#6B7280';
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle size={16} color={getStatusColor(status)} />;
      case 'in_progress':
        return <Clock size={16} color={getStatusColor(status)} />;
      case 'resolved':
      case 'closed':
        return <CheckCircle size={16} color={getStatusColor(status)} />;
      default:
        return null;
    }
  };

  const getImageUrl = (path: string | null): string | null => {
    if (!path) return null;
    return usersService.getAvatarUrl(path);
  };

  if (loading && tickets.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <LoadingSpinner size="large" text={t('common.loading') || 'Loading...'} fullScreen={true} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, responsiveTextStyles.h2, { color: colors.foreground }]}>
          {t('mySupportTickets') || 'My Support Tickets'}
        </Text>
        <Pressable
          onPress={() => {
            setCreateSubject('');
            setCreateMessage('');
            setCreateScreenshot(null);
            setShowCreateModal(true);
          }}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Plus size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {tickets.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageSquare size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
              {t('mySupportTicketsSubtitle') || 'No support tickets yet'}
            </Text>
            <Pressable
              onPress={() => setShowCreateModal(true)}
              style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.emptyStateButtonText}>
                {t('submitSupportTicket') || 'Create Support Ticket'}
              </Text>
            </Pressable>
          </View>
        ) : (
          tickets.map((ticket) => (
            <Pressable
              key={ticket.id}
              style={[styles.ticketCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => loadTicketDetail(ticket.id)}
            >
              <View style={styles.ticketHeader}>
                <View style={styles.ticketTitleRow}>
                  <Text style={[styles.ticketSubject, { color: colors.foreground }]} numberOfLines={1}>
                    {ticket.subject}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(ticket.status)}20` }]}>
                    {getStatusIcon(ticket.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.ticketDate, { color: colors.mutedForeground }]}>
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.ticketPreview, { color: colors.mutedForeground }]} numberOfLines={2}>
                {ticket.message}
              </Text>
              {ticket.messages && ticket.messages.length > 0 && (
                <Text style={[styles.ticketMessagesCount, { color: colors.primary }]}>
                  {ticket.messages.length} {ticket.messages.length === 1 ? 'reply' : 'replies'}
                </Text>
              )}
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Create Ticket Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {t('submitSupportTicket') || 'Create Support Ticket'}
              </Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.foreground }]}>Subject *</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                  value={createSubject}
                  onChangeText={setCreateSubject}
                  placeholder="Enter ticket subject"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.foreground }]}>Message *</Text>
                <TextInput
                  style={[styles.formTextArea, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                  value={createMessage}
                  onChangeText={setCreateMessage}
                  placeholder="Describe your issue..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
              <View style={styles.formField}>
                <Pressable
                  onPress={() => handlePickImage(true)}
                  style={[styles.attachmentButton, { borderColor: colors.border }]}
                >
                  <Paperclip size={20} color={colors.primary} />
                  <Text style={[styles.attachmentButtonText, { color: colors.foreground }]}>
                    {createScreenshot ? 'Change Evidence' : 'Attach Evidence (Optional)'}
                  </Text>
                </Pressable>
                {createScreenshot && (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: createScreenshot.uri }} style={styles.previewImage} />
                    <Pressable
                      onPress={() => setCreateScreenshot(null)}
                      style={[styles.removeImageButton, { backgroundColor: colors.destructive }]}
                    >
                      <X size={16} color="#fff" />
                    </Pressable>
                  </View>
                )}
              </View>
            </ScrollView>
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.muted }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.foreground }]}>
                  {t('settings.cancel') || 'Cancel'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateTicket}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextWhite}>
                    {t('settings.save') || 'Create'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal
        visible={showTicketDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowTicketDetail(false);
          setSelectedTicket(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.detailModalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.detailHeaderLeft}>
                <Pressable
                  onPress={() => {
                    setShowTicketDetail(false);
                    setSelectedTicket(null);
                  }}
                >
                  <ChevronLeft size={24} color={colors.foreground} />
                </Pressable>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  {selectedTicket?.subject}
                </Text>
              </View>
              <View style={styles.detailHeaderRight}>
                {selectedTicket && (
                  <>
                    <Pressable
                      onPress={() => {
                        setEditSubject(selectedTicket.subject);
                        setEditMessage(selectedTicket.message);
                        setShowEditModal(true);
                      }}
                      style={styles.iconButton}
                    >
                      <Edit2 size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable
                      onPress={() => selectedTicket && handleDeleteTicket(selectedTicket)}
                      style={styles.iconButton}
                    >
                      <Trash2 size={20} color={colors.destructive} />
                    </Pressable>
                  </>
                )}
              </View>
            </View>
            <ScrollView style={styles.detailBody}>
              {selectedTicket && (
                <>
                  <View style={[styles.detailSection, { borderBottomColor: colors.border }]}>
                    <View style={styles.statusRow}>
                      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Status:</Text>
                      <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(selectedTicket.status)}20` }]}>
                        {getStatusIcon(selectedTicket.status)}
                        <Text style={[styles.statusText, { color: getStatusColor(selectedTicket.status) }]}>
                          {selectedTicket.status.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                      Created: {new Date(selectedTicket.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailMessage, { color: colors.foreground }]}>
                      {selectedTicket.message}
                    </Text>
                    {selectedTicket.screenshotPath && (
                      <View style={styles.imageContainer}>
                        <Image
                          source={{ uri: getImageUrl(selectedTicket.screenshotPath) || '' }}
                          style={styles.detailImage}
                          resizeMode="contain"
                        />
                      </View>
                    )}
                  </View>
                  {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                    <View style={styles.messagesSection}>
                      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Replies:</Text>
                      {selectedTicket.messages.map((message: TicketMessage) => (
                        <View key={message.id} style={[styles.messageCard, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                          <View style={styles.messageHeader}>
                            <Text style={[styles.messageAuthor, { color: colors.foreground }]}>
                              {message.user?.name || 'User'}
                            </Text>
                            <Text style={[styles.messageDate, { color: colors.mutedForeground }]}>
                              {new Date(message.createdAt).toLocaleString()}
                            </Text>
                          </View>
                          <Text style={[styles.messageText, { color: colors.foreground }]}>
                            {message.message}
                          </Text>
                          {message.attachmentPath && (
                            <View style={styles.imageContainer}>
                              <Image
                                source={{ uri: getImageUrl(message.attachmentPath) || '' }}
                                style={styles.detailImage}
                                resizeMode="contain"
                              />
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                  <Pressable
                    onPress={() => {
                      setReplyMessage('');
                      setReplyAttachment(null);
                      setShowReplyModal(true);
                    }}
                    style={[styles.replyButton, { backgroundColor: colors.primary }]}
                  >
                    <Send size={20} color="#fff" />
                    <Text style={styles.replyButtonText}>Reply</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Ticket Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Edit Ticket</Text>
              <Pressable onPress={() => setShowEditModal(false)}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.foreground }]}>Subject *</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                  value={editSubject}
                  onChangeText={setEditSubject}
                  placeholder="Enter ticket subject"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.foreground }]}>Message *</Text>
                <TextInput
                  style={[styles.formTextArea, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                  value={editMessage}
                  onChangeText={setEditMessage}
                  placeholder="Describe your issue..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.muted }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.foreground }]}>
                  {t('settings.cancel') || 'Cancel'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleUpdateTicket}
                disabled={editing}
              >
                {editing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextWhite}>
                    {t('settings.save') || 'Save'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reply Modal */}
      <Modal
        visible={showReplyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReplyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Reply to Ticket</Text>
              <Pressable onPress={() => setShowReplyModal(false)}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.foreground }]}>Message *</Text>
                <TextInput
                  style={[styles.formTextArea, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                  value={replyMessage}
                  onChangeText={setReplyMessage}
                  placeholder="Type your reply..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
              <View style={styles.formField}>
                <Pressable
                  onPress={() => handlePickImage(false)}
                  style={[styles.attachmentButton, { borderColor: colors.border }]}
                >
                  <Paperclip size={20} color={colors.primary} />
                  <Text style={[styles.attachmentButtonText, { color: colors.foreground }]}>
                    {replyAttachment ? 'Change Attachment' : 'Attach Evidence (Optional)'}
                  </Text>
                </Pressable>
                {replyAttachment && (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: replyAttachment.uri }} style={styles.previewImage} />
                    <Pressable
                      onPress={() => setReplyAttachment(null)}
                      style={[styles.removeImageButton, { backgroundColor: colors.destructive }]}
                    >
                      <X size={16} color="#fff" />
                    </Pressable>
                  </View>
                )}
              </View>
            </ScrollView>
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.muted }]}
                onPress={() => setShowReplyModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.foreground }]}>
                  {t('settings.cancel') || 'Cancel'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleReply}
                disabled={replying}
              >
                {replying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextWhite}>
                    {t('settings.save') || 'Send'}
                  </Text>
                )}
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
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyStateButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  ticketCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  ticketHeader: {
    marginBottom: 8,
  },
  ticketTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ticketSubject: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  ticketDate: {
    fontSize: 12,
  },
  ticketPreview: {
    fontSize: 14,
    marginBottom: 8,
  },
  ticketMessagesCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 20,
  },
  detailModalContent: {
    maxHeight: '95%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  detailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  detailHeaderRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  detailBody: {
    padding: 20,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  formTextArea: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 120,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  attachmentButtonText: {
    fontSize: 14,
  },
  imagePreview: {
    marginTop: 12,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    // backgroundColor set dynamically
  },
  submitButton: {
    // backgroundColor set dynamically
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextWhite: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  detailSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailMessage: {
    fontSize: 16,
    lineHeight: 24,
  },
  imageContainer: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  detailImage: {
    width: '100%',
    height: 200,
  },
  messagesSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  messageCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageDate: {
    fontSize: 12,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  replyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
