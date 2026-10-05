import React from 'react';
import { StyleSheet, ViewProps, Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

interface KeyboardSafeViewProps extends ViewProps {
  children: React.ReactNode;
  extraOffset?: number;
}

/**
 * Drop-in KeyboardAvoidingView powered by react-native-keyboard-controller.
 * Ensures frame-perfect keyboard avoidance across iOS and Android (including modern Edge-to-Edge).
 */
export default function KeyboardSafeView({
  children,
  style,
  extraOffset = 0,
  ...rest
}: KeyboardSafeViewProps) {
  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior="padding"
      keyboardVerticalOffset={extraOffset}
      {...rest}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
