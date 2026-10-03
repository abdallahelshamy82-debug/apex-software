import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Image, Platform, Linking } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useResponsive } from '../hooks/useResponsive';
import NotificationModal from '../components/NotificationModal';
import FloatingGlassNav from '../components/FloatingGlassNav';
import ScrollReveal from '../components/ScrollReveal';
import AnimatedReveal from '../components/AnimatedReveal';
import InteractiveCard from '../components/InteractiveCard';

const bgImage = require('../../assets/images/login-bg-dev.jpg');

let hasAutoRedirectedOnLaunch = false;

export default function HomeScreen() {
  const router = useRouter();
  const { theme, t, isRTL, currentUser, isAppReady } = useSettings();
  const responsive = useResponsive();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  //  Persistent Login: Auto-route to Dashboard on launch if user is already authenticated
  useEffect(() => {
    if (!hasAutoRedirectedOnLaunch && isAppReady && currentUser) {
      hasAutoRedirectedOnLaunch = true;
      const target = (currentUser.role === 'admin' || currentUser.isAdmin)
        ? '/admin'
        : '/dashboard';
      router.replace(target as any);
    }
  }, [isAppReady, currentUser]);

  //  Dynamic Notifications: only count if user is logged in
  useEffect(() => {
    if (currentUser) {
      // Don't show fake notifications, start clean
      setUnreadCount(0);
    } else {
      setUnreadCount(0);
    }
  }, [currentUser]);

  return (
    <ImageBackground source={bgImage} style={styles.bgContainer} resizeMode="cover">
      <View style={styles.darkBackdropOverlay} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Glass Header */}
          <View style={[styles.glassHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.brandBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
               <Image 
                 source={require('../../assets/images/icon.png')} 
                 style={{ width: 28, height: 28, borderRadius: 7 }} 
                 resizeMode="contain" 
               />
               <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start', marginHorizontal: 8 }}>
                 <Text style={styles.brandTitle}>MAGIXA</Text>
                 <Text style={styles.brandTagline}>{isRTL ? 'ستوديو التقنية' : 'TECH STUDIO'}</Text>
               </View>
            </View>

            <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
               {responsive.isDesktop && (
                 <>
                   <TouchableOpacity onPress={() => router.push('/estimator')} style={styles.navLink}>
                     <Text style={styles.navLinkText}>{isRTL ? 'التكلفة' : 'Estimator'}</Text>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => router.push('/copilot')} style={styles.navLink}>
                     <Text style={styles.navLinkText}>{isRTL ? 'المساعد الذكي' : 'Copilot'}</Text>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => Linking.openURL('https://apex-web-blond.vercel.app')} style={styles.navLink}>
                     <Text style={styles.navLinkText}>{isRTL ? 'أعمالنا' : 'Portfolio'}</Text>
                   </TouchableOpacity>
                 </>
               )}

               <TouchableOpacity 
                 onPress={() => setShowNotifications(true)} 
                 style={styles.iconBtn}
               >
                 <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
                 {unreadCount > 0 && (
                   <View style={styles.badge}>
                     <Text style={styles.badgeText}>{unreadCount}</Text>
                   </View>
                 )}
               </TouchableOpacity>

               <TouchableOpacity 
                 onPress={() => {
                   if (currentUser) {
                     const target = (currentUser.role === 'admin' || currentUser.isAdmin)
                       ? '/admin'
                       : '/dashboard';
                     router.push(target as any);
                   } else {
                     router.push('/login');
                   }
                 }}
                 style={[styles.clientPortalBtn, currentUser ? { borderColor: `${theme.primary}66`, backgroundColor: `${theme.primary}15` } : {}]}
               >
                 <Ionicons 
                   name={currentUser ? 'grid-outline' : 'person-outline'} 
                   size={14} 
                   color={theme.primary} 
                   style={{ marginRight: isRTL ? 0 : 5, marginLeft: isRTL ? 5 : 0 }} 
                 />
                 <Text style={[styles.clientPortalText, { color: theme.primary }]}>
                   {currentUser 
                     ? (isRTL ? 'لوحة التحكم' : 'Dashboard') 
                     : (isRTL ? 'بوابة العملاء' : 'Client Portal')}
                 </Text>
               </TouchableOpacity>
            </View>
          </View>

          
        <Animated.ScrollView 
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          style={{ flex: 1 }} 
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: responsive.isMobile ? 16 : 32, paddingBottom: 120 }
          ]} 
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <AnimatedReveal delay={100}>
              <View style={[styles.heroBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Ionicons name="rocket-outline" size={14} color="#38BDF8" />
                <Text style={styles.heroBadgeText}>
                  {isRTL ? 'ماجيكسا • تقنيات الجيل القادم' : 'MAGIXA STUDIO • NEXT-GEN TECH'}
                </Text>
              </View>
            </AnimatedReveal>
            
            <AnimatedReveal delay={300}>
              <Text style={[styles.heroTitle, { fontSize: responsive.isMobile ? 32 : 54 }]}>
                {isRTL ? 'نبتكر ونصنع البرمجيات التي ' : 'Engineering Scalable Software That '}
                <Text style={[styles.heroTitleHighlight, { color: theme.primary }]}>{isRTL ? 'تقود مستقبلك' : 'Drives the Future'}</Text>
              </Text>
            </AnimatedReveal>
            
            <AnimatedReveal delay={500}>
              <Text style={[styles.heroSubtitle, { fontSize: responsive.isMobile ? 14 : 18 }]}>
                {isRTL 
                  ? 'شريكك التقني في بناء وتطوير أنظمة الويب، تطبيقات الجوال المتطورة، والحلول السحابية المتقدّمة.'
                  : 'Your technology partner for enterprise web systems, high-performance mobile apps, and cloud AI solutions.'}
              </Text>
            </AnimatedReveal>

            <AnimatedReveal delay={700}>
              <View style={[styles.actionButtonsRow, { flexDirection: responsive.isMobile ? 'column' : (isRTL ? 'row-reverse' : 'row') }]}>
               <TouchableOpacity 
                 style={[styles.primaryActionBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
                 onPress={() => router.push('/estimator')}
               >
                 <Text style={styles.primaryActionText}>{isRTL ? 'ابدأ مشروعك' : 'Start Project'}</Text>
                 <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={18} color="#0F172A" style={{ marginHorizontal: 8 }} />
               </TouchableOpacity>
               
               <TouchableOpacity 
                 style={styles.secondaryActionBtn}
                 onPress={() => Linking.openURL('https://apex-web-blond.vercel.app')}
               >
                 <Text style={styles.secondaryActionText}>{isRTL ? 'استكشف أعمالنا' : 'Explore Portfolio'}</Text>
               </TouchableOpacity>
            </View>
            </AnimatedReveal>

            <AnimatedReveal delay={900}>
            <View style={[styles.techChipsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.techChip}>
                <Ionicons name="code-slash-outline" size={14} color={theme.primary} style={{ marginHorizontal: 4 }} />
                <Text style={styles.techChipText}>{isRTL ? 'تطوير برمجيات' : 'Software Dev'}</Text>
              </View>
              <View style={styles.techChip}>
                <Ionicons name="logo-react" size={14} color="#38BDF8" style={{ marginHorizontal: 4 }} />
                <Text style={styles.techChipText}>{isRTL ? 'تطبيقات الجوال' : 'Mobile Apps'}</Text>
              </View>
              <View style={styles.techChip}>
                <Ionicons name="cloud-outline" size={14} color="#A78BFA" style={{ marginHorizontal: 4 }} />
                <Text style={styles.techChipText}>{isRTL ? 'سحابة و AI' : 'Cloud & AI'}</Text>
              </View>
            </View>
            </AnimatedReveal>
          </View>

          <ScrollReveal scrollY={scrollY} delay={100}>
            {/* Quick Access Glass Cards */}
            <View style={[styles.glassGrid, { flexDirection: responsive.isDesktop ? (isRTL ? 'row-reverse' : 'row') : 'column' }]}>
               <InteractiveCard style={styles.glassCard} onPress={() => router.push('/estimator')}>
                 <Ionicons name="calculator-outline" size={32} color={theme.primary} style={{ marginBottom: 12 }} />
                 <Text style={[styles.glassCardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                   {isRTL ? 'حاسبة التكلفة الذكية' : 'Smart Cost Estimator'}
                 </Text>
                 <Text style={[styles.glassCardDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
                   {isRTL ? 'احصل على تقدير دقيق لتكلفة مشروعك التقني في دقائق معدودة.' : 'Get a precise, AI-driven cost estimate for your project.'}
                 </Text>
               </InteractiveCard>
               
               <InteractiveCard style={styles.glassCard} onPress={() => router.push('/dashboard')}>
                 <Ionicons name="hardware-chip-outline" size={32} color="#38BDF8" style={{ marginBottom: 12 }} />
                 <Text style={[styles.glassCardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                   {isRTL ? 'المساعد الذكي (AI)' : 'AI Copilot Assistant'}
                 </Text>
                 <Text style={[styles.glassCardDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
                   {isRTL ? 'استشر خبيرنا الاصطناعي لتخطيط بنية مشروعك التقني.' : 'Chat with our AI to architect your software perfectly.'}
                 </Text>
               </InteractiveCard>
               
               <InteractiveCard style={styles.glassCard} onPress={() => Linking.openURL('https://apex-web-blond.vercel.app')}>
                 <Ionicons name="sparkles-outline" size={32} color="#A78BFA" style={{ marginBottom: 12 }} />
                 <Text style={[styles.glassCardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                   {isRTL ? 'أعمالنا ومشاريعنا' : 'Portfolio & Case Studies'}
                 </Text>
                 <Text style={[styles.glassCardDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
                   {isRTL ? 'تصفح سابقة أعمالنا في تطوير التطبيقات والأنظمة السحابية.' : 'Explore our world-class projects and client successes.'}
                 </Text>
               </InteractiveCard>
            </View>
          </ScrollReveal>

          <ScrollReveal scrollY={scrollY} delay={300}>
            {/* Stats Section */}
            <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: responsive.isMobile ? 'wrap' : 'nowrap' }]}>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: theme.primary }]}>+50</Text>
                <Text style={styles.statLabel}>{isRTL ? 'مشروع مكتمل' : 'Shipped Apps'}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#38BDF8' }]}>99.8%</Text>
                <Text style={styles.statLabel}>{isRTL ? 'نسبة الرضا' : 'Client Satisfaction'}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#F59E0B' }]}>24/7</Text>
                <Text style={styles.statLabel}>{isRTL ? 'دعم مستمر' : 'Support SLA'}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#A78BFA' }]}>&lt;3w</Text>
                <Text style={styles.statLabel}>{isRTL ? 'تسليم الـ MVP' : 'Avg. MVP Delivery'}</Text>
              </View>
            </View>
          </ScrollReveal>

          {/* Bottom Padding for mobile nav */}
          <View style={{ height: responsive.isMobile ? 120 : 60 }} />
        </Animated.ScrollView>
      </SafeAreaView>

      {responsive.isMobile && <FloatingGlassNav />}

      <NotificationModal 
        visible={showNotifications} 
        onClose={() => setShowNotifications(false)} 
        unreadCount={unreadCount} 
        setUnreadCount={setUnreadCount} 
      />
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
  scrollContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingTop: 24,
  },
  glassHeader: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)' } : {}),
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  brandBadge: {
    alignItems: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandTagline: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 2,
  },
  headerActions: {
    alignItems: 'center',
    gap: 16,
  },
  navLink: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navLinkText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  clientPortalBtn: {
    backgroundColor: 'rgba(180, 248, 44, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(180, 248, 44, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  clientPortalText: {
    color: '#B4F82C',
    fontSize: 14,
    fontWeight: '700',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  heroBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  heroBadgeText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 64,
    marginBottom: 24,
    maxWidth: 900,
  },
  heroTitleHighlight: {
    color: '#B4F82C',
  },
  heroSubtitle: {
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 600,
    marginBottom: 40,
  },
  actionButtonsRow: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 40,
  },
  primaryActionBtn: {
    backgroundColor: '#B4F82C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    minWidth: 200,
    shadowColor: '#B4F82C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  primaryActionText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryActionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {}),
  },
  secondaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  techChipsRow: {
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  techChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  techChipText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  glassGrid: {
    gap: 20,
    marginBottom: 60,
  },
  glassCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)' } : {}),
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
  },
  glassCardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  glassCardDesc: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
  },
  statsRow: {
    gap: 16,
    marginBottom: 40,
    justifyContent: 'center',
  },
  statBox: {
    flex: 1,
    minWidth: 140,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {}),
  },
  statNumber: {
    color: '#B4F82C',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 8,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
