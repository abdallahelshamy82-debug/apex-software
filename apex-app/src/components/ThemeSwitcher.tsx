import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSettings } from '../context/SettingsContext';
import { haptics } from '../utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const accentOptions = [
  { key: 'neonGreen', color: '#B4F82C' },
  { key: 'cyberBlue', color: '#00F0FF' }
];

export default function ThemeSwitcher() {
  const { accentKey, setAccentKey, theme } = useSettings();

  return (
    <View style={[styles.container, { borderColor: theme.border }]}>
      {accentOptions.map((option) => {
        const isActive = accentKey === option.key;

        const animatedStyle = useAnimatedStyle(() => {
          return {
            transform: [
              { scale: withSpring(isActive ? 1.25 : 0.85, { damping: 14, stiffness: 200 }) }
            ],
            borderWidth: withSpring(isActive ? 2 : 0),
            borderColor: '#FFFFFF',
            opacity: withSpring(isActive ? 1 : 0.4),
            shadowOpacity: withSpring(isActive ? 0.8 : 0),
            shadowRadius: withSpring(isActive ? 12 : 0),
          };
        });

        return (
          <AnimatedPressable
            key={option.key}
            onPress={async () => {
              if (!isActive) {
                await haptics.selection();
                setAccentKey(option.key);
                await AsyncStorage.setItem('appAccent', option.key);
              }
            }}
            style={[
              styles.dot,
              { backgroundColor: option.color, shadowColor: option.color },
              animatedStyle
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    elevation: 4,
  }
});
