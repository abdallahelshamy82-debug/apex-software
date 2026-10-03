import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'apex_cache_';

const CACHE_KEYS = {
  INVOICES: 'apex_cache_invoices',
  QUOTES: 'apex_cache_quotes',
  CLIENT_DATA: 'apex_cache_client_data',
  SETTINGS: 'apex_cache_agency_settings',
  NOTIFICATIONS: 'apex_cache_notifications',
  USER: 'apex_cache_user',
};

/**
 * The cache is scoped to the signed-in user id. Every key is suffixed with the active scope, and
 * when no scope is active reads return null and writes are ignored. This guarantees data from one
 * account can never be displayed (or written) under another account.
 */
let activeScope: string | null = null;

const scoped = (key: string): string | null => (activeScope ? `${key}__u${activeScope}` : null);

/**
 * Apex Offline-First Storage & Cache Layer
 * Caches essential data locally so the app opens instantly
 * and remains fully functional even without internet connection.
 */
export const offlineCache = {
  /** Set (or clear, with null) the active user id. Safe and cheap to call on every render. */
  setScope(userId: number | string | null | undefined) {
    activeScope = userId === null || userId === undefined || userId === '' ? null : String(userId);
  },

  getScope(): string | null {
    return activeScope;
  },

  async set(key: string, data: any): Promise<void> {
    try {
      const k = scoped(key);
      if (!k || !data) return;
      await AsyncStorage.setItem(k, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (e) {}
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const k = scoped(key);
      if (!k) return null;
      const raw = await AsyncStorage.getItem(k);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.data as T;
    } catch (e) {
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      const k = scoped(key);
      if (k) await AsyncStorage.removeItem(k);
    } catch (e) {}
  },

  /** Removes every cached entry for every user (used on logout / account switch). */
  async clearAll(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const mine = allKeys.filter((k) => k.startsWith(CACHE_PREFIX));
      if (mine.length) await AsyncStorage.multiRemove(mine);
    } catch (e) {}
  },

  keys: CACHE_KEYS,
};
