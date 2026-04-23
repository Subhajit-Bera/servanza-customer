import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import dayjs from 'dayjs';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { fetchBookingById, cancelBooking } from '../../store/slices/bookingsSlice';
import type { BookingsStackParamList } from '../../navigation/MainNavigator';
import type { BookingStatus } from '../../types';

type BookingDetailRouteProp = RouteProp<BookingsStackParamList, 'BookingDetail'>;
type BookingDetailNavigationProp = StackNavigationProp<BookingsStackParamList, 'BookingDetail'>;

const getStatusConfig = (status: BookingStatus) => {
    switch (status) {
        case 'PENDING': return { color: COLORS.warning, label: 'Pending Assignment' };
        case 'ASSIGNED': return { color: COLORS.info, label: 'Buddy Assigned' };
        case 'ON_WAY': return { color: COLORS.primary, label: 'Buddy On The Way' };
        case 'ARRIVED': return { color: COLORS.primary, label: 'Buddy Arrived' };
        case 'IN_PROGRESS': return { color: COLORS.darkGreen, label: 'Service In Progress' };
        case 'COMPLETED': return { color: COLORS.success, label: 'Service Completed' };
        case 'CANCELLED': return { color: COLORS.error, label: 'Booking Cancelled' };
        default: return { color: COLORS.mediumGray, label: status };
    }
};

const BookingDetailScreen: React.FC = () => {
    const navigation = useNavigation<BookingDetailNavigationProp>();
    const route = useRoute<BookingDetailRouteProp>();
    const dispatch = useAppDispatch();

    const { bookingId } = route.params;
    const { selectedBooking: booking, loading } = useAppSelector((state: RootState) => state.bookings);

    useEffect(() => {
        dispatch(fetchBookingById(bookingId));
    }, [bookingId]);

    const handleTrackBuddy = () => {
        navigation.navigate('TrackBuddy', { bookingId });
    };

    const handleReview = () => {
        navigation.navigate('Review', { bookingId });
    };

    const handleCancel = () => {
        Alert.alert(
            'Cancel Booking',
            'Are you sure you want to cancel this booking?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(cancelBooking({ id: bookingId })).unwrap();
                            Alert.alert('Success', 'Booking cancelled successfully');
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to cancel booking');
                        }
                    },
                },
            ]
        );
    };

    if (loading || !booking) {
        return (
            <SafeAreaView style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    const statusConfig = getStatusConfig(booking.status);
    const canTrack = ['ON_WAY', 'ARRIVED'].includes(booking.status);
    const canCancel = ['PENDING', 'ASSIGNED'].includes(booking.status);
    const canReview = booking.status === 'COMPLETED' && !booking.review;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.charcoal} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Details</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Status Card */}
                <View style={[styles.statusCard, { backgroundColor: statusConfig.color + '15' }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                    </Text>
                </View>

                {/* Service Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Service</Text>
                    <View style={styles.infoCard}>
                        <Text style={styles.serviceName}>{booking.service?.title || 'Service'}</Text>
                        <View style={styles.serviceDetails}>
                            <View style={styles.detailRow}>
                                <Ionicons name="calendar-outline" size={16} color={COLORS.mediumGray} />
                                <Text style={styles.detailText}>
                                    {dayjs(booking.scheduledStart).format('ddd, MMM D, YYYY')}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Ionicons name="time-outline" size={16} color={COLORS.mediumGray} />
                                <Text style={styles.detailText}>
                                    {dayjs(booking.scheduledStart).format('h:mm A')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Address */}
                {booking.address && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Service Location</Text>
                        <View style={styles.infoCard}>
                            <View style={styles.addressRow}>
                                <Ionicons name="location" size={20} color={COLORS.primary} />
                                <View style={styles.addressInfo}>
                                    <Text style={styles.addressLabel}>{booking.address.label}</Text>
                                    <Text style={styles.addressText}>{booking.address.formattedAddress}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Buddy Info */}
                {booking.buddy && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Your Buddy</Text>
                        <View style={styles.infoCard}>
                            <View style={styles.buddyRow}>
                                <View style={styles.buddyAvatar}>
                                    <Ionicons name="person" size={24} color={COLORS.primary} />
                                </View>
                                <View style={styles.buddyInfo}>
                                    <Text style={styles.buddyName}>{booking.buddy.name}</Text>
                                    <View style={styles.ratingRow}>
                                        <Ionicons name="star" size={14} color={COLORS.warning} />
                                        <Text style={styles.ratingText}>
                                            {booking.buddy.avgRating?.toFixed(1) || 'New'}
                                        </Text>
                                    </View>
                                </View>
                                {canTrack && (
                                    <TouchableOpacity
                                        style={styles.trackButton}
                                        onPress={handleTrackBuddy}
                                    >
                                        <Ionicons name="navigate" size={16} color={COLORS.white} />
                                        <Text style={styles.trackButtonText}>Track</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                )}

                {/* Payment Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Summary</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Service Charge</Text>
                            <Text style={styles.summaryValue}>₹{booking.price}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tax (GST)</Text>
                            <Text style={styles.summaryValue}>₹{booking.taxAmount}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>₹{booking.totalAmount}</Text>
                        </View>
                        <View style={[styles.paymentStatus, {
                            backgroundColor: booking.paymentStatus === 'PAID' ? COLORS.success + '20' : COLORS.warning + '20'
                        }]}>
                            <Ionicons
                                name={booking.paymentStatus === 'PAID' ? 'checkmark-circle' : 'time'}
                                size={16}
                                color={booking.paymentStatus === 'PAID' ? COLORS.success : COLORS.warning}
                            />
                            <Text style={[styles.paymentStatusText, {
                                color: booking.paymentStatus === 'PAID' ? COLORS.success : COLORS.warning
                            }]}>
                                {booking.paymentStatus === 'PAID' ? 'Payment Completed' : 'Payment Pending'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Booking ID */}
                <View style={styles.section}>
                    <View style={styles.bookingIdCard}>
                        <Text style={styles.bookingIdLabel}>Booking ID</Text>
                        <Text style={styles.bookingIdValue}>{booking.id.slice(0, 8).toUpperCase()}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Action Buttons */}
            {(canCancel || canReview) && (
                <View style={styles.bottomBar}>
                    {canCancel && (
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancel}
                        >
                            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                        </TouchableOpacity>
                    )}
                    {canReview && (
                        <TouchableOpacity
                            style={styles.reviewButton}
                            onPress={handleReview}
                        >
                            <Ionicons name="star" size={20} color={COLORS.white} />
                            <Text style={styles.reviewButtonText}>Rate & Review</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.offWhite,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.offWhite,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
    },
    headerRight: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.lg,
        paddingBottom: 100,
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.lg,
        gap: SPACING.md,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    statusText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    section: {
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.darkGray,
        marginBottom: SPACING.sm,
    },
    infoCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        ...SHADOWS.light,
    },
    serviceName: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
        marginBottom: SPACING.md,
    },
    serviceDetails: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.darkGray,
    },
    addressRow: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    addressInfo: {
        flex: 1,
    },
    addressLabel: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.charcoal,
        marginBottom: 4,
    },
    addressText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.mediumGray,
        lineHeight: 20,
    },
    buddyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    buddyAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.lightGreen,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buddyInfo: {
        flex: 1,
    },
    buddyName: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.charcoal,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    ratingText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.darkGray,
    },
    trackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.md,
        gap: 6,
    },
    trackButtonText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.white,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.darkGray,
    },
    summaryValue: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.charcoal,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.lightGray,
        marginVertical: SPACING.md,
    },
    totalLabel: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
    },
    totalValue: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
    },
    paymentStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        marginTop: SPACING.md,
        gap: 8,
    },
    paymentStatusText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    bookingIdCard: {
        backgroundColor: COLORS.offWhite,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
    },
    bookingIdLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.mediumGray,
        marginBottom: 4,
    },
    bookingIdValue: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.charcoal,
        letterSpacing: 1,
    },
    bottomBar: {
        flexDirection: 'row',
        gap: SPACING.md,
        padding: SPACING.lg,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
        ...SHADOWS.medium,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 2,
        borderColor: COLORS.coral,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.coral,
    },
    reviewButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.lg,
        gap: 8,
        ...SHADOWS.green,
    },
    reviewButtonText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.white,
    },
});

export default BookingDetailScreen;
