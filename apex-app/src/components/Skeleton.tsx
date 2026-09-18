import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
  theme: any;
  variant?: 'rectangular' | 'circular' | 'text';
}

export function Skeleton({ width, height, borderRadius = 8, style, theme, variant = 'rectangular' }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const getVariantStyles = (): ViewStyle => {
    if (variant === 'circular') {
      return {
        width: width || 40,
        height: height || 40,
        borderRadius: (typeof width === 'number' ? width : 40) / 2,
      };
    }
    if (variant === 'text') {
      return {
        width: width || '100%',
        height: height || 16,
        borderRadius: borderRadius || 4,
        marginBottom: 8,
      };
    }
    return {
      width: width || '100%',
      height: height || 100,
      borderRadius,
    };
  };

  const backgroundColor = theme.bg === '#0B132B' || theme.bg === '#000000' 
    ? 'rgba(255, 255, 255, 0.08)' 
    : 'rgba(0, 0, 0, 0.06)';

  return (
    <Animated.View
      style={[
        getVariantStyles(),
        { backgroundColor },
        animatedStyle,
        style,
      ]}
    />
  );
}
