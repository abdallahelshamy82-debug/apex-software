import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURE_AUTH_TOKEN_KEY = 'apex_sec_user_token_v1';
const LEGACY_TOKEN_KEY = 'userToken';

/**
 * 🛡️ Web Token Storage
 * Uses AsyncStorage with seamless legacy migration.
 * Free of native hardware modules to guarantee 100% SSR and Web browser stability.
 */

export const saveSecureToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(SECURE_AUTH_TOKEN_KEY, token);
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to store token on web:', error);
  }
};

export const getSecureToken = async (): Promise<string | null> => {
  try {
    let token = await AsyncStorage.getItem(SECURE_AUTH_TOKEN_KEY);
    if (!token) {
      const legacyToken = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
      if (legacyToken) {
        await AsyncStorage.setItem(SECURE_AUTH_TOKEN_KEY, legacyToken);
        await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
        token = legacyToken;
      }
    }
    return token;
  } catch (error) {
    return (await AsyncStorage.getItem(SECURE_AUTH_TOKEN_KEY)) || (await AsyncStorage.getItem(LEGACY_TOKEN_KEY));
  }
};

export const removeSecureToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SECURE_AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to delete token on web:', error);
  } finally {
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
  }
};
