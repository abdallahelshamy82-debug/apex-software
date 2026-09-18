import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';

export interface ProjectRoadmapProps {
  progress?: number;
  platforms?: string[];
  features?: string[];
  extras?: string[];
  projectName?: string;
  totalCost?: number;
  estimatedTime?: string;
}

interface Milestone {
  id: number;
  threshold: number;
  prevThreshold: number;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const PLATFORM_MAP: Record<string, { ar: string; en: string; icon: keyof typeof Ionicons.glyphMap }> = {
  web: { ar: 'موقع ويب', en: 'Web App', icon: 'desktop' },
  android: { ar: 'تطبيق أندرويد', en: 'Android App', icon: 'logo-android' },
  ios: { ar: 'تطبيق آيفون (iOS)', en: 'iOS App', icon: 'logo-apple' },
};

const FEATURE_MAP: Record<string, { ar: string; en: string; icon: keyof typeof Ionicons.glyphMap }> = {
  auth: { ar: 'تسجيل الدخول والحسابات', en: 'User Auth', icon: 'person' },
  payments: { ar: 'بوابات الدفع الإلكتروني', en: 'Payment Gateway', icon: 'card' },
  chat: { ar: 'المحادثات المباشرة (Chat)', en: 'Real-time Chat', icon: 'chatbubbles' },
  maps: { ar: 'الخرائط وتتبع الموقع', en: 'Maps & GPS', icon: 'map' },
  ai: { ar: 'دمج الذكاء الاصطناعي (AI)', en: 'AI Integration', icon: 'hardware-chip' },
};

const EXTRA_MAP: Record<string, { ar: string; en: string; icon: keyof typeof Ionicons.glyphMap }> = {
  playstore: { ar: 'متجر Google Play', en: 'Google Play', icon: 'logo-google-playstore' },
  appstore: { ar: 'متجر Apple App Store', en: 'Apple Store', icon: 'logo-apple-appstore' },
  hosting: { ar: 'دومين واستضافة (سنة)', en: 'Domain & Hosting', icon: 'server' },
  uiux: { ar: 'تصميم UI/UX مخصص', en: 'Custom UI/UX', icon: 'color-palette' },
};

function buildDynamicMilestones(platforms: string[] = [], features: string[] = [], extras: string[] = []): Milestone[] {
  const platAr = platforms.map(p => PLATFORM_MAP[p]?.ar || p).filter(Boolean);
  const platEn = platforms.map(p => PLATFORM_MAP[p]?.en || p).filter(Boolean);

  const featAr = features.map(f => FEATURE_MAP[f]?.ar || f).filter(Boolean);
  const featEn = features.map(f => FEATURE_MAP[f]?.en || f).filter(Boolean);

  const hasUiUx = extras.includes('uiux');
  const hasPlaystore = extras.includes('playstore');
  const hasAppstore = extras.includes('appstore');
  const hasWeb = platforms.includes('web');

  // 1. Requirements Phase
  const m1DescAr = platAr.length > 0 
    ? `تحليل وثيقة العمل وتحديد الهيكلية التقنية وقواعد البيانات لمنصة (${platAr.join(' + ')}).`
    : 'تحديد وثيقة العمل، متطلبات النظام، تدفق المستخدم، وتجهيز قاعدة البيانات.';
  const m1DescEn = platEn.length > 0
    ? `Technical requirements, database schema & architecture for (${platEn.join(' + ')}).`
    : 'Feature scoping, user flow mapping, and database schema setup.';

  // 2. UI/UX Phase
  const m2TitleAr = hasUiUx ? 'تصميم واجهات UI/UX حصرية ومخصصة' : 'تصميم واجهات وتجربة المستخدم (UI/UX)';
  const m2TitleEn = hasUiUx ? 'Custom UI/UX Design & Interactive Prototypes' : 'UI/UX Design & User Experience';
  const m2DescAr = hasUiUx 
    ? 'تصميم شاشات مخصصة بالكامل وبروتوتايب تفاعلي متقدم متوافق مع كافة الأجهزة.'
    : 'رسم الشاشات وتدفق الاستخدام العصري المتوافق مع المنصات المطلوبة.';
  const m2DescEn = hasUiUx
    ? 'Tailored high-fidelity UI design and interactive mobile/web prototypes.'
    : 'Modern responsive screens and user experience flows for selected platforms.';

  // 3. Core Development Phase (strictly lists the requested features)
  const m3TitleAr = featAr.length > 0 ? 'برمجة وتطوير الميزات المطلوبة' : 'البرمجة والتطوير الفعلي (Core Dev)';
  const m3TitleEn = featEn.length > 0 ? 'Core Development & Selected Features' : 'Core Development & API Integrations';
  const m3DescAr = featAr.length > 0
    ? `برمجة النواة وربط الميزات المحددة: (${featAr.join('، ')}).`
    : 'كتابة الأكواد، برمجة السيرفر والباك إند، وربط قواعد البيانات والـ APIs.';
  const m3DescEn = featEn.length > 0
    ? `Engineering core functionality & integrating: (${featEn.join(', ')}).`
    : 'Full-stack engineering, API integrations, and database connection.';

  // 4. QA & Testing Phase
  const m4DescAr = 'اختبار الأداء، فحص استقرار الميزات المطلوبة، اختبار التوافقية وحماية البيانات.';
  const m4DescEn = 'End-to-end bug hunting, speed optimization, and security audits.';

  // 5. Deployment / Stores Launch Phase
  let m5TitleAr = 'النشر والإطلاق والتسليم';
  let m5TitleEn = 'Deployment & Final Delivery';
  let m5DescAr = 'التسليم النهائي للسورس كود وتشغيل النظام والتوثيق.';
  let m5DescEn = 'Production deployment, source code handover, and final sign-off.';

  if (hasPlaystore && hasAppstore) {
    m5TitleAr = 'الرفع على متجري Google Play و App Store';
    m5TitleEn = 'Publishing to Google Play & App Store';
    m5DescAr = 'تجهيز حزم التطبيق والنشر الرسمي على Google Play و Apple App Store وتسليم المشروع.';
    m5DescEn = 'Preparing release bundles, store submission for iOS & Android, and code handover.';
  } else if (hasPlaystore) {
    m5TitleAr = 'الرفع على متجر Google Play والتسليم';
    m5TitleEn = 'Publishing to Google Play & Delivery';
    m5DescAr = 'نشر التطبيق رسمياً على متجر Google Play وتسليم الكود والتوثيق.';
    m5DescEn = 'Google Play Store submission, verification, and code delivery.';
  } else if (hasAppstore) {
    m5TitleAr = 'الرفع على متجر Apple App Store والتسليم';
    m5TitleEn = 'Publishing to Apple App Store & Delivery';
    m5DescAr = 'نشر التطبيق على Apple App Store وتسليم الكود المصدري.';
    m5DescEn = 'Apple App Store submission, TestFlight, and source code handover.';
  } else if (hasWeb) {
    m5TitleAr = 'إطلاق ونشر الموقع السحابي والتسليم';
    m5TitleEn = 'Web Production Deployment & Delivery';
    m5DescAr = 'ربط الدومين، تهيئة السيرفر، النشر على السحابة، وتسليم السورس كود.';
    m5DescEn = 'Domain setup, cloud deployment, SSL verification, and handover.';
  }

  return [
    {
      id: 1,
      threshold: 20,
      prevThreshold: 0,
      titleAr: 'التخطيط وتحديد المتطلبات',
      titleEn: 'Requirements & Architecture',
      descAr: m1DescAr,
      descEn: m1DescEn,
      icon: 'document-text',
    },
    {
      id: 2,
      threshold: 45,
      prevThreshold: 20,
      titleAr: m2TitleAr,
      titleEn: m2TitleEn,
      descAr: m2DescAr,
      descEn: m2DescEn,
      icon: 'color-palette',
    },
    {
      id: 3,
      threshold: 75,
      prevThreshold: 45,
      titleAr: m3TitleAr,
      titleEn: m3TitleEn,
      descAr: m3DescAr,
      descEn: m3DescEn,
      icon: 'code-slash',
    },
    {
      id: 4,
      threshold: 90,
      prevThreshold: 75,
      titleAr: 'الاختبار وضمان الجودة والأمان',
      titleEn: 'QA, Security & Performance',
      descAr: m4DescAr,
      descEn: m4DescEn,
      icon: 'shield-checkmark',
    },
    {
      id: 5,
      threshold: 100,
      prevThreshold: 90,
      titleAr: m5TitleAr,
      titleEn: m5TitleEn,
      descAr: m5DescAr,
      descEn: m5DescEn,
      icon: 'rocket',
    },
  ];
}

export default function ProjectRoadmap({ 
  progress = 0, 
  platforms = [], 
  features = [], 
  extras = [],
  projectName,
  totalCost,
  estimatedTime
}: ProjectRoadmapProps) {
  const { theme, isRTL } = useSettings() || {
    theme: { bg: '#0F172A', text: '#F8FAFC', textMuted: '#94A3B8', primary: '#06B6D4', card: '#1E293B', border: 'rgba(255,255,255,0.08)' },
    isRTL: true
  };

  const milestones = buildDynamicMilestones(platforms, features, extras);

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      
      {/* Header */}
      <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="map" size={22} color={theme.primary} />
          <View>
            <Text style={[styles.title, { color: theme.text, textAlign: isRTL ? 'right' : 'left', flexShrink: 1 }]}>
              {isRTL ? 'مراحل تنفيذ طلبك الفعلي' : 'Your Custom Project Roadmap'}
            </Text>
            {projectName ? (
              <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: isRTL ? 'right' : 'left' }}>
                {projectName}
              </Text>
            ) : null}
          </View>
        </View>
        <Text style={[styles.progressBadge, { color: theme.primary, backgroundColor: `${theme.primary}15` }]}>
          {progress}%
        </Text>
      </View>

      {/* Selected Items Badges (What the user actually ordered) */}
      {(platforms.length > 0 || features.length > 0 || extras.length > 0) && (
        <View style={[styles.specsBox, { backgroundColor: theme.btnBg, borderColor: theme.border }]}>
          <Text style={[styles.specsTitle, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'المواصفات والميزات المحددة لطلبك:' : 'Your Selected Specifications:'}
          </Text>
          <View style={[styles.tagsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {/* Platforms */}
            {platforms.map(p => (
              <View key={p} style={[styles.tag, { backgroundColor: `${theme.primary}20`, borderColor: theme.primary }]}>
                <Ionicons name={PLATFORM_MAP[p]?.icon || 'apps'} size={12} color={theme.primary} />
                <Text style={[styles.tagText, { color: theme.primary }]}>
                  {isRTL ? PLATFORM_MAP[p]?.ar || p : PLATFORM_MAP[p]?.en || p}
                </Text>
              </View>
            ))}
            {/* Features */}
            {features.map(f => (
              <View key={f} style={[styles.tag, { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3B82F6' }]}>
                <Ionicons name={FEATURE_MAP[f]?.icon || 'checkmark-circle'} size={12} color="#3B82F6" />
                <Text style={[styles.tagText, { color: '#93C5FD' }]}>
                  {isRTL ? FEATURE_MAP[f]?.ar || f : FEATURE_MAP[f]?.en || f}
                </Text>
              </View>
            ))}
            {/* Extras */}
            {extras.map(e => (
              <View key={e} style={[styles.tag, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10B981' }]}>
                <Ionicons name={EXTRA_MAP[e]?.icon || 'star'} size={12} color="#10B981" />
                <Text style={[styles.tagText, { color: '#6EE7B7' }]}>
                  {isRTL ? EXTRA_MAP[e]?.ar || e : EXTRA_MAP[e]?.en || e}
                </Text>
              </View>
            ))}
          </View>
          {(totalCost !== undefined && totalCost > 0) && (
            <View style={[styles.costRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                {isRTL ? `التكلفة التقديرية: $${totalCost}` : `Est. Cost: $${totalCost}`}
              </Text>
              {estimatedTime ? (
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                  {isRTL ? ` • المدة: ${estimatedTime}` : ` • Duration: ${estimatedTime}`}
                </Text>
              ) : null}
            </View>
          )}
        </View>
      )}

      {/* Dynamic Milestones Timeline */}
      <View style={styles.roadmapContainer}>
        {milestones.map((m, index) => {
          const isCompleted = progress >= m.threshold;
          const isActive = progress < m.threshold && progress >= m.prevThreshold;
          const isLast = index === milestones.length - 1;

          let nodeColor = '#64748B';
          let statusText = isRTL ? 'قادمة' : 'Upcoming';
          let statusBg = 'rgba(100,116,139,0.15)';
          let statusTextColor = '#94A3B8';

          if (isCompleted) {
            nodeColor = '#10B981';
            statusText = isRTL ? 'مكتملة' : 'Completed';
            statusBg = 'rgba(16,185,129,0.15)';
            statusTextColor = '#10B981';
          } else if (isActive) {
            nodeColor = theme.primary;
            statusText = isRTL ? 'جارية الآن' : 'In Progress';
            statusBg = `${theme.primary}20`;
            statusTextColor = theme.primary;
          }

          return (
            <View key={m.id} style={[styles.milestoneRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {/* Timeline Column */}
              <View style={[styles.timelineColumn, isRTL ? { marginLeft: 12, marginRight: 0 } : { marginRight: 12, marginLeft: 0 }]}>
                <View style={[styles.circleNode, { backgroundColor: nodeColor, borderColor: isCompleted || isActive ? theme.card : theme.border }]}>
                  <Ionicons 
                    name={isCompleted ? 'checkmark' : m.icon} 
                    size={15} 
                    color="#FFFFFF" 
                  />
                </View>
                {!isLast && (
                  <View 
                    style={[
                      styles.connectorLine, 
                      { backgroundColor: isCompleted ? '#10B981' : theme.border }
                    ]} 
                  />
                )}
              </View>

              {/* Content Card */}
              <View style={[styles.contentCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <View style={[styles.milestoneHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 6 }]}>
                  <Text style={[styles.milestoneTitle, { color: theme.text, flex: 1, minWidth: 130 }]}>
                    {isRTL ? m.titleAr : m.titleEn}
                  </Text>
                  <View style={[styles.statusTag, { backgroundColor: statusBg }]}>
                    <Text style={[styles.statusTagText, { color: statusTextColor }]}>
                      {statusText}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.milestoneDesc, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? m.descAr : m.descEn}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginVertical: 16,
    width: '100%',
  },
  cardHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 'bold',
  },
  specsBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  specsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagsRow: {
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  costRow: {
    marginTop: 4,
    alignItems: 'center',
  },
  roadmapContainer: {
    paddingTop: 4,
  },
  milestoneRow: {
    marginBottom: 12,
  },
  timelineColumn: {
    alignItems: 'center',
    width: 32,
  },
  circleNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 2,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    minHeight: 45,
    marginVertical: 4,
  },
  contentCard: {
    flex: 1,
    paddingBottom: 14,
  },
  milestoneHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
    gap: 6,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    flexShrink: 1,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  milestoneDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
    flexShrink: 1,
  },
});
