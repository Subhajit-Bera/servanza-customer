import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SkeletonBox, SkeletonText, SkeletonCircle, SkeletonGroup } from '../Skeleton';
import { SPACING, BORDER_RADIUS, COLORS } from '../../theme';

const { width } = Dimensions.get('window');

/** Skeleton placeholder for ServiceDetailsScreen */
const ServiceDetailsSkeleton: React.FC = () => (
  <View style={styles.container}>
    {/* Hero image */}
    <SkeletonBox width={width} height={250} borderRadius={0} />

    <View style={styles.content}>
      {/* Title + price */}
      <SkeletonText width={'75%'} height={22} />
      <SkeletonText width={'40%'} height={16} style={{ marginTop: 8 }} />

      {/* Rating row */}
      <View style={styles.ratingRow}>
        <SkeletonBox width={80} height={20} borderRadius={10} />
        <SkeletonText width={60} height={14} />
      </View>

      {/* Price */}
      <SkeletonText width={100} height={24} style={{ marginTop: 16 }} />

      {/* Description section */}
      <SkeletonText width={'90%'} height={14} style={{ marginTop: 24 }} />
      <SkeletonText width={'100%'} height={14} style={{ marginTop: 8 }} />
      <SkeletonText width={'70%'} height={14} style={{ marginTop: 8 }} />

      {/* Includes section */}
      <SkeletonText width={120} height={18} style={{ marginTop: 28 }} />
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.includeRow}>
          <SkeletonCircle size={20} />
          <SkeletonText width={'70%'} height={14} />
        </View>
      ))}

      {/* Reviews section */}
      <SkeletonText width={100} height={18} style={{ marginTop: 28 }} />
      {[1, 2].map((i) => (
        <View key={i} style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <SkeletonCircle size={36} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <SkeletonText width={'50%'} height={14} />
              <SkeletonText width={'30%'} height={10} style={{ marginTop: 4 }} />
            </View>
          </View>
          <SkeletonText width={'90%'} height={12} style={{ marginTop: 10 }} />
          <SkeletonText width={'60%'} height={12} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: SPACING.lg,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  includeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  reviewCard: {
    padding: SPACING.md,
    marginTop: 12,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ServiceDetailsSkeleton;
