import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';

interface AppSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  thumbColor?: string;
}

export default function AppSwitch({
  value,
  onValueChange,
  disabled = false,
  activeColor = '#06B6D4',
  inactiveColor = '#334155',
  thumbColor = '#FFFFFF',
}: AppSwitchProps) {
  const animX = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animX, {
      toValue: value ? 1 : 0,
      bounciness: 4,
      speed: 18,
      useNativeDriver: true,
    }).start();
  }, [value]);

  const travelDistance = 20;
  // Strictly positive translation from 0 (left) to 20 (right)
  const translateX = animX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, travelDistance],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      {...(Platform.OS === 'web' ? ({ dir: 'ltr' } as any) : {})}
      style={[
        styles.track,
        {
          backgroundColor: value ? activeColor : inactiveColor,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: thumbColor,
            transform: [{ translateX }],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    left: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 3,
  },
});
