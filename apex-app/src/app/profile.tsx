import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { FloatingInput } from '../components/FloatingInput';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, BASE_URL } from '../services/api';
import { useResponsive } from '../hooks/useResponsive';

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const fromReason = params.from; // 'payment' | 'project'
  const responsive = useResponsive();
  const { theme, isRTL, currentUser, setCurrentUser, activeTheme } = useSettings();

  // Profile fields state
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [company, setCompany] = useState(currentUser?.company || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentUser?.avatarUrl || null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.fullName) setFullName(currentUser.fullName);
      if (currentUser.company) setCompany(currentUser.company);
      if (currentUser.phone) setPhone(currentUser.phone);
      if (currentUser.avatarUrl) setAvatarUrl(currentUser.avatarUrl);
    }
  }, [currentUser]);

  // Password fields state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      try {
        const uploadRes = await api.uploadFile(uri, 'avatar.jpg', 'image/jpeg');
        if (uploadRes.success) {
          const fullUrl = `${BASE_URL}${uploadRes.url}`;
          setAvatarUrl(fullUrl);
          const updateRes = await api.updateProfile({ avatarUrl: fullUrl });
          if (updateRes.success && updateRes.user) {
            setCurrentUser(updateRes.user);
            await AsyncStorage.setItem('userData', JSON.stringify(updateRes.user));
          }
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to upload photo');
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName || fullName.trim() === '') {
      Alert.alert(
        isRTL ? 'تنبيه' : 'Notice',
        isRTL ? 'يرجى إدخال اسمك الكريم ليتم توثيقه في فواتيرك وعقد مشروعك.' : 'Please enter your full name.'
      );
      return;
    }

    setSavingProfile(true);
    const res = await api.updateProfile({ 
      fullName: fullName.trim(), 
      company: company ? company.trim() : '', 
      phone: phone ? phone.trim() : '', 
      avatarUrl: avatarUrl || undefined 
    });
    setSavingProfile(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      await AsyncStorage.setItem('userData', JSON.stringify(res.user));
      
      if (fromReason === 'payment') {
        Alert.alert(
          isRTL ? 'تم حفظ بياناتك بنجاح' : 'Profile Updated',
          isRTL ? 'تم توثيق اسمك، يمكنك الآن متابعة سداد الفاتورة وإصدار الإيصال باسمك الرسمي.' : 'Profile updated, redirecting to invoices.',
          [{ text: isRTL ? 'متابعة السداد الآن' : 'Continue to Payment', onPress: () => router.push('/invoices') }]
        );
      } else if (fromReason === 'project') {
        Alert.alert(
          isRTL ? 'تم حفظ بياناتك بنجاح' : 'Profile Updated',
          isRTL ? 'تم توثيق اسمك وشركتك، جاري الانتقال لمتابعة مشروعك.' : 'Profile updated, returning to project.',
          [{ text: isRTL ? 'متابعة المشروع' : 'Continue to Project', onPress: () => router.push('/dashboard') }]
        );
      } else {
        Alert.alert(
          isRTL ? 'تم التحديث بنجاح' : 'Updated Successfully',
          isRTL ? 'تم حفظ بياناتك الشخصية.' : 'Your profile has been updated.'
        );
      }
    } else {
      Alert.alert('Error', res.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(isRTL ? 'تنبيه' : 'Alert', isRTL ? 'يرجى ملء جميع حقول كلمة المرور' : 'Please fill all password fields');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(isRTL ? 'تنبيه' : 'Alert', isRTL ? 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    setSavingPassword(true);
    const res = await api.changePassword(currentPassword, newPassword);
    setSavingPassword(false);

    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
      Alert.alert(
        isRTL ? 'تم بنجاح' : 'Success',
        isRTL ? 'تم تغيير كلمة المرور بأمان.' : 'Password changed successfully.'
      );
    } else {
      Alert.alert('Error', res.message || 'Failed to change password');
    }
  };

  const handleGoBack = () => {
    if (currentUser?.role === 'admin' || currentUser?.isAdmin) {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity 
          onPress={handleGoBack} 
          style={[styles.backBtn, { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }]}
        >
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={18} color={theme.primary} />
          <Text style={[styles.backBtnText, { color: theme.primary }]}>{isRTL ? 'رجوع' : 'Back'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {isRTL ? 'الملف الشخصي والحساب' : 'Profile & Account'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          {
            maxWidth: responsive.containerWidth as any,
            paddingHorizontal: responsive.paddingHorizontal
          }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        
        {fromReason === 'payment' && (
          <View style={{
            backgroundColor: '#0284c715',
            borderColor: '#0284c7',
            borderWidth: 1.5,
            borderRadius: 14,
            padding: 14,
            marginBottom: 16,
            flexDirection: isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 12
          }}>
            <Ionicons name="card-outline" size={26} color="#0284c7" />
            <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }}>
                {isRTL ? 'مطلوب استكمال الاسم قبل سداد الفاتورة' : 'Name required before invoice payment'}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2, textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL 
                  ? 'يرجى كتابة اسمك الكريم واسم مؤسستك أو شركتك لتصدر الفاتورة وإيصال السداد باسمك الرسمي المعتمد، ثم اضغط "حفظ التغييرات".' 
                  : 'Please enter your full name and company so the invoice & receipt are issued under your official name.'}
              </Text>
            </View>
          </View>
        )}

        {fromReason === 'project' && (
          <View style={{
            backgroundColor: '#10b98115',
            borderColor: '#10b981',
            borderWidth: 1.5,
            borderRadius: 14,
            padding: 14,
            marginBottom: 16,
            flexDirection: isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 12
          }}>
            <Ionicons name="rocket-outline" size={26} color="#10b981" />
            <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }}>
                {isRTL ? 'مطلوب استكمال الاسم والشركة لبدء المشروع' : 'Name required to start project'}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2, textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL 
                  ? 'لتوثيق عقد البرمجة وتجهيز مراحل العمل باسمك الرسمي، يرجى كتابة اسمك واسم شركتك ثم اضغط "حفظ التغييرات".' 
                  : 'Please enter your full name and company to document the project contract under your official name.'}
              </Text>
            </View>
          </View>
        )}

        {/* Avatar Card */}
        <View style={[styles.card, styles.avatarCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: `${theme.primary}20` }]}>
                <Ionicons name="person" size={48} color={theme.primary} />
              </View>
            )}
            <TouchableOpacity 
              style={[styles.editBadge, { backgroundColor: theme.primary }]}
              onPress={handlePickAvatar}
            >
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.userName, { color: theme.text }]}>{currentUser?.fullName || 'Client'}</Text>
          <Text style={[styles.userEmail, { color: theme.textMuted }]}>{currentUser?.email}</Text>
          <View style={[styles.roleTag, { backgroundColor: `${theme.primary}15`, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
            <Ionicons 
              name={currentUser?.role === 'admin' ? 'shield-checkmark' : 'checkmark-circle'} 
              size={14} 
              color={theme.primary} 
            />
            <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>
              {currentUser?.role === 'admin' ? (isRTL ? 'مدير النظام' : 'ADMINISTRATOR') : (isRTL ? 'عميل موثق' : 'VERIFIED CLIENT')}
            </Text>
          </View>
        </View>

        {/* Profile Info Form */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'البيانات الشخصية' : 'Personal Information'}
          </Text>

          <FloatingInput
            label={isRTL ? 'الاسم بالكامل' : 'Full Name'}
            value={fullName}
            onChangeText={setFullName}
            leftIcon="person-outline"
            theme={theme}
            isRTL={isRTL}
          />

          <FloatingInput
            label={isRTL ? 'اسم الشركة / المشروع' : 'Company / Business Name'}
            value={company}
            onChangeText={setCompany}
            leftIcon="business-outline"
            theme={theme}
            isRTL={isRTL}
          />

          <FloatingInput
            label={isRTL ? 'رقم الهاتف / الواتساب' : 'Phone / WhatsApp'}
            value={phone}
            onChangeText={setPhone}
            leftIcon="call-outline"
            theme={theme}
            isRTL={isRTL}
            keyboardType="phone-pad"
          />

          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={[styles.saveBtnText, { color: activeTheme === 'light' ? '#FFF' : '#000' }]}>
                {isRTL ? 'حفظ التعديلات' : 'Save Changes'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Change Password Section */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity 
            style={[styles.accordionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={() => setShowPasswordSection(!showPasswordSection)}
          >
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="lock-closed" size={20} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
                {isRTL ? 'الأمان وتغيير كلمة المرور' : 'Security & Change Password'}
              </Text>
            </View>
            <Ionicons name={showPasswordSection ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textMuted} />
          </TouchableOpacity>

          {showPasswordSection && (
              <View style={{ marginTop: 16 }}>
                <FloatingInput
                  label={isRTL ? 'كلمة المرور الحالية' : 'Current Password'}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  isPassword
                  leftIcon="lock-closed-outline"
                  theme={theme}
                  isRTL={isRTL}
                />

                <FloatingInput
                  label={isRTL ? 'كلمة المرور الجديدة' : 'New Password (min 6 chars)'}
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
                style={[styles.saveBtn, { backgroundColor: '#10B981' }]}
                onPress={handleChangePassword}
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={[styles.saveBtnText, { color: '#FFF' }]}>
                    {isRTL ? 'تحديث كلمة المرور' : 'Update Password'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  avatarCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 10,
  },
  roleTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  accordionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
