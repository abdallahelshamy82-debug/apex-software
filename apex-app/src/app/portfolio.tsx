import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../utils/haptics';
import { useResponsive } from '../hooks/useResponsive';

// ============================================================================
// إرشادات للمطور / المصمم (Handover Instructions for Designer / Developer)
// مرحباً بك! هذه الشاشة مهيأة كصفحة الهوية وسابقة الأعمال لشركة Apex Software.
// يمكنك تعديل المشاريع والخدمات والشعارات والصور من الكائنات أدناه بكل سهولة.
// ============================================================================

const PORTFOLIO_PROJECTS = [
  {
    id: 'p1',
    category: 'mobile',
    title: 'تطبيق فارما-إكسبريس (PharmaExpress)',
    client: 'سلسلة صيدليات كبرى',
    desc: 'تطبيق حجز وتوصيل أدوية لحظي بالروشتة الذكية وتتبع المندوبين بنظام GPS ودفع إلكتروني متكامل.',
    tech: ['React Native', 'Node.js', 'Socket.io', 'Paymob', 'Google Maps'],
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
    metrics: '150k+ مستخدم نشط • تقييم 4.9',
    featured: true,
  },
  {
    id: 'p2',
    category: 'web',
    title: 'منصة مزادات السيارات الحية (AutoBid)',
    client: 'شركة المزادات الخليجية',
    desc: 'منصة بث فيديو فوري بمعدل تأخير شبه منعدم (WebRTC) مع مزايدة بالثواني ومحفظة مالية رقمية.',
    tech: ['React / Next.js', 'WebRTC', 'Go / Node', 'Redis', 'PostgreSQL'],
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
    metrics: 'أكثر من 20M$ تعاملات سنوية',
    featured: true,
  },
  {
    id: 'p3',
    category: 'mobile',
    title: 'تطبيق سويفت ماركت (SwiftMarket)',
    client: 'سوق التجزئة السريع',
    desc: 'تطبيق تجارة إلكترونية متعدد الفروع يدعم الماسح الضوئي للباركود والتوصيل في أقل من 30 دقيقة.',
    tech: ['React Native', 'TypeScript', 'Stripe', 'Algolia Search'],
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80',
    metrics: '80k+ طلب شهرياً',
    featured: false,
  },
  {
    id: 'p4',
    category: 'ai',
    title: 'المستشار الطبي الذكي (HealthAI Copilot)',
    client: 'مجموعة مستشفيات ومراكز طبية',
    desc: 'نظام تشخيص أولي وفرز الحالات بالذكاء الاصطناعي وربطه بالملفات الطبية الإلكترونية ومواعيد الأطباء.',
    tech: ['Python / FastAPI', 'Google Gemini AI', 'LangChain', 'Docker'],
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
    metrics: 'دقة تشخيص 96.4%',
    featured: true,
  },
  {
    id: 'p5',
    category: 'web',
    title: 'منظومة Apex ERP لإدارة الموارد السحابية',
    client: 'شركات المقاولات والمصانع',
    desc: 'لوحة تحكم مركزية لإدارة الفواتير، المخزون، الحسابات، وتوزيع المهام مع تقارير BI تفاعلية.',
    tech: ['React', 'Node.js Microservices', 'PostgreSQL', 'Docker'],
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    metrics: 'توفير 40% من وقت العمليات',
    featured: false,
  },
];

const SERVICES = [
  { icon: 'phone-portrait-outline', title: 'تطبيقات الموبايل (iOS & Android)', desc: 'تطبيقات أصلية وفائقة السرعة عبر React Native بأعلى معايير متجر Google Play و App Store.' },
  { icon: 'globe-outline', title: 'المنصات والأنظمة السحابية (Enterprise Web)', desc: 'لوحات تحكم وأنظمة SaaS مصممة لتحمل مئات الآلاف من الزيارات اللحظية بكفاءة تامة.' },
  { icon: 'sparkles-outline', title: 'حلول الذكاء الاصطناعي (AI & Copilots)', desc: 'تطوير مستشارين أذكياء ونماذج LLM مخصصة تدمج في تطبيقك لأتمتة خدمة العملاء والعمليات.' },
  { icon: 'shield-checkmark-outline', title: 'الأمن السيبراني وبوابات الدفع', desc: 'تشفير كامل للبيانات وتكامل سلس وموثوق مع بوابات الدفع Paymob، Stripe، والمحافظ الإلكترونية.' },
];

const TESTIMONIALS = [
  { name: 'د. خالد المنصوري', role: 'الرئيس التنفيذي - HealthPlus', text: 'فريق Apex نقل فكرة مشروعنا من مجرد فكرة إلى تطبيق متصدر في المتجر خلال 7 أسابيع فقط مع كود غاية في النظافة.' },
  { name: 'م. أحمد الشامي', role: 'مدير العمليات - AutoBid', text: 'الاستقرار المعماري لمنصة المزادات كان تحدياً كبيراً، ولكن Apex قدمت حلاً هندسياً فائق السرعة بدون أي تأخير في البث.' },
];

export default function IdentityPortfolioScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const { theme, isRTL } = useSettings();
  const [activeFilter, setActiveFilter] = useState<'all' | 'mobile' | 'web' | 'ai'>('all');

  const filteredProjects = activeFilter === 'all'
    ? PORTFOLIO_PROJECTS
    : PORTFOLIO_PROJECTS.filter(p => p.category === activeFilter);

  const handleGoBack = () => {
    haptics.light();
    if (router.canGoBack()) router.back();
    else router.push('/dashboard');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={handleGoBack} style={[styles.backBtn, { backgroundColor: theme.btnBg }]}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {isRTL ? 'هويتنا وسابقة أعمالنا' : 'Identity & Portfolio'}
        </Text>
        <View style={{ width: 40 }} />
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
        {/* Brand Hero Banner */}
        <View style={[styles.heroCard, { backgroundColor: '#0B132B', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
          <View style={styles.brandBadge}>
            <Text style={{ color: '#38BDF8', fontSize: 12, fontWeight: '900' }}>APEX SOFTWARE SOLUTIONS</Text>
          </View>

          <Text style={[styles.heroTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'نبني المنتجات الرقمية التي تصنع الفارق في السوق' : 'Engineering Market-Defining Digital Products'}
          </Text>

          <Text style={[styles.heroSub, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL
              ? 'نحن بيت خبرة برمجية ومعمارية متخصص في بناء تطبيقات الهاتف الذكي فائقة التطور، والأنظمة السحابية الموسعة، وحلول الذكاء الاصطناعي التوليدي للشركات والمشاريع الريادية.'
              : 'Enterprise software house crafting scalable mobile apps, robust cloud backends, and generative AI solutions for industry leaders.'}
          </Text>

          {/* Key Metrics Stats */}
          <View style={[styles.statsRow, { borderColor: 'rgba(255,255,255,0.1)', flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>50+</Text>
              <Text style={styles.statLabel}>{isRTL ? 'مشروع منجز' : 'Delivered Projects'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>99.9%</Text>
              <Text style={styles.statLabel}>{isRTL ? 'استقرار وتشغيل' : 'Uptime SLA'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Text style={styles.statNumber}>4.9</Text>
                <Ionicons name="star" size={16} color="#38BDF8" style={{ marginBottom: 2 }} />
              </View>
              <Text style={styles.statLabel}>{isRTL ? 'تقييم المتاجر' : 'Store Rating'}</Text>
            </View>
          </View>
        </View>

        {/* Core Services Section */}
        <View style={styles.section}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="construct-outline" size={18} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.primary, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'خدماتنا وخبراتنا التكنولوجية' : 'What We Build'}
            </Text>
          </View>
          <View style={{ gap: 10, marginTop: 12 }}>
            {SERVICES.map((s, idx) => (
              <View key={idx} style={[styles.serviceCard, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.serviceIconWrap, { backgroundColor: `${theme.primary}15` }]}>
                  <Ionicons name={s.icon as any} size={22} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.serviceTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{s.title}</Text>
                  <Text style={[styles.serviceDesc, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{s.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Portfolio Section with Filter Tabs */}
        <View style={[styles.section, { marginTop: 14 }]}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="trophy-outline" size={18} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.primary, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'معرض نماذج الأعمال والمشاريع الحية' : 'Featured Portfolio'}
            </Text>
          </View>

          {/* Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8 }}>
              {[
                { id: 'all', label: isRTL ? 'الكل' : 'All', icon: 'grid-outline' },
                { id: 'mobile', label: isRTL ? 'تطبيقات موبايل' : 'Mobile Apps', icon: 'phone-portrait-outline' },
                { id: 'web', label: isRTL ? 'منصات ويب' : 'Web Systems', icon: 'globe-outline' },
                { id: 'ai', label: isRTL ? 'ذكاء اصطناعي' : 'AI Solutions', icon: 'hardware-chip-outline' },
              ].map(f => {
                const isActive = activeFilter === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => {
                      haptics.selection();
                      setActiveFilter(f.id as any);
                    }}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: isActive ? theme.primary : theme.card,
                        borderColor: isActive ? theme.primary : theme.border,
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        alignItems: 'center',
                        gap: 6,
                      }
                    ]}
                  >
                    <Ionicons 
                      name={f.icon as any} 
                      size={14} 
                      color={isActive ? '#0B132B' : theme.textMuted} 
                    />
                    <Text style={{ color: isActive ? '#0B132B' : theme.text, fontSize: 12, fontWeight: 'bold' }}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Projects Cards */}
          <View style={{ gap: 16 }}>
            {filteredProjects.map(p => (
              <View key={p.id} style={[styles.projectCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Image source={{ uri: p.image }} style={styles.projectImage} />
                
                <View style={styles.projectBody}>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={[styles.projectClient, { color: theme.primary }]}>{p.client}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="star" size={13} color="#10B981" />
                      <Text style={styles.projectMetrics}>{p.metrics}</Text>
                    </View>
                  </View>

                  <Text style={[styles.projectTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                    {p.title}
                  </Text>

                  <Text style={[styles.projectDesc, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                    {p.desc}
                  </Text>

                  {/* Tech stack pills */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 10 }}>
                    {p.tech.map((t, tIdx) => (
                      <View key={tIdx} style={[styles.techPill, { backgroundColor: theme.btnBg, borderColor: theme.border }]}>
                        <Text style={{ color: theme.text, fontSize: 11 }}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Testimonials */}
        <View style={[styles.section, { marginTop: 14 }]}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="chatbubbles-outline" size={18} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.primary, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'شهادات الشركاء والعملاء' : 'Client Testimonials'}
            </Text>
          </View>
          <View style={{ gap: 10, marginTop: 12 }}>
            {TESTIMONIALS.map((t, idx) => (
              <View key={idx} style={[styles.testimonialCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={{ fontSize: 24, color: theme.primary, marginBottom: 4 }}>“</Text>
                <Text style={[styles.testimonialText, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                  {t.text}
                </Text>
                <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 8 }}>
                  <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 13, textAlign: isRTL ? 'right' : 'left' }}>
                    {t.name}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: isRTL ? 'right' : 'left' }}>
                    {t.role}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* High-Converting CTA Banner */}
        <View style={[styles.ctaBanner, { backgroundColor: theme.primary }]}>
          <Text style={styles.ctaTitle}>
            {isRTL ? 'هل لديك فكرة مشروع رقمي تريد إطلاقها؟' : 'Ready to Launch Your Next Project?'}
          </Text>
          <Text style={styles.ctaSub}>
            {isRTL
              ? 'استخدم مستشارنا بالذكاء الاصطناعي لتحليل دراسة الجدوى وتفكيك المنصات والميزانية في ثوانٍ، أو تواصل مع خبرائنا مباشرة.'
              : 'Use our AI Copilot to engineer your architecture and budget in seconds, or speak with our architects.'}
          </Text>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, width: '100%' }}>
            <TouchableOpacity
              onPress={() => {
                haptics.heavy();
                router.push('/copilot');
              }}
              style={styles.ctaCopilotBtn}
            >
              <Ionicons name="sparkles" size={16} color="#FFF" />
              <Text style={styles.ctaCopilotBtnText}>
                {isRTL ? 'مستشار الذكاء الاصطناعي' : 'AI Copilot'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                haptics.medium();
                router.push('/estimator');
              }}
              style={styles.ctaEstimatorBtn}
            >
              <Text style={styles.ctaEstimatorBtnText}>
                {isRTL ? 'حاسبة الأسعار' : 'Cost Estimator'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
    gap: 16,
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 18,
  },
  brandBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 26,
    marginBottom: 8,
  },
  heroSub: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#38BDF8',
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  section: {},
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  serviceCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  serviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  serviceDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  projectCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  projectImage: {
    width: '100%',
    height: 170,
    resizeMode: 'cover',
  },
  projectBody: {
    padding: 14,
  },
  projectClient: {
    fontSize: 12,
    fontWeight: '800',
  },
  projectMetrics: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: 'bold',
  },
  projectTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  projectDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  techPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  testimonialCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  testimonialText: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  ctaBanner: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  ctaTitle: {
    color: '#0B132B',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  ctaSub: {
    color: '#0B132B',
    opacity: 0.85,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  ctaCopilotBtn: {
    flex: 1,
    backgroundColor: '#0B132B',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ctaCopilotBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  ctaEstimatorBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaEstimatorBtnText: {
    color: '#0B132B',
    fontSize: 12,
    fontWeight: '800',
  },
});
