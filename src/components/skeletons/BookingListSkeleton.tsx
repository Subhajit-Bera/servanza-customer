import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox, SkeletonCircle, SkeletonText } from '../Skeleton';
import { SPACING, BORDER_RADIUS, COLORS } from '../../theme';

/** Skeleton placeholder for the Booking/Order list */
const BookingListSkeleton: React.FC = () => (
    <View style={styles.container}>
        {[1, 2, 3].map((i) => (
            <View key={i} style={styles.card}>
                {/* Header (Order ID & Status Pill) */}
                <View style={styles.cardHeader}>
                    <SkeletonText width={120} height={16} />
                    <SkeletonBox width={80} height={26} borderRadius={13} />
                </View>

                {/* Body (Service Image & Info) */}
                <View style={styles.cardBody}>
                    <SkeletonBox width={64} height={64} borderRadius={BORDER_RADIUS.lg} style={{ marginRight: SPACING.md }} />
                    <View style={styles.serviceInfo}>
                        <SkeletonText width={'80%'} height={16} style={{ marginBottom: 8 }} />
                        <SkeletonText width={'60%'} height={14} />
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Footer (Price & Action Button) */}
                <View style={styles.cardFooter}>
                    <View>
                        <SkeletonText width={80} height={12} style={{ marginBottom: 6 }} />
                        <SkeletonText width={100} height={18} />
                    </View>
                    <SkeletonBox width={100} height={36} borderRadius={BORDER_RADIUS.lg} />
                </View>
            </View>
        ))}
    </View>
);

const styles = StyleSheet.create({
    container: {
        paddingTop: SPACING.md,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    serviceInfo: {
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.md,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});

export default BookingListSkeleton;
