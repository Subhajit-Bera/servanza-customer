import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    StatusBar,
    Animated,
    Image,
    ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAppDispatch } from '../../store/hooks';
import { enterGuestMode } from '../../store/slices/authSlice';

type OnboardingNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const { width, height } = Dimensions.get('window');
const ONBOARDED_KEY = 'servanza_onboarded';

interface Slide {
    id: string;
    image: ImageSourcePropType;
    title: string;
    description: string;
    gradient: [string, string];
}

const SLIDES: Slide[] = [
    {
        id: '1',
        image: require('../../../assets/onboarding1.png'),
        title: 'Discover Services',
        description: 'Find trusted home service professionals for cleaning, repairs, and everything in between.',
        gradient: ['#E8F5E9', '#F0FFF5'],
    },
    {
        id: '2',
        image: require('../../../assets/onboarding2.png'),
        title: 'Easy Booking',
        description: 'Schedule at your convenience or book instantly. Transparent pricing, no surprises.',
        gradient: ['#FFF8E1', '#FFFDE7'],
    },
    {
        id: '3',
        image: require('../../../assets/onboarding3.png'),
        title: 'Real-Time Tracking',
        description: 'Track your service buddy live on the map. Know exactly when they arrive.',
        gradient: ['#E3F2FD', '#EDE7F6'],
    },
];

const OnboardingScreen: React.FC = () => {
    const navigation = useNavigation<OnboardingNavigationProp>();
    const dispatch = useAppDispatch();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);

    const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index ?? 0);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const markOnboarded = async () => {
        try {
            await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
        } catch {}
    };

    const handleNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            await markOnboarded();
            navigation.replace('Login');
        }
    };

    const handleSkip = async () => {
        await markOnboarded();
        navigation.replace('Login');
    };

    const handleContinueAsGuest = async () => {
        await markOnboarded();
        dispatch(enterGuestMode());
        // RootNavigator switches to Main automatically
    };

    const renderItem = ({ item }: { item: Slide }) => (
        <View style={styles.slide}>
            {/* Gradient background card */}
            <LinearGradient
                colors={item.gradient}
                style={styles.imageCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Image
                    source={item.image}
                    style={styles.slideImage}
                    resizeMode="contain"
                />
            </LinearGradient>

            <View style={styles.textBlock}>
                <Text style={styles.slideTitle}>{item.title}</Text>
                <Text style={styles.slideDescription}>{item.description}</Text>
            </View>
        </View>
    );

    const isLast = currentIndex === SLIDES.length - 1;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="white" />

            {/* Skip button */}
            <View style={styles.header}>
                {!isLast && (
                    <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Slides */}
            <FlatList
                ref={slidesRef}
                data={SLIDES}
                renderItem={renderItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                bounces={false}
                keyExtractor={(item) => item.id}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onViewableItemsChanged={viewableItemsChanged}
                viewabilityConfig={viewConfig}
                scrollEventThrottle={16}
                style={styles.list}
            />

            {/* Footer */}
            <View style={styles.footer}>
                {/* Dots */}
                <View style={styles.dotsRow}>
                    {SLIDES.map((_, idx) => {
                        const dotWidth = scrollX.interpolate({
                            inputRange: [(idx - 1) * width, idx * width, (idx + 1) * width],
                            outputRange: [8, 24, 8],
                            extrapolate: 'clamp',
                        });
                        const opacity = scrollX.interpolate({
                            inputRange: [(idx - 1) * width, idx * width, (idx + 1) * width],
                            outputRange: [0.35, 1, 0.35],
                            extrapolate: 'clamp',
                        });
                        return (
                            <Animated.View
                                key={idx}
                                style={[styles.dot, { width: dotWidth, opacity }]}
                            />
                        );
                    })}
                </View>

                {/* Primary CTA */}
                <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={handleNext}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={[COLORS.primary, '#00C853']}
                        style={styles.nextBtnGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.nextBtnText}>
                            {isLast ? 'Get Started' : 'Next'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Guest link */}
                <TouchableOpacity
                    style={styles.guestBtn}
                    onPress={handleContinueAsGuest}
                    activeOpacity={0.7}
                >
                    <Text style={styles.guestBtnText}>Continue without Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        height: 56,
        paddingTop: 16,
        paddingHorizontal: SPACING.xl,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    skipText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    list: {
        flex: 1,
    },
    slide: {
        width,
        paddingHorizontal: SPACING.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageCard: {
        width: width - SPACING.xl * 2,
        height: width * 0.72,
        borderRadius: BORDER_RADIUS.xxl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xxl,
        overflow: 'hidden',
        ...SHADOWS.light,
    },
    slideImage: {
        width: '85%',
        height: '85%',
    },
    textBlock: {
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
    slideTitle: {
        fontSize: TYPOGRAPHY.fontSize.display,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.md,
        letterSpacing: 0.3,
    },
    slideDescription: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
    },
    footer: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.xxl + 12,
        paddingTop: SPACING.lg,
        alignItems: 'center',
        gap: SPACING.md,
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: SPACING.sm,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },
    nextBtn: {
        width: '100%',
        borderRadius: BORDER_RADIUS.pill,
        overflow: 'hidden',
        ...SHADOWS.green,
    },
    nextBtnGradient: {
        paddingVertical: SPACING.md + 4,
        alignItems: 'center',
    },
    nextBtnText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.white,
        letterSpacing: 0.5,
    },
    guestBtn: {
        paddingVertical: SPACING.sm,
    },
    guestBtnText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textLight,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        // textDecorationLine: 'underline',
    },
});

export default OnboardingScreen;
