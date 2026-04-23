import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { fetchBookings } from '../../store/slices/bookingsSlice';
import { APP_INFO } from '../../config/constants';
import type { ProfileStackParamList } from '../../navigation/MainNavigator';

type ProfileNavigationProp = StackNavigationProp<ProfileStackParamList, 'Profile'>;

interface MenuItem {
    icon: string;
    iconColor?: string;
    label: string;
    value?: string;
    onPress: () => void;
}

interface MenuSection {
    title: string;
    items: MenuItem[];
}

const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<ProfileNavigationProp>();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { bookings } = useAppSelector((state) => state.bookings);

    useFocusEffect(
        useCallback(() => {
            dispatch(fetchBookings({}));
        }, [])
    );

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: () => dispatch(logout()),
                },
            ]
        );
    };

    const menuSections: MenuSection[] = [
        {
            title: 'ACCOUNT',
            items: [
                {
                    icon: 'person',
                    iconColor: COLORS.primary,
                    label: 'Personal Information',
                    onPress: () => navigation.navigate('EditProfile'),
                },
                {
                    icon: 'location',
                    iconColor: COLORS.primary,
                    label: 'Saved Addresses',
                    onPress: () => navigation.navigate('Addresses'),
                },
                {
                    icon: 'lock-closed',
                    iconColor: '#6366F1',
                    label: 'Change Password',
                    onPress: () => navigation.navigate('ChangePassword'),
                },
            ],
        },
        {
            title: 'ACTIVITY',
            items: [
                {
                    icon: 'calendar',
                    iconColor: '#8B5CF6',
                    label: 'My Bookings',
                    onPress: () => navigation.getParent()?.navigate('BookingsTab'),
                },
                {
                    icon: 'heart',
                    iconColor: '#EF4444',
                    label: 'Favorites',
                    onPress: () => navigation.navigate('Favorites'),
                },
                {
                    icon: 'star',
                    iconColor: '#F59E0B',
                    label: 'My Reviews',
                    onPress: () => navigation.navigate('MyReviews'),
                },
            ],
        },
        {
            title: 'PAYMENTS',
            items: [
                {
                    icon: 'card',
                    iconColor: '#F97316',
                    label: 'Payment Methods',
                    onPress: () => { },
                },
                {
                    icon: 'wallet',
                    iconColor: '#3B82F6',
                    label: 'Wallet & Credits',
                    value: '₹0.00',
                    onPress: () => { },
                },
            ],
        },
        {
            title: 'SUPPORT',
            items: [
                {
                    icon: 'help-circle',
                    iconColor: COLORS.textSecondary,
                    label: 'Help Center',
                    onPress: () => navigation.navigate('Help'),
                },
            ],
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
                    <Text style={styles.editButton}>Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            {(user as any)?.photoURL ? (
                                <Image source={{ uri: (user as any).photoURL }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarInitials}>
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </Text>
                            )}
                        </View>
                    </View>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    {/* <Text style={styles.userPhone}>{user?.phone || ''}</Text>
                    <Text style={styles.userEmail}>{user?.email || ''}</Text> */}
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{Array.isArray(bookings) ? bookings.length : 0}</Text>
                        <Text style={styles.statLabel}>BOOKINGS</Text>
                    </View>
                    {/* <View style={styles.statCard}>
                        <Text style={styles.statNumber}>4.8</Text>
                        <Text style={styles.statLabel}>RATING</Text>
                    </View> */}
                </View>

                {/* Menu Sections */}
                {menuSections.map((section, sectionIndex) => (
                    <View key={sectionIndex} style={styles.menuSection}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View style={styles.menuCard}>
                            {section.items.map((item, itemIndex) => (
                                <TouchableOpacity
                                    key={itemIndex}
                                    style={[
                                        styles.menuItem,
                                        itemIndex === section.items.length - 1 && styles.menuItemLast,
                                    ]}
                                    onPress={item.onPress}
                                >
                                    <View style={[styles.menuIcon, { backgroundColor: item.iconColor + '15' }]}>
                                        <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
                                    </View>
                                    <Text style={styles.menuLabel}>{item.label}</Text>
                                    {item.value && <Text style={styles.menuValue}>{item.value}</Text>}
                                    <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                {/* App Version */}
                <Text style={styles.versionText}>
                    Servanza v{APP_INFO.version}
                </Text>
            </ScrollView>
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
        backgroundColor: COLORS.background,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize.display,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    editButton: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: SPACING.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    avatarInitials: {
        fontSize: 40,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
    },
    avatarEditButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    userName: {
        fontSize: TYPOGRAPHY.fontSize.xxl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    userPhone: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
    },
    userEmail: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        alignItems: 'center',
        ...SHADOWS.light,
    },
    statNumber: {
        fontSize: TYPOGRAPHY.fontSize.display,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textSecondary,
        letterSpacing: 0.5,
    },
    menuSection: {
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textSecondary,
        letterSpacing: 0.5,
        marginBottom: SPACING.sm,
        marginLeft: SPACING.xs,
    },
    menuCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        ...SHADOWS.light,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    menuItemLast: {
        borderBottomWidth: 0,
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    menuLabel: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textPrimary,
    },
    menuValue: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
        marginRight: SPACING.sm,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primaryLight,
        paddingVertical: SPACING.lg,
        borderRadius: BORDER_RADIUS.xxl,
        gap: SPACING.sm,
        marginTop: SPACING.md,
    },
    logoutText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
    },
    versionText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.xl,
    },
});

export default ProfileScreen;
