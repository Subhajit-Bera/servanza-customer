import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, TYPOGRAPHY } from '../../theme';
import { APP_INFO } from '../../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_LOGO = require('../../../assets/icon.png');
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { checkAuthStatus, enterGuestMode } from '../../store/slices/authSlice';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

const { width, height } = Dimensions.get('window');
const ONBOARDED_KEY = 'servanza_onboarded';

type SplashNavigationProp = StackNavigationProp<AuthStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
    const navigation = useNavigation<SplashNavigationProp>();
    const dispatch = useAppDispatch();
    const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

    // Animations
    const logoScale = useRef(new Animated.Value(0.3)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const loadingProgress = useRef(new Animated.Value(0)).current;
    const loadingOpacity = useRef(new Animated.Value(0)).current;
    const hasNavigated = useRef(false);
    const initialLoadingRef = useRef(isLoading);

    // If auth is already resolved on mount, navigate quickly
    useEffect(() => {
        if (!initialLoadingRef.current && !hasNavigated.current) {
            hasNavigated.current = true;
            navigateAfterSplash(isAuthenticated);
        }
    }, []);

    useEffect(() => {
        // Start animations
        Animated.sequence([
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]),
            Animated.timing(textOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(taglineOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.parallel([
                Animated.timing(loadingOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(loadingProgress, {
                    toValue: 0.5,
                    duration: 800,
                    useNativeDriver: false,
                }),
            ]),
        ]).start();

        dispatch(checkAuthStatus());
    }, []);

    useEffect(() => {
        if (!isLoading && !hasNavigated.current) {
            hasNavigated.current = true;
            Animated.timing(loadingProgress, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
            }).start(() => {
                setTimeout(() => navigateAfterSplash(isAuthenticated), 200);
            });
        }
    }, [isLoading, isAuthenticated]);

    const navigateAfterSplash = async (authenticated: boolean) => {
        if (authenticated) {
            // Already logged in — go straight to main app
            // enterGuestMode not needed; isAuthenticated=true makes showMain=true
            // But we're in Auth stack — navigate to nothing; App.tsx will switch
            // Actually: just navigate to Login to keep Auth stack valid, App.tsx
            // switches to Main because isAuthenticated=true
            navigation.replace('Login');
            return;
        }
        // Not authenticated — check if first launch
        try {
            const onboarded = await AsyncStorage.getItem(ONBOARDED_KEY);
            if (onboarded === 'true') {
                navigation.replace('Login');
            } else {
                navigation.replace('Onboarding');
            }
        } catch {
            navigation.replace('Login');
        }
        // NOTE: We do NOT dispatch enterGuestMode() here.
        // The Auth stack (showMain=false) stays open until the user explicitly
        // taps "Continue as Guest" (OnboardingScreen / LoginScreen) which
        // dispatches enterGuestMode() → showMain=true → root switches to Main.
    };


    const progressWidth = loadingProgress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Gradient Background */}
            <LinearGradient
                colors={['#FFFFFF', '#F0FFF5', '#E8FFF0']}
                style={styles.gradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />

            {/* Content */}
            <View style={styles.content}>
                {/* Logo */}
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            transform: [{ scale: logoScale }],
                            opacity: logoOpacity,
                        },
                    ]}
                >
                    <Image source={APP_LOGO} style={styles.logoImage} />
                </Animated.View>

                {/* App Name */}
                <Animated.Text
                    style={[
                        styles.appName,
                        { opacity: textOpacity },
                    ]}
                >
                    {APP_INFO.name}
                </Animated.Text>

                {/* Tagline */}
                <Animated.Text
                    style={[
                        styles.tagline,
                        { opacity: taglineOpacity },
                    ]}
                >
                    {APP_INFO.tagline}
                </Animated.Text>
            </View>

            {/* Loading Section */}
            <Animated.View style={[styles.loadingContainer, { opacity: loadingOpacity }]}>
                <Text style={styles.loadingText}>LOADING</Text>
                <View style={styles.progressBar}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            { width: progressWidth }
                        ]}
                    />
                </View>
                <Text style={styles.versionText}>V{APP_INFO.version}</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    logoContainer: {
        marginBottom: 24,
    },
    logoImage: {
        width: 100,
        height: 100,
        borderRadius: 24,
        resizeMode: 'cover',
    },
    appName: {
        fontSize: TYPOGRAPHY.fontSize.hero,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    tagline: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        letterSpacing: 0.3,
    },
    loadingContainer: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    loadingText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
        letterSpacing: 2,
        marginBottom: 12,
    },
    progressBar: {
        width: width - 80,
        height: 4,
        backgroundColor: COLORS.lightGray,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    versionText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.mediumGray,
        marginTop: 24,
        letterSpacing: 1,
    },
});

export default SplashScreen;
