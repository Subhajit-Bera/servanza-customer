import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Modal,
    PanResponder,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS, formatCurrency } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchServices, fetchCategories } from '../../store/slices/servicesSlice';
import { addToCart } from '../../store/slices/cartSlice';
import type { HomeStackParamList } from '../../navigation/MainNavigator';
import type { Service, Category } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 3) / 2;

type AllServicesNavProp = StackNavigationProp<HomeStackParamList, 'AllServices'>;

type SortOption = 'recommended' | 'price_low' | 'price_high' | 'rating';

const AllServicesScreen: React.FC = () => {
    const navigation = useNavigation<AllServicesNavProp>();
    const dispatch = useAppDispatch();
    const { services, categories } = useAppSelector((state) => state.services);

    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<SortOption>('recommended');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Filter state (applied)
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(5000);
    const [minRating, setMinRating] = useState(0);

    // Temp filter state (modal editing before apply)
    const [tempMin, setTempMin] = useState(0);
    const [tempMax, setTempMax] = useState(5000);
    const [tempMinRating, setTempMinRating] = useState(0);
    const hasActiveFilters = minPrice > 0 || maxPrice < 5000 || minRating > 0;

    // Safe area insets for the filter modal
    const insets = useSafeAreaInsets();

    // Range slider constants
    const PRICE_MIN = 0;
    const PRICE_MAX = 5000;
    const SLIDER_WIDTH = width - SPACING.xl * 2 - SPACING.xl * 2; // modal padding * 2
    const THUMB_SIZE = 24;

    const priceToX = (price: number) =>
        ((price - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * (SLIDER_WIDTH - THUMB_SIZE);
    const xToPrice = (x: number) =>
        Math.round(((x / (SLIDER_WIDTH - THUMB_SIZE)) * (PRICE_MAX - PRICE_MIN) + PRICE_MIN) / 50) * 50;

    // PanResponder for min thumb
    const minThumbRef = useRef(tempMin);
    const maxThumbRef = useRef(tempMax);

    const minPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => { minThumbRef.current = tempMin; },
            onPanResponderMove: (_, gs) => {
                const newX = priceToX(minThumbRef.current) + gs.dx;
                const clampedX = Math.max(0, Math.min(newX, priceToX(maxThumbRef.current) - THUMB_SIZE));
                const newPrice = xToPrice(clampedX);
                setTempMin(newPrice);
            },
        })
    ).current;

    const maxPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => { maxThumbRef.current = tempMax; },
            onPanResponderMove: (_, gs) => {
                const newX = priceToX(maxThumbRef.current) + gs.dx;
                const clampedX = Math.max(priceToX(minThumbRef.current) + THUMB_SIZE, Math.min(newX, SLIDER_WIDTH - THUMB_SIZE));
                const newPrice = xToPrice(clampedX);
                setTempMax(newPrice);
            },
        })
    ).current;

    useFocusEffect(
        useCallback(() => {
            dispatch(fetchServices());
            dispatch(fetchCategories());
        }, [])
    );

    // Filter by category
    let filteredServices = selectedCategory === 'all'
        ? services
        : services.filter((s: Service) => s.categoryId === selectedCategory);

    // Apply price filter
    if (minPrice > 0) {
        filteredServices = filteredServices.filter((s: Service) => s.basePrice >= minPrice);
    }
    if (maxPrice < 5000) {
        filteredServices = filteredServices.filter((s: Service) => s.basePrice <= maxPrice);
    }

    // Apply rating filter
    if (minRating > 0) {
        filteredServices = filteredServices.filter((s: Service) => (s.averageRating || 0) >= minRating);
    }

    // Sort services
    const sortedServices = [...filteredServices].sort((a: Service, b: Service) => {
        switch (sortBy) {
            case 'price_low':
                return (a.basePrice || 0) - (b.basePrice || 0);
            case 'price_high':
                return (b.basePrice || 0) - (a.basePrice || 0);
            case 'rating':
                return (b.averageRating || 0) - (a.averageRating || 0);
            default:
                return 0;
        }
    });

    const sortLabel = {
        recommended: 'Recommended',
        price_low: 'Price: Low to High',
        price_high: 'Price: High to Low',
        rating: 'Highest Rated',
    }[sortBy];

    const handleServicePress = (serviceId: string) => {
        navigation.navigate('ServiceDetails', { serviceId });
    };

    const handleAddToCart = (service: Service) => {
        dispatch(addToCart({ service, quantity: 1 }));
    };

    const renderServiceCard = (service: Service) => (
        <TouchableOpacity
            key={service.id}
            style={styles.serviceCard}
            onPress={() => handleServicePress(service.id)}
            activeOpacity={0.9}
        >
            <View style={styles.serviceImageContainer}>
                {service.imageUrl ? (
                    <Image source={{ uri: service.imageUrl }} style={styles.serviceImage} />
                ) : (
                    <View style={styles.servicePlaceholder}>
                        <Ionicons name="construct" size={40} color={COLORS.border} />
                    </View>
                )}
                {/* Rating Badge */}
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color={COLORS.star} />
                    <Text style={styles.ratingText}>
                        {service.averageRating?.toFixed(1) || '4.5'}
                    </Text>
                </View>
            </View>
            <View style={styles.serviceInfo}>
                <Text style={styles.serviceTitle} numberOfLines={2}>
                    {service.title}
                </Text>
                {service.description?.shortDescription ? (
                    <Text style={styles.serviceDescription} numberOfLines={2}>
                        {service.description.shortDescription}
                    </Text>
                ) : null}
                <View style={styles.servicePriceRow}>
                    <View>
                        <Text style={styles.fromLabel}>From</Text>
                        <Text style={styles.servicePrice}>{formatCurrency(service.basePrice)}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => handleAddToCart(service)}
                    >
                        <Ionicons name="add" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Services</Text>
                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => navigation.navigate('Search')}
                >
                    <Ionicons name="search" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* Category Filter Chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipContainer}
                style={styles.chipScrollView}
            >
                <TouchableOpacity
                    style={[styles.chip, selectedCategory === 'all' && styles.chipActive]}
                    onPress={() => setSelectedCategory('all')}
                >
                    <Text style={[styles.chipText, selectedCategory === 'all' && styles.chipTextActive]}>
                        All
                    </Text>
                </TouchableOpacity>
                {categories.map((cat: Category) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.chip, selectedCategory === cat.id && styles.chipActive]}
                        onPress={() => setSelectedCategory(cat.id)}
                    >
                        <Text style={[styles.chipText, selectedCategory === cat.id && styles.chipTextActive]}>
                            {cat.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Filter & Sort Row */}
            <View style={styles.filterSortRow}>
                <TouchableOpacity
                    style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
                    onPress={() => {
                        setTempMin(minPrice);
                        setTempMax(maxPrice);
                        minThumbRef.current = minPrice;
                        maxThumbRef.current = maxPrice;
                        setTempMinRating(minRating);
                        setShowFilterModal(true);
                    }}
                >
                    <Ionicons name="options-outline" size={18} color={hasActiveFilters ? COLORS.white : COLORS.textSecondary} />
                    <Text style={[styles.filterLabel, hasActiveFilters && { color: COLORS.white }]}>Filter</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.sortBtn}
                    onPress={() => setShowSortMenu(!showSortMenu)}
                >
                    <Text style={styles.sortLabel}>Sort by: {sortLabel}</Text>
                    <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Sort Dropdown */}
            {showSortMenu && (
                <View style={styles.sortMenu}>
                    {(['recommended', 'price_low', 'price_high', 'rating'] as SortOption[]).map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[styles.sortMenuItem, sortBy === option && styles.sortMenuItemActive]}
                            onPress={() => { setSortBy(option); setShowSortMenu(false); }}
                        >
                            <Text style={[styles.sortMenuText, sortBy === option && styles.sortMenuTextActive]}>
                                {{
                                    recommended: 'Recommended',
                                    price_low: 'Price: Low to High',
                                    price_high: 'Price: High to Low',
                                    rating: 'Highest Rated',
                                }[option]}
                            </Text>
                            {sortBy === option && (
                                <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Services Grid */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.servicesGrid}>
                    {sortedServices.map((service: Service) => (
                        <View key={service.id} style={styles.serviceGridItem}>
                            {renderServiceCard(service)}
                        </View>
                    ))}
                </View>
                {sortedServices.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="search" size={48} color={COLORS.border} />
                        <Text style={styles.emptyText}>No services found</Text>
                    </View>
                )}
            </ScrollView>

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.filterOverlay}>
                    <View style={[styles.filterContent, { paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xl) }]}>
                        <View style={styles.filterHeader}>
                            <Text style={styles.filterTitle}>Filter Services</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {/* Price Range Slider */}
                        <Text style={styles.filterSectionTitle}>Price Range</Text>
                        <View style={styles.sliderPriceLabels}>
                            <Text style={styles.sliderPriceValue}>₹{tempMin.toLocaleString()}</Text>
                            <Text style={styles.sliderPriceValue}>₹{tempMax.toLocaleString()}</Text>
                        </View>
                        <View style={styles.sliderTrackContainer}>
                            {/* Background track */}
                            <View style={styles.sliderTrack} />
                            {/* Active range fill */}
                            <View
                                style={[
                                    styles.sliderFill,
                                    {
                                        left: priceToX(tempMin) + THUMB_SIZE / 2,
                                        right: SLIDER_WIDTH - priceToX(tempMax) - THUMB_SIZE / 2,
                                    },
                                ]}
                            />
                            {/* Min thumb */}
                            <View
                                {...minPanResponder.panHandlers}
                                style={[styles.sliderThumb, { left: priceToX(tempMin) }]}
                            />
                            {/* Max thumb */}
                            <View
                                {...maxPanResponder.panHandlers}
                                style={[styles.sliderThumb, { left: priceToX(tempMax) }]}
                            />
                        </View>

                        {/* Rating Filter */}
                        <Text style={[styles.filterSectionTitle, { marginTop: SPACING.xl }]}>Minimum Rating</Text>
                        <View style={styles.ratingRow}>
                            {[0, 3, 3.5, 4, 4.5].map((r) => (
                                <TouchableOpacity
                                    key={r}
                                    style={[
                                        styles.ratingChip,
                                        tempMinRating === r && styles.ratingChipActive,
                                    ]}
                                    onPress={() => setTempMinRating(r)}
                                >
                                    {r === 0 ? (
                                        <Text style={[styles.ratingChipText, tempMinRating === r && styles.ratingChipTextActive]}>All</Text>
                                    ) : (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                            <Text style={[styles.ratingChipText, tempMinRating === r && styles.ratingChipTextActive]}>
                                                {r}+
                                            </Text>
                                            <Ionicons name="star" size={12} color={tempMinRating === r ? COLORS.white : COLORS.star} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.filterActions}>
                            <TouchableOpacity
                                style={styles.clearFilterBtn}
                                onPress={() => {
                                    setTempMin(0);
                                    setTempMax(5000);
                                    minThumbRef.current = 0;
                                    maxThumbRef.current = 5000;
                                    setTempMinRating(0);
                                }}
                            >
                                <Text style={styles.clearFilterText}>Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.applyFilterBtn}
                                onPress={() => {
                                    setMinPrice(tempMin);
                                    setMaxPrice(tempMax);
                                    setMinRating(tempMinRating);
                                    setShowFilterModal(false);
                                }}
                            >
                                <Text style={styles.applyFilterText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    backButton: {
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
    searchButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipScrollView: {
        maxHeight: 48,
    },
    chipContainer: {
        paddingHorizontal: SPACING.lg,
        gap: SPACING.sm,
        alignItems: 'center',
    },
    chip: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    chipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chipText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textSecondary,
    },
    chipTextActive: {
        color: COLORS.white,
    },
    filterSortRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    filterLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    sortBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    sortLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    sortMenu: {
        position: 'absolute',
        top: 155,
        right: SPACING.lg,
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        paddingVertical: SPACING.sm,
        zIndex: 100,
        ...SHADOWS.medium,
        minWidth: 200,
    },
    sortMenuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    sortMenuItemActive: {
        backgroundColor: `${COLORS.primary}10`,
    },
    sortMenuText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textPrimary,
    },
    sortMenuTextActive: {
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginHorizontal: SPACING.lg,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.md,
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
        height: 140,
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
        marginBottom: 4,
    },
    serviceDescription: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
        lineHeight: 18,
    },
    servicePriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    fromLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
        marginBottom: 2,
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
    emptyContainer: {
        paddingVertical: SPACING.xxl * 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textLight,
        marginTop: SPACING.md,
    },
    filterBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    // Filter Modal
    filterOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    filterContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: BORDER_RADIUS.xxl,
        borderTopRightRadius: BORDER_RADIUS.xxl,
        padding: SPACING.xl,
        maxHeight: '70%',
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    filterTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    filterSectionTitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    priceInputWrapper: {
        flex: 1,
    },
    priceInputLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
        marginBottom: 4,
    },
    // Range Slider
    sliderPriceLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    sliderPriceValue: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
    },
    sliderTrackContainer: {
        height: 36,
        justifyContent: 'center',
        marginBottom: SPACING.md,
        position: 'relative',
    },
    sliderTrack: {
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        position: 'absolute',
        left: 0,
        right: 0,
    },
    sliderFill: {
        height: 4,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
        position: 'absolute',
    },
    sliderThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        borderWidth: 3,
        borderColor: COLORS.primary,
        position: 'absolute',
        top: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    ratingChip: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    ratingChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    ratingChipText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textPrimary,
    },
    ratingChipTextActive: {
        color: COLORS.white,
    },
    filterActions: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.xxl,
    },
    clearFilterBtn: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    clearFilterText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textSecondary,
    },
    applyFilterBtn: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        ...SHADOWS.green,
    },
    applyFilterText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.white,
    },
});

export default AllServicesScreen;
