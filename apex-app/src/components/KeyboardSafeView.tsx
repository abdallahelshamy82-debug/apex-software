import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useKeyboardInset } from '../hooks/useKeyboardInset';

interface KeyboardSafeViewProps extends ViewProps {
  children: React.ReactNode;
  extraOffset?: number;
}

/**
 * Drop-in replacement for KeyboardAvoidingView that reliably works on Android Edge-to-Edge
 * without requiring react-native-keyboard-controller or native library dependencies.
 */
export default function KeyboardSafeView({
  children,
  style,
  extraOffset = 0,
  ...rest
}: KeyboardSafeViewProps) {
  const keyboardHeight = useKeyboardInset();

  return (
    <View
      style={[
        styles.container,
        style,
        keyboardHeight > 0 && { paddingBottom: keyboardHeight + extraOffset },
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
