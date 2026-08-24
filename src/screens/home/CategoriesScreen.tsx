import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchServices, fetchCategories, setSelectedCategory } from '../../store/slices/servicesSlice';
import { ServiceImage } from '../../components/ServiceImage';
import { addToCart } from '../../store/slices/cartSlice';
import CategoriesSkeleton from '../../components/skeletons/CategoriesSkeleton';
import type { HomeStackParamList } from '../../navigation/MainNavigator';
import type { Category, Service } from '../../types';

type CategoriesRouteProp = RouteProp<HomeStackParamList, 'Categories'>;
type CategoriesNavigationProp = StackNavigationProp<HomeStackParamList, 'Categories'>;

const CategoriesScreen: React.FC = () => {
    const navigation = useNavigation<CategoriesNavigationProp>();
    const route = useRoute<CategoriesRouteProp>();
    const dispatch = useAppDispatch();

    const categoryId = route.params?.categoryId;
    const { services, categories, selectedCategoryId, loading } = useAppSelector((state) => state.services);

    useEffect(() => {
        dispatch(fetchCategories());
        if (categoryId) {
            dispatch(setSelectedCategory(categoryId));
            dispatch(fetchServices({ categoryId }));
        } else {
            dispatch(fetchServices());
        }
    }, [categoryId]);

    const handleCategorySelect = (id: string | null) => {
        dispatch(setSelectedCategory(id));
        if (id) {
            dispatch(fetchServices({ categoryId: id }));
        } else {
            dispatch(fetchServices());
        }
    };

    const handleServicePress = (serviceId: string) => {
        navigation.navigate('ServiceDetails', { serviceId });
    };

    const handleAddToCart = (service: Service) => {
        dispatch(addToCart({ service, quantity: 1 }));
    };

    const filteredServices = selectedCategoryId
        ? services.filter(s => s.categoryId === selectedCategoryId)
        : services;

    const renderCategoryChip = ({ item }: { item: Category | { id: null; name: string } }) => (
        <TouchableOpacity
            style={[
                styles.categoryChip,
                (item.id === selectedCategoryId || (!item.id && !selectedCategoryId)) && styles.categoryChipActive,
            ]}
            onPress={() => handleCategorySelect(item.id)}
        >
            <Text style={[
                styles.categoryChipText,
                (item.id === selectedCategoryId || (!item.id && !selectedCategoryId)) && styles.categoryChipTextActive,
            ]}>
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
                        <Ionicons name="construct" size={32} color={COLORS.lightGray} />
                    </View>
                )}
            </View>
            <View style={styles.serviceInfo}>
                <Text style={styles.serviceTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.serviceMetaRow}>
                    <Ionicons name="time-outline" size={14} color={COLORS.mediumGray} />
                    <Text style={styles.serviceDuration}>{item.durationMins} mins</Text>
                </View>
                <View style={styles.servicePriceRow}>
                    <Text style={styles.servicePrice}>₹{item.basePrice}</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => handleAddToCart(item)}
                    >
                        <Ionicons name="add" size={18} color={COLORS.white} />
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
                    <Ionicons name="arrow-back" size={24} color={COLORS.charcoal} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Categories</Text>
                <View style={styles.headerRight} />
            </View>

            {/* Category Chips */}
            <View style={styles.categoriesContainer}>
                <FlatList
                    horizontal
                    data={[{ id: null, name: 'All' }, ...categories]}
                    keyExtractor={(item) => item.id || 'all'}
                    renderItem={renderCategoryChip}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesList}
                />
            </View>

            {loading ? (
                <View style={{ flex: 1 }}>
                    <CategoriesSkeleton />
                </View>
            ) : (
                <FlatList
                    data={filteredServices}
                    keyExtractor={(item) => item.id}
                    renderItem={renderService}
                    numColumns={2}
                    columnWrapperStyle={styles.servicesRow}
                    contentContainerStyle={styles.servicesList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search" size={48} color={COLORS.lightGray} />
                            <Text style={styles.emptyText}>No services found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.offWhite,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.offWhite,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
    },
    headerRight: {
        width: 40,
    },
    categoriesContainer: {
        backgroundColor: COLORS.white,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
    },
    categoriesList: {
        paddingHorizontal: SPACING.lg,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.offWhite,
        marginRight: 8,
    },
    categoryChipActive: {
        backgroundColor: COLORS.primary,
    },
    categoryChipText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.darkGray,
    },
    categoryChipTextActive: {
        color: COLORS.white,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    servicesList: {
        padding: SPACING.lg,
    },
    servicesRow: {
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    serviceCard: {
        width: '48%',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        ...SHADOWS.light,
    },
    serviceImageContainer: {
        height: 100,
        backgroundColor: COLORS.lightGray,
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
        backgroundColor: COLORS.offWhite,
    },
    serviceInfo: {
        padding: SPACING.md,
    },
    serviceTitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.charcoal,
        marginBottom: 6,
        height: 36,
    },
    serviceMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    serviceDuration: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.mediumGray,
    },
    servicePriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    servicePrice: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
    },
    addButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.mediumGray,
        marginTop: 12,
    },
});

export default CategoriesScreen;
