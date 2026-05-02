import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import dayjs from 'dayjs';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS, formatCurrency } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchBookings, setStatusFilter } from '../../store/slices/bookingsSlice';
import type { BookingsStackParamList } from '../../navigation/MainNavigator';
import type { Booking, BookingStatus } from '../../types';

type MyBookingsNavigationProp = StackNavigationProp<BookingsStackParamList, 'MyBookings'>;

const STATUS_FILTERS: { label: string; value: BookingStatus | 'ALL' }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Active', value: 'PENDING' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
];

const getStatusConfig = (status: BookingStatus) => {
    switch (status) {
        case 'PENDING':
            return { color: COLORS.warning, label: 'Pending', icon: 'time' };
        case 'ASSIGNED':
            return { color: COLORS.info, label: 'Assigned', icon: 'person' };
        case 'ON_WAY':
            return { color: COLORS.primary, label: 'On the way', icon: 'navigate' };
        case 'ARRIVED':
            return { color: COLORS.primary, label: 'Arrived', icon: 'checkmark-circle' };
        case 'IN_PROGRESS':
            return { color: COLORS.darkGreen, label: 'In Progress', icon: 'construct' };
        case 'COMPLETED':
            return { color: COLORS.success, label: 'Completed', icon: 'checkmark-done' };
        case 'CANCELLED':
            return { color: COLORS.error, label: 'Cancelled', icon: 'close-circle' };
        default:
            return { color: COLORS.mediumGray, label: status, icon: 'help' };
    }
};

const MyBookingsScreen: React.FC = () => {
    const navigation = useNavigation<MyBookingsNavigationProp>();
    const dispatch = useAppDispatch();

    const { bookings, loading, statusFilter } = useAppSelector((state) => state.bookings);
    const [refreshing, setRefreshing] = React.useState(false);

    // Reload bookings every time the screen gains focus (tab switch, back nav, etc.)
    useFocusEffect(
        useCallback(() => {
            loadBookings();
        }, [statusFilter])
    );

    const loadBookings = () => {
        const params = statusFilter !== 'ALL' ? { status: statusFilter } : {};
        dispatch(fetchBookings(params));
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadBookings();
        setRefreshing(false);
    }, [statusFilter]);

    const handleBookingPress = (bookingId: string) => {
        navigation.navigate('BookingDetail', { bookingId });
    };

    const renderBooking = ({ item }: { item: Booking }) => {
        const statusConfig = getStatusConfig(item.status);
        const formattedDate = dayjs(item.scheduledStart || item.createdAt).format('MMM D, YYYY • h:mm A');

        return (
            <TouchableOpacity
                style={styles.bookingCard}
                onPress={() => handleBookingPress(item.id)}
                activeOpacity={0.9}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.serviceRow}>
                        <View style={styles.serviceIcon}>
                            <Ionicons name="construct" size={20} color={COLORS.primary} />
                        </View>
                        <View style={styles.serviceInfo}>
                            <Text style={styles.serviceName} numberOfLines={1}>
                                {item.service?.title || 'Service'}
                            </Text>
                            <Text style={styles.bookingDate}>
                                {formattedDate}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '15' }]}>
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                            {statusConfig.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardContent}>
                    {item.address && (
                        <View style={styles.detailRow}>
                            <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
                            <Text style={styles.addressText} numberOfLines={1}>
                                {item.address.formattedAddress}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.price}>{formatCurrency(item.totalAmount)}</Text>
                    <View style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>View Details</Text>
                        <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Bookings</Text>
                {/* <TouchableOpacity style={styles.historyButton}>
                    <Ionicons name="time-outline" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity> */}
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
                                onPress={() => dispatch(setStatusFilter(item.value))}
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
                        data={bookings}
                        keyExtractor={(item) => item.id}
                        renderItem={renderBooking}
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
    historyButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
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
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
    },
    serviceRow: {
        flexDirection: 'row',
        gap: SPACING.md,
        flex: 1,
    },
    serviceIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
        marginBottom: 2,
    },
    bookingDate: {
        fontSize: TYPOGRAPHY.fontSize.xs,
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
    divider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginVertical: SPACING.sm,
    },
    cardContent: {
        marginVertical: SPACING.sm,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    addressText: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.md,
        paddingTop: SPACING.sm,
    },
    price: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BORDER_RADIUS.lg,
    },
    actionButtonText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
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
