import React, { useState, useEffect } from 'react';
import { useWindowDimensions, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  SharedValue,
  useAnimatedReaction,
  runOnJS,
  withDelay
} from 'react-native-reanimated';

interface ScrollRevealProps {
  children: React.ReactNode;
  scrollY: SharedValue<number>;
  style?: any;
  delay?: number;
}

export default function ScrollReveal({ children, scrollY, style, delay = 0 }: ScrollRevealProps) {
  const { height: windowHeight } = useWindowDimensions();
  const elementY = useSharedValue(999999); 
  const [isVisible, setIsVisible] = useState(false);

  const handleLayout = (e: LayoutChangeEvent) => {
    elementY.value = e.nativeEvent.layout.y;
    // Fast path: if element is in initial viewport, show immediately
    if (e.nativeEvent.layout.y < windowHeight) {
      setIsVisible(true);
    }
  };

  useAnimatedReaction(
    () => {
      if (elementY.value === 999999) return false;
      return scrollY.value + windowHeight > elementY.value + 40;
    },
    (inView, prevInView) => {
      if (inView && !prevInView) {
        runOnJS(setIsVisible)(true);
      }
    }
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withDelay(delay, withTiming(isVisible ? 1 : 0, { duration: 600, easing: Easing.out(Easing.ease) })),
      transform: [
        { translateY: withDelay(delay, withTiming(isVisible ? 0 : 40, { duration: 600, easing: Easing.out(Easing.ease) })) }
      ]
    };
  }, [isVisible, delay]);

  return (
    <Animated.View onLayout={handleLayout} style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
