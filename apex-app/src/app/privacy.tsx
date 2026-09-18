import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../utils/haptics';

export default function PrivacyScreen() {
  const router = useRouter();
  const { theme, isRTL } = useSettings();

  const handleBack = () => {
    haptics.light();
    if (router.canGoBack()) router.back();
    else router.push('/settings');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={handleBack} style={[styles.backBtn, { backgroundColor: theme.btnBg }]}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {isRTL ? 'سياسة الخصوصية وشروط الاستخدام' : 'Privacy Policy & Terms'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro Badge */}
        <View style={[styles.badgeCard, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}30` }]}>
          <Ionicons name="shield-checkmark" size={28} color={theme.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.badgeTitle, { color: theme.primary, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'التزام Apex بأمان وخصوصية بياناتك' : 'Apex Data Security & Privacy Commitment'}
            </Text>
            <Text style={[styles.badgeSub, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'تاريخ آخر تحديث: سبتمبر 2026' : 'Last Updated: September 2026'}
            </Text>
          </View>
        </View>

        {/* Section 1: Overview */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeading, { color: theme.primary, textAlign: isRTL ? 'right' : 'left' }]}>
            1. {isRTL ? 'المقدمة ونطاق التطبيق' : 'Overview & Scope'}
          </Text>
          <Text style={[styles.bodyText, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL
              ? 'تلتزم شركة Apex Software بحماية خصوصية مستخدمي تطبيقاتها ومنصاتها الرقمية. توضح هذه السياسة كيفية جمع واستخدام وحماية المعلومات الشخصية وبيانات المشاريع التي تشاركها معنا عند استخدام بوابتنا وتطبيقاتنا.'
              : 'Apex Software is committed to safeguarding your privacy. This policy outlines how we collect, use, and protect personal and project data shared through our applications and client portals.'}
          </Text>
        </View>

        {/* Section 2: Data Collected */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeading, { color: theme.primary, textAlign: isRTL ? 'right' : 'left' }]}>
            2. {isRTL ? 'البيانات التي نقوم بجمعها' : 'Data We Collect'}
          </Text>
          <View style={{ gap: 8, marginTop: 8 }}>
            {[
              {
                icon: 'person-circle-outline',
                title: isRTL ? 'بيانات الحساب الشخصي' : 'Personal Account Info',
                desc: isRTL ? 'الاسم الكامل، عنوان البريد الإلكتروني، رقم الهاتف، واسم الشركة أو المؤسسة.' : 'Full name, email address, phone number, and company name.',
              },
              {
                icon: 'briefcase-outline',
                title: isRTL ? 'بيانات المشاريع والمستشار الذكي' : 'Projects & AI Copilot Data',
                desc: isRTL ? 'أفكار المشاريع، الميزانيات التقديرية، وثائق العمل، وملفات العقود لتنفيذ المهام ومتابعتها.' : 'Project concepts, estimated budgets, contract deliverables, and task roadmaps.',
              },
              {
                icon: 'card-outline',
                title: isRTL ? 'بيانات الفواتير والمدفوعات' : 'Payment & Invoice Records',
                desc: isRTL ? 'سجلات الفواتير ومبالغ العقود. ملاحظة: بيانات البطاقات البنكية تُعالج عبر بوابات دفع معتمدة ومشفرة (PCI-DSS) ولا تُخزن لدينا.' : 'Invoice history. Payment card data is processed via PCI-DSS compliant gateways and never stored on our servers.',
              },
            ].map((item, idx) => (
              <View key={idx} style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 10, marginTop: 4 }}>
                <Ionicons name={item.icon as any} size={20} color={theme.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{item.title}</Text>
                  <Text style={[styles.itemDesc, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Section 3: App Permissions Disclosure */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeading, { color: theme.primary, textAlign: isRTL ? 'right' : 'left' }]}>
            3. {isRTL ? 'صلاحيات الهاتف وأسباب استخدامها (Permissions)' : 'Device Permissions Disclosure'}
          </Text>
          <View style={{ gap: 10, marginTop: 8 }}>
            {[
              {
                perm: isRTL ? 'بصمة الإصبع والوجه \u2066(Biometrics)\u2069' : 'Biometrics (Fingerprint / Face ID)',
                why: isRTL ? 'لتسجيل الدخول السريع والآمن دون الحاجة لكتابة كلمة المرور في كل مرة.' : 'For fast, secure login without typing your password each session.',
              },
              {
                perm: isRTL ? 'الإشعارات الحية \u2066(Push Notifications)\u2069' : 'Push Notifications',
                why: isRTL ? 'لإرسال تنبيهات لحظية بخصوص فواتيرك، مراحل مشروعك، ورسائل الدعم الفني.' : 'To send real-time alerts regarding invoices, milestone progress, and chat messages.',
              },
              {
                perm: isRTL ? 'الميكروفون \u2066(Microphone)\u2069' : 'Microphone (Audio)',
                why: isRTL ? 'يُستخدم فقط عند تشغيل التحدث الصوتي مع مستشار Apex الذكي أو إرسال ملاحظات صوتية.' : 'Used solely when recording voice prompts for AI Copilot or sending voice notes.',
              },
              {
                perm: isRTL ? 'الصور والمستندات (Photo Library)' : 'Storage / Photos',
                why: isRTL ? 'لرفع متطلبات المشاريع أو مرفقات التحويلات المالية في شاشة الفواتير.' : 'To attach project specs, screenshots, or payment receipts in invoices.',
              },
            ].map((p, idx) => (
              <View key={idx} style={[styles.permItem, { backgroundColor: theme.btnBg, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left' }}>{p.perm}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2, textAlign: isRTL ? 'right' : 'left', lineHeight: 17 }}>{p.why}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Section 4: AI & Data Sharing */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeading, { color: theme.primary, textAlign: isRTL ? 'right' : 'left' }]}>
            4. {isRTL ? 'معالجة الذكاء الاصطناعي وعدم مشاركة البيانات' : 'AI Processing & Third-Party Disclosure'}
          </Text>
          <Text style={[styles.bodyText, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL
              ? 'نحن لا نبيع أو نؤجر بياناتك الشخصية لأي جهة إعلانية أو طرف ثالث. نصوص الأفكار المدخلة في مستشار Apex الذكي تُعالج لأغراض التحليل الفني وتقديم العروض، وتخضع لسياسات الأمان والتشفير الصارمة وفق معايير Google Cloud و OpenAI Enterprise.'
              : 'We do not sell or rent your personal data to advertisers. Prompts submitted to AI Copilot are processed securely for project scoping under enterprise privacy agreements.'}
          </Text>
        </View>

        {/* Section 5: Contact Us */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeading, { color: theme.primary, textAlign: isRTL ? 'right' : 'left' }]}>
            5. {isRTL ? 'التواصل وحذف البيانات (Contact & Data Deletion)' : 'Contact & Data Deletion Rights'}
          </Text>
          <Text style={[styles.bodyText, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL
              ? 'يحق لك في أي وقت طلب تصدير بياناتك أو حذف حسابك وسجلاتك بالكامل من خوادمنا. لأي استفسارات أو طلبات متعلقة بالخصوصية، يمكنك مراسلتنا عبر:'
              : 'You retain the right to access, export, or permanently delete your account and data. For privacy inquiries, please contact:'}
          </Text>
          <View style={{ marginTop: 10, gap: 8 }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="mail" size={15} color={theme.primary} />
              <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 13 }}>
                privacy@apexsoftware.com
              </Text>
            </View>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="globe-outline" size={15} color={theme.textMuted} />
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                https://apexsoftware.com/privacy
              </Text>
            </View>
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
    gap: 14,
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  badgeSub: {
    fontSize: 11,
    marginTop: 2,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 22,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  permItem: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'flex-start',
    gap: 8,
  },
});
