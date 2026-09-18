import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import WhatsAppFAB from '../components/WhatsAppFAB';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useResponsive } from '../hooks/useResponsive';

const PLATFORMS = [
  { id: 'web', label: 'Web Application', labelAr: 'موقع ويب / تطبيق ويب', price: 600, timeDays: 14, icon: 'desktop' },
  { id: 'android', label: 'Android App', labelAr: 'تطبيق أندرويد', price: 800, timeDays: 21, icon: 'logo-android' },
  { id: 'ios', label: 'iOS App', labelAr: 'تطبيق آيفون (iOS)', price: 900, timeDays: 21, icon: 'logo-apple' },
];

const FEATURES = [
  { id: 'auth', label: 'User Authentication', labelAr: 'تسجيل دخول وحسابات', price: 150, timeDays: 3, icon: 'person' },
  { id: 'payments', label: 'Payment Gateway', labelAr: 'بوابات الدفع الإلكتروني', price: 300, timeDays: 5, icon: 'card' },
  { id: 'chat', label: 'Real-time Chat', labelAr: 'محادثات فورية (Chat)', price: 400, timeDays: 7, icon: 'chatbubbles' },
  { id: 'maps', label: 'Maps & GPS', labelAr: 'خرائط وتتبع', price: 250, timeDays: 4, icon: 'map' },
  { id: 'ai', label: 'AI Integration', labelAr: 'ذكاء اصطناعي (AI)', price: 500, timeDays: 10, icon: 'hardware-chip' },
];

const EXTRAS = [
  { id: 'playstore', label: 'Upload to Google Play', labelAr: 'رفع الموبايل على מתجر جوجل', price: 50, timeDays: 2, icon: 'logo-google-playstore' },
  { id: 'appstore', label: 'Upload to Apple Store', labelAr: 'رفع الموبايل على آبل ستور', price: 100, timeDays: 4, icon: 'logo-apple-appstore' },
  { id: 'hosting', label: 'Domain & Hosting (1yr)', labelAr: 'حجز دومين واستضافة (سنة)', price: 150, timeDays: 1, icon: 'server' },
  { id: 'uiux', label: 'Custom UI/UX Design', labelAr: 'تصميم واجهات احترافي (UI/UX)', price: 350, timeDays: 10, icon: 'color-palette' },
];

export default function EstimatorScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const { theme, isRTL, currentUser, setCurrentUser } = useSettings();
  
  const [step, setStep] = useState(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleSelection = (list: string[], setList: any, id: string) => {
    if (list.includes(id)) setList(list.filter((item: string) => item !== id));
    else setList([...list, id]);
  };

  const calculateTotal = () => {
    let total = 0;
    PLATFORMS.forEach(p => { if (selectedPlatforms.includes(p.id)) total += p.price; });
    FEATURES.forEach(f => { if (selectedFeatures.includes(f.id)) total += f.price; });
    EXTRAS.forEach(e => { if (selectedExtras.includes(e.id)) total += e.price; });
    return total;
  };

  const calculateTime = () => {
    let days = 0;
    PLATFORMS.forEach(p => { if (selectedPlatforms.includes(p.id)) days += p.timeDays; });
    FEATURES.forEach(f => { if (selectedFeatures.includes(f.id)) days += f.timeDays; });
    EXTRAS.forEach(e => { if (selectedExtras.includes(e.id)) days += e.timeDays; });
    
    if (days === 0) return isRTL ? '0 أسبوع' : '0 Weeks';
    const weeks = Math.ceil(days / 7);
    return isRTL ? `${weeks} أسبوع تقريباً` : `~${weeks} Weeks`;
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      const details = {
        platforms: selectedPlatforms,
        features: selectedFeatures,
        extras: selectedExtras,
        estimatedCost: calculateTotal(),
        estimatedTime: calculateTime()
      };
      await AsyncStorage.setItem('pendingEstimate', JSON.stringify(details));

      Alert.alert(
        isRTL ? 'تسجيل الدخول مطلوب' : 'Login Required',
        isRTL 
          ? 'تم حفظ مواصفات وتكلفة مشروعك بنجاح! يرجى تسجيل الدخول أو إنشاء حساب لاعتماد إرسال الطلب وحفظه في لوحة التحكم.' 
          : 'Your project specifications have been saved! Please login or create an account to submit your quote request.',
        [
          { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
          { 
            text: isRTL ? 'دخول / إنشاء حساب' : 'Login / Register', 
            onPress: () => router.push('/login') 
          }
        ]
      );
      return;
    }
    setLoading(true);
    const details = {
      platforms: selectedPlatforms,
      features: selectedFeatures,
      extras: selectedExtras,
      estimatedCost: calculateTotal(),
      estimatedTime: calculateTime()
    };
    
    const res = await api.submitQuote(details);
    setLoading(false);
    if (res.success) {
      if (res.user) {
        setCurrentUser(res.user);
        await AsyncStorage.setItem('userData', JSON.stringify(res.user));
      }
      Alert.alert(
        isRTL ? 'تم إرسال طلبك بنجاح' : 'Success', 
        isRTL ? 'تم تسجيل مشروعك وتجهيز خارطة مراحله المخصصة في لوحة التحكم!' : 'Project registered & your custom roadmap is ready!'
      );
      router.push('/dashboard');
    } else {
      Alert.alert('Error', 'Failed to submit quote.');
    }
  };

  const renderStepIndicators = () => (
    <View style={[styles.progressContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      {[1, 2, 3, 4].map(s => (
        <View key={s} style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
          <View style={[styles.stepCircle, { backgroundColor: step >= s ? theme.primary : theme.btnBg }]}>
            <Text style={{ color: step >= s ? '#FFF' : theme.textMuted, fontWeight: 'bold' }}>{s}</Text>
          </View>
          {s < 4 && <View style={[styles.stepLine, { backgroundColor: step > s ? theme.primary : theme.btnBg }]} />}
        </View>
      ))}
    </View>
  );

  const renderOptions = (options: any[], selected: string[], setSelected: any) => (
    <View style={{ marginTop: 20 }}>
      {options.map(opt => {
        const isSelected = selected.includes(opt.id);
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => toggleSelection(selected, setSelected, opt.id)}
            style={[
              styles.optionCard, 
              { backgroundColor: isSelected ? theme.primary + '20' : theme.card, borderColor: isSelected ? theme.primary : theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }
            ]}
          >
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
              <Ionicons name={opt.icon as any} size={24} color={isSelected ? theme.primary : theme.textMuted} />
              <Text style={[styles.optionText, { color: theme.text, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
                {isRTL ? opt.labelAr : opt.label}
              </Text>
            </View>
            <Text style={{ color: theme.primary, fontWeight: 'bold' }}>+${opt.price}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const handleGoBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push(currentUser?.role === 'admin' ? '/admin' : (currentUser ? '/dashboard' : '/'));
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backBtn}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{isRTL ? 'المُسعّر الذكي للمشاريع' : 'Smart Project Estimator'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderStepIndicators()}

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          {
            maxWidth: responsive.containerWidth as any,
            paddingHorizontal: responsive.paddingHorizontal,
            alignSelf: 'center',
            width: '100%',
          }
        ]}
      >
        
        {step === 1 && (
          <View>
            <Text style={[styles.stepTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? '1. ما هي المنصات المستهدفة؟' : '1. Target Platforms?'}
            </Text>
            {renderOptions(PLATFORMS, selectedPlatforms, setSelectedPlatforms)}
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={[styles.stepTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? '2. الميزات البرمجية المطلوبة' : '2. Required Features'}
            </Text>
            {renderOptions(FEATURES, selectedFeatures, setSelectedFeatures)}
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={[styles.stepTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? '3. خدمات إضافية (أوصي بها)' : '3. Extra Services (Recommended)'}
            </Text>
            {renderOptions(EXTRAS, selectedExtras, setSelectedExtras)}
          </View>
        )}

        {step === 4 && (
          <View style={styles.summaryContainer}>
            <Ionicons name="receipt" size={60} color={theme.primary} style={{ alignSelf: 'center', marginBottom: 20 }} />
            <Text style={[styles.summaryTitle, { color: theme.text }]}>{isRTL ? 'الملخص والتكلفة التقريبية' : 'Summary & Estimated Cost'}</Text>
            <Text style={[styles.totalCost, { color: theme.primary }]}>${calculateTotal()}</Text>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginTop: 10 }}>
              <Ionicons name="time" size={24} color={theme.textMuted} />
              <Text style={{ color: theme.textMuted, fontSize: 18, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0, fontWeight: 'bold' }}>
                {calculateTime()}
              </Text>
            </View>
            <Text style={{ color: theme.textMuted, textAlign: 'center', marginVertical: 20 }}>
              {isRTL ? 'هذه التكلفة والمدة مبدئية وقد تتغير بناءً على التفاصيل الدقيقة.' : 'This cost and duration are rough estimates and may change based on specific details.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Floating Bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.card, borderTopColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>{isRTL ? 'الإجمالي والمدة' : 'Est. Total & Time'}</Text>
          <Text style={{ color: theme.primary, fontSize: 24, fontWeight: 'bold' }}>${calculateTotal()}</Text>
          <Text style={{ color: theme.text, fontSize: 12 }}>{calculateTime()}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.nextBtn, { backgroundColor: theme.primary, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          onPress={() => step < 4 ? setStep(step + 1) : handleSubmit()}
        >
          <Text style={styles.nextBtnText}>{step < 4 ? (isRTL ? 'التالي' : 'Next Step') : (isRTL ? 'إرسال الطلب' : 'Submit Request')}</Text>
          {step < 4 && <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={20} color="#FFF" style={{ marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }} />}
        </TouchableOpacity>
      </View>

      {/* Floating WhatsApp Quick Consultation with estimated quote */}
      <WhatsAppFAB 
        bottom={90}
        customMessage={
          isRTL
            ? `مرحباً فريق Apex Devs، لقد قمت بحساب تكلفة تقديرية لمشروعي بقيمة $${calculateTotal()} والمدة ${calculateTime()}، وأود استشارة مهندسيكم لبدء العمل.`
            : `Hello Apex Devs team, I calculated an estimate of $${calculateTotal()} (${calculateTime()}) for my project, and would like to consult your team to get started.`
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1, alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  progressContainer: { padding: 20, justifyContent: 'center', alignItems: 'center' },
  stepCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepLine: { width: 40, height: 4, borderRadius: 2, marginHorizontal: 4 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  stepTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  optionCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' },
  optionText: { fontSize: 16, fontWeight: '500' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1, alignItems: 'center', justifyContent: 'space-between' },
  nextBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  nextBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  summaryContainer: { alignItems: 'center', paddingVertical: 40 },
  summaryTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  totalCost: { fontSize: 48, fontWeight: '900' }
});
