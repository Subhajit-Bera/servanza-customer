import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import auth from '@react-native-firebase/auth';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '../../theme';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type PhoneEntryNavigationProp = StackNavigationProp<AuthStackParamList, 'PhoneEntry'>;

const PhoneEntryScreen: React.FC = () => {
    const navigation = useNavigation<PhoneEntryNavigationProp>();
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const formatPhoneNumber = (text: string) => {
        // Remove non-digits
        const cleaned = text.replace(/\D/g, '');
        // Limit to 10 digits
        return cleaned.slice(0, 10);
    };

    const handlePhoneChange = (text: string) => {
        setPhone(formatPhoneNumber(text));
    };

    const handleContinue = async () => {
        if (phone.length !== 10) {
            Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        try {
            const phoneWithCountryCode = `+91${phone}`;

            // Send OTP via Firebase
            const confirmation = await auth().signInWithPhoneNumber(phoneWithCountryCode);

            navigation.navigate('OTP', {
                phone: phoneWithCountryCode,
                confirmation,
            });
        } catch (error: any) {
            console.error('Phone auth error:', error);
            Alert.alert(
                'Error',
                error.message || 'Failed to send OTP. Please try again.'
            );
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
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.charcoal} />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.title}>Enter your phone number</Text>
                    <Text style={styles.subtitle}>
                        We'll send you a verification code to confirm your identity
                    </Text>

                    {/* Phone Input */}
                    <View style={styles.inputContainer}>
                        <View style={styles.countryCode}>
                            <Text style={styles.flag}>🇮🇳</Text>
                            <Text style={styles.countryCodeText}>+91</Text>
                            <Ionicons name="chevron-down" size={16} color={COLORS.mediumGray} />
                        </View>
                        <TextInput
                            style={styles.phoneInput}
                            placeholder="10-digit mobile number"
                            placeholderTextColor={COLORS.mediumGray}
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={handlePhoneChange}
                            maxLength={10}
                            autoFocus
                        />
                    </View>

                    {/* Continue Button */}
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            phone.length !== 10 && styles.continueButtonDisabled,
                        ]}
                        onPress={handleContinue}
                        disabled={phone.length !== 10 || loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.continueButtonText}>Send OTP</Text>
                        )}
                    </TouchableOpacity>
                </View>
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
    header: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
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
        paddingTop: SPACING.xxl,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.display,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        color: COLORS.darkGray,
        lineHeight: 24,
        marginBottom: 40,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.offWhite,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 2,
        borderColor: COLORS.lightGray,
        marginBottom: 32,
        overflow: 'hidden',
    },
    countryCode: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.lg,
        backgroundColor: COLORS.offWhite,
        borderRightWidth: 1,
        borderRightColor: COLORS.lightGray,
        gap: 8,
    },
    flag: {
        fontSize: 20,
    },
    countryCodeText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.charcoal,
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.lg,
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.charcoal,
        letterSpacing: 1,
    },
    continueButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.green,
    },
    continueButtonDisabled: {
        backgroundColor: COLORS.mediumGray,
        shadowOpacity: 0,
        elevation: 0,
    },
    continueButtonText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.white,
    },
});

export default PhoneEntryScreen;
