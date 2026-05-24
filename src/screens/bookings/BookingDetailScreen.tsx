import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Linking,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import dayjs from 'dayjs';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useBookingStatus } from '../../hooks/useSocket';
import type { RootState } from '../../store';
import { fetchBookingById, cancelBooking } from '../../store/slices/bookingsSlice';
import BookingDetailSkeleton from '../../components/skeletons/BookingDetailSkeleton';
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
    const { lastUpdate } = useBookingStatus(bookingId);

    useEffect(() => {
        dispatch(fetchBookingById(bookingId));
    }, [bookingId, lastUpdate]);

    const handleTrackBuddy = () => {
        navigation.navigate('TrackBuddy', { bookingId });
    };

    const handleReview = () => {
        const existingReview = booking?.review ?? (booking as any)?.reviews?.[0] ?? null;
        navigation.navigate('Review', { bookingId, existingReview: existingReview ?? undefined });
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
        return <BookingDetailSkeleton />;
    }

    const STEPS = [
        { id: 'PENDING', label: 'Confirmed', icon: 'checkmark-circle' },
        { id: 'ASSIGNED', label: 'Assigned', icon: 'person' },
        { id: 'ON_WAY', label: 'On the way', icon: 'bicycle' },
        { id: 'IN_PROGRESS', label: 'In Progress', icon: 'construct' },
        { id: 'COMPLETED', label: 'Completed', icon: 'star' },
    ];

    const getStepIndex = (status: BookingStatus) => {
        switch (status) {
            case 'PENDING': case 'QUEUED': return 0;
            case 'ASSIGNED': case 'ACCEPTED': return 1;
            case 'ON_WAY': case 'ARRIVED': return 2;
            case 'IN_PROGRESS': return 3;
            case 'COMPLETED': return 4;
            default: return 0;
        }
    };

    const currentStepIndex = getStepIndex(booking.status);

    const renderStepper = () => {
        if (booking.status === 'CANCELLED') {
            return (
                <View style={[styles.statusCard, { backgroundColor: COLORS.error + '15' }]}>
                    <View style={[styles.statusDot, { backgroundColor: COLORS.error }]} />
                    <Text style={[styles.statusText, { color: COLORS.error }]}>Booking Cancelled</Text>
                </View>
            );
        }

        return (
            <View style={styles.stepperWrapper}>
                {STEPS.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isActive = index === currentStepIndex;
                    const isPending = index > currentStepIndex;

                    return (
                        <View key={step.id} style={styles.stepItem}>
                            <View style={styles.stepIndicator}>
                                <View style={[
                                    styles.stepCircle,
                                    isCompleted && styles.stepCircleCompleted,
                                    isActive && styles.stepCircleActive,
                                    isPending && styles.stepCirclePending,
                                ]}>
                                    <Ionicons 
                                        name={step.icon as any} 
                                        size={14} 
                                        color={isCompleted || isActive ? COLORS.white : COLORS.mediumGray} 
                                    />
                                </View>
                                {index < STEPS.length - 1 && (
                                    <View style={[
                                        styles.stepLine,
                                        isCompleted ? styles.stepLineCompleted : styles.stepLinePending
                                    ]} />
                                )}
                            </View>
                            <Text style={[
                                styles.stepLabel,
                                (isCompleted || isActive) ? styles.stepLabelActive : styles.stepLabelPending
                            ]}>
                                {step.label}
                            </Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    const statusConfig = getStatusConfig(booking.status);
    const canTrack = ['ON_WAY', 'ARRIVED'].includes(booking.status);
    
    let canCancel = false;
    if (!['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(booking.status)) {
        if (booking.isImmediate) {
            canCancel = dayjs().diff(dayjs(booking.createdAt), 'minute') <= 5;
        } else {
            canCancel = dayjs(booking.scheduledStart).diff(dayjs(), 'minute') >= 30;
        }
    }
    
    // Normalize review from backend (sends reviews[] array, not review object)
    const existingReview = booking.review ?? booking.reviews?.[0] ?? null;
    const hasRating = existingReview?.rating !== null && existingReview?.rating !== undefined;
    const hasComment = !!existingReview?.comment;
    const canReview = booking.status === 'COMPLETED' && !(hasRating && hasComment);
    
    // Smart button label
    let reviewButtonLabel = 'Rate & Review';
    if (existingReview) {
        if (hasRating && !hasComment) reviewButtonLabel = 'Write a Review';
        else if (!hasRating && hasComment) reviewButtonLabel = 'Rate Service';
    }
    let buddy = null;
    if (booking) {
        const activeAssignmentStatuses = ['ACCEPTED', 'ON_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'];
        if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
            buddy = booking.buddy || booking.assignments?.[0]?.buddy;
        } else {
            const assignment = booking.assignments?.find((a: any) => activeAssignmentStatuses.includes(a.status));
            buddy = booking.buddy || assignment?.buddy;
        }
    }

    let canCall = false;
    let canChat = false;
    let chatReason = '';
    let callReason = '';

    if ((booking as any)?.communicationAccess) {
        canCall = (booking as any).communicationAccess.canCall;
        canChat = (booking as any).communicationAccess.canChat;
        chatReason = (booking as any).communicationAccess.chatReason || '';
        callReason = (booking as any).communicationAccess.callReason || '';
    } else {
        // Fallback if backend doesn't send it for some reason
        canCall = ['ASSIGNED', 'ACCEPTED', 'ON_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status);
        canChat = canCall;

        if (booking.status === 'COMPLETED' && booking.completedAt) {
            const hoursSince = dayjs().diff(dayjs(booking.completedAt), 'hour');
            if (hoursSince > 24) {
                canCall = false;
                canChat = false;
            }
        }
    }

    const handleCallBuddy = () => {
        if (!canCall) {
            if (callReason) {
                Alert.alert('Call Unavailable', callReason);
            } else if (booking.status === 'PENDING') {
                Alert.alert('Call Unavailable', 'You will be able to call once a buddy is assigned.');
            } else if (booking.status === 'COMPLETED') {
                Alert.alert('Call Unavailable', 'Calling is only available for 24 hours after completion.');
            } else if (booking.status === 'CANCELLED') {
                Alert.alert('Call Unavailable', 'Calling is not available for cancelled bookings.');
            } else {
                Alert.alert('Call Unavailable', 'Calling is not available for this booking.');
            }
            return;
        }
        navigation.navigate('VoiceCall', { bookingId, buddyName: buddy.user?.name || buddy.name });
    };

    const handleChatBuddy = () => {
        if (!canChat) {
            if (chatReason) {
                Alert.alert('Chat Unavailable', chatReason);
            } else if (booking.status === 'PENDING') {
                Alert.alert('Chat Unavailable', 'You will be able to chat once a buddy is assigned.');
            } else if (booking.status === 'COMPLETED') {
                Alert.alert('Chat Unavailable', 'Chat is only available for 24 hours after completion.');
            } else if (booking.status === 'CANCELLED') {
                Alert.alert('Chat Unavailable', 'Chat is not available for cancelled bookings.');
            } else {
                Alert.alert('Chat Unavailable', 'Chat is not available for this booking.');
            }
            return;
        }
        navigation.navigate('Chat', { bookingId, buddyName: buddy.user?.name || buddy.name });
    };
    
    let metadataItems = [];
    try {
        const rawMetadata = booking?.metadata;
        if (rawMetadata) {
            if (typeof rawMetadata === 'string') {
                metadataItems = JSON.parse(rawMetadata).items || [];
            } else {
                metadataItems = rawMetadata.items || [];
            }
        }
    } catch (e) {
        console.warn("Failed to parse metadata", e);
    }

    const showPayNow = booking.paymentStatus !== 'PAID' && booking.status !== 'CANCELLED';

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
                {/* Visual Status Timeline / Stepper */}
                <View style={styles.stepperContainer}>
                    {renderStepper()}
                </View>

                {/* Buddy Arrived Notification Card */}
                {booking.status === 'ARRIVED' && (
                    <View style={styles.arrivedCard}>
                        <View style={styles.arrivedIconBg}>
                            <Ionicons name="notifications" size={24} color={COLORS.white} />
                        </View>
                        <View style={styles.arrivedContent}>
                            <Text style={styles.arrivedTitle}>Buddy has arrived!</Text>
                            <Text style={styles.arrivedText}>Please meet your Servanza Buddy at the service location.</Text>
                        </View>
                    </View>
                )}

                {/* OTP Verification Card */}
                {booking.completionOtp && !['COMPLETED', 'CANCELLED'].includes(booking.status) && (
                    <View style={styles.otpCard}>
                        <View style={styles.otpHeader}>
                            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
                            <Text style={styles.otpTitle}>Start Service OTP</Text>
                        </View>
                        <Text style={styles.otpText}>Share this code with your buddy to start the service.</Text>
                        <View style={styles.otpBox}>
                            <Text style={styles.otpCode}>{booking.completionOtp}</Text>
                        </View>
                    </View>
                )}

                {/* Service Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Services Requested</Text>
                    {metadataItems.length > 0 ? (
                        metadataItems.map((item: any, index: number) => (
                            <View key={index} style={styles.serviceListItem}>
                                <Image source={{ uri: item.imageUrl }} style={styles.serviceListImage} />
                                <View style={styles.serviceListDetails}>
                                    <Text style={styles.serviceItemName}>{item.title}</Text>
                                    <Text style={styles.serviceItemQty}>Qty: {item.quantity}</Text>
                                </View>
                                <Text style={styles.serviceItemPrice}>
                                    ₹{item.price * item.quantity}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.serviceListItem}>
                            {booking.service?.imageUrl ? (
                                <Image source={{ uri: booking.service.imageUrl }} style={styles.serviceListImage} />
                            ) : (
                                <View style={[styles.serviceListImage, { backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' }]}>
                                    <Ionicons name="construct" size={24} color={COLORS.primary} />
                                </View>
                            )}
                            <View style={styles.serviceListDetails}>
                                <Text style={styles.serviceItemName}>{booking.service?.title || 'Service'}</Text>
                                <Text style={styles.serviceItemQty}>Qty: 1</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <Ionicons name="calendar-outline" size={14} color={COLORS.mediumGray} />
                                    <Text style={[styles.serviceItemQty, { marginTop: 0, marginLeft: 4 }]}>
                                        {dayjs(booking.scheduledStart).format('DD MMM YYYY, h:mm A')}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.serviceItemPrice}>
                                ₹{booking.price}
                            </Text>
                        </View>
                    )}
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
                {buddy && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Your Buddy</Text>
                        <View style={styles.infoCard}>
                            <View style={styles.buddyRow}>
                                <View style={styles.buddyAvatar}>
                                    {buddy.user?.profileImage ? (
                                        <Image source={{ uri: buddy.user.profileImage }} style={{ width: '100%', height: '100%', borderRadius: 25 }} />
                                    ) : (
                                        <Ionicons name="person" size={24} color={COLORS.primary} />
                                    )}
                                </View>
                                <View style={styles.buddyInfo}>
                                    <Text style={styles.buddyName}>{buddy.user?.name || buddy.name}</Text>
                                    <View style={styles.ratingRow}>
                                        <Ionicons name="star" size={14} color={COLORS.warning} />
                                        <Text style={styles.ratingText}>
                                            {buddy.avgRating?.toFixed(1) || buddy.rating?.toFixed(1) || 'New'}
                                        </Text>
                                    </View>
                                    <View style={styles.actionButtonsRow}>
                                        <TouchableOpacity
                                            style={[styles.chatIconButton, !canCall && { opacity: 0.5 }]}
                                            onPress={handleCallBuddy}
                                        >
                                            <Ionicons name="call" size={20} color={COLORS.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.chatIconButton, !canChat && { opacity: 0.5 }]}
                                            onPress={handleChatBuddy}
                                        >
                                            <Ionicons name="chatbubbles" size={20} color={COLORS.primary} />
                                        </TouchableOpacity>
                                        
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
                        </View>
                    </View>
                )}

                {/* Payment Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Summary</Text>
                    <View style={styles.infoCard}>
                        {/* Individual Service Breakdown */}
                        {metadataItems.length > 0 ? (
                            metadataItems.map((item: any, index: number) => (
                                <View key={`price-${index}`} style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>
                                        {item.title} <Text style={styles.qtyText}>(x{item.quantity})</Text>
                                    </Text>
                                    <Text style={styles.priceValue}>₹{item.price * item.quantity}</Text>
                                </View>
                            ))
                        ) : (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>
                                    {booking.service?.title} <Text style={styles.qtyText}>(x1)</Text>
                                </Text>
                                <Text style={styles.priceValue}>₹{booking.price}</Text>
                            </View>
                        )}

                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Tax (GST)</Text>
                            <Text style={styles.priceValue}>₹{booking.taxAmount}</Text>
                        </View>

                        {booking.discountAmount > 0 && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Discount</Text>
                                <Text style={[styles.priceValue, { color: COLORS.success }]}>-₹{booking.discountAmount}</Text>
                            </View>
                        )}

                        <View style={styles.divider} />

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalValue}>₹{booking.totalAmount}</Text>
                        </View>

                        <View style={styles.paymentStatusBadge}>
                            <Text style={styles.paymentStatusText}>
                                {booking.paymentStatus === 'PAID' ? 'Paid via Online' : 'Pending Payment'}
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
            {(canCancel || canReview || showPayNow) && (
                <View style={styles.bottomBar}>
                    {canCancel && (
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancel}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    )}
                    {showPayNow && (
                        <TouchableOpacity
                            style={styles.payButton}
                            onPress={() => (navigation as any).navigate('CartTab', { screen: 'Payment', params: { bookingId: booking.id, amount: booking.totalAmount } })}
                        >
                            <Ionicons name="card" size={20} color={COLORS.white} />
                            <Text style={styles.payButtonText}>Pay Now</Text>
                        </TouchableOpacity>
                    )}
                    {canReview && (
                        <TouchableOpacity
                            style={styles.reviewButton}
                            onPress={handleReview}
                        >
                            <Ionicons name="star" size={20} color={COLORS.white} />
                            <Text style={styles.reviewButtonText}>{reviewButtonLabel}</Text>
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
    stepperContainer: {
        paddingHorizontal: SPACING.lg,
        marginTop: SPACING.md,
        marginBottom: SPACING.md,
    },
    stepperWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    stepItem: {
        flex: 1,
        alignItems: 'center',
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        position: 'relative',
    },
    stepCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 2,
        borderColor: COLORS.lightGray,
        zIndex: 2,
    },
    stepCircleCompleted: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    stepCircleActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        transform: [{ scale: 1.1 }],
    },
    stepCirclePending: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.lightGray,
    },
    stepLine: {
        position: 'absolute',
        top: 13,
        left: '50%',
        width: '100%',
        height: 2,
        zIndex: 1,
    },
    stepLineCompleted: {
        backgroundColor: COLORS.primary,
    },
    stepLinePending: {
        backgroundColor: COLORS.lightGray,
    },
    stepLabel: {
        marginTop: SPACING.xs,
        fontSize: 10,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        textAlign: 'center',
    },
    stepLabelActive: {
        color: COLORS.charcoal,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
    stepLabelPending: {
        color: COLORS.mediumGray,
    },
    arrivedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '15',
        marginHorizontal: SPACING.lg,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    arrivedIconBg: {
        backgroundColor: COLORS.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    arrivedContent: {
        flex: 1,
    },
    arrivedTitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
        marginBottom: 2,
    },
    arrivedText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.mediumGray,
    },
    otpCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: SPACING.lg,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    otpHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xs,
        gap: 6,
    },
    otpTitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.charcoal,
    },
    otpText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.mediumGray,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    otpBox: {
        backgroundColor: COLORS.inputBackground,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.primary + '40',
    },
    otpCode: {
        fontSize: 24,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
        letterSpacing: 8,
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
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    chatIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
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
    serviceListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        padding: 10,
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.md,
    },
    serviceListImage: {
        width: 50,
        height: 50,
        borderRadius: BORDER_RADIUS.sm,
        marginRight: 12,
    },
    serviceListDetails: {
        flex: 1,
    },
    serviceItemName: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.charcoal,
    },
    serviceItemQty: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.mediumGray,
        marginTop: 4,
    },
    serviceItemPrice: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    priceLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.darkGray,
    },
    qtyText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.mediumGray,
    },
    priceValue: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.charcoal,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.lightGray,
        marginVertical: SPACING.md,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
    },
    totalLabel: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
    },
    totalValue: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
    },
    paymentStatusBadge: {
        marginTop: SPACING.md,
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        backgroundColor: COLORS.offWhite,
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
    payButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.success,
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.lg,
        gap: 8,
    },
    payButtonText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.white,
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
