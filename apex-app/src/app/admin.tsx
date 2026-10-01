import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Alert, Modal, Image, Platform, Linking } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useSettings } from '../context/SettingsContext';
import { api, BASE_URL } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { removeSecureToken } from '../utils/secureTokenStorage';
import { Ionicons } from '@expo/vector-icons';
import ApexLoader from '../components/ApexLoader';
import { Skeleton } from '../components/Skeleton';
import { useResponsive } from '../hooks/useResponsive';
import { getStoredTickets } from '../utils/ticketStorage';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const { theme, t, isRTL, activeTheme, currentUser, setCurrentUser, isAppReady } = useSettings();
  
  const [activeTab, setActiveTab] = useState<'projects' | 'quotes' | 'invoices' | 'users' | 'analytics' | 'support'>('projects');
  const [quotes, setQuotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  // Agency Settings State
  const [agencySettings, setAgencySettings] = useState<any>({
    companyName: 'Apex Software Agency',
    companyPhone: '+20 100 000 0000',
    companyEmail: 'contact@apex.com',
    taxId: 'TX-948201-EG',
    vodafoneCash: '01000000000',
    bankName: 'CIB (Commercial International Bank)',
    bankAccount: '100029384729',
    bankIban: 'EG1200000000100029384729',
    instapayHandle: 'apex@instapay',
    address: 'Cairo, Egypt'
  });
  const [showAgencySettingsModal, setShowAgencySettingsModal] = useState(false);
  const [savingAgencySettings, setSavingAgencySettings] = useState(false);

  // Financial & Sales Analytics State
  const [analytics, setAnalytics] = useState<any>(null);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [quoteFilter, setQuoteFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'pending' | 'paid'>('all');

  // Email Configuration State
  const [emailConfig, setEmailConfig] = useState<{ configured: boolean; user: string; rawUser?: string } | null>(null);
  const [showEmailConfigModal, setShowEmailConfigModal] = useState(false);
  const [showSentEmailsModal, setShowSentEmailsModal] = useState(false);
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [gmailUser, setGmailUser] = useState('');
  const [gmailPass, setGmailPass] = useState('');
  const [savingEmailConfig, setSavingEmailConfig] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState('abdallahelshamy82@gmail.com');
  const [testingEmail, setTestingEmail] = useState(false);
  const [viewingHtmlEmail, setViewingHtmlEmail] = useState<any>(null);

  // New Invoice Modal
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [selectedUserForInvoice, setSelectedUserForInvoice] = useState<any>(null);
  const [newInvTitle, setNewInvTitle] = useState('دفعة أولى من التعاقد (50%)');
  const [newInvAmount, setNewInvAmount] = useState('5000');
  const [newInvCurrency, setNewInvCurrency] = useState<'EGP' | 'USD' | 'SAR'>('EGP');
  const [invVodafoneCash, setInvVodafoneCash] = useState('01012685763');
  const [invInstapay, setInvInstapay] = useState('abdallah@instapay');
  const [invBankName, setInvBankName] = useState('CIB - البنك التجاري الدولي');
  const [invBankAccount, setInvBankAccount] = useState('100029384729');
  const [invBankIban, setInvBankIban] = useState('EG1200000000100029384729');
  const [saveAccountsAsDefault, setSaveAccountsAsDefault] = useState(false);
  const [newInvNotes, setNewInvNotes] = useState('');
  const [creatingInv, setCreatingInv] = useState(false);

  // Receipt Preview Modal
  const [viewingReceipt, setViewingReceipt] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [quotesRes, invoicesRes, usersRes, chatsRes, configRes, sentRes, agencyRes, analyticsRes] = await Promise.all([
      api.getQuotes(),
      api.getInvoices(),
      api.getUsers(),
      api.getAdminChats(),
      api.getEmailConfig(),
      api.getSentEmails(),
      api.getAgencySettings(),
      api.getAdminAnalytics(),
    ]);
    
    if (quotesRes.success) setQuotes(quotesRes.quotes);
    if (invoicesRes.success) setInvoices(invoicesRes.invoices);
    if (usersRes.success) setUsers(usersRes.users);
    let initialChats: any[] = chatsRes.success ? (chatsRes.chats || []) : [];
    try {
      const storedTickets = await getStoredTickets();
      if (storedTickets.length > 0) {
        storedTickets.forEach(st => {
          const idx = initialChats.findIndex(c => c.id === st.id || c.id === st.userId);
          if (idx >= 0) {
            initialChats[idx] = {
              ...initialChats[idx],
              lastMessage: st.lastMessage || initialChats[idx].lastMessage,
              lastMessageTime: st.lastMessageTime || initialChats[idx].lastMessageTime,
              hasAttachment: st.hasAttachment || initialChats[idx].hasAttachment,
            };
          } else {
            initialChats.push({
              id: st.userId,
              fullName: st.fullName || `عميل #${st.userId}`,
              email: st.email || '',
              lastMessage: st.lastMessage || '',
              lastMessageTime: st.lastMessageTime || '',
              hasAttachment: st.hasAttachment,
            });
          }
        });
      }
    } catch (e) {}
    setChats(initialChats);
    if (configRes.success) {
      setEmailConfig(configRes);
      if (configRes.rawUser) setGmailUser(configRes.rawUser);
    }
    if (sentRes.success) setSentEmails(sentRes.emails);
    if (agencyRes?.success && agencyRes.settings) {
      setAgencySettings(agencyRes.settings);
      if (agencyRes.settings.vodafoneCash) setInvVodafoneCash(agencyRes.settings.vodafoneCash);
      if (agencyRes.settings.instapayHandle) setInvInstapay(agencyRes.settings.instapayHandle);
      if (agencyRes.settings.bankName) setInvBankName(agencyRes.settings.bankName);
      if (agencyRes.settings.bankAccount) setInvBankAccount(agencyRes.settings.bankAccount);
      if (agencyRes.settings.bankIban) setInvBankIban(agencyRes.settings.bankIban);
    }
    if (analyticsRes?.success && analyticsRes.analytics) setAnalytics(analyticsRes.analytics);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAppReady || currentUser?.role !== 'admin') return;
    loadData();
  }, [currentUser?.role, isAppReady, loadData]);

  if (!isAppReady) {
    return (
      <ApexLoader
        fullScreen
        theme={theme}
        isRTL={isRTL}
        message={isRTL ? 'جاري التحقق من صلاحيات الأمان...' : 'Verifying Security Credentials...'}
      />
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return <Redirect href="/" />;
  }

  const handleSaveUserProject = async (userId: number, projectName: string, projectPhase: string, projectProgress: number) => {
    const res = await api.updateProject(userId, projectName, projectPhase, projectProgress);
    if (res.success) {
      loadData();
      return true;
    }
    return false;
  };

  const handleSendUserEmail = async (userId: number) => {
    const res = await api.sendUpdateEmail(userId);
    loadData();
    return res;
  };

  const handleSaveEmailConfig = async () => {
    if (!gmailUser || !gmailPass) {
      const msg = isRTL ? 'يرجى إدخال عنوان Gmail وكلمة مرور التطبيق (App Password)' : 'Please enter Gmail and App Password';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Error', msg);
      return;
    }

    setSavingEmailConfig(true);
    const res = await api.updateEmailConfig(gmailUser, gmailPass);
    setSavingEmailConfig(false);

    if (res.success) {
      const msg = isRTL ? 'تم حفظ وربط Gmail بنجاح! سيتم تسليم كافة الرسائل في صناديق البريد الحقيقية.' : 'Gmail configured successfully!';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Success', msg);
      setShowEmailConfigModal(false);
      loadData();
    } else {
      const err = res.message || (isRTL ? 'فشل حفظ الإعدادات' : 'Failed to save config');
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(err);
      else Alert.alert('Error', err);
    }
  };

  const handleSendTestEmail = async () => {
    setTestingEmail(true);
    const res = await api.sendTestEmail(testEmailTarget || undefined);
    setTestingEmail(false);
    if (res.success) {
      const isDelivered = res.result?.delivered;
      const msg = isDelivered
        ? (isRTL ? `تم تسليم البريد التجريبي بنجاح إلى: ${testEmailTarget}!` : 'Test email delivered to inbox!')
        : (isRTL ? `تم إنشاء البريد بوضع المحاكاة.\nيرجى حفظ كلمة مرور تطبيقات جوجل (App Password) لتصل الرسائل لصندوق Gmail الحقيقي.` : 'Email simulated.');
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert(isRTL ? 'نتيجة الاختبار' : 'Test Result', msg);
      loadData();
    } else {
      const err = res.error || (isRTL ? 'فشل إرسال البريد التجريبي' : 'Failed to send test email');
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(err);
      else Alert.alert('Error', err);
    }
  };

  const handleUpdateQuote = async (quoteId: number, status: string) => {
    const res = await api.updateQuoteStatus(quoteId, status);
    if (res.success) {
      Alert.alert(isRTL ? 'تم بنجاح' : 'Success', isRTL ? `تم تحديث حالة الطلب إلى: ${status}` : `Quote status updated to: ${status}`);
      loadData();
    }
  };

  const handleConvertQuoteToInvoice = async (q: any) => {
    // Find matching user by email
    const client = users.find(u => u.email === q.email);
    if (!client) {
      Alert.alert('Error', isRTL ? 'لم يتم العثور على حساب العميل المسجل بهذا البريد' : 'Client user account not found');
      return;
    }

    const amount = Math.round((q.totalCost || 1000) * 0.5);
    const res = await api.createInvoice({
      userId: client.id,
      quoteId: q.id,
      title: 'دفعة أولى 50% من تكلفة المشروع',
      amount,
      notes: `تم إنشاء الفاتورة من طلب التسعيرة #${q.id}`
    });

    if (res.success) {
      await api.updateQuoteStatus(q.id, 'approved');
      Alert.alert(
        isRTL ? 'تم إنشاء الفاتورة بنجاح' : 'Invoice Created',
        isRTL ? `تم إصدار الفاتورة #${res.invoiceNumber} بمبلغ $${amount} وإرسال إشعار للعميل.` : `Invoice created & email sent to ${client.email}`
      );
      loadData();
    }
  };

  const handleCreateManualInvoice = async () => {
    if (!selectedUserForInvoice || !newInvAmount) {
      const msg = isRTL ? 'يرجى اختيار العميل وتحديد المبلغ المطلوب' : 'Please select client and specify amount';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Error', msg);
      return;
    }

    setCreatingInv(true);

    try {
      // 1. If admin opted to save accounts as default, update agency settings
      if (saveAccountsAsDefault) {
        await api.updateAgencySettings({
          companyName: agencySettings?.companyName || 'Apex Software',
          companyPhone: agencySettings?.companyPhone || '01012685763',
          companyEmail: agencySettings?.companyEmail || 'contact@apex.com',
          vodafoneCash: invVodafoneCash,
          instapayHandle: invInstapay,
          bankName: invBankName,
          bankAccount: invBankAccount,
          bankIban: invBankIban,
        });
      }

      // 2. Format payment accounts into invoice notes so client sees them permanently
      const paymentInstructions = [
        isRTL ? 'طرق وأرقام السداد المعتمدة لهذه الفاتورة:' : 'Approved payment methods for this invoice:',
        invVodafoneCash ? `• فودافون كاش: ${invVodafoneCash}` : null,
        invInstapay ? `• إنستاباي: ${invInstapay}` : null,
        invBankAccount ? `• تحويل بنكي (${invBankName}): ${invBankAccount}` : null,
        invBankIban ? `• الآيبان (IBAN): ${invBankIban}` : null,
        newInvNotes ? `\nملاحظات: ${newInvNotes}` : null,
      ].filter(Boolean).join('\n');

      const amountNum = parseFloat(newInvAmount) || 100;
      const res = await api.createInvoice({
        userId: selectedUserForInvoice.id,
        title: `${newInvTitle} (${newInvCurrency})`,
        amount: amountNum,
        notes: paymentInstructions
      });

      setCreatingInv(false);

      if (res.success) {
        setShowNewInvoiceModal(false);
        setSelectedUserForInvoice(null);
        setNewInvAmount('5000');
        setNewInvNotes('');
        loadData();
        const successMsg = isRTL 
          ? `تم إصدار الفاتورة بقيمة ${amountNum} ${newInvCurrency} مع أرقام وحسابات السداد وإشعار العميل بنجاح!`
          : 'Invoice issued with payment accounts successfully!';
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(successMsg);
        else Alert.alert('Success', successMsg);
      } else {
        const errMsg = res.message || (isRTL ? 'حدث خطأ أثناء إصدار الفاتورة' : 'Failed to create invoice');
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(errMsg);
        else Alert.alert('Error', errMsg);
      }
    } catch (e: any) {
      setCreatingInv(false);
      const errMsg = e.message || 'Error creating invoice';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(errMsg);
      else Alert.alert('Error', errMsg);
    }
  };

  
  const getCleanReceiptUrl = (raw: any): string => {
    if (!raw) return '';
    const str = typeof raw === 'string' ? raw : (raw.receiptUrl || raw.url || '');
    if (!str) return '';
    if (str.includes('data:image')) {
      const idx = str.indexOf('data:image');
      return str.substring(idx);
    }
    return str;
  };

  const handleUpdateInvoiceStatus = async (invoiceId: number, status: string) => {
    const res = await api.updateInvoiceStatus(invoiceId, status);
    if (res.success) {
      Alert.alert(isRTL ? 'تم بنجاح' : 'Success', isRTL ? 'تم اعتماد حالة السداد وإرسال التأكيد للعميل.' : 'Payment confirmed.');
      loadData();
    }
  };

  const handleDeleteQuote = async (id: number) => {
    const proceed = Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.confirm(isRTL ? 'هل أنت متأكد من حذف طلب التسعيرة هذا؟' : 'Are you sure you want to delete this quote?')
      : true;
    if (!proceed) return;

    const res = await api.deleteQuote(id);
    if (res.success) {
      loadData();
    } else {
      Alert.alert('Error', res.message || 'Failed to delete quote');
    }
  };

  const handleDeleteInvoice = async (id: number) => {
    const proceed = Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.confirm(isRTL ? 'هل أنت متأكد من حذف هذه الفاتورة نهائياً؟' : 'Are you sure you want to delete this invoice?')
      : true;
    if (!proceed) return;

    const res = await api.deleteInvoice(id);
    if (res.success) {
      loadData();
    } else {
      Alert.alert('Error', res.message || 'Failed to delete invoice');
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    const proceed = Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.confirm(isRTL ? `هل أنت متأكد من حذف حساب العميل "${name}" نهائياً مع كافة فواتيره وبياناته؟` : `Are you sure you want to delete client "${name}"?`)
      : true;
    if (!proceed) return;

    const res = await api.deleteUser(id);
    if (res.success) {
      loadData();
    } else {
      const msg = res.message || (isRTL ? 'لا يمكن حذف هذا الحساب' : 'Cannot delete this account');
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Error', msg);
    }
  };

  const handleOpenPrintInvoice = async (invoiceId: number) => {
    const token = await api.getToken();
    const url = `${BASE_URL}/invoice-print/${invoiceId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const handleUpdateProjectTasks = async (userId: number, tasks: any[]) => {
    const res = await api.updateProjectTasks(userId, tasks);
    if (res.success) {
      loadData();
      return true;
    }
    return false;
  };

  const handleSaveAgencySettings = async () => {
    setSavingAgencySettings(true);
    const res = await api.updateAgencySettings(agencySettings);
    setSavingAgencySettings(false);
    if (res.success) {
      if (res.settings) setAgencySettings(res.settings);
      const msg = isRTL ? 'تم حفظ وتحديث بيانات الوكالة والحسابات البنكية بنجاح!' : 'Agency & bank settings updated!';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert(isRTL ? 'تم الحفظ' : 'Saved', msg);
      setShowAgencySettingsModal(false);
      loadData();
    } else {
      const err = res.message || (isRTL ? 'فشل حفظ الإعدادات' : 'Failed to save settings');
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(err);
      else Alert.alert('Error', err);
    }
  };

  const handleUpdateDeliverables = async (userId: number, deliverables: any[]) => {
    const res = await api.updateDeliverables(userId, deliverables);
    if (res.success) {
      loadData();
      return true;
    }
    return false;
  };

  const renderQuotes = () => {
    const filteredQuotes = quotes.filter(q => {
      const status = q.status || 'pending';
      const matchesFilter = quoteFilter === 'all' || status === quoteFilter;
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesFilter;
      const email = (q.email || '').toLowerCase();
      const platform = (q.platform || '').toLowerCase();
      const features = (q.features || '').toLowerCase();
      return matchesFilter && (email.includes(query) || platform.includes(query) || features.includes(query));
    });

    return (
      <View>
        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginBottom: 14, paddingVertical: 2 }}
        >
          {[
            { id: 'all', label: isRTL ? 'الكل' : 'All', icon: 'grid-outline', count: quotes.length },
            { id: 'pending', label: isRTL ? 'قيد المراجعة' : 'Pending', icon: 'time-outline', count: quotes.filter(q => !q.status || q.status === 'pending').length },
            { id: 'approved', label: isRTL ? 'مقبولة' : 'Approved', icon: 'checkmark-circle-outline', count: quotes.filter(q => q.status === 'approved').length },
            { id: 'rejected', label: isRTL ? 'مرفوضة' : 'Rejected', icon: 'close-circle-outline', count: quotes.filter(q => q.status === 'rejected').length },
          ].map(f => {
            const isSelected = quoteFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setQuoteFilter(f.id as any)}
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                  backgroundColor: isSelected ? theme.primary : theme.card,
                  borderWidth: 1,
                  borderColor: isSelected ? theme.primary : theme.border,
                }}
              >
                <Ionicons name={f.icon as any} size={13} color={isSelected ? '#FFF' : theme.textMuted} />
                <Text style={{ fontSize: 12, fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? '#FFF' : theme.text }}>
                  {f.label} ({f.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {filteredQuotes.length === 0 ? (
          <Text style={{ color: theme.textMuted, textAlign: 'center', marginVertical: 30 }}>{t('noData')}</Text>
        ) : (
          filteredQuotes.map((q, idx) => {
            let parsedFeatures: any = {};
            let platforms = [];
            try { platforms = JSON.parse(q.platform); } catch (e) {}
            try { parsedFeatures = JSON.parse(q.features); } catch (e) { parsedFeatures = {}; }
            let parsedAi: any = null;
            try { if (q.aiAnalysis) parsedAi = typeof q.aiAnalysis === 'string' ? JSON.parse(q.aiAnalysis) : q.aiAnalysis; } catch (e) {}
            const isAiCopilot = q.source === 'ai_copilot' || parsedFeatures?.source === 'ai_copilot' || !!parsedAi;
            
            const featuresList = (parsedFeatures.features || []).join(', ');
            const status = q.status || 'pending';

            let statusColor = '#F59E0B';
            if (status === 'approved') statusColor = '#10B981';
            if (status === 'rejected') statusColor = '#EF4444';

            return (
              <View key={idx} style={[styles.dataCard, { backgroundColor: theme.card, borderColor: isAiCopilot ? '#38BDF8' : theme.border }]}>
                {isAiCopilot && (
                  <View style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 8,
                    marginBottom: 10,
                    alignSelf: isRTL ? 'flex-end' : 'flex-start',
                    borderWidth: 1,
                    borderColor: 'rgba(56, 189, 248, 0.35)',
                  }}>
                    <Ionicons name="hardware-chip" size={15} color="#38BDF8" />
                    <Text style={{ color: '#38BDF8', fontSize: 12, fontWeight: '800' }}>
                      {isRTL ? 'طلب تعاقد فوري عبر المستشار الذكي (AI Copilot)' : 'Instant Contract via AI Copilot'}
                    </Text>
                    {parsedAi?.timelineWeeks && (
                      <Text style={{ color: '#94A3B8', fontSize: 11, marginLeft: 6 }}>
                        • {parsedAi.timelineWeeks} {isRTL ? 'أسابيع' : 'weeks'}
                      </Text>
                    )}
                  </View>
                )}

                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                    <Text style={[styles.dataTitle, { color: theme.primary }]}>{q.email}</Text>
                    {parsedAi?.projectName && (
                      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4, marginVertical: 2 }}>
                        <Ionicons name="cube-outline" size={14} color={theme.text} />
                        <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold' }}>
                          {parsedAi.projectName}
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.dataSubtitle, { color: theme.textMuted }]}>
                      {t('quotePlatform')}: {Array.isArray(platforms) ? platforms.join(' + ') : q.platform}
                    </Text>
                    <Text style={[styles.dataSubtitle, { color: theme.textMuted }]}>
                      {t('quoteFeatures')}: {featuresList || (parsedAi ? parsedAi.domainName : 'None')}
                    </Text>
                    <Text style={[styles.dataSubtitle, { color: theme.textMuted }]}>
                      {isRTL ? 'التاريخ:' : 'Date:'} {new Date(q.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
                    <Text style={[styles.dataAmount, { color: theme.text }]}>
                      {q.totalCost > 5000 ? `${q.totalCost.toLocaleString()} EGP` : `$${q.totalCost}`}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: `${statusColor}15` }]}>
                      <Text style={{ color: statusColor, fontWeight: 'bold', fontSize: 11 }}>{status.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>

                {/* Admin Action Buttons on Quote */}
                <View style={[styles.actionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 6 }]}>
                  {status !== 'approved' && (
                    <TouchableOpacity 
                      style={[styles.smallActionBtn, { backgroundColor: '#10B981', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }]}
                      onPress={() => handleUpdateQuote(q.id, 'approved')}
                    >
                      <Ionicons name="checkmark-circle" size={14} color="#FFF" />
                      <Text style={styles.smallActionText}>{isRTL ? 'قبول' : 'Approve'}</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    style={[styles.smallActionBtn, { backgroundColor: theme.primary, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }]}
                    onPress={() => handleConvertQuoteToInvoice(q)}
                  >
                    <Ionicons name="document-text" size={14} color="#FFF" />
                    <Text style={styles.smallActionText}>{isRTL ? 'تحويل لفاتورة 50%' : 'To Invoice (50%)'}</Text>
                  </TouchableOpacity>

                  {status !== 'rejected' && (
                    <TouchableOpacity 
                      style={[styles.smallActionBtn, { backgroundColor: '#EF4444', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }]}
                      onPress={() => handleUpdateQuote(q.id, 'rejected')}
                    >
                      <Ionicons name="close-circle" size={14} color="#FFF" />
                      <Text style={styles.smallActionText}>{isRTL ? 'رفض' : 'Reject'}</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    style={[styles.smallActionBtn, { backgroundColor: '#EF444420', borderWidth: 1, borderColor: '#EF444466', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }]}
                    onPress={() => handleDeleteQuote(q.id)}
                  >
                    <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    <Text style={[styles.smallActionText, { color: '#EF4444' }]}>{isRTL ? 'حذف' : 'Delete'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    );
  };

  const renderInvoices = () => {
    const filteredInvoices = invoices.filter(inv => {
      const isPaid = inv.status === 'PAID';
      const matchesFilter = invoiceFilter === 'all' 
        ? true 
        : invoiceFilter === 'paid' ? isPaid : !isPaid;
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesFilter;
      const num = String(inv.invoiceNumber || '').toLowerCase();
      const title = (inv.title || '').toLowerCase();
      const client = (inv.clientEmail || inv.clientName || '').toLowerCase();
      return matchesFilter && (num.includes(query) || title.includes(query) || client.includes(query));
    });

    return (
      <View>
        <View style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
          flexWrap: 'wrap',
          gap: 8
        }}>
          {/* Filter Chips */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 6, alignItems: 'center' }}
            style={{ flexGrow: 1 }}
          >
            {[
              { id: 'all', label: isRTL ? 'الكل' : 'All', icon: 'grid-outline', count: invoices.length },
              { id: 'pending', label: isRTL ? 'غير مسددة' : 'Unpaid', icon: 'time-outline', count: invoices.filter(i => i.status !== 'PAID').length },
              { id: 'paid', label: isRTL ? 'مسددة' : 'Paid', icon: 'checkmark-circle-outline', count: invoices.filter(i => i.status === 'PAID').length },
            ].map(f => {
              const isSelected = invoiceFilter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setInvoiceFilter(f.id as any)}
                  style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 20,
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderWidth: 1,
                    borderColor: isSelected ? theme.primary : theme.border,
                  }}
                >
                  <Ionicons name={f.icon as any} size={13} color={isSelected ? '#FFF' : theme.textMuted} />
                  <Text style={{ fontSize: 12, fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? '#FFF' : theme.text }}>
                    {f.label} ({f.count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity 
            style={[styles.newInvBtn, { backgroundColor: theme.primary, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8 }]}
            onPress={() => setShowNewInvoiceModal(true)}
          >
            <Ionicons name="add-circle" size={16} color="#FFF" />
            <Text style={[styles.newInvBtnText, { fontSize: 12 }]}>{isRTL ? 'إصدار فاتورة' : 'New Invoice'}</Text>
          </TouchableOpacity>
        </View>

        {filteredInvoices.length === 0 ? (
          <Text style={{ color: theme.textMuted, textAlign: 'center', marginVertical: 30 }}>{t('noData')}</Text>
        ) : (
          filteredInvoices.map((inv) => {
            const isPaid = inv.status === 'PAID';
            const isReview = inv.status === 'UNDER_REVIEW';

            let statusColor = '#EF4444';
            if (isPaid) statusColor = '#10B981';
            else if (isReview) statusColor = '#F59E0B';

            return (
              <View key={inv.id} style={[styles.dataCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                    <Text style={[styles.dataTitle, { color: theme.primary }]}>#{inv.invoiceNumber} • {inv.title}</Text>
                    <Text style={[styles.dataSubtitle, { color: theme.textMuted }]}>
                      {isRTL ? 'العميل:' : 'Client:'} {inv.clientName || inv.clientname || (users.find(u => u.id === (inv.userId || inv.userid))?.fullName) || inv.clientEmail || inv.clientemail || `User #${inv.userId || inv.userid}`}
                    </Text>
                    <Text style={[styles.dataSubtitle, { color: theme.textMuted }]}>
                      {isRTL ? 'التاريخ:' : 'Date:'} {inv.date}
                    </Text>
                    {inv.notes ? (
                      <Text style={[styles.dataSubtitle, { color: theme.text, marginTop: 4 }]}>
                        {isRTL ? 'ملاحظات:' : 'Notes:'} {inv.notes}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
                    <Text style={[styles.dataAmount, { color: theme.text }]}>${inv.amount}</Text>
                    <View style={[styles.badge, { backgroundColor: `${statusColor}15` }]}>
                      <Text style={{ color: statusColor, fontWeight: 'bold', fontSize: 11 }}>{inv.status}</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.actionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 6 }]}>
                  {/* Print / PDF Official Invoice Button */}
                  <TouchableOpacity 
                    style={[styles.smallActionBtn, { backgroundColor: '#6366F1', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }]}
                    onPress={() => handleOpenPrintInvoice(inv.id)}
                  >
                    <Ionicons name="print-outline" size={14} color="#FFF" />
                    <Text style={styles.smallActionText}>{isRTL ? 'طباعة / PDF' : 'Print / PDF'}</Text>
                  </TouchableOpacity>

                  {inv.receiptUrl ? (
                    <TouchableOpacity 
                      style={[styles.smallActionBtn, { backgroundColor: '#3B82F6', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }]}
                      onPress={() => setViewingReceipt(inv)}
                    >
                      <Ionicons name="eye-outline" size={14} color="#FFF" />
                      <Text style={styles.smallActionText}>{isRTL ? 'معاينة الإيصال' : 'View Receipt'}</Text>
                    </TouchableOpacity>
                  ) : null}

                  {!isPaid && (
                    <TouchableOpacity 
                      style={[styles.smallActionBtn, { backgroundColor: '#10B981', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }]}
                      onPress={() => handleUpdateInvoiceStatus(inv.id, 'PAID')}
                    >
                      <Ionicons name="checkmark-circle" size={14} color="#FFF" />
                      <Text style={styles.smallActionText}>{isRTL ? 'اعتماد كمدفوعة' : 'Mark Paid'}</Text>
                    </TouchableOpacity>
                  )}

                  {/* Delete Invoice Button */}
                  <TouchableOpacity 
                    style={[styles.smallActionBtn, { backgroundColor: '#EF444420', borderWidth: 1, borderColor: '#EF444466', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }]}
                    onPress={() => handleDeleteInvoice(inv.id)}
                  >
                    <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    <Text style={[styles.smallActionText, { color: '#EF4444' }]}>{isRTL ? 'حذف' : 'Delete'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    );
  };


  const renderProjects = () => {
    const projectUsers = users.filter(u => {
      const hasProject = !!(u.projectName && u.projectName !== 'لا يوجد');
      const query = searchQuery.trim().toLowerCase();
      if (!query) return hasProject;
      const name = (u.fullName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const project = (u.projectName || '').toLowerCase();
      return hasProject && (name.includes(query) || email.includes(query) || project.includes(query));
    });

    if (projectUsers.length === 0) {
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 50 }}>
          <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: `${theme.primary}18`, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Ionicons name="cube-outline" size={34} color={theme.primary} />
          </View>
          <Text style={{ color: theme.text, fontSize: 17, fontWeight: 'bold', marginBottom: 6 }}>
            {isRTL ? 'لا توجد مشاريع جارية مسجلة حالياً' : 'No active projects currently'}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center', maxWidth: 320, marginBottom: 18, lineHeight: 20 }}>
            {isRTL ? 'يمكنك إسناد مشروع جديد وتحديث نسب الإنجاز لأي عميل من تبويب "حسابات العملاء".' : 'You can assign a project and manage milestones from the "Clients" tab.'}
          </Text>
          <TouchableOpacity 
            onPress={() => setActiveTab('users')} 
            style={{ backgroundColor: theme.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 }}
          >
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>
              {isRTL ? 'استعراض العملاء' : 'Browse Clients'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View>
        {/* KPI Banner for Live Projects */}
        <View style={{
          backgroundColor: `${theme.primary}12`,
          borderColor: `${theme.primary}33`,
          borderWidth: 1,
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="rocket" size={24} color="#FFF" />
            </View>
            <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>
                {isRTL ? 'لوحة متابعة المشاريع الحية' : 'Live Projects Dashboard'}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                {isRTL ? `يوجد ${projectUsers.length} مشروع نشط قيد التنفيذ والمتابعة` : `${projectUsers.length} active project(s) in progress`}
              </Text>
            </View>
          </View>
        </View>

        {projectUsers.map((u, idx) => (
          <UserProjectCard
            key={u.id || idx}
            u={u}
            theme={theme}
            isRTL={isRTL}
            onSaveProject={handleSaveUserProject}
            onSendEmail={handleSendUserEmail}
            onOpenInvoiceModal={(clientUser) => {
              setSelectedUserForInvoice(clientUser);
              setShowNewInvoiceModal(true);
            }}
            onDeleteUser={handleDeleteUser}
            onUpdateTasks={handleUpdateProjectTasks}
            onUpdateDeliverables={handleUpdateDeliverables}
            router={router}
          />
        ))}
      </View>
    );
  };

  const renderUsers = () => {
    const filteredUsers = users.filter(u => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      const name = (u.fullName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      const project = (u.projectName || '').toLowerCase();
      return name.includes(query) || email.includes(query) || phone.includes(query) || project.includes(query);
    });

    if (filteredUsers.length === 0) return <Text style={{ color: theme.textMuted, textAlign: 'center', marginVertical: 30 }}>{t('noData')}</Text>;

    return filteredUsers.map((u, idx) => (
      <UserProjectCard
        key={u.id || idx}
        u={u}
        theme={theme}
        isRTL={isRTL}
        onSaveProject={handleSaveUserProject}
        onSendEmail={handleSendUserEmail}
        onOpenInvoiceModal={(clientUser) => {
          setSelectedUserForInvoice(clientUser);
          setShowNewInvoiceModal(true);
        }}
        onDeleteUser={handleDeleteUser}
        onUpdateTasks={handleUpdateProjectTasks}
        onUpdateDeliverables={handleUpdateDeliverables}
        router={router}
      />
    ));
  };

  const renderChats = () => {
    if (chats.length === 0) return <Text style={{ color: theme.textMuted, textAlign: 'center', marginVertical: 30 }}>{t('noData')}</Text>;

    return chats.map((c, idx) => (
      <TouchableOpacity 
        key={c.id || idx} 
        style={[styles.dataCard, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row', marginBottom: 12 }]}
        onPress={() => router.push({ pathname: '/chat', params: { targetUserId: c.id } })}
      >
        <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.dataTitle, { color: theme.text, marginBottom: 0 }]}>{c.fullName || `User #${c.id}`}</Text>
            {c.hasAttachment && (
              <View style={{ backgroundColor: `${theme.primary}22`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: theme.primary, fontSize: 10, fontWeight: 'bold' }}>
                  {isRTL ? 'مرفقات' : 'Attachment'}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.dataSubtitle, { color: theme.textMuted, marginTop: 2 }]}>{c.email}</Text>
          {c.lastMessage ? (
            <Text numberOfLines={1} style={{ color: theme.text, fontSize: 12, marginTop: 4 }}>
              {c.lastMessage}
            </Text>
          ) : null}
          {c.lastMessageTime ? (
            <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2 }}>
              {c.lastMessageTime}
            </Text>
          ) : null}
        </View>
        <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', justifyContent: 'center' }}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4, backgroundColor: `${theme.primary}18`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: `${theme.primary}44` }}>
            <Ionicons name="chatbubble-outline" size={14} color={theme.primary} />
            <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>{isRTL ? 'رد' : 'Reply'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ));
  };

  const renderAnalytics = () => {
    const financials = analytics?.financials || {
      totalRevenue: invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (Number(i.amount) || 0), 0),
      pendingRevenue: invoices.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + (Number(i.amount) || 0), 0),
      totalInvoices: invoices.length,
      paidCount: invoices.filter(i => i.status === 'PAID').length,
      pendingCount: invoices.filter(i => i.status !== 'PAID').length,
    };

    const quoteStats = analytics?.quotes || {
      totalQuotes: quotes.length,
      approvedQuotes: quotes.filter(q => q.status === 'approved').length,
      pendingQuotes: quotes.filter(q => !q.status || q.status === 'pending').length,
      rejectedQuotes: quotes.filter(q => q.status === 'rejected').length,
      conversionRate: quotes.length > 0 ? Math.round((quotes.filter(q => q.status === 'approved').length / quotes.length) * 100) : 0,
    };

    const clientCount = analytics?.clients?.totalClients ?? users.filter(u => u.role !== 'admin').length;
    const platforms = analytics?.platforms || { web: 0, android: 0, ios: 0, totalSelected: 0 };
    const totalPlatformCount = Math.max(1, (platforms.web || 0) + (platforms.android || 0) + (platforms.ios || 0));

    return (
      <View style={{ gap: 16 }}>
        {/* Header Title */}
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="bar-chart-outline" size={20} color={theme.primary} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>
                {isRTL ? 'لوحة التحليلات والمؤشرات المالية' : 'Financial & Sales Analytics'}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
              {isRTL ? 'نظرة شاملة ومحدثة فورياً على أداء الشركة والمبيعات' : 'Real-time overview of revenue, pipeline and clients'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={loadData} 
            style={{ 
              paddingVertical: 6, 
              paddingHorizontal: 12, 
              borderRadius: 8, 
              backgroundColor: `${theme.primary}20`,
              borderWidth: 1,
              borderColor: `${theme.primary}55`,
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Ionicons name="refresh" size={13} color={theme.primary} />
            <Text style={{ color: theme.primary, fontSize: 12, fontWeight: 'bold' }}>
              {isRTL ? 'تحديث' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4 Main KPI Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {/* Card 1: Total Revenue */}
          <View style={{
            flex: 1,
            minWidth: 150,
            backgroundColor: theme.card,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: '#10B98144',
            borderLeftWidth: 4,
            borderLeftColor: '#10B981',
          }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="cash-outline" size={14} color="#10B981" />
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                {isRTL ? 'الإيرادات المحصلة' : 'Collected Revenue'}
              </Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#10B981', marginVertical: 6, textAlign: isRTL ? 'right' : 'left' }}>
              ${Number(financials.totalRevenue || 0).toLocaleString()}
            </Text>
            <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }}>
              {financials.paidCount || 0} {isRTL ? 'فواتير تم سدادها' : 'Paid Invoices'}
            </Text>
          </View>

          {/* Card 2: Pending Revenue */}
          <View style={{
            flex: 1,
            minWidth: 150,
            backgroundColor: theme.card,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: '#F59E0B44',
            borderLeftWidth: 4,
            borderLeftColor: '#F59E0B',
          }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="time-outline" size={14} color="#F59E0B" />
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                {isRTL ? 'المستحقات المعلقة' : 'Pending Invoices'}
              </Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#F59E0B', marginVertical: 6, textAlign: isRTL ? 'right' : 'left' }}>
              ${Number(financials.pendingRevenue || 0).toLocaleString()}
            </Text>
            <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }}>
              {financials.pendingCount || 0} {isRTL ? 'فاتورة قيد التحصيل' : 'Pending Review'}
            </Text>
          </View>

          {/* Card 3: Quotes Conversion Rate */}
          <View style={{
            flex: 1,
            minWidth: 150,
            backgroundColor: theme.card,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: `${theme.primary}44`,
            borderLeftWidth: 4,
            borderLeftColor: theme.primary,
          }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="trending-up-outline" size={14} color={theme.primary} />
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                {isRTL ? 'معدل اعتماد الطلبات' : 'Quotes Conversion'}
              </Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: theme.primary, marginVertical: 6, textAlign: isRTL ? 'right' : 'left' }}>
              {quoteStats.conversionRate || 0}%
            </Text>
            <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }}>
              {quoteStats.approvedQuotes || 0} {isRTL ? 'معتمد من' : 'approved of'} {quoteStats.totalQuotes || 0}
            </Text>
          </View>

          {/* Card 4: Total Clients */}
          <View style={{
            flex: 1,
            minWidth: 150,
            backgroundColor: theme.card,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: '#8B5CF644',
            borderLeftWidth: 4,
            borderLeftColor: '#8B5CF6',
          }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="people-outline" size={14} color="#8B5CF6" />
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                {isRTL ? 'العملاء المسجلين' : 'Total Clients'}
              </Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#8B5CF6', marginVertical: 6, textAlign: isRTL ? 'right' : 'left' }}>
              {clientCount}
            </Text>
            <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }}>
              {isRTL ? 'حسابات نشطة بالمنصة' : 'Active Registered Accounts'}
            </Text>
          </View>
        </View>

        {/* Platform Distribution Card */}
        <View style={{
          backgroundColor: theme.card,
          borderRadius: 16,
          padding: 18,
          borderWidth: 1,
          borderColor: theme.border,
        }}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <Ionicons name="phone-portrait-outline" size={18} color={theme.primary} />
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: theme.text }}>
              {isRTL ? 'توزيع المنصات والأنظمة الأكثر طلباً' : 'Requested Platforms Breakdown'}
            </Text>
          </View>

          {/* Web */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="globe-outline" size={15} color="#3B82F6" />
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{isRTL ? 'تطبيقات الويب (Web Platforms)' : 'Web Platforms'}</Text>
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>{platforms.web || 0} {isRTL ? 'طلب' : 'quotes'} ({Math.round(((platforms.web || 0) / totalPlatformCount) * 100)}%)</Text>
            </View>
            <View style={{ height: 8, backgroundColor: theme.btnBg, borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ width: `${Math.round(((platforms.web || 0) / totalPlatformCount) * 100)}%`, height: '100%', backgroundColor: '#3B82F6', borderRadius: 4 }} />
            </View>
          </View>

          {/* Android */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="logo-android" size={15} color="#10B981" />
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{isRTL ? 'تطبيقات أندرويد (Android App)' : 'Android Apps'}</Text>
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>{platforms.android || 0} {isRTL ? 'طلب' : 'quotes'} ({Math.round(((platforms.android || 0) / totalPlatformCount) * 100)}%)</Text>
            </View>
            <View style={{ height: 8, backgroundColor: theme.btnBg, borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ width: `${Math.round(((platforms.android || 0) / totalPlatformCount) * 100)}%`, height: '100%', backgroundColor: '#10B981', borderRadius: 4 }} />
            </View>
          </View>

          {/* iOS */}
          <View>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="logo-apple" size={15} color="#8B5CF6" />
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{isRTL ? 'تطبيقات آيفون (iOS App)' : 'iOS Apps'}</Text>
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>{platforms.ios || 0} {isRTL ? 'طلب' : 'quotes'} ({Math.round(((platforms.ios || 0) / totalPlatformCount) * 100)}%)</Text>
            </View>
            <View style={{ height: 8, backgroundColor: theme.btnBg, borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ width: `${Math.round(((platforms.ios || 0) / totalPlatformCount) * 100)}%`, height: '100%', backgroundColor: '#8B5CF6', borderRadius: 4 }} />
            </View>
          </View>
        </View>

        {/* Quotes Pipeline Status Grid */}
        <View style={{
          backgroundColor: theme.card,
          borderRadius: 16,
          padding: 18,
          borderWidth: 1,
          borderColor: theme.border,
        }}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <Ionicons name="git-network-outline" size={18} color={theme.primary} />
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: theme.text }}>
              {isRTL ? 'حالة خط إنتاج الطلبات والمبيعات' : 'Quotes & Leads Pipeline'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <View style={{ flex: 1, minWidth: 100, backgroundColor: theme.bg, padding: 12, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#10B981' }}>{quoteStats.approvedQuotes || 0}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text style={{ fontSize: 11, color: theme.textMuted }}>{isRTL ? 'معتمدة' : 'Approved'}</Text>
              </View>
            </View>
            <View style={{ flex: 1, minWidth: 100, backgroundColor: theme.bg, padding: 12, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#F59E0B' }}>{quoteStats.pendingQuotes || 0}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="time" size={12} color="#F59E0B" />
                <Text style={{ fontSize: 11, color: theme.textMuted }}>{isRTL ? 'قيد المراجعة' : 'Pending'}</Text>
              </View>
            </View>
            <View style={{ flex: 1, minWidth: 100, backgroundColor: theme.bg, padding: 12, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#EF4444' }}>{quoteStats.rejectedQuotes || 0}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="close-circle" size={12} color="#EF4444" />
                <Text style={{ fontSize: 11, color: theme.textMuted }}>{isRTL ? 'مرفوضة' : 'Rejected'}</Text>
              </View>
            </View>
            <View style={{ flex: 1, minWidth: 100, backgroundColor: theme.bg, padding: 12, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.primary }}>{financials.totalInvoices || 0}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="document-text" size={12} color={theme.primary} />
                <Text style={{ fontSize: 11, color: theme.textMuted }}>{isRTL ? 'فواتير صادرة' : 'Invoices'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  
  const renderSidebar = (isMobileView = false) => {
    const activeProjectsCount = users.filter((u:any) => u.projectName && u.projectName !== 'لا يوجد').length;
    const tabs = [
      { id: "projects", label: isRTL ? "المشاريع النشطة" : "Active Projects", icon: "cube-outline", count: activeProjectsCount },
      { id: "quotes", label: isRTL ? "طلبات التسعير" : "Quotes", icon: "document-text-outline", count: quotes.filter((q:any) => q.status === "pending").length },
      { id: "invoices", label: isRTL ? "الفواتير" : "Invoices", icon: "receipt-outline", count: invoices.filter((i:any) => i.status === "pending").length },
      { id: "users", label: isRTL ? "حسابات العملاء" : "Clients & Accounts", icon: "people-outline", count: users.filter((u:any) => u.role !== "admin").length },
      { id: "analytics", label: isRTL ? "التحليلات المالية" : "Analytics", icon: "bar-chart-outline", count: 0 },
      { id: "support", label: isRTL ? "الدعم والمحادثات" : "Support & Chat", icon: "chatbubbles-outline", count: chats.length },
    ];
    return (
      <View style={{ flex: 1, backgroundColor: theme.card, paddingVertical: 20 }}>
        {/* Header with Close Button for Mobile */}
        <View style={{ alignItems: "center", marginBottom: 24, paddingHorizontal: 16, position: 'relative' }}>
          {isMobileView && (
            <TouchableOpacity 
              onPress={() => setShowMobileSidebar(false)}
              style={{
                position: 'absolute',
                top: 0,
                left: isRTL ? 12 : undefined,
                right: !isRTL ? 12 : undefined,
                padding: 6,
                borderRadius: 20,
                backgroundColor: `${theme.primary}18`,
                zIndex: 10
              }}
            >
              <Ionicons name="close" size={20} color={theme.primary} />
            </TouchableOpacity>
          )}
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: `${theme.primary}20`, alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
            <Text style={{ color: theme.primary, fontSize: 26, fontWeight: "900" }}>A.</Text>
          </View>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "bold" }}>Apex Admin</Text>
          <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>Workspace</Text>
        </View>

        <ScrollView style={{ flex: 1 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={{
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  backgroundColor: isActive ? `${theme.primary}15` : "transparent",
                  borderRightWidth: !isRTL && isActive ? 3 : 0,
                  borderLeftWidth: isRTL && isActive ? 3 : 0,
                  borderColor: theme.primary,
                  marginBottom: 4
                }}
                onPress={() => {
                  setActiveTab(tab.id as any);
                  if (isMobileView) setShowMobileSidebar(false);
                }}
              >
                <Ionicons name={tab.icon as any} size={20} color={isActive ? theme.primary : theme.textMuted} />
                <Text style={{ flex: 1, color: isActive ? theme.primary : theme.text, fontSize: 14, fontWeight: isActive ? "bold" : "normal", marginHorizontal: 12, textAlign: isRTL ? "right" : "left" }}>
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View style={{ backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "bold" }}>{tab.count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const isMobile = responsive.width <= 768;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <View style={{ flex: 1, flexDirection: isRTL ? "row-reverse" : "row" }}>
        
        {/* Desktop Sidebar */}
        {(!isMobile && desktopSidebarOpen) && (
          <View style={{ width: 260, borderRightWidth: isRTL ? 0 : 1, borderLeftWidth: isRTL ? 1 : 0, borderColor: theme.border, backgroundColor: theme.card }}>
            {renderSidebar()}
          </View>
        )}

        {/* Mobile Drawer Overlay */}
        {isMobile && showMobileSidebar && (
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => setShowMobileSidebar(false)}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 99 }}
          />
        )}

        {/* Mobile Drawer Content */}
        {isMobile && showMobileSidebar && (
          <View style={{ 
            position: "absolute", top: 0, bottom: 0, 
            left: !isRTL ? 0 : undefined, right: isRTL ? 0 : undefined, 
            width: 280, backgroundColor: theme.card, zIndex: 100,
            shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5
          }}>
            {renderSidebar()}
          </View>
        )}

        {/* Main Content Area */}
        <View style={{ flex: 1 }}>
          
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border, flexDirection: isRTL ? "row-reverse" : "row", paddingVertical: 10 }]}>
            <View style={[styles.headerLeft, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              
              {/* Hamburger Button for Mobile */}
              <TouchableOpacity 
                onPress={() => {
                  if (isMobile) {
                    setShowMobileSidebar(true);
                  } else {
                    setDesktopSidebarOpen(!desktopSidebarOpen);
                  }
                }} 
                style={[styles.backBtn, { 
                  backgroundColor: theme.card, 
                  borderWidth: 1, 
                  borderColor: theme.border, 
                  padding: 8, 
                  borderRadius: 10,
                  marginRight: isRTL ? 0 : 8,
                  marginLeft: isRTL ? 8 : 0
                }]}
                accessibilityLabel="Toggle Sidebar"
              >
                <Ionicons 
                  name={isMobile ? "menu" : (desktopSidebarOpen ? (isRTL ? "chevron-forward" : "chevron-back") : "menu")} 
                  size={22} 
                  color={theme.primary} 
                />
              </TouchableOpacity>

              
              
              <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                  <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                    {t("adminDashboard")}
                  </Text>
                  <View style={{ backgroundColor: `${theme.primary}20`, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                    <Text style={{ color: theme.primary, fontSize: 10, fontWeight: "900" }}>Admin</Text>
                  </View>
                </View>
                <Text style={{ color: theme.textMuted, fontSize: 11 }} numberOfLines={1}>
                  {currentUser?.email}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
              <TouchableOpacity onPress={() => router.push("/dashboard")} style={[styles.refreshBtn, { backgroundColor: theme.primary, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6, paddingHorizontal: 12 }]}>
                <Ionicons name="person-outline" size={16} color="#FFF" />
                <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "bold" }}>
                  {isRTL ? "بوابة العميل" : "Client Portal"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={loadData} style={[styles.refreshBtn, { backgroundColor: `${theme.primary}20` }]}>
                {loading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Ionicons name="refresh" size={16} color={theme.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Universal Search Bar */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <View style={{ backgroundColor: theme.bg, borderRadius: 10, borderWidth: 1, borderColor: theme.border, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: Platform.OS === "ios" ? 8 : 4, gap: 8 }}>
              <Ionicons name="search" size={18} color={theme.textMuted} />
              <TextInput
                style={{ flex: 1, color: theme.text, fontSize: 13, paddingVertical: 4, textAlign: isRTL ? "right" : "left" }}
                placeholder={isRTL ? "البحث بالاسم، الإيميل، رقم الفاتورة، أو المشروع..." : "Search by name, email, invoice #, or project..."}
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Main Scrollable View */}
          <KeyboardAwareScrollView 
            contentContainerStyle={[styles.scrollContent, { maxWidth: responsive.containerWidth as any, paddingHorizontal: responsive.paddingHorizontal }]} 
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
            extraScrollHeight={Platform.OS === "ios" ? 20 : 0}
          >
            {loading ? (
              <View style={{ marginTop: 20 }}>
                <View style={{ height: 200, borderRadius: 16, backgroundColor: theme.card, marginBottom: 16 }} />
                <View style={{ height: 140, borderRadius: 16, backgroundColor: theme.card, marginBottom: 16 }} />
              </View>
            ) : (
              <>
                {activeTab === "projects" && renderProjects()}
                {activeTab === "quotes" && renderQuotes()}
                {activeTab === "invoices" && renderInvoices()}
                {activeTab === "users" && renderUsers()}
                {activeTab === "analytics" && renderAnalytics()}
                {activeTab === "support" && renderChats()}
              </>
            )}
          </KeyboardAwareScrollView>

        </View>
      </View>

      {/* Manual Invoice Creation Modal */}
      <Modal visible={showNewInvoiceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border, maxHeight: '90%', maxWidth: 540 }]}>
            
            {/* Modal Header */}
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 12 }}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${theme.primary}20`, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="receipt" size={18} color={theme.primary} />
                </View>
                <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>
                    {isRTL ? 'إصدار فاتورة جديدة للعميل' : 'Issue New Invoice'}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                    {isRTL ? 'حدد المبلغ وأرقام الحسابات المعتمدة للسداد' : 'Specify amount and payment accounts'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowNewInvoiceModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
              
              {/* 1. Client Selector */}
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold', marginBottom: 6, textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL ? '1. العميل المستهدف:' : '1. Select Client:'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8 }}>
                  {users.filter(u => u.role !== 'admin').map(u => {
                    const isSelected = selectedUserForInvoice?.id === u.id;
                    return (
                      <TouchableOpacity
                        key={u.id}
                        onPress={() => {
                          setSelectedUserForInvoice(u);
                          if (u.projectName) {
                            setNewInvTitle(isRTL ? `دفعة مشروع: ${u.projectName}` : `Invoice for: ${u.projectName}`);
                          }
                        }}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 10,
                          borderWidth: 1.5,
                          backgroundColor: isSelected ? `${theme.primary}20` : theme.bg,
                          borderColor: isSelected ? theme.primary : theme.border,
                          alignItems: isRTL ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? theme.primary : theme.text }}>
                          {u.fullName || u.email}
                        </Text>
                        {u.projectName ? (
                          <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>
                            {u.projectName.substring(0, 25)}...
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* 2. Amount and Currency */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold', marginBottom: 6, textAlign: isRTL ? 'right' : 'left' }}>
                  {isRTL ? '2. المبلغ المطلوب سداده:' : '2. Amount to Pay:'}
                </Text>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput
                    style={[styles.input, { flex: 1, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, fontSize: 16, fontWeight: 'bold' }]}
                    value={newInvAmount}
                    onChangeText={setNewInvAmount}
                    keyboardType="numeric"
                    placeholder={isRTL ? 'أدخل المبلغ (مثال: 5000)' : 'Amount (e.g. 5000)'}
                    placeholderTextColor={theme.textMuted}
                    textAlign={isRTL ? 'right' : 'left'}
                  />
                  {/* Currency Selector Chips */}
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {(['EGP', 'USD', 'SAR'] as const).map(curr => (
                      <TouchableOpacity
                        key={curr}
                        onPress={() => setNewInvCurrency(curr)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          borderRadius: 8,
                          borderWidth: 1,
                          backgroundColor: newInvCurrency === curr ? theme.primary : theme.bg,
                          borderColor: newInvCurrency === curr ? theme.primary : theme.border,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: newInvCurrency === curr ? '#FFF' : theme.text }}>
                          {curr}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                {/* Quick Amount Chips */}
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 6, marginTop: 6 }}>
                  {['1000', '2500', '5000', '10000', '20000'].map(amt => (
                    <TouchableOpacity
                      key={amt}
                      onPress={() => setNewInvAmount(amt)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: `${theme.primary}12`,
                        borderWidth: 1,
                        borderColor: `${theme.primary}25`
                      }}
                    >
                      <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '600' }}>
                        {amt} {newInvCurrency}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 3. Title / Purpose */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold', marginBottom: 6, textAlign: isRTL ? 'right' : 'left' }}>
                  {isRTL ? '3. مسمى الفاتورة وغرض الدفعة:' : '3. Invoice Title / Purpose:'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, fontSize: 13 }]}
                  value={newInvTitle}
                  onChangeText={setNewInvTitle}
                  placeholder={isRTL ? 'مثال: الدفعة الأولى - مقدم التعاقد' : 'e.g., Phase 1 Deposit'}
                  placeholderTextColor={theme.textMuted}
                  textAlign={isRTL ? 'right' : 'left'}
                />
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {[
                    isRTL ? 'دفعة أولى (50% مقدم)' : '50% Deposit',
                    isRTL ? 'دفعة ثانية (25% مرحلة الـ APIs)' : '25% Milestone 2',
                    isRTL ? 'دفعة ختامية عند التسليم (25%)' : 'Final Payment',
                    isRTL ? 'سداد كامل المبلغ (100%)' : 'Full Payment',
                    isRTL ? 'رسوم الاستضافة والدومين' : 'Hosting & Domain'
                  ].map(preset => (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => setNewInvTitle(preset)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: theme.bg,
                        borderWidth: 1,
                        borderColor: theme.border
                      }}
                    >
                      <Text style={{ fontSize: 11, color: theme.textMuted }}>{preset}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 4. Payment Accounts & Numbers Section (The User's specific request!) */}
              <View style={{
                backgroundColor: theme.bg,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: `${theme.primary}33`,
                marginBottom: 14
              }}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Ionicons name="card-outline" size={16} color={theme.primary} />
                  <Text style={{ color: theme.primary, fontSize: 13, fontWeight: 'bold' }}>
                    {isRTL ? '4. تحديد أرقام وحسابات الدفع (تظهر للعميل للسداد):' : '4. Payment Accounts (Shown to Client):'}
                  </Text>
                </View>

                {/* Vodafone Cash */}
                <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 3, textAlign: isRTL ? 'right' : 'left' }}>
                  {isRTL ? 'رقم فودافون كاش / المحفظة الذكية:' : 'Vodafone Cash / Wallet Number:'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, marginBottom: 8, fontSize: 13 }]}
                  value={invVodafoneCash}
                  onChangeText={setInvVodafoneCash}
                  placeholder="010xxxxxxxx"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad"
                  textAlign="left"
                />

                {/* InstaPay */}
                <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 3, textAlign: isRTL ? 'right' : 'left' }}>
                  {isRTL ? 'معرف إنستاباي (InstaPay Address):' : 'InstaPay Handle:'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, marginBottom: 8, fontSize: 13 }]}
                  value={invInstapay}
                  onChangeText={setInvInstapay}
                  placeholder="name@instapay"
                  placeholderTextColor={theme.textMuted}
                  textAlign="left"
                />

                {/* Bank Name & Account Number */}
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 3, textAlign: isRTL ? 'right' : 'left' }}>
                      {isRTL ? 'اسم البنك:' : 'Bank Name:'}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, fontSize: 13 }]}
                      value={invBankName}
                      onChangeText={setInvBankName}
                      placeholder="CIB / NBE"
                      placeholderTextColor={theme.textMuted}
                      textAlign={isRTL ? 'right' : 'left'}
                    />
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 3, textAlign: isRTL ? 'right' : 'left' }}>
                      {isRTL ? 'رقم الحساب البنكي:' : 'Account Number:'}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, fontSize: 13 }]}
                      value={invBankAccount}
                      onChangeText={setInvBankAccount}
                      placeholder="1000xxxxxxxx"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      textAlign="left"
                    />
                  </View>
                </View>

                {/* IBAN */}
                <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 3, textAlign: isRTL ? 'right' : 'left' }}>
                  {isRTL ? 'الآيبان الدولي (IBAN):' : 'IBAN:'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, fontSize: 12 }]}
                  value={invBankIban}
                  onChangeText={setInvBankIban}
                  placeholder="EG1200000000xxxxxxxxxxxx"
                  placeholderTextColor={theme.textMuted}
                  textAlign="left"
                />

                {/* Checkbox Save As Default */}
                <TouchableOpacity
                  onPress={() => setSaveAccountsAsDefault(!saveAccountsAsDefault)}
                  style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginTop: 8 }}
                >
                  <Ionicons name={saveAccountsAsDefault ? 'checkbox' : 'square-outline'} size={18} color={theme.primary} />
                  <Text style={{ color: theme.text, fontSize: 12 }}>
                    {isRTL ? 'حفظ هذه الأرقام كأرقام استلام افتراضية للشركة' : 'Save as default agency payment accounts'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 5. Notes */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                  {isRTL ? 'ملاحظات إضافية للعميل (اختياري):' : 'Additional Notes (Optional):'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, height: 60, fontSize: 12 }]}
                  value={newInvNotes}
                  onChangeText={setNewInvNotes}
                  multiline
                  numberOfLines={2}
                  placeholder={isRTL ? 'مثال: يرجى إرسال صورة إيصال التحويل عبر التطبيق...' : 'e.g., Please upload receipt after transfer...'}
                  placeholderTextColor={theme.textMuted}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>

            </ScrollView>

            {/* Action Buttons */}
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 10, marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border }}>
              <TouchableOpacity
                style={[styles.confirmModalBtn, { flex: 1, backgroundColor: theme.primary }]}
                onPress={handleCreateManualInvoice}
                disabled={creatingInv}
              >
                {creatingInv ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "bold" }}>
                    {isRTL ? 'إصدار الفاتورة وإرسالها للعميل' : 'Issue Invoice'}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: theme.border }}
                onPress={() => setShowNewInvoiceModal(false)}
              >
                <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* Receipt Preview Modal */}
      <Modal visible={!!viewingReceipt} transparent animationType="fade" onRequestClose={() => setViewingReceipt(null)}>
        <View style={[styles.modalOverlay, { alignItems: 'center' }]}>
          <View style={[styles.modalContent, { 
            backgroundColor: theme.card, 
            borderColor: theme.border, 
            maxHeight: '92%', 
            width: '100%', 
            maxWidth: 620,
            padding: 18,
            borderRadius: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.35,
            shadowRadius: 20,
            elevation: 10,
          }]}>
            {/* Modal Header */}
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 10 }}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#3B82F620', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="receipt-outline" size={20} color="#3B82F6" />
                </View>
                <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>
                    {isRTL ? 'معاينة إيصال سداد الفاتورة' : 'Invoice Payment Receipt'}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                    {viewingReceipt?.invoiceNumber ? `#${viewingReceipt.invoiceNumber}` : ''} 
                    {(viewingReceipt?.clientName || viewingReceipt?.clientname || users.find(u => u.id === (viewingReceipt?.userId || viewingReceipt?.userid))?.fullName) ? ` • ${viewingReceipt?.clientName || viewingReceipt?.clientname || users.find(u => u.id === (viewingReceipt?.userId || viewingReceipt?.userid))?.fullName}` : ''}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setViewingReceipt(null)} style={{ padding: 6, borderRadius: 8, backgroundColor: `${theme.textMuted}15` }}>
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Receipt Details Card (Notes, Sender info) */}
            {viewingReceipt?.notes ? (
              <View style={{ 
                backgroundColor: theme.bg, 
                borderRadius: 10, 
                padding: 10, 
                marginBottom: 12, 
                borderWidth: 1, 
                borderColor: theme.border,
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 8
              }}>
                <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
                <Text style={{ color: theme.text, fontSize: 12, flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                  {viewingReceipt.notes}
                </Text>
              </View>
            ) : null}

            {/* Receipt Image Container */}
            <ScrollView 
              contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
              style={{ maxHeight: 460, backgroundColor: '#00000030', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}
              showsVerticalScrollIndicator={true}
            >
              {(() => {
                const cleanUrl = getCleanReceiptUrl(viewingReceipt);
                if (!cleanUrl) {
                  return (
                    <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="image-outline" size={48} color={theme.textMuted} />
                      <Text style={{ color: theme.textMuted, marginTop: 10, fontSize: 13 }}>
                        {isRTL ? 'تعذر تحميل صورة الإيصال أو الرابط غير صالح' : 'Unable to load receipt image'}
                      </Text>
                    </View>
                  );
                }
                return (
                  <Image 
                    source={{ uri: cleanUrl }} 
                    style={{ 
                      width: '100%', 
                      height: 440,
                      minWidth: 320,
                    }} 
                    resizeMode="contain" 
                  />
                );
              })()}
            </ScrollView>

            {/* Footer Action Buttons */}
            <View style={{ 
              flexDirection: isRTL ? 'row-reverse' : 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              gap: 8, 
              marginTop: 14, 
              paddingTop: 12, 
              borderTopWidth: 1, 
              borderTopColor: theme.border 
            }}>
              {/* External open / Download button */}
              <TouchableOpacity
                onPress={() => {
                  const cleanUrl = getCleanReceiptUrl(viewingReceipt);
                  if (!cleanUrl) return;
                  if (Platform.OS === 'web' && typeof window !== 'undefined') {
                    const win = window.open();
                    if (win) {
                      win.document.write(`<img src="${cleanUrl}" style="max-width:100%; height:auto;" />`);
                    }
                  } else {
                    Linking.openURL(cleanUrl).catch(() => {});
                  }
                }}
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 9,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.bg
                }}
              >
                <Ionicons name="open-outline" size={15} color={theme.text} />
                <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }}>
                  {isRTL ? 'فتح بالحجم الكامل' : 'Open Full'}
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, flex: 1, justifyContent: isRTL ? 'flex-start' : 'flex-end' }}>
                {/* Direct "Mark Paid" button if not already paid */}
                {viewingReceipt?.status !== 'PAID' && viewingReceipt?.id ? (
                  <TouchableOpacity
                    style={{
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: '#10B981',
                      paddingVertical: 9,
                      paddingHorizontal: 16,
                      borderRadius: 10,
                    }}
                    onPress={async () => {
                      const invId = viewingReceipt.id;
                      setViewingReceipt(null);
                      await handleUpdateInvoiceStatus(invId, 'PAID');
                    }}
                  >
                    <Ionicons name="checkmark-done-circle" size={16} color="#FFF" />
                    <Text style={{ color: '#FFF', fontSize: 13, fontWeight: 'bold' }}>
                      {isRTL ? 'اعتماد كمدفوعة الآن' : 'Approve Payment'}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {/* Close Button */}
                <TouchableOpacity
                  style={{
                    paddingVertical: 9,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                  onPress={() => setViewingReceipt(null)}
                >
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                    {isRTL ? 'إغلاق' : 'Close'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
}

const PHASE_PRESETS = [
  'التخطيط وإعداد المتطلبات',
  'التصميم UI/UX واجهات المستخدم',
  'قيد البرمجة والتطوير',
  'فحص الجودة والاختبارات',
  'إطلاق المشروع والتسليم النهائي',
];

const PROGRESS_PRESETS = [0, 20, 25, 50, 75, 100];

interface UserProjectCardProps {
  u: any;
  theme: any;
  isRTL: boolean;
  onSaveProject: (userId: number, projectName: string, projectPhase: string, projectProgress: number) => Promise<boolean>;
  onSendEmail: (userId: number) => Promise<any>;
  onOpenInvoiceModal: (clientUser: any) => void;
  onDeleteUser?: (userId: number, name: string) => Promise<void>;
  onUpdateTasks?: (userId: number, tasks: any[]) => Promise<boolean>;
  onUpdateDeliverables?: (userId: number, deliverables: any[]) => Promise<boolean>;
  router: any;
}

function UserProjectCard({
  u,
  theme,
  isRTL,
  onSaveProject,
  onSendEmail,
  onOpenInvoiceModal,
  onDeleteUser,
  onUpdateTasks,
  onUpdateDeliverables,
  router,
}: UserProjectCardProps) {
  const [projectName, setProjectName] = useState(u.projectName || '');
  const [projectPhase, setProjectPhase] = useState(u.projectPhase || 'التخطيط');
  const [projectProgress, setProjectProgress] = useState(String(u.projectProgress ?? 0));
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const parseTasks = (raw: any): { id: string; title: string; completed: boolean }[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const parseDeliverables = (raw: any): { id: string; title: string; url: string; type: string }[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const [tasks, setTasks] = useState<{ id: string; title: string; completed: boolean }[]>(parseTasks(u.projectTasks));
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const [deliverables, setDeliverables] = useState<{ id: string; title: string; url: string; type: string }[]>(parseDeliverables(u.projectDeliverables));
  const [newDeliverableTitle, setNewDeliverableTitle] = useState('');
  const [newDeliverableUrl, setNewDeliverableUrl] = useState('');
  const [newDeliverableType, setNewDeliverableType] = useState('staging');

  useEffect(() => {
    setProjectName(u.projectName || '');
    setProjectPhase(u.projectPhase || 'التخطيط');
    setProjectProgress(String(u.projectProgress ?? 0));
    setTasks(parseTasks(u.projectTasks));
    setDeliverables(parseDeliverables(u.projectDeliverables));
  }, [u.projectName, u.projectPhase, u.projectProgress, u.projectTasks, u.projectDeliverables]);

  const currentProgressNum = Math.min(100, Math.max(0, parseInt(projectProgress) || 0));

  const handleToggleTask = async (taskId: string) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setTasks(updated);

    // Smart Dynamic Progress Calculation based on completed milestones
    if (updated.length > 0) {
      const completedCount = updated.filter(t => t.completed).length;
      const smartPct = Math.round((completedCount / updated.length) * 100);
      setProjectProgress(String(smartPct));

      // Auto-suggest realistic phase based on milestones
      let suggestedPhase = projectPhase;
      if (smartPct === 0) {
        suggestedPhase = isRTL ? 'المرحلة 1: التخطيط الفني وتحليل متطلبات النظام (ERD)' : 'Phase 1: Planning & Specs';
      } else if (smartPct <= 25) {
        suggestedPhase = isRTL ? 'المرحلة 1: إنجاز المتطلبات والـ ERD - جاري تطوير الـ APIs' : 'Phase 1: Requirements Done';
      } else if (smartPct <= 50) {
        suggestedPhase = isRTL ? 'المرحلة 2: إنجاز خوادم الباك إند - جاري تطوير التطبيقات' : 'Phase 2: Backend & Database Done';
      } else if (smartPct <= 75) {
        suggestedPhase = isRTL ? 'المرحلة 3: إنجاز التطبيقات ولوحة التحكم - جاري فحص الـ QA' : 'Phase 3: Apps & Dashboard Done';
      } else if (smartPct < 100) {
        suggestedPhase = isRTL ? 'المرحلة 4: اختبارات الاستقرار والأمان (QA) والتجهيز للإطلاق' : 'Phase 4: QA & Security Polish';
      } else {
        suggestedPhase = isRTL ? 'اكتمل المشروع بنجاح 100% وتم التسليم النهائي والاعتماد' : 'Project 100% Completed & Delivered';
      }
      setProjectPhase(suggestedPhase);

      // Auto-save live to backend so client sees real changes immediately
      if (onUpdateTasks) await onUpdateTasks(u.id, updated);
      if (onSaveProject) await onSaveProject(u.id, projectName, suggestedPhase, smartPct);
      return;
    }

    if (onUpdateTasks) {
      await onUpdateTasks(u.id, updated);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    setNewTaskTitle('');
    if (onUpdateTasks) {
      await onUpdateTasks(u.id, updated);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    if (onUpdateTasks) {
      await onUpdateTasks(u.id, updated);
    }
  };

  const handleSyncProgressFromTasks = () => {
    if (tasks.length === 0) return;
    const completedCount = tasks.filter(t => t.completed).length;
    const pct = Math.round((completedCount / tasks.length) * 100);
    setProjectProgress(String(pct));
  };

  const handleAddDeliverable = async () => {
    if (!newDeliverableTitle.trim() || !newDeliverableUrl.trim()) {
      const msg = isRTL ? 'يرجى إدخال عنوان ورابط التسليم' : 'Please provide title and URL';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Error', msg);
      return;
    }
    const cleanUrl = newDeliverableUrl.trim().startsWith('http') 
      ? newDeliverableUrl.trim() 
      : `https://${newDeliverableUrl.trim()}`;
    const item = {
      id: Date.now().toString(),
      title: newDeliverableTitle.trim(),
      url: cleanUrl,
      type: newDeliverableType,
    };
    const updated = [...deliverables, item];
    setDeliverables(updated);
    setNewDeliverableTitle('');
    setNewDeliverableUrl('');
    if (onUpdateDeliverables) {
      await onUpdateDeliverables(u.id, updated);
    }
  };

  const handleDeleteDeliverable = async (id: string) => {
    const updated = deliverables.filter(d => d.id !== id);
    setDeliverables(updated);
    if (onUpdateDeliverables) {
      await onUpdateDeliverables(u.id, updated);
    }
  };

  const handleSave = async (showNotification = true) => {
    setSaving(true);
    const success = await onSaveProject(u.id, projectName, projectPhase, currentProgressNum);
    setSaving(false);
    if (showNotification) {
      const msg = isRTL 
        ? `تم حفظ وتحديث بيانات مشروع (${projectName || u.fullName}) بنجاح!` 
        : `Project updated successfully!`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert(isRTL ? 'تم التحديث بنجاح' : 'Success', msg);
      }
    }
    return success;
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    await handleSave(false);
    const res = await onSendEmail(u.id);
    setSendingEmail(false);
    if (res && res.success) {
      const isDelivered = res.result?.delivered;
      const msg = isDelivered
        ? (isRTL
            ? `تم إرسال تقرير المشروع بنجاح إلى صندوق البريد الحقيقي:\n${u.email}\nالمرحلة: ${projectPhase} (${currentProgressNum}%)`
            : `Email delivered to inbox: ${u.email}`)
        : (isRTL
            ? `وضع المحاكاة التجريبي \u2066(Simulation)\u2069:\nتم تجهيز البريد بنجاح لـ ${u.email} ولكن لم يُرسل لصندوق Gmail لعدم تفعيل App Password.\n\n(يمكنك تفعيل Gmail الآن من زر "إعدادات Gmail" في الشريط العلوي لإرساله لصندوق الوارد فوراً)`
            : `Simulated: Email generated for ${u.email}. Configure Gmail App Password in Admin bar for real inbox delivery.`);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert(isDelivered ? (isRTL ? 'تم الإرسال للبريد' : 'Delivered') : (isRTL ? 'وضع المحاكاة \u2066(Simulation)\u2069' : 'Simulated'), msg);
      }
    } else {
      const err = (res && res.error) || (isRTL ? 'تعذر إرسال البريد الإلكتروني، يرجى المحاولة لاحقاً' : 'Failed to send email');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(err);
      } else {
        Alert.alert(isRTL ? 'خطأ' : 'Error', err);
      }
    }
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 80) return '#10B981';
    if (pct >= 40) return '#3B82F6';
    return '#F59E0B';
  };

  return (
    <View style={[styles.dataCard, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 16 }]}>
      {/* Header Info */}
      <View style={{ marginBottom: 12 }}>
        {/* Top bar: Name + Badge and Action Buttons */}
        <View style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 8
        }}>
          {/* User Name & Role Badge */}
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={[styles.dataTitle, { color: theme.text, fontSize: 17, marginBottom: 0 }]}>
              {u.fullName || 'User #' + u.id}
            </Text>
            <View style={[styles.badge, { backgroundColor: u.role === 'admin' ? '#8B5CF622' : '#3B82F622' }]}>
              <Text style={{ color: u.role === 'admin' ? '#8B5CF6' : '#3B82F6', fontSize: 11, fontWeight: 'bold' }}>
                {u.role === 'admin' ? 'مدير \u2066(Admin)\u2069' : 'عميل \u2066(Client)\u2069'}
              </Text>
            </View>
          </View>

          {/* Action buttons: Chat, Invoice, Delete */}
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/chat', params: { targetUserId: u.id } })}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                backgroundColor: '#3B82F618',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#3B82F644',
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Ionicons name="chatbubble-outline" size={13} color="#3B82F6" />
              <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: 'bold' }}>
                {isRTL ? 'محادثة' : 'Chat'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onOpenInvoiceModal(u)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                backgroundColor: `${theme.primary}18`,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: `${theme.primary}44`,
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Ionicons name="document-text-outline" size={13} color={theme.primary} />
              <Text style={{ color: theme.primary, fontSize: 12, fontWeight: 'bold' }}>
                {isRTL ? 'إصدار فاتورة' : 'Invoice'}
              </Text>
            </TouchableOpacity>

            {u.role !== 'admin' && onDeleteUser && (
              <TouchableOpacity
                onPress={() => onDeleteUser(u.id, u.fullName || u.email)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  backgroundColor: '#EF444415',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#EF444444',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Ionicons name="trash-outline" size={13} color="#EF4444" />
                <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: 'bold' }}>
                  {isRTL ? 'حذف العميل' : 'Delete'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* User Contact Details */}
        <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start', gap: 3 }}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="mail-outline" size={13} color={theme.textMuted} />
            <Text style={[styles.dataSubtitle, { color: theme.textMuted }]}>
              {u.email}
            </Text>
          </View>
          {u.phone ? (
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="call-outline" size={13} color={theme.textMuted} />
              <Text style={[styles.dataSubtitle, { color: theme.textMuted }]}>
                {u.phone}
              </Text>
            </View>
          ) : null}
          {u.createdAt ? (
            <Text style={{ color: theme.textMuted, fontSize: 11 }}>
              {isRTL ? 'تاريخ التسجيل:' : 'Joined:'} {new Date(u.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Project Tracking Editor Container */}
      <View style={{
        backgroundColor: theme.bg,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        marginTop: 4,
      }}>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="bar-chart-outline" size={16} color={theme.text} />
            <Text style={{ color: theme.text, fontSize: 14, fontWeight: 'bold' }}>
              {isRTL ? 'إدارة ومتابعة مشروع العميل' : 'Client Project Tracking'}
            </Text>
          </View>
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 12,
            backgroundColor: `${getProgressColor(currentProgressNum)}20`,
          }}>
            <Text style={{ color: getProgressColor(currentProgressNum), fontSize: 12, fontWeight: 'bold' }}>
              {currentProgressNum}%
            </Text>
          </View>
        </View>

        {/* Project Name */}
        <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
          {isRTL ? 'اسم المشروع:' : 'Project Name:'}
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, marginBottom: 10 }]}
          value={projectName}
          onChangeText={setProjectName}
          placeholder={isRTL ? 'مثال: تطبيق متجر إلكتروني' : 'e.g., E-commerce App'}
          placeholderTextColor={theme.textMuted}
          textAlign={isRTL ? 'right' : 'left'}
        />

        {/* Current Phase with Quick Chips */}
        <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
          {isRTL ? 'المرحلة الحالية:' : 'Current Phase:'}
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, marginBottom: 8 }]}
          value={projectPhase}
          onChangeText={setProjectPhase}
          placeholder={isRTL ? 'مثال: قيد البرمجة' : 'Phase name'}
          placeholderTextColor={theme.textMuted}
          textAlign={isRTL ? 'right' : 'left'}
        />
        
        {/* Quick Phase Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 6, paddingVertical: 2 }}>
            {PHASE_PRESETS.map((phase) => {
              const isSelected = projectPhase === phase;
              return (
                <TouchableOpacity
                  key={phase}
                  onPress={() => setProjectPhase(phase)}
                  style={{
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                    borderRadius: 16,
                    borderWidth: 1,
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderColor: isSelected ? theme.primary : theme.border,
                  }}
                >
                  <Text style={{
                    fontSize: 11,
                    fontWeight: isSelected ? 'bold' : 'normal',
                    color: isSelected ? '#FFF' : theme.text,
                  }}>
                    {phase}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Progress % Input & Quick Chips */}
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>
            {isRTL ? 'نسبة الإنجاز (%):' : 'Progress (%):'}
          </Text>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 6 }}>
            {PROGRESS_PRESETS.map((p) => {
              const isSelected = currentProgressNum === p;
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setProjectProgress(String(p))}
                  style={{
                    paddingVertical: 3,
                    paddingHorizontal: 8,
                    borderRadius: 12,
                    borderWidth: 1,
                    backgroundColor: isSelected ? getProgressColor(p) : theme.card,
                    borderColor: isSelected ? getProgressColor(p) : theme.border,
                  }}
                >
                  <Text style={{
                    fontSize: 11,
                    fontWeight: 'bold',
                    color: isSelected ? '#FFF' : theme.text,
                  }}>
                    {p}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, marginBottom: 8 }]}
          value={projectProgress}
          onChangeText={setProjectProgress}
          keyboardType="numeric"
          placeholder="0-100"
          placeholderTextColor={theme.textMuted}
          textAlign={isRTL ? 'right' : 'left'}
        />

        {/* Live Visual Progress Bar */}
        <View style={{
          height: 8,
          backgroundColor: theme.card,
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 14,
          borderWidth: 1,
          borderColor: theme.border,
        }}>
          <View style={{
            width: `${currentProgressNum}%`,
            height: '100%',
            backgroundColor: getProgressColor(currentProgressNum),
            borderRadius: 4,
          }} />
        </View>

        {/* Project Milestones Checklist */}
        <View style={{
          marginBottom: 14,
          padding: 12,
          borderRadius: 10,
          backgroundColor: theme.card,
          borderWidth: 1,
          borderColor: theme.border,
        }}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="list-outline" size={16} color={theme.text} />
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold' }}>
                {isRTL ? 'مراحل ومهام المشروع (Milestones)' : 'Project Milestones'}
              </Text>
            </View>
            {tasks.length > 0 && (
              <TouchableOpacity
                onPress={handleSyncProgressFromTasks}
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  backgroundColor: `${theme.primary}20`,
                  borderRadius: 6,
                }}
              >
                <Ionicons name="sync-outline" size={13} color={theme.primary} />
                <Text style={{ color: theme.primary, fontSize: 11, fontWeight: 'bold' }}>
                  {isRTL ? 'حساب النسبة تلقائياً' : 'Sync %'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Task List */}
          {tasks.map((task) => (
            <View
              key={task.id}
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 6,
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
              }}
            >
              <TouchableOpacity
                onPress={() => handleToggleTask(task.id)}
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 8,
                  flex: 1,
                }}
              >
                <Ionicons
                  name={task.completed ? "checkbox" : "square-outline"}
                  size={20}
                  color={task.completed ? "#10B981" : theme.textMuted}
                />
                <Text
                  style={{
                    color: task.completed ? theme.textMuted : theme.text,
                    fontSize: 13,
                    textDecorationLine: task.completed ? 'line-through' : 'none',
                    flex: 1,
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                >
                  {task.title}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDeleteTask(task.id)}
                style={{ padding: 4 }}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add New Task Input */}
          <View style={{
            flexDirection: isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 10,
          }}>
            <TextInput
              style={[
                styles.input,
                {
                  flex: 1,
                  backgroundColor: theme.bg,
                  color: theme.text,
                  borderColor: theme.border,
                  fontSize: 12,
                  paddingVertical: 6,
                  marginBottom: 0,
                },
              ]}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              placeholder={isRTL ? 'إضافة مرحلة/مهمة جديدة...' : 'Add milestone/task...'}
              placeholderTextColor={theme.textMuted}
              textAlign={isRTL ? 'right' : 'left'}
            />
            <TouchableOpacity
              onPress={handleAddTask}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: theme.primary,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>
                {isRTL ? 'إضافة +' : '+ Add'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Project Deliverables & Deliveries Section */}
        <View style={{
          marginBottom: 14,
          padding: 12,
          borderRadius: 10,
          backgroundColor: theme.card,
          borderWidth: 1,
          borderColor: theme.border,
        }}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="cube-outline" size={16} color={theme.text} />
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold' }}>
                {isRTL ? 'مخرجات وتسليمات المشروع (Deliverables)' : 'Project Deliverables'}
              </Text>
            </View>
            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 10,
              backgroundColor: `${theme.primary}20`,
            }}>
              <Text style={{ color: theme.primary, fontSize: 11, fontWeight: 'bold' }}>
                {deliverables.length} {isRTL ? 'روابط وملفات' : 'files'}
              </Text>
            </View>
          </View>

          <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 10, textAlign: isRTL ? 'right' : 'left' }}>
            {isRTL ? 'روابط المعاينة المباشرة (Staging) وتطبيقات APK وتصاميم Figma التي تظهر للعميل في لوحته' : 'Live staging links, APK downloads, Figma designs, and docs visible to client'}
          </Text>

          {/* Deliverables List */}
          {deliverables.map((item) => {
            const getIconAndColor = (type: string) => {
              switch (type) {
                case 'staging': return { icon: 'globe-outline', color: '#3B82F6', label: 'Staging' };
                case 'apk': return { icon: 'logo-android', color: '#10B981', label: 'APK' };
                case 'figma': return { icon: 'color-palette-outline', color: '#F43F5E', label: 'Figma' };
                case 'github': return { icon: 'logo-github', color: '#8B5CF6', label: 'GitHub' };
                case 'docs': return { icon: 'document-text-outline', color: '#F59E0B', label: 'Docs' };
                default: return { icon: 'link-outline', color: '#06B6D4', label: 'Link' };
              }
            };
            const meta = getIconAndColor(item.type);

            return (
              <View
                key={item.id}
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  backgroundColor: theme.bg,
                  marginBottom: 6,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: `${meta.color}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Ionicons name={meta.icon as any} size={16} color={meta.color} />
                  </View>
                  <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold' }}>
                      {item.title}
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 11 }} numberOfLines={1}>
                      {item.url}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(item.url, '_blank');
                      else Linking.openURL(item.url);
                    }}
                    style={{
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 6,
                      backgroundColor: `${meta.color}20`,
                    }}
                  >
                    <Ionicons name="open-outline" size={13} color={meta.color} />
                    <Text style={{ color: meta.color, fontSize: 11, fontWeight: 'bold' }}>
                      {isRTL ? 'فتح' : 'Open'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteDeliverable(item.id)}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* Add New Deliverable Inputs */}
          <View style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 8,
            backgroundColor: theme.bg,
            borderWidth: 1,
            borderColor: theme.border,
          }}>
            <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 6, textAlign: isRTL ? 'right' : 'left' }}>
              {isRTL ? 'إضافة رابط مخرج أو تسليم جديد:' : 'Add Deliverable or Live Link:'}
            </Text>

            {/* Type Selector Chips */}
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'staging', label: 'Staging', icon: 'globe-outline' },
                { id: 'apk', label: 'APK', icon: 'logo-android' },
                { id: 'figma', label: 'Figma', icon: 'color-palette-outline' },
                { id: 'github', label: 'GitHub', icon: 'logo-github' },
                { id: 'docs', label: 'Docs', icon: 'document-text-outline' },
                { id: 'link', label: 'Link', icon: 'link-outline' },
              ].map(t => {
                const isSelected = newDeliverableType === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setNewDeliverableType(t.id as any)}
                    style={{
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 12,
                      backgroundColor: isSelected ? theme.primary : theme.card,
                      borderWidth: 1,
                      borderColor: isSelected ? theme.primary : theme.border,
                    }}
                  >
                    <Ionicons name={t.icon as any} size={13} color={isSelected ? '#FFF' : theme.textMuted} />
                    <Text style={{ fontSize: 11, fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? '#FFF' : theme.text }}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, fontSize: 12, paddingVertical: 6, marginBottom: 6 }]}
              value={newDeliverableTitle}
              onChangeText={setNewDeliverableTitle}
              placeholder={isRTL ? 'عنوان الرابط (مثال: النسخة التجريبية الحية أو تطبيق APK)' : 'Deliverable title (e.g. Live Staging Preview)'}
              placeholderTextColor={theme.textMuted}
              textAlign={isRTL ? 'right' : 'left'}
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, fontSize: 12, paddingVertical: 6, marginBottom: 8 }]}
              value={newDeliverableUrl}
              onChangeText={setNewDeliverableUrl}
              placeholder="https://preview.apex.com"
              placeholderTextColor={theme.textMuted}
              textAlign="left"
            />

            <TouchableOpacity
              onPress={handleAddDeliverable}
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                backgroundColor: theme.primary,
                paddingVertical: 7,
                paddingHorizontal: 12,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Ionicons name="add-circle-outline" size={16} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>
                {isRTL ? 'إضافة رابط التسليم' : 'Add Deliverable'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons: Save & Send Email */}
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginTop: 4 }}>
          {/* Save Button */}
          <TouchableOpacity
            onPress={() => handleSave(true)}
            disabled={saving}
            style={{
              flex: 1,
              backgroundColor: '#10B981',
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: isRTL ? 'row-reverse' : 'row',
              gap: 6,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={16} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>
                  {isRTL ? 'حفظ وتحديث' : 'Save Update'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Send Email Button */}
          <TouchableOpacity
            onPress={handleSendEmail}
            disabled={sendingEmail}
            style={{
              flex: 1.2,
              backgroundColor: theme.primary,
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: isRTL ? 'row-reverse' : 'row',
              gap: 6,
            }}
          >
            {sendingEmail ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="mail-outline" size={16} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>
                  {isRTL ? 'إرسال تقرير بريدي' : 'Send Email Report'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  backBtnText: { fontSize: 14, fontWeight: 'bold' },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    borderBottomWidth: 1,
  },
  tabBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  dataCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dataSubtitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  dataAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  actionsRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.15)',
    gap: 8,
  },
  smallActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  smallActionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  newInvBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  newInvBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  confirmModalBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
});
