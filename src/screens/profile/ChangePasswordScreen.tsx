import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '../../theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/MainNavigator';

type ChangePasswordNavigationProp = StackNavigationProp<ProfileStackParamList, 'ChangePassword'>;

const ChangePasswordScreen: React.FC = () => {
    const navigation = useNavigation<ChangePasswordNavigationProp>();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert('Error', 'New password must be at least 8 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const user = auth().currentUser;
            if (!user || !user.email) {
                Alert.alert('Error', 'User not found. Please log in again.');
                return;
            }

            // Re-authenticate
            const credential = auth.EmailAuthProvider.credential(user.email, currentPassword);
            await user.reauthenticateWithCredential(credential);

            // Update password
            await user.updatePassword(newPassword);

            Alert.alert('Success', 'Password changed successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error: any) {
            if (error.code === 'auth/wrong-password') {
                Alert.alert('Error', 'Current password is incorrect.');
            } else {
                Alert.alert('Error', error.message || 'Failed to change password.');
            }
        } finally {
            setLoading(false);
        }
    };

    const PasswordInput = ({
        label,
        value,
        onChangeText,
        show,
        onToggle,
    }: {
        label: string;
        value: string;
        onChangeText: (v: string) => void;
        show: boolean;
        onToggle: () => void;
    }) => (
        <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={!show}
                    autoCapitalize="none"
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textLight}
                />
                <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons
                        name={show ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={COLORS.textSecondary}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Change Password</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <PasswordInput
                        label="Current Password"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        show={showCurrent}
                        onToggle={() => setShowCurrent(!showCurrent)}
                    />
                    <View style={styles.divider} />
                    <PasswordInput
                        label="New Password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        show={showNew}
                        onToggle={() => setShowNew(!showNew)}
                    />
                    <View style={styles.divider} />
                    <PasswordInput
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        show={showConfirm}
                        onToggle={() => setShowConfirm(!showConfirm)}
                    />
                </View>

                <Text style={styles.hint}>
                    Password must be at least 8 characters long.
                </Text>

                <TouchableOpacity
                    style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                    onPress={handleChangePassword}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.submitBtnText}>Change Password</Text>
                    )}
                </TouchableOpacity>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    backBtn: {
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
    content: {
        padding: SPACING.lg,
        gap: SPACING.lg,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        ...SHADOWS.light,
    },
    fieldGroup: {
        paddingVertical: SPACING.sm,
    },
    fieldLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
        textTransform: 'uppercase',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 2,
        backgroundColor: COLORS.inputBackground,
    },
    input: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textPrimary,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginVertical: SPACING.sm,
    },
    hint: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textLight,
        marginTop: -SPACING.sm,
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.pill,
        paddingVertical: SPACING.md + 2,
        alignItems: 'center',
        ...SHADOWS.green,
        marginTop: SPACING.sm,
    },
    submitBtnDisabled: {
        backgroundColor: COLORS.mediumGray,
    },
    submitBtnText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.white,
    },
});

export default ChangePasswordScreen;
