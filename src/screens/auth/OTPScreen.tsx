import React, { useState, useRef, useEffect } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import auth from '@react-native-firebase/auth';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '../../theme';
import { useAppDispatch } from '../../store/hooks';
import { verifyPhoneAuth } from '../../store/slices/authSlice';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type OTPRouteProp = RouteProp<AuthStackParamList, 'OTP'>;
type OTPNavigationProp = StackNavigationProp<AuthStackParamList, 'OTP'>;

const OTP_LENGTH = 6;

const OTPScreen: React.FC = () => {
    const navigation = useNavigation<OTPNavigationProp>();
    const route = useRoute<OTPRouteProp>();
    const dispatch = useAppDispatch();

    const { phone, confirmation } = route.params;

    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        // Focus first input
        inputRefs.current[0]?.focus();

        // Start resend timer
        const timer = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleOTPChange = (value: string, index: number) => {
        if (value.length > 1) {
            // Handle paste
            const digits = value.replace(/\D/g, '').split('').slice(0, OTP_LENGTH);
            const newOtp = [...otp];
            digits.forEach((digit, i) => {
                if (index + i < OTP_LENGTH) {
                    newOtp[index + i] = digit;
                }
            });
            setOtp(newOtp);

            // Focus last filled or next empty
            const lastIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
            inputRefs.current[lastIndex]?.focus();

            // Auto verify if complete
            if (newOtp.every((d) => d !== '')) {
                verifyOTP(newOtp.join(''));
            }
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto verify if complete
        if (newOtp.every((d) => d !== '')) {
            verifyOTP(newOtp.join(''));
        }
    };

    const handleKeyPress = (event: any, index: number) => {
        if (event.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            const newOtp = [...otp];
            newOtp[index - 1] = '';
            setOtp(newOtp);
            inputRefs.current[index - 1]?.focus();
        }
    };

    const verifyOTP = async (code: string) => {
        setLoading(true);
        try {
            // Confirm OTP with Firebase
            await confirmation.confirm(code);

            // Get Firebase ID token
            const idToken = await auth().currentUser?.getIdToken();

            if (!idToken) {
                throw new Error('Failed to get ID token');
            }

            // Verify with backend
            await dispatch(verifyPhoneAuth(idToken)).unwrap();

            // Navigate to main app (handled by App.tsx rendering RootStack)
        } catch (error: any) {
            console.error('OTP verification error:', error);
            Alert.alert(
                'Invalid OTP',
                error.message || 'The code you entered is incorrect. Please try again.'
            );
            setOtp(Array(OTP_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;

        setCanResend(false);
        setResendTimer(30);

        try {
            await auth().signInWithPhoneNumber(phone);
            Alert.alert('Success', 'A new OTP has been sent to your phone');
        } catch (error: any) {
            const msg = error.code === 'auth/too-many-requests' 
                ? 'Too many requests. Please wait a while before trying again.'
                : error.message || 'Failed to resend OTP. Please try again.';
            Alert.alert('Error', msg);
            setCanResend(true);
        }
    };

    const maskedPhone = phone.replace(/(\+91)(\d{6})(\d{4})/, '$1 XXXXXX$3');

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
                    <Text style={styles.title}>Verify your phone</Text>
                    <Text style={styles.subtitle}>
                        Enter the 6-digit code sent to{'\n'}
                        <Text style={styles.phoneText}>{maskedPhone}</Text>
                    </Text>

                    {/* OTP Input */}
                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => { inputRefs.current[index] = ref; }}
                                style={[
                                    styles.otpInput,
                                    digit && styles.otpInputFilled,
                                ]}
                                value={digit}
                                onChangeText={(value) => handleOTPChange(value, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                                editable={!loading}
                            />
                        ))}
                    </View>

                    {/* Loading */}
                    {loading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={styles.loadingText}>Verifying...</Text>
                        </View>
                    )}

                    {/* Resend */}
                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>Didn't receive the code?</Text>
                        <TouchableOpacity
                            onPress={handleResend}
                            disabled={!canResend}
                        >
                            <Text style={[
                                styles.resendButton,
                                !canResend && styles.resendButtonDisabled,
                            ]}>
                                {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
                            </Text>
                        </TouchableOpacity>
                    </View>
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
    phoneText: {
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.charcoal,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    otpInput: {
        width: 50,
        height: 56,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 2,
        borderColor: COLORS.lightGray,
        backgroundColor: COLORS.offWhite,
        fontSize: TYPOGRAPHY.fontSize.xxl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
        textAlign: 'center',
    },
    otpInputFilled: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
    },
    loadingContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.darkGray,
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
    },
    resendText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.darkGray,
    },
    resendButton: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
    },
    resendButtonDisabled: {
        color: COLORS.mediumGray,
    },
});

export default OTPScreen;
