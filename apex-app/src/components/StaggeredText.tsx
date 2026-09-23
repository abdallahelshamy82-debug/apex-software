import React, { useEffect } from 'react';
import { View, StyleSheet, I18nManager } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withDelay, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';

interface StaggeredTextProps {
  text: string;
  style?: any;
  baseDelay?: number;
  wordDelay?: number;
}

const AnimatedWord = ({ word, index, baseDelay, wordDelay, textStyle }: any) => {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const totalDelay = baseDelay + index * wordDelay;
    translateY.value = withDelay(totalDelay, withSpring(0, { damping: 14, stiffness: 120 }));
    opacity.value = withDelay(totalDelay, withTiming(1, { duration: 400 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  // Adding a space after each word except if we handle spacing differently
  // Actually it's better to just include space in the string render.
  return (
    <View style={styles.wordWrap}>
      <Animated.Text style={[textStyle, animatedStyle]}>
        {word}
      </Animated.Text>
    </View>
  );
};

export default function StaggeredText({ text, style, baseDelay = 0, wordDelay = 40 }: StaggeredTextProps) {
  const words = text.split(' ');
  const isRTL = I18nManager.isRTL || (style && style.textAlign === 'right');

  return (
    <View style={[styles.container, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      {words.map((word, index) => (
        <AnimatedWord 
          key={`${word}-${index}`} 
          word={word + ' '} 
          index={index} 
          baseDelay={baseDelay} 
          wordDelay={wordDelay} 
          textStyle={style} 
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexWrap: 'wrap',
    justifyContent: 'center', // Centers the text block, modify if needed
  },
  wordWrap: {
    overflow: 'hidden',
  }
});
