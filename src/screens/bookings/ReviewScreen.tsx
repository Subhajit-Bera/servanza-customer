import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { submitReview, fetchBookingById } from '../../store/slices/bookingsSlice';
import { reviewApi } from '../../api/client';
import type { BookingsStackParamList } from '../../navigation/MainNavigator';

type ReviewRouteProp = RouteProp<BookingsStackParamList, 'Review'>;

const ReviewScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<ReviewRouteProp>();
    const dispatch = useAppDispatch();

    const { bookingId, existingReview } = route.params;
    const { loading } = useAppSelector((state) => state.bookings);

    // Determine mode based on existing review
    const isUpdate = !!existingReview;
    const hasExistingRating = existingReview?.rating !== null && existingReview?.rating !== undefined;
    const hasExistingComment = !!existingReview?.comment;

    const [rating, setRating] = useState(hasExistingRating ? existingReview.rating : 0);
    const [comment, setComment] = useState(hasExistingComment ? existingReview.comment : '');
    const [submitting, setSubmitting] = useState(false);

    // Dynamic header and button labels
    let headerTitle = 'Rate & Review';
    let submitLabel = 'Submit Review';
    if (isUpdate) {
        if (hasExistingRating && !hasExistingComment) {
            headerTitle = 'Write a Review';
            submitLabel = 'Submit Review';
        } else if (!hasExistingRating && hasExistingComment) {
            headerTitle = 'Rate Service';
            submitLabel = 'Submit Rating';
        }
    }

    const handleSubmit = async () => {
        // Validate: at least one of rating or comment must be provided
        if (rating < 1 && (!comment.trim())) {
            Alert.alert('Required', 'Please provide a rating or a review comment.');
            return;
        }

        setSubmitting(true);
        try {
            if (isUpdate && existingReview?.id) {
                // Use PUT /reviews/:id for updating existing review
                const updateData: { rating?: number; comment?: string } = {};
                if (rating >= 1) updateData.rating = rating;
                if (comment.trim()) updateData.comment = comment.trim();
                await reviewApi.updateReview(existingReview.id, updateData);
            } else {
                // Use POST /bookings/:id/review for new review (upsert)
                await dispatch(submitReview({
                    bookingId,
                    rating: rating >= 1 ? rating : undefined,
                    comment: comment.trim() || undefined,
                })).unwrap();
            }

            // Re-fetch the booking to update the review state in Redux
            // This ensures BookingDetailScreen reflects the change immediately
            dispatch(fetchBookingById(bookingId));

            Alert.alert('Thank You!', 'Your review has been submitted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || error.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

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
                <Text style={styles.headerTitle}>{headerTitle}</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Rating Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How was your experience?</Text>
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => !hasExistingRating && setRating(star)}
                                disabled={hasExistingRating}
                                style={styles.starButton}
                            >
                                <Ionicons
                                    name={rating > 0 && star <= rating ? 'star' : 'star-outline'}
                                    size={48}
                                    color={rating > 0 && star <= rating ? COLORS.warning : COLORS.lightGray}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    {rating > 0 && (
                        <Text style={styles.ratingLabel}>
                            {rating === 5 ? 'Excellent!' :
                                rating === 4 ? 'Very Good' :
                                    rating === 3 ? 'Good' :
                                        rating === 2 ? 'Fair' : 'Poor'}
                        </Text>
                    )}
                </View>

                {/* Comment Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tell us more (optional)</Text>
                    <TextInput
                        style={[styles.commentInput, hasExistingComment && { backgroundColor: COLORS.lightGray, color: COLORS.darkGray }]}
                        placeholder="Share your experience with the service..."
                        placeholderTextColor={COLORS.mediumGray}
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                        editable={!hasExistingComment}
                    />
                </View>

                {/* Quick Tags */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick feedback</Text>
                    <View style={styles.tagsContainer}>
                        {['Professional', 'On Time', 'Clean Work', 'Friendly', 'Expert'].map((tag) => (
                            <TouchableOpacity
                                key={tag}
                                style={[
                                    styles.tag,
                                    comment.includes(tag) && styles.tagActive,
                                    hasExistingComment && { opacity: 0.5 }
                                ]}
                                disabled={hasExistingComment}
                                onPress={() => {
                                    if (hasExistingComment) return;
                                    if (comment.includes(tag)) {
                                        setComment(comment.replace(tag + ' ', ''));
                                    } else {
                                        setComment((prev: string) => (prev ? prev + ' ' : '') + tag + ' ');
                                    }
                                }}
                            >
                                <Text style={[
                                    styles.tagText,
                                    comment.includes(tag) && styles.tagTextActive,
                                ]}>
                                    {tag}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.submitButton, submitting && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={loading || submitting}
                    activeOpacity={0.8}
                >
                    {(loading || submitting) ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.submitButtonText}>{submitLabel}</Text>
                    )}
                </TouchableOpacity>
            </View>
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
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.xl,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
        marginBottom: SPACING.lg,
        textAlign: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: SPACING.md,
    },
    starButton: {
        padding: 4,
    },
    ratingLabel: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
        textAlign: 'center',
    },
    commentInput: {
        backgroundColor: COLORS.offWhite,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        padding: SPACING.lg,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.charcoal,
        minHeight: 120,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    tag: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.offWhite,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
    },
    tagActive: {
        backgroundColor: COLORS.lightGreen,
        borderColor: COLORS.primary,
    },
    tagText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.darkGray,
    },
    tagTextActive: {
        color: COLORS.darkGreen,
    },
    bottomBar: {
        padding: SPACING.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
        ...SHADOWS.medium,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        ...SHADOWS.green,
    },
    submitButtonText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.white,
    },
});

export default ReviewScreen;
