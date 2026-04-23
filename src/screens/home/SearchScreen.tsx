import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchServices, setSearchQuery } from '../../store/slices/servicesSlice';
import { addToCart } from '../../store/slices/cartSlice';
import type { HomeStackParamList } from '../../navigation/MainNavigator';
import type { Service } from '../../types';

type SearchNavigationProp = StackNavigationProp<HomeStackParamList, 'Search'>;

const SearchScreen: React.FC = () => {
    const navigation = useNavigation<SearchNavigationProp>();
    const dispatch = useAppDispatch();

    const { services, searchQuery, loading } = useAppSelector((state) => state.services);
    const [localQuery, setLocalQuery] = useState(searchQuery);
    const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

    const handleSearch = useCallback((text: string) => {
        setLocalQuery(text);

        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        const timeout = setTimeout(() => {
            dispatch(setSearchQuery(text));
            dispatch(fetchServices({ search: text }));
        }, 500);

        setDebounceTimeout(timeout);
    }, [debounceTimeout]);

    const handleServicePress = (serviceId: string) => {
        navigation.navigate('ServiceDetails', { serviceId });
    };

    const handleAddToCart = (service: Service) => {
        dispatch(addToCart({ service, quantity: 1 }));
    };

    const filteredServices = localQuery
        ? services.filter(s =>
            s.title.toLowerCase().includes(localQuery.toLowerCase()) ||
            s.description?.shortDescription?.toLowerCase().includes(localQuery.toLowerCase())
        )
        : services;

    const renderService = ({ item }: { item: Service }) => (
        <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => handleServicePress(item.id)}
            activeOpacity={0.9}
        >
            <View style={styles.serviceImageContainer}>
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.serviceImage} />
                ) : (
                    <View style={styles.servicePlaceholder}>
                        <Ionicons name="construct" size={28} color={COLORS.lightGray} />
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
            {/* Search Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.charcoal} />
                </TouchableOpacity>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color={COLORS.mediumGray} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search services..."
                        placeholderTextColor={COLORS.mediumGray}
                        value={localQuery}
                        onChangeText={handleSearch}
                        autoFocus
                        returnKeyType="search"
                    />
                    {localQuery.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <Ionicons name="close-circle" size={20} color={COLORS.mediumGray} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Results */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
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
                    ListHeaderComponent={
                        localQuery.length > 0 ? (
                            <Text style={styles.resultsCount}>
                                {filteredServices.length} results found
                            </Text>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search" size={48} color={COLORS.lightGray} />
                            <Text style={styles.emptyTitle}>
                                {localQuery ? 'No results found' : 'Start searching'}
                            </Text>
                            <Text style={styles.emptyText}>
                                {localQuery
                                    ? 'Try a different search term'
                                    : 'Search for services you need'
                                }
                            </Text>
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
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.offWhite,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.offWhite,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: 14,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        height: 44,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.charcoal,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    servicesList: {
        padding: SPACING.lg,
    },
    resultsCount: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.darkGray,
        marginBottom: SPACING.md,
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
        paddingTop: 80,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.charcoal,
        marginTop: 16,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.mediumGray,
        marginTop: 8,
    },
});

export default SearchScreen;
