import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SkeletonBox, SkeletonCircle, SkeletonText } from '../Skeleton';
import { SPACING, BORDER_RADIUS, COLORS } from '../../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 3) / 2;

/** Skeleton placeholder for the HomeScreen initial load */
const HomeScreenSkeleton: React.FC = () => (
  <View style={styles.container}>
    {/* Search bar placeholder */}
    <SkeletonBox
      width={'100%'}
      height={48}
      borderRadius={BORDER_RADIUS.xxl}
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
      <SkeletonText width={120} height={20} />
      <SkeletonText width={60} height={14} />
    </View>
    <View style={styles.categoriesRow}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.categoryItem}>
          <SkeletonCircle size={64} style={{ marginBottom: 10 }} />
          <SkeletonText width={56} height={12} />
        </View>
      ))}
    </View>

    {/* Services section */}
    <View style={[styles.sectionHeader, { marginTop: SPACING.xl, marginBottom: SPACING.lg }]}>
      <SkeletonText width={140} height={20} />
      <SkeletonText width={60} height={14} />
    </View>
    <View style={styles.servicesGrid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.serviceCard}>
          <SkeletonBox width={'100%'} height={130} borderRadius={0} />
          <View style={{ padding: SPACING.md }}>
            <SkeletonText width={'85%'} height={16} style={{ marginBottom: 8 }} />
            <SkeletonText width={'60%'} height={14} style={{ marginBottom: 12 }} />
            <View style={styles.priceRow}>
              <SkeletonText width={70} height={18} />
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
    justifyContent: 'space-between',
  },
  categoryItem: {
    alignItems: 'center',
    width: 70,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg - SPACING.sm,
  },
  serviceCard: {
    width: CARD_WIDTH,
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.lg,
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
  },
});

export default HomeScreenSkeleton;
