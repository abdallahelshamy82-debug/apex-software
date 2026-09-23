import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useResponsive } from '../hooks/useResponsive';
import WhatsAppFAB from '../components/WhatsAppFAB';
import NotificationModal from '../components/NotificationModal';
import FloatingGlassNav from '../components/FloatingGlassNav';
import ScrollReveal from '../components/ScrollReveal';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolation,
  withDelay,
  withTiming,
  withSpring,
  withRepeat,
  Easing
} from 'react-native-reanimated';

const bgImage = require('../../assets/images/login-bg-dev.jpg');

const BackgroundBlobs = () => {
  const rotation1 = useSharedValue(0);
  const rotation2 = useSharedValue(0);

  useEffect(() => {
    rotation1.value = withRepeat(withTiming(360, { duration: 25000, easing: Easing.linear }), -1, false);
    rotation2.value = withRepeat(withTiming(-360, { duration: 30000, easing: Easing.linear }), -1, false);
  }, []);

  const style1 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation1.value}deg` }, { translateX: 50 }, { scale: 1.2 }]
  }));
  const style2 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation2.value}deg` }, { translateX: -80 }, { scale: 1.5 }]
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      <Animated.View style={[{ position: 'absolute', top: '-10%', left: '-10%', width: 500, height: 500, borderRadius: 250, backgroundColor: 'rgba(168, 85, 247, 0.15)', ...(Platform.OS === 'web' ? { filter: 'blur(100px)' } as any : {}) }, style1]} />
      <Animated.View style={[{ position: 'absolute', bottom: '-10%', right: '-10%', width: 600, height: 600, borderRadius: 300, backgroundColor: 'rgba(56, 189, 248, 0.12)', ...(Platform.OS === 'web' ? { filter: 'blur(120px)' } as any : {}) }, style2]} />
    </View>
  );
};

const AnimatedReveal = ({ children, delay = 0, style }: any) => {
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 80 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, [delay]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
};

export default function HomeScreen() {
  const router = useRouter();
  const { theme, t, isRTL } = useSettings();
  const responsive = useResponsive();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const { height } = useWindowDimensions();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const heroAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 300], [1, 0], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, [0, 300], [0, -50], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <ImageBackground source={bgImage} style={styles.bgContainer} resizeMode="cover">
      <View style={styles.darkBackdropOverlay} />
      <BackgroundBlobs />
      
      <SafeAreaView style={styles.safeArea}>
        <Animated.ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: responsive.isMobile ? 16 : 32 }
          ]} 
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          {/* Glass Header */}
          <View style={[styles.glassHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.brandBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
               <Ionicons name="hardware-chip" size={24} color="#B4F82C" />
               <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start', marginHorizontal: 8 }}>
                 <Text style={styles.brandTitle}>APEX SOFTWARE</Text>
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
                   <TouchableOpacity onPress={() => router.push('/portfolio')} style={styles.navLink}>
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
                 onPress={() => router.push('/login')}
                 style={styles.clientPortalBtn}
               >
                 <Text style={styles.clientPortalText}>{isRTL ? 'بوابة العملاء' : 'Client Portal'}</Text>
               </TouchableOpacity>
            </View>
          </View>

          {/* Hero Section */}
          <Animated.View style={[styles.heroSection, heroAnimatedStyle]}>
            <AnimatedReveal delay={100}>
              <View style={[styles.heroBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Ionicons name="rocket-outline" size={14} color="#38BDF8" />
                <Text style={styles.heroBadgeText}>
                  {isRTL ? '✦ استوديو أبكس • لتقنيات المستقبل' : '✦ APEX SOFTWARE STUDIO • NEXT-GEN TECH'}
                </Text>
              </View>
            </AnimatedReveal>
            
            <AnimatedReveal delay={300}>
              <Text style={[styles.heroTitle, { fontSize: responsive.isMobile ? 32 : 54 }]}>
                {isRTL ? 'نبتكر ونصنع البرمجيات التي ' : 'Engineering Scalable Software That '}
                <Text style={styles.heroTitleHighlight}>{isRTL ? 'تقود مستقبلك' : 'Drives the Future'}</Text>
              </Text>
            </AnimatedReveal>
            
            <AnimatedReveal delay={500}>
              <Text style={[styles.heroSubtitle, { fontSize: responsive.isMobile ? 14 : 18 }]}>
                {isRTL 
                  ? 'شريكك التقني في بناء وتطوير أنظمة الويب، تطبيقات الجوال المتطورة، والحلول السحابية المتقدمة.'
                  : 'Your technology partner for enterprise web systems, high-performance mobile apps, and cloud AI solutions.'}
              </Text>
            </AnimatedReveal>

            <AnimatedReveal delay={700}>
              <View style={[styles.actionButtonsRow, { flexDirection: responsive.isMobile ? 'column' : (isRTL ? 'row-reverse' : 'row') }]}>
                 <TouchableOpacity 
                   style={styles.primaryActionBtn}
                   onPress={() => router.push('/estimator')}
                 >
                   <Text style={styles.primaryActionText}>{isRTL ? 'ابدأ مشروعك' : 'Start Project'}</Text>
                   <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={18} color="#0F172A" style={{ marginHorizontal: 8 }} />
                 </TouchableOpacity>
                 
                 <TouchableOpacity 
                   style={styles.secondaryActionBtn}
                   onPress={() => router.push('/portfolio')}
                 >
                   <Text style={styles.secondaryActionText}>{isRTL ? 'استكشف أعمالنا' : 'Explore Portfolio'}</Text>
                 </TouchableOpacity>
              </View>
            </AnimatedReveal>

            <AnimatedReveal delay={900}>
              <View style={[styles.techChipsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.techChip}>
                  <Ionicons name="code-slash-outline" size={14} color="#B4F82C" style={{ marginHorizontal: 4 }} />
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
          </Animated.View>

          {/* Quick Access Glass Cards */}
          <ScrollReveal scrollY={scrollY} style={[styles.glassGrid, { flexDirection: responsive.isDesktop ? (isRTL ? 'row-reverse' : 'row') : 'column' }]}>
             <TouchableOpacity style={styles.glassCard} onPress={() => router.push('/estimator')}>
               <Ionicons name="calculator-outline" size={32} color="#B4F82C" style={{ marginBottom: 12 }} />
               <Text style={[styles.glassCardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                 {isRTL ? 'حاسبة التكلفة الذكية' : 'Smart Estimator'}
               </Text>
               <Text style={[styles.glassCardDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
                 {isRTL ? 'احصل على تقدير دقيق لتكلفة مشروعك التقني في دقائق معدودة.' : 'Get an accurate cost estimate for your tech project in minutes.'}
               </Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.glassCard} onPress={() => router.push('/copilot')}>
               <Ionicons name="hardware-chip-outline" size={32} color="#38BDF8" style={{ marginBottom: 12 }} />
               <Text style={[styles.glassCardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                 {isRTL ? 'المساعد الذكي (AI)' : 'AI Copilot'}
               </Text>
               <Text style={[styles.glassCardDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
                 {isRTL ? 'استشر خبيرنا الاصطناعي لتخطيط بنية مشروعك التقني.' : 'Consult our AI expert to architect your software project.'}
               </Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.glassCard} onPress={() => router.push('/portfolio')}>
               <Ionicons name="sparkles-outline" size={32} color="#A78BFA" style={{ marginBottom: 12 }} />
               <Text style={[styles.glassCardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                 {isRTL ? 'أعمالنا ومشاريعنا' : 'Our Portfolio'}
               </Text>
               <Text style={[styles.glassCardDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
                 {isRTL ? 'تصفح سابقة أعمالنا في تطوير التطبيقات والأنظمة السحابية.' : 'Browse our successful projects in mobile apps and cloud systems.'}
               </Text>
             </TouchableOpacity>
          </ScrollReveal>

          {/* Stats Section */}
          <ScrollReveal scrollY={scrollY} delay={100} style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap' }]}>
             <View style={styles.statBox}>
                <Text style={styles.statNumber}>+50</Text>
                <Text style={styles.statLabel}>{isRTL ? 'مشروع مكتمل' : 'Shipped Projects'}</Text>
             </View>
             <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#38BDF8' }]}>99.8%</Text>
                <Text style={styles.statLabel}>{isRTL ? 'نسبة الرضا' : 'Satisfaction'}</Text>
             </View>
             <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#F59E0B' }]}>24/7</Text>
                <Text style={styles.statLabel}>{isRTL ? 'دعم مستمر' : 'Support'}</Text>
             </View>
             <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#A78BFA' }]}><Text style={{fontSize: 20}}>{'<'}</Text>3w</Text>
                <Text style={styles.statLabel}>{isRTL ? 'تسليم الـ MVP' : 'MVP Delivery'}</Text>
             </View>
          </ScrollReveal>

          {/* Bottom Padding for mobile nav */}
          <View style={{ height: responsive.isMobile ? 120 : 60 }} />
        </Animated.ScrollView>
      </SafeAreaView>

      <WhatsAppFAB />
      
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
    marginHorizontal: 'auto',
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
