import React from 'react';
import { StyleSheet, View, Text, Platform, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';

interface PremiumCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}

export default function PremiumCard({ children, onPress, style }: PremiumCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handleHoverIn = () => {
    if (Platform.OS === 'web') {
      scale.value = withSpring(1.02, { damping: 15, stiffness: 200 });
    }
  };

  const handleHoverOut = () => {
    if (Platform.OS === 'web') {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        //@ts-ignore - hover events for web
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        style={{ flex: 1 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
