import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SkeletonBox, SkeletonText } from '../Skeleton';
import { SPACING, BORDER_RADIUS, COLORS, SHADOWS } from '../../theme';

/** Single grid item skeleton */
const GridItemSkeleton: React.FC = () => (
  <View style={styles.card}>
    <SkeletonBox width={'100%'} height={100} borderRadius={0} />
    <View style={styles.cardInfo}>
      <SkeletonText width={'80%'} height={14} style={{ marginBottom: 6 }} />
      <SkeletonText width={'50%'} height={14} style={{ marginBottom: 8 }} />
      <View style={styles.priceRow}>
        <SkeletonText width={40} height={16} />
        <SkeletonBox width={28} height={28} borderRadius={14} />
      </View>
    </View>
  </View>
);

/** Skeleton placeholder for CategoriesScreen */
const CategoriesSkeleton: React.FC = () => (
  <View style={styles.container}>
    <View style={styles.grid}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <GridItemSkeleton key={i} />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  cardInfo: {
    padding: SPACING.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
});

export default CategoriesSkeleton;
