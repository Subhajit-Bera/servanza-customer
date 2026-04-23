import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateProfile } from '../../store/slices/authSlice';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type ProfileSetupRouteProp = RouteProp<AuthStackParamList, 'ProfileSetup'>;
type ProfileSetupNavigationProp = StackNavigationProp<AuthStackParamList, 'ProfileSetup'>;

const ProfileSetupScreen: React.FC = () => {
    const navigation = useNavigation<ProfileSetupNavigationProp>();
    const route = useRoute<ProfileSetupRouteProp>();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);

    const isNewUser = route.params?.isNewUser ?? true;

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [loading, setLoading] = useState(false);

    const isValid = name.trim().length >= 2;

    const handleSave = async () => {
        if (!isValid) {
            Alert.alert('Invalid Name', 'Please enter your full name');
            return;
        }

        setLoading(true);
        try {
            await dispatch(updateProfile({
                name: name.trim(),
                email: email.trim() || undefined,
            })).unwrap();

            // Navigate to main app
            navigation.reset({
                index: 0,
                routes: [{ name: 'Splash' }],
            });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        {!isNewUser && (
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Ionicons name="arrow-back" size={24} color={COLORS.charcoal} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {/* Icon */}
                        <View style={styles.iconContainer}>
                            <Ionicons name="person-circle" size={80} color={COLORS.primary} />
                        </View>

                        <Text style={styles.title}>
                            {isNewUser ? 'Complete your profile' : 'Edit Profile'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {isNewUser
                                ? 'Tell us a bit about yourself to get started'
                                : 'Update your personal information'
                            }
                        </Text>

                        {/* Form */}
                        <View style={styles.form}>
                            {/* Name Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name *</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="person-outline" size={20} color={COLORS.mediumGray} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your full name"
                                        placeholderTextColor={COLORS.mediumGray}
                                        value={name}
                                        onChangeText={setName}
                                        autoCapitalize="words"
                                        autoComplete="name"
                                    />
                                </View>
                            </View>

                            {/* Email Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email (Optional)</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="mail-outline" size={20} color={COLORS.mediumGray} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your email address"
                                        placeholderTextColor={COLORS.mediumGray}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                !isValid && styles.saveButtonDisabled,
                            ]}
                            onPress={handleSave}
                            disabled={!isValid || loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text style={styles.saveButtonText}>
                                    {isNewUser ? 'Get Started' : 'Save Changes'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {isNewUser && (
                            <TouchableOpacity
                                style={styles.skipButton}
                                onPress={() => navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Splash' }],
                                })}
                            >
                                <Text style={styles.skipButtonText}>Skip for now</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        height: 60,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.offWhite,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.display,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.darkGray,
        textAlign: 'center',
        marginBottom: 32,
    },
    form: {
        gap: 20,
        marginBottom: 32,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.charcoal,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.offWhite,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        paddingHorizontal: SPACING.lg,
        gap: 12,
    },
    input: {
        flex: 1,
        paddingVertical: SPACING.lg,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.charcoal,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.green,
    },
    saveButtonDisabled: {
        backgroundColor: COLORS.mediumGray,
        shadowOpacity: 0,
        elevation: 0,
    },
    saveButtonText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.white,
    },
    skipButton: {
        marginTop: 16,
        alignItems: 'center',
        paddingVertical: 12,
    },
    skipButtonText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.mediumGray,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
});

export default ProfileSetupScreen;
