import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useResponsive } from '../hooks/useResponsive';
import WhatsAppFAB from '../components/WhatsAppFAB';
import NotificationModal from '../components/NotificationModal';

export default function HomeScreen() {
  const router = useRouter();
  const { theme, activeTheme, t, isRTL, toggleTheme } = useSettings();
  const responsive = useResponsive();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);

  const isDark = activeTheme === 'dark' || activeTheme === 'black' || activeTheme === 'blue' || activeTheme === 'purple';

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={[
          styles.scrollContent, 
          { 
            maxWidth: responsive.containerWidth as any,
            paddingHorizontal: responsive.paddingHorizontal 
          }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Header */}
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.logoContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.logoText, { color: theme.text }]}>{t('appName')}</Text>
            <Text style={[styles.logoAccent, { color: theme.primary, marginLeft: isRTL ? 0 : 4, marginRight: isRTL ? 4 : 0 }]}>{t('appAccent')}</Text>
          </View>
          
          <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {/* Quick Theme Toggle */}
            <TouchableOpacity 
              onPress={toggleTheme} 
              style={[styles.settingsBtn, { borderColor: theme.border, backgroundColor: theme.btnBg }]}
              accessibilityLabel="Toggle Theme"
            >
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={theme.primary} />
            </TouchableOpacity>

            {/* In-App Notifications Bell */}
            <TouchableOpacity 
              onPress={() => setShowNotifications(true)} 
              style={[styles.settingsBtn, { borderColor: theme.border, backgroundColor: theme.btnBg, position: 'relative' }]}
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={18} color={theme.text} />
              {unreadCount > 0 && (
                <View style={{ position: 'absolute', top: -3, right: -3, backgroundColor: '#EF4444', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/settings')} 
              style={[styles.settingsBtn, { borderColor: theme.border, backgroundColor: theme.btnBg }]}
              accessibilityLabel="Settings"
            >
              <Ionicons name="settings-outline" size={18} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/login')}
              style={[styles.loginBtn, { borderColor: theme.border, backgroundColor: theme.btnBg }]}
            >
              <Text style={[styles.loginBtnText, { color: theme.primary }]}>{t('login')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.badge, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}40`, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }]}>
            <Ionicons name="rocket-outline" size={14} color={theme.primary} />
            <Text style={[styles.badgeText, { color: theme.primary }]}>{t('letsBuild')}</Text>
          </View>
          <Text style={[styles.heroTitle, { color: theme.text, fontSize: responsive.isMobile ? 28 : 42 }]}>{t('heroTitle1')}</Text>
          <Text style={[styles.heroGradientTitle, { color: theme.primary, fontSize: responsive.isMobile ? 28 : 42 }]}>{t('heroTitle2')}</Text>
          <Text style={[styles.heroSubtitle, { color: theme.textMuted, fontSize: responsive.isMobile ? 14 : 16 }]}>
            {t('heroSub')}
          </Text>
          
          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: theme.primary, maxWidth: responsive.isDesktop ? 400 : '100%' }]}
            onPress={() => router.push('/login')}
          >
            <Text style={[styles.primaryBtnText, { color: activeTheme === 'light' ? '#FFF' : '#000' }]}>{t('startProject')}</Text>
          </TouchableOpacity>
          
          <View style={[styles.actionGrid, { flexDirection: responsive.isMobile ? 'column' : 'row' }]}>
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push('/estimator')}
            >
              <Ionicons name="calculator-outline" size={28} color={theme.primary} style={{ marginBottom: 4 }} />
              <Text style={[styles.actionTitle, { color: theme.text }]} numberOfLines={2}>{t('costEstimator')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push('/portfolio')}
            >
              <Ionicons name="sparkles-outline" size={28} color={theme.primary} style={{ marginBottom: 4 }} />
              <Text style={[styles.actionTitle, { color: theme.text }]} numberOfLines={2}>{isRTL ? 'هويتنا وأعمالنا' : 'Identity & Portfolio'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('coreOfferings')}</Text>
          
          <View style={[styles.servicesGrid, { flexDirection: responsive.isDesktop ? 'row' : 'column', gap: 16 }]}>
            <View style={[styles.serviceCard, { backgroundColor: theme.card, borderColor: theme.border, alignItems: isRTL ? 'flex-end' : 'flex-start', flex: responsive.isDesktop ? 1 : undefined }]}>
              <Ionicons name="globe-outline" size={32} color={theme.primary} style={{ marginBottom: 8 }} />
              <Text style={[styles.serviceTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{t('webDev')}</Text>
              <Text style={[styles.serviceDesc, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('webDevDesc')}</Text>
            </View>
            
            <View style={[styles.serviceCard, { backgroundColor: theme.card, borderColor: theme.border, alignItems: isRTL ? 'flex-end' : 'flex-start', flex: responsive.isDesktop ? 1 : undefined }]}>
              <Ionicons name="phone-portrait-outline" size={32} color={theme.primary} style={{ marginBottom: 8 }} />
              <Text style={[styles.serviceTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{t('mobileApp')}</Text>
              <Text style={[styles.serviceDesc, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('mobileAppDesc')}</Text>
            </View>

            <View style={[styles.serviceCard, { backgroundColor: theme.card, borderColor: theme.border, alignItems: isRTL ? 'flex-end' : 'flex-start', flex: responsive.isDesktop ? 1 : undefined }]}>
              <Ionicons name="hardware-chip-outline" size={32} color={theme.primary} style={{ marginBottom: 8 }} />
              <Text style={[styles.serviceTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{t('customSys')}</Text>
              <Text style={[styles.serviceDesc, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('customSysDesc')}</Text>
            </View>
          </View>
        </View>

        {/* Client Testimonials & Trust Section */}
        <View style={styles.testimonialsSection}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Ionicons name="star" size={20} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
              {isRTL ? 'آراء وتجارب شركاء النجاح' : 'What Our Clients Say'}
            </Text>
          </View>

          {/* Stats Row */}
          <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>+45</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]} numberOfLines={1}>{isRTL ? 'مشروع مكتمل' : 'Shipped Apps'}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>99.4%</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]} numberOfLines={1}>{isRTL ? 'نسبة الرضا' : 'Client Satisfaction'}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.statNumber, { color: '#F59E0B' }]}>24/7</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]} numberOfLines={1}>{isRTL ? 'دعم مستمر' : 'Direct Support'}</Text>
            </View>
          </View>

          {/* Testimonial Cards */}
          <View style={[styles.testimonialCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={14} color="#F59E0B" />
                ))}
              </View>
              <Text style={{ color: theme.primary, fontSize: 11, fontWeight: 'bold' }}>VERIFIED CLIENT</Text>
            </View>
            <Text style={[styles.testimonialText, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL 
                ? '"فريق Apex طور تطبيق متجرنا الإلكتروني في 3 أسابيع فقط! دقة المواعيد ومتابعة مراحل المشروع عبر لوحة التحكم أمر رائع واحترافي جداً."'
                : '"Apex Devs built our e-commerce platform in just 3 weeks! Milestone tracking and clear sprint deliverables made all the difference."'}
            </Text>
            <Text style={[styles.testimonialAuthor, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'أ. أحمد الشناوي — CEO, TrendTech Solutions' : 'Ahmed El-Shennawy — CEO, TrendTech Solutions'}
            </Text>
          </View>

          <View style={[styles.testimonialCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={14} color="#F59E0B" />
                ))}
              </View>
              <Text style={{ color: theme.primary, fontSize: 11, fontWeight: 'bold' }}>VERIFIED CLIENT</Text>
            </View>
            <Text style={[styles.testimonialText, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL 
                ? '"أفضل وكالة تعاملت معها برمجياً؛ التواصل الفوري عبر الشات مع المهندسين وحاسبة التكلفة الشفافة بدون أي تكاليف خفية وفرت علينا الكثير."'
                : '"Best software agency experience! Real-time developer chat and transparent cost calculator without hidden fees saved us immense time."'}
            </Text>
            <Text style={[styles.testimonialAuthor, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'د. سارة المنصوري — Founder, HealthCare Plus' : 'Dr. Sara Mansour — Founder, HealthCare Plus'}
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* WhatsApp Floating Consultation Button */}
      <WhatsAppFAB />

      {/* In-App Notifications Sheet */}
      <NotificationModal 
        visible={showNotifications} 
        onClose={() => setShowNotifications(false)} 
        unreadCount={unreadCount} 
        setUnreadCount={setUnreadCount} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    paddingBottom: 40,
    alignItems: 'center',
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    width: '100%',
    flexWrap: 'wrap',
    gap: 8,
  },
  logoContainer: { alignItems: 'center' },
  logoText: { fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  logoAccent: { fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  headerActions: { alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  settingsBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 36,
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnText: { fontSize: 13, fontWeight: '700' },
  heroSection: { marginTop: 24, alignItems: 'center', width: '100%' },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  badgeText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  heroTitle: { fontWeight: '900', textAlign: 'center' },
  heroGradientTitle: { fontWeight: '900', textAlign: 'center', marginBottom: 16 },
  heroSubtitle: { textAlign: 'center', lineHeight: 24, marginBottom: 24, paddingHorizontal: 10 },
  primaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryBtnText: { fontSize: 16, fontWeight: 'bold' },
  servicesSection: { marginTop: 40, width: '100%' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  servicesGrid: { width: '100%' },
  serviceCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    width: '100%',
  },
  serviceIcon: { fontSize: 28, marginBottom: 10, textAlign: 'left' },
  serviceTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 6, textAlign: 'left' },
  serviceDesc: { fontSize: 13, lineHeight: 20, textAlign: 'left' },
  actionGrid: {
    width: '100%',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  testimonialsSection: {
    marginTop: 36,
    width: '100%',
  },
  statsRow: {
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  statBox: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  testimonialCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    width: '100%',
  },
  testimonialText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  testimonialAuthor: {
    fontSize: 11,
    fontWeight: '600',
  },
});
