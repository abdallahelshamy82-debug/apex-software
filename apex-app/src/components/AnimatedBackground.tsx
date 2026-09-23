import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing, 
  withSequence 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSettings } from '../context/SettingsContext';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function AnimatedBackground() {
  const { width, height } = useWindowDimensions();
  const { theme } = useSettings();
  const accent = theme.primary || '#B4F82C';
  
  const rotation1 = useSharedValue(0);
  const rotation2 = useSharedValue(0);
  const translateY1 = useSharedValue(0);
  
  useEffect(() => {
    rotation1.value = withRepeat(
      withTiming(360, { duration: 15000, easing: Easing.linear }), 
      -1, 
      false
    );
    
    rotation2.value = withRepeat(
      withTiming(-360, { duration: 20000, easing: Easing.linear }), 
      -1, 
      false
    );
    
    translateY1.value = withRepeat(
      withSequence(
        withTiming(80, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-80, { duration: 5000, easing: Easing.inOut(Easing.ease) })
      ), 
      -1, 
      true
    );
  }, []);

  const style1 = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation1.value}deg` },
      { translateY: translateY1.value }
    ]
  }));

  const style2 = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation2.value}deg` },
    ]
  }));

  const blurStyle = Platform.OS === 'web' ? { filter: 'blur(120px)' } as any : {};

  return (
    <Animated.View style={styles.container}>
      <LinearGradient
        colors={[theme.bg, '#050505']}
        style={StyleSheet.absoluteFill}
      />
      
      <AnimatedGradient
        colors={[hexToRgba(accent, 0.25), hexToRgba(accent, 0.02)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          {
            position: 'absolute',
            top: -height * 0.1,
            left: -width * 0.2,
            width: width * 0.8,
            height: width * 0.8,
            borderRadius: width * 0.4,
          },
          blurStyle,
          style1
        ]}
      />

      <AnimatedGradient
        colors={[hexToRgba(accent, 0.2), hexToRgba(accent, 0.01)]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={[
          {
            position: 'absolute',
            bottom: -height * 0.1,
            right: -width * 0.2,
            width: width * 0.9,
            height: width * 0.9,
            borderRadius: width * 0.45,
          },
          blurStyle,
          style2
        ]}
      />
      
      <Animated.View style={[styles.overlay, { backgroundColor: hexToRgba(theme.bg, 0.7) }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  }
});
