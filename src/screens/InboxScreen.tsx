import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Bell,
  Calendar,
  TrendingUp,
  AlertCircle,
  DollarSign,
  CheckCircle,
  Trash2,
  CheckCheck,
} from 'lucide-react-native';
import { notificationsService } from '../api/services/notifications';
import { Notification } from '../api/types/notification';
import { formatDateForDisplay } from '../api/utils/dateUtils';
import { useTheme } from '../contexts/ThemeContext';
import { textStyles, createResponsiveTextStyles } from '../constants/fonts';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { showToast } from '../utils/toast';

interface InboxScreenProps {
  onBack: () => void;
}

export default function InboxScreen({ onBack }: InboxScreenProps) {
  const { t, i18n } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsService.getNotifications({ per_page: 100 });
      const notificationsList = response.data || [];
      setNotifications(notificationsList);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      showToast.error(t('inbox.failedToLoad') || 'Failed to load notifications', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsService.markAsRead(id);
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
      showToast.error(t('inbox.errorMarkingRead') || 'Failed to mark as read', 'Error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await notificationsService.markAllAsRead();
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      showToast.error(t('inbox.errorMarkingAllRead') || 'Failed to mark all as read', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      t('common.delete') || 'Delete',
      t('inbox.confirmDelete') || 'Are you sure you want to delete this notification?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(id);
              await notificationsService.deleteNotification(id);
              await loadNotifications();
            } catch (error) {
              console.error('Failed to delete:', error);
              showToast.error(t('inbox.errorDeleting') || 'Failed to delete notification', 'Error');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.is_read;
    if (filter === 'read') return notif.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'recurring_payment':
        return <Calendar size={20} color="#FFC107" />;
      case 'transaction_limit':
        return <AlertCircle size={20} color="#FF5252" />;
      case 'pro_expiration':
        return <AlertCircle size={20} color="#FF9800" />;
      case 'referral_reward':
        return <TrendingUp size={20} color="#4CAF50" />;
      case 'investment_reminder':
        return <DollarSign size={20} color="#03A9F4" />;
      default:
        return <Bell size={20} color="#03A9F4" />;
    }
  };

  const getIconBgColor = (type: string) => {
    switch (type) {
      case 'recurring_payment':
        return '#FFC107' + '1A';
      case 'transaction_limit':
        return '#FF5252' + '1A';
      case 'pro_expiration':
        return '#FF9800' + '1A';
      case 'referral_reward':
        return '#4CAF50' + '1A';
      case 'investment_reminder':
        return '#03A9F4' + '1A';
      default:
        return '#03A9F4' + '1A';
    }
  };

  const formatNotificationTime = (dateString: string | undefined | null) => {
    if (!dateString) {
      return t('inbox.justNow');
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return t('inbox.justNow');
      }

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return t('inbox.justNow');
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return t('inbox.minutesAgo', { count: minutes });
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return t('inbox.hoursAgo', { count: hours });
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return t('inbox.daysAgo', { count: days });
      } else {
        return formatDateForDisplay(dateString, i18n.language);
      }
    } catch (error) {
      console.error('Error formatting notification time:', error);
      return t('inbox.justNow');
    }
  };

  const responsiveTextStyles = createResponsiveTextStyles(width);
  


  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>
              {t('inbox.title')}
            </Text>
            {unreadCount > 0 && (
              <Text style={[styles.headerSubtitle, responsiveTextStyles.bodySmall, { color: colors.mutedForeground }]}>
                {t('inbox.unreadCount', { count: unreadCount })}
              </Text>
            )}
          </View>
          {unreadCount > 0 && (
            <Pressable
              onPress={handleMarkAllAsRead}
              disabled={loading}
              style={({ pressed }) => [
                styles.markAllButton,
                { backgroundColor: colors.muted, borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <CheckCheck size={16} color={colors.foreground} />
            </Pressable>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={[styles.filterTabs, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => setFilter('all')}
            style={({ pressed }) => [
              styles.filterTab,
              filter === 'all' && { borderBottomColor: colors.primary },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                responsiveTextStyles.bodySmall,
                { color: filter === 'all' ? colors.primary : colors.mutedForeground },
              ]}
            >
              {t('inbox.all')} ({notifications.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter('unread')}
            style={({ pressed }) => [
              styles.filterTab,
              filter === 'unread' && { borderBottomColor: colors.primary },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                responsiveTextStyles.bodySmall,
                { color: filter === 'unread' ? colors.primary : colors.mutedForeground },
              ]}
            >
              {t('inbox.unread')} ({unreadCount})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter('read')}
            style={({ pressed }) => [
              styles.filterTab,
              filter === 'read' && { borderBottomColor: colors.primary },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                responsiveTextStyles.bodySmall,
                { color: filter === 'read' ? colors.primary : colors.mutedForeground },
              ]}
            >
              {t('inbox.read')} ({notifications.length - unreadCount})
            </Text>
          </Pressable>
        </View>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.muted }]}>
              <Bell size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, responsiveTextStyles.h4, { color: colors.foreground }]}>
              {filter === 'unread'
                ? t('inbox.noUnreadNotifications')
                : filter === 'read'
                  ? t('inbox.noReadNotifications')
                  : t('inbox.noNotifications')}
            </Text>
            <Text style={[styles.emptyText, responsiveTextStyles.bodySmall, { color: colors.mutedForeground }]}>
              {t('inbox.noNotificationsDescription')}
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {filteredNotifications.map((notification) => (
              <View
                key={notification.id}
                style={[
                  styles.notificationCard,
                  {
                    backgroundColor: !notification.is_read ? colors.accent : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.notificationContent}>
                  {/* Icon */}
                  <View
                    style={[
                      styles.notificationIcon,
                      { backgroundColor: getIconBgColor(notification.type) },
                    ]}
                  >
                    {getIcon(notification.type)}
                  </View>

                  {/* Content */}
                  <View style={styles.notificationTextContainer}>
                    <View style={styles.notificationHeader}>
                      <Text
                        style={[
                          styles.notificationTitle,
                          responsiveTextStyles.body,
                          { color: colors.foreground },
                        ]}
                      >
                        {notification.title}
                      </Text>
                      {!notification.is_read && (
                        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.notificationMessage,
                        responsiveTextStyles.bodySmall,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {notification.message}
                    </Text>
                    <View style={[styles.notificationFooter, { borderTopColor: colors.border }]}>
                      <Text
                        style={[
                          styles.notificationTime,
                          responsiveTextStyles.caption,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {formatNotificationTime(notification.created_at || notification.updated_at || '')}
                      </Text>
                      <View style={styles.notificationActions}>
                        {!notification.is_read && (
                          <Pressable
                            onPress={() => handleMarkAsRead(notification.id)}
                            style={({ pressed }) => [
                              styles.actionButton,
                              { backgroundColor: colors.muted },
                              pressed && { opacity: 0.7 },
                            ]}
                          >
                            <CheckCircle size={14} color={colors.primary} />
                            <Text
                              style={[
                                styles.actionButtonText,
                                responsiveTextStyles.caption,
                                { color: colors.primary },
                              ]}
                            >
                              {t('inbox.markAsRead')}
                            </Text>
                          </Pressable>
                        )}
                        <Pressable
                          onPress={() => handleDelete(notification.id)}
                          disabled={deletingId === notification.id}
                          style={({ pressed }) => [
                            styles.actionButton,
                            { backgroundColor: colors.muted },
                            pressed && { opacity: 0.7 },
                          ]}
                        >
                          <Trash2 size={14} color={colors.destructive} />
                          <Text
                            style={[
                              styles.actionButtonText,
                              responsiveTextStyles.caption,
                              { color: colors.destructive },
                            ]}
                          >
                            {t('inbox.delete')}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...textStyles.h3,
  },
  headerSubtitle: {
    marginTop: 2,
  },
  markAllButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  filterTabText: {
    ...textStyles.label,
    fontWeight: '600',
  },
  emptyState: {
    margin: 16,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    ...textStyles.h4,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    ...textStyles.bodySmall,
    textAlign: 'center',
  },
  notificationsList: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  notificationContent: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    ...textStyles.body,
    flex: 1,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  notificationMessage: {
    ...textStyles.bodySmall,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  notificationTime: {
    ...textStyles.caption,
    fontWeight: '500',
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionButtonText: {
    ...textStyles.caption,
    fontWeight: '600',
  },
});

