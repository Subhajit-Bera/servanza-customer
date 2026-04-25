import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS, formatCurrency } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAddresses } from '../../store/slices/authSlice';
import { createBooking } from '../../store/slices/bookingsSlice';
import { clearCart } from '../../store/slices/cartSlice';
import { requireLocationPermission } from '../../hooks/useLocation';
import { bookingApi } from '../../api/client';
import type { CartStackParamList } from '../../navigation/MainNavigator';
import type { Address } from '../../types';

type BookingFormNavigationProp = StackNavigationProp<CartStackParamList, 'BookingForm'>;

type BookingType = 'IMMEDIATE' | 'SCHEDULED';

// Generate available hours (9 AM to 7 PM -- last booking at 7 PM for 8 PM end)
const AVAILABLE_HOURS = Array.from({ length: 11 }, (_, i) => i + 9); // 9,10,...,19
const AVAILABLE_MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const BookingFormScreen: React.FC = () => {
    const navigation = useNavigation<BookingFormNavigationProp>();
    const dispatch = useAppDispatch();
    const isFocused = useIsFocused();

    const { items, total, subtotal, tax } = useAppSelector((state) => state.cart);
    const { addresses, defaultAddressId } = useAppSelector((state) => state.auth);
    const { loading } = useAppSelector((state) => state.bookings);

    const [bookingType, setBookingType] = useState<BookingType>('SCHEDULED');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedHour, setSelectedHour] = useState(9);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [selectedAddressId, setSelectedAddressId] = useState(defaultAddressId || '');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [specialInstructions, setSpecialInstructions] = useState('');

    // Generate next 7 days for calendar strip
    const dates = Array.from({ length: 7 }, (_, i) => dayjs().add(i, 'day'));

    // Check if the selected date is today
    const isToday = dayjs(selectedDate).isSame(dayjs(), 'day');

    // Get minimum allowed time for today (current time + 1 hour)
    const getMinimumTime = () => {
        const now = dayjs();
        const minHour = now.hour() + 1;
        const minMinute = now.minute();
        return { minHour, minMinute };
    };

    // Get available hours for the selected date
    const getAvailableHours = () => {
        if (!isToday) return AVAILABLE_HOURS;
        const { minHour, minMinute } = getMinimumTime();
        // If current minute > 0, we need the next hour after minHour
        // since minHour = currentHour + 1, we need hours >= minHour
        return AVAILABLE_HOURS.filter(h => {
            if (h < minHour) return false;
            if (h === minHour && minMinute > 0) return false;
            return true;
        });
    };

    // Get available minutes for the selected hour
    const getAvailableMinutes = () => {
        if (!isToday) return AVAILABLE_MINUTES;
        const { minHour, minMinute } = getMinimumTime();
        if (selectedHour > minHour) return AVAILABLE_MINUTES;
        if (selectedHour === minHour) {
            return AVAILABLE_MINUTES.filter(m => m >= minMinute);
        }
        return AVAILABLE_MINUTES;
    };

    // Auto-correct selected time when date changes to today
    useEffect(() => {
        if (isToday) {
            const availHours = getAvailableHours();
            if (availHours.length === 0) {
                // No hours available today — move to next day
                setSelectedDate(dayjs().add(1, 'day').toDate());
                setSelectedHour(9);
                setSelectedMinute(0);
                return;
            }
            if (!availHours.includes(selectedHour)) {
                setSelectedHour(availHours[0]);
                setSelectedMinute(0);
            }
        }
    }, [selectedDate]);

    // Fetch addresses on mount and when screen comes back into focus
    useEffect(() => {
        if (isFocused) {
            dispatch(fetchAddresses());
        }
    }, [isFocused]);

    useEffect(() => {
        if (addresses.length > 0 && !selectedAddressId) {
            const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
            setSelectedAddressId(defaultAddr.id);
        }
    }, [addresses]);

    const handleDateChange = (event: any, date?: Date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedDate(date);
        }
    };

    const getScheduledTime = () => {
        const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
        const startHour = selectedHour;
        const startMinute = selectedMinute;
        // End time is 1 hour after start
        const endHour = startHour + 1;

        return {
            scheduledStart: dayjs(`${dateStr}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00`).toISOString(),
            scheduledEnd: dayjs(`${dateStr}T${String(endHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00`).toISOString(),
        };
    };

    const handleAddAddress = () => {
        requireLocationPermission(
            () => {
                navigation.navigate('AddAddress');
            },
            () => {
                Alert.alert(
                    'Location Required',
                    'You need to grant location access to add an address for service delivery.'
                );
            }
        );
    };

    const handleConfirm = async () => {
        if (!selectedAddressId) {
            Alert.alert('Address Required', 'Please select or add an address to continue.');
            return;
        }

        if (items.length === 0) {
            Alert.alert('Cart Empty', 'Your cart is empty');
            return;
        }

        // Verify location permission for booking
        requireLocationPermission(
            async () => {
                try {
                    // Pre-flight cart validation
                    const mappedItems = items.map(item => ({
                        serviceId: item.service.id,
                        quantity: item.quantity,
                    }));
                    await bookingApi.validateCart({ items: mappedItems, total });

                    // For simplicity, book the first service in cart (assuming single service booking flow for now)
                    // In a real app, we might create an order with multiple items
                    const firstItem = items[0];
                    const scheduleInfo = bookingType === 'IMMEDIATE'
                        ? {
                            scheduledStart: new Date().toISOString(),
                            scheduledEnd: dayjs().add(firstItem.service.durationMins, 'minute').toISOString(),
                            isImmediate: true,
                        }
                        : {
                            ...getScheduledTime(),
                            isImmediate: false,
                        };

                    const bookingData = {
                        serviceId: firstItem.service.id,
                        addressId: selectedAddressId,
                        ...scheduleInfo,
                        paymentMethod: 'PREPAID',
                        price: total, // Use total instead of subtotal to include tax/discounts
                        notes: specialInstructions,
                    };

                    const resultAction = await dispatch(createBooking(bookingData));

                    if (createBooking.fulfilled.match(resultAction)) {
                        dispatch(clearCart());
                        // Build display info for confirmation screen
                        const selectedAddr = addresses.find(a => a.id === selectedAddressId);
                        const scheduledTimeDisplay = bookingType === 'IMMEDIATE'
                            ? 'Now (Immediate)'
                            : dayjs(selectedDate).format('DD MMM YYYY') + ` at ${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
                        navigation.navigate('BookingConfirmation', {
                            bookingId: resultAction.payload.id,
                            scheduledTime: scheduledTimeDisplay,
                            address: selectedAddr?.formattedAddress || selectedAddr?.streetAddress || '',
                        });
                    } else {
                        Alert.alert('Booking Failed', 'Unable to create booking. Please try again.');
                    }
                } catch (error: any) {
                    console.error('Booking error:', error);
                    const msg = error?.response?.data?.message || 'An unexpected error occurred';
                    Alert.alert('Error', msg);
                }
            },
            () => {
                Alert.alert(
                    'Location Required',
                    'We need your location to assign the nearest service provider.'
                );
            }
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Schedule Service</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Booking Type Toggle */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, bookingType === 'SCHEDULED' && styles.activeToggle]}
                        onPress={() => setBookingType('SCHEDULED')}
                    >
                        <Text style={[styles.toggleText, bookingType === 'SCHEDULED' && styles.activeToggleText]}>
                            Schedule
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, bookingType === 'IMMEDIATE' && styles.activeToggle]}
                        onPress={() => setBookingType('IMMEDIATE')}
                    >
                        <View style={styles.instantRow}>
                            <Ionicons name="flash" size={14} color={bookingType === 'IMMEDIATE' ? COLORS.white : COLORS.warning} />
                            <Text style={[styles.toggleText, bookingType === 'IMMEDIATE' && styles.activeToggleText]}>
                                Instant
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {bookingType === 'SCHEDULED' && (
                    <>
                        {/* Date Selection */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Select Date</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesList}>
                                {dates.map((date, index) => {
                                    const isSelected = dayjs(selectedDate).isSame(date, 'day');
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.dateCard, isSelected && styles.selectedDateCard]}
                                            onPress={() => setSelectedDate(date.toDate())}
                                        >
                                            <Text style={[styles.dateDay, isSelected && styles.selectedDateText]}>
                                                {date.format('ddd')}
                                            </Text>
                                            <Text style={[styles.dateNum, isSelected && styles.selectedDateText]}>
                                                {date.format('D')}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* Time Selection */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Select Time</Text>

                            {getAvailableHours().length === 0 ? (
                                <View style={styles.noSlotsContainer}>
                                    <Ionicons name="time-outline" size={32} color={COLORS.textLight} />
                                    <Text style={styles.noSlotsText}>No time slots available for today</Text>
                                    <Text style={styles.noSlotsSubText}>Please select another date</Text>
                                </View>
                            ) : (
                                <>
                                    {/* Hour Selection */}
                                    <Text style={styles.timeLabel}>Hour</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeChipsList}>
                                        {getAvailableHours().map((hour) => {
                                            const isSelected = selectedHour === hour;
                                            const displayHour = hour > 12 ? hour - 12 : hour;
                                            const ampm = hour >= 12 ? 'PM' : 'AM';
                                            return (
                                                <TouchableOpacity
                                                    key={hour}
                                                    style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                                                    onPress={() => {
                                                        setSelectedHour(hour);
                                                        // Reset minute if not available for new hour
                                                        const availMins = getAvailableMinutes();
                                                        if (!availMins.includes(selectedMinute)) {
                                                            setSelectedMinute(availMins[0] || 0);
                                                        }
                                                    }}
                                                >
                                                    <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                                                        {displayHour} {ampm}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>

                                    {/* Minute Selection */}
                                    <Text style={styles.timeLabel}>Minute</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeChipsList}>
                                        {getAvailableMinutes().map((minute) => {
                                            const isSelected = selectedMinute === minute;
                                            return (
                                                <TouchableOpacity
                                                    key={minute}
                                                    style={[styles.timeChip, styles.minuteChip, isSelected && styles.timeChipSelected]}
                                                    onPress={() => setSelectedMinute(minute)}
                                                >
                                                    <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                                                        :{String(minute).padStart(2, '0')}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>

                                    {/* Selected Time Preview */}
                                    <View style={styles.timePreview}>
                                        <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                                        <Text style={styles.timePreviewText}>
                                            {selectedHour > 12 ? selectedHour - 12 : selectedHour}:{String(selectedMinute).padStart(2, '0')} {selectedHour >= 12 ? 'PM' : 'AM'} IST
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </>
                )}

                {/* Address Selection */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Service Address</Text>
                        <TouchableOpacity onPress={handleAddAddress}>
                            <Text style={styles.addAddressText}>+ Add New</Text>
                        </TouchableOpacity>
                    </View>

                    {addresses.length === 0 ? (
                        <TouchableOpacity style={styles.addAddressCard} onPress={handleAddAddress}>
                            <Ionicons name="location-outline" size={24} color={COLORS.primary} />
                            <Text style={styles.addAddressCardText}>Add a service address</Text>
                        </TouchableOpacity>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addressList}>
                            {addresses.map((address) => {
                                const isSelected = selectedAddressId === address.id;
                                return (
                                    <TouchableOpacity
                                        key={address.id}
                                        style={[styles.addressCard, isSelected && styles.selectedAddressCard]}
                                        onPress={() => setSelectedAddressId(address.id)}
                                    >
                                        <View style={styles.addressHeader}>
                                            <View style={styles.addressIcon}>
                                                <Ionicons
                                                    name={address.label === 'Home' ? 'home' : address.label === 'Work' ? 'briefcase' : 'location'}
                                                    size={16}
                                                    color={isSelected ? COLORS.white : COLORS.textSecondary}
                                                />
                                            </View>
                                            <Text style={[styles.addressLabel, isSelected && styles.selectedAddressText]}>
                                                {address.label}
                                            </Text>
                                            {isSelected && (
                                                <View style={styles.checkIcon}>
                                                    <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[styles.addressText, isSelected && styles.selectedAddressSubText]} numberOfLines={2}>
                                            {address.formattedAddress || `${address.streetAddress}, ${address.city}`}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>

                {/* Special Instructions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notes (Optional)</Text>
                    <TextInput
                        style={styles.inputArea}
                        placeholder="Any special instructions for the provider..."
                        placeholderTextColor={COLORS.textLight}
                        multiline
                        numberOfLines={3}
                        value={specialInstructions}
                        onChangeText={setSpecialInstructions}
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.priceContainer}>
                    <Text style={styles.totalLabel}>Total to Pay</Text>
                    <Text style={styles.totalPrice}>{formatCurrency(total)}</Text>
                    <Text style={styles.itemsCount}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.confirmButton, loading && styles.disabledButton]}
                    onPress={handleConfirm}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <>
                            <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                        </>
                    )}
                </TouchableOpacity>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.lg,
        paddingBottom: 100,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        padding: 4,
        marginBottom: SPACING.xl,
        ...SHADOWS.light,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BORDER_RADIUS.lg,
    },
    activeToggle: {
        backgroundColor: COLORS.primary,
        ...SHADOWS.medium,
    },
    toggleText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textSecondary,
    },
    activeToggleText: {
        color: COLORS.white,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
    instantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    addAddressText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
    },
    datesList: {
        paddingRight: SPACING.lg,
        gap: SPACING.md,
    },
    dateCard: {
        width: 60,
        height: 80,
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    selectedDateCard: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        ...SHADOWS.green,
    },
    dateDay: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    dateNum: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    selectedDateText: {
        color: COLORS.white,
    },
    calendarButton: {
        width: 60,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    calendarButtonText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    timeLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
        marginTop: SPACING.sm,
    },
    timeChipsList: {
        gap: SPACING.sm,
        paddingRight: SPACING.lg,
    },
    timeChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        minWidth: 60,
        alignItems: 'center',
    },
    minuteChip: {
        minWidth: 50,
    },
    timeChipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    timeChipText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textPrimary,
    },
    timeChipTextSelected: {
        color: COLORS.white,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
    timePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: SPACING.md,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: COLORS.primaryLight || '#E8F5E9',
        borderRadius: BORDER_RADIUS.md,
    },
    timePreviewText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
    },
    noSlotsContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    noSlotsText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textSecondary,
        marginTop: SPACING.sm,
    },
    noSlotsSubText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textLight,
        marginTop: 4,
    },
    slotsGrid: {
        gap: SPACING.md,
    },
    slotCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    selectedSlotCard: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        ...SHADOWS.light,
    },
    slotInfo: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    slotLabel: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    slotTime: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    selectedSlotText: {
        color: COLORS.white,
    },
    selectedSlotSubText: {
        color: 'rgba(255,255,255,0.8)',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.textLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
        borderColor: COLORS.white,
        backgroundColor: COLORS.white,
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
    },
    addressList: {
        paddingRight: SPACING.lg,
        gap: SPACING.md,
    },
    addAddressCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
        height: 120,
    },
    addAddressCardText: {
        marginTop: SPACING.sm,
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    addressCard: {
        width: 200,
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        height: 120,
        justifyContent: 'space-between',
    },
    selectedAddressCard: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        ...SHADOWS.green,
    },
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    addressIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addressLabel: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        flex: 1,
    },
    checkIcon: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    addressText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    selectedAddressText: {
        color: COLORS.white,
    },
    selectedAddressSubText: {
        color: 'rgba(255,255,255,0.9)',
    },
    inputArea: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: 80,
    },
    bottomPadding: {
        height: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: BORDER_RADIUS.xxl,
        borderTopRightRadius: BORDER_RADIUS.xxl,
        padding: SPACING.lg,
        ...SHADOWS.heavy,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceContainer: {
        flex: 1,
    },
    totalLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    totalPrice: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
    },
    itemsCount: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: BORDER_RADIUS.xxl,
        gap: SPACING.sm,
        ...SHADOWS.green,
    },
    disabledButton: {
        opacity: 0.7,
    },
    confirmButtonText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.white,
    },
});

export default BookingFormScreen;
