import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ImageBackground, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useResponsive } from '../hooks/useResponsive';
import { BlurView } from 'expo-blur';

const bgImage = require('../../assets/images/login-bg-dev.jpg');

const PLATFORMS = [
  { id: 'web', label: 'Web Application / Landing Page', labelAr: 'موقع ويب / صفحة هبوط سريعة', price: 100, timeDays: 5, icon: 'desktop-outline', noteAr: 'واجهة عصرية سريعة، متوافقة 100% مع الموبايل والتابلت' },
  { id: 'android', label: 'Android App (APK + AAB)', labelAr: 'تطبيق أندرويد متكامل (APK + AAB)', price: 200, timeDays: 10, icon: 'logo-android', noteAr: 'ملفات جاهزة للإطلاق وتناسب أنظمة الشركات و ERP' },
  { id: 'ios', label: 'iOS App (iPhone)', labelAr: 'تطبيق آيفون (iOS)', price: 300, timeDays: 12, icon: 'logo-apple', noteAr: 'أداء فائق وسلاسة تامة بنظام iOS الحديث' },
];

const FEATURES = [
  { id: 'auth', label: 'User Authentication & DB', labelAr: 'تسجيل دخول وحسابات وقاعدة بيانات', price: 60, timeDays: 2, icon: 'person-outline', noteAr: 'حسابات مستخدمين، لوحة بروفايل وقاعدة بيانات آمنة' },
  { id: 'payments', label: 'Payment Gateway', labelAr: 'بوابات الدفع الإلكتروني (Paymob / Stripe)', price: 80, timeDays: 3, icon: 'card-outline', noteAr: 'ربط فيزا، ماستركارد، فودافون كاش، باي موب وسترايب' },
  { id: 'chat', label: 'Real-time Chat & n8n', labelAr: 'محادثات فورية وربط الأتمتة (n8n)', price: 180, timeDays: 4, icon: 'chatbubbles-outline', noteAr: 'شات فوري بين المستخدمين وسيرفر أتمتة n8n ذكي' },
  { id: 'maps', label: 'Live Maps & GPS Tracking', labelAr: 'خرائط حية وتتبع GPS ومسارات', price: 220, timeDays: 4, icon: 'map-outline', noteAr: 'ربط خرائط جوجل وتتبع خطوط السير والمسافات' },
  { id: 'ai', label: 'AI Copilot & ChatGPT', labelAr: 'ذكاء اصطناعي ومساعد ذكي (AI Copilot)', price: 120, timeDays: 3, icon: 'hardware-chip-outline', noteAr: 'مساعد ذكي مدرب على إجابة استفسارات العملاء آلياً' },
];

const EXTRAS = [
  { id: 'playstore', label: 'Publish to Google Play', labelAr: 'رفع وضبط التطبيق على Google Play', price: 40, timeDays: 2, icon: 'logo-google-playstore', noteAr: 'تجهيز لقطات الشاشة، سياسة الخصوصية وتوليد الـ Bundle' },
  { id: 'appstore', label: 'Publish to Apple Store', labelAr: 'رفع وإعداد الشهادات على Apple Store', price: 130, timeDays: 3, icon: 'logo-apple-appstore', noteAr: 'إعداد الشهادات ومراجعة أبل (شامل اشتراك أبل وحساب المطور)' },
  { id: 'hosting', label: 'Domain & Cloud Hosting (1yr)', labelAr: 'دومين .com واستضافة سحابية سريعة (سنة)', price: 50, timeDays: 1, icon: 'server-outline', noteAr: 'حجز دومين رسمي واستضافة سحابية فائقة السرعة مع SSL' },
  { id: 'uiux', label: 'Custom Modern UI/UX', labelAr: 'تصميم واجهات وتجربة مستخدم عصرية (UI/UX)', price: 70, timeDays: 3, icon: 'color-palette-outline', noteAr: 'تصميم واجهات احترافي مخصص بالكامل لهوية علامتك' },
];

export default function EstimatorScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const { isRTL, theme, currentUser, setCurrentUser } = useSettings();
  
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

    const isNameIncomplete = !currentUser?.fullName || 
      currentUser.fullName.trim() === '' || 
      currentUser.fullName === currentUser.email?.split('@')[0] ||
      currentUser.fullName.toLowerCase() === 'client' ||
      currentUser.fullName === 'عميل';

    if (isNameIncomplete) {
      Alert.alert(
        isRTL ? 'استكمال الاسم والشركة أولاً' : 'Name Required',
        isRTL 
          ? 'لتسجيل طلب مشروعك وإصدار عرض السعر باسمك الرسمي، يرجى كتابة اسمك الكريم واسم شركتك في الملف الشخصي.' 
          : 'Please enter your full name and company in your profile to register this project under your name.',
        [
          { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
          { 
            text: isRTL ? 'كتابة اسمي في البروفايل' : 'Go to Profile', 
            onPress: () => router.push('/profile?from=project') 
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
          <View style={[styles.stepCircle, { 
            backgroundColor: step >= s ? theme.primary : 'rgba(255,255,255,0.05)',
            borderColor: step >= s ? theme.primary : 'rgba(255,255,255,0.2)',
            borderWidth: 1
          }]}>
            <Text style={{ color: step >= s ? '#0F172A' : '#94A3B8', fontWeight: 'bold' }}>{s}</Text>
          </View>
          {s < 4 && <View style={[styles.stepLine, { backgroundColor: step > s ? theme.primary : 'rgba(255,255,255,0.1)' }]} />}
        </View>
      ))}
    </View>
  );

  const renderOptions = (options: any[], selected: string[], setSelected: any) => (
    <View style={styles.optionsGrid}>
      {options.map(opt => {
        const isSelected = selected.includes(opt.id);
        return (
          <TouchableOpacity
            key={opt.id}
            activeOpacity={0.8}
            onPress={() => toggleSelection(selected, setSelected, opt.id)}
            style={[
              styles.optionCard, 
              isSelected && styles.optionCardSelected,
              { flexDirection: isRTL ? 'row-reverse' : 'row', width: responsive.isMobile ? '100%' : '48%' }
            ]}
          >
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.iconWrapper, isSelected && { backgroundColor: 'rgba(180, 248, 44, 0.15)' }]}>
                <Ionicons name={opt.icon as any} size={24} color={isSelected ? theme.primary : '#94A3B8'} />
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={[styles.optionText, isSelected && { color: '#FFF' }, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? opt.labelAr : opt.label}
                </Text>
                {opt.noteAr && isRTL && (
                  <Text style={[styles.optionSubnote, isSelected && { color: 'rgba(255,255,255,0.7)' }]}>
                    {opt.noteAr}
                  </Text>
                )}
              </View>
            </View>
            <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', minWidth: 70 }}>
              <Text style={[styles.priceTag, isSelected && { color: theme.primary }]}>+${opt.price}</Text>
              {isRTL && (
                <Text style={[styles.egpTag, isSelected && { color: theme.primary }]}>
                  ~{(opt.price * 50).toLocaleString()} ج.م
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const handleGoBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.push('/');
    }
  };

  return (
    <ImageBackground source={bgImage} style={styles.bgContainer} resizeMode="cover">
      <View style={styles.darkBackdropOverlay} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Glass Header */}
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backCircleBtn}>
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isRTL ? 'المُسعّر الذكي للمشاريع' : 'Smart Project Estimator'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {renderStepIndicators()}

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              maxWidth: responsive.containerWidth as any,
              paddingHorizontal: responsive.isMobile ? 16 : 32,
              marginHorizontal: 'auto',
              width: '100%',
            }
          ]}
        >
          <View style={styles.glassContainer}>
            {step === 1 && (
              <View>
                <Text style={[styles.stepTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? '1. ما هي المنصات المستهدفة؟' : '1. Target Platforms?'}
                </Text>
                <Text style={[styles.stepSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? 'اختر المنصات التي ترغب في توفير تطبيقك عليها.' : 'Select the platforms you want to build for.'}
                </Text>
                {renderOptions(PLATFORMS, selectedPlatforms, setSelectedPlatforms)}
              </View>
            )}

            {step === 2 && (
              <View>
                <Text style={[styles.stepTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? '2. الميزات البرمجية المطلوبة' : '2. Required Features'}
                </Text>
                <Text style={[styles.stepSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? 'حدد الميزات الرئيسية التي يحتاجها مشروعك.' : 'Select the core functionalities your project needs.'}
                </Text>
                {renderOptions(FEATURES, selectedFeatures, setSelectedFeatures)}
              </View>
            )}

            {step === 3 && (
              <View>
                <Text style={[styles.stepTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? '3. خدمات إضافية (أوصي بها)' : '3. Extra Services (Recommended)'}
                </Text>
                <Text style={[styles.stepSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? 'خدمات استشارية وتشغيلية لضمان نجاح الإطلاق.' : 'Operational and advisory services for a successful launch.'}
                </Text>
                {renderOptions(EXTRAS, selectedExtras, setSelectedExtras)}
              </View>
            )}

            {step === 4 && (
              <View style={styles.summaryContainer}>
                <View style={styles.iconCircleBig}>
                  <Ionicons name="receipt" size={48} color={theme.primary} />
                </View>
                <Text style={styles.summaryTitle}>{isRTL ? 'الملخص والتكلفة المبدئية' : 'Summary & Estimated Cost'}</Text>
                
                <Text style={styles.totalCost}>${calculateTotal()}</Text>
                {isRTL && calculateTotal() > 0 && (
                  <Text style={styles.totalEgp}>~{(calculateTotal() * 50).toLocaleString()} جنيه مصري تقريباً</Text>
                )}
                
                <View style={[styles.timePill, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Ionicons name="time-outline" size={20} color="#38BDF8" />
                  <Text style={[styles.timeText, { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
                    {calculateTime()}
                  </Text>
                </View>

                <Text style={styles.summaryNotice}>
                  {isRTL ? 'هذه التكلفة والمدة مبدئية تنافسية لأقصى حد، ويتم تثبيتها في العقد الرسمي فور مراجعة متطلباتك الدقيقة.' : 'This cost and duration are rough estimates and may change based on specific details discussed during consultation.'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Floating Bottom Glass Bar */}
      <View style={[styles.bottomGlassBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} >
        <View style={[styles.bottomGlassContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={styles.bottomLabel}>{isRTL ? 'الإجمالي والمدة التقديرية' : 'Est. Total & Time'}</Text>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={styles.bottomTotal}>${calculateTotal()}</Text>
              {isRTL && calculateTotal() > 0 && (
                <Text style={styles.bottomEgp}>({(calculateTotal() * 50).toLocaleString()} ج.م)</Text>
              )}
              <Text style={[styles.bottomTime, { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>• {calculateTime()}</Text>
            </View>
          </View>
          
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 12, alignItems: 'center' }}>
            {step > 1 && (
              <TouchableOpacity 
                style={[styles.prevBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={() => setStep(step - 1)}
                disabled={loading}
              >
                <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={18} color="#CBD5E1" />
                <Text style={styles.prevBtnText}>{isRTL ? 'السابق' : 'Previous'}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.nextBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => step < 4 ? setStep(step + 1) : handleSubmit()}
              disabled={loading}
            >
              <Text style={styles.nextBtnText}>{step < 4 ? (isRTL ? 'التالي' : 'Next Step') : (isRTL ? 'إرسال وحفظ الطلب' : 'Submit Request')}</Text>
              {step < 4 ? (
                <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color="#0F172A" style={{ marginLeft: isRTL ? 4 : 8, marginRight: isRTL ? 8 : 4 }} />
              ) : (
                <Ionicons name="rocket-outline" size={18} color="#0F172A" style={{ marginLeft: isRTL ? 4 : 8, marginRight: isRTL ? 8 : 4 }} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#050505',
  },
  darkBackdropOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 15, 29, 0.85)',
  },
  safeArea: { flex: 1 },
  header: { 
    padding: 16, 
    alignItems: 'center', 
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  progressContainer: { 
    paddingVertical: 24, 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 4
  },
  stepCircle: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  stepLine: { width: 40, height: 2, marginHorizontal: 4 },
  scrollContent: { paddingBottom: 160 },
  glassContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any : {}),
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
  },
  stepTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  stepSubtitle: { color: '#94A3B8', fontSize: 14, marginBottom: 24 },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between'
  },
  optionCard: { 
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16, 
    padding: 16, 
    alignItems: 'center', 
    justifyContent: 'space-between',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(180, 248, 44, 0.05)',
    borderColor: '#B4F82C',
    shadowColor: '#B4F82C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionText: { color: '#94A3B8', fontSize: 15, fontWeight: '600' },
  priceTag: { color: '#CBD5E1', fontWeight: 'bold', fontSize: 16 },
  summaryContainer: { alignItems: 'center', paddingVertical: 20 },
  iconCircleBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(180, 248, 44, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(180, 248, 44, 0.3)'
  },
  summaryTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  totalCost: { color: '#B4F82C', fontSize: 56, fontWeight: '900', marginBottom: 16 },
  timePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  timeText: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: 'bold'
  },
  summaryNotice: { color: '#94A3B8', textAlign: 'center', lineHeight: 22, maxWidth: 500 },
  bottomGlassBar: { 
    position: 'absolute', 
    bottom: 0, left: 0, right: 0, 
    backgroundColor: 'rgba(10, 15, 29, 0.85)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any : {}),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  bottomGlassContent: {
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bottomLabel: { color: '#94A3B8', fontSize: 12, marginBottom: 4 },
  bottomTotal: { color: '#B4F82C', fontSize: 28, fontWeight: '900' },
  bottomTime: { color: '#38BDF8', fontSize: 14, fontWeight: 'bold' },
  nextBtn: { 
    backgroundColor: '#B4F82C',
    paddingHorizontal: 28, 
    paddingVertical: 14, 
    borderRadius: 30, 
    alignItems: 'center',
    shadowColor: '#B4F82C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  nextBtnText: { color: '#0F172A', fontWeight: 'bold', fontSize: 16 },
  prevBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  prevBtnText: {
    color: '#E2E8F0',
    fontWeight: '600',
    fontSize: 15,
  },
  egpTag: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  bottomEgp: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  totalEgp: {
    color: '#38BDF8',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  optionSubnote: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
  },
});
