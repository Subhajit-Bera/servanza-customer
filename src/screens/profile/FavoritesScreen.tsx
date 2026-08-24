import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchFavorites, removeFromFavorites } from '../../store/slices/favoritesSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { ServiceImage } from '../../components/ServiceImage';
import type { Favorite } from '../../types';

const FavoritesScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();

    const { items, isLoading, error } = useAppSelector((state) => state.favorites);
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    useEffect(() => {
        dispatch(fetchFavorites());
    }, [dispatch]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await dispatch(fetchFavorites());
        setIsRefreshing(false);
    }, [dispatch]);

    const handleRemoveFavorite = (serviceId: string) => {
        dispatch(removeFromFavorites(serviceId));
    };

    const handleAddToCart = (favorite: Favorite) => {
        dispatch(addToCart({ service: favorite.service }));
    };

    const handleServicePress = (serviceId: string) => {
        navigation.navigate('HomeTab', {
            screen: 'ServiceDetails',
            params: { serviceId },
        });
    };

    const renderFavoriteItem = ({ item }: { item: Favorite }) => (
        <TouchableOpacity
            style={styles.favoriteCard}
            onPress={() => handleServicePress(item.serviceId)}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                {item.service?.imageUrl ? (
                    <ServiceImage url={item.service.imageUrl} style={styles.image} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="construct" size={32} color={COLORS.lightGray} />
                    </View>
                )}
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.serviceName} numberOfLines={2}>
                    {item.service?.title || 'Service'}
                </Text>
                <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={14} color={COLORS.mediumGray} />
                    <Text style={styles.duration}>{item.service?.durationMins || 0} mins</Text>
                </View>
                <Text style={styles.price}>₹{item.service?.basePrice || 0}</Text>
            </View>
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={styles.heartButton}
                    onPress={() => handleRemoveFavorite(item.serviceId)}
                >
                    <Ionicons name="heart" size={24} color={COLORS.coral} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddToCart(item)}
                >
                    <Ionicons name="add" size={20} color={COLORS.white} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={COLORS.lightGray} />
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptySubtitle}>
                Tap the heart icon on any service to add it here
            </Text>
            <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.navigate('HomeTab')}
            >
                <Text style={styles.browseButtonText}>Browse Services</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.charcoal} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Favorites</Text>
                <View style={styles.headerRight}>
                    <Text style={styles.countBadge}>{items.length}</Text>
                </View>
            </View>

            {/* Content */}
            {isLoading && items.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    renderItem={renderFavoriteItem}
                    contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            colors={[COLORS.primary]}
                            tintColor={COLORS.primary}
                        />
                    }
                    showsVerticalScrollIndicator={false}
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
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
    },
    headerRight: {
        width: 40,
        alignItems: 'flex-end',
    },
    countBadge: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: SPACING.md,
    },
    emptyList: {
        flex: 1,
    },
    favoriteCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        ...SHADOWS.light,
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: BORDER_RADIUS.md,
        overflow: 'hidden',
        backgroundColor: COLORS.lightGray,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContainer: {
        flex: 1,
        marginLeft: SPACING.md,
        justifyContent: 'center',
    },
    serviceName: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.charcoal,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    duration: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.mediumGray,
    },
    price: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
    },
    actionsContainer: {
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    heartButton: {
        padding: SPACING.xs,
    },
    addButton: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.md,
        padding: 8,
        marginTop: SPACING.sm,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
        marginTop: SPACING.lg,
    },
    emptySubtitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.mediumGray,
        marginTop: 8,
        textAlign: 'center',
    },
    browseButton: {
        marginTop: SPACING.xl,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.lg,
        ...SHADOWS.green,
    },
    browseButtonText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.white,
    },
});

export default FavoritesScreen;
