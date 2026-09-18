import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  INVOICES: 'apex_cache_invoices',
  QUOTES: 'apex_cache_quotes',
  CLIENT_DATA: 'apex_cache_client_data',
  SETTINGS: 'apex_cache_agency_settings',
  NOTIFICATIONS: 'apex_cache_notifications',
  USER: 'apex_cache_user',
};

/**
 * Apex Offline-First Storage & Cache Layer
 * Caches essential data locally so the app opens instantly
 * and remains fully functional even without internet connection.
 */
export const offlineCache = {
  async set(key: string, data: any): Promise<void> {
    try {
      if (!data) return;
      await AsyncStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (e) {}
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.data as T;
    } catch (e) {
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {}
  },

  keys: CACHE_KEYS,
};
