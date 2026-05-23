import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { COLORS } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Shared shimmer clock ────────────────────────────────────────────────────
// A single Animated.Value drives every skeleton on screen.
// This avoids N independent Animated.loop calls (the old per-box pulse).

const shimmerClock = new Animated.Value(0);
let shimmerRunning = false;
let shimmerRefCount = 0;

function startShimmer() {
  shimmerRefCount++;
  if (shimmerRunning) return;
  shimmerRunning = true;
  Animated.loop(
    Animated.timing(shimmerClock, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    })
  ).start();
}

function stopShimmer() {
  shimmerRefCount--;
  if (shimmerRefCount <= 0) {
    shimmerClock.stopAnimation();
    shimmerClock.setValue(0);
    shimmerRunning = false;
    shimmerRefCount = 0;
  }
}

// ─── Colors ──────────────────────────────────────────────────────────────────
const BASE_COLOR = '#EEF0F2';
const HIGHLIGHT_COLOR = '#F8F9FB';

// ─── SkeletonBox ─────────────────────────────────────────────────────────────

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Shimmer-animated skeleton placeholder.
 * Uses a single shared animation clock — no matter how many boxes you render,
 * there is only ONE Animated.loop running globally.
 */
export const SkeletonBox: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius = 8,
  style,
}) => {
  useEffect(() => {
    startShimmer();
    return () => stopShimmer();
  }, []);

  const translateX = useMemo(
    () =>
      shimmerClock.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
      }),
    []
  );

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: BASE_COLOR,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          transform: [{ translateX }],
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: HIGHLIGHT_COLOR,
            width: SCREEN_WIDTH * 0.4,
            opacity: 0.6,
            borderRadius,
          }}
        />
      </Animated.View>
    </View>
  );
};

// ─── Convenience wrappers ────────────────────────────────────────────────────

/** Circular skeleton (avatars, category icons) */
export const SkeletonCircle: React.FC<{ size: number; style?: ViewStyle }> = ({
  size,
  style,
}) => (
  <SkeletonBox
    width={size}
    height={size}
    borderRadius={size / 2}
    style={style}
  />
);

/** Text-line skeleton (title, subtitle, paragraph lines) */
export const SkeletonText: React.FC<{
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}> = ({ width = '100%', height = 14, style }) => (
  <SkeletonBox width={width} height={height} borderRadius={4} style={style} />
);

/** Container that adds standard vertical spacing between skeleton children */
export const SkeletonGroup: React.FC<{
  gap?: number;
  style?: ViewStyle;
  children: React.ReactNode;
}> = ({ gap = 12, style, children }) => (
  <View style={[{ gap }, style]}>{children}</View>
);

export default { SkeletonBox, SkeletonCircle, SkeletonText, SkeletonGroup };
