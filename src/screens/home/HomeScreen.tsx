import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    Image,
    Dimensions,
    Linking,
} from 'react-native';
import { runAfterInteractions } from '../../utils/interactions';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS, formatCurrency } from '../../theme';
import HomeScreenSkeleton from '../../components/skeletons/HomeScreenSkeleton';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchServices, fetchCategories } from '../../store/slices/servicesSlice';
import { ServiceImage } from '../../components/ServiceImage';
import { addToCart } from '../../store/slices/cartSlice';
import { promotionsApi } from '../../api/client';
import type { HomeStackParamList } from '../../navigation/MainNavigator';
import type { Service, Category } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 3) / 2;
const PROMO_WIDTH = width - SPACING.lg * 2;

// Fallback banner colors when no image available
const FALLBACK_COLORS = ['#2EAB6E', '#3B82F6', '#F59E0B', '#EF4444'];

interface Promotion {
    id: string;
    title: string;
    subtitle?: string;
    imageUrl: string;
    ctaLabel?: string;
    ctaLink?: string;
}

// App logo
const APP_LOGO = require('../../../assets/icon.png');

type HomeNavigationProp = StackNavigationProp<HomeStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
    const navigation = useNavigation<HomeNavigationProp>();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const { services, categories, isServicesLoading } = useAppSelector((state) => state.services);
    const { user, addresses } = useAppSelector((state) => state.auth);
    const { totalItems } = useAppSelector((state) => state.cart);

    const [refreshing, setRefreshing] = useState(false);
    const [activePromo, setActivePromo] = useState(0);
    const promoRef = useRef<FlatList>(null);
    const [currentAddress, setCurrentAddress] = useState<string | null>(null);
    const [locationDenied, setLocationDenied] = useState(false);
    const [promotions, setPromotions] = useState<Promotion[]>([]);


    // Get default address from saved addresses as fallback
    const defaultAddress = addresses?.find((a: any) => a.isDefault) || addresses?.[0];

    useEffect(() => {
        const task = runAfterInteractions(() => {
            loadData();
            requestLocationPermission();
            fetchPromotions();
        });

        return () => task.cancel();
    }, []);

    // Auto-scroll promo banner every 3 seconds — only while screen is focused
    useFocusEffect(
        useCallback(() => {
            if (promotions.length <= 1) return;
            const timer = setInterval(() => {
                setActivePromo((prev) => {
                    const next = (prev + 1) % promotions.length;
                    promoRef.current?.scrollToIndex({ index: next, animated: true });
                    return next;
                });
            }, 3000);
            return () => clearInterval(timer);
        }, [promotions.length])
    );

    const fetchPromotions = async () => {
        try {
            const { data } = await promotionsApi.getPromotions();
            setPromotions(data.data || data);
        } catch (error) {
            console.log('Promotions fetch error (non-critical):', error);
        }
    };

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationDenied(true);
                return;
            }
            const location = await Location.getCurrentPositionAsync({});

            // Race reverseGeocodeAsync against a 4s timeout (Android geocoder can hang)
            const geocodePromise = Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
            const timeoutPromise = new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), 4000)
            );
            const result = await Promise.race([geocodePromise, timeoutPromise]);

            if (result && Array.isArray(result) && result[0]) {
                const geocoded = result[0];
                const parts = [
                    geocoded.street,
                    geocoded.city,
                    geocoded.region,
                ].filter(Boolean);
                setCurrentAddress(parts.join(', ') || geocoded.name || null);
            }
        } catch (error) {
            // Non-critical — location display is cosmetic only
            console.log('Location error (non-critical):', error);
        }
    };

    const loadData = async () => {
        await Promise.all([
            dispatch(fetchServices()),
            dispatch(fetchCategories()),
        ]);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    const handleServicePress = (serviceId: string) => {
        navigation.navigate('ServiceDetails', { serviceId });
    };

    const handleCategoryPress = (categoryId: string) => {
        navigation.navigate('Categories', { categoryId });
    };

    const handleAddToCart = (service: Service) => {
        dispatch(addToCart({ service, quantity: 1 }));
    };

    const handlePromoPress = (promo: Promotion) => {
        if (!promo.ctaLink) return;
        const link = promo.ctaLink.trim();
        if (link.startsWith('service:')) {
            const serviceId = link.replace('service:', '').trim();
            if (serviceId) navigation.navigate('ServiceDetails', { serviceId });
        } else if (link.startsWith('category:')) {
            const categoryId = link.replace('category:', '').trim();
            if (categoryId) navigation.navigate('Categories', { categoryId });
        } else if (link.startsWith('http')) {
            Linking.openURL(link).catch(() => {});
        }
    };

    const renderPromo = ({ item, index }: { item: Promotion; index: number }) => (
        <TouchableOpacity
            style={styles.promoCard}
            activeOpacity={0.9}
            onPress={() => handlePromoPress(item)}
        >
            <ServiceImage
                url={item.imageUrl}
                style={styles.promoImage}
                contentFit="cover"
            />
            {/* Gradient overlay */}
            <View style={styles.promoOverlay}>
                <Text style={styles.promoTitle} numberOfLines={2}>{item.title}</Text>
                {item.subtitle ? (
                    <Text style={styles.promoSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                ) : null}
                <TouchableOpacity
                    style={styles.promoButton}
                    onPress={() => handlePromoPress(item)}
                >
                    <Text style={styles.promoButtonText}>{item.ctaLabel || 'Book Now'}</Text>
                </TouchableOpacity>
            </View>
            {/* Dot indicator */}
            {promotions.length > 1 && (
                <View style={styles.promoDots}>
                    {promotions.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.promoDot,
                                i === activePromo && styles.promoDotActive,
                            ]}
                        />
                    ))}
                </View>
            )}
        </TouchableOpacity>
    );

    const renderCategory = ({ item }: { item: Category }) => (
        <TouchableOpacity
            style={styles.categoryItem}
            onPress={() => handleCategoryPress(item.id)}
            activeOpacity={0.8}
        >
            <View style={styles.categoryIcon}>
                {item.icon ? (
                    <ServiceImage url={item.icon} style={styles.categoryIconImage} />
                ) : (
                    <Ionicons name="grid" size={28} color={COLORS.primary} />
                )}
            </View>
            <Text style={styles.categoryName} numberOfLines={1}>
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    const renderService = ({ item }: { item: Service }) => (
        <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => handleServicePress(item.id)}
            activeOpacity={0.9}
        >
            <View style={styles.serviceImageContainer}>
                {item.imageUrl ? (
                    <ServiceImage url={item.imageUrl} style={styles.serviceImage} />
                ) : (
                    <View style={styles.servicePlaceholder}>
                        <Ionicons name="construct" size={40} color={COLORS.border} />
                    </View>
                )}
                {/* Rating Badge */}
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color={COLORS.star} />
                    <Text style={styles.ratingText}>4.8</Text>
                </View>
            </View>
            <View style={styles.serviceInfo}>
                <Text style={styles.serviceTitle} numberOfLines={2}>
                    {item.title}
                </Text>
                <View style={styles.servicePriceRow}>
                    <Text style={styles.servicePrice}>{formatCurrency(item.basePrice)}</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => handleAddToCart(item)}
                    >
                        <Ionicons name="add" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Limit services displayed on home (top services preview)
    const topServices = services.slice(0, 6);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header with Location */}
            <View style={styles.header}>
                {/* Servanza Logo */}
                <View style={styles.logoContainer}>
                    <Image source={APP_LOGO} style={styles.logoImage} />
                </View>

                <TouchableOpacity style={styles.locationContainer}>
                    <Ionicons name="location" size={16} color={COLORS.primary} />
                    <View style={styles.locationTextContainer}>
                        <Text style={styles.locationLabel}>CURRENT LOCATION</Text>
                        <View style={styles.locationRow}>
                            <Text style={styles.locationAddress} numberOfLines={1}>
                                {currentAddress || defaultAddress?.formattedAddress || defaultAddress?.streetAddress || (locationDenied ? 'Set your location' : 'Fetching location...')}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color={COLORS.textPrimary} />
                        </View>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={() => {
                        navigation.getParent()?.dispatch(
                            CommonActions.navigate({
                                name: 'ProfileTab',
                                params: {
                                    screen: 'Notifications',
                                },
                            })
                        );
                    }}
                >
                    <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
                    <View style={styles.notificationDot} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Skeleton loading on initial fetch */}
                {isServicesLoading && services.length === 0 ? (
                    <HomeScreenSkeleton />
                ) : (
                <>
                {/* Search Bar */}
                <TouchableOpacity
                    style={styles.searchBar}
                    onPress={() => navigation.navigate('Search')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="search" size={20} color={COLORS.textLight} />
                    <Text style={styles.searchPlaceholder}>Search...</Text>
                </TouchableOpacity>

                {/* Promo Carousel */}
                {promotions.length > 0 && (
                    <View style={styles.promoSection}>
                        <FlatList
                            ref={promoRef}
                            horizontal
                            data={promotions}
                            keyExtractor={(item) => item.id}
                            renderItem={renderPromo}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: SPACING.lg }}
                            snapToInterval={PROMO_WIDTH + SPACING.md}
                            decelerationRate="fast"
                            onScrollToIndexFailed={() => {}}
                            onMomentumScrollEnd={(e) => {
                                const index = Math.round(e.nativeEvent.contentOffset.x / (PROMO_WIDTH + SPACING.md));
                                setActivePromo(index);
                            }}
                        />
                    </View>
                )}

                {/* Instant Service Card */}
                <View style={styles.instantServiceWrapper}>
                    <LinearGradient
                        colors={['#0F766E', '#065F46']}
                        style={styles.instantCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.instantCardHeader}>
                            <View style={styles.instantTitleRow}>
                                <Ionicons name="flash" size={24} color="#FBBF24" />
                                <Text style={styles.instantTitle}>Instant Service</Text>
                            </View>
                            <View style={styles.instantPriceBadge}>
                                <Text style={styles.instantPriceText}>₹2/min</Text>
                            </View>
                        </View>
                        
                        <Text style={styles.instantSubtitle}>
                            Professional help in minutes, not hours.
                        </Text>
                        
                        <View style={styles.instantDurationRow}>
                            <View style={styles.instantDurationPill}>
                                <Ionicons name="time-outline" size={16} color={COLORS.white} />
                                <Text style={styles.instantDurationText}>45 Minutes</Text>
                            </View>
                            <View style={styles.instantDurationPill}>
                                <Ionicons name="time-outline" size={16} color={COLORS.white} />
                                <Text style={styles.instantDurationText}>1.5 Hours</Text>
                            </View>
                        </View>
                        
                        <TouchableOpacity 
                            style={styles.instantBookButton}
                            onPress={() => navigation.navigate('AllServices')}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.instantBookText}>BOOK NOW</Text>
                            <Ionicons name="arrow-forward" size={18} color="#065F46" />
                        </TouchableOpacity>
                    </LinearGradient>
                </View>

                {/* Categories */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Categories</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Categories', {})}>
                            <Text style={styles.seeAllText}>See all</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        horizontal
                        data={categories}
                        keyExtractor={(item) => item.id}
                        renderItem={renderCategory}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesList}
                    />
                </View>

                {/* Top Services */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Top Services</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('AllServices')}>
                            <Text style={styles.seeAllText}>See all</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.servicesGrid}>
                        {topServices.map((service: Service) => (
                            <View key={service.id} style={styles.serviceGridItem}>
                                {renderService({ item: service })}
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.bottomPadding} />
                </>
                )}
            </ScrollView>


        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
    },
    logoContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoImage: {
        width: 36,
        height: 36,
        borderRadius: 10,
        resizeMode: 'cover',
    },
    locationContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
    },
    locationTextContainer: {
        alignItems: 'center',
    },
    locationLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textSecondary,
        letterSpacing: 0.5,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    locationAddress: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
        maxWidth: 180,
    },
    notificationButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },
    scrollView: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    scrollContent: {
        paddingBottom: SPACING.xxl,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.xl,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
        gap: SPACING.sm,
    },
    searchPlaceholder: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textLight,
    },
    promoSection: {
        marginBottom: SPACING.xl,
    },
    promoCard: {
        width: PROMO_WIDTH,
        height: 160,
        marginRight: SPACING.md,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        position: 'relative',
    },
    promoImage: {
        width: '100%',
        height: '100%',
    },
    promoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        padding: SPACING.md,
        paddingBottom: SPACING.lg,
    },
    promoDots: {
        position: 'absolute',
        bottom: SPACING.sm,
        right: SPACING.md,
        flexDirection: 'row',
        gap: 4,
    },
    promoDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    promoDotActive: {
        backgroundColor: COLORS.white,
        width: 18,
        borderRadius: 3,
    },
    promoTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.white,
        marginBottom: 2,
    },
    promoSubtitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: SPACING.sm,
    },
    promoButton: {
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.md,
        alignSelf: 'flex-start',
        marginTop: SPACING.xs,
    },
    promoButtonText: {
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        fontSize: TYPOGRAPHY.fontSize.sm,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
        paddingHorizontal: SPACING.lg,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    seeAllText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.primary,
    },
    categoriesList: {
        paddingHorizontal: SPACING.lg,
    },
    categoryItem: {
        alignItems: 'center',
        marginRight: SPACING.lg,
        width: 75,
    },
    categoryIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
        overflow: 'hidden', // Ensure image stays within circle
    },
    categoryIconImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    categoryName: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: SPACING.lg - SPACING.sm,
    },
    serviceGridItem: {
        width: '50%',
        paddingHorizontal: SPACING.sm,
        marginBottom: SPACING.md,
    },
    serviceCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    serviceImageContainer: {
        height: 120,
        backgroundColor: COLORS.background,
        position: 'relative',
    },
    serviceImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    servicePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    ratingBadge: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.md,
        gap: 2,
        ...SHADOWS.light,
    },
    instantServiceWrapper: {
        paddingHorizontal: SPACING.lg,
        marginVertical: SPACING.lg,
    },
    instantCard: {
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        ...SHADOWS.green,
    },
    instantCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    instantTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    instantTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.white,
    },
    instantPriceBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BORDER_RADIUS.md,
    },
    instantPriceText: {
        color: COLORS.white,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        fontSize: TYPOGRAPHY.fontSize.sm,
    },
    instantSubtitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: TYPOGRAPHY.fontSize.md,
        marginBottom: SPACING.lg,
    },
    instantDurationRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    instantDurationPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BORDER_RADIUS.pill,
    },
    instantDurationText: {
        color: COLORS.white,
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    instantBookButton: {
        backgroundColor: COLORS.white,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.lg,
    },
    instantBookText: {
        color: '#065F46',
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        fontSize: TYPOGRAPHY.fontSize.md,
    },
    ratingText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
    },
    serviceInfo: {
        padding: SPACING.md,
    },
    serviceTitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
        height: 40,
    },
    servicePriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    servicePrice: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    bottomPadding: {
        height: 20,
    },

});

export default HomeScreen;
