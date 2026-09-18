import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'apex_unique_device_id';

function generateUUID(): string {
  return 'dev_' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Retrieves or generates the permanent device ID for this physical device.
 * Persists in SecureStore (or AsyncStorage) so that each physical phone
 * carries a single persistent identity.
 */
export async function getDeviceId(): Promise<string> {
  if (Platform.OS === 'web') {
    try {
      let webId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!webId) {
        webId = 'web_' + generateUUID();
        await AsyncStorage.setItem(DEVICE_ID_KEY, webId);
      }
      return webId;
    } catch (e) {
      return 'web_anonymous';
    }
  }

  // On Native (Android / iOS)
  try {
    const SecureStore = require('expo-secure-store');
    if (SecureStore && typeof SecureStore.isAvailableAsync === 'function') {
      const isAvail = await SecureStore.isAvailableAsync();
      if (isAvail) {
        let nativeId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
        if (!nativeId) {
          nativeId = await AsyncStorage.getItem(DEVICE_ID_KEY);
          if (!nativeId) {
            nativeId = `${Platform.OS}_${generateUUID()}`;
          }
          await SecureStore.setItemAsync(DEVICE_ID_KEY, nativeId);
          await AsyncStorage.setItem(DEVICE_ID_KEY, nativeId);
        }
        return nativeId;
      }
    }
  } catch (e) {}

  try {
    let fallbackId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!fallbackId) {
      fallbackId = `${Platform.OS}_${generateUUID()}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, fallbackId);
    }
    return fallbackId;
  } catch (e) {
    return `${Platform.OS}_temporary_id`;
  }
}
