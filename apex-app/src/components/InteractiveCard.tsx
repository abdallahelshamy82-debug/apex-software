import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';

// By converting Pressable directly into an Animated component, 
// we completely avoid extra wrapper Views that could break Flexbox layouts.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface InteractiveCardProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onHoverIn?: (e: any) => void;
  onHoverOut?: (e: any) => void;
}

export default function InteractiveCard({ children, style, ...props }: InteractiveCardProps) {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0);
  const shadowRadius = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      shadowOpacity: shadowOpacity.value,
      shadowRadius: shadowRadius.value,
      elevation: shadowOpacity.value * 20, // Android shadow equivalent
      // Maintain zIndex so scaled items pop above others
      zIndex: scale.value > 1 ? 10 : 1,
    };
  });

  const handlePressIn = (e: any) => {
    // Mobile strict down-scale
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300, mass: 0.8 });
    if (props.onPressIn) props.onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    // Return to default
    scale.value = withSpring(1, { damping: 15, stiffness: 300, mass: 0.8 });
    if (props.onPressOut) props.onPressOut(e);
  };

  const handleHoverIn = (e: any) => {
    if (Platform.OS === 'web') {
      // Web strict hover up-scale
      scale.value = withSpring(1.02, { damping: 15, stiffness: 300, mass: 0.8 });
      shadowOpacity.value = withTiming(0.4, { duration: 200 });
      shadowRadius.value = withTiming(15, { duration: 200 });
    }
    if (props.onHoverIn) props.onHoverIn(e);
  };

  const handleHoverOut = (e: any) => {
    if (Platform.OS === 'web') {
      // Return to default
      scale.value = withSpring(1, { damping: 15, stiffness: 300, mass: 0.8 });
      shadowOpacity.value = withTiming(0, { duration: 200 });
      shadowRadius.value = withTiming(0, { duration: 200 });
    }
    if (props.onHoverOut) props.onHoverOut(e);
  };

  return (
    <AnimatedPressable
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      // @ts-ignore - React Native Web specific properties
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
