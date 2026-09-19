import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
  Platform,
  LayoutAnimation,
  UIManager,
  KeyboardAvoidingView,
  Keyboard,
  Linking
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { api } from '../services/api';
import { haptics } from '../utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useResponsive } from '../hooks/useResponsive';
import { useToast } from '../components/ApexToast';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Safe loader for expo-av
let SafeAudio: any = null;
try {
  const { NativeModules, Platform: RNPlatform } = require('react-native');
  if (RNPlatform.OS === 'web' || NativeModules?.ExponentAV || NativeModules?.ExpoAudio) {
    const av = require('expo-av');
    if (av && av.Audio) {
      SafeAudio = av.Audio;
    }
  }
} catch (e) {
  SafeAudio = null;
}

// Safe loader for expo-file-system
let SafeFileSystem: any = null;
try {
  SafeFileSystem = require('expo-file-system/legacy');
} catch (e) {
  try {
    SafeFileSystem = require('expo-file-system');
  } catch (e2) {
    SafeFileSystem = null;
  }
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  suggestions?: string[];
  readyForSpec?: boolean;
  engine?: string;
  timestamp?: string;
}

const QUICK_SUGGESTIONS = [
  {
    id: 'pharmacy',
    icon: 'medkit-outline',
    title: 'أوبر توصيل أدوية',
    prompt: 'عندي فكرة تطبيق زي أوبر لتوصيل الأدوية من الصيدليات مع قراءة ذكية للروشتات وتتبع GPS',
  },
  {
    id: 'auction',
    icon: 'flash-outline',
    title: 'مزادات سيارات حية',
    prompt: 'منصة مزادات سيارات حية مع بث فيديو لحظي ومزايدة بالثواني ومحفظة مالية للتأمين',
  },
  {
    id: 'food',
    icon: 'restaurant-outline',
    title: 'توصيل مطاعم وكافيهات',
    prompt: 'أريد منصة وتطبيق لطلب الطعام والوجبات من المطاعم مع كباتن وتتبع GPS ودفع إلكتروني',
  },
  {
    id: 'ride',
    icon: 'car-outline',
    title: 'تطبيق رحلات وسيارات',
    prompt: 'فكرة تطبيق طلب تاكسي وسيارات ذكية مثل كريم وأوبر مع خريطة حية وحساب مسافات',
  },
  {
    id: 'ecommerce',
    icon: 'cart-outline',
    title: 'متجر متعدد التجار',
    prompt: 'منصة تجارة إلكترونية وسوق ذكي يسمح للتجار بالبيع مع لوحة إدارة وبوابات دفع Paymob',
  },
  {
    id: 'health',
    icon: 'fitness-outline',
    title: 'حجز عيادات واستشارات',
    prompt: 'تطبيق حجز مواعيد الأطباء والعيادات واستشارات فيديو أونلاين وملف طبي إلكتروني للمريض',
  },
];

export default function CopilotScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const { theme, activeTheme, isRTL, currentUser, setCurrentUser } = useSettings();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Precision Android keyboard offset: if keyboardDidShow doesn't fire (e.g. Samsung One UI Edge-to-Edge),
  // fallback to guaranteed isInputFocused keyboard height
  const effectiveKeyboardOffset = Platform.OS === 'android'
    ? (keyboardHeight > 0
        ? Math.max(0, keyboardHeight - insets.bottom)
        : (isInputFocused ? Math.max(0, 310 - insets.bottom) : 0))
    : 0;

  // Mode: 'chat' | 'blueprint'
  const [activeMode, setActiveMode] = useState<'chat' | 'blueprint'>('chat');
  const [isBannerCollapsed, setIsBannerCollapsed] = useState(false);
  
  // Selected investment package: 'mvp' | 'pro' | 'enterprise'
  const [selectedPackage, setSelectedPackage] = useState<'mvp' | 'pro' | 'enterprise'>('pro');

  // Messages in consultation chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: isRTL
        ? 'أهلاً بك! أنا المستشار البرمجي ورئيس المعماريين في Apex Software. ما هي فكرة تطبيقك أو مشروعك الرقمي؟ شاركني الفكرة وسأناقش معك أدق تفاصيلها الفنية والتجارية، ثم نستخرج خطة العمل الكاملة والـ 3 باقات.'
        : 'Welcome! I am the Chief Software Architect at Apex Software. Tell me about your software idea, and I will consult with you on the architecture, business model, and generate your feasibility blueprint with 3 investment tiers.',
      suggestions: [
        'عندي فكرة تطبيق زي أوبر لتوصيل الأدوية من الصيدليات',
        'منصة مزادات سيارات حية مع بث فيديو لحظي ومزايدة بالثواني',
        'تطبيق طلب وتوصيل وجبات ومطاعم مع كباتن وتتبع GPS',
        'سوق إلكتروني متعدد التجار مع بوابات دفع Paymob وفودافون كاش'
      ],
      readyForSpec: false,
      timestamp: new Date().toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [recording, setRecording] = useState<any | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const [currency, setCurrency] = useState<'EGP' | 'USD'>('EGP');

  // Blueprint Tabs: strategy | platforms | architecture | tech | budget | roadmap
  const [activeTab, setActiveTab] = useState<'strategy' | 'platforms' | 'architecture' | 'tech' | 'budget' | 'roadmap'>('strategy');

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [contractSuccessData, setContractSuccessData] = useState<any | null>(null);

  // AI Configuration State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'deep_engine'>('gemini');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [configuredKeyMasked, setConfiguredKeyMasked] = useState('');

  // Pulse animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  const recognitionRef = useRef<any>(null);
  const chatScrollRef = useRef<ScrollView>(null);

  // Track soft keyboard height on mobile to guarantee chat input stays above keyboard
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e: any) => {
      const h = e?.endCoordinates?.height || 0;
      if (Platform.OS === 'android') {
        try {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        } catch (err) {}
      }
      setKeyboardHeight(h);
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 60);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      if (Platform.OS === 'android') {
        try {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        } catch (err) {}
      }
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.35,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Load AI Config
    (async () => {
      try {
        const storedKey = await AsyncStorage.getItem('userGeminiKey');
        if (storedKey) setApiKeyInput(storedKey);

        const res = await api.getAiConfig();
        if (res.success) {
          if (res.geminiKeyMasked) setConfiguredKeyMasked(res.geminiKeyMasked);
          if (res.provider) setAiProvider(res.provider);
        }
      } catch (e) {}
    })();
  }, [pulseAnim]);

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, {
            toValue: 1.35,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(micPulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      micPulseAnim.setValue(1);
    }
  }, [isListening, micPulseAnim]);

  // Voice recording toggle (Web Speech API / Native SafeAudio Recording + AI Transcription)
  const toggleVoiceRecording = async () => {
    haptics.medium();

    // -------------------------------------------------------------
    // 1. WEB FLOW: Web Speech API (Live real-time speech-to-text)
    // -------------------------------------------------------------
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        if (isListening) {
          if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) {}
          }
          setIsListening(false);
          return;
        }

        try {
          const recognition = new SpeechRecognition();
          recognition.lang = isRTL ? 'ar-EG' : 'en-US';
          recognition.continuous = false;
          recognition.interimResults = true;

          recognition.onstart = () => {
            setIsListening(true);
            showToast({
              type: 'info',
              title: isRTL ? 'المستشار يستمع إليك...' : 'Listening...',
              message: isRTL ? 'تحدث الآن، وسيتم كتابة كلامك تلقائياً.' : 'Speak now, your words will appear live.',
            });
          };

          recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              .map((r: any) => r[0]?.transcript)
              .join('');
            if (transcript) {
              setChatInput(transcript);
            }
          };

          recognition.onerror = () => setIsListening(false);
          recognition.onend = () => {
            setIsListening(false);
            haptics.success();
          };

          recognitionRef.current = recognition;
          recognition.start();
          return;
        } catch (e) {
          console.error('Speech recognition error', e);
        }
      }

      // If Web Speech API is not supported on this browser -> use MediaRecorder to record and transcribe via AI
      if (isListening && mediaRecorderRef.current) {
        setIsListening(false);
        setIsTranscribing(true);
        try {
          const recorder = mediaRecorderRef.current;
          if (recorder.stream) {
            recorder.stream.getTracks().forEach((t: any) => t.stop());
          }
          const stopPromise = new Promise<void>((resolve) => {
            recorder.onstop = () => resolve();
            if (recorder.state !== 'inactive') recorder.stop();
            else resolve();
          });
          await stopPromise;

          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
              const base64data = reader.result as string;
              const res = await api.transcribeAudio(base64data, 'audio/webm', isRTL ? 'ar' : 'en');
              setIsTranscribing(false);
              if (res.success && res.text) {
                haptics.success();
                setChatInput(res.text);
                showToast({
                  type: 'success',
                  title: isRTL ? 'تم تحويل الصوت بنجاح' : 'Voice Transcribed',
                  message: res.text,
                });
              } else {
                showToast({
                  type: 'warning',
                  title: isRTL ? 'تنبيه' : 'Notice',
                  message: res.message || (isRTL ? 'تعذر التعرف على الكلمات، يرجى المحاولة ثانية.' : 'Could not transcribe speech.'),
                });
              }
            };
          } else {
            setIsTranscribing(false);
          }
        } catch (err) {
          setIsTranscribing(false);
        }
        return;
      }

      // Start Web MediaRecorder
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        recorder.ondataavailable = (e: any) => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.start(100);
        mediaRecorderRef.current = recorder;
        setIsListening(true);
        showToast({
          type: 'info',
          title: isRTL ? 'جاري التسجيل...' : 'Recording...',
          message: isRTL ? 'تحدث الآن، واضغط على المايك مرة أخرى عند الانتهاء.' : 'Speak now, tap mic again when done.',
        });
        return;
      } catch (err) {
        showToast({
          type: 'error',
          title: isRTL ? 'إذن الميكروفون' : 'Microphone Permission',
          message: isRTL ? 'يرجى إعطاء صلاحية الميكروفون في المتصفح.' : 'Please allow microphone access.',
        });
        return;
      }
    }

    // -------------------------------------------------------------
    // 2. MOBILE FLOW (Android & iOS in Expo Go & Standalone)
    // -------------------------------------------------------------
    if (isListening) {
      // STOP recording and transcribe!
      setIsListening(false);
      if (!recording) return;

      setIsTranscribing(true);
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);

        if (!uri) {
          setIsTranscribing(false);
          return;
        }

        // Read audio as base64
        let base64Audio = '';
        if (SafeFileSystem && SafeFileSystem.readAsStringAsync) {
          base64Audio = await SafeFileSystem.readAsStringAsync(uri, {
            encoding: SafeFileSystem.EncodingType?.Base64 || 'base64',
          });
        } else {
          const response = await fetch(uri);
          const blob = await response.blob();
          base64Audio = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
              resolve((reader.result as string).replace(/^data:audio\/[a-z0-9]+;base64,/, ''));
            };
          });
        }

        if (!base64Audio) {
          setIsTranscribing(false);
          showToast({
            type: 'error',
            title: isRTL ? 'خطأ' : 'Error',
            message: isRTL ? 'تعذر قراءة التسجيل الصوتي.' : 'Failed to read audio file.',
          });
          return;
        }

        showToast({
          type: 'info',
          title: isRTL ? 'جاري تحويل صوتك...' : 'Transcribing...',
          message: isRTL ? 'يقوم الذكاء الاصطناعي الآن بتحويل كلماتك إلى نص...' : 'AI is transcribing your voice...',
        });

        const res = await api.transcribeAudio(base64Audio, 'audio/m4a', isRTL ? 'ar' : 'en');
        setIsTranscribing(false);

        if (res.success && res.text) {
          await haptics.success();
          setChatInput(res.text);
          showToast({
            type: 'success',
            title: isRTL ? 'تم تحويل صوتك بنجاح' : 'Voice Transcribed',
            message: res.text,
          });
        } else {
          await haptics.error();
          showToast({
            type: 'warning',
            title: isRTL ? 'تنبيه' : 'Notice',
            message: res.message || (isRTL ? 'لم نتمكن من التقاط صوت واضح، يرجى التحدث بصوت أعلى.' : 'Could not transcribe speech.'),
          });
        }
      } catch (err: any) {
        setIsTranscribing(false);
        console.error('Stop and transcribe error:', err);
        showToast({
          type: 'error',
          title: isRTL ? 'خطأ في التحويل' : 'Error',
          message: isRTL ? 'حدث خطأ أثناء معالجة الصوت.' : 'Failed to process voice.',
        });
      }
    } else {
      // START recording on mobile!
      if (!SafeAudio) {
        showToast({
          type: 'warning',
          title: isRTL ? 'تسجيل الصوت' : 'Audio Recording',
          message: isRTL ? 'مكتبة الصوت غير متوفرة في هذه البيئة.' : 'Audio module unavailable.',
        });
        return;
      }

      try {
        const perm = await SafeAudio.requestPermissionsAsync();
        if (perm.status !== 'granted') {
          showToast({
            type: 'warning',
            title: isRTL ? 'إذن الميكروفون' : 'Permission Required',
            message: isRTL ? 'يرجى إعطاء صلاحية الميكروفون للتحدث مع المستشار.' : 'Microphone permission is required.',
          });
          return;
        }

        await SafeAudio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await SafeAudio.Recording.createAsync(
          SafeAudio.RecordingOptionsPresets.HIGH_QUALITY
        );

        setRecording(newRecording);
        setIsListening(true);

        showToast({
          type: 'info',
          title: isRTL ? 'المستشار يستمع إليك...' : 'Listening...',
          message: isRTL ? 'تحدث الآن بفكرتك... واضغط المايك مرة أخرى عند الانتهاء.' : 'Speak your idea now, tap mic when done.',
        });
      } catch (err: any) {
        console.error('Failed to start recording:', err);
        showToast({
          type: 'error',
          title: isRTL ? 'خطأ' : 'Error',
          message: isRTL ? 'فشل بدء تسجيل الصوت. تأكد من إعطاء صلاحيات المايك.' : 'Failed to start recording.',
        });
      }
    }
  };

  // Open WhatsApp directly for human consultation
  const handleOpenWhatsApp = () => {
    haptics.medium();
    const defaultMsg = isRTL 
      ? 'مرحباً فريق Apex Devs، أود استشارة برمجية بخصوص مشروعي والتكلفة المتوقعة...'
      : 'Hello Apex Devs team, I would like a consultation regarding my software project...';

    const url = `https://wa.me/201027877209?text=${encodeURIComponent(defaultMsg)}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => {
        showToast({
          type: 'warning',
          title: isRTL ? 'تنبيه' : 'Notice',
          message: isRTL ? 'تعذر فتح تطبيق واتساب.' : 'Could not open WhatsApp.',
        });
      });
    }
  };

  // Send message in interactive consultation chat
  const handleSendChatMessage = async (overrideText?: string) => {
    const textToSend = (overrideText || chatInput).trim();
    if (!textToSend || chatLoading) return;

    haptics.light();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    };

    Keyboard.dismiss();
    setIsInputFocused(false);

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);

    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const storedKey = await AsyncStorage.getItem('userGeminiKey');
      const activeKey = apiKeyInput.trim() || storedKey || undefined;

      const res = await api.chatConsultant(
        updatedMessages.map(m => ({ role: m.role, text: m.text })),
        isRTL ? 'ar' : 'en',
        { apiKey: activeKey, provider: aiProvider }
      );

      setChatLoading(false);

      if (res.success && res.reply) {
        haptics.success();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: res.reply,
          suggestions: Array.isArray(res.suggestions) ? res.suggestions : [],
          readyForSpec: !!res.readyForSpec,
          engine: res.engine,
          timestamp: new Date().toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        setTimeout(() => {
          chatScrollRef.current?.scrollToEnd({ animated: true });
        }, 150);
      } else {
        haptics.error();
        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: isRTL ? 'عذراً، حدث خطأ أثناء المعالجة، يرجى المحاولة ثانية.' : 'Sorry, failed to process message. Please try again.',
          suggestions: ['إعادة المحاولة', 'استخراج خطة المشروع مباشرة'],
          timestamp: new Date().toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err) {
      setChatLoading(false);
      haptics.error();
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: isRTL ? 'تعذر الاتصال بالمستشار الذكي، يرجى التحقق من الشبكة والمحاولة مجدداً.' : 'Connection error. Please check network.',
        suggestions: ['إعادة المحاولة'],
        timestamp: new Date().toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  // Generate full architectural blueprint & 3-tier packages
  const handleGenerateBlueprint = async () => {
    haptics.medium();
    setAnalyzing(true);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    try {
      const storedKey = await AsyncStorage.getItem('userGeminiKey');
      const activeKey = apiKeyInput.trim() || storedKey || undefined;

      const res = await api.analyzeAiProject(
        messages.map(m => ({ role: m.role, text: m.text })),
        isRTL ? 'ar' : 'en',
        { apiKey: activeKey, provider: aiProvider }
      );

      setAnalyzing(false);

      if (res.success && res.analysis) {
        haptics.success();
        setAnalysis(res.analysis);
        setActiveMode('blueprint');
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      } else {
        haptics.error();
        showToast({
          type: 'error',
          title: isRTL ? 'خطأ في استخراج الخطة' : 'Error',
          message: res.message || (isRTL ? 'تعذر استخراج الخطة، يرجى المحاولة ثانية.' : 'Failed to generate blueprint.'),
        });
      }
    } catch (e) {
      setAnalyzing(false);
      haptics.error();
      showToast({
        type: 'error',
        title: isRTL ? 'خطأ' : 'Error',
        message: isRTL ? 'حدث خطأ في الاتصال بالخادم.' : 'Connection error.',
      });
    }
  };

  // Save AI Config
  const handleSaveAiConfig = async () => {
    setSavingConfig(true);
    haptics.medium();
    try {
      if (apiKeyInput.trim()) {
        await AsyncStorage.setItem('userGeminiKey', apiKeyInput.trim());
      }
      const res = await api.updateAiConfig({
        geminiApiKey: apiKeyInput.trim() || undefined,
        provider: aiProvider
      });
      setSavingConfig(false);
      if (res.success) {
        haptics.success();
        setShowConfigModal(false);
        showToast({
          type: 'success',
          title: isRTL ? 'تم الحفظ بنجاح' : 'Saved Successfully',
          message: isRTL ? 'تم تحديث إعدادات محرك الذكاء الاصطناعي وسيتم استخدامه فوراً.' : 'AI Engine configuration updated!',
        });
      } else {
        setShowConfigModal(false);
      }
    } catch (e) {
      setSavingConfig(false);
      setShowConfigModal(false);
    }
  };

  // Convert to Instant Contract Request
  const handleConvertContract = async () => {
    if (!analysis) return;

    if (!currentUser) {
      haptics.warning();
      showToast({
        type: 'warning',
        title: isRTL ? 'تسجيل الدخول مطلوب' : 'Login Required',
        message: isRTL ? 'يرجى تسجيل الدخول أو إنشاء حساب لاعتماد عقد المشروع وتتبع مراحله في لوحة التحكم.' : 'Please login to convert this into an official contract and track roadmap.',
        actionLabel: isRTL ? 'تسجيل الدخول' : 'Login',
        onAction: () => router.push('/login'),
        duration: 6000,
      });
      return;
    }

    haptics.heavy();
    setConverting(true);

    try {
      const activePkg = analysis?.packages?.[selectedPackage] || analysis?.packages?.pro;
      const res = await api.convertAiContract({
        analysis,
        prompt: messages.map(m => `${m.role === 'user' ? 'العميل' : 'المستشار'}: ${m.text}`).join('\n'),
        selectedPackage,
        notes: `طلب تعاقد عبر المستشار الذكي (${analysis.engine || ''}): باقة ${selectedPackage.toUpperCase()} (${activePkg?.title || ''}) - ${analysis.domainName || ''}`,
      });

      setConverting(false);

      if (res.success) {
        haptics.success();
        if (res.user) {
          setCurrentUser(res.user);
          await AsyncStorage.setItem('userData', JSON.stringify(res.user));
        }
        setContractSuccessData(res);
        setShowSuccessModal(true);
      } else {
        haptics.error();
        showToast({
          type: 'error',
          title: isRTL ? 'خطأ' : 'Error',
          message: res.message || (isRTL ? 'فشل تحويل العقد، يرجى المحاولة لاحقاً.' : 'Failed to convert contract.'),
        });
      }
    } catch (e) {
      setConverting(false);
      haptics.error();
      showToast({
        type: 'error',
        title: isRTL ? 'خطأ' : 'Error',
        message: isRTL ? 'حدث خطأ أثناء إتمام الطلب.' : 'Unexpected error.',
      });
    }
  };

  // Package calculations
  const pkgData = analysis?.packages?.[selectedPackage] || analysis?.packages?.pro;
  const currentCostEGP = pkgData?.costEGP || analysis?.budgetBreakdown?.currencyEGP || 68000;
  const currentCostUSD = pkgData?.costUSD || analysis?.budgetBreakdown?.currencyUSD || 1450;
  const currentWeeks = pkgData?.weeks || analysis?.timelineWeeks || 8;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              if (router.canGoBack()) router.back();
              else router.push('/dashboard');
            }}
            style={[styles.backBtn, { backgroundColor: theme.btnBg }]}
          >
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={theme.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'مستشار Apex الذكي' : 'Apex AI Consultant'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: '#06B6D4', textAlign: isRTL ? 'right' : 'left' }]}>
              Interactive Architecture & 3 Tiers
            </Text>
          </View>
        </View>

        {/* Quick Actions & Live Status */}
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
          {/* WhatsApp Direct Action */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenWhatsApp}
            style={[styles.headerIconBtn, { borderColor: '#10B98140', backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}
            accessibilityLabel={isRTL ? 'تواصل عبر واتساب' : 'WhatsApp'}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#10B981" />
          </TouchableOpacity>

          {/* AI Engine Settings */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              haptics.selection();
              setShowConfigModal(true);
            }}
            style={[styles.headerIconBtn, { borderColor: theme.border, backgroundColor: theme.btnBg }]}
            accessibilityLabel={isRTL ? 'إعدادات محرك AI' : 'AI Engine Settings'}
          >
            <Ionicons name="settings-outline" size={17} color={theme.text} />
          </TouchableOpacity>

          {/* Live Badge */}
          <View style={styles.liveBadge}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.liveBadgeText}>Online</Text>
          </View>
        </View>
      </View>

      {/* Dual Mode Segmented Control */}
      <View style={[styles.modeToggleContainer, { borderBottomColor: theme.border }]}>
        <View style={[styles.modeToggleBar, { backgroundColor: theme.btnBg, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              haptics.selection();
              setActiveMode('chat');
            }}
            style={[
              styles.modeToggleBtn,
              activeMode === 'chat' && { backgroundColor: theme.primary },
              { flexDirection: isRTL ? 'row-reverse' : 'row' }
            ]}
          >
            <Ionicons name="chatbubbles-outline" size={16} color={activeMode === 'chat' ? '#0B132B' : theme.textMuted} />
            <Text style={[styles.modeToggleText, { color: activeMode === 'chat' ? '#0B132B' : theme.textMuted }]}>
              {isRTL ? 'المحادثة الاستشارية' : 'AI Consultant Chat'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (!analysis) {
                haptics.warning();
                showToast({
                  type: 'info',
                  title: isRTL ? 'تنبيه' : 'Notice',
                  message: isRTL ? 'يرجى استخراج خطة المشروع والـ 3 باقات من المحادثة أولاً.' : 'Please generate the blueprint from the chat first.',
                });
                return;
              }
              haptics.selection();
              setActiveMode('blueprint');
            }}
            style={[
              styles.modeToggleBtn,
              activeMode === 'blueprint' && { backgroundColor: theme.primary },
              !analysis && { opacity: 0.6 },
              { flexDirection: isRTL ? 'row-reverse' : 'row' }
            ]}
          >
            <Ionicons name="document-text-outline" size={16} color={activeMode === 'blueprint' ? '#0B132B' : theme.textMuted} />
            <Text style={[styles.modeToggleText, { color: activeMode === 'blueprint' ? '#0B132B' : theme.textMuted }]}>
              {isRTL ? 'دراسة الجدوى والـ 3 باقات' : 'Feasibility & 3 Tiers'}
            </Text>
            {analysis && (
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' }} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ========================================================= */}
      {/* MODE 1: INTERACTIVE CONSULTANT CHAT                      */}
      {/* ========================================================= */}
      {activeMode === 'chat' && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
        >
          <View style={{ flex: 1 }}>
            {/* Chat Messages Stream */}
            <ScrollView
              ref={chatScrollRef}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: responsive.paddingHorizontal,
                paddingVertical: 12,
                gap: 12,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onScrollBeginDrag={() => {
                if (isInputFocused) {
                  Keyboard.dismiss();
                  setIsInputFocused(false);
                }
              }}
              onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
            >
              {/* Collapsible Project Blueprint Banner */}
              <View style={[styles.chatCtaBanner, { backgroundColor: activeTheme === 'light' ? '#0F172A' : '#0B132B', borderColor: '#38BDF8', marginBottom: 2 }]}>
                {isBannerCollapsed ? (
                  // Compact Collapsed Bar (takes ~36px height only)
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <Ionicons name={analysis ? "document-text" : "flash"} size={16} color="#38BDF8" />
                      <Text style={{ color: '#38BDF8', fontSize: 12, fontWeight: 'bold' }} numberOfLines={1}>
                        {analysis ? (isRTL ? 'خطة المشروع والـ 3 باقات جاهزة' : 'Blueprint Ready') : (isRTL ? 'استخراج خطة المشروع والـ 3 باقات' : 'Generate Blueprint')}
                      </Text>
                    </View>
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        disabled={analyzing}
                        onPress={() => {
                          if (analysis) setActiveMode('blueprint');
                          else handleGenerateBlueprint();
                        }}
                        style={[styles.chatCtaBtn, { paddingVertical: 4, paddingHorizontal: 8 }]}
                      >
                        <Text style={[styles.chatCtaBtnText, { fontSize: 11 }]}>
                          {analysis ? (isRTL ? 'عرض' : 'View') : (isRTL ? 'استخراج' : 'Generate')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          haptics.selection();
                          setIsBannerCollapsed(false);
                        }}
                        style={{ padding: 4 }}
                      >
                        <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  // Full Expanded Card
                  <View>
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1, paddingRight: isRTL ? 0 : 8, paddingLeft: isRTL ? 8 : 0 }}>
                        <Text style={[styles.chatCtaTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                          {analysis ? (isRTL ? 'خطة المشروع والـ 3 باقات جاهزة' : 'Blueprint & 3 Tiers Ready') : (isRTL ? 'استخراج خطة المشروع والـ 3 باقات' : 'Generate Project Blueprint')}
                        </Text>
                        <Text style={[styles.chatCtaSub, { textAlign: isRTL ? 'right' : 'left' }]}>
                          {analysis ? (isRTL ? 'اضغط لعرض دراسة الجدوى وتحديد الباقة والتعاقد' : 'Tap to view feasibility and choose package') : (isRTL ? 'دراسة جدوى، تحليل منافسين، 3 باقات \u2066(MVP, Pro, Enterprise)\u2069' : 'Feasibility, competitors, 3 packages')}
                        </Text>
                      </View>

                      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          disabled={analyzing}
                          onPress={() => {
                            if (analysis) {
                              setActiveMode('blueprint');
                            } else {
                              handleGenerateBlueprint();
                            }
                          }}
                          style={styles.chatCtaBtn}
                        >
                          {analyzing ? (
                            <ActivityIndicator size="small" color="#0B132B" />
                          ) : (
                            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                              <Ionicons name={analysis ? "eye-outline" : "flash"} size={16} color="#0B132B" />
                              <Text style={styles.chatCtaBtnText}>
                                {analysis ? (isRTL ? 'عرض الخطة' : 'View') : (isRTL ? 'استخراج الآن' : 'Generate')}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            haptics.selection();
                            setIsBannerCollapsed(true);
                          }}
                          style={{ padding: 4 }}
                        >
                          <Ionicons name="chevron-up" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
              {/* Quick Concepts Carousel (When chat has only welcome) */}
              {messages.length <= 1 && (
                <View style={{ marginBottom: 6 }}>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Ionicons name="bulb-outline" size={15} color="#F59E0B" />
                    <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: 'bold' }}>
                      {isRTL ? 'أفكار مقترحة سريعة لبدء النقاش:' : 'Quick Ideas to Start:'}
                    </Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8 }}>
                      {QUICK_SUGGESTIONS.map((s) => (
                        <TouchableOpacity
                          key={s.id}
                          activeOpacity={0.8}
                          onPress={() => {
                            haptics.selection();
                            handleSendChatMessage(s.prompt);
                          }}
                          style={[
                            styles.chipBtn,
                            {
                              backgroundColor: theme.card,
                              borderColor: theme.border,
                              flexDirection: isRTL ? 'row-reverse' : 'row',
                            },
                          ]}
                        >
                          <Ionicons name={s.icon as any} size={15} color={theme.primary} />
                          <Text style={[styles.chipText, { color: theme.text }]}>{s.title}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Message Bubbles */}
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageRow,
                      {
                        justifyContent: isUser ? (isRTL ? 'flex-start' : 'flex-end') : (isRTL ? 'flex-end' : 'flex-start'),
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                      }
                    ]}
                  >
                    {!isUser && (
                      <View style={styles.aiAvatarCircle}>
                        <Ionicons name="hardware-chip-outline" size={18} color="#38BDF8" />
                      </View>
                    )}

                    <View style={{ maxWidth: '82%' }}>
                      <View
                        style={[
                          styles.messageBubble,
                          isUser
                            ? { backgroundColor: theme.primary, borderBottomRightRadius: isRTL ? 16 : 4, borderBottomLeftRadius: isRTL ? 4 : 16 }
                            : { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, borderBottomLeftRadius: isRTL ? 16 : 4, borderBottomRightRadius: isRTL ? 4 : 16 }
                        ]}
                      >
                        {!isUser && (
                          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#06B6D4' }}>
                              Apex Software Architect
                            </Text>
                            {msg.timestamp && (
                              <Text style={{ fontSize: 10, color: theme.textMuted }}>{msg.timestamp}</Text>
                            )}
                          </View>
                        )}

                        <Text
                          style={[
                            styles.messageText,
                            {
                              color: isUser ? '#0B132B' : theme.text,
                              textAlign: isRTL ? 'right' : 'left',
                              lineHeight: 22,
                            }
                          ]}
                        >
                          {msg.text}
                        </Text>

                        {isUser && msg.timestamp && (
                          <Text style={{ fontSize: 10, color: 'rgba(11,19,43,0.6)', alignSelf: isRTL ? 'flex-start' : 'flex-end', marginTop: 4 }}>
                            {msg.timestamp}
                          </Text>
                        )}
                      </View>

                      {/* Quick-Reply Suggestion Chips under AI message */}
                      {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                        <View style={{ marginTop: 8, flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 6 }}>
                          {msg.suggestions.map((sug, sIdx) => (
                            <TouchableOpacity
                              key={sIdx}
                              activeOpacity={0.8}
                              onPress={() => {
                                if (sug.includes('استخراج') || sug.includes('عرض خطة') || sug.includes('خطة المشروع')) {
                                  handleGenerateBlueprint();
                                } else {
                                  handleSendChatMessage(sug);
                                }
                              }}
                              style={[styles.suggestionChip, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
                            >
                              <Ionicons name="arrow-undo-outline" size={12} color={theme.primary} />
                              <Text style={[styles.suggestionChipText, { color: theme.text }]}>{sug}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {/* Specifications Ready Badge */}
                      {!isUser && msg.readyForSpec && (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={handleGenerateBlueprint}
                          style={[styles.readySpecCard, { backgroundColor: 'rgba(6, 182, 212, 0.12)', borderColor: '#06B6D4', marginTop: 10 }]}
                        >
                          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
                            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#06B6D4', alignItems: 'center', justifyContent: 'center' }}>
                              <Ionicons name="flash" size={20} color="#0B132B" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: '#06B6D4', fontWeight: 'bold', fontSize: 13, textAlign: isRTL ? 'right' : 'left' }}>
                                {isRTL ? 'المواصفات الفنية مكتملة الآن!' : 'Specifications Ready!'}
                              </Text>
                              <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: isRTL ? 'right' : 'left' }}>
                                {isRTL ? 'اضغط هنا لاستخراج دراسة الجدوى وتحديد الباقة والتعاقد' : 'Tap to generate feasibility & 3 packages'}
                              </Text>
                            </View>
                            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color="#06B6D4" />
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* Chat Loading Bubble */}
              {chatLoading && (
                <View style={[styles.messageRow, { justifyContent: isRTL ? 'flex-end' : 'flex-start', flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={styles.aiAvatarCircle}>
                    <Ionicons name="hardware-chip-outline" size={18} color="#38BDF8" />
                  </View>
                  <View style={[styles.messageBubble, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 16 }]}>
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#06B6D4" />
                      <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                        {isRTL ? 'مستشار Apex يقوم بدراسة الرد وصياغة الاستشارة...' : 'Apex Architect is thinking...'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Chat Input Bar */}
            <View style={[styles.chatInputBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                {/* Voice Input Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isTranscribing}
                  onPress={toggleVoiceRecording}
                  style={[
                    styles.chatMicBtn,
                    {
                      backgroundColor: isListening ? '#EF4444' : theme.btnBg,
                      borderColor: isListening ? '#EF4444' : theme.border,
                      opacity: isTranscribing ? 0.7 : 1,
                    }
                  ]}
                >
                  {isTranscribing ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <Animated.View style={{ transform: [{ scale: micPulseAnim }] }}>
                      <Ionicons
                        name={isListening ? 'stop' : 'mic-outline'}
                        size={20}
                        color={isListening ? '#FFF' : theme.primary}
                      />
                    </Animated.View>
                  )}
                </TouchableOpacity>

                {/* Text Input */}
                <TextInput
                  style={[
                    styles.chatTextInput,
                    {
                      backgroundColor: theme.btnBg,
                      borderColor: theme.border,
                      color: theme.text,
                      textAlign: isRTL ? 'right' : 'left',
                    }
                  ]}
                  placeholder={isRTL ? 'اكتب فكرتك أو إجابتك هنا...' : 'Type your idea or answer here...'}
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={2}
                  value={chatInput}
                  onChangeText={setChatInput}
                  onFocus={() => {
                    setIsInputFocused(true);
                    setTimeout(() => {
                      chatScrollRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
                  onBlur={() => {
                    setIsInputFocused(false);
                  }}
                />

                {/* Send Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={!chatInput.trim() || chatLoading}
                  onPress={() => handleSendChatMessage()}
                  style={[
                    styles.chatSendBtn,
                    {
                      backgroundColor: theme.primary,
                      opacity: (!chatInput.trim() || chatLoading) ? 0.5 : 1,
                    }
                  ]}
                >
                  <Ionicons
                    name="send"
                    size={17}
                    color="#0B132B"
                    style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ========================================================= */}
      {/* MODE 2: ARCHITECTURAL BLUEPRINT & 3-TIER PACKAGES         */}
      {/* ========================================================= */}
      {activeMode === 'blueprint' && analysis && (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              maxWidth: responsive.containerWidth as any,
              paddingHorizontal: responsive.paddingHorizontal,
              alignSelf: 'center',
              width: '100%',
              paddingBottom: 40,
            }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Overview Header Banner */}
          <View style={[styles.overviewCard, { backgroundColor: theme.card, borderColor: theme.primary }]}>
            <View style={[styles.overviewHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.domainBadge, { backgroundColor: `${theme.primary}20` }]}>
                <Text style={[styles.domainBadgeText, { color: theme.primary }]}>
                  {analysis.domainName || 'مشروع ذكي معتمد'}
                </Text>
              </View>

              {/* Engine Source Badge */}
              <View style={[styles.engineBadge, { backgroundColor: analysis.isLiveAI ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="ellipse" size={7} color={analysis.isLiveAI ? '#10B981' : '#38BDF8'} />
                  <Text style={{ fontSize: 11, color: analysis.isLiveAI ? '#10B981' : '#38BDF8', fontWeight: 'bold' }}>
                    {analysis.isLiveAI ? 'Gemini 3.6 Flash' : 'Apex Deep Engine'}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.projectName, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {analysis.projectName}
            </Text>

            {analysis.tagline && (
              <Text style={[styles.projectTagline, { color: theme.primary, textAlign: isRTL ? 'right' : 'left' }]}>
                "{analysis.tagline}"
              </Text>
            )}

            <Text style={[styles.projectSummary, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
              {analysis.summary}
            </Text>

            {/* Stat Highlights Bar */}
            <View style={[styles.statBar, { borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: theme.primary }]}>
                  {analysis.platforms?.length || 3}
                </Text>
                <Text style={[styles.statLbl, { color: theme.textMuted }]}>
                  {isRTL ? 'منصات متكاملة' : 'Platforms'}
                </Text>
              </View>

              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: '#10B981' }]}>
                  {currentWeeks}
                </Text>
                <Text style={[styles.statLbl, { color: theme.textMuted }]}>
                  {isRTL ? 'أسابيع للتسليم' : 'Weeks Timeline'}
                </Text>
              </View>

              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: '#06B6D4' }]}>
                  {analysis.feasibilityScore || 90}%
                </Text>
                <Text style={[styles.statLbl, { color: theme.textMuted }]}>
                  {isRTL ? 'مؤشر الجدوى' : 'Feasibility'}
                </Text>
              </View>
            </View>
          </View>

          {/* 1. FEASIBILITY & MARKET GAUGE CARD */}
          <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreText}>{analysis.feasibilityScore || 90}%</Text>
                </View>
                <View>
                  <Text style={[styles.sectionTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'مؤشر الجدوى والنجاح بالسوق' : 'Feasibility & Market Viability'}
                  </Text>
                  <Text style={{ color: '#10B981', fontSize: 12, fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? 'مؤشر مرتفع - فرص ربحية ونمو استثنائية' : 'High Viability - Excellent Market Demand'}
                  </Text>
                </View>
              </View>

              <View style={{ backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: '#10B981', fontSize: 11, fontWeight: 'bold' }}>
                  {isRTL ? 'معتمد' : 'Verified'}
                </Text>
              </View>
            </View>

            <Text style={[styles.paragraphText, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left', lineHeight: 22 }]}>
              {analysis.feasibilityAnalysis || (isRTL ? 'فكرة المشروع تملك طلباً حقيقياً وفرص نمو متسارعة في السوق، مع سهولة تميزها عند الاعتماد على معمارية سريعة ومستقرة.' : 'High market demand and rapid growth opportunities.')}
            </Text>
          </View>

          {/* 2. DIRECT COMPETITORS & APEX EDGE */}
          {analysis.competitors && analysis.competitors.length > 0 && (
            <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#38BDF8" />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {isRTL ? 'المنافسون المباشرون ونقاط تفوق Apex التنافسية' : 'Competitors & Apex Competitive Edge'}
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                {analysis.competitors.map((comp: any, idx: number) => (
                  <View key={idx} style={[styles.competitorRow, { borderColor: theme.border, backgroundColor: theme.btnBg }]}>
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13 }}>{comp.name}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 11 }}>{comp.marketShareOrType}</Text>
                    </View>
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 6 }}>
                      <Ionicons name="checkmark-circle" size={15} color="#10B981" style={{ marginTop: 2 }} />
                      <Text style={{ flex: 1, color: '#06B6D4', fontSize: 12, lineHeight: 18, textAlign: isRTL ? 'right' : 'left' }}>
                        <Text style={{ fontWeight: 'bold', color: theme.text }}>{isRTL ? 'تفوق Apex: ' : 'Apex Edge: '}</Text>
                        {comp.ourEdge}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 3. INTERACTIVE 3-TIER INVESTMENT PACKAGES SWITCHER */}
          <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="layers-outline" size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {isRTL ? 'اختر باقة الاستثمار المناسبة لمشروعك' : 'Choose Your Investment Tier'}
                </Text>
              </View>

              {/* Currency Selector */}
              <View style={{ flexDirection: 'row', backgroundColor: theme.btnBg, borderRadius: 8, padding: 2 }}>
                <TouchableOpacity
                  onPress={() => setCurrency('EGP')}
                  style={[styles.currBtn, currency === 'EGP' && { backgroundColor: theme.primary, borderRadius: 6 }]}
                >
                  <Text style={[styles.currBtnText, { color: currency === 'EGP' ? '#0B132B' : theme.textMuted }]}>EGP</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCurrency('USD')}
                  style={[styles.currBtn, currency === 'USD' && { backgroundColor: theme.primary, borderRadius: 6 }]}
                >
                  <Text style={[styles.currBtnText, { color: currency === 'USD' ? '#0B132B' : theme.textMuted }]}>USD</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3 Package Selector Tabs */}
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginBottom: 14 }}>
              {(['mvp', 'pro', 'enterprise'] as const).map((tierKey) => {
                const pData = analysis.packages?.[tierKey] || (tierKey === 'mvp' ? { title: 'MVP', costEGP: 34000, costUSD: 750, weeks: 5 } : tierKey === 'enterprise' ? { title: 'Enterprise', costEGP: 115000, costUSD: 2450, weeks: 14 } : { title: 'Pro', costEGP: 68000, costUSD: 1450, weeks: 10 });
                const isSelected = selectedPackage === tierKey;
                const isPro = tierKey === 'pro';

                return (
                  <TouchableOpacity
                    key={tierKey}
                    activeOpacity={0.85}
                    onPress={() => {
                      haptics.selection();
                      setSelectedPackage(tierKey);
                    }}
                    style={[
                      styles.pkgTabCard,
                      {
                        borderColor: isSelected ? theme.primary : theme.border,
                        backgroundColor: isSelected ? `${theme.primary}15` : theme.btnBg,
                      }
                    ]}
                  >
                    {isPro && (
                      <View style={styles.proBadge}>
                        <Text style={styles.proBadgeText}>{isRTL ? 'موصى به' : 'Popular'}</Text>
                      </View>
                    )}
                    <Text style={[styles.pkgTabTitle, { color: isSelected ? theme.primary : theme.text }]}>
                      {tierKey === 'mvp' ? 'MVP البداية' : tierKey === 'pro' ? 'Pro النمو' : 'Enterprise'}
                    </Text>
                    <Text style={[styles.pkgTabPrice, { color: isSelected ? theme.text : theme.textMuted }]}>
                      {currency === 'EGP' ? `${(pData.costEGP || 68000).toLocaleString()} ج.م` : `$${(pData.costUSD || 1450).toLocaleString()}`}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                      {pData.weeks || 8} {isRTL ? 'أسابيع' : 'weeks'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Active Selected Package Box */}
            {pkgData && (
              <View style={[styles.activePkgBox, { backgroundColor: theme.btnBg, borderColor: theme.border }]}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 15 }}>
                    {pkgData.title || (selectedPackage === 'mvp' ? 'باقة إطلاق النموذج الأولي \u2066(MVP)\u2069' : selectedPackage === 'enterprise' ? 'باقة المؤسسات والأنظمة الكبرى' : 'باقة المنظومة المتكاملة \u2066(Pro)\u2069')}
                  </Text>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="time-outline" size={14} color={theme.textMuted} />
                    <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                      {pkgData.weeks || 8} {isRTL ? 'أسابيع للتسليم' : 'weeks'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.pkgDesc, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left', marginBottom: 12 }]}>
                  {pkgData.desc || ''}
                </Text>

                <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left', marginBottom: 8 }}>
                  {isRTL ? 'المخرجات المشمولة في هذه الباقة:' : 'Included Deliverables:'}
                </Text>

                <View style={{ gap: 6 }}>
                  {(pkgData.keyDeliverables || [
                    'تطبيقات الموبايل الموحدة (iOS & Android)',
                    'لوحة تحكم إدارية سحابية',
                    'بوابات الدفع الإلكتروني',
                    'خوادم سحابية ونسخ احتياطي'
                  ]).map((deliv: string, dIdx: number) => (
                    <View key={dIdx} style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="checkmark-done" size={15} color="#10B981" />
                      <Text style={{ color: theme.text, fontSize: 12, flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                        {deliv}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Deep Architectural Tab Navigation */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 14 }}
            contentContainerStyle={{ gap: 8 }}
          >
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8 }}>
              {[
                { id: 'strategy', title: isRTL ? 'الاستراتيجية' : 'Strategy', icon: 'compass-outline' },
                { id: 'platforms', title: isRTL ? 'المنصات والشاشات' : 'Platforms & Screens', icon: 'grid-outline' },
                { id: 'architecture', title: isRTL ? 'المعمارية والبيانات' : 'Architecture & DB', icon: 'server-outline' },
                { id: 'tech', title: isRTL ? 'التقنيات' : 'Tech Stack', icon: 'code-slash-outline' },
                { id: 'budget', title: isRTL ? 'التكلفة والميزانية' : 'Budget Breakdown', icon: 'wallet-outline' },
                { id: 'roadmap', title: isRTL ? 'المراحل والدفع' : 'Roadmap & Payment', icon: 'calendar-outline' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    haptics.selection();
                    setActiveTab(tab.id as any);
                  }}
                  style={[
                    styles.tabNavBtn,
                    {
                      backgroundColor: activeTab === tab.id ? theme.primary : theme.card,
                      borderColor: activeTab === tab.id ? theme.primary : theme.border,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                    },
                  ]}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={15}
                    color={activeTab === tab.id ? '#0B132B' : theme.textMuted}
                  />
                  <Text
                    style={[
                      styles.tabNavText,
                      { color: activeTab === tab.id ? '#0B132B' : theme.text },
                    ]}
                  >
                    {tab.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* TAB 1: STRATEGY */}
          {activeTab === 'strategy' && (
            <View style={{ gap: 12 }}>
              {analysis.strategicAnalysis?.valueProposition && (
                <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Ionicons name="trophy-outline" size={18} color={theme.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      {isRTL ? 'القيمة التنافسية المضافة (Value Proposition)' : 'Core Value Proposition'}
                    </Text>
                  </View>
                  <Text style={[styles.paragraphText, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                    {analysis.strategicAnalysis.valueProposition}
                  </Text>
                </View>
              )}

              {analysis.strategicAnalysis?.businessModel && (
                <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Ionicons name="cash-outline" size={18} color="#10B981" />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      {isRTL ? 'نموذج تحقيق الأرباح (Monetization & Business Model)' : 'Business Model & Monetization'}
                    </Text>
                  </View>
                  <Text style={[styles.paragraphText, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                    {analysis.strategicAnalysis.businessModel}
                  </Text>
                </View>
              )}

              {analysis.strategicAnalysis?.keyChallenges && analysis.strategicAnalysis.keyChallenges.length > 0 && (
                <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Ionicons name="warning-outline" size={18} color="#F59E0B" />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      {isRTL ? 'التحديات التشغيلية والتقنية والحلول المقترحة' : 'Challenges & Mitigations'}
                    </Text>
                  </View>
                  <View style={{ gap: 8 }}>
                    {analysis.strategicAnalysis.keyChallenges.map((ch: string, idx: number) => (
                      <View key={idx} style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 8 }}>
                        <Ionicons name="alert-circle-outline" size={16} color="#F59E0B" style={{ marginTop: 2 }} />
                        <Text style={{ flex: 1, color: theme.textMuted, fontSize: 13, lineHeight: 20, textAlign: isRTL ? 'right' : 'left' }}>
                          {ch}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {analysis.strategicAnalysis?.mvpStrategy && (
                <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Ionicons name="rocket-outline" size={18} color="#38BDF8" />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      {isRTL ? 'خطة إطلاق النسخة الأولية \u2066(MVP Go-To-Market)\u2069' : 'MVP Strategy'}
                    </Text>
                  </View>
                  <Text style={[styles.paragraphText, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                    {analysis.strategicAnalysis.mvpStrategy}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 2: PLATFORMS & SCREENS */}
          {activeTab === 'platforms' && (
            <View style={{ gap: 14 }}>
              {analysis.platforms?.map((plat: any, pIdx: number) => (
                <View key={pIdx} style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <View style={styles.platformIconCircle}>
                      <Ionicons name={(plat.icon as any) || 'phone-portrait-outline'} size={20} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sectionTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                        {plat.name}
                      </Text>
                      {plat.role && (
                        <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: isRTL ? 'right' : 'left' }}>
                          {plat.role}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Key Features */}
                  {plat.keyFeatures && (
                    <View style={{ marginBottom: 14 }}>
                      <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold', marginBottom: 8, textAlign: isRTL ? 'right' : 'left' }}>
                        {isRTL ? 'الميزات الأساسية للمنصة:' : 'Key Platform Features:'}
                      </Text>
                      <View style={{ gap: 6 }}>
                        {plat.keyFeatures.map((f: string, fIdx: number) => (
                          <View key={fIdx} style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="checkmark-circle" size={15} color={theme.primary} />
                            <Text style={{ color: theme.textMuted, fontSize: 12, flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                              {f}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Screens Breakdown */}
                  {plat.screens && plat.screens.length > 0 && (
                    <View>
                      <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold', marginBottom: 8, textAlign: isRTL ? 'right' : 'left' }}>
                        {isRTL ? 'حصر الشاشات ورحلة المستخدم:' : 'Screens & User Journey:'}
                      </Text>
                      <View style={{ gap: 8 }}>
                        {plat.screens.map((sc: any, sIdx: number) => (
                          <View key={sIdx} style={[styles.screenItem, { backgroundColor: theme.btnBg, borderColor: theme.border }]}>
                            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <Ionicons name="phone-portrait-outline" size={14} color="#06B6D4" />
                              <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13 }}>
                                {sc.name}
                              </Text>
                            </View>
                            <Text style={{ color: theme.textMuted, fontSize: 12, lineHeight: 18, textAlign: isRTL ? 'right' : 'left' }}>
                              {sc.desc}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* TAB 3: ARCHITECTURE & DATABASE */}
          {activeTab === 'architecture' && (
            <View style={{ gap: 14 }}>
              {analysis.systemArchitecture?.architectureType && (
                <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Ionicons name="git-network-outline" size={18} color="#38BDF8" />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      {isRTL ? 'النمط المعماري للنظام' : 'System Architecture Pattern'}
                    </Text>
                  </View>
                  <Text style={[styles.paragraphText, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                    {analysis.systemArchitecture.architectureType}
                  </Text>
                </View>
              )}

              {/* Microservices */}
              {analysis.systemArchitecture?.microservices && (
                <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Ionicons name="cube-outline" size={18} color={theme.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      {isRTL ? 'الخدمات المصغرة ووحدات النظام (Microservices)' : 'Microservices & Clusters'}
                    </Text>
                  </View>
                  <View style={{ gap: 8 }}>
                    {analysis.systemArchitecture.microservices.map((ms: string, mIdx: number) => (
                      <View key={mIdx} style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="checkbox-outline" size={16} color={theme.primary} />
                        <Text style={{ color: theme.textMuted, fontSize: 13, flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                          {ms}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Database Schema */}
              {analysis.systemArchitecture?.databaseSchema && (
                <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Ionicons name="server-outline" size={18} color="#10B981" />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      {isRTL ? 'مخطط جداول قاعدة البيانات (Database Schema)' : 'Database Tables & Relationships'}
                    </Text>
                  </View>
                  <View style={{ gap: 10 }}>
                    {analysis.systemArchitecture.databaseSchema.map((tbl: any, tIdx: number) => (
                      <View key={tIdx} style={[styles.dbTableBox, { backgroundColor: theme.btnBg, borderColor: theme.border }]}>
                        <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 13, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                          Table: {tbl.table}
                        </Text>
                        <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 6, textAlign: isRTL ? 'right' : 'left' }}>
                          {tbl.description}
                        </Text>
                        {tbl.fields && (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            {tbl.fields.map((f: string, fIdx: number) => (
                              <View key={fIdx} style={[styles.fieldBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <Text style={{ color: theme.text, fontSize: 10 }}>{f}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* TAB 4: TECH STACK */}
          {activeTab === 'tech' && analysis.techStack && (
            <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Ionicons name="code-slash-outline" size={18} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {isRTL ? 'الترسانة التقنية المعتمدة للمشروع' : 'Modern Production Tech Stack'}
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                {[
                  { label: isRTL ? 'تطبيقات الموبايل' : 'Mobile Apps', val: analysis.techStack.mobile, icon: 'phone-portrait-outline' },
                  { label: isRTL ? 'لوحة تحكم الويب' : 'Web Admin', val: analysis.techStack.web, icon: 'desktop-outline' },
                  { label: isRTL ? 'خوادم الباك إند' : 'Backend Engine', val: analysis.techStack.backend, icon: 'server-outline' },
                  { label: isRTL ? 'المزامنة اللحظية' : 'Realtime Sync', val: analysis.techStack.realtime, icon: 'flash-outline' },
                  { label: isRTL ? 'قواعد البيانات' : 'Database', val: analysis.techStack.database, icon: 'file-tray-stacked-outline' },
                  { label: isRTL ? 'الخرائط والملاحة' : 'Maps & Geolocation', val: analysis.techStack.maps, icon: 'map-outline' },
                  { label: isRTL ? 'بوابات الدفع' : 'Payment Gateways', val: analysis.techStack.payments, icon: 'card-outline' },
                  { label: isRTL ? 'السيرفرات والـ DevOps' : 'DevOps & Cloud', val: analysis.techStack.devops, icon: 'cloud-outline' },
                ].filter(item => !!item.val).map((st, sIdx) => (
                  <View key={sIdx} style={[styles.techRow, { backgroundColor: theme.btnBg, borderColor: theme.border }]}>
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name={st.icon as any} size={16} color={theme.primary} />
                      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13 }}>{st.label}</Text>
                    </View>
                    <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: isRTL ? 'right' : 'left', marginTop: 4 }}>
                      {st.val}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* TAB 5: BUDGET & COST */}
          {activeTab === 'budget' && (
            <View style={{ gap: 14 }}>
              <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    {isRTL ? `الميزانية المفككة بالبنود (${pkgData?.title || 'الباقة المختارة'})` : 'Detailed Budget Breakdown'}
                  </Text>
                  <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 16 }}>
                    {currency === 'EGP' ? `${currentCostEGP.toLocaleString()} ج.م` : `$${currentCostUSD.toLocaleString()}`}
                  </Text>
                </View>

                {analysis.budgetBreakdown?.items && (
                  <View style={{ gap: 8 }}>
                    {analysis.budgetBreakdown.items.map((item: any, iIdx: number) => (
                      <View key={iIdx} style={[styles.budgetItemRow, { backgroundColor: theme.btnBg, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13, textAlign: isRTL ? 'right' : 'left' }}>
                            {item.category}
                          </Text>
                          {item.desc && (
                            <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2, textAlign: isRTL ? 'right' : 'left' }}>
                              {item.desc}
                            </Text>
                          )}
                        </View>
                        <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 13 }}>
                          {currency === 'EGP' ? `${(item.costEGP || 0).toLocaleString()} ج.م` : `$${(item.costUSD || 0).toLocaleString()}`}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* TAB 6: ROADMAP & PAYMENT */}
          {activeTab === 'roadmap' && (
            <View style={{ gap: 14 }}>
              {/* Milestones */}
              {analysis.milestones && (
                <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      {isRTL ? `مراحل التنفيذ والجدول الزمني (${currentWeeks} أسابيع)` : 'Implementation Milestones'}
                    </Text>
                  </View>

                  <View style={{ gap: 12 }}>
                    {analysis.milestones.map((m: any, mIdx: number) => (
                      <View key={mIdx} style={[styles.milestoneCard, { backgroundColor: theme.btnBg, borderColor: theme.border }]}>
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 13, flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                            {m.title}
                          </Text>
                          <View style={[styles.durationBadge, { backgroundColor: `${theme.primary}20` }]}>
                            <Text style={{ color: theme.primary, fontSize: 11, fontWeight: 'bold' }}>
                              {m.durationWeeks} {isRTL ? 'أسابيع' : 'w'}
                            </Text>
                          </View>
                        </View>

                        {m.sprintTasks && (
                          <View style={{ gap: 4, marginTop: 4 }}>
                            {m.sprintTasks.map((task: string, tIdx: number) => (
                              <View key={tIdx} style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="arrow-back-outline" size={11} color={theme.textMuted} />
                                <Text style={{ color: theme.textMuted, fontSize: 12, flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                                  {task}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Payment Plan */}
              {analysis.paymentPlan && (
                <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Ionicons name="wallet-outline" size={18} color="#10B981" />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      {isRTL ? 'خطة الدفعات المالية المرنة (40% / 30% / 30%)' : 'Milestone Payment Plan'}
                    </Text>
                  </View>

                  <View style={{ gap: 8 }}>
                    {analysis.paymentPlan.map((p: any, pIdx: number) => (
                      <View key={pIdx} style={[styles.paymentPlanItem, { backgroundColor: theme.btnBg, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.paymentPercentBadge, { backgroundColor: `${theme.primary}20` }]}>
                          <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>
                            {p.milestone}
                          </Text>
                        </View>
                        <Text style={[styles.paymentDesc, { color: theme.textMuted, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                          {p.desc}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Bottom Fixed Action Card: Convert Contract */}
          <View style={[styles.heroActionCard, { backgroundColor: activeTheme === 'light' ? '#0F172A' : '#0B132B', marginTop: 14 }]}>
            <Ionicons name="shield-checkmark" size={32} color="#38BDF8" style={{ marginBottom: 6 }} />
            <Text style={styles.heroActionTitle}>
              {isRTL ? `طلب التعاقد الفوري - ${pkgData?.title || 'باقة المنظومة'}` : `Instant Contract - ${selectedPackage.toUpperCase()}`}
            </Text>
            <Text style={styles.heroActionSub}>
              {isRTL 
                ? `تكلفة الاستثمار: ${currency === 'EGP' ? `${currentCostEGP.toLocaleString()} جنيه مصري` : `$${currentCostUSD.toLocaleString()}`} | مدة التنفيذ: ${currentWeeks} أسابيع\nيتم تسجيل العقد فورياً في لوحة تحكمك وبدء مرحلة التصميم مع فريق مهندسي Apex.`
                : `Investment: ${currency === 'EGP' ? `${currentCostEGP.toLocaleString()} EGP` : `$${currentCostUSD.toLocaleString()}`} | Duration: ${currentWeeks} weeks\nInstantly registered to your dashboard to begin design sprint.`}
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={converting}
              onPress={handleConvertContract}
              style={styles.convertHeroBtn}
            >
              {converting ? (
                <ActivityIndicator size="small" color="#0B132B" />
              ) : (
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="flash" size={18} color="#0B132B" />
                  <Text style={styles.convertHeroBtnText}>
                    {isRTL ? `اعتماد العقد وبدء المشروع (${currency === 'EGP' ? `${currentCostEGP.toLocaleString()} ج.م` : `$${currentCostUSD.toLocaleString()}`})` : 'Confirm Contract & Start Project'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* AI Engine Configuration Modal */}
      <Modal
        visible={showConfigModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.configModalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 14 }}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="settings-outline" size={20} color={theme.primary} />
                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>
                  {isRTL ? 'إعدادات محرك الذكاء الاصطناعي' : 'AI Engine Settings'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowConfigModal(false)}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: theme.textMuted, fontSize: 12, lineHeight: 18, textAlign: isRTL ? 'right' : 'left', marginBottom: 14 }}>
              {isRTL
                ? 'خادم Apex مدمج به مفتاح رسمي مجاني 100% لـ Google Gemini 3.6 Flash. يمكنك استخدامه مباشرة أو إضافة مفتاحك الخاص.'
                : 'Apex server comes with built-in free Google Gemini 3.6 Flash. You can also provide a custom API key.'}
            </Text>

            {/* Provider Switcher */}
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, width: '100%', marginBottom: 14 }}>
              {[
                { id: 'gemini', title: 'Google Gemini 3.6' },
                { id: 'openai', title: 'OpenAI GPT-4o' },
                { id: 'deep_engine', title: isRTL ? 'محرك Apex' : 'Apex Engine' },
              ].map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setAiProvider(p.id as any)}
                  style={[
                    styles.providerBtn,
                    aiProvider === p.id && { backgroundColor: `${theme.primary}20`, borderColor: theme.primary }
                  ]}
                >
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: aiProvider === p.id ? theme.primary : theme.textMuted }}>
                    {p.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* API Key Input */}
            <View style={{ width: '100%', marginBottom: 16 }}>
              <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold', marginBottom: 6, textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL ? 'مفتاح الـ API (اختياري - مدمج بالسيرفر تلقائياً):' : 'Custom API Key (Optional):'}
              </Text>
              <TextInput
                style={[styles.apiKeyInput, { backgroundColor: theme.btnBg, borderColor: theme.border, color: theme.text, textAlign: 'left' }]}
                placeholder={configuredKeyMasked ? `Current: ${configuredKeyMasked}` : 'AIzaSy...'}
                placeholderTextColor={theme.textMuted}
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={savingConfig}
              onPress={handleSaveAiConfig}
              style={[styles.saveConfigBtn, { backgroundColor: theme.primary }]}
            >
              {savingConfig ? (
                <ActivityIndicator size="small" color="#0B132B" />
              ) : (
                <Text style={styles.saveConfigBtnText}>
                  {isRTL ? 'حفظ وتفعيل' : 'Save & Activate'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Contract Request Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.successModalCard, { backgroundColor: theme.card, borderColor: '#10B981' }]}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-done" size={38} color="#10B981" />
            </View>

            <Text style={[styles.successModalTitle, { color: theme.text }]}>
              {isRTL ? 'تم تأكيد طلب التعاقد بنجاح!' : 'Contract Request Confirmed!'}
            </Text>

            <Text style={[styles.successModalBody, { color: theme.textMuted }]}>
              {isRTL
                ? `تم تسجيل مشروعك (${analysis?.projectName || 'مشروع Apex الذكي'}) بباقة (${pkgData?.title || 'Pro'}) بنجاح.\nتم إرسال تفاصيل العقد لبريدك الإلكتروني وتحديث مرحلة المشروع في لوحة التحكم.`
                : 'Your project contract has been recorded successfully. Confirmation details sent to your email.'}
            </Text>

            {contractSuccessData?.quoteId && (
              <View style={[styles.successInfoBox, { backgroundColor: theme.btnBg, borderColor: theme.border }]}>
                <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>
                  {isRTL ? `رقم المعاملة الرسمية: #${contractSuccessData.quoteId}` : `Reference ID: #${contractSuccessData.quoteId}`}
                </Text>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setShowSuccessModal(false);
                router.push('/dashboard');
              }}
              style={[styles.modalActionBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.modalActionBtnText}>
                {isRTL ? 'الانتقال إلى لوحة التحكم لمتابعة المشروع' : 'Go to Dashboard'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  settingsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  settingsChipText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modeToggleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  modeToggleBar: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatCtaBanner: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  chatCtaTitle: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  chatCtaSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  chatCtaBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatCtaBtnText: {
    color: '#0B132B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageRow: {
    alignItems: 'flex-start',
    gap: 8,
  },
  aiAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageText: {
    fontSize: 14,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionChipText: {
    fontSize: 11,
  },
  readySpecCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 10,
  },
  chatInputBar: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chatMicBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTextInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    maxHeight: 70,
  },
  chatSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: 14,
  },
  overviewCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  overviewHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  domainBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  domainBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  engineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  projectName: {
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 4,
  },
  projectTagline: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  projectSummary: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  statBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLbl: {
    fontSize: 10,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  cardSection: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  paragraphText: {
    fontSize: 13,
    lineHeight: 21,
  },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    color: '#10B981',
    fontWeight: '900',
    fontSize: 14,
  },
  competitorRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  currBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  currBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  pkgTabCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    position: 'relative',
  },
  proBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proBadgeText: {
    color: '#0B132B',
    fontSize: 9,
    fontWeight: 'bold',
  },
  pkgTabTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  pkgTabPrice: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },
  activePkgBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  pkgDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  tabNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  tabNavText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  platformIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenItem: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  dbTableBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  fieldBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  techRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  budgetItemRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    gap: 10,
  },
  milestoneCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paymentPlanItem: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    gap: 10,
  },
  paymentPercentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  heroActionCard: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
  },
  heroActionTitle: {
    color: '#38BDF8',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  heroActionSub: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  convertHeroBtn: {
    width: '100%',
    backgroundColor: '#38BDF8',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  convertHeroBtnText: {
    color: '#0B132B',
    fontSize: 14,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  configModalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  providerBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
    alignItems: 'center',
  },
  apiKeyInput: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    fontSize: 13,
  },
  saveConfigBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveConfigBtnText: {
    color: '#0B132B',
    fontSize: 14,
    fontWeight: '900',
  },
  successModalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  successModalBody: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  successInfoBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
  },
  modalActionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionBtnText: {
    color: '#0B132B',
    fontSize: 14,
    fontWeight: '900',
  },
});
