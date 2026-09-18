import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURE_AUTH_TOKEN_KEY = 'apex_sec_user_token_v1';
const LEGACY_TOKEN_KEY = 'userToken';

/**
 * 🛡️ Native Bank-Grade Secure Token Storage (iOS & Android)
 * Uses hardware-backed encrypted storage (Keychain / Keystore AES-256)
 * with graceful fallback to AsyncStorage.
 */

function getSecureStore() {
  try {
    return require('expo-secure-store');
  } catch (e) {
    return null;
  }
}

export const saveSecureToken = async (token: string): Promise<void> => {
  try {
    const SecureStore = getSecureStore();
    if (SecureStore && SecureStore.setItemAsync) {
      await SecureStore.setItemAsync(SECURE_AUTH_TOKEN_KEY, token, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED || undefined,
      });
    } else {
      await AsyncStorage.setItem(SECURE_AUTH_TOKEN_KEY, token);
    }
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch (error) {
    console.warn('🛡️ [Keystore Warning] Save fallback:', error);
    await AsyncStorage.setItem(SECURE_AUTH_TOKEN_KEY, token);
  }
};

export const getSecureToken = async (): Promise<string | null> => {
  try {
    let token: string | null = null;
    const SecureStore = getSecureStore();

    if (SecureStore && SecureStore.getItemAsync) {
      token = await SecureStore.getItemAsync(SECURE_AUTH_TOKEN_KEY);
    } else {
      token = await AsyncStorage.getItem(SECURE_AUTH_TOKEN_KEY);
    }

    // Seamless Legacy Migration
    if (!token) {
      const legacyToken = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
      if (legacyToken) {
        await saveSecureToken(legacyToken);
        token = legacyToken;
      }
    }

    return token;
  } catch (error) {
    console.warn('🛡️ [Keystore Warning] Read fallback:', error);
    return (await AsyncStorage.getItem(SECURE_AUTH_TOKEN_KEY)) || (await AsyncStorage.getItem(LEGACY_TOKEN_KEY));
  }
};

export const removeSecureToken = async (): Promise<void> => {
  try {
    const SecureStore = getSecureStore();
    if (SecureStore && SecureStore.deleteItemAsync) {
      await SecureStore.deleteItemAsync(SECURE_AUTH_TOKEN_KEY).catch(() => {});
    }
  } catch (error) {
    console.warn('🛡️ [Keystore Warning] Remove fallback:', error);
  } finally {
    await AsyncStorage.removeItem(SECURE_AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
  }
};
