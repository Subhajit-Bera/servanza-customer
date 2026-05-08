import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '../../theme';
import type { CartStackParamList } from '../../navigation/MainNavigator';

type ConfirmationRouteProp = RouteProp<CartStackParamList, 'BookingConfirmation'>;
type ConfirmationNavigationProp = StackNavigationProp<CartStackParamList, 'BookingConfirmation'>;

const BookingConfirmationScreen: React.FC = () => {
    const navigation = useNavigation<ConfirmationNavigationProp>();
    const route = useRoute<ConfirmationRouteProp>();

    const { bookingId, scheduledTime, address } = route.params;

    const scaleAnim = React.useRef(new Animated.Value(0)).current;
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 5,
                useNativeDriver: true,
            }),
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 350,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);

    const handleViewBooking = () => {
        navigation.getParent()?.navigate('BookingsTab', {
            screen: 'MyBookings',
        });
    };

    const handleGoHome = () => {
        navigation.getParent()?.navigate('HomeTab');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Success Icon */}
                <Animated.View style={[styles.iconWrapper, { transform: [{ scale: scaleAnim }] }]}>
                    <LinearGradient
                        colors={[COLORS.primary, '#00C853']}
                        style={styles.iconCircle}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="checkmark" size={52} color={COLORS.white} />
                    </LinearGradient>
                </Animated.View>

                {/* Content */}
                <Animated.View
                    style={[
                        styles.contentBlock,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    <Text style={styles.title}>Booking Confirmed! 🎉</Text>
                    <Text style={styles.subtitle}>
                        Your service has been booked successfully.{'\n'}We're finding the best buddy for you.
                    </Text>

                    {/* Booking ID */}
                    <View style={styles.bookingIdCard}>
                        <Text style={styles.bookingIdLabel}>Booking ID</Text>
                        <Text style={styles.bookingId}>{bookingId.slice(0, 8).toUpperCase()}</Text>
                    </View>

                    {/* Info Cards */}
                    <View style={styles.infoCards}>
                        {/* Scheduled Time */}
                        <View style={styles.infoCard}>
                            <View style={styles.infoIconWrap}>
                                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                            </View>
                            <View style={styles.infoCardText}>
                                <Text style={styles.infoLabel}>Scheduled Time</Text>
                                <Text style={styles.infoValue} numberOfLines={2}>
                                    {scheduledTime || "We'll notify you when a buddy is assigned"}
                                </Text>
                            </View>
                        </View>

                        {/* Location */}
                        <View style={styles.infoCard}>
                            <View style={styles.infoIconWrap}>
                                <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                            </View>
                            <View style={styles.infoCardText}>
                                <Text style={styles.infoLabel}>Service Location</Text>
                                <Text style={styles.infoValue} numberOfLines={3}>
                                    {address || "Track your buddy in real-time once they're on the way"}
                                </Text>
                            </View>
                        </View>

                        {/* Next Steps hint */}
                        <View style={[styles.infoCard, styles.infoCardHint]}>
                            <View style={styles.infoIconWrap}>
                                <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
                            </View>
                            <View style={styles.infoCardText}>
                                <Text style={styles.infoLabel}>What's Next?</Text>
                                <Text style={styles.infoValue}>
                                    You'll receive a push notification when your buddy is assigned and on the way.
                                </Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>

            {/* Buttons — always visible at bottom */}
            <Animated.View style={[styles.buttonsContainer, { opacity: fadeAnim }]}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleViewBooking}
                    activeOpacity={0.85}
                >
                    <Ionicons name="calendar-outline" size={20} color={COLORS.white} />
                    <Text style={styles.primaryButtonText}>View Booking</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleGoHome}
                    activeOpacity={0.85}
                >
                    <Text style={styles.secondaryButtonText}>Back to Home</Text>
                </TouchableOpacity>
            </Animated.View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xxl,
        paddingBottom: SPACING.lg,
    },
    iconWrapper: {
        marginBottom: SPACING.xl,
    },
    iconCircle: {
        width: 104,
        height: 104,
        borderRadius: 52,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.green,
    },
    contentBlock: {
        width: '100%',
        alignItems: 'center',
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.display,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.xl,
    },
    bookingIdCard: {
        backgroundColor: COLORS.lightGreen,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xxl,
        borderRadius: BORDER_RADIUS.xl,
        alignItems: 'center',
        marginBottom: SPACING.xl,
        width: '100%',
    },
    bookingIdLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.darkGreen,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        letterSpacing: 1,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    bookingId: {
        fontSize: TYPOGRAPHY.fontSize.xxl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.darkGreen,
        letterSpacing: 3,
    },
    infoCards: {
        width: '100%',
        gap: SPACING.md,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.offWhite,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        gap: SPACING.md,
    },
    infoCardHint: {
        backgroundColor: COLORS.primaryLight,
    },
    infoIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.light,
        flexShrink: 0,
    },
    infoCardText: {
        flex: 1,
    },
    infoLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textPrimary,
        lineHeight: 21,
    },
    buttonsContainer: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.lg,
        paddingTop: SPACING.md,
        gap: SPACING.md,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.sm,
        ...SHADOWS.green,
    },
    primaryButtonText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.white,
    },
    secondaryButton: {
        backgroundColor: COLORS.offWhite,
        paddingVertical: 16,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.charcoal,
    },
});

export default BookingConfirmationScreen;
