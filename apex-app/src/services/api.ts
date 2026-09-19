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
  return 'http://10.55.17.219:3000';
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

  async uploadFile(uri: string, filename: string, type: string) {
    try {
      // Ensure ASCII safe filename for multipart headers (prevents OkHttp crash on Arabic filenames)
      const rawExt = filename && filename.includes('.') ? `.${filename.split('.').pop()}` : '';
      const safeExt = rawExt ? rawExt.toLowerCase() : (type.includes('pdf') ? '.pdf' : type.includes('audio') ? '.m4a' : '.jpg');
      const cleanName = `attachment_${Date.now()}${safeExt}`;
      const cleanType = type || 'image/jpeg';
      const token = await getSecureToken();

      // 1. Native Mobile (Android & iOS) via expo-file-system uploadAsync
      if (Platform.OS !== 'web') {
        try {
          let SafeFileSystem: any = null;
          try { SafeFileSystem = require('expo-file-system/legacy'); } catch (e) {
            try { SafeFileSystem = require('expo-file-system'); } catch (e2) {}
          }
          if (SafeFileSystem && SafeFileSystem.uploadAsync) {
            const uploadRes = await SafeFileSystem.uploadAsync(`${API_URL}/upload`, uri, {
              httpMethod: 'POST',
              uploadType: SafeFileSystem.FileSystemUploadType?.MULTIPART || 1,
              fieldName: 'file',
              headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              parameters: {
                filename: cleanName
              }
            });
            if (uploadRes.status >= 200 && uploadRes.status < 300) {
              return JSON.parse(uploadRes.body);
            }
            console.warn('uploadAsync returned status:', uploadRes.status, uploadRes.body);
          }
        } catch (fsErr) {
          console.warn('Native uploadAsync failed, falling back to FormData:', fsErr);
        }
      }

      // 2. Web & Fallback via FormData
      const formData = new FormData();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          const response = await fetch(uri);
          const blob = await response.blob();
          formData.append('file', blob, cleanName);
        } catch (blobErr) {
          formData.append('file', { uri, name: cleanName, type: cleanType } as any);
        }
      } else {
        const cleanUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');
        formData.append('file', {
          uri: cleanUri,
          name: cleanName,
          type: cleanType,
        } as any);
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return { success: false, status: response.status, message: errJson.message || 'Server rejected upload' };
      }
      return await response.json();
    } catch (e: any) {
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
