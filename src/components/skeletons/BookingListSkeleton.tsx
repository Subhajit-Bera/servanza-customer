import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox, SkeletonText } from '../Skeleton';
import { SPACING, BORDER_RADIUS, COLORS } from '../../theme';

/** Single booking card skeleton */
const BookingCardSkeleton: React.FC = () => (
  <View style={styles.card}>
    <View style={styles.topRow}>
      <SkeletonBox width={80} height={22} borderRadius={BORDER_RADIUS.md} />
      <SkeletonText width={70} height={12} />
    </View>
    <SkeletonText width={'65%'} height={16} style={{ marginTop: 12 }} />
    <View style={styles.detailsRow}>
      <SkeletonText width={'40%'} height={12} />
      <SkeletonText width={60} height={16} />
    </View>
    <View style={styles.bottomRow}>
      <SkeletonText width={'50%'} height={12} />
    </View>
  </View>
);

/** Skeleton for the bookings list screen — 3 placeholder cards */
const BookingListSkeleton: React.FC = () => (
  <View style={styles.container}>
    {[1, 2, 3].map((i) => (
      <BookingCardSkeleton key={i} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  bottomRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default BookingListSkeleton;
