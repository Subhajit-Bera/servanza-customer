import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme';
import { userApi } from '../../api/client';

interface Preferences {
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    marketingEnabled: boolean;
}

const NotificationPreferencesScreen: React.FC = () => {
    const navigation = useNavigation();
    const [preferences, setPreferences] = useState<Preferences>({
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: true,
        marketingEnabled: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const response = await userApi.getNotificationPreferences();
            if (response.data?.data) {
                setPreferences({
                    pushEnabled: response.data.data.pushEnabled ?? true,
                    emailEnabled: response.data.data.emailEnabled ?? true,
                    smsEnabled: response.data.data.smsEnabled ?? true,
                    marketingEnabled: response.data.data.marketingEnabled ?? false,
                });
            }
        } catch (error) {
            console.error('Failed to load notification preferences:', error);
            Alert.alert('Error', 'Failed to load preferences');
        } finally {
            setLoading(false);
        }
    };

    const toggleSwitch = (key: keyof Preferences) => {
        setPreferences((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await userApi.updateNotificationPreferences(preferences);
            Alert.alert('Success', 'Notification preferences saved', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Failed to update notification preferences:', error);
            Alert.alert('Error', 'Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Communication Preferences</Text>
                <Text style={styles.sectionSubtitle}>Choose how you want to receive updates about your bookings and account.</Text>

                <View style={styles.optionContainer}>
                    <View style={styles.optionTextContainer}>
                        <Text style={styles.optionTitle}>Push Notifications</Text>
                        <Text style={styles.optionDescription}>Receive alerts directly on your device</Text>
                    </View>
                    <Switch
                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                        thumbColor={COLORS.white}
                        ios_backgroundColor={COLORS.border}
                        onValueChange={() => toggleSwitch('pushEnabled')}
                        value={preferences.pushEnabled}
                    />
                </View>

                <View style={styles.optionContainer}>
                    <View style={styles.optionTextContainer}>
                        <Text style={styles.optionTitle}>Email Updates</Text>
                        <Text style={styles.optionDescription}>Receive booking confirmations via email</Text>
                    </View>
                    <Switch
                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                        thumbColor={COLORS.white}
                        ios_backgroundColor={COLORS.border}
                        onValueChange={() => toggleSwitch('emailEnabled')}
                        value={preferences.emailEnabled}
                    />
                </View>

                <View style={styles.optionContainer}>
                    <View style={styles.optionTextContainer}>
                        <Text style={styles.optionTitle}>SMS Alerts</Text>
                        <Text style={styles.optionDescription}>Receive OTP and arrival tracking via SMS</Text>
                    </View>
                    <Switch
                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                        thumbColor={COLORS.white}
                        ios_backgroundColor={COLORS.border}
                        onValueChange={() => toggleSwitch('smsEnabled')}
                        value={preferences.smsEnabled}
                    />
                </View>

                <View style={styles.optionContainer}>
                    <View style={styles.optionTextContainer}>
                        <Text style={styles.optionTitle}>Promotional Offers</Text>
                        <Text style={styles.optionDescription}>Receive marketing emails and exclusive discounts</Text>
                    </View>
                    <Switch
                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                        thumbColor={COLORS.white}
                        ios_backgroundColor={COLORS.border}
                        onValueChange={() => toggleSwitch('marketingEnabled')}
                        value={preferences.marketingEnabled}
                    />
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Preferences</Text>
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
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        ...TYPOGRAPHY.h3,
        color: COLORS.textPrimary,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: SPACING.xl,
    },
    sectionTitle: {
        ...TYPOGRAPHY.h3,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    sectionSubtitle: {
        ...TYPOGRAPHY.body2,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xl,
    },
    optionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    optionTextContainer: {
        flex: 1,
        paddingRight: SPACING.lg,
    },
    optionTitle: {
        ...TYPOGRAPHY.subtitle1,
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    optionDescription: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
    },
    footer: {
        padding: SPACING.xl,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        ...TYPOGRAPHY.subtitle1,
        color: COLORS.white,
        fontWeight: 'bold',
    },
});

export default NotificationPreferencesScreen;
