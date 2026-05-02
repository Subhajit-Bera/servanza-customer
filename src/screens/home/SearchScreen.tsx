import React, { useState, useCallback, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchServices, setSearchQuery } from '../../store/slices/servicesSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { useDebounce } from '../../hooks/useDebounce';
import type { HomeStackParamList } from '../../navigation/MainNavigator';
import type { Service } from '../../types';

type SearchNavigationProp = StackNavigationProp<HomeStackParamList, 'Search'>;

const SearchScreen: React.FC = () => {
    const navigation = useNavigation<SearchNavigationProp>();
    const dispatch = useAppDispatch();

    const { services, searchQuery, loading } = useAppSelector((state) => state.services);
    const [localQuery, setLocalQuery] = useState(searchQuery);
    const debouncedQuery = useDebounce(localQuery, 500);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    const TRENDING_SEARCHES = ['AC Service', 'Home Cleaning', 'Electrician', 'Plumber'];

    useEffect(() => {
        loadRecentSearches();
    }, []);

    useEffect(() => {
        if (debouncedQuery !== searchQuery) {
            dispatch(setSearchQuery(debouncedQuery));
            dispatch(fetchServices({ search: debouncedQuery }));
        }
    }, [debouncedQuery, dispatch, searchQuery]);

    const loadRecentSearches = async () => {
        try {
            const saved = await AsyncStorage.getItem('servanza_recent_searches');
            if (saved) {
                setRecentSearches(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load recent searches', e);
        }
    };

    const saveRecentSearch = async (query: string) => {
        if (!query.trim()) return;
        try {
            const q = query.trim();
            const updated = [q, ...recentSearches.filter(item => item.toLowerCase() !== q.toLowerCase())].slice(0, 5);
            setRecentSearches(updated);
            await AsyncStorage.setItem('servanza_recent_searches', JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save recent search', e);
        }
    };

    const handleClearRecent = async () => {
        setRecentSearches([]);
        await AsyncStorage.removeItem('servanza_recent_searches');
    };

    const handleSearchSubmit = () => {
        if (localQuery) {
            saveRecentSearch(localQuery);
        }
    };

    const handleSearch = useCallback((text: string) => {
        setLocalQuery(text);
    }, []);

    const handleSelectRecentOrTrending = (query: string) => {
        setLocalQuery(query);
        saveRecentSearch(query);
        dispatch(setSearchQuery(query));
        dispatch(fetchServices({ search: query }));
    };

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
                        onSubmitEditing={handleSearchSubmit}
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

            {/* Results or Suggestions */}
            {!localQuery ? (
                <View style={styles.suggestionsContainer}>
                    {recentSearches.length > 0 && (
                        <View style={styles.suggestionSection}>
                            <View style={styles.suggestionHeader}>
                                <Text style={styles.suggestionTitle}>Recent Searches</Text>
                                <TouchableOpacity onPress={handleClearRecent}>
                                    <Text style={styles.clearText}>Clear</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.chipContainer}>
                                {recentSearches.map((term, index) => (
                                    <TouchableOpacity 
                                        key={`recent-${index}`} 
                                        style={styles.chip}
                                        onPress={() => handleSelectRecentOrTrending(term)}
                                    >
                                        <Ionicons name="time-outline" size={16} color={COLORS.darkGray} />
                                        <Text style={styles.chipText}>{term}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    <View style={styles.suggestionSection}>
                        <Text style={styles.suggestionTitle}>Trending Services</Text>
                        <View style={styles.chipContainer}>
                            {TRENDING_SEARCHES.map((term, index) => (
                                <TouchableOpacity 
                                    key={`trending-${index}`} 
                                    style={styles.chip}
                                    onPress={() => handleSelectRecentOrTrending(term)}
                                >
                                    <Ionicons name="trending-up" size={16} color={COLORS.primary} />
                                    <Text style={styles.chipText}>{term}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            ) : loading ? (
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
                            <Text style={styles.emptyTitle}>No results found</Text>
                            <Text style={styles.emptyText}>Try a different search term</Text>
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
    },
    serviceMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 8,
        gap: 4,
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
        color: COLORS.primary,
    },
    addButton: {
        backgroundColor: COLORS.primary,
        padding: 6,
        borderRadius: BORDER_RADIUS.md,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.darkGray,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.mediumGray,
        textAlign: 'center',
    },
    suggestionsContainer: {
        flex: 1,
        padding: SPACING.lg,
    },
    suggestionSection: {
        marginBottom: SPACING.xl,
    },
    suggestionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    suggestionTitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
    },
    clearText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.error,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
    },
    chipText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.charcoal,
    },
});

export default SearchScreen;
