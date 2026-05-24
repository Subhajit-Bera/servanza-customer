import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SkeletonBox, SkeletonCircle, SkeletonText, SkeletonGroup } from '../Skeleton';
import { SPACING, BORDER_RADIUS, COLORS } from '../../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 3) / 2;

/** Skeleton placeholder for the HomeScreen initial load */
const HomeScreenSkeleton: React.FC = () => (
  <View style={styles.container}>
    {/* Search bar placeholder */}
    <SkeletonBox
      width={'100%'}
      height={44}
      borderRadius={BORDER_RADIUS.xl}
      style={{ marginHorizontal: SPACING.lg, marginBottom: SPACING.lg }}
    />

    {/* Promo banner placeholder */}
    <SkeletonBox
      width={width - SPACING.lg * 2}
      height={160}
      borderRadius={BORDER_RADIUS.xl}
      style={{ marginHorizontal: SPACING.lg, marginBottom: SPACING.xl }}
    />

    {/* Categories section */}
    <View style={styles.sectionHeader}>
      <SkeletonText width={100} height={18} />
      <SkeletonText width={50} height={14} />
    </View>
    <View style={styles.categoriesRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.categoryItem}>
          <SkeletonCircle size={64} />
          <SkeletonText width={50} height={10} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>

    {/* Services section */}
    <View style={[styles.sectionHeader, { marginTop: SPACING.xl }]}>
      <SkeletonText width={120} height={18} />
      <SkeletonText width={50} height={14} />
    </View>
    <View style={styles.servicesGrid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.serviceCard}>
          <SkeletonBox width={'100%'} height={120} borderRadius={0} />
          <View style={{ padding: SPACING.md }}>
            <SkeletonText width={'80%'} height={14} />
            <SkeletonText width={'50%'} height={12} style={{ marginTop: 8 }} />
            <View style={styles.priceRow}>
              <SkeletonText width={60} height={16} />
              <SkeletonCircle size={32} />
            </View>
          </View>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingTop: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  categoriesRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: SPACING.lg,
    width: 75,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg - SPACING.sm,
  },
  serviceCard: {
    width: CARD_WIDTH,
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
});

export default HomeScreenSkeleton;
