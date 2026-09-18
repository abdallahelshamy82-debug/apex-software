import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BoundBiometricUser {
  user: any;
  token: string;
  boundAt: number;
}

export const biometrics = {
  // Check if device hardware supports biometrics and has enrolled prints/face
  async isAvailable(): Promise<{ available: boolean; enrolled: boolean; biometryType?: string }> {
    if (Platform.OS === 'web') {
      return { available: false, enrolled: false, biometryType: 'None' };
    }
    try {
      const LocalAuth = require('expo-local-authentication');
      const hasHardware = await LocalAuth.hasHardwareAsync();
      const isEnrolled = await LocalAuth.isEnrolledAsync();
      const supportedTypes = await LocalAuth.supportedAuthenticationTypesAsync();
      
      // Strict detection: Only call it FaceID on Apple devices
      let biometryType = 'Biometrics';
      if (Platform.OS === 'ios' && supportedTypes && supportedTypes.includes(LocalAuth.AuthenticationType.FACIAL_RECOGNITION)) {
        biometryType = 'FaceID';
      } else if (supportedTypes && supportedTypes.includes(LocalAuth.AuthenticationType.FINGERPRINT)) {
        biometryType = 'Fingerprint';
      }
      return { available: hasHardware, enrolled: isEnrolled, biometryType };
    } catch (e) {
      return { available: false, enrolled: false, biometryType: 'None' };
    }
  },

  // Get user-friendly display name in Arabic or English
  getBiometryLabel(isRTL: boolean, biometryType?: string): string {
    if (biometryType === 'FaceID' && Platform.OS === 'ios') {
      return isRTL ? 'التعرف على الوجه (Face ID)' : 'Face ID';
    }
    return isRTL ? 'المستشعرات الحيوية (بصمة الإصبع)' : 'Biometric Sensors (Fingerprint)';
  },

  // Trigger biometric prompt
  async authenticate(promptMessage = 'تسجيل الدخول إلى Apex Software'): Promise<{ success: boolean; error?: string }> {
    if (Platform.OS === 'web') {
      return { success: false, error: 'Biometrics not supported on Web' };
    }
    try {
      const LocalAuth = require('expo-local-authentication');
      const result = await LocalAuth.authenticateAsync({
        promptMessage,
        cancelLabel: 'إلغاء / Cancel',
        disableDeviceFallback: false,
      });
      return { success: result.success, error: result.error };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Biometric authentication failed' };
    }
  },

  // Account Binding & Storage
  async isBiometricLoginEnabled(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem('apex_biometrics_enabled');
      return val === 'true';
    } catch (e) {
      return false;
    }
  },

  async setBiometricLoginEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem('apex_biometrics_enabled', enabled ? 'true' : 'false');
    } catch (e) {}
  },

  // Save the specific user and token securely bound to biometrics
  async setBiometricUser(user: any, token: string): Promise<void> {
    try {
      const payload: BoundBiometricUser = {
        user,
        token,
        boundAt: Date.now()
      };
      await AsyncStorage.setItem('apex_biometric_user', JSON.stringify(payload));
      await AsyncStorage.setItem('apex_biometrics_enabled', 'true');
    } catch (e) {}
  },

  // Get the bound user
  async getBiometricUser(): Promise<BoundBiometricUser | null> {
    try {
      const val = await AsyncStorage.getItem('apex_biometric_user');
      if (!val) return null;
      return JSON.parse(val) as BoundBiometricUser;
    } catch (e) {
      return null;
    }
  },

  // Check if biometrics is both enabled AND bound to an account
  async isBiometricsConfigured(): Promise<boolean> {
    const isEnabled = await this.isBiometricLoginEnabled();
    if (!isEnabled) return false;
    const bound = await this.getBiometricUser();
    return !!(bound && bound.user && bound.token);
  },

  // Check if biometrics is configured specifically for a given email
  async isBiometricsConfiguredForUser(email?: string): Promise<boolean> {
    if (!email) return false;
    const isEnabled = await this.isBiometricLoginEnabled();
    if (!isEnabled) return false;
    const bound = await this.getBiometricUser();
    if (!bound || !bound.user?.email || !bound.token) return false;
    return bound.user.email.trim().toLowerCase() === email.trim().toLowerCase();
  },

  // Get email of the account currently bound to biometrics
  async getBoundUserEmail(): Promise<string | null> {
    const isConfigured = await this.isBiometricsConfigured();
    if (!isConfigured) return null;
    const bound = await this.getBiometricUser();
    return bound?.user?.email || null;
  },

  // Enforce 1 account per device: Check if this user is allowed to claim/toggle biometrics
  async canUserClaimBiometrics(currentUserEmail?: string): Promise<{ allowed: boolean; currentOwnerEmail?: string }> {
    if (!currentUserEmail) return { allowed: false };
    const bound = await this.getBiometricUser();
    const isEnabled = await this.isBiometricLoginEnabled();

    // If no account is bound or biometrics is disabled, the device is free to claim
    if (!bound || !bound.user || !bound.token || !isEnabled) {
      return { allowed: true };
    }

    // If already bound to this exact user, allowed
    if (bound.user.email && bound.user.email.trim().toLowerCase() === currentUserEmail.trim().toLowerCase()) {
      return { allowed: true };
    }

    // Biometrics already claimed by another account on this device!
    return {
      allowed: false,
      currentOwnerEmail: bound.user.email || 'حساب آخر',
    };
  },

  // Clear binding on logout or when disabled in settings
  async clearBiometricUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem('apex_biometric_user');
      await AsyncStorage.setItem('apex_biometrics_enabled', 'false');
    } catch (e) {}
  }
};
