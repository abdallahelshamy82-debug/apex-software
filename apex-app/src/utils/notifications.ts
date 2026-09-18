import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { api } from '../services/api';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let isNotificationsEnabled = true;

// Initialize from storage on app load
AsyncStorage.getItem('pushEnabled')
  .then((val) => {
    if (val !== null) {
      isNotificationsEnabled = val === 'true';
    }
  })
  .catch(() => {});

/**
 * Apex Native & Local Push Notification Service
 * (Gracefully handles Expo Go SDK 53+ where remote notifications are disabled in Expo Go client)
 */
export const notifications = {
  setNotificationsActive: (enabled: boolean) => {
    isNotificationsEnabled = enabled;
  },

  isNotificationsActive: (): boolean => {
    return isNotificationsEnabled;
  },

  // Request permissions and register for push notifications
  async registerForPushNotifications(): Promise<string | null> {
    if (Platform.OS === 'web' || isExpoGo) {
      return null;
    }

    try {
      const Notifications = require('expo-notifications');
      const Device = require('expo-device');

      if (!Notifications || !Notifications.setNotificationHandler) return null;

      // Configure default handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: isNotificationsEnabled,
          shouldPlaySound: isNotificationsEnabled,
          shouldSetBadge: isNotificationsEnabled,
        }),
      });

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'Apex Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#06B6D4',
        }).catch(() => {});
      }

      if (!Device?.isDevice) {
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData?.data;
      if (!token) return null;

      // Save locally
      await AsyncStorage.setItem('apex_push_token', token);

      // Sync to server if user is logged in
      api.registerPushToken(token).catch(() => {});

      return token;
    } catch (err) {
      return null;
    }
  },

  // Trigger an instant local notification with sound & vibration
  async sendLocalNotification(title: string, body: string, data = {}) {
    if (!isNotificationsEnabled) return;
    try {
      if (Platform.OS !== 'web' && !isExpoGo) {
        const Notifications = require('expo-notifications');
        if (Notifications?.scheduleNotificationAsync) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data,
              sound: true,
            },
            trigger: null, // immediate
          });
        }
      } else if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/assets/images/icon.png' });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(title, { body, icon: '/assets/images/icon.png' });
            }
          });
        }
      }
    } catch (e) {
      // Completely silent catch
    }
  }
};
