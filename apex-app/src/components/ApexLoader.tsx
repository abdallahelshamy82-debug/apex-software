import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ApexLoaderProps {
  message?: string;
  subtext?: string;
  fullScreen?: boolean;
  theme?: any;
  isRTL?: boolean;
}

const DEFAULT_THEME = {
  bg: '#0F172A',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  primary: '#06B6D4',
  card: '#1E293B',
  border: 'rgba(255,255,255,0.08)',
};

export default function ApexLoader({ 
  message, 
  subtext, 
  fullScreen = false, 
  theme = DEFAULT_THEME, 
  isRTL = true 
}: ApexLoaderProps) {

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          })
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, [pulseAnim, opacityAnim]);

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, { backgroundColor: theme.bg }]}>
      <Animated.View style={[styles.logoWrapper, { transform: [{ scale: pulseAnim }], borderColor: `${theme.primary}40`, backgroundColor: `${theme.primary}15` }]}>
        <Ionicons name="flash" size={32} color={theme.primary} />
      </Animated.View>

      <View style={[styles.brandRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.brandTitle, { color: theme.text }]}>APEX</Text>
        <Text style={[styles.brandAccent, { color: theme.primary, marginLeft: isRTL ? 0 : 6, marginRight: isRTL ? 6 : 0 }]}>DEVS</Text>
      </View>

      <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 22, marginBottom: 12 }} />

      <Text style={[styles.messageText, { color: theme.text, textAlign: 'center' }]}>
        {message || (isRTL ? 'جاري تجهيز البوابة الرقمية...' : 'Preparing Digital Experience...')}
      </Text>

      {subtext ? (
        <Text style={[styles.subtext, { color: theme.textMuted, textAlign: 'center' }]}>
          {subtext}
        </Text>
      ) : (
        <Text style={[styles.subtext, { color: theme.textMuted, textAlign: 'center' }]}>
          {isRTL ? 'يرجى الانتظار بضع ثوانٍ' : 'Please wait a moment'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  lightningIcon: {
    fontSize: 34,
  },
  brandRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandAccent: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  messageText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  subtext: {
    fontSize: 12,
    marginTop: 6,
    opacity: 0.8,
  },
});
