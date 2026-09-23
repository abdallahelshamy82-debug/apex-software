import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getSecureToken } from '../utils/secureTokenStorage';
import Constants from 'expo-constants';
import { offlineCache } from '../utils/cache';
import { getDeviceId } from '../utils/deviceBinding';

const getBaseUrl = () => {
  // 1. Priority: Environment variable (configured in .env or during EAS / Production build)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  // 2. Web browser: auto-detect current hostname (works on both PC and mobile browser)
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:3000`;
  }
  // 3. Physical Mobile Device / Expo Go: dynamically extract PC IP from Expo host
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:3000`;
    }
  }
  // 4. Android Emulator fallback (only if not on a physical device)
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return 'http://10.0.2.2:3000';
  }
  // 5. Physical device fallback to current local network IP
  return 'http://10.18.163.39:3000';
};

export const BASE_URL = getBaseUrl();
export const API_URL = `${BASE_URL}/api`;

const getAuthHeaders = async () => {
  const token = await getSecureToken();
  return {
    'Content-Type': 'application/json',
    'X-Client-Platform': Platform.OS,
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

const readUriAsBase64 = async (uri: string): Promise<string> => {
  // Strategy 1: React Native / Web standard fetch + FileReader
  // Bypasses Expo Go scoped file system permission checks and reads directly via Android ContentResolver
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('FileReader did not return a string'));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(blob);
    });
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    if (base64 && base64.length > 0) {
      return base64;
    }
  } catch (webErr) {
    console.warn('readUriAsBase64 (fetch/FileReader) error, falling back to FileSystem:', webErr);
  }

  // Strategy 2: expo-file-system
  let SafeFileSystem: any = null;
  try { SafeFileSystem = require('expo-file-system/legacy'); } catch (e) {
    try { SafeFileSystem = require('expo-file-system'); } catch (e2) {}
  }

  if (SafeFileSystem) {
    // 2a. Direct readAsStringAsync
    try {
      const b64 = await SafeFileSystem.readAsStringAsync(uri, {
        encoding: SafeFileSystem.EncodingType?.Base64 || 'base64',
      });
      if (b64) return b64;
    } catch (fsDirectErr) {
      console.warn('readAsStringAsync direct failed, attempting copy to documentDirectory:', fsDirectErr);
    }

    // 2b. Copy to documentDirectory first (to bypass Expo Go cacheDir scoping)
    if (SafeFileSystem.documentDirectory && SafeFileSystem.copyAsync) {
      const safeTempPath = `${SafeFileSystem.documentDirectory}upload_temp_${Date.now()}`;
      try {
        await SafeFileSystem.copyAsync({ from: uri, to: safeTempPath });
        const b64 = await SafeFileSystem.readAsStringAsync(safeTempPath, {
          encoding: SafeFileSystem.EncodingType?.Base64 || 'base64',
        });
        SafeFileSystem.deleteAsync(safeTempPath, { idempotent: true }).catch(() => {});
        if (b64) return b64;
      } catch (copyErr) {
        console.warn('copyAsync to documentDirectory failed:', copyErr);
      }
    }
  }

  throw new Error('تعذر قراءة بيانات الملف على هذا الجهاز.');
};

export const api = {
  async register(fullName: string, email: string, company: string, password: string) {
    try {
      const deviceId = await getDeviceId();
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Client-Platform': Platform.OS
        },
        body: JSON.stringify({ fullName, email, company, password, deviceId, platform: Platform.OS })
      });
      return await response.json();
    } catch (e) { return { success: false, message: 'Network error.' }; }
  },

  async login(email: string, password: string) {
    try {
      const deviceId = await getDeviceId();
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Client-Platform': Platform.OS
        },
        body: JSON.stringify({ email, password, deviceId, platform: Platform.OS })
      });
      return await response.json();
    } catch (e) { return { success: false, message: 'Network error.' }; }
  },

  async googleLogin(profileData: { email: string; fullName: string; googleId?: string; picture?: string }) {
    try {
      const deviceId = await getDeviceId();
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Client-Platform': Platform.OS
        },
        body: JSON.stringify({ ...profileData, deviceId, platform: Platform.OS })
      });
      return await response.json();
    } catch (e) { return { success: false, message: 'Google Auth network error.' }; }
  },

  async submitQuote(details: any) {
    try {
      const response = await fetch(`${API_URL}/quotes`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ details })
      });
      return await response.json();
    } catch (e) { return { success: false }; }
  },

  async getQuotes() {
    try {
      const response = await fetch(`${API_URL}/quotes`, { headers: await getAuthHeaders() });
      return await response.json();
    } catch (e) { return { success: false, quotes: [] }; }
  },

  async getMyQuotes() {
    try {
      const response = await fetch(`${API_URL}/my-quotes`, { headers: await getAuthHeaders() });
      const data = await response.json();
      if (data.success && data.quotes) {
        offlineCache.set(offlineCache.keys.QUOTES, data.quotes);
      }
      return data;
    } catch (e) {
      const cached = await offlineCache.get<any[]>(offlineCache.keys.QUOTES);
      if (cached) return { success: true, quotes: cached, isOffline: true };
      return { success: false, quotes: [] };
    }
  },

  async getMe() {
    try {
      const response = await fetch(`${API_URL}/me`, { headers: await getAuthHeaders() });
      const data = await response.json();
      if (data.success && data.user) {
        offlineCache.set(offlineCache.keys.USER, data.user);
      }
      return data;
    } catch (e) {
      const cached = await offlineCache.get<any>(offlineCache.keys.USER);
      if (cached) return { success: true, user: cached, isOffline: true };
      return { success: false };
    }
  },

  async forgotPassword(email: string) {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return await response.json();
    } catch (e) { return { success: false, message: 'Network error' }; }
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      });
      return await response.json();
    } catch (e) { return { success: false, message: 'Network error' }; }
  },

  async updateProfile(data: { fullName?: string; company?: string; phone?: string; avatarUrl?: string }) {
    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (e) { return { success: false, message: 'Network error' }; }
  },

  async changePassword(currentPassword: string, newPassword: string) {
    try {
      const response = await fetch(`${API_URL}/user/change-password`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
      });
      return await response.json();
    } catch (e) { return { success: false, message: 'Network error' }; }
  },

  async getInvoices() {
    try {
      const response = await fetch(`${API_URL}/invoices`, { headers: await getAuthHeaders() });
      const data = await response.json();
      if (data.success && data.invoices) {
        offlineCache.set(offlineCache.keys.INVOICES, data.invoices);
      }
      return data;
    } catch (e) {
      const cached = await offlineCache.get<any[]>(offlineCache.keys.INVOICES);
      if (cached) return { success: true, invoices: cached, isOffline: true };
      return { success: false, invoices: [] };
    }
  },

  async createInvoice(data: { userId: number; quoteId?: number; title: string; amount: number; notes?: string; date?: string }) {
    try {
      const response = await fetch(`${API_URL}/invoices`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (e) { return { success: false }; }
  },

  async submitInvoicePayment(invoiceId: number, receiptUrl: string, notes?: string) {
    try {
      const response = await fetch(`${API_URL}/invoices/${invoiceId}/payment`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ receiptUrl, notes })
      });
      return await response.json();
    } catch (e) { return { success: false }; }
  },

  async updateInvoiceStatus(invoiceId: number, status: string) {
    try {
      const response = await fetch(`${API_URL}/invoices/${invoiceId}/status`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      return await response.json();
    } catch (e) { return { success: false }; }
  },

  async updateQuoteStatus(quoteId: number, status: string) {
    try {
      const response = await fetch(`${API_URL}/quotes/${quoteId}/status`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      return await response.json();
    } catch (e) { return { success: false }; }
  },

  async getUsers() {
    try {
      const response = await fetch(`${API_URL}/users`, { headers: await getAuthHeaders() });
      return await response.json();
    } catch (e) { return { success: false, users: [] }; }
  },

  async updateProject(userId: number, projectName: string, projectPhase: string, projectProgress: number) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/project`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ projectName, projectPhase, projectProgress })
      });
      return await response.json();
    } catch (e) { return { success: false }; }
  },

  async sendUpdateEmail(userId: number) {
    try {
      const response = await fetch(`${API_URL}/admin/send-update-email`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ userId })
      });
      return await response.json();
    } catch (e) { return { success: false, error: 'Network error' }; }
  },

  async getMessages(userId: number) {
    try {
      const response = await fetch(`${API_URL}/messages/${userId}`, { headers: await getAuthHeaders() });
      return await response.json();
    } catch (e) { return { success: false, messages: [] }; }
  },

  async sendMessage(msgData: any) {
    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(msgData)
      });
      return await response.json();
    } catch (e) { return { success: false, error: 'Network error' }; }
  },

  async getAdminChats() {
    try {
      const response = await fetch(`${API_URL}/admin/chats`, { headers: await getAuthHeaders() });
      return await response.json();
    } catch (e) { return { success: false, chats: [] }; }
  },

  async uploadFile(uri: string, filename: string, type: string, explicitBase64?: string) {
    try {
      const rawExt = filename && filename.includes('.') ? `.${filename.split('.').pop()}` : '';
      const safeExt = rawExt ? rawExt.toLowerCase() : (type.includes('pdf') ? '.pdf' : type.includes('audio') ? '.m4a' : '.jpg');
      const cleanName = `attachment_${Date.now()}${safeExt}`;
      const cleanType = type || 'application/octet-stream';
      const token = await getSecureToken();

      // 1. Web Platform: Native FormData with Blob
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          const blobRes = await fetch(uri);
          const blob = await blobRes.blob();
          const formData = new FormData();
          formData.append('file', blob, cleanName);

          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers,
            body: formData,
          });
          const data = await response.json();
          return data;
        } catch (webErr: any) {
          console.error('Web upload failed:', webErr);
          // Fall through to Base64
        }
      }

      // 2. Base64 Upload (Most reliable on Native Mobile & Expo Go)
      let base64Data = explicitBase64;
      if (!base64Data) {
        try {
          base64Data = await readUriAsBase64(uri);
        } catch (readErr: any) {
          console.warn('Failed to read URI as base64:', readErr);
        }
      }

      if (base64Data) {
        try {
          const b64Res = await fetch(`${API_URL}/api/upload-base64`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              filename: cleanName,
              mimeType: cleanType,
              base64: base64Data
            })
          });
          const parsed = await b64Res.json();
          if (parsed && parsed.success) return parsed;
          if (parsed && parsed.message) return { success: false, message: parsed.message };
        } catch (b64PostErr: any) {
          console.warn('Base64 POST to server failed:', b64PostErr);
        }
      }

      // 3. Fallback to SafeFileSystem uploadAsync (if available and not failed)
      let SafeFileSystem: any = null;
      try { SafeFileSystem = require('expo-file-system/legacy'); } catch (e) {
        try { SafeFileSystem = require('expo-file-system'); } catch (e2) {}
      }

      if (SafeFileSystem && SafeFileSystem.uploadAsync) {
        try {
          const uploadRes = await SafeFileSystem.uploadAsync(`${API_URL}/upload`, uri, {
            httpMethod: 'POST',
            uploadType: SafeFileSystem.FileSystemUploadType?.MULTIPART ?? 1,
            fieldName: 'file',
            mimeType: cleanType,
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            parameters: { filename: cleanName }
          });
          if (uploadRes.status >= 200 && uploadRes.status < 300) {
            const parsed = JSON.parse(uploadRes.body);
            if (parsed.success) return parsed;
          }
        } catch (fsErr) {
          console.warn('Native uploadAsync also failed:', fsErr);
        }
      }

      return { success: false, message: 'تعذر رفع الملف إلى السيرفر، يرجى التحقق من اتصال الإنترنت.' };
    } catch (e: any) {
      console.error('uploadFile general error:', e);
      return { success: false, error: e, message: e?.message || 'Network error during upload' };
    }
  },

  async getEmailConfig() {
    try {
      const response = await fetch(`${API_URL}/admin/email-config`, { headers: await getAuthHeaders() });
      return await response.json();
    } catch (e) { return { success: false, configured: false }; }
  },

  async updateEmailConfig(user: string, pass: string) {
    try {
      const response = await fetch(`${API_URL}/admin/email-config`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ user, pass })
      });
      return await response.json();
    } catch (e) { return { success: false, message: 'Network error' }; }
  },

  async getSentEmails() {
    try {
      const response = await fetch(`${API_URL}/admin/sent-emails`, { headers: await getAuthHeaders() });
      return await response.json();
    } catch (e) { return { success: false, emails: [] }; }
  },

  async sendTestEmail(targetEmail?: string) {
    try {
      const response = await fetch(`${API_URL}/admin/test-email`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ targetEmail })
      });
      return await response.json();
    } catch (e) { return { success: false, message: 'Network error' }; }
  },

  async deleteQuote(quoteId: number) {
    try {
      const response = await fetch(`${API_URL}/admin/quotes/${quoteId}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
      });
      return await response.json();
    } catch (e) { return { success: false, message: 'Network error' }; }
  },

  async deleteInvoice(invoiceId: number) {
    try {
      const response = await fetch(`${API_URL}/admin/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
      });
      return await response.json();
    } catch (e) { return { success: false, message: 'Network error' }; }
  },

  async deleteUser(userId: number) {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
      });
      return await response.json();
    } catch (e) { return { success: false, message: 'Network error' }; }
  },

  async updateProjectTasks(userId: number, tasks: any[]) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/tasks`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ tasks })
      });
      return await response.json();
    } catch (e) { return { success: false, message: 'Network error' }; }
  },

  async getAgencySettings() {
    try {
      const response = await fetch(`${API_URL}/agency-settings`);
      const data = await response.json();
      if (data.success && data.settings) {
        offlineCache.set(offlineCache.keys.SETTINGS, data.settings);
      }
      return data;
    } catch (e) {
      const cached = await offlineCache.get<any>(offlineCache.keys.SETTINGS);
      if (cached) return { success: true, settings: cached, isOffline: true };
      return { success: false };
    }
  },

  async updateAgencySettings(data: any) {
    try {
      const response = await fetch(`${API_URL}/admin/agency-settings`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (e) { return { success: false, message: 'Network error' }; }
  },

  async updateDeliverables(userId: number, deliverables: any[]) {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/deliverables`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ deliverables })
      });
      return await response.json();
    } catch (e) { return { success: false, message: 'Network error' }; }
  },

  async getAdminAnalytics() {
    try {
      const response = await fetch(`${API_URL}/admin/analytics`, {
        headers: await getAuthHeaders()
      });
      return await response.json();
    } catch (e) { return { success: false }; }
  },

  async getNotifications() {
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: await getAuthHeaders()
      });
      const data = await response.json();
      if (data.success && data.notifications) {
        offlineCache.set(offlineCache.keys.NOTIFICATIONS, data.notifications);
      }
      return data;
    } catch (e) {
      const cached = await offlineCache.get<any[]>(offlineCache.keys.NOTIFICATIONS);
      if (cached) return { success: true, notifications: cached, isOffline: true };
      return { success: false, notifications: [] };
    }
  },

  async registerPushToken(pushToken: string) {
    try {
      const response = await fetch(`${API_URL}/user/push-token`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ pushToken })
      });
      return await response.json();
    } catch (e) { return { success: false }; }
  },

  async chatConsultant(messages: Array<{ role: string; text: string }>, language: string = 'ar', options?: { apiKey?: string; provider?: string }) {
    try {
      const response = await fetch(`${API_URL}/ai/chat-consultant`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          messages,
          language,
          apiKey: options?.apiKey,
          provider: options?.provider
        })
      });
      return await response.json();
    } catch (e) {
      return { success: false, message: 'تعذر الاتصال بالمستشار الذكي، يرجى التحقق من الشبكة.' };
    }
  },

  async analyzeAiProject(promptOrMessages: string | any[], language: string = 'ar', options?: { apiKey?: string; provider?: string }) {
    try {
      const bodyPayload: any = {
        language,
        apiKey: options?.apiKey,
        provider: options?.provider
      };
      if (Array.isArray(promptOrMessages)) {
        bodyPayload.messages = promptOrMessages;
      } else {
        bodyPayload.prompt = promptOrMessages;
      }

      const response = await fetch(`${API_URL}/ai/analyze-project`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(bodyPayload)
      });
      return await response.json();
    } catch (e) {
      return { success: false, message: 'تعذر الاتصال بمحرك الذكاء الاصطناعي، يرجى التحقق من الشبكة.' };
    }
  },

  async getAiConfig() {
    try {
      const response = await fetch(`${API_URL}/ai/config`);
      return await response.json();
    } catch (e) {
      return { success: false, provider: 'gemini', hasGeminiKey: false };
    }
  },

  async updateAiConfig(data: { geminiApiKey?: string; openaiApiKey?: string; provider?: string }) {
    try {
      const response = await fetch(`${API_URL}/ai/config`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (e) {
      return { success: false, message: 'تعذر حفظ إعدادات الذكاء الاصطناعي.' };
    }
  },

  async convertAiContract(data: { analysis: any; prompt: string; selectedPackage?: 'mvp' | 'pro' | 'enterprise'; notes?: string }) {
    try {
      const response = await fetch(`${API_URL}/ai/convert-contract`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (e) {
      return { success: false, message: 'تعذر تحويل الطلب، يرجى التحقق من الشبكة.' };
    }
  },

  async transcribeAudio(audioBase64: string, mimeType: string = 'audio/m4a', language: string = 'ar') {
    try {
      const response = await fetch(`${API_URL}/ai/transcribe-voice`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ audioBase64, mimeType, language })
      });
      return await response.json();
    } catch (e) {
      return { success: false, message: 'تعذر تحويل الصوت إلى نص، يرجى التحقق من الشبكة.' };
    }
  },

  async getToken() {
    return await getSecureToken();
  }
};
