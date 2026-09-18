import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';

export default function ReferralScreen() {
  const router = useRouter();
  const { theme, t, isRTL, activeTheme, currentUser } = useSettings();
  const [copied, setCopied] = useState(false);

  const userSlug = currentUser?.fullName
    ? currentUser.fullName.replace(/[^\w]/g, '').toUpperCase().slice(0, 6) || 'CLIENT'
    : 'VIP';
  const referralCode = `APEX-${userSlug}-${currentUser?.id || '2026'}`;

  const shareText = isRTL 
    ? `استخدم كود الدعوة الخاص بي (${referralCode}) عند طلب مشروعك البرمجي من Apex Software واحصل على خصم 10% فوري على فاتورتك الأولى!` 
    : `Use my invite code (${referralCode}) when ordering your software project with Apex Software to get 10% off your first invoice!`;

  const handleCopyCode = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(referralCode);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    const msg = isRTL ? `تم نسخ الكود: ${referralCode}` : `Code copied: ${referralCode}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(msg);
    } else {
      Alert.alert(isRTL ? 'تم النسخ بنجاح!' : 'Copied!', msg);
    }
  };

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({
            title: 'Apex Software Promo',
            text: shareText,
          });
        } else {
          handleCopyCode();
        }
      } else {
        await Share.share({
          message: shareText,
        });
      }
    } catch (e) {
      handleCopyCode();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backBtn, { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }]}
        >
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={18} color={theme.primary} />
          <Text style={[styles.backBtnText, { color: theme.primary }]}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('shareReferral')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}15` }]}>
            <Ionicons name="gift" size={44} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            {isRTL ? 'ادعُ أصدقاءك واربح خصماً 10%' : 'Invite & Earn 10% Off'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {isRTL 
              ? 'شارك كود الدعوة الحصري الخاص بك مع رواد الأعمال والشركات. عند بدئهم أي مشروع برمجي معنا في Apex، سيحصل كلاكما على خصم فوري 10% على الفاتورة القادمة!'
              : 'Share your unique referral code with partners and business owners. When they initiate a project with Apex Software, both of you receive 10% discount on the next invoice!'}
          </Text>

          {/* Code Box */}
          <TouchableOpacity 
            onPress={handleCopyCode}
            style={[styles.codeBox, { backgroundColor: theme.bg, borderColor: theme.primary }]}
          >
            <Text style={[styles.codeText, { color: theme.primary }]}>{referralCode}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <Ionicons 
                name={copied ? 'checkmark-circle' : 'copy-outline'} 
                size={14} 
                color={copied ? '#10B981' : theme.textMuted} 
              />
              <Text style={{ color: copied ? '#10B981' : theme.textMuted, fontSize: 12 }}>
                {copied 
                  ? (isRTL ? 'تم النسخ إلى الحافظة' : 'Copied to clipboard') 
                  : (isRTL ? 'اضغط لنسخ الكود' : 'Tap to copy code')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Share Buttons */}
          <View style={{ width: '100%', gap: 10 }}>
            <TouchableOpacity 
              style={[styles.shareBtn, { backgroundColor: theme.primary }]}
              onPress={handleShare}
            >
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ionicons name="share-social" size={18} color={activeTheme === 'light' ? '#FFF' : '#000'} />
                <Text style={[styles.shareBtnText, { color: activeTheme === 'light' ? '#FFF' : '#000' }]}>
                  {isRTL ? 'مشاركة رابط وكود الدعوة' : 'Share Invitation'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.shareBtn, { backgroundColor: theme.btnBg, borderWidth: 1, borderColor: theme.border }]}
              onPress={handleCopyCode}
            >
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ionicons name="copy-outline" size={18} color={theme.text} />
                <Text style={[styles.shareBtnText, { color: theme.text, fontSize: 15 }]}>
                  {isRTL ? 'نسخ الكود فقط' : 'Copy Code Only'}
                </Text>
              </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  backBtnText: { fontSize: 16, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 20, maxWidth: 500, alignSelf: 'center', width: '100%', flexGrow: 1, justifyContent: 'center' },
  card: {
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 16, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
  codeBox: {
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  codeText: { fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  shareBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  }
});
