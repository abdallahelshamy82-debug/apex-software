import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettings } from '../context/SettingsContext';
import { haptics } from '../utils/haptics';
import { biometrics } from '../utils/biometrics';
import { notifications } from '../utils/notifications';
import { useResponsive } from '../hooks/useResponsive';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { removeSecureToken, getSecureToken } from '../utils/secureTokenStorage';
import AppSwitch from '../components/ui/AppSwitch';
import LtrText from '../components/ui/LtrText';
import { useToast } from '../components/ApexToast';

export default function SettingsScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const { theme, activeTheme, selectedThemeOption, setSelectedThemeOption, language, setLanguage, t, isRTL, currentUser, setCurrentUser } = useSettings();
  const { showToast } = useToast();

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [boundBiometricEmail, setBoundBiometricEmail] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  useEffect(() => {
    async function loadBiometricsState() {
      const boundEmail = await biometrics.getBoundUserEmail();
      setBoundBiometricEmail(boundEmail);
      if (currentUser?.email) {
        const isUserConfigured = await biometrics.isBiometricsConfiguredForUser(currentUser.email);
        setBiometricEnabled(isUserConfigured);
      } else {
        const isConfigured = await biometrics.isBiometricsConfigured();
        setBiometricEnabled(isConfigured);
      }
    }
    loadBiometricsState();
    AsyncStorage.getItem('pushEnabled').then((val) => {
      if (val !== null) setPushEnabled(val === 'true');
    });
    AsyncStorage.getItem('hapticsEnabled').then((val) => {
      if (val !== null) setHapticsEnabled(val === 'true');
    });
  }, [currentUser]);

  const handleToggleBiometrics = async (val: boolean) => {
    await haptics.selection();
    if (val) {
      if (!currentUser) {
        showToast({
          type: 'warning',
          title: isRTL ? 'تسجيل الدخول مطلوب' : 'Sign-in Required',
          message: isRTL ? 'يرجى تسجيل الدخول أولاً بحسابك لربط البصمة به بأمان.' : 'Please sign in first to bind your biometrics to your account.',
        });
        setBiometricEnabled(false);
        return;
      }

      // 🛡️ Exclusive Device Biometric Enforcement: Block if bound to another account
      const claimCheck = await biometrics.canUserClaimBiometrics(currentUser.email);
      if (!claimCheck.allowed) {
        await haptics.error();
        Alert.alert(
          isRTL ? 'المستشعرات الحيوية محجوزة لحساب آخر' : 'Biometrics Bound to Another Account',
          isRTL
            ? `المستشعرات الحيوية في هذا الجهاز مربوطة حالياً بحساب:\n(${claimCheck.currentOwnerEmail})\n\nوفقاً لمعايير الأمان المصرفية، يُسمح بربط بصمة الجهاز بحساب واحد فقط منعاً لتداخل الصلاحيات والعروض.\n\nإذا أردت تفعيل البصمة لحسابك (${currentUser.email})، يرجى أولاً تسجيل الدخول بالحساب المربوط (${claimCheck.currentOwnerEmail}) وإلغاء تفعيل البصمة منه في الإعدادات.`
            : `Device biometrics are currently bound to (${claimCheck.currentOwnerEmail}). For bank-grade security, only one account can be linked to biometrics per device. Please sign in with that account and unbind biometrics first.`
        );
        showToast({
          type: 'error',
          title: isRTL ? 'تعذر تفعيل البصمة' : 'Action Denied',
          message: isRTL ? `المستشعرات محجوزة لحساب: ${claimCheck.currentOwnerEmail}` : `Claimed by ${claimCheck.currentOwnerEmail}`,
        });
        setBiometricEnabled(false);
        return;
      }

      const bio = await biometrics.isAvailable();
      if (!bio.available || !bio.enrolled) {
        showToast({
          type: 'warning',
          title: isRTL ? 'تنبيه المستشعرات' : 'Biometrics Notice',
          message: isRTL ? 'جهازك لا يدعم أو لم يتم تسجيل بصمة إصبع أو وجه في إعدادات الهاتف.' : 'Biometric hardware is not enrolled on this device.',
        });
        setBiometricEnabled(false);
        return;
      }
      const auth = await biometrics.authenticate(
        isRTL ? `يرجى تأكيد بصمتك لربطها بحساب: ${currentUser.fullName}` : `Confirm biometrics to bind to: ${currentUser.fullName}`
      );
      if (!auth.success) {
        showToast({
          type: 'warning',
          title: isRTL ? 'فشل التوثيق' : 'Authentication Canceled',
          message: isRTL ? 'تم إلغاء المصادقة أو لم يتم التعرف على البصمة. لم يتم تفعيل الخيار.' : 'Biometric authentication was canceled.',
        });
        setBiometricEnabled(false);
        return;
      }
      const token = await getSecureToken();
      await biometrics.setBiometricUser(currentUser, token || '');
      setBiometricEnabled(true);
      setBoundBiometricEmail(currentUser.email);
      showToast({
        type: 'success',
        title: isRTL ? 'تم ربط البصمة بنجاح' : 'Biometrics Bound',
        message: isRTL ? `تم قفل المستشعرات الحيوية حصرياً على حساب (${currentUser.fullName}) بنجاح!` : `Biometrics exclusively linked to ${currentUser.fullName}!`,
      });
    } else {
      // 🛡️ Ensure only the owner can disable their biometric binding
      const claimCheck = await biometrics.canUserClaimBiometrics(currentUser?.email);
      if (!claimCheck.allowed) {
        showToast({
          type: 'warning',
          title: isRTL ? 'غير مسموح' : 'Unauthorized',
          message: isRTL ? `لا يمكنك تعديل بصمة تابعة لحساب آخر (${claimCheck.currentOwnerEmail}).` : `Cannot modify biometrics belonging to another account.`,
        });
        setBiometricEnabled(false);
        return;
      }
      await biometrics.clearBiometricUser();
      setBiometricEnabled(false);
      setBoundBiometricEmail(null);
      showToast({
        type: 'info',
        title: isRTL ? 'تم إلغاء ربط البصمة' : 'Biometrics Disabled',
        message: isRTL ? 'تم إلغاء تفعيل تسجيل الدخول بالمستشعرات الحيوية وأصبح الجهاز متاحاً لربط حساب آخر.' : 'Biometric sign-in disabled; device is now free to bind another account.',
      });
    }
  };

  const handleTogglePush = async (val: boolean) => {
    await haptics.selection();
    setPushEnabled(val);
    await AsyncStorage.setItem('pushEnabled', val ? 'true' : 'false');
    notifications.setNotificationsActive(val);
    if (val) {
      notifications.registerForPushNotifications();
      showToast({
        type: 'success',
        title: isRTL ? 'تم تفعيل الإشعارات' : 'Notifications Active',
        message: isRTL ? 'ستصلك كافة تحديثات فواتيرك ومشاريعك لحظة بلحظة.' : 'You will receive real-time project & invoice updates.',
      });
    } else {
      showToast({
        type: 'info',
        title: isRTL ? 'تم كتم الإشعارات' : 'Notifications Muted',
        message: isRTL ? 'تم تعطيل التنبيهات الفورية.' : 'Real-time notifications disabled.',
      });
    }
  };

  const handleToggleHaptics = async (val: boolean) => {
    setHapticsEnabled(val);
    await AsyncStorage.setItem('hapticsEnabled', val ? 'true' : 'false');
    haptics.setHapticsActive(val);
    if (val) await haptics.success();
    showToast({
      type: 'info',
      title: isRTL ? (val ? 'تم تفعيل الاهتزازات' : 'تم تعطيل الاهتزازات') : (val ? 'Haptics Enabled' : 'Haptics Disabled'),
      message: isRTL 
        ? (val ? 'تم تشغيل ردود الفعل اللمسية بنجاح.' : 'تم كتم وإيقاف كافة الاهتزازات بنجاح.') 
        : (val ? 'Haptic feedback enabled.' : 'All haptic vibrations stopped.'),
    });
  };

  const handleSelectTheme = async (val: string) => {
    await haptics.selection();
    setSelectedThemeOption(val);
    await AsyncStorage.setItem('appTheme', val);
  };

  const renderLangButton = (label: string, value: string) => {
    const isActive = language === value;
    return (
      <TouchableOpacity 
        key={value}
        onPress={() => setLanguage(value)}
        style={[
          styles.optionBtn, 
          { 
            backgroundColor: isActive ? theme.primary : 'transparent',
            borderColor: isActive ? theme.primary : theme.border,
            flex: 1,
          }
        ]}
      >
        <Text style={[styles.optionBtnText, { color: isActive ? (activeTheme === 'light' ? '#FFF' : '#000') : theme.text }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: theme.primary }]}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('settings')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={[
          styles.content,
          {
            maxWidth: responsive.containerWidth as any,
            paddingHorizontal: responsive.paddingHorizontal,
            alignSelf: 'center',
            width: '100%',
          }
        ]}
      >
        
        {/* Profile Card */}
        {currentUser && (
          <TouchableOpacity 
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }]}
            onPress={() => router.push('/profile')}
          >
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${theme.primary}20`, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person" size={22} color={theme.primary} />
              </View>
              <View>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left' }}>
                  {currentUser.fullName || (isRTL ? 'الملف الشخصي' : 'My Profile')}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: isRTL ? 'right' : 'left' }}>
                  {currentUser.email || (isRTL ? 'تعديل البيانات وتغيير كلمة المرور' : 'Edit profile & change password')}
                </Text>
              </View>
            </View>
            <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={theme.primary} />
          </TouchableOpacity>
        )}

        {/* Mobile-First Native Experience Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Ionicons name="phone-portrait-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.primary, marginBottom: 0, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
              {isRTL ? 'تجربة الموبايل' : 'Mobile-First Features'}
            </Text>
          </View>

          {/* Biometric Toggle */}
          <View style={[styles.switchRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
              <Text style={[styles.switchTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
                {isRTL ? 'تسجيل الدخول بالمستشعرات الحيوية (البصمة / الوجه)' : 'Biometric Sensor Login (Fingerprint / Face)'}
              </Text>
              <Text style={[styles.switchSubtitle, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
                {isRTL ? 'تسجيل دخول فوري وآمن بدون كتابة كلمة المرور' : 'Instant and secure login without typing password'}
              </Text>
              {boundBiometricEmail && currentUser?.email && boundBiometricEmail.trim().toLowerCase() !== currentUser.email.trim().toLowerCase() && (
                <View style={{ marginTop: 6, padding: 8, borderRadius: 8, backgroundColor: '#EF444415', borderWidth: 1, borderColor: '#EF444433' }}>
                  <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '700', textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL 
                      ? `🔒 مستشعرات الهاتف محجوزة لحساب:\n${boundBiometricEmail}` 
                      : `🔒 Device biometrics claimed by:\n${boundBiometricEmail}`}
                  </Text>
                </View>
              )}
              {boundBiometricEmail && currentUser?.email && boundBiometricEmail.trim().toLowerCase() === currentUser.email.trim().toLowerCase() && (
                <View style={{ marginTop: 6, padding: 8, borderRadius: 8, backgroundColor: '#10B98115', borderWidth: 1, borderColor: '#10B98133' }}>
                  <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '700', textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL 
                      ? `✅ البصمة مفعلة ومربوطة بحسابك الحالي (${currentUser.email})` 
                      : `✅ Biometrics linked to your account (${currentUser.email})`}
                  </Text>
                </View>
              )}
            </View>
            <AppSwitch
              value={biometricEnabled}
              onValueChange={handleToggleBiometrics}
              activeColor={theme.primary}
              inactiveColor={theme.border}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Push Notifications Toggle */}
          <View style={[styles.switchRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
              <Text style={[styles.switchTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
                {isRTL ? 'الإشعارات والتنبيهات الفورية' : 'Real-time Push Notifications'}
              </Text>
              <Text style={[styles.switchSubtitle, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
                {isRTL ? 'تنبيهات صوتية فورية عند اعتماد الفواتير والمشاريع' : 'Instant sound alerts for invoices & deliverables'}
              </Text>
            </View>
            <AppSwitch
              value={pushEnabled}
              onValueChange={handleTogglePush}
              activeColor={theme.primary}
              inactiveColor={theme.border}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Haptic Feedback Toggle */}
          <View style={[styles.switchRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
              <Text style={[styles.switchTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
                {isRTL ? (
                  <Text style={{ textAlign: 'right', writingDirection: 'rtl' }}>
                    {'ردود الفعل اللمسية '}<Text style={{ writingDirection: 'ltr' }}>(Haptics)</Text>
                  </Text>
                ) : 'Haptic Feedback Engine'}
              </Text>
              <Text style={[styles.switchSubtitle, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
                {isRTL ? 'اهتزازات حسية رقيقة ودقيقة عند الضغط وسحب الشاشة' : 'Physical tactile sensations on tap and refresh'}
              </Text>
            </View>
            <AppSwitch
              value={hapticsEnabled}
              onValueChange={handleToggleHaptics}
              activeColor={theme.primary}
              inactiveColor={theme.border}
            />
          </View>
        </View>

        {/* Language Section */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Ionicons name="language-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.primary, marginBottom: 0, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
              {isRTL ? (
                <Text style={{ textAlign: 'right', writingDirection: 'rtl' }}>
                  {'اللغة '}<LtrText>(Language)</LtrText>
                </Text>
              ) : t('language')}
            </Text>
          </View>
          <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {renderLangButton('English', 'en')}
            {renderLangButton('العربية', 'ar')}
          </View>
          <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 10 }]}>
            {renderLangButton('Français', 'fr')}
            {renderLangButton('Español', 'es')}
          </View>
        </View>

        {/* Theme & Appearance Section */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Ionicons name="color-palette-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.primary, marginBottom: 0 }]}>
              {t('chooseTheme')}
            </Text>
          </View>

          {/* Mode Sub-label */}
          <Text style={[styles.subSectionTitle, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'نمط العرض (Mode)' : 'Appearance Mode'}
          </Text>

          {/* Modern Segmented Control for Modes */}
          <View style={[styles.segmentedContainer, { backgroundColor: theme.btnBg, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {[
              { id: 'system', label: isRTL ? 'تلقائي' : 'System', icon: 'phone-portrait-outline' as const },
              { id: 'light', label: isRTL ? 'فاتح' : 'Light', icon: 'sunny-outline' as const },
              { id: 'dark', label: isRTL ? 'داكن' : 'Dark', icon: 'moon-outline' as const },
              { id: 'black', label: 'OLED', icon: 'contrast-outline' as const },
            ].map((item) => {
              const isActive = selectedThemeOption === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => handleSelectTheme(item.id)}
                  style={[
                    styles.segmentedTab,
                    isActive && {
                      backgroundColor: theme.primary,
                      shadowColor: theme.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 3,
                    }
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={15}
                    color={isActive ? (activeTheme === 'light' ? '#FFF' : '#000') : theme.textMuted}
                  />
                  <Text
                    style={[
                      styles.segmentedTabText,
                      {
                        color: isActive ? (activeTheme === 'light' ? '#FFF' : '#000') : theme.textMuted,
                        fontWeight: isActive ? '700' : '500',
                      }
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 18 }]} />

          {/* Color Palettes Sub-label */}
          <Text style={[styles.subSectionTitle, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'ألوان الواجهة (Color Swatches)' : 'Color Theme Swatches'}
          </Text>

          {/* Circular Color Swatches Row */}
          <View style={[styles.swatchesRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {[
              { id: 'blue', label: isRTL ? 'محيطي' : 'Ocean', color: '#0284C7' },
              { id: 'purple', label: isRTL ? 'جمشت' : 'Amethyst', color: '#8B5CF6' },
              { id: 'green', label: isRTL ? 'غابة' : 'Forest', color: '#10B981' },
              { id: 'rose', label: isRTL ? 'وردي' : 'Rose', color: '#F43F5E' },
            ].map((swatch) => {
              const isActive = selectedThemeOption === swatch.id;
              return (
                <TouchableOpacity
                  key={swatch.id}
                  activeOpacity={0.8}
                  onPress={() => handleSelectTheme(swatch.id)}
                  style={styles.swatchContainer}
                >
                  <View
                    style={[
                      styles.swatchCircle,
                      { backgroundColor: swatch.color },
                      isActive && {
                        borderWidth: 3,
                        borderColor: '#FFFFFF',
                        shadowColor: swatch.color,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.6,
                        shadowRadius: 8,
                        elevation: 8,
                        transform: [{ scale: 1.12 }],
                      }
                    ]}
                  >
                    {isActive && (
                      <Ionicons name="checkmark" size={22} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.swatchLabel,
                      {
                        color: isActive ? theme.primary : theme.textMuted,
                        fontWeight: isActive ? '700' : '500',
                      }
                    ]}
                  >
                    {swatch.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* About & Legal Section */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.primary, marginBottom: 0 }]}>
              {isRTL ? 'عن التطبيق والمعلومات القانونية' : 'About & Legal'}
            </Text>
          </View>

          {/* Portfolio & Identity */}
          <TouchableOpacity
            style={[styles.linkRow, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: theme.border }]}
            onPress={() => {
              haptics.selection();
              router.push('/portfolio');
            }}
          >
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="briefcase-outline" size={18} color={theme.primary} />
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>
                {isRTL ? 'هويتنا وسابقة أعمالنا (Portfolio)' : 'Our Identity & Portfolio'}
              </Text>
            </View>
            <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={theme.primary} />
          </TouchableOpacity>

          {/* Privacy Policy */}
          <TouchableOpacity
            style={[styles.linkRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={() => {
              haptics.selection();
              router.push('/privacy');
            }}
          >
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.primary} />
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>
                {isRTL ? 'سياسة الخصوصية وشروط الاستخدام' : 'Privacy Policy & Terms'}
              </Text>
            </View>
            <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={theme.primary} />
          </TouchableOpacity>

          <View style={{ marginTop: 14, alignItems: 'center' }}>
            <Text style={{ color: theme.textMuted, fontSize: 11 }}>
              Apex Software Client Portal v1.0.0 (Build 1)
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2 }}>
              © 2026 Apex Software Inc. All rights reserved.
            </Text>
          </View>
        </View>

        {/* Log Out Button (Only for authenticated users) */}
        {currentUser ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={async () => {
              haptics.medium();
              await removeSecureToken();
              await AsyncStorage.removeItem('userData');
              setCurrentUser(null);
              router.replace('/login');
            }}
            style={[styles.card, { backgroundColor: '#EF444415', borderColor: '#EF444466', marginTop: 10, padding: 16, alignItems: 'center', justifyContent: 'center' }]}
          >
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: 'bold' }}>
                {isRTL ? 'تسجيل الخروج من الحساب (Log Out)' : 'Log Out of Account'}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              haptics.selection();
              router.push('/login');
            }}
            style={[styles.card, { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}66`, marginTop: 10, padding: 16, alignItems: 'center', justifyContent: 'center' }]}
          >
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="log-in-outline" size={20} color={theme.primary} />
              <Text style={{ color: theme.primary, fontSize: 16, fontWeight: 'bold' }}>
                {isRTL ? 'تسجيل الدخول / إنشاء حساب (Login)' : 'Log In or Create Account'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

      </ScrollView>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100, maxWidth: 600, alignSelf: 'center', width: '100%' },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  row: { gap: 10 },
  optionBtn: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionBtnText: { fontWeight: 'bold', fontSize: 16 },
  switchRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 12,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  switchSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  divider: {
    height: 1,
    marginVertical: 10,
    opacity: 0.5,
  },
  linkRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    opacity: 0.85,
    letterSpacing: 0.4,
  },
  segmentedContainer: {
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    gap: 4,
  },
  segmentedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  segmentedTabText: {
    fontSize: 12,
  },
  swatchesRow: {
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  swatchContainer: {
    alignItems: 'center',
    gap: 8,
  },
  swatchCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchLabel: {
    fontSize: 12,
  },
});
