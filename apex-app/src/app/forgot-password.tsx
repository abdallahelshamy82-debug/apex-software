import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { OtpInput } from '../components/OtpInput';
import { FloatingInput } from '../components/FloatingInput';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme, isRTL, activeTheme } = useSettings();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert(isRTL ? 'تنبيه' : 'Alert', isRTL ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email');
      return;
    }

    setLoading(true);
    const res = await api.forgotPassword(email.trim());
    setLoading(false);

    if (res.success) {
      Alert.alert(
        isRTL ? 'تم الإرسال' : 'Code Sent',
        isRTL ? 'تم إرسال كود التحقق إلى بريدك الإلكتروني. تفقد صندوق الوارد والبريد غير الهام (Spam).' : 'Verification code sent to your email.'
      );
      setStep(2);
    } else {
      Alert.alert('Error', res.message || 'Failed to send reset code');
    }
  };

  const handleResetPassword = async () => {
    if (!code || !newPassword || !confirmPassword) {
      setOtpError(!code);
      Alert.alert(isRTL ? 'تنبيه' : 'Alert', isRTL ? 'يرجى ملء كافة الحقول' : 'Please fill all fields');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(isRTL ? 'تنبيه' : 'Alert', isRTL ? 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    const res = await api.resetPassword(email.trim(), code.trim(), newPassword);
    setLoading(false);

    if (res.success) {
      setOtpError(false);
      Alert.alert(
        isRTL ? 'تم بنجاح' : 'Success',
        isRTL ? 'تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.' : 'Password reset successfully! Please login with your new password.',
        [{ text: isRTL ? 'تسجيل الدخول' : 'Go to Login', onPress: () => router.replace('/login') }]
      );
    } else {
      setOtpError(true);
      Alert.alert(isRTL ? 'خطأ' : 'Error', res.message || (isRTL ? 'كود التحقق غير صالح أو منتهي الصلاحية' : 'Invalid or expired code'));
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: theme.primary }]}>{isRTL ? '← رجوع' : '← Back'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {isRTL ? 'استعادة كلمة المرور' : 'Reset Password'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAwareScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'ios' ? 40 : 120}
        extraHeight={140}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}15` }]}>
            <Ionicons name="key" size={36} color={theme.primary} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {step === 1 
              ? (isRTL ? 'هل نسيت كلمة المرور؟' : 'Forgot Password?')
              : (isRTL ? 'أدخل كود التحقق وكلمة المرور' : 'Enter Code & New Password')}
          </Text>

          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {step === 1 
              ? (isRTL ? 'أدخل بريدك الإلكتروني المسجل، وسنرسل لك كود تحقق سري لإعادة تعيين كلمة المرور فوراً.' : 'Enter your registered email and we will send a 6-digit verification code.')
              : (isRTL ? `أدخل الكود المكون من 6 أرقام المرسل إلى (${email}) واكتب كلمة المرور الجديدة.` : `Enter the 6-digit code sent to (${email}) and choose a new password.`)}
          </Text>

          {step === 1 ? (
            <View style={{ width: '100%', marginTop: 20 }}>
              <FloatingInput
                label={isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                value={email}
                onChangeText={setEmail}
                leftIcon="mail-outline"
                theme={theme}
                isRTL={isRTL}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                onPress={handleSendCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Ionicons name="mail-outline" size={18} color={activeTheme === 'light' ? '#FFF' : '#000'} />
                    <Text style={[styles.primaryBtnText, { color: activeTheme === 'light' ? '#FFF' : '#000' }]}>
                      {isRTL ? 'إرسال كود التحقق' : 'Send Verification Code'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ width: '100%', marginTop: 20 }}>
              <Text style={[styles.label, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'كود التحقق (6 أرقام)' : 'Verification Code (6 digits)'}
              </Text>
              <OtpInput
                value={code}
                onChange={setCode}
                hasError={otpError}
                theme={theme}
                isRTL={isRTL}
                onFocus={() => setOtpError(false)}
              />

              <FloatingInput
                label={isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                value={newPassword}
                onChangeText={setNewPassword}
                isPassword
                leftIcon="lock-closed-outline"
                theme={theme}
                isRTL={isRTL}
              />

              <FloatingInput
                label={isRTL ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
                leftIcon="lock-closed-outline"
                theme={theme}
                isRTL={isRTL}
              />

              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: '#10B981', marginTop: 16 }]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Ionicons name="lock-closed-outline" size={18} color="#FFF" />
                    <Text style={[styles.primaryBtnText, { color: '#FFF' }]}>
                      {isRTL ? 'تأكيد وتغيير كلمة المرور' : 'Reset & Save Password'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ marginTop: 14, alignItems: 'center' }}
                onPress={() => setStep(1)}
              >
                <Text style={{ color: theme.primary, fontSize: 13 }}>
                  {isRTL ? '← إعادة إرسال الكود بريدياً' : '← Resend code or change email'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={{ marginTop: 24 }}
            onPress={() => router.push('/login')}
          >
            <Text style={{ color: theme.textMuted, fontSize: 14 }}>
              {isRTL ? 'تذكرت كلمة المرور؟ ' : 'Remember your password? '}
              <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{isRTL ? 'سجل دخولك' : 'Login'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
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
  scrollContent: {
    padding: 20,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 20,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
    width: '100%',
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    width: '100%',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
