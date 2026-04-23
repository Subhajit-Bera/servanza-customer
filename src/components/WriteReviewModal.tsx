import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '../theme';
import { reviewsApi } from '../api/client';

interface WriteReviewModalProps {
    visible: boolean;
    onClose: () => void;
    bookingId: string;
    serviceName: string;
    existingReview?: { id: string; rating: number; comment?: string } | null;
    onSuccess?: () => void;
}

const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
    visible,
    onClose,
    bookingId,
    serviceName,
    existingReview,
    onSuccess,
}) => {
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [comment, setComment] = useState(existingReview?.comment || '');
    const [loading, setLoading] = useState(false);

    const isEditing = !!existingReview;

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Rating Required', 'Please select a star rating before submitting.');
            return;
        }

        setLoading(true);
        try {
            if (isEditing && existingReview) {
                await reviewsApi.updateReview(existingReview.id, { rating, comment: comment.trim() || undefined });
            } else {
                await reviewsApi.createReview({ bookingId, rating, comment: comment.trim() || undefined });
            }
            Alert.alert(
                'Thank You!',
                isEditing ? 'Your review has been updated.' : 'Your review has been submitted.',
                [{ text: 'OK', onPress: () => { onClose(); onSuccess?.(); } }]
            );
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Failed to submit review. Please try again.';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    const StarButton = ({ value }: { value: number }) => (
        <TouchableOpacity onPress={() => setRating(value)} activeOpacity={0.7}>
            <Ionicons
                name={value <= rating ? 'star' : 'star-outline'}
                size={36}
                color={value <= rating ? COLORS.star : COLORS.border}
            />
        </TouchableOpacity>
    );

    const getLabel = () => {
        if (rating === 0) return 'Tap to rate';
        if (rating === 1) return 'Terrible';
        if (rating === 2) return 'Poor';
        if (rating === 3) return 'Average';
        if (rating === 4) return 'Good';
        return 'Excellent!';
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

                <View style={styles.sheet}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{isEditing ? 'Edit Review' : 'Write a Review'}</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {/* Service name */}
                        <Text style={styles.serviceName} numberOfLines={2}>{serviceName}</Text>

                        {/* Stars */}
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((v) => (
                                <StarButton key={v} value={v} />
                            ))}
                        </View>
                        <Text style={styles.ratingLabel}>{getLabel()}</Text>

                        {/* Comment */}
                        <View style={styles.commentBox}>
                            <TextInput
                                style={styles.commentInput}
                                value={comment}
                                onChangeText={setComment}
                                placeholder="Share your experience (optional)..."
                                placeholderTextColor={COLORS.textLight}
                                multiline
                                numberOfLines={4}
                                maxLength={500}
                                textAlignVertical="top"
                            />
                            <Text style={styles.charCount}>{comment.length}/500</Text>
                        </View>

                        {/* Submit */}
                        <TouchableOpacity
                            style={[styles.submitBtn, (loading || rating === 0) && styles.submitBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={loading || rating === 0}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text style={styles.submitBtnText}>
                                    {isEditing ? 'Update Review' : 'Submit Review'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: BORDER_RADIUS.xxl,
        borderTopRightRadius: BORDER_RADIUS.xxl,
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.xxl + 16,
        paddingTop: SPACING.md,
        maxHeight: '85%',
        ...SHADOWS.heavy,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.divider,
        alignSelf: 'center',
        marginBottom: SPACING.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.xxl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    serviceName: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xl,
        lineHeight: 22,
    },
    starsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.md,
        marginBottom: SPACING.sm,
    },
    ratingLabel: {
        textAlign: 'center',
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
        marginBottom: SPACING.xl,
        minHeight: 20,
    },
    commentBox: {
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        backgroundColor: COLORS.background,
        marginBottom: SPACING.xl,
    },
    commentInput: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textPrimary,
        minHeight: 100,
    },
    charCount: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
        textAlign: 'right',
        marginTop: SPACING.xs,
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.pill,
        paddingVertical: SPACING.md + 2,
        alignItems: 'center',
        ...SHADOWS.green,
    },
    submitBtnDisabled: {
        backgroundColor: COLORS.mediumGray,
    },
    submitBtnText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.white,
    },
});

export default WriteReviewModal;
