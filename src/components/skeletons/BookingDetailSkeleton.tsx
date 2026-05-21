import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox, SkeletonText, SkeletonCircle } from '../Skeleton';
import { SPACING, BORDER_RADIUS, COLORS } from '../../theme';

/** Skeleton placeholder for BookingDetailScreen */
const BookingDetailSkeleton: React.FC = () => (
  <View style={styles.container}>
    {/* Status badge */}
    <View style={styles.statusRow}>
      <SkeletonBox width={120} height={28} borderRadius={BORDER_RADIUS.md} />
      <SkeletonText width={80} height={12} />
    </View>

    {/* Service card */}
    <View style={styles.card}>
      <SkeletonText width={'70%'} height={18} />
      <SkeletonText width={'40%'} height={14} style={{ marginTop: 8 }} />
      <View style={styles.divider} />
      <View style={styles.infoRow}>
        <SkeletonText width={'45%'} height={13} />
        <SkeletonText width={'30%'} height={13} />
      </View>
      <View style={styles.infoRow}>
        <SkeletonText width={'55%'} height={13} />
        <SkeletonText width={'25%'} height={13} />
      </View>
    </View>

    {/* Timeline */}
    <View style={styles.card}>
      <SkeletonText width={100} height={16} style={{ marginBottom: 16 }} />
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.timelineRow}>
          <SkeletonCircle size={24} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <SkeletonText width={'60%'} height={14} />
            <SkeletonText width={'35%'} height={10} style={{ marginTop: 4 }} />
          </View>
        </View>
      ))}
    </View>

    {/* Buddy info card */}
    <View style={styles.card}>
      <SkeletonText width={120} height={16} style={{ marginBottom: 12 }} />
      <View style={styles.buddyRow}>
        <SkeletonCircle size={48} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <SkeletonText width={'50%'} height={16} />
          <SkeletonText width={'35%'} height={12} style={{ marginTop: 4 }} />
        </View>
        <SkeletonBox width={80} height={36} borderRadius={BORDER_RADIUS.lg} />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  buddyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default BookingDetailSkeleton;
