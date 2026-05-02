import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    StatusBar as RNStatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithCredential,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    getIdToken,
} from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '../../theme';
import { APP_INFO } from '../../config/constants';
import { useAppDispatch } from '../../store/hooks';
import { verifyPhoneAuth, enterGuestMode } from '../../store/slices/authSlice';
import { StatusBar } from 'expo-status-bar';

// Configure Google Sign-In
GoogleSignin.configure({
    webClientId: '1084950496165-sb5p646jrigjbrjr6rmup0na2l7heiif.apps.googleusercontent.com',
});

type AuthMode = 'LOGIN' | 'SIGNUP';

const APP_LOGO = require('../../../assets/icon.png');

const LoginScreen: React.FC = () => {
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();

    const [mode, setMode] = useState<AuthMode>('LOGIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleEmailAuth = async () => {
        // Validation
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }
        if (!validateEmail(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }
        if (!password || password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }
        if (mode === 'SIGNUP' && password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            let userCredential;

            if (mode === 'SIGNUP') {
                // Create new account
                userCredential = await createUserWithEmailAndPassword(getAuth(), email, password);
            } else {
                // Sign in existing user
                userCredential = await signInWithEmailAndPassword(getAuth(), email, password);
            }

            // Get Firebase ID token and send to backend
            const idToken = await getIdToken(userCredential.user);
            await dispatch(verifyPhoneAuth(idToken)).unwrap();

        } catch (error: any) {
            console.error('Email auth error:', error);

            let errorMessage = 'Authentication failed. Please try again.';

            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already registered. Please login.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak. Use at least 6 characters.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email. Please sign up.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password. Please try again.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many attempts. Please try again later.';
                    break;
                default:
                    errorMessage = error.message || 'Authentication failed.';
            }

            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            // Check if your device supports Google Play
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            // Get the user's ID token
            const signInResult = await GoogleSignin.signIn();

            // Get the ID token
            const idToken = signInResult.data?.idToken;

            if (!idToken) {
                throw new Error('No ID token found');
            }

            // Create a Google credential with the token
            const googleCredential = GoogleAuthProvider.credential(idToken);

            // Sign in with the credential
            const userCredential = await signInWithCredential(getAuth(), googleCredential);

            // Get Firebase ID token and send to backend
            const firebaseIdToken = await getIdToken(userCredential.user);
            await dispatch(verifyPhoneAuth(firebaseIdToken)).unwrap();

        } catch (error: any) {
            console.error('Google login error:', error);

            let errorMessage = 'Google Sign-In failed. Please try again.';

            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // User cancelled the sign-in flow
                errorMessage = 'Sign-in was cancelled.';
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // Sign-in is already in progress
                errorMessage = 'Sign-in is already in progress.';
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                // Play services not available or outdated
                errorMessage = 'Google Play Services not available. Please update.';
            }

            Alert.alert('Error', errorMessage);
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            Alert.alert('Enter Email', 'Please enter your email address first');
            return;
        }
        if (!validateEmail(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address');
            return;
        }

        try {
            await sendPasswordResetEmail(getAuth(), email);
            Alert.alert(
                'Reset Email Sent',
                'Check your email for password reset instructions.'
            );
        } catch (error: any) {
            console.error('Password reset error:', error);
            Alert.alert('Error', 'Failed to send reset email. Please check your email address.');
        }
    };

    const handleContinueAsGuest = () => {
        dispatch(enterGuestMode());
        // RootNavigator automatically switches to MainNavigator when isGuest=true
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor="transparent" translucent />
            
            <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        bounces={false}
                        overScrollMode="never"
                    >
                        {/* Header Image with Gradient */}
                        <View style={styles.headerSection}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800' }}
                                style={styles.headerImage}
                            />
                            {/* Bottom gradient */}
                            <LinearGradient
                                colors={['transparent', 'rgba(255,255,255,0.8)', '#FFFFFF']}
                                style={styles.headerGradient}
                            />
            
                            {/* Logo on image */}
                            <View style={[styles.logoOnImage, { top: Math.max(insets.top, Platform.OS === 'android' ? RNStatusBar.currentHeight || 24 : 0) + 24 }]}>
                                <Image source={APP_LOGO} style={styles.logoIconImage} />
                                <Text style={styles.logoText}>Servanza</Text>
                            </View>
                        </View>

                        <View style={styles.formContentPadding}>
                            {/* Tab Switcher */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, mode === 'LOGIN' && styles.activeTab]}
                            onPress={() => setMode('LOGIN')}
                        >
                            <Text style={[styles.tabText, mode === 'LOGIN' && styles.activeTabText]}>
                                Log In
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, mode === 'SIGNUP' && styles.activeTab]}
                            onPress={() => setMode('SIGNUP')}
                        >
                            <Text style={[styles.tabText, mode === 'SIGNUP' && styles.activeTabText]}>
                                Sign Up
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>EMAIL</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="name@example.com"
                                placeholderTextColor={COLORS.mediumGray}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                            />
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>PASSWORD</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Enter your password"
                                    placeholderTextColor={COLORS.mediumGray}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={22}
                                        color={COLORS.mediumGray}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password (Sign Up only) */}
                        {mode === 'SIGNUP' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm your password"
                                    placeholderTextColor={COLORS.mediumGray}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                />
                            </View>
                        )}

                        {/* Forgot Password (Login only) */}
                        {mode === 'LOGIN' && (
                            <TouchableOpacity onPress={handleForgotPassword}>
                                <Text style={styles.forgotPassword}>Forgot Password?</Text>
                            </TouchableOpacity>
                        )}

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleEmailAuth}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {mode === 'LOGIN' ? 'Log In' : 'Sign Up'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Or continue with</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google Login Button */}
                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={handleGoogleLogin}
                            disabled={googleLoading}
                            activeOpacity={0.8}
                        >
                            {googleLoading ? (
                                <ActivityIndicator color={COLORS.charcoal} />
                            ) : (
                                <>
                                    <View style={styles.googleIconContainer}>
                                        <Text style={styles.googleIcon}>G</Text>
                                    </View>
                                    <Text style={styles.googleButtonText}>Google</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Terms */}
                        <Text style={styles.termsText}>
                            By continuing you agree to our{'\n'}
                            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                            <Text style={styles.termsLink}>Privacy Policy</Text>
                        </Text>

                        {/* Continue as Guest */}
                        <TouchableOpacity
                            style={styles.guestButton}
                            onPress={handleContinueAsGuest}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.guestButtonText}>Continue without Login</Text>
                        </TouchableOpacity>
                    </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    headerSection: {
        height: 400,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        position: 'relative',
        overflow: 'hidden',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    headerGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    logoOnImage: {
        position: 'absolute',
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoIconImage: {
        width: 40,
        height: 40,
        borderRadius: 10,
        resizeMode: 'cover',
    },
    logoText: {
        fontSize: 22,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.white,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
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
    formContentPadding: {
        paddingHorizontal: SPACING.xl,
        paddingTop: 0,
        paddingBottom: 40,
        marginTop: -30,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.xxl,
        padding: 4,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.lg,
    },
    activeTab: {
        backgroundColor: COLORS.white,
        ...SHADOWS.light,
    },
    tabText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.mediumGray,
    },
    activeTabText: {
        color: COLORS.charcoal,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    formContainer: {
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textSecondary,
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: COLORS.inputBackground,
        borderWidth: 0,
        borderRadius: BORDER_RADIUS.xl,
        paddingHorizontal: SPACING.lg,
        paddingVertical: 16,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textPrimary,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBackground,
        borderWidth: 0,
        borderRadius: BORDER_RADIUS.xl,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
        paddingVertical: 14,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.charcoal,
    },
    eyeButton: {
        paddingHorizontal: SPACING.md,
    },
    forgotPassword: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        textAlign: 'right',
        marginTop: -8,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        ...SHADOWS.green,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.white,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.lightGray,
    },
    dividerText: {
        marginHorizontal: 12,
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.mediumGray,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.lg,
        gap: 10,
    },
    googleIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#4285F4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    googleIcon: {
        color: COLORS.white,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        fontSize: 14,
    },
    googleButtonText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.charcoal,
    },
    termsText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.mediumGray,
        textAlign: 'center',
        lineHeight: 20,
        marginTop: 16,
    },
    termsLink: {
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    guestButton: {
        alignItems: 'center',
        paddingVertical: 14,
        marginTop: 4,
    },
    guestButtonText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.mediumGray,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        // textDecorationLine: 'underline',
    },
});

export default LoginScreen;
