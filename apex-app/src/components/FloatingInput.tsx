import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolateColor } from 'react-native-reanimated';

export interface FloatingInputProps extends TextInputProps {
  label: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  theme: any;
  isRTL: boolean;
  labelBgColor?: string;
}

export function FloatingInput({
  label,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword,
  hasError,
  errorMessage,
  theme,
  isRTL,
  labelBgColor,
  value,
  onChangeText,
  onFocus,
  onBlur,
  ...rest
}: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const isActive = isFocused || (value !== undefined && value !== null && value.length > 0);
  const floating = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    floating.value = withTiming(isActive ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [isActive, floating]);

  const animatedLabelStyle = useAnimatedStyle(() => {
    return {
      top: floating.value * -10 + (1 - floating.value) * 15,
      fontSize: floating.value * 12 + (1 - floating.value) * 14,
      color: hasError 
        ? '#EF4444' 
        : interpolateColor(
            floating.value,
            [0, 1],
            [theme.textMuted, theme.primary]
          )
    };
  });

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const borderColor = hasError ? '#EF4444' : (isFocused ? theme.primary : theme.border);
  const actualRightIcon = isPassword ? (isPasswordVisible ? 'eye-off-outline' : 'eye-outline') : rightIcon;
  const secureText = isPassword && !isPasswordVisible;
  const bgColor = labelBgColor || theme.card;

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, { 
        borderColor, 
        backgroundColor: theme.btnBg,
        flexDirection: isRTL ? 'row-reverse' : 'row'
      }]}>
        
        {leftIcon && (
          <View style={[styles.iconWrap, { marginLeft: isRTL ? 10 : 0, marginRight: isRTL ? 0 : 10 }]}>
            <Ionicons name={leftIcon} size={20} color={isFocused ? theme.primary : theme.textMuted} />
          </View>
        )}

        <View style={styles.inputWrapper}>
          <Animated.Text style={[styles.label, animatedLabelStyle, { 
            [isRTL ? 'right' : 'left']: 4,
            backgroundColor: bgColor,
          }]} pointerEvents="none">
            {label}
          </Animated.Text>
          
          <TextInput
            style={[styles.input, { 
              color: theme.text,
              textAlign: isRTL ? 'right' : 'left'
            }]}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={secureText}
            placeholder=""
            {...rest}
          />
        </View>

        {actualRightIcon && (
          <TouchableOpacity 
            style={[styles.iconWrap, { marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }]} 
            onPress={isPassword ? () => setIsPasswordVisible(!isPasswordVisible) : onRightIconPress}
          >
            <Ionicons name={actualRightIcon} size={20} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      
      {hasError && errorMessage && (
        <Text style={[styles.errorText, { textAlign: isRTL ? 'right' : 'left' }]}>
          {errorMessage}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 14,
  },
  inputContainer: {
    width: '100%',
    height: 54,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    position: 'absolute',
    paddingHorizontal: 6,
    fontWeight: '500',
    zIndex: 1,
    borderRadius: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingTop: 2,
    height: '100%',
  },
  iconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    marginRight: 4,
  }
});
