import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, ViewProps } from 'react-native';

interface KeyboardSafeViewProps extends ViewProps {
  children: React.ReactNode;
  extraOffset?: number;
}

/**
 * Drop-in KeyboardAvoidingView that relies on Android's native
 * softwareKeyboardLayoutMode: "resize" (behavior=undefined) and iOS padding.
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
