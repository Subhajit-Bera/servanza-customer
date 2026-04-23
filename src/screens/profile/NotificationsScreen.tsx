import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SectionList,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme';
import { userApi } from '../../api/client';
import type { Notification } from '../../types';

// Notification icon config by type
const NOTIFICATION_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; bgColor: string; iconColor: string }> = {
    BOOKING_ASSIGNED: { icon: 'person', bgColor: '#E0F7F4', iconColor: '#0D9488' },
    BOOKING_ACCEPTED: { icon: 'person', bgColor: '#E0F7F4', iconColor: '#0D9488' },
    BOOKING_STARTED: { icon: 'play-circle', bgColor: '#E8F5E9', iconColor: '#2E7D32' },
    BOOKING_COMPLETED: { icon: 'checkmark-circle', bgColor: '#E8F5E9', iconColor: '#2E7D32' },
    BOOKING_CANCELLED: { icon: 'close-circle', bgColor: '#FFEBEE', iconColor: '#C62828' },
    BOOKING_CREATED: { icon: 'calendar', bgColor: '#E3F2FD', iconColor: '#1565C0' },
    PAYMENT_RECEIVED: { icon: 'card', bgColor: '#F3E5F5', iconColor: '#6A1B9A' },
    RATING_RECEIVED: { icon: 'star', bgColor: '#FFF8E1', iconColor: '#F9A825' },
    PROMO: { icon: 'pricetag', bgColor: '#FFF3E0', iconColor: '#E65100' },
    PROFILE_UPDATE: { icon: 'information-circle', bgColor: '#ECEFF1', iconColor: '#546E7A' },
    DEFAULT: { icon: 'notifications', bgColor: '#ECEFF1', iconColor: '#546E7A' },
};

interface NotificationSection {
    title: string;
    data: Notification[];
}

const NotificationsScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch notifications
    const fetchNotifications = useCallback(async (pageNum: number, refresh = false) => {
        try {
            if (refresh) setIsRefreshing(true);
            else if (pageNum === 1) setIsLoading(true);

            const { data: responseData } = await userApi.getNotifications(pageNum, 20);
            
            // Backend returns: { success: true, data: { notifications: [...], pagination: {...} } }
            const payload = responseData?.data || responseData;
            const newNotifications = Array.isArray(payload) 
                ? payload 
                : (payload?.notifications || payload?.data || []);
            const pagination = payload?.pagination;

            const notifArray = Array.isArray(newNotifications) ? newNotifications : [];

            if (refresh || pageNum === 1) {
                setNotifications(notifArray);
                setUnreadCount(notifArray.filter((n: Notification) => !n.isRead).length);
            } else {
                setNotifications(prev => {
                    const merged = [...prev, ...notifArray];
                    setUnreadCount(merged.filter((n: Notification) => !n.isRead).length);
                    return merged;
                });
            }

            if (pagination) {
                setHasMore(pagination.page < pagination.pages);
            } else {
                setHasMore(notifArray.length === 20);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications(1);
    }, []);

    // Refresh handler
    const handleRefresh = () => {
        setPage(1);
        fetchNotifications(1, true);
    };

    // Load more
    const handleLoadMore = () => {
        if (!isLoading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchNotifications(nextPage);
        }
    };

    // Mark as read and navigate
    const handleNotificationPress = async (notification: Notification) => {
        try {
            if (!notification.isRead) {
                await userApi.markNotificationRead(notification.id);
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            // Navigate based on notification type
            if (notification.data?.bookingId) {
                navigation.navigate('BookingsTab', {
                    screen: 'BookingDetail',
                    params: { bookingId: notification.data.bookingId },
                });
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    // Mark all as read
    const handleMarkAllRead = async () => {
        try {
            await userApi.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    // Get config for notification type
    const getConfig = (type: string) => {
        return NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.DEFAULT;
    };

    // Format time display
    const formatTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        // For older, show time
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
    };

    // Check if a date is today/yesterday
    const isToday = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isYesterday = (dateString: string) => {
        const date = new Date(dateString);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return date.toDateString() === yesterday.toDateString();
    };

    // Group notifications by date
    const groupedSections: NotificationSection[] = (() => {
        const groups: Record<string, Notification[]> = {};

        notifications.forEach((n) => {
            let key: string;
            if (isToday(n.createdAt)) {
                key = 'Today';
            } else if (isYesterday(n.createdAt)) {
                key = 'Yesterday';
            } else {
                const date = new Date(n.createdAt);
                key = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            }
            if (!groups[key]) groups[key] = [];
            groups[key].push(n);
        });

        return Object.entries(groups).map(([title, data]) => ({ title, data }));
    })();

    // Render notification item
    const renderNotification = ({ item }: { item: Notification }) => {
        const config = getConfig(item.type);
        const isUnread = !item.isRead;
        const timeColor = isUnread ? COLORS.primary : COLORS.textLight;

        return (
            <TouchableOpacity
                style={[styles.notificationCard, isUnread && styles.unreadCard]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
                    <Ionicons name={config.icon} size={22} color={config.iconColor} />
                </View>
                <View style={styles.contentContainer}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.title, isUnread && styles.unreadTitle]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text style={[styles.time, { color: timeColor }]}>
                            {formatTime(item.createdAt)}
                        </Text>
                    </View>
                    <Text style={styles.body} numberOfLines={2}>
                        {item.body}
                    </Text>
                </View>
                {isUnread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    // Render section header
    const renderSectionHeader = ({ section }: { section: NotificationSection }) => (
        <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
            <View style={styles.sectionHeaderLine} />
        </View>
    );

    // Empty state
    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color={COLORS.lightGray} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>You're all caught up!</Text>
        </View>
    );

    // Footer loader
    const renderFooter = () => {
        if (!hasMore) return null;
        return (
            <View style={styles.footer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
                {unreadCount > 0 ? (
                    <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
                        <Text style={styles.markAllText}>Mark all as read</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.headerRight} />
                )}
            </View>

            {/* Content */}
            {isLoading && page === 1 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : notifications.length === 0 ? (
                renderEmpty()
            ) : (
                <SectionList
                    sections={groupedSections}
                    keyExtractor={(item) => item.id}
                    renderItem={renderNotification}
                    renderSectionHeader={renderSectionHeader}
                    contentContainerStyle={styles.list}
                    ListFooterComponent={renderFooter}
                    stickySectionHeadersEnabled={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            colors={[COLORS.primary]}
                            tintColor={COLORS.primary}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.offWhite,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.md,
        backgroundColor: COLORS.offWhite,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
    },
    headerRight: {
        width: 80,
    },
    markAllButton: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
    },
    markAllText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    // Section headers
    sectionHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.md,
    },
    sectionHeaderText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textSecondary,
        marginRight: SPACING.md,
    },
    sectionHeaderLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    // Notification cards
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        alignItems: 'flex-start',
        ...SHADOWS.light,
    },
    unreadCard: {
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    contentContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.charcoal,
        flex: 1,
        marginRight: SPACING.sm,
    },
    unreadTitle: {
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
    time: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
    },
    body: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.mediumGray,
        lineHeight: 20,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        marginLeft: SPACING.sm,
        marginTop: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
        marginTop: SPACING.lg,
    },
    emptySubtitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.mediumGray,
        marginTop: 8,
    },
    footer: {
        paddingVertical: SPACING.lg,
        alignItems: 'center',
    },
});

export default NotificationsScreen;
