import React, { useEffect, useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Image,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import dayjs from 'dayjs';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS, formatCurrency } from '../../theme';
import { orderApi } from '../../api/client';
import type { BookingsStackParamList } from '../../navigation/MainNavigator';

type MyBookingsNavigationProp = StackNavigationProp<BookingsStackParamList, 'MyBookings'>;

const STATUS_FILTERS = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
];

const getAggregateStatusConfig = (bookings: any[]) => {
    if (!bookings || bookings.length === 0) return { color: COLORS.mediumGray, label: 'Unknown', bg: COLORS.inputBackground };
    
    // Logic for aggregate status
    const hasInProgress = bookings.some(b => b.status === 'IN_PROGRESS' || b.status === 'ON_WAY' || b.status === 'ARRIVED');
    const allCompleted = bookings.every(b => b.status === 'COMPLETED');
    const allCancelled = bookings.every(b => b.status === 'CANCELLED');
    
    if (hasInProgress) return { color: COLORS.darkGreen, label: 'In Progress', bg: COLORS.success + '15' };
    if (allCompleted) return { color: COLORS.success, label: 'Completed', bg: COLORS.success + '15' };
    if (allCancelled) return { color: COLORS.error, label: 'Cancelled', bg: COLORS.error + '15' };
    return { color: COLORS.warning, label: 'Pending', bg: COLORS.warning + '15' };
};

const MyBookingsScreen: React.FC = () => {
    const navigation = useNavigation<MyBookingsNavigationProp>();
    
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');

    useFocusEffect(
        useCallback(() => {
            loadOrders();
        }, [statusFilter])
    );

    const loadOrders = async () => {
        try {
            setLoading(true);
            const params = statusFilter !== 'ALL' ? { status: statusFilter } : {};
            const response = await orderApi.getOrders(params);
            setOrders(response.data.data.orders || []);
        } catch (error) {
            console.error('Failed to load orders', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadOrders();
        setRefreshing(false);
    }, [statusFilter]);

    const handleOrderPress = (orderId: string, bookings: any[]) => {
        if (bookings.length === 1) {
            navigation.navigate('BookingDetail', { bookingId: bookings[0].id });
        } else {
            // Ideally we'd navigate to an OrderDetail screen, but for now we'll just navigate to the first booking detail
            // OR we can leave it to BookingDetail to fetch Order if we pass orderId. For now, navigate to first booking:
            navigation.navigate('BookingDetail', { bookingId: bookings[0].id });
        }
    };

    const renderOrder = ({ item }: { item: any }) => {
        const bookings = item.bookings || [];
        const statusConfig = getAggregateStatusConfig(bookings);
        const formattedDate = dayjs(item.scheduledStart || item.createdAt).format('MMM D, YYYY • h:mm A');
        
        let items = [];
        try {
            const rawMetadata = bookings[0]?.metadata;
            if (rawMetadata) {
                if (typeof rawMetadata === 'string') {
                    items = JSON.parse(rawMetadata).items || [];
                } else {
                    items = rawMetadata.items || [];
                }
            }
        } catch (e) {
            console.warn("Failed to parse metadata", e);
        }
        
        const hasMultiple = items.length > 1;
        
        const displayTitle = hasMultiple 
            ? `${items[0]?.title} +${items.length - 1} more`
            : items[0]?.title || 'Service Booking';

        const buddy = bookings[0]?.assignments?.[0]?.buddy;

        return (
            <TouchableOpacity
                style={styles.bookingCard}
                onPress={() => handleOrderPress(item.id, bookings)}
                activeOpacity={0.9}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.orderIdText}>{item.orderNumber}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                            {statusConfig.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.imageContainer}>
                        {hasMultiple ? (
                            <View style={styles.multiImageWrapper}>
                                {items.slice(0, 2).map((item: any, index: number) => (
                                    <Image
                                        key={index}
                                        source={{ uri: item.imageUrl }}
                                        style={[
                                            styles.serviceImage,
                                            styles.overlappingImage,
                                            index > 0 && { marginLeft: -15, zIndex: 2 - index }
                                        ]}
                                    />
                                ))}
                                {items.length > 2 && (
                                    <View style={[styles.serviceImage, styles.moreBadge, { marginLeft: -15, zIndex: 0 }]}>
                                        <Text style={styles.moreBadgeText}>+{items.length - 2}</Text>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <Image 
                                source={{ uri: items[0]?.imageUrl || bookings[0]?.service?.imageUrl }} 
                                style={styles.serviceImage} 
                            />
                        )}
                    </View>

                    <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName} numberOfLines={2}>
                            {displayTitle}
                        </Text>
                        <Text style={styles.bookingDate}>
                            {formattedDate}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {buddy && (
                    <View style={styles.buddyRow}>
                        <View style={styles.buddyAvatar}>
                            {buddy.user?.profileImage ? (
                                <Image source={{ uri: buddy.user.profileImage }} style={styles.buddyImage} />
                            ) : (
                                <Ionicons name="person" size={20} color={COLORS.primary} />
                            )}
                        </View>
                        <View style={styles.buddyInfo}>
                            <Text style={styles.buddyName}>{buddy.user?.name || buddy.name}</Text>
                            <Text style={styles.buddyStatus}>Assigned Buddy</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.callButton}
                            onPress={() => navigation.navigate('VoiceCall', { bookingId: bookings[0]?.id, buddyName: buddy.user?.name || buddy.name })}
                        >
                            <Ionicons name="call" size={18} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                )}

                {buddy && <View style={styles.divider} />}

                <View style={styles.cardFooter}>
                    <View>
                        <Text style={styles.priceLabel}>Total Amount</Text>
                        <Text style={styles.price}>{formatCurrency(item.totalAmount)}</Text>
                    </View>
                    <TouchableOpacity 
                        style={[styles.actionButton, statusConfig.label === 'In Progress' && styles.actionButtonSolid]}
                        onPress={() => handleOrderPress(item.id, bookings)}
                    >
                        <Text style={[styles.actionButtonText, statusConfig.label === 'In Progress' && styles.actionButtonTextSolid]}>
                            View Details
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Bookings</Text>
            </View>

            <View style={styles.wrapper}>
                <View style={styles.filtersContainer}>
                    <FlatList
                        horizontal
                        data={STATUS_FILTERS}
                        keyExtractor={(item) => item.value}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.filterChip,
                                    statusFilter === item.value && styles.filterChipActive,
                                ]}
                                onPress={() => setStatusFilter(item.value)}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    statusFilter === item.value && styles.filterChipTextActive,
                                ]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        )}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filtersList}
                    />
                </View>

                {loading && !refreshing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={orders}
                        keyExtractor={(item) => item.id}
                        renderItem={renderOrder}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconContainer}>
                                    <Ionicons name="calendar-outline" size={48} color={COLORS.primary} />
                                </View>
                                <Text style={styles.emptyTitle}>No bookings found</Text>
                                <Text style={styles.emptyText}>
                                    You haven't made any bookings in this category yet.
                                </Text>
                                <TouchableOpacity
                                    style={styles.browseButton}
                                    onPress={() => navigation.getParent()?.navigate('HomeTab')}
                                >
                                    <Text style={styles.browseButtonText}>Browse Services</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.lg,
        backgroundColor: COLORS.white,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize.xxl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    wrapper: {
        flex: 1,
    },
    filtersContainer: {
        backgroundColor: COLORS.white,
        paddingBottom: SPACING.md,
    },
    filtersList: {
        paddingHorizontal: SPACING.lg,
        gap: SPACING.sm,
    },
    filterChip: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: COLORS.inputBackground,
        marginRight: SPACING.xs,
        borderWidth: 1,
        borderColor: COLORS.inputBackground,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterChipText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textSecondary,
    },
    filterChipTextActive: {
        color: COLORS.white,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: SPACING.lg,
        paddingBottom: 100,
    },
    bookingCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.light,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    orderIdText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.sm,
    },
    statusText: {
        fontSize: 10,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        textTransform: 'uppercase',
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    imageContainer: {
        marginRight: SPACING.md,
    },
    multiImageWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    overlappingImage: {
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    moreBadge: {
        backgroundColor: COLORS.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    moreBadgeText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textSecondary,
    },
    imageWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: COLORS.white,
        backgroundColor: COLORS.white,
        overflow: 'hidden',
    },
    serviceImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        resizeMode: 'cover',
    },
    serviceImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    serviceInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    serviceName: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    bookingDate: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginVertical: SPACING.sm,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.sm,
    },
    priceLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    price: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    actionButtonSolid: {
        backgroundColor: COLORS.primary,
    },
    actionButtonText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
    },
    actionButtonTextSolid: {
        color: COLORS.white,
    },
    buddyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    buddyAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
        overflow: 'hidden',
    },
    buddyImage: {
        width: '100%',
        height: '100%',
    },
    buddyInfo: {
        flex: 1,
    },
    buddyName: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
    },
    buddyStatus: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    callButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        maxWidth: '80%',
    },
    browseButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        ...SHADOWS.green,
    },
    browseButtonText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.white,
    },
});

export default MyBookingsScreen;
