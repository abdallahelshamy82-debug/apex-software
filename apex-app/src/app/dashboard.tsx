import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Linking, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettings } from '../context/SettingsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import ApexLoader from '../components/ApexLoader';
import { Skeleton } from '../components/Skeleton';
import WhatsAppFAB from '../components/WhatsAppFAB';
import NotificationModal from '../components/NotificationModal';
import ProjectRoadmap from '../components/ProjectRoadmap';
import { api } from '../services/api';
import { haptics } from '../utils/haptics';
import { useResponsive } from '../hooks/useResponsive';

export default function DashboardScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const { theme, t, isRTL, activeTheme, currentUser, setCurrentUser, toggleTheme } = useSettings();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [selectedQuoteIdx, setSelectedQuoteIdx] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [quotesRes, meRes, notifRes] = await Promise.all([
        api.getMyQuotes(),
        api.getMe(),
        api.getNotifications(),
      ]);

      if (quotesRes?.isOffline || meRes?.isOffline || notifRes?.isOffline) {
        setIsOffline(true);
      } else {
        setIsOffline(false);
      }

      if (quotesRes?.success && quotesRes.quotes) {
        setQuotes(quotesRes.quotes);
      }
      if (meRes?.success && meRes.user) {
        setCurrentUser(meRes.user);
        await AsyncStorage.setItem('userData', JSON.stringify(meRes.user));
      }
      if (notifRes?.success && notifRes.notifications) {
        setNotifications(notifRes.notifications);
        const unread = notifRes.notifications.filter((n: any) => n.unread).length;
        setUnreadCount(unread);
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  }, [setCurrentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    await loadData();
    setRefreshing(false);
  };

  if (loading && !currentUser) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
        {/* Skeleton Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <Skeleton height={24} width={120} theme={theme} borderRadius={6} />
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 12 }}>
            <Skeleton variant="circular" width={38} theme={theme} />
            <Skeleton variant="circular" width={38} theme={theme} />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {/* Main Card Skeleton */}
          <Skeleton height={220} borderRadius={24} theme={theme} style={{ marginBottom: 16 }} />
          
          {/* Action Grid Skeleton */}
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 12, marginBottom: 16 }}>
            <Skeleton height={100} width="48%" borderRadius={16} theme={theme} style={{ flex: 1 }} />
            <Skeleton height={100} width="48%" borderRadius={16} theme={theme} style={{ flex: 1 }} />
          </View>

          {/* Timeline / Secondary Card Skeleton */}
          <Skeleton height={140} borderRadius={20} theme={theme} style={{ marginBottom: 16 }} />
          <Skeleton height={80} borderRadius={16} theme={theme} style={{ marginBottom: 16 }} />
          <Skeleton height={80} borderRadius={16} theme={theme} style={{ marginBottom: 16 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isDark = activeTheme === 'dark' || activeTheme === 'black' || activeTheme === 'blue' || activeTheme === 'purple';

  const activeQuote = quotes[selectedQuoteIdx] || quotes[0] || null;
  const hasActiveProject = !!(
    (quotes && quotes.length > 0) ||
    (currentUser?.projectName && currentUser?.projectName !== 'لا يوجد' && (currentUser?.projectProgress || 0) > 0)
  );

  let userTasks: { id: string; title: string; completed: boolean }[] = [];
  try {
    if (currentUser?.projectTasks) {
      userTasks = typeof currentUser.projectTasks === 'string' 
        ? JSON.parse(currentUser.projectTasks) 
        : currentUser.projectTasks;
    }
    if (!Array.isArray(userTasks)) userTasks = [];
  } catch (e) {
    userTasks = [];
  }

  let userDeliverables: { id: string; title: string; url: string; type: string }[] = [];
  try {
    if (currentUser?.projectDeliverables) {
      userDeliverables = typeof currentUser.projectDeliverables === 'string'
        ? JSON.parse(currentUser.projectDeliverables)
        : currentUser.projectDeliverables;
    }
    if (!Array.isArray(userDeliverables)) userDeliverables = [];
  } catch (e) {
    userDeliverables = [];
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8 }]}>
        <View style={[styles.headerLeft, { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }]}>
          <TouchableOpacity 
            onPress={() => { 
              haptics.light();
              if (router.canGoBack()) router.back(); else router.push('/'); 
            }} 
            style={styles.backBtn}
          >
            <Text style={[styles.backBtnText, { color: theme.primary }]}>{t('back')}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
            {t('dashboard')}
          </Text>
        </View>

        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Quick Theme Toggle */}
          <TouchableOpacity 
            onPress={() => {
              haptics.selection();
              toggleTheme();
            }} 
            style={[styles.settingsBtn, { borderColor: theme.border, backgroundColor: theme.btnBg }]}
            accessibilityLabel="Toggle Theme"
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={theme.primary} />
          </TouchableOpacity>

          {/* In-App Notifications Bell */}
          <TouchableOpacity 
            onPress={() => {
              haptics.light();
              setShowNotifications(true);
            }} 
            style={[styles.settingsBtn, { borderColor: theme.border, backgroundColor: theme.btnBg, position: 'relative' }]}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={16} color={theme.text} />
            {unreadCount > 0 && (
              <View style={{ position: 'absolute', top: -3, right: -3, backgroundColor: '#EF4444', borderRadius: 7, width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {(currentUser?.role === 'admin' || currentUser?.email?.toLowerCase() === 'abdallahelshamy82@gmail.com') && (
            <TouchableOpacity 
              onPress={() => {
                haptics.light();
                router.push('/admin');
              }} 
              style={[styles.settingsBtn, { borderColor: theme.border, backgroundColor: theme.btnBg }]}
              accessibilityLabel="Admin"
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.primary} />
            </TouchableOpacity>
          )}

          {/* User Profile Button */}
          <TouchableOpacity 
            onPress={() => {
              haptics.light();
              router.push('/profile');
            }} 
            style={[styles.settingsBtn, { borderColor: theme.border, backgroundColor: theme.btnBg }]}
            accessibilityLabel="Profile"
          >
            <Ionicons name="person-outline" size={18} color={theme.text} />
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity 
            onPress={() => {
              haptics.light();
              router.push('/settings');
            }} 
            style={[styles.settingsBtn, { borderColor: theme.border, backgroundColor: theme.btnBg }]}
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Offline Status Banner */}
      {isOffline && (
        <View style={[styles.offlineBanner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <Ionicons name="cloud-offline" size={18} color="#B45309" />
            <Text style={{ color: '#92400E', fontSize: 12, fontWeight: 'bold', flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
              {isRTL ? 'وضع عدم الاتصال: يتم عرض البيانات المحفوظة محلياً' : 'Offline Mode: Showing cached data'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              haptics.medium();
              loadData();
            }}
            style={styles.retryBtn}
          >
            <Text style={styles.retryBtnText}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content Area */}
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
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={theme.primary} 
            colors={[theme.primary]}
          />
        }
      >
        
        {/* Welcome Section */}
        <Text style={[styles.welcomeText, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? `مرحباً، ${currentUser?.fullName || 'عميلنا العزيز'}` : `Welcome, ${currentUser?.fullName || 'Valued Client'}`}
        </Text>

        {/* AI Copilot Hero Banner Card */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => {
            haptics.medium();
            router.push('/copilot');
          }}
          style={[
            styles.aiCopilotCard,
            {
              backgroundColor: activeTheme === 'light' ? '#0F172A' : '#0B132B',
              borderColor: '#38BDF8',
            }
          ]}
        >
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={styles.aiLiveDot} />
              <Ionicons name="sparkles" size={16} color="#38BDF8" />
              <Text style={{ color: '#38BDF8', fontSize: 13, fontWeight: '900', letterSpacing: 0.5, flexShrink: 1 }}>
                {isRTL ? 'مستشار Apex الذكي (AI Project Copilot)' : 'Apex AI Project Copilot'}
              </Text>
            </View>
            <View style={[styles.aiTagBadge, { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }]}>
              <Ionicons name="flash" size={11} color="#0B132B" />
              <Text style={styles.aiTagBadgeText}>{isRTL ? 'تحليل فوري' : 'Instant AI'}</Text>
            </View>
          </View>

          <Text style={[styles.aiCardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'تحدث بالصوت أو اكتب فكرتك وسيقوم الذكاء الاصطناعي بكل شيء!' : 'Speak or write your idea and let AI handle everything!'}
          </Text>
          <Text style={[styles.aiCardSub, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL 
              ? 'تقسيم المنصات، اقتراح المزايا، حساب التكلفة والجدول الزمني، وزر تحويل لتعاقد فوري بضغطة زر.'
              : 'Architects platforms, recommends features, calculates budget & timeline with 1-click contract!'}
          </Text>

          <View style={[styles.aiCardFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="mic-outline" size={15} color="#38BDF8" />
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>{isRTL ? 'يدعم الصوت والكتابة' : 'Voice & Text'}</Text>
            </View>
            <View style={[styles.aiLaunchBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.aiLaunchBtnText}>{isRTL ? 'ابدأ الاستشارة الآن' : 'Launch Copilot'}</Text>
              <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={13} color="#0B132B" />
            </View>
          </View>
        </TouchableOpacity>

        {/* CONDITIONAL RENDERING: Has Active Project/Orders vs No Active Orders */}
        {!hasActiveProject ? (
          /* Empty State for Users who haven't ordered yet */
          <View style={[styles.card, styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: `${theme.primary}15` }]}>
              <Ionicons name="sparkles" size={36} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text, textAlign: 'center' }]}>
              {isRTL ? 'لا توجد طلبات مشاريع نشطة حالياً' : 'No Active Project Requests Yet'}
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textMuted, textAlign: 'center' }]}>
              {isRTL 
                ? 'لم تقم بطلب أو تحديد أي مشروع بعد. اختر ما تحتاجه من منصات ومميزات عبر حاسبة التكلفة لنبدأ بتنفيذه وتتبعه خطوة بخطوة هنا!'
                : 'You have not submitted any project requests yet. Calculate your quote and choose your features to begin execution and track your custom milestones right here!'}
            </Text>
            <TouchableOpacity 
              style={[styles.startProjectBtn, { backgroundColor: theme.primary, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => {
                haptics.medium();
                router.push('/estimator');
              }}
            >
              <Ionicons name="calculator" size={20} color={activeTheme === 'light' ? '#FFF' : '#000'} />
              <Text style={[styles.startProjectBtnText, { color: activeTheme === 'light' ? '#FFF' : '#000' }]}>
                {isRTL ? 'احسب تكلفة مشروعك واطلب الآن' : 'Calculate & Request Project'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* User HAS Active Orders / Projects */
          <>
            {/* If multiple orders exist, allow switching between them */}
            {quotes.length > 1 && (
              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 8, textAlign: isRTL ? 'right' : 'left' }}>
                  {isRTL ? 'اختر الطلب لعرض تفاصيله ومراحله:' : 'Select Request to View:'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8 }}>
                    {quotes.map((q, idx) => (
                      <TouchableOpacity
                        key={q.id || idx}
                        onPress={() => {
                          haptics.selection();
                          setSelectedQuoteIdx(idx);
                        }}
                        style={[
                          styles.quoteTab,
                          { 
                            backgroundColor: selectedQuoteIdx === idx ? theme.primary : theme.card,
                            borderColor: selectedQuoteIdx === idx ? theme.primary : theme.border 
                          }
                        ]}
                      >
                        <Text style={{ 
                          color: selectedQuoteIdx === idx ? (activeTheme === 'light' ? '#FFF' : '#000') : theme.text,
                          fontWeight: 'bold', fontSize: 12 
                        }}>
                          {isRTL ? `طلب #${q.id}` : `Order #${q.id}`}
                          {q.platforms?.length > 0 ? ` (${q.platforms.join('+')})` : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Active Project Summary Card */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {isRTL ? 'المشروع النشط' : 'Active Project'}: {currentUser?.projectName || (activeQuote?.platforms?.length ? `مشروع ${activeQuote.platforms.join(' + ')}` : (isRTL ? 'مشروعك الرقمي' : 'Digital Project'))}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: `${theme.primary}20` }]}>
                  <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>
                    {(currentUser?.projectProgress || 0) === 100 ? 'COMPLETED' : 'IN PROGRESS'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.currentPhase, { color: theme.primary, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'المرحلة الحالية' : 'Current Phase'}: {currentUser?.projectPhase || (isRTL ? 'مراجعة الطلب والمواصفات' : 'Reviewing Specifications')}
              </Text>

              <View style={[styles.progressHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 20 }]}>
                <Text style={{ color: theme.textMuted }}>{isRTL ? 'نسبة الإنجاز' : 'Project Progress'}</Text>
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>{currentUser?.projectProgress || (activeQuote ? 15 : 0)}%</Text>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: theme.btnBg }]}>
                <View style={[styles.progressBarFill, { backgroundColor: theme.primary, width: `${currentUser?.projectProgress || (activeQuote ? 15 : 0)}%` }]} />
              </View>

              {/* Project Milestones Checklist */}
              {userTasks && userTasks.length > 0 && (
                <View style={{ marginTop: 18, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 14 }}>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Ionicons name="clipboard-outline" size={16} color={theme.primary} />
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left' }}>
                      {isRTL ? 'مراحل ومخرجات العمل المعتمدة:' : 'Approved Project Milestones:'}
                    </Text>
                  </View>
                  <View style={{ gap: 8 }}>
                    {userTasks.map((t, idx) => (
                      <View 
                        key={t.id || idx} 
                        style={{ 
                          flexDirection: isRTL ? 'row-reverse' : 'row', 
                          alignItems: 'center', 
                          gap: 10,
                          backgroundColor: t.completed ? `${theme.primary}12` : theme.btnBg,
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: t.completed ? `${theme.primary}33` : theme.border,
                        }}
                      >
                        <Ionicons 
                          name={t.completed ? "checkmark-circle" : "ellipse-outline"} 
                          size={18} 
                          color={t.completed ? "#10B981" : theme.textMuted} 
                        />
                        <Text style={{ 
                          color: t.completed ? theme.text : theme.textMuted, 
                          fontSize: 13, 
                          fontWeight: t.completed ? '600' : 'normal',
                          flex: 1,
                          textAlign: isRTL ? 'right' : 'left',
                        }}>
                          {t.title}
                        </Text>
                        <Text style={{ fontSize: 11, color: t.completed ? '#10B981' : theme.textMuted, fontWeight: 'bold' }}>
                          {t.completed ? (isRTL ? 'مكتمل' : 'Done') : (isRTL ? 'قيد العمل' : 'Pending')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Project Deliverables & Deliveries Card */}
            {userDeliverables && userDeliverables.length > 0 ? (
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', marginBottom: 8 }]}>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                    <Ionicons name="cube-outline" size={18} color={theme.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      {isRTL ? 'مخرجات وتسليمات مشروعك الحية' : 'Live Project Deliverables'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${theme.primary}20` }]}>
                    <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>
                      {userDeliverables.length} {isRTL ? 'مخرجات جاهزة' : 'ready'}
                    </Text>
                  </View>
                </View>

                <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 14, textAlign: isRTL ? 'right' : 'left' }}>
                  {isRTL 
                    ? 'اضغط على أي من الروابط أدناه لمعاينة النسخة التجريبية الحية، تنزيل تطبيق الهاتف APK، أو تصفح وثائق وتصاميم مشروعك:' 
                    : 'Click any link below to test staging, download the APK, or view your project design prototypes:'}
                </Text>

                <View style={{ gap: 10 }}>
                  {userDeliverables.map((item, idx) => {
                    const getMeta = (type: string) => {
                      switch (type) {
                        case 'staging': return { icon: 'globe-outline', color: '#3B82F6', label: isRTL ? 'رابط تجريبي حي (Staging)' : 'Live Staging Web' };
                        case 'apk': return { icon: 'logo-android', color: '#10B981', label: isRTL ? 'تحميل تطبيق أندرويد (APK)' : 'Android APK Download' };
                        case 'figma': return { icon: 'color-palette-outline', color: '#F43F5E', label: isRTL ? 'واجهات فيجما (Figma UI/UX)' : 'Figma Prototype' };
                        case 'github': return { icon: 'logo-github', color: '#8B5CF6', label: isRTL ? 'مستودع الكود (GitHub)' : 'Source Code (GitHub)' };
                        case 'docs': return { icon: 'document-text-outline', color: '#F59E0B', label: isRTL ? 'التوثيق والمستندات (Docs)' : 'Documentation' };
                        default: return { icon: 'link-outline', color: '#06B6D4', label: isRTL ? 'رابط مباشر (Direct Link)' : 'Direct Link' };
                      }
                    };
                    const meta = getMeta(item.type);

                    return (
                      <TouchableOpacity
                        key={item.id || idx}
                        onPress={() => {
                          haptics.medium();
                          if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(item.url, '_blank');
                          else Linking.openURL(item.url);
                        }}
                        style={{
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 14,
                          borderRadius: 12,
                          backgroundColor: theme.bg,
                          borderWidth: 1,
                          borderColor: `${meta.color}44`,
                        }}
                      >
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                          <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: `${meta.color}20`,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Ionicons name={meta.icon as any} size={20} color={meta.color} />
                          </View>
                          <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                            <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold' }}>
                              {item.title}
                            </Text>
                            <Text style={{ color: meta.color, fontSize: 11, marginTop: 2 }}>
                              {meta.label}
                            </Text>
                          </View>
                        </View>

                        <View style={{
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingVertical: 5,
                          paddingHorizontal: 10,
                          borderRadius: 8,
                          backgroundColor: `${meta.color}20`,
                        }}>
                          <Text style={{ color: meta.color, fontSize: 11, fontWeight: 'bold' }}>
                            {isRTL ? 'فتح الرابط' : 'Open'}
                          </Text>
                          <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={13} color={meta.color} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              hasActiveProject && (
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${theme.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="cube-outline" size={22} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                      <Text style={{ color: theme.text, fontSize: 14, fontWeight: 'bold', flexShrink: 1 }}>
                        {isRTL ? 'مخرجات وتسليمات المشروع' : 'Project Deliverables'}
                      </Text>
                      <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2, textAlign: isRTL ? 'right' : 'left', flexShrink: 1 }}>
                        {isRTL 
                          ? 'جاري تجهيز روابط المعاينة التجريبية (Staging) وملفات التطبيق APK لمشروعك وستظهر هنا فور رفعها من فريق العمل.' 
                          : 'Staging preview links and APK downloads are being prepared and will appear here.'}
                      </Text>
                    </View>
                  </View>
                </View>
              )
            )}

            {/* Interactive Milestones Roadmap strictly customized to their request */}
            <ProjectRoadmap 
              progress={currentUser?.projectProgress || (activeQuote?.status === 'approved' ? 50 : 15)}
              platforms={activeQuote?.platforms || []}
              features={activeQuote?.features || []}
              extras={activeQuote?.extras || []}
              projectName={currentUser?.projectName}
              totalCost={activeQuote?.totalCost}
              estimatedTime={activeQuote?.estimatedTime}
            />
          </>
        )}

        {/* Quick Actions Grid */}
        <View style={[styles.actionsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: '#38BDF8' }]}
            onPress={() => {
              haptics.light();
              router.push('/copilot');
            }}
          >
            <Ionicons name="sparkles" size={24} color="#38BDF8" style={{ marginBottom: 4 }} />
            <Text style={[styles.actionText, { color: '#38BDF8', fontWeight: 'bold' }]}>
              {isRTL ? 'مستشار AI' : 'AI Copilot'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
              haptics.light();
              router.push('/chat');
            }}
          >
            <Ionicons name="chatbubbles" size={24} color="#3B82F6" style={{ marginBottom: 4 }} />
            <Text style={[styles.actionText, { color: theme.text }]}>{t('chatTeam')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
              haptics.light();
              router.push('/invoices');
            }}
          >
            <Ionicons name="document-text" size={24} color="#10B981" style={{ marginBottom: 4 }} />
            <Text style={[styles.actionText, { color: theme.text }]}>{t('viewInvoice')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
              haptics.light();
              router.push('/referral');
            }}
          >
            <Ionicons name="gift" size={24} color="#F59E0B" style={{ marginBottom: 4 }} />
            <Text style={[styles.actionText, { color: theme.text }]}>{t('shareReferral')}</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Updates */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 10 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left', marginBottom: 16 }]}>
            {t('recentUpdates')}
          </Text>
          
          <View style={styles.timelineItem}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name={hasActiveProject ? "rocket-outline" : "bulb-outline"} size={16} color={hasActiveProject ? theme.primary : "#F59E0B"} />
              <Text style={[styles.timelineText, { color: theme.text, textAlign: isRTL ? 'right' : 'left', flex: 1 }]}>
                {hasActiveProject 
                  ? (isRTL ? `${currentUser?.projectName || 'مشروعك'}: ${currentUser?.projectPhase || 'المشروع قيد المتابعة والتنفيذ'}` : `${currentUser?.projectName || 'Project'}: ${currentUser?.projectPhase || 'In Progress'}`)
                  : (isRTL ? 'جاهزون لبدء مشروعك القادم بأعلى سرعة وكفاءة' : 'Ready to launch your next project with high efficiency')}
              </Text>
            </View>
            <Text style={[styles.timelineDate, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'محدث الآن' : 'Updated Now'}
            </Text>
          </View>

          {activeQuote ? (
            <View style={[styles.timelineItem, { borderLeftWidth: 0, paddingBottom: 0 }]}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="checkmark-done-circle-outline" size={16} color={theme.primary} />
                <Text style={[styles.timelineText, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left', flex: 1 }]}>
                  {isRTL ? `تم اعتماد طلب التسعيرة #${activeQuote.id} (${activeQuote.platforms?.join(' + ') || 'رقمي'})` : `Quote #${activeQuote.id} approved`}
                </Text>
              </View>
              <Text style={[styles.timelineDate, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                {activeQuote.createdAt ? new Date(activeQuote.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US') : (isRTL ? 'مؤخراً' : 'Recently')}
              </Text>
            </View>
          ) : (
            <View style={[styles.timelineItem, { borderLeftWidth: 0, paddingBottom: 0 }]}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="flash-outline" size={16} color="#10B981" />
                <Text style={[styles.timelineText, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left', flex: 1 }]}>
                  {isRTL ? 'نظام المتابعة الفورية والربط مفعل لحسابك' : 'Real-time project tracking active'}
                </Text>
              </View>
              <Text style={[styles.timelineDate, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'نشط دائماً' : 'Always active'}
              </Text>
            </View>
          )}
        </View>

        {/* Portfolio & Agency Showcase Banner */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            haptics.selection();
            router.push('/portfolio');
          }}
          style={[styles.card, { backgroundColor: '#0B132B', borderColor: 'rgba(56, 189, 248, 0.3)', marginTop: 12, padding: 16 }]}
        >
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(56, 189, 248, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="trophy" size={22} color="#38BDF8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#38BDF8', fontSize: 14, fontWeight: '900', textAlign: isRTL ? 'right' : 'left', flexShrink: 1 }}>
                  {isRTL ? 'هويتنا وسابقة أعمالنا المتميزة' : 'Our Identity & Proven Portfolio'}
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2, textAlign: isRTL ? 'right' : 'left', flexShrink: 1 }}>
                  {isRTL ? 'استكشف أكثر من 50 تطبيقاً ومنظومة رقمية قمنا ببنائها' : 'Explore 50+ enterprise apps and cloud platforms engineered by Apex'}
                </Text>
              </View>
            </View>
            <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={18} color="#38BDF8" style={{ marginLeft: 8 }} />
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* WhatsApp Floating Button */}
      <WhatsAppFAB />

      {/* In-App Notifications Modal */}
      <NotificationModal 
        visible={showNotifications} 
        onClose={() => setShowNotifications(false)} 
        unreadCount={unreadCount} 
        setUnreadCount={setUnreadCount} 
        initialNotifications={notifications}
      />
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
  headerLeft: {
    alignItems: 'center',
  },
  backBtn: { padding: 8, marginLeft: -8 },
  backBtnText: { fontSize: 16, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  settingsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 450,
  },
  startProjectBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startProjectBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  quoteTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentPhase: {
    fontSize: 15,
    fontWeight: '600',
  },
  progressHeader: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  actionBtn: {
    minWidth: '47%',
    height: 90,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  timelineItem: {
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(128,128,128,0.2)',
    paddingLeft: 16,
    paddingBottom: 20,
  },
  timelineText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    flexShrink: 1,
  },
  timelineDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  offlineRetryBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  offlineRetryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  aiCopilotCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  aiLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  aiTagBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  aiTagBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  aiCardTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  aiCardSub: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  aiCardFooter: {
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 12,
  },
  aiLaunchBtn: {
    backgroundColor: '#38BDF8',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    gap: 6,
  },
  aiLaunchBtnText: {
    color: '#0B132B',
    fontSize: 12,
    fontWeight: '800',
  },
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  retryBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#38BDF8',
  },
  retryBtnText: {
    color: '#0B132B',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
