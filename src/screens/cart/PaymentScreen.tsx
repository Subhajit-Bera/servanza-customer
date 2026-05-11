import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS, formatCurrency } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

import { paymentApi } from '../../api/client';
import { CONFIG } from '../../config/constants';
import RazorpayCheckout from 'react-native-razorpay';
import type { CartStackParamList } from '../../navigation/MainNavigator';

type PaymentRouteProp = RouteProp<CartStackParamList, 'Payment'>;
type PaymentNavigationProp = StackNavigationProp<CartStackParamList, 'Payment'>;

const PaymentScreen: React.FC = () => {
    const navigation = useNavigation<PaymentNavigationProp>();
    const route = useRoute<PaymentRouteProp>();
    const dispatch = useAppDispatch();

    const { bookingId, amount } = route.params;
    const { total: cartTotal } = useAppSelector((state) => state.cart);
    const total = amount || cartTotal;

    const { user } = useAppSelector((state) => state.auth);

    const [loading, setLoading] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'CARD' | 'WALLET'>('UPI');

    const handlePayment = async () => {
        setLoading(true);
        try {
            // Create Razorpay order
            const { data } = await paymentApi.createOrder({
                bookingId,
                amount: total
            });

            const order = data.data || data;

            // Configure and open Razorpay native checkout modal
            const options = {
                description: 'Servanza Booking Payment',
                currency: 'INR',
                key: CONFIG.RAZORPAY_KEY_ID,
                amount: total * 100, // Amount in paise
                name: 'Servanza',
                order_id: order.id,
                prefill: {
                    email: user?.email || '',
                    contact: user?.phone || '',
                    name: user?.name || ''
                },
                theme: { color: COLORS.primary }
            };

            const rpResponse = await RazorpayCheckout.open(options);

            // Verify the real payment signature with the backend
            await paymentApi.verifyPayment({
                razorpay_order_id: rpResponse.razorpay_order_id,
                razorpay_payment_id: rpResponse.razorpay_payment_id,
                razorpay_signature: rpResponse.razorpay_signature,
                bookingId,
            });



            // Navigate to confirmation
            navigation.replace('BookingConfirmation', { bookingId });
        } catch (error: any) {
            Alert.alert('Payment Failed', error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const renderPaymentMethod = (
        id: 'UPI' | 'CARD' | 'WALLET',
        name: string,
        description: string,
        iconName: any,
        isTextIcon: boolean = false
    ) => {
        const isSelected = selectedMethod === id;
        return (
            <TouchableOpacity
                style={[
                    styles.methodCard,
                    isSelected && styles.methodCardActive,
                ]}
                onPress={() => setSelectedMethod(id)}
                activeOpacity={0.9}
            >
                <View style={styles.methodContent}>
                    <View style={[styles.methodIcon, isSelected && styles.methodIconActive]}>
                        {isTextIcon ? (
                            <Text style={[styles.upiIcon, isSelected && styles.upiIconActive]}>{iconName}</Text>
                        ) : (
                            <Ionicons
                                name={iconName}
                                size={24}
                                color={isSelected ? COLORS.primary : COLORS.textSecondary}
                            />
                        )}
                    </View>
                    <View style={styles.methodInfo}>
                        <Text style={[styles.methodName, isSelected && styles.methodNameActive]}>{name}</Text>
                        <Text style={styles.methodDesc}>{description}</Text>
                    </View>
                </View>
                <View style={[styles.radioButton, isSelected && styles.radioButtonActive]}>
                    {isSelected && <View style={styles.radioButtonInner} />}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment</Text>
                <View style={styles.headerRight} />
            </View>

            <View style={styles.content}>
                {/* Amount Card */}
                <View style={styles.amountCard}>
                    <View style={styles.amountCardPattern} />
                    <Text style={styles.amountLabel}>Total Amount to Pay</Text>
                    <Text style={styles.amountValue}>{formatCurrency(total)}</Text>
                    <View style={styles.bookingIdTag}>
                        <Text style={styles.bookingIdText}>Booking ID: {bookingId.slice(0, 8).toUpperCase()}</Text>
                    </View>
                </View>

                {/* Payment Methods */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Payment Method</Text>

                    {renderPaymentMethod(
                        'UPI',
                        'UPI',
                        'Google Pay, PhonePe, Paytm',
                        'UPI',
                        true
                    )}

                    {renderPaymentMethod(
                        'CARD',
                        'Credit / Debit Card',
                        'Visa, Mastercard, RuPay',
                        'card-outline',
                        false
                    )}

                    {/* {renderPaymentMethod(
                        'WALLET',
                        'Wallets',
                        'Paytm, Amazon Pay, etc.',
                        'wallet-outline',
                        false
                    )} */}
                </View>
            </View>

            {/* Bottom Section */}
            <SafeAreaView style={styles.bottomSection} edges={['bottom']}>
                {/* Secure Payment Note */}
                <View style={styles.secureNote}>
                    <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
                    <Text style={styles.secureNoteText}>
                        100% Secure Payment with 256-bit Encryption
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.payButton}
                    onPress={handlePayment}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <>
                            <Text style={styles.payButtonText}>Pay {formatCurrency(total)}</Text>
                            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                        </>
                    )}
                </TouchableOpacity>
            </SafeAreaView>
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
        borderRadius: 20,
        backgroundColor: COLORS.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    headerRight: {
        width: 40,
    },
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    amountCard: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
        marginBottom: SPACING.xl,
        ...SHADOWS.green,
        position: 'relative',
        overflow: 'hidden',
    },
    amountCardPattern: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    amountLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    amountValue: {
        fontSize: 36,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.white,
        marginBottom: SPACING.md,
    },
    bookingIdTag: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.lg,
    },
    bookingIdText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.white,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    section: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.light,
    },
    methodCardActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight,
    },
    methodContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    methodIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    methodIconActive: {
        backgroundColor: COLORS.white,
    },
    upiIcon: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textSecondary,
    },
    upiIconActive: {
        color: COLORS.primary,
    },
    methodInfo: {
        flex: 1,
    },
    methodName: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    methodNameActive: {
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
    methodDesc: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonActive: {
        borderColor: COLORS.primary,
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
    },
    bottomSection: {
        backgroundColor: COLORS.white,
        padding: SPACING.lg,
        borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl,
        ...SHADOWS.heavy,
    },
    secureNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: SPACING.lg,
    },
    secureNoteText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textSecondary,
    },
    payButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: BORDER_RADIUS.xl,
        gap: 8,
        ...SHADOWS.green,
    },
    payButtonText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.white,
    },
});

export default PaymentScreen;
