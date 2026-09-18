import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let isHapticsEnabled = true;

// Initialize from storage on app load
AsyncStorage.getItem('hapticsEnabled')
  .then((val) => {
    if (val !== null) {
      isHapticsEnabled = val === 'true';
    }
  })
  .catch(() => {});

/**
 * Apex Haptic Feedback Engine
 * Provides physical haptic sensations on real devices (iOS & Android)
 * with graceful fallback on Web.
 * Respects user preferences set in Settings.
 */
export const haptics = {
  setHapticsActive: (enabled: boolean) => {
    isHapticsEnabled = enabled;
  },

  isHapticActive: (): boolean => {
    return isHapticsEnabled;
  },

  light: async () => {
    if (!isHapticsEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        const Haptics = require('expo-haptics');
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch (e) {}
  },

  medium: async () => {
    if (!isHapticsEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        const Haptics = require('expo-haptics');
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
      }
    } catch (e) {}
  },

  heavy: async () => {
    if (!isHapticsEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        const Haptics = require('expo-haptics');
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(35);
      }
    } catch (e) {}
  },

  success: async () => {
    if (!isHapticsEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        const Haptics = require('expo-haptics');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([15, 40, 25]);
      }
    } catch (e) {}
  },

  warning: async () => {
    if (!isHapticsEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        const Haptics = require('expo-haptics');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }
    } catch (e) {}
  },

  error: async () => {
    if (!isHapticsEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        const Haptics = require('expo-haptics');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
    } catch (e) {}
  },

  selection: async () => {
    if (!isHapticsEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        const Haptics = require('expo-haptics');
        await Haptics.selectionAsync();
      }
    } catch (e) {}
  }
};
