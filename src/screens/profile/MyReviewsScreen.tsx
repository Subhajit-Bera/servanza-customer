import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '../../theme';
import apiClient from '../../api/client';
import { ServiceImage } from '../../components/ServiceImage';
import { ProfileStackParamList } from '../../navigation/MainNavigator';

type MyReviewsNavigationProp = StackNavigationProp<ProfileStackParamList, 'MyReviews'>;

interface UserReview {
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    service?: {
        title: string;
        imageUrl?: string;
    };
}

const StarRow = ({ rating }: { rating: number }) => (
    <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((s) => (
            <Ionicons
                key={s}
                name={s <= rating ? 'star' : 'star-outline'}
                size={14}
                color={s <= rating ? COLORS.star : COLORS.border}
            />
        ))}
    </View>
);

const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
};

const MyReviewsScreen: React.FC = () => {
    const navigation = useNavigation<MyReviewsNavigationProp>();
    const [reviews, setReviews] = useState<UserReview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const { data } = await apiClient.get('/users/reviews');
            setReviews(data.data || data || []);
        } catch (error) {
            console.log('Failed to fetch reviews:', error);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const renderReview = ({ item }: { item: UserReview }) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <View style={styles.serviceInfo}>
                    {item.service?.imageUrl ? (
                        <ServiceImage url={item.service.imageUrl} style={styles.serviceImage} />
                    ) : (
                        <View style={styles.serviceImagePlaceholder}>
                            <Ionicons name="construct-outline" size={20} color={COLORS.textLight} />
                        </View>
                    )}
                    <View style={styles.serviceText}>
                        <Text style={styles.serviceTitle} numberOfLines={1}>
                            {item.service?.title || 'Service'}
                        </Text>
                        <Text style={styles.reviewDate}>{getTimeAgo(item.createdAt)}</Text>
                    </View>
                </View>
                <StarRow rating={item.rating} />
            </View>
            {item.comment ? (
                <Text style={styles.reviewComment}>{item.comment}</Text>
            ) : (
                <Text style={styles.noComment}>No comment left.</Text>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Reviews</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : reviews.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubble-outline" size={64} color={COLORS.primary} />
                    <Text style={styles.emptyTitle}>No Reviews Yet</Text>
                    <Text style={styles.emptySubtitle}>
                        After completing a booking, you can rate and review the service here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={reviews}
                    keyExtractor={(item) => item.id}
                    renderItem={renderReview}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    backBtn: {
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xxl,
        gap: SPACING.md,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    emptySubtitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    listContent: {
        padding: SPACING.lg,
        gap: SPACING.md,
    },
    reviewCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        ...SHADOWS.light,
        gap: SPACING.sm,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    serviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        flex: 1,
    },
    serviceImage: {
        width: 44,
        height: 44,
        borderRadius: BORDER_RADIUS.lg,
    },
    serviceImagePlaceholder: {
        width: 44,
        height: 44,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    serviceText: {
        flex: 1,
    },
    serviceTitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
    },
    reviewDate: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
    },
    starRow: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewComment: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    noComment: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textLight,
        fontStyle: 'italic',
    },
});

export default MyReviewsScreen;
