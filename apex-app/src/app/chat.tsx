import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  FlatList,
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  Alert, 
  Image, 
  Modal,
  Keyboard
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSettings } from '../context/SettingsContext';
import { api, BASE_URL } from '../services/api';
import io from 'socket.io-client';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import ApexLoader from '../components/ApexLoader';
import { useToast } from '../components/ApexToast';
import { 
  getStoredMessages, 
  saveStoredMessages, 
  addStoredMessage, 
  mergeServerAndLocalMessages, 
  ChatMessage 
} from '../utils/ticketStorage';

// Safe loader for expo-av to prevent crashes in Expo Go environments where ExponentAV is missing
let SafeAudio: any = null;
try {
  const { NativeModules, Platform } = require('react-native');
  if (Platform.OS === 'web' || NativeModules?.ExponentAV || NativeModules?.ExpoAudio) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const av = require('expo-av');
    if (av && av.Audio) {
      SafeAudio = av.Audio;
    }
  }
} catch (e) {
  SafeAudio = null;
}

// Safe loaders for expo-sharing & expo-file-system
let SafeSharing: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SafeSharing = require('expo-sharing');
} catch (e) {
  SafeSharing = null;
}

let SafeFileSystem: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SafeFileSystem = require('expo-file-system/legacy');
} catch (e) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    SafeFileSystem = require('expo-file-system');
  } catch (e2) {
    SafeFileSystem = null;
  }
}

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, t, isRTL, currentUser } = useSettings();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const effectiveKeyboardOffset = Platform.OS === 'android'
    ? (keyboardHeight > 0
        ? Math.max(0, keyboardHeight - insets.bottom)
        : (isInputFocused ? Math.max(0, 310 - insets.bottom) : 0))
    : 0;

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e?.endCoordinates?.height || 0);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 60);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState<any | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  // Image Viewer Lightbox Modal
  const [selectedImage, setSelectedImage] = useState<{ url: string; filename: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Microphone Help Modal
  const [showMicHelpModal, setShowMicHelpModal] = useState(false);

  // Attachment Menu
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Audio Playback
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const audioPlayerRef = useRef<any>(null);

  // Web MediaRecorder Refs
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const timerIntervalRef = useRef<any>(null);

  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<any>(null);
  const isSendingRef = useRef(false);

  const activeUserId = currentUser?.role === 'admin' ? Number(params.targetUserId) : currentUser?.id;
  const chatTitle = currentUser?.role === 'admin' ? 'Support Ticket' : t('chatTeam');

  // Live recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    if (!activeUserId) return;
    
    // 1. Immediately load persistent local storage messages (instant display, no empty flicker)
    getStoredMessages(activeUserId).then(local => {
      if (local && local.length > 0) {
        setMessages(local);
        setLoading(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50);
      }
    });

    // 2. Connect socket
    socketRef.current = io(BASE_URL);
    socketRef.current.emit('join_room', activeUserId);
    
    socketRef.current.on('receive_message', (msg: any) => {
      setMessages(prev => {
        const msgKey = msg.clientMsgId || msg.id;
        const existsIndex = prev.findIndex(m => 
          (m.clientMsgId && (m.clientMsgId === msgKey || m.clientMsgId === msg.clientMsgId)) ||
          String(m.id) === String(msg.id) ||
          String(m.id) === String(msg.clientMsgId) ||
          (msg.clientMsgId && String(m.clientMsgId) === String(msg.id))
        );
        if (existsIndex !== -1) {
          const updated = [...prev];
          updated[existsIndex] = { ...updated[existsIndex], ...msg };
          saveStoredMessages(activeUserId, updated);
          return updated;
        }
        const updated = [...prev, msg];
        saveStoredMessages(activeUserId, updated);
        return updated;
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    // 3. Fetch from server and merge with local storage
    const fetchMessages = async () => {
      try {
        const local = await getStoredMessages(activeUserId);
        const res = await api.getMessages(activeUserId);
        if (res.success && Array.isArray(res.messages)) {
          const merged = mergeServerAndLocalMessages(res.messages, local);
          setMessages(merged);
          await saveStoredMessages(activeUserId, merged);
        } else if (local.length > 0) {
          setMessages(local);
        }
      } catch (err) {
        console.warn('Failed to fetch messages from server', err);
      } finally {
        setLoading(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
      }
    };

    fetchMessages();

    return () => {
      socketRef.current?.disconnect();
      if (audioPlayerRef.current) {
        try {
          audioPlayerRef.current.pause();
        } catch (e) {}
      }
    };
  }, [activeUserId]);

  /**
   * Unified message sender: saves to AsyncStorage, emits via Socket or REST with deduplication.
   */
  const sendMessagePayload = async (msgPayload: {
    text?: string;
    attachment?: { uri: string; name?: string; type: 'image' | 'file' | 'audio' } | null;
    attachmentUrl?: string | null;
    type?: 'text' | 'image' | 'document' | 'audio';
  }) => {
    if (!activeUserId) return;
    if (isSendingRef.current) return;
    isSendingRef.current = true;

    try {
      const role: 'client' | 'admin' = currentUser?.role === 'admin' ? 'admin' : 'client';
      const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      const targetUrl = msgPayload.attachmentUrl || (msgPayload.attachment?.uri) || null;
      const msgType = msgPayload.type || (msgPayload.attachment ? (msgPayload.attachment.type === 'image' ? 'image' : msgPayload.attachment.type === 'audio' ? 'audio' : 'document') : 'text');
      
      const uniqueMsgId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const fullMsg: ChatMessage = {
        id: uniqueMsgId,
        clientMsgId: uniqueMsgId,
        userId: activeUserId,
        sender: role,
        senderRole: role,
        text: msgPayload.text || '',
        attachment: msgPayload.attachment || null,
        attachmentUrl: targetUrl,
        type: msgType,
        timestamp,
        createdAt: new Date().toISOString(),
      };

      // 1. Immediately update UI state with Deduplication Map
      setMessages(prev => {
        const map = new Map<string, any>();
        [...prev, fullMsg].forEach(item => {
          const key = item.clientMsgId || String(item.id);
          map.set(key, item);
        });
        return Array.from(map.values());
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      // 2. Persist in AsyncStorage (shared ticket storage)
      await addStoredMessage(activeUserId, fullMsg, {
        fullName: currentUser?.fullName,
        email: currentUser?.email,
      });

      // 3. Emit via socket if connected; fallback to REST API if disconnected
      if (socketRef.current?.connected) {
        socketRef.current?.emit('send_message', fullMsg);
      } else {
        try {
          await api.sendMessage(fullMsg);
        } catch (e) {
          // offline fallback already persisted in AsyncStorage
        }
      }
    } finally {
      isSendingRef.current = false;
    }
  };

  const handleSendText = async () => {
    if (!text.trim() || !activeUserId || isSendingRef.current) return;
    const sendText = text.trim();
    setText('');
    Keyboard.dismiss();
    setIsInputFocused(false);
    await sendMessagePayload({ text: sendText, type: 'text' });
  };

  const handlePickImage = async () => {
    if (uploading || isSendingRef.current) return;
    setShowAttachmentMenu(false);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      setUploading(true);
      const asset = result.assets[0];
      const filename = (asset as any).fileName || (asset as any).name || (asset.uri.split('/').pop()) || 'attachment.jpg';
      const type = (asset as any).mimeType || (asset as any).type || 'image/jpeg';
      
      try {
        const uploadRes = await api.uploadFile(asset.uri, filename, type, asset.base64 || undefined);
        if (uploadRes && uploadRes.success && uploadRes.url) {
          const targetUrl = uploadRes.url;
          await sendMessagePayload({
            text: '',
            attachment: {
              uri: targetUrl,
              name: filename,
              type: 'image'
            },
            attachmentUrl: targetUrl,
            type: 'image'
          });
        } else {
          showToast({
            type: 'error',
            title: isRTL ? 'فشل الرفع' : 'Upload Failed',
            message: uploadRes?.message || (isRTL ? 'فشل رفع الصورة إلى السيرفر، يرجى المحاولة ثانية.' : 'Failed to upload image to server.')
          });
        }
      } catch (e: any) {
        showToast({
          type: 'error',
          title: isRTL ? 'خطأ' : 'Error',
          message: isRTL ? 'تعذر رفع الصورة، تأكد من اتصال الإنترنت.' : 'Could not upload image, check connection.'
        });
      } finally {
        setUploading(false);
      }
    }
  };

  const handlePickDocument = async () => {
    if (uploading || isSendingRef.current) return;
    setShowAttachmentMenu(false);
    let result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      setUploading(true);
      const asset = result.assets[0];
      const filename = asset.name || (asset as any).fileName || 'document.pdf';
      const type = asset.mimeType || (asset as any).type || 'application/pdf';
      
      try {
        const uploadRes = await api.uploadFile(asset.uri, filename, type, (asset as any).base64);
        if (uploadRes && uploadRes.success && uploadRes.url) {
          const targetUrl = uploadRes.url;
          await sendMessagePayload({
            text: filename,
            attachment: {
              uri: targetUrl,
              name: filename,
              type: 'file'
            },
            attachmentUrl: targetUrl,
            type: 'document'
          });
        } else {
          showToast({
            type: 'error',
            title: isRTL ? 'فشل الرفع' : 'Upload Failed',
            message: uploadRes?.message || (isRTL ? 'فشل رفع المستند إلى السيرفر، يرجى المحاولة ثانية.' : 'Failed to upload document to server.')
          });
        }
      } catch (e: any) {
        showToast({
          type: 'error',
          title: isRTL ? 'خطأ' : 'Error',
          message: isRTL ? 'تعذر رفع المستند، تأكد من اتصال الإنترنت.' : 'Could not upload document.'
        });
      } finally {
        setUploading(false);
      }
    }
  };

  const handlePickAudio = async () => {
    if (uploading || isSendingRef.current) return;
    setShowAttachmentMenu(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setUploading(true);
        const asset = result.assets[0];
        const filename = asset.name || (asset as any).fileName || `voice_${Date.now()}.m4a`;
        const type = asset.mimeType || (asset as any).type || 'audio/m4a';

        try {
          const uploadRes = await api.uploadFile(asset.uri, filename, type);
          if (uploadRes && uploadRes.success && uploadRes.url) {
            const targetUrl = uploadRes.url;
            await sendMessagePayload({
              text: '',
              attachment: {
                uri: targetUrl,
                name: filename,
                type: 'audio'
              },
              attachmentUrl: targetUrl,
              type: 'audio'
            });
          } else {
            showToast({
              type: 'error',
              title: isRTL ? 'فشل الرفع' : 'Upload Failed',
              message: uploadRes?.message || (isRTL ? 'فشل رفع المقطع الصوتي.' : 'Failed to upload audio.')
            });
          }
        } catch (err: any) {
          showToast({
            type: 'error',
            title: isRTL ? 'خطأ' : 'Error',
            message: isRTL ? 'تعذر رفع المقطع الصوتي.' : 'Could not upload audio.'
          });
        } finally {
          setUploading(false);
        }
      }
    } catch (e) {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      // On non-localhost HTTP, mobile browsers disable mediaDevices completely for security
      if (!window.isSecureContext && !isLocal) {
        setShowMicHelpModal(true);
        return;
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        setShowMicHelpModal(true);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];

        let mimeType = '';
        if (typeof window.MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          }
        }

        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e: any) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.start(100);
        setIsRecording(true);
      } catch (err: any) {
        console.error('Web mic start error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          const msg = isRTL 
            ? 'تم رفض إذن الميكروفون. يرجى تفعيل إذن المايك في إعدادات متصفحك.' 
            : 'Microphone permission denied. Please allow microphone access in browser settings.';
          showToast({
            type: 'warning',
            title: isRTL ? 'إذن الميكروفون' : 'Microphone Permission',
            message: msg,
          });
        } else {
          setShowMicHelpModal(true);
        }
      }
    } else {
      // Native Expo / Standalone
      if (!SafeAudio) {
        showToast({
          type: 'info',
          title: isRTL ? 'تسجيل الصوت' : 'Voice Recording',
          message: isRTL 
            ? 'يمكنك إرسال مقاطع صوتية بسهولة عبر زر المرفقات (قائمة المرفقات > إرسال مقطع صوتي) في نسخة Expo Go.'
            : 'Please attach audio files via the attachment menu in Expo Go.',
        });
        return;
      }
      try {
        const perm = await SafeAudio.requestPermissionsAsync();
        if (perm.status !== 'granted') {
          showToast({
            type: 'warning',
            title: isRTL ? 'إذن مرفوض' : 'Permission Denied',
            message: isRTL ? 'إذن استخدام الميكروفون مطلوب لتسجيل الصوت.' : 'Microphone access is required.',
          });
          return;
        }
        await SafeAudio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording: newRecording } = await SafeAudio.Recording.createAsync(SafeAudio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(newRecording);
        setIsRecording(true);
      } catch (err) {
        showToast({
          type: 'error',
          title: isRTL ? 'خطأ' : 'Error',
          message: isRTL ? 'فشل بدء التسجيل الصوتي. تأكد من إعطاء الصلاحيات.' : 'Failed to start recording. Check permissions.',
        });
      }
    }
  };

  const cancelRecording = async () => {
    setIsRecording(false);
    if (Platform.OS === 'web' && mediaRecorderRef.current) {
      try {
        const stream = mediaRecorderRef.current.stream;
        if (stream) stream.getTracks().forEach((track: any) => track.stop());
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {}
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    } else if (recording) {
      await recording.stopAndUnloadAsync();
      setRecording(null);
    }
  };

  const getMediaUri = (url: string) => {
    if (!url) return '';
    if (
      url.startsWith('http://') || 
      url.startsWith('https://') || 
      url.startsWith('blob:') || 
      url.startsWith('data:') || 
      url.startsWith('file:') ||
      url.startsWith('content:')
    ) {
      return url;
    }
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const stopAndSendRecording = async () => {
    setIsRecording(false);
    setUploading(true);

    if (Platform.OS === 'web' && mediaRecorderRef.current) {
      const recorder = mediaRecorderRef.current;
      const stream = recorder.stream;
      if (stream) stream.getTracks().forEach((track: any) => track.stop());

      const stoppedPromise = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        if (recorder.state !== 'inactive') {
          recorder.stop();
        } else {
          resolve();
        }
      });

      await stoppedPromise;

      if (audioChunksRef.current.length > 0) {
        const mimeType = recorder.mimeType || 'audio/webm';
        const extension = mimeType.includes('mp4') ? 'm4a' : 'webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const filename = `voice_${Date.now()}.${extension}`;
        const blobUrl = URL.createObjectURL(audioBlob);

        try {
          const uploadRes = await api.uploadFile(blobUrl, filename, mimeType);
          if (uploadRes && uploadRes.success && uploadRes.url) {
            const targetUrl = uploadRes.url;
            await sendMessagePayload({
              text: '',
              attachment: {
                uri: targetUrl,
                name: filename,
                type: 'audio'
              },
              attachmentUrl: targetUrl,
              type: 'audio'
            });
          } else {
            showToast({
              type: 'error',
              title: isRTL ? 'فشل الرفع' : 'Upload Failed',
              message: isRTL ? 'فشل رفع التسجيل الصوتي إلى السيرفر.' : 'Failed to upload voice note.'
            });
          }
        } catch (err) {
          showToast({
            type: 'error',
            title: isRTL ? 'خطأ' : 'Error',
            message: isRTL ? 'تعذر رفع التسجيل الصوتي.' : 'Could not upload voice note.'
          });
        }
      }
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    } else if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        const filename = uri.split('/').pop() || 'audio.m4a';
        try {
          const uploadRes = await api.uploadFile(uri, filename, 'audio/m4a');
          if (uploadRes && uploadRes.success && uploadRes.url) {
            const targetUrl = uploadRes.url;
            await sendMessagePayload({
              text: '',
              attachment: {
                uri: targetUrl,
                name: filename,
                type: 'audio'
              },
              attachmentUrl: targetUrl,
              type: 'audio'
            });
          } else {
            showToast({
              type: 'error',
              title: isRTL ? 'فشل الرفع' : 'Upload Failed',
              message: isRTL ? 'فشل رفع التسجيل الصوتي إلى السيرفر.' : 'Failed to upload voice note.'
            });
          }
        } catch (err) {
          showToast({
            type: 'error',
            title: isRTL ? 'خطأ' : 'Error',
            message: isRTL ? 'تعذر رفع التسجيل الصوتي.' : 'Could not upload voice note.'
          });
        }
      }
    }

    setUploading(false);
  };

  const playAudio = async (url: string) => {
    const fullUrl = getMediaUri(url);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
          if (playingAudioUrl === url) {
            setPlayingAudioUrl(null);
            audioPlayerRef.current = null;
            return;
          }
        }
        const audio = new window.Audio(fullUrl);
        audioPlayerRef.current = audio;
        setPlayingAudioUrl(url);
        audio.onended = () => {
          setPlayingAudioUrl(null);
          audioPlayerRef.current = null;
        };
        audio.onerror = () => {
          setPlayingAudioUrl(null);
          audioPlayerRef.current = null;
        };
        await audio.play();
      } catch (e) {
        console.log('Audio playback error', e);
        setPlayingAudioUrl(null);
      }
    } else {
      if (!SafeAudio) {
        showToast({
          type: 'info',
          title: isRTL ? 'تشغيل الصوت' : 'Play Audio',
          message: isRTL ? 'تشغيل المقاطع الصوتية متاح على متصفح الويب ونسخة الـ APK المستقلة.' : 'Audio playback is supported on web and standalone APK builds.',
        });
        return;
      }
      try {
        const { sound } = await SafeAudio.Sound.createAsync({ uri: fullUrl });
        await sound.playAsync();
      } catch (e) {
        console.log('Audio playback error', e);
      }
    }
  };

  const handleDownloadImage = async (url: string, filename: string) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const res = await fetch(url);
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename || 'downloaded_image.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } else {
        showToast({
          type: 'success',
          title: isRTL ? 'تحميل الصورة' : 'Download Image',
          message: isRTL ? 'تم بدء تنزيل الصورة' : 'Downloading image...',
        });
      }
    } catch (err) {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank');
      }
    }
  };

  const handleOpenDocument = async (attachmentUri: string, attachmentName?: string) => {
    if (!attachmentUri) return;
    const fullUri = getMediaUri(attachmentUri);
    const isLocalPhonePath = fullUri.startsWith('file:///data/') || fullUri.startsWith('file:///var/mobile/') || fullUri.startsWith('content://');

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (isLocalPhonePath) {
        Alert.alert(
          isRTL ? 'تنبيه' : 'Notice',
          isRTL ? 'هذا الملف تم تسجيله كمسار محلي على هاتف العميل من جلسة قديمة ولم يكن قد رُفع إلى الخادم السحابي. الملفات الجديدة المرفوعة ستفتح وتتحمل بشكل مباشر.' : 'This file was saved as a local phone path in a previous session and not on the server.'
        );
        return;
      }
      window.open(fullUri, '_blank');
      return;
    }
    try {
      if (!SafeSharing || !(await SafeSharing.isAvailableAsync?.())) {
        Alert.alert(
          isRTL ? 'تنبيه' : 'Notice', 
          isRTL ? 'المشاركة وفتح الملفات غير مدعومة على هذا الجهاز' : 'Sharing/opening files is not supported on this device'
        );
        return;
      }
      const isLocal = fullUri.startsWith('file://') || fullUri.startsWith('content://');
      if (isLocal) {
        if (SafeFileSystem?.getInfoAsync) {
          const info = await SafeFileSystem.getInfoAsync(fullUri);
          if (!info.exists) {
            Alert.alert(
              isRTL ? 'الملف غير متوفر' : 'File Unavailable',
              isRTL ? 'هذا الملف تم حذفه من الذاكرة المؤقتة للهاتف لأنه كان مسجلاً كمسار محلي قديم. الملفات الجديدة المرفوعة تُحفظ في السيرفر وتفتح دائماً.' : 'This file was deleted from the device cache.'
            );
            return;
          }
        }
        await SafeSharing.shareAsync(fullUri);
      } else {
        showToast({
          type: 'info',
          title: isRTL ? 'جاري التحميل' : 'Downloading',
          message: isRTL ? 'جاري تجهيز وفتح المستند...' : 'Preparing document...',
        });
        const safeName = (attachmentName || fullUri.split('/').pop() || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
        const cacheDir = SafeFileSystem?.cacheDirectory || '';
        const localTarget = `${cacheDir}${Date.now()}_${safeName}`;
        if (SafeFileSystem?.downloadAsync) {
          const res = await SafeFileSystem.downloadAsync(fullUri, localTarget);
          if (res.status === 200 && res.uri) {
            await SafeSharing.shareAsync(res.uri);
          } else {
            throw new Error('Download failed');
          }
        } else {
          await SafeSharing.shareAsync(fullUri);
        }
      }
    } catch (err) {
      console.warn('Open document error:', err);
      showToast({
        type: 'error',
        title: isRTL ? 'خطأ' : 'Error',
        message: isRTL ? 'تعذر فتح أو مشاركة المستند' : 'Could not open document',
      });
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push(currentUser?.role === 'admin' ? '/admin' : '/dashboard');
    }
  };

  const renderMessageItem = ({ item: msg, index }: { item: any; index: number }) => {
    const isMine = (
      msg.sender === currentUser?.role ||
      msg.senderRole === currentUser?.role ||
      (currentUser?.role === 'admin' ? msg.sender === 'admin' : (msg.sender === 'client' || !msg.sender))
    );
    const attachmentUri = msg.attachment?.uri || msg.attachmentUrl || '';
    const attachmentName = msg.attachment?.name || msg.text || (isRTL ? 'ملف مرفق' : 'Attached File');
    const isImage = msg.type === 'image' || msg.attachment?.type === 'image';
    const isAudio = msg.type === 'audio' || msg.attachment?.type === 'audio';
    const isDoc = msg.type === 'document' || msg.attachment?.type === 'file' || msg.attachment?.type === 'document';

    return (
      <View
        key={msg.id || index}
        style={[
          styles.messageBubble,
          isMine ? styles.myMessage : styles.theirMessage,
          isMine
            ? {
                backgroundColor: theme.primary,
                borderBottomRightRadius: isRTL ? 16 : 4,
                borderBottomLeftRadius: isRTL ? 4 : 16,
              }
            : {
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderWidth: 1,
                borderBottomLeftRadius: isRTL ? 16 : 4,
                borderBottomRightRadius: isRTL ? 4 : 16,
              },
        ]}
      >
        {/* Text Message (or caption if text is present and not matching doc name) */}
        {!!msg.text && !isDoc && (
          <Text
            style={[
              styles.messageText,
              {
                color: isMine ? '#0B132B' : theme.text,
                textAlign: isRTL ? 'right' : 'left',
                marginBottom: (isImage || isAudio) ? 6 : 0
              },
            ]}
          >
            {msg.text}
          </Text>
        )}

        {/* Interactive Image Message with Lightbox trigger */}
        {isImage && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              const fullUri = getMediaUri(attachmentUri);
              const isLocalPhonePath = fullUri.startsWith('file:///data/') || fullUri.startsWith('file:///var/mobile/') || fullUri.startsWith('content://');
              if (Platform.OS === 'web' && isLocalPhonePath) {
                Alert.alert(
                  isRTL ? 'تنبيه' : 'Notice',
                  isRTL ? 'هذه الصورة مسجلة كمسار محلي على هاتف العميل من جلسة سابقة ولم تكن قد رُفعت إلى الخادم السحابي. الصور الجديدة المرفوعة تُعرض فورياً وتفتح بحجمها الكامل.' : 'This image was saved as a local phone path in a previous session.'
                );
                return;
              }
              setSelectedImage({
                url: fullUri,
                filename: attachmentName || 'image.jpg',
              });
              setZoomLevel(1);
            }}
            style={[styles.imageCard, { borderColor: isMine ? 'rgba(11,19,43,0.2)' : theme.border }]}
          >
            {Platform.OS === 'web' && (attachmentUri.startsWith('file:///data/') || attachmentUri.startsWith('content://')) ? (
              <View style={{ height: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.btnBg, padding: 16 }}>
                <Ionicons name="image-outline" size={36} color={theme.textMuted} />
                <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                  {isRTL ? 'صورة محلية من هاتف العميل (جلسة سابقة)' : 'Local phone image (previous session)'}
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: getMediaUri(attachmentUri) }}
                style={styles.chatImage}
                resizeMode="cover"
              />
            )}
            <View style={[styles.imageZoomBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name="expand" size={12} color="#FFF" />
              <Text style={styles.imageZoomBadgeText}>
                {isRTL ? 'معاينة وتكبير' : 'Zoom & View'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Audio / Voice Message */}
        {isAudio && (
          <TouchableOpacity
            onPress={() => playAudio(attachmentUri)}
            style={[
              styles.mediaContainer,
              {
                flexDirection: isRTL ? 'row-reverse' : 'row',
                backgroundColor: isMine ? 'rgba(11, 19, 43, 0.12)' : theme.btnBg,
                borderColor: isMine ? 'rgba(11, 19, 43, 0.2)' : theme.border,
              },
            ]}
          >
            <Ionicons
              name={playingAudioUrl === attachmentUri ? 'pause-circle' : 'play-circle'}
              size={32}
              color={isMine ? '#0B132B' : theme.primary}
            />
            <View
              style={{
                height: 3,
                backgroundColor: isMine ? 'rgba(11, 19, 43, 0.25)' : theme.border,
                flex: 1,
                marginHorizontal: 10,
                borderRadius: 2,
              }}
            />
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: isMine ? '#0B132B' : theme.text }}>
              {playingAudioUrl === attachmentUri
                ? (isRTL ? 'تشغيل...' : 'Playing...')
                : (isRTL ? 'تسجيل صوتي' : 'Voice')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Document Message */}
        {isDoc && (
          <TouchableOpacity
            onPress={() => handleOpenDocument(attachmentUri, attachmentName)}
            style={[
              styles.mediaContainer,
              {
                flexDirection: isRTL ? 'row-reverse' : 'row',
                backgroundColor: isMine ? 'rgba(11, 19, 43, 0.12)' : theme.btnBg,
                borderColor: isMine ? 'rgba(11, 19, 43, 0.2)' : theme.border,
              },
            ]}
          >
            <Ionicons name="document-text" size={24} color={isMine ? '#0B132B' : theme.primary} />
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                marginHorizontal: 8,
                color: isMine ? '#0B132B' : theme.text,
                fontSize: 13,
                fontWeight: '600',
                textAlign: isRTL ? 'right' : 'left'
              }}
            >
              {attachmentName}
            </Text>
            <Ionicons name="download-outline" size={18} color={isMine ? '#0B132B99' : theme.textMuted} />
          </TouchableOpacity>
        )}

        {/* Time Container */}
        <View style={[styles.timeContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text
            style={[
              styles.timestamp,
              { color: isMine ? 'rgba(11, 19, 43, 0.7)' : theme.textMuted },
            ]}
          >
            {msg.timestamp || (msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
          </Text>
          {isMine && (
            <Ionicons
              name="checkmark-done"
              size={14}
              color="#0B132B"
              style={{ marginHorizontal: 4 }}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
        style={{ flex: 1 }}
      >
        {/* Header - Modern Dark Theme */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.card,
              borderBottomColor: theme.border,
              borderBottomWidth: 1,
              flexDirection: isRTL ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            },
          ]}
        >
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={handleGoBack} style={[styles.backBtn, { backgroundColor: theme.btnBg }]}>
              <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={theme.text} />
            </TouchableOpacity>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.btnBg,
                borderWidth: 1,
                borderColor: theme.border,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="headset" size={20} color={theme.primary} />
            </View>
            <View style={{ marginLeft: isRTL ? 0 : 4, marginRight: isRTL ? 4 : 0 }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>{chatTitle}</Text>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
                <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '500' }}>{t('online') || 'Online'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Chat Area - FlatList */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderMessageItem}
          inverted={false}
          contentContainerStyle={styles.chatContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={() => {
            Keyboard.dismiss();
            setIsInputFocused(false);
          }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            loading ? (
              <ApexLoader message={isRTL ? 'جاري الاتصال بغرفة المحادثة...' : 'Connecting to live chat...'} />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                <Ionicons name="chatbubbles-outline" size={48} color={theme.textMuted} />
                <Text style={{ color: theme.textMuted, fontSize: 14, marginTop: 8 }}>
                  {isRTL ? 'لا توجد رسائل سابقة. ابدأ المحادثة الآن!' : 'No messages yet. Start the conversation!'}
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            uploading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 10, gap: 8 }}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={{ color: theme.primary, fontSize: 12, fontWeight: 'bold' }}>
                  {isRTL ? 'جاري رفع الملف...' : 'Uploading attachment...'}
                </Text>
              </View>
            ) : (
              <View style={{ height: 16 }} />
            )
          }
        />

        {/* Input Area */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.bg,
              borderTopColor: theme.border,
              borderTopWidth: 1,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            },
          ]}
        >
          {isRecording ? (
            <View
              style={[
                styles.recordingBar,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  borderWidth: 1,
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                },
              ]}
            >
              <TouchableOpacity onPress={cancelRecording} style={{ padding: 10 }}>
                <Ionicons name="trash" size={24} color="#EF4444" />
              </TouchableOpacity>

              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.pulsingDot} />
                <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: 'bold' }}>
                  {formatDuration(recordingSeconds)}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                  {isRTL ? 'جاري التسجيل...' : 'Recording...'}
                </Text>
              </View>

              <TouchableOpacity onPress={stopAndSendRecording} style={[styles.sendBtn, { backgroundColor: theme.primary }]}>
                <Ionicons
                  name="send"
                  size={18}
                  color="#0B132B"
                  style={{ marginLeft: isRTL ? 0 : 2, marginRight: isRTL ? 2 : 0 }}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View
                style={[
                  styles.textInputWrapper,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    borderWidth: 1,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  },
                ]}
              >
                <TouchableOpacity style={styles.iconBtn} onPress={() => {}}>
                  <MaterialCommunityIcons name="emoticon-outline" size={24} color={theme.textMuted} />
                </TouchableOpacity>

                <TextInput
                  style={[styles.input, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
                  placeholderTextColor={theme.textMuted}
                  value={text}
                  onChangeText={setText}
                  onSubmitEditing={handleSendText}
                  onFocus={() => {
                    setIsInputFocused(true);
                    setTimeout(() => {
                      flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
                  onBlur={() => {
                    setIsInputFocused(false);
                  }}
                  multiline
                />

                <TouchableOpacity style={styles.iconBtn} onPress={handlePickImage}>
                  <Feather name="image" size={22} color={theme.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconBtn} onPress={() => setShowAttachmentMenu((prev) => !prev)}>
                  <Feather name="paperclip" size={22} color={showAttachmentMenu ? theme.primary : theme.textMuted} />
                </TouchableOpacity>
              </View>

              {text.trim() === '' ? (
                <TouchableOpacity onPress={startRecording} style={[styles.micBtn, { backgroundColor: theme.primary }]}>
                  <Ionicons name="mic" size={22} color="#0B132B" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleSendText} style={[styles.sendBtn, { backgroundColor: theme.primary }]}>
                  <Ionicons
                    name="send"
                    size={18}
                    color="#0B132B"
                    style={{ marginLeft: isRTL ? 0 : 2, marginRight: isRTL ? 2 : 0 }}
                  />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Attachment Options Drawer */}
        {showAttachmentMenu && (
          <View style={[styles.attachmentDrawer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                justifyContent: 'space-around',
                alignItems: 'center',
                paddingVertical: 14,
              }}
            >
              <TouchableOpacity onPress={handlePickImage} style={styles.attachOption}>
                <View style={[styles.attachIconCircle, { backgroundColor: '#8B5CF6' }]}>
                  <Ionicons name="image" size={22} color="#FFF" />
                </View>
                <Text style={[styles.attachOptionLabel, { color: theme.text }]}>{isRTL ? 'صورة' : 'Image'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handlePickDocument} style={styles.attachOption}>
                <View style={[styles.attachIconCircle, { backgroundColor: '#3B82F6' }]}>
                  <Ionicons name="document" size={22} color="#FFF" />
                </View>
                <Text style={[styles.attachOptionLabel, { color: theme.text }]}>{isRTL ? 'مستند' : 'Document'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handlePickAudio} style={styles.attachOption}>
                <View style={[styles.attachIconCircle, { backgroundColor: '#F59E0B' }]}>
                  <Ionicons name="musical-notes" size={22} color="#FFF" />
                </View>
                <Text style={[styles.attachOptionLabel, { color: theme.text }]}>{isRTL ? 'ملف صوتي' : 'Audio File'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ========================================================================= */}
      {/* Interactive Image Lightbox & Zoom & Download Modal                        */}
      {/* ========================================================================= */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.lightboxOverlay}>
          
          {/* Header Bar */}
          <View style={[styles.lightboxHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity 
              onPress={() => { setSelectedImage(null); setZoomLevel(1); }} 
              style={styles.lightboxCloseBtn}
            >
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>

            <View style={{ flex: 1, marginHorizontal: 10, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: 'bold' }} numberOfLines={1}>
                {selectedImage?.filename}
              </Text>
              <Text style={{ color: '#34B7F1', fontSize: 11 }}>
                {isRTL ? `التكبير: ${Math.round(zoomLevel * 100)}%` : `Zoom: ${Math.round(zoomLevel * 100)}%`}
              </Text>
            </View>

            {/* Zoom Controls */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                onPress={() => setZoomLevel(prev => Math.max(0.5, Math.round((prev - 0.25) * 100) / 100))}
                style={styles.zoomControlBtn}
              >
                <Ionicons name="remove-circle-outline" size={24} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setZoomLevel(prev => Math.min(3, Math.round((prev + 0.25) * 100) / 100))}
                style={styles.zoomControlBtn}
              >
                <Ionicons name="add-circle-outline" size={24} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setZoomLevel(1)}
                style={styles.zoomControlBtn}
              >
                <Ionicons name="refresh-outline" size={22} color="#FFF" />
              </TouchableOpacity>

              {/* Download Button */}
              <TouchableOpacity
                onPress={() => selectedImage && handleDownloadImage(selectedImage.url, selectedImage.filename)}
                style={styles.lightboxDownloadBtn}
              >
                <Ionicons name="download" size={16} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>
                  {isRTL ? 'تحميل' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Interactive Zoomable Image Area */}
          <ScrollView
            contentContainerStyle={styles.lightboxBody}
            maximumZoomScale={3}
            minimumZoomScale={0.5}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage.url }}
                style={[
                  styles.lightboxImage,
                  {
                    transform: [{ scale: zoomLevel }],
                  },
                ]}
                resizeMode="contain"
              />
            ) : null}
          </ScrollView>

          {/* Bottom Bar Controls */}
          <View style={[styles.lightboxFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              onPress={() => setZoomLevel(1.5)}
              style={styles.presetZoomBtn}
            >
              <Text style={styles.presetZoomText}>150%</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setZoomLevel(2)}
              style={styles.presetZoomBtn}
            >
              <Text style={styles.presetZoomText}>200%</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setZoomLevel(2.5)}
              style={styles.presetZoomBtn}
            >
              <Text style={styles.presetZoomText}>250%</Text>
            </TouchableOpacity>

            {selectedImage && typeof window !== 'undefined' ? (
              <TouchableOpacity
                onPress={() => window.open(selectedImage.url, '_blank')}
                style={[styles.presetZoomBtn, { backgroundColor: '#3B82F6' }]}
              >
                <Ionicons name="open-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={styles.presetZoomText}>{isRTL ? 'نافذة جديدة' : 'New Tab'}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={() => selectedImage && handleDownloadImage(selectedImage.url, selectedImage.filename)}
              style={[styles.presetZoomBtn, { backgroundColor: '#10B981', flex: 1 }]}
            >
              <Ionicons name="cloud-download-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.presetZoomText}>{isRTL ? 'تنزيل وحفظ الصورة' : 'Save Image'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* Microphone Guidance Modal for Mobile Browsers                             */}
      {/* ========================================================================= */}
      <Modal visible={showMicHelpModal} transparent animationType="slide">
        <View style={styles.micModalOverlay}>
          <View style={[styles.micModalContent, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="mic" size={20} color={theme.primary} />
                <Text style={{ fontSize: 17, fontWeight: 'bold', color: theme.text }}>
                  {isRTL ? 'تفعيل الميكروفون على الهاتف' : 'Mobile Microphone Setup'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowMicHelpModal(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 14, textAlign: isRTL ? 'right' : 'left' }}>
              {isRTL 
                ? 'تفرض متصفحات الهواتف (مثل Google Chrome و Safari) حماية الخصوصية، حيث تشترط اتصالاً مشفراً (HTTPS) للسماح للمايك بالعمل عبر الشبكة.'
                : 'Mobile browsers require HTTPS or secure origin flags to enable direct microphone streaming.'}
            </Text>

            {/* Quick Action: Pick Recorded Audio File */}
            <TouchableOpacity
              onPress={() => {
                setShowMicHelpModal(false);
                handlePickAudio();
              }}
              style={[styles.micModalActionBtn, { backgroundColor: theme.primary, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }]}
            >
              <Ionicons name="musical-notes" size={20} color="#0B132B" />
              <Text style={{ color: '#0B132B', fontWeight: 'bold', fontSize: 14 }}>
                {isRTL ? 'إرسال تسجيل صوتي من ملفات الهاتف' : 'Send Recorded Audio File'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.micHelpStepBox, { backgroundColor: theme.btnBg, borderColor: theme.border }]}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Ionicons name="bulb-outline" size={16} color={theme.primary} />
                <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 13 }}>
                  {isRTL ? 'طريقة تشغيل المايك المباشر في كروم الموبايل:' : 'How to enable direct mic in Chrome:'}
                </Text>
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 12, lineHeight: 19, textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL 
                  ? '1. في شريط عناوين كروم بالهاتف اكتب: chrome://flags\n2. ابحث في الصفحة عن: unsafely-treat-insecure-origin-as-secure\n3. اختر Enabled واكتب في المربع عنوان الخادم الحالي\n4. اضغط Relaunch بالأسفل وسيعمل المايك مباشرة بدون أي قيود.'
                  : '1. In Chrome address bar type: chrome://flags\n2. Search: unsafely-treat-insecure-origin-as-secure\n3. Set Enabled and add server address\n4. Tap Relaunch.'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowMicHelpModal(false)}
              style={[styles.micModalCloseBtn, { backgroundColor: theme.btnBg }]}
            >
              <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }}>
                {isRTL ? 'إغلاق' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, elevation: 4, zIndex: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  chatContainer: { paddingHorizontal: 12, paddingVertical: 12, flexGrow: 1, maxWidth: 800, width: '100%', alignSelf: 'center' },
  messageBubble: { maxWidth: '82%', padding: 10, paddingHorizontal: 14, borderRadius: 16, marginBottom: 10, elevation: 1 },
  myMessage: { alignSelf: 'flex-end' },
  theirMessage: { alignSelf: 'flex-start' },
  messageText: { fontSize: 15, lineHeight: 22 },
  mediaContainer: { alignItems: 'center', padding: 10, borderRadius: 12, minWidth: 160 },
  timeContainer: { alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 },
  timestamp: { fontSize: 10 },
  inputContainer: { padding: 10, alignItems: 'flex-end', maxWidth: 800, width: '100%', alignSelf: 'center' },
  recordingBar: { flex: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 4, marginHorizontal: 4, minHeight: 48 },
  pulsingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444' },
  textInputWrapper: { flex: 1, borderRadius: 24, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, minHeight: 48, marginHorizontal: 4 },
  iconBtn: { padding: 8 },
  input: { flex: 1, fontSize: 15, maxHeight: 100, paddingVertical: 8 },
  micBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  
  // Image card in chat
  imageCard: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 6,
    borderWidth: 1,
  },
  chatImage: {
    width: 230,
    height: 230,
    borderRadius: 12,
  },
  imageZoomBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    gap: 4,
  },
  imageZoomBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Attachment Drawer
  attachmentDrawer: {
    borderTopWidth: 1,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  attachOption: {
    alignItems: 'center',
    gap: 6,
  },
  attachIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  attachOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Lightbox Modal
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'space-between',
  },
  lightboxHeader: {
    paddingTop: Platform.OS === 'ios' ? 44 : 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lightboxCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  zoomControlBtn: {
    padding: 4,
  },
  lightboxDownloadBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 6,
  },
  lightboxBody: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  lightboxImage: {
    width: '95%',
    height: '80%',
  },
  lightboxFooter: {
    padding: 14,
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    gap: 8,
  },
  presetZoomBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetZoomText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Mic Guidance Modal
  micModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  micModalContent: {
    borderRadius: 18,
    padding: 20,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  micModalActionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  micHelpStepBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  micModalCloseBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
});

