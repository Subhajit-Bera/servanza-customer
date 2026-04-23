import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '../../theme';
import { useAppDispatch } from '../../store/hooks';
import { clearGuest } from '../../store/slices/authSlice';

interface GuestWallScreenProps {
    title?: string;
    subtitle?: string;
    icon?: keyof typeof Ionicons.glyphMap;
}

const GuestWallScreen: React.FC<GuestWallScreenProps> = ({
    title = 'Login Required',
    subtitle = 'Please log in or sign up to access this feature.',
    icon = 'lock-closed-outline',
}) => {
    const dispatch = useAppDispatch();

    const handleLogin = () => {
        // Clearing guest mode makes showMain=false in App.tsx
        // → root navigator automatically switches to Auth screen
        dispatch(clearGuest());
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.content}>
                <View style={styles.iconWrapper}>
                    <Ionicons name={icon} size={64} color={COLORS.primary} />
                </View>

                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    activeOpacity={0.85}
                >
                    <Ionicons name="log-in-outline" size={20} color={COLORS.white} />
                    <Text style={styles.loginButtonText}>Log In / Sign Up</Text>
                </TouchableOpacity>

                <View style={styles.features}>
                    {[
                        { icon: 'calendar-outline' as const, text: 'Track your bookings' },
                        { icon: 'heart-outline' as const, text: 'Save your favourites' },
                        { icon: 'person-outline' as const, text: 'Manage your profile' },
                    ].map((f, i) => (
                        <View key={i} style={styles.featureRow}>
                            <Ionicons name={f.icon} size={18} color={COLORS.primary} />
                            <Text style={styles.featureText}>{f.text}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl * 1.5,
    },
    iconWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.display,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.xxl,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md + 2,
        paddingHorizontal: SPACING.xxl,
        borderRadius: BORDER_RADIUS.pill,
        gap: SPACING.sm,
        ...SHADOWS.green,
        marginBottom: SPACING.xxl,
    },
    loginButtonText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.white,
    },
    features: {
        gap: SPACING.md,
        alignSelf: 'stretch',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        ...SHADOWS.light,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    featureText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textPrimary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
});

export default GuestWallScreen;
