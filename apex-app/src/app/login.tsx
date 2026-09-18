import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Alert, Modal } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSettings } from '../context/SettingsContext';
import { api } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { FloatingInput } from '../components/FloatingInput';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveSecureToken, getSecureToken } from '../utils/secureTokenStorage';
import * as WebBrowser from 'expo-web-browser';
import { haptics } from '../utils/haptics';
import { biometrics } from '../utils/biometrics';
import { notifications } from '../utils/notifications';
import { useResponsive } from '../hooks/useResponsive';

export default function LoginScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const { theme, t, isRTL, setCurrentUser } = useSettings();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Biometrics & Native State
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState('Fingerprint');
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [boundBiometricUser, setBoundBiometricUser] = useState<any>(null);

  // Google Modal State for Mobile & Non-localhost
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  const checkBiometricsAndSession = useCallback(async () => {
    const bio = await biometrics.isAvailable();
    if (bio.available && bio.enrolled) {
      setBiometricsAvailable(true);
      if (bio.biometryType) setBiometryType(bio.biometryType);
    }
    const token = await getSecureToken();
    const user = await AsyncStorage.getItem('userData');
    if (token && user) {
      setHasSavedSession(true);
    }
    const isConfigured = await biometrics.isBiometricsConfigured();
    if (isConfigured) {
      const bound = await biometrics.getBiometricUser();
      setBoundBiometricUser(bound?.user || null);
    } else {
      setBoundBiometricUser(null);
    }
  }, []);

  useEffect(() => {
    checkBiometricsAndSession();
  }, [checkBiometricsAndSession]);

  useFocusEffect(
    useCallback(() => {
      checkBiometricsAndSession();
    }, [checkBiometricsAndSession])
  );

  const handleBiometricLogin = async () => {
    await haptics.light();

    // 🛡️ Verify that biometrics have been intentionally configured and bound in Settings
    const isConfigured = await biometrics.isBiometricsConfigured();
    if (!isConfigured) {
      await haptics.warning();
      Alert.alert(
        isRTL ? 'المستشعرات الحيوية غير مفعلة' : 'Biometrics Not Active',
        isRTL 
          ? 'يرجى تسجيل الدخول أولاً بحسابك، ثم تفعيل خيار (الدخول بالمستشعرات الحيوية) من صفحة الإعدادات لربط بصمتك بحسابك بأمان.'
          : 'Please sign in with your email & password first, then activate Biometric Login in Settings to link your fingerprint to your account.'
      );
      return;
    }

    const bound = await biometrics.getBiometricUser();
    if (!bound || !bound.user || !bound.token) {
      await haptics.warning();
      Alert.alert(
        isRTL ? 'تنبيه' : 'Notice',
        isRTL ? 'يرجى تسجيل الدخول أولاً وإعادة تفعيل خيار البصمة من الإعدادات.' : 'Please sign in first and re-enable biometrics in Settings.'
      );
      return;
    }

    // On Web: Biometrics are a mobile hardware feature; provide an educational alert + 1-click login with bound user
    if (Platform.OS === 'web') {
      await haptics.success();
      setCurrentUser(bound.user);
      await saveSecureToken(bound.token);
      await AsyncStorage.setItem('userData', JSON.stringify(bound.user));
      Alert.alert(
        isRTL ? 'المستشعرات الحيوية (Web Preview)' : 'Biometric Web Preview',
        isRTL 
          ? `تم الدخول بنجاح للحساب المربوط بالبصمة: ${bound.user.fullName}!\n\nملاحظة: حساسات البصمة والوجه المادية تعمل مباشرة عبر تطبيق الموبايل (Android / iOS).`
          : `Logged in via bound biometric session as ${bound.user.fullName}!`
      );
      if (bound.user.role === 'admin' || bound.user.email === 'abdallahelshamy82@gmail.com') router.push('/admin');
      else router.push('/dashboard');
      return;
    }

    const auth = await biometrics.authenticate(
      isRTL ? `سجّل الدخول بالمستشعرات الحيوية لحساب: ${bound.user.fullName}` : `Log in with biometrics to ${bound.user.fullName}`
    );

    if (auth.success) {
      await haptics.success();
      setCurrentUser(bound.user);
      await saveSecureToken(bound.token);
      await AsyncStorage.setItem('userData', JSON.stringify(bound.user));
      notifications.sendLocalNotification(
        isRTL ? 'مرحباً بك مجدداً' : 'Welcome Back',
        isRTL ? `تم تسجيل الدخول بالمستشعرات الحيوية بنجاح يا ${bound.user.fullName}` : `Logged in with biometrics as ${bound.user.fullName}`
      );
      notifications.registerForPushNotifications().catch(() => {});
      if (bound.user.role === 'admin' || bound.user.email === 'abdallahelshamy82@gmail.com') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } else {
      await haptics.error();
      if (auth.error && auth.error !== 'user_cancel') {
        Alert.alert(
          isRTL ? 'تنبيه المستشعرات الحيوية' : 'Biometric Notice',
          isRTL ? 'لم يتم التعرف على البصمة أو تم إلغاء المصادقة.' : 'Biometrics not recognized or canceled.'
        );
      }
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      await haptics.warning();
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    await haptics.medium();
    const cleanEmail = email.trim().toLowerCase();

    // 🛡️ Web restriction: Prevent client sign up or client login from Web
    if (Platform.OS === 'web') {
      if (!isLogin) {
        await haptics.warning();
        Alert.alert(
          isRTL ? 'التسجيل متاح على تطبيق الهاتف فقط' : 'Mobile Only',
          isRTL 
            ? 'إنشاء حسابات العملاء الجديدة متاح حصراً عبر تطبيق الموبايل لضمان هوية العميل وأمان العروض.' 
            : 'Client registration is exclusively available via the mobile app.'
        );
        return;
      }
      if (cleanEmail !== 'abdallahelshamy82@gmail.com') {
        await haptics.error();
        Alert.alert(
          isRTL ? 'الوصول مقتصر على الإدارة' : 'Admin Portal Only',
          isRTL 
            ? 'منصة الويب مخصصة للوحة تحكم الإدارة فقط. لمتابعة مشروعك وفواتيرك كعميل، يرجى استخدام تطبيق الهاتف (Android / iOS).'
            : 'Web access is restricted to the Admin Dashboard. Clients must use the mobile app.'
        );
        return;
      }
    }

    setLoading(true);
    let res;

    if (isLogin) {
      res = await api.login(cleanEmail, password);
    } else {
      res = await api.register(fullName, cleanEmail, company, password);
    }

    setLoading(false);

    if (res.success) {
      await haptics.success();
      // Save user and token securely
      setCurrentUser(res.user);
      await saveSecureToken(res.token);
      await AsyncStorage.setItem('userData', JSON.stringify(res.user));
      
      // Register push token
      notifications.registerForPushNotifications().catch(() => {});

      // Check for pending project estimate
      const pendingEstimateStr = await AsyncStorage.getItem('pendingEstimate');
      if (pendingEstimateStr) {
        try {
          const pendingDetails = JSON.parse(pendingEstimateStr);
          await api.submitQuote(pendingDetails);
          await AsyncStorage.removeItem('pendingEstimate');
        } catch (e) {
          console.error('Failed to submit pending estimate:', e);
        }
      }

      // Role-based routing
      if (res.user.role === 'admin' || cleanEmail === 'abdallahelshamy82@gmail.com') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } else {
      await haptics.error();
      Alert.alert('Error', res.message || 'Authentication failed');
    }
  };

  const GOOGLE_CLIENT_ID = '596632301040-cpotn60a58rmi31ctcltiqkltutcqg4e.apps.googleusercontent.com';

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const scriptId = 'google-gsi-client';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }
  }, []);

  const [googleLoading, setGoogleLoading] = useState(false);

  const executeGoogleLogin = async (selectedEmail: string, selectedName?: string, selectedPic?: string) => {
    try {
      setGoogleLoading(true);
      setShowGoogleModal(false);
      const cleanEmail = selectedEmail.trim().toLowerCase();

      // 🛡️ Web restriction: Only admin allowed via web Google sign-in
      if (Platform.OS === 'web' && cleanEmail !== 'abdallahelshamy82@gmail.com') {
        setGoogleLoading(false);
        await haptics.error();
        Alert.alert(
          isRTL ? 'الوصول مقتصر على الإدارة' : 'Admin Portal Only',
          isRTL 
            ? 'منصة الويب مخصصة للوحة تحكم الإدارة فقط. لمتابعة حساب العميل، يرجى استخدام تطبيق الهاتف.'
            : 'Web is reserved for Admin Dashboard. Please use the mobile app for client accounts.'
        );
        return;
      }

      const res = await api.googleLogin({
        email: cleanEmail,
        fullName: selectedName || cleanEmail.split('@')[0],
        googleId: 'google_' + Date.now(),
        picture: selectedPic
      });
      setGoogleLoading(false);

      if (res.success) {
        await haptics.success();
        setCurrentUser(res.user);
        await saveSecureToken(res.token);
        await AsyncStorage.setItem('userData', JSON.stringify(res.user));
        notifications.sendLocalNotification(
          isRTL ? 'مرحباً بك' : 'Welcome',
          isRTL ? `تم تسجيل الدخول بنجاح عبر Google: ${res.user.fullName}` : `Logged in via Google as ${res.user.fullName}`
        );
        notifications.registerForPushNotifications().catch(() => {});

        if (res.user.role === 'admin' || cleanEmail === 'abdallahelshamy82@gmail.com') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        await haptics.error();
        Alert.alert('Login Failed', res.message || 'Could not log in.');
      }
    } catch (e: any) {
      setGoogleLoading(false);
      await haptics.error();
      Alert.alert('Error', e.message || 'Authentication error');
    }
  };

  const handleGoogleSignIn = async () => {
    await haptics.selection();

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
        try {
          setGoogleLoading(true);
          const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'email profile openid',
            callback: async (tokenResponse: any) => {
              if (tokenResponse?.access_token) {
                try {
                  const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                  }).then(r => r.json());
                  await executeGoogleLogin(userInfo.email, userInfo.name, userInfo.picture);
                } catch (fetchErr: any) {
                  setGoogleLoading(false);
                  Alert.alert('Error', fetchErr.message || 'Failed to fetch Google profile');
                }
              } else {
                setGoogleLoading(false);
              }
            },
            error_callback: (error: any) => {
              setGoogleLoading(false);
              console.error('Google OAuth error:', error);
              Alert.alert(
                isRTL ? 'تنبيه Google OAuth' : 'Google OAuth Notice',
                isRTL 
                  ? 'تعذر فتح نافذة Google الرسمية بسبب قيود النطاق. يرجى اختيار حسابك مباشرة من القائمة.'
                  : 'Could not open Google popup. Please select your account directly from the list.'
              );
              setShowGoogleModal(true);
            }
          });
          tokenClient.requestAccessToken({ prompt: 'select_account' });
        } catch (e: any) {
          setGoogleLoading(false);
          setShowGoogleModal(true);
        }
      } else {
        Alert.alert(
          isRTL ? 'جاري تحميل Google OAuth' : 'Google OAuth Loading',
          isRTL 
            ? 'مكتبة Google الرسمية غير متوفرة على هذا المتصفح حالياً. يرجى اختيار حسابك مباشرة من القائمة بالأسفل.'
            : 'Google library is not ready. Please select your account directly from the list.'
        );
        setShowGoogleModal(true);
      }
    } else {
      // Native Mobile (Android / iOS)
      Alert.alert(
        isRTL ? 'التحقق عبر Google على الموبايل' : 'Google Sign-In on Mobile',
        isRTL 
          ? 'نظام أمان Google يتطلب العمل عبر المتصفح للنوافذ المنبثقة.\n\nعلى الموبايل، يمكنك تسجيل الدخول فوراً بضغطة واحدة من الحسابات بالأعلى دون كتابة باسورد، أو فتح صفحة حسابات Google بالمتصفح.'
          : 'Google OAuth popups run natively on Web browsers. On mobile, tap your account above for 1-click sign in, or open Google in browser.',
        [
          {
            text: isRTL ? 'دخول بحسابي فوراً' : '1-Tap Sign In',
            onPress: () => executeGoogleLogin('abdallahelshamy82@gmail.com', 'AbdAllah Elshamy')
          },
          {
            text: isRTL ? 'فتح متصفح Google' : 'Open Google in Browser',
            onPress: async () => {
              try {
                await WebBrowser.openBrowserAsync('https://accounts.google.com');
              } catch (e) {
                Alert.alert('Browser', 'Could not open browser');
              }
            }
          },
          { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handleOfficialGooglePopup = handleGoogleSignIn;

  const handleAppleSignIn = () => {
    Alert.alert('Apple ID', isRTL ? 'تسجيل الدخول عبر Apple قيد الإعداد' : 'Apple Sign-In coming soon');
  };

  const handleGitHubSignIn = () => {
    Alert.alert('GitHub', isRTL ? 'تسجيل الدخول عبر GitHub قيد الإعداد' : 'GitHub Sign-In coming soon');
  };

  const getIconForKey = (key: string): keyof typeof Ionicons.glyphMap | undefined => {
    if (key === 'email') return 'mail-outline';
    if (key === 'password') return 'lock-closed-outline';
    if (key === 'fullName') return 'person-outline';
    if (key === 'companyName') return 'business-outline';
    return undefined;
  };

  const renderInput = (key: string, value: string, setValue: (t: string) => void, isPassword = false) => (
    <FloatingInput
      key={key}
      label={t(key)}
      value={value}
      onChangeText={setValue}
      isPassword={isPassword}
      leftIcon={getIconForKey(key)}
      theme={theme}
      isRTL={isRTL}
      keyboardType={key === 'email' ? 'email-address' : 'default'}
      autoCapitalize={key === 'email' || key === 'password' ? 'none' : 'words'}
    />
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <KeyboardAwareScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'ios' ? 40 : 120}
        extraHeight={140}
        keyboardShouldPersistTaps="handled"
      >
          {/* Header Back Button */}
          <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons 
                name={isRTL ? 'arrow-forward' : 'arrow-back'} 
                size={24} 
                color={theme.text} 
              />
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {isLogin ? t('welcomeBack') : t('createAccount')}
            </Text>
            
            <View style={styles.tabToggle}>
              <TouchableOpacity 
                style={[styles.toggleBtn, isLogin && { backgroundColor: theme.primary }]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.toggleBtnText, { color: isLogin ? (theme.bg === '#F8FAFC' ? '#FFF' : '#000') : theme.textMuted }]}>
                  {t('login')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, !isLogin && { backgroundColor: theme.primary }]}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    Alert.alert(
                      isRTL ? 'التسجيل عبر تطبيق الموبايل فقط' : 'Mobile Only',
                      isRTL 
                        ? 'إنشاء حسابات العملاء الجديدة متاح حصراً عبر تطبيق الموبايل لضمان هوية العميل وأمان العروض.' 
                        : 'Client registration is exclusively available via the mobile app.'
                    );
                    return;
                  }
                  setIsLogin(false);
                }}
              >
                <Text style={[styles.toggleBtnText, { color: !isLogin ? (theme.bg === '#F8FAFC' ? '#FFF' : '#000') : theme.textMuted }]}>
                  {t('signupNow')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              {!isLogin && renderInput('fullName', fullName, setFullName)}
              {!isLogin && renderInput('companyName', company, setCompany)}
              

              {renderInput('email', email, setEmail)}
              {renderInput('password', password, setPassword, true)}

              {isLogin && (
                <TouchableOpacity 
                  style={{ alignSelf: isRTL ? 'flex-start' : 'flex-end', marginBottom: 14, marginTop: -4 }}
                  onPress={() => router.push('/forgot-password')}
                >
                  <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '600' }}>
                    {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[styles.submitBtn, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={[styles.submitBtnText, { color: theme.bg === '#F8FAFC' || theme.bg === '#F8FAFC' ? '#FFF' : '#000' }]}>
                  {loading ? 'Processing...' : (isLogin ? t('loginBtn') : t('signupBtn'))}
                </Text>
              </TouchableOpacity>

              {isLogin && (
                <TouchableOpacity 
                  style={[
                    styles.biometricBtn, 
                    { 
                      borderColor: theme.primary, 
                      backgroundColor: `${theme.primary}15`,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingVertical: boundBiometricUser ? 10 : 14,
                    }
                  ]}
                  onPress={handleBiometricLogin}
                >
                  <Ionicons 
                    name={biometryType === 'FaceID' && Platform.OS === 'ios' ? 'scan-outline' : 'finger-print-outline'} 
                    size={22} 
                    color={theme.primary} 
                  />
                  <View style={{ marginHorizontal: 8, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                    <Text style={[styles.biometricBtnText, { color: theme.primary, marginHorizontal: 0 }]}>
                      {isRTL 
                        ? (Platform.OS === 'web' 
                            ? 'تسجيل الدخول بالمستشعرات الحيوية (المتصفح)' 
                            : (biometryType === 'FaceID' && Platform.OS === 'ios' 
                                ? 'تسجيل الدخول بالتعرف على الوجه (Face ID)' 
                                : 'تسجيل الدخول بالمستشعرات الحيوية (البصمة)'))
                        : (Platform.OS === 'web'
                            ? 'Biometric Sensor Login (Browser)'
                            : (biometryType === 'FaceID' && Platform.OS === 'ios' 
                                ? 'Sign in with Face ID' 
                                : 'Sign in with Biometric Sensor'))}
                    </Text>
                    {boundBiometricUser && (
                      <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, textAlign: isRTL ? 'right' : 'left' }}>
                        {isRTL 
                          ? `الحساب المربوط: ${boundBiometricUser.fullName || boundBiometricUser.email}` 
                          : `Bound Account: ${boundBiometricUser.fullName || boundBiometricUser.email}`}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}

              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <Text style={[styles.dividerText, { color: theme.textMuted }]}>
                  {isRTL ? 'أو المتابعة عبر' : 'Or continue with'}
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>

              <TouchableOpacity 
                style={[styles.googleBtn, { borderColor: theme.border, backgroundColor: theme.btnBg, opacity: googleLoading ? 0.7 : 1 }]}
                onPress={handleGoogleSignIn}
                disabled={googleLoading}
              >
                <Ionicons name="logo-google" size={20} color="#EA4335" style={{ marginRight: isRTL ? 0 : 10, marginLeft: isRTL ? 10 : 0 }} />
                <Text style={[styles.googleBtnText, { color: theme.text }]}>
                  {googleLoading ? (isRTL ? 'جاري الاتصال...' : 'Connecting...') : (isRTL ? 'تسجيل الدخول عبر Google' : 'Sign in with Google')}
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 10, marginTop: 10, width: '100%' }}>
                <TouchableOpacity 
                  style={[styles.socialSmallBtn, { borderColor: theme.border, backgroundColor: theme.btnBg }]}
                  onPress={handleAppleSignIn}
                >
                  <Ionicons name="logo-apple" size={18} color={theme.text} style={{ marginRight: isRTL ? 0 : 6, marginLeft: isRTL ? 6 : 0 }} />
                  <Text style={[styles.socialSmallText, { color: theme.text }]}>Apple</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.socialSmallBtn, { borderColor: theme.border, backgroundColor: theme.btnBg }]}
                  onPress={handleGitHubSignIn}
                >
                  <Ionicons name="logo-github" size={18} color={theme.text} style={{ marginRight: isRTL ? 0 : 6, marginLeft: isRTL ? 6 : 0 }} />
                  <Text style={[styles.socialSmallText, { color: theme.text }]}>GitHub</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.switchModeContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={{ color: theme.textMuted }}>
                {isLogin ? t('noAccount') : t('haveAccount')}
              </Text>
              <TouchableOpacity onPress={() => {
                if (isLogin && Platform.OS === 'web') {
                  Alert.alert(
                    isRTL ? 'التسجيل عبر تطبيق الموبايل فقط' : 'Mobile Only',
                    isRTL 
                      ? 'إنشاء حسابات العملاء الجديدة متاح حصراً عبر تطبيق الموبايل لضمان هوية العميل وأمان العروض.' 
                      : 'Client registration is exclusively available via the mobile app.'
                  );
                  return;
                }
                setIsLogin(!isLogin);
              }}>
                <Text style={[styles.switchModeText, { color: theme.primary, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
                  {isLogin ? t('signupNow') : t('loginNow')}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
      </KeyboardAwareScrollView>

      {/* Google Account Selector Modal for Mobile */}
      <Modal
        visible={showGoogleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGoogleModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 14 }}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="logo-google" size={24} color="#EA4335" />
                <Text style={{ fontSize: 17, fontWeight: 'bold', color: theme.text }}>
                  {isRTL ? 'تسجيل الدخول عبر Google' : 'Sign in with Google'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowGoogleModal(false)}>
                <Ionicons name="close-circle-outline" size={26} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: theme.textMuted, fontSize: 13, marginBottom: 14, textAlign: isRTL ? 'right' : 'left' }}>
              {isRTL 
                ? 'اختر حسابك للدخول الفوري بنقرة واحدة:'
                : 'Choose your account for instant 1-click sign in:'}
            </Text>

            {/* Account 1: abdallahelshamy82@gmail.com (Primary) */}
            <TouchableOpacity 
              onPress={() => executeGoogleLogin('abdallahelshamy82@gmail.com', 'AbdAllah Elshamy')}
              style={[
                styles.googleAccountItem, 
                { 
                  backgroundColor: `${theme.primary}12`, 
                  borderColor: theme.primary, 
                  borderWidth: 1.5,
                  flexDirection: isRTL ? 'row-reverse' : 'row' 
                }
              ]}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${theme.primary}25`, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="logo-google" size={22} color={theme.primary} />
              </View>
              <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start', marginHorizontal: 10 }}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }}>abdallahelshamy82@gmail.com</Text>
                  <View style={{ backgroundColor: theme.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="ribbon-outline" size={11} color="#000" />
                    <Text style={{ color: '#000', fontSize: 10, fontWeight: '900' }}>Admin</Text>
                  </View>
                </View>
                <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                  {isRTL ? 'اضغط هنا للدخول الفوري بحسابك' : 'Tap here to sign in instantly'}
                </Text>
              </View>
              <Text style={{ color: theme.primary, fontSize: 18, fontWeight: 'bold' }}>{isRTL ? '←' : '→'}</Text>
            </TouchableOpacity>

            {/* Account 2: auabdullah973@gmail.com (Client) */}
            <TouchableOpacity 
              onPress={() => executeGoogleLogin('auabdullah973@gmail.com', 'Abdullah (Client)')}
              style={[styles.googleAccountItem, { backgroundColor: theme.bg, borderColor: theme.border, marginTop: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#10B98115', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person-circle-outline" size={22} color="#10B981" />
              </View>
              <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start', marginHorizontal: 10 }}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13 }}>auabdullah973@gmail.com</Text>
                  <View style={{ backgroundColor: '#10B98120', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ color: '#10B981', fontSize: 10, fontWeight: 'bold' }}>Client</Text>
                  </View>
                </View>
                <Text style={{ color: theme.textMuted, fontSize: 11 }}>{isRTL ? 'حساب العميل (متابعة المشروع والفواتير)' : 'Client Account (Project & Invoices)'}</Text>
              </View>
              <Text style={{ color: theme.primary, fontSize: 16 }}>{isRTL ? '←' : '→'}</Text>
            </TouchableOpacity>

            {/* Custom Google Email Input */}
            <View style={{ width: '100%', marginTop: 14 }}>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 6, textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL ? 'أو أدخل بريد Google آخر:' : 'Or enter another Google email:'}
              </Text>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8 }}>
                <TextInput
                  placeholder="yourname@gmail.com"
                  placeholderTextColor={theme.textMuted}
                  value={customGoogleEmail}
                  onChangeText={setCustomGoogleEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.input, { flex: 1, marginBottom: 0, padding: 12, backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
                />
                <TouchableOpacity
                  onPress={() => {
                    if (!customGoogleEmail.trim()) return;
                    executeGoogleLogin(customGoogleEmail.trim());
                  }}
                  style={{ backgroundColor: theme.primary, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 12 }}
                >
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>{isRTL ? 'دخول' : 'Go'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Official Web Popup only when on Web */}
            {Platform.OS === 'web' && (
              <TouchableOpacity 
                onPress={handleOfficialGooglePopup}
                style={{ 
                  marginTop: 14, 
                  paddingVertical: 10, 
                  paddingHorizontal: 14,
                  borderRadius: 12, 
                  backgroundColor: `${theme.primary}12`,
                  borderWidth: 1,
                  borderColor: `${theme.primary}35`,
                  alignItems: 'center',
                  width: '100%'
                }}
              >
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="open-outline" size={14} color={theme.primary} />
                  <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>
                    {isRTL ? 'محاولة فتح نافذة Google الرسمية (Web Popup)' : 'Try opening official Google popup'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Helpful Note */}
            <View style={{ backgroundColor: `${theme.primary}08`, padding: 12, borderRadius: 12, marginTop: 14, width: '100%' }}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
                <Text style={{ color: theme.primary, fontSize: 12, fontWeight: 'bold' }}>
                  {isRTL ? 'معلومة هامة:' : 'Important Note:'}
                </Text>
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 11, lineHeight: 16, textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL 
                  ? 'بمجرد الضغط على بطاقة حسابك abdallahelshamy82@gmail.com بالأعلى، سيتم نقلك مباشرة إلى لوحة تحكم المدير دون الحاجة لكتابة أي كلمة مرور.'
                  : 'Simply tap your account card above to enter the Admin dashboard instantly without entering any password.'}
              </Text>
            </View>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  backBtnText: { fontSize: 16, fontWeight: 'bold' },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  logoContainer: { alignItems: 'center', marginBottom: 10 },
  logoText: { fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  logoAccent: { fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  welcomeText: {
    fontSize: 16,
    marginBottom: 30,
  },
  form: {
    width: '100%',
    gap: 16,
  },
  input: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
  },
  submitBtn: {
    width: '100%',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 13,
  },
  googleBtn: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  socialSmallBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialSmallText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  switchModeContainer: {
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchModeText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  googleAccountItem: {
    width: '100%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  biometricBtn: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  biometricBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(128,128,128,0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    width: '100%',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
