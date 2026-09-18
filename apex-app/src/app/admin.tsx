import React, { useEffect, useState } from 'react';
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
  
  // 🛡️ Bank-Grade Strict Admin Route Guard:
  // 1. Wait for auth & settings to finish initializing
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

  // 2. Strict Role Check: Instant redirect if not admin
  if (!currentUser || currentUser.role !== 'admin') {
    return <Redirect href="/" />;
  }
  
  const [activeTab, setActiveTab] = useState<'quotes' | 'invoices' | 'users' | 'analytics' | 'support'>('quotes');
  const [quotes, setQuotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [newInvAmount, setNewInvAmount] = useState('500');
  const [newInvNotes, setNewInvNotes] = useState('');
  const [creatingInv, setCreatingInv] = useState(false);

  // Receipt Preview Modal
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  const loadData = async () => {
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
    if (agencyRes?.success && agencyRes.settings) setAgencySettings(agencyRes.settings);
    if (analyticsRes?.success && analyticsRes.analytics) setAnalytics(analyticsRes.analytics);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

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
      Alert.alert('Error', isRTL ? 'يرجى اختيار العميل وتحديد المبلغ' : 'Please select client and amount');
      return;
    }

    setCreatingInv(true);
    const res = await api.createInvoice({
      userId: selectedUserForInvoice.id,
      title: newInvTitle,
      amount: parseInt(newInvAmount) || 100,
      notes: newInvNotes
    });
    setCreatingInv(false);

    if (res.success) {
      setShowNewInvoiceModal(false);
      setSelectedUserForInvoice(null);
      setNewInvAmount('');
      setNewInvNotes('');
      loadData();
      Alert.alert(isRTL ? 'تم بنجاح' : 'Success', isRTL ? 'تم إصدار الفاتورة وإشعار العميل.' : 'Invoice issued successfully.');
    }
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
                      {isRTL ? 'العميل:' : 'Client:'} {inv.clientName || inv.clientEmail || `User #${inv.userId}`}
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
                      onPress={() => setViewingReceipt(inv.receiptUrl)}
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.headerLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.push('/dashboard');
            }} 
            style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={20} color={theme.text} />
          </TouchableOpacity>
          
          <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                {t('adminDashboard')}
              </Text>
              <View style={{ backgroundColor: `${theme.primary}20`, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                <Text style={{ color: theme.primary, fontSize: 10, fontWeight: '900' }}>Admin</Text>
              </View>
            </View>
            {currentUser && (
              <Text style={{ color: theme.textMuted, fontSize: 11 }} numberOfLines={1}>
                {currentUser.fullName}
              </Text>
            )}
          </View>
        </View>

        {/* Header Action Buttons */}
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity 
            onPress={() => router.push('/dashboard')} 
            style={[styles.refreshBtn, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }]}
          >
            <Ionicons name="person-outline" size={14} color={theme.text} />
            {!responsive.isMobile && (
              <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold' }}>
                {isRTL ? 'بوابة العميل' : 'Client View'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={async () => {
              await loadData();
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.alert(isRTL ? 'تم تحديث كافة البيانات بنجاح' : 'Data refreshed');
              } else {
                Alert.alert(isRTL ? 'تم التحديث' : 'Refreshed', isRTL ? 'تم تحديث كافة البيانات بنجاح' : 'Data refreshed');
              }
            }} 
            style={[styles.refreshBtn, { backgroundColor: theme.primary, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }]}
          >
            <Ionicons name="refresh" size={14} color={activeTheme === 'light' ? '#FFF' : '#000'} />
            {!responsive.isMobile && (
              <Text style={{ color: activeTheme === 'light' ? '#FFF' : '#000', fontWeight: 'bold', fontSize: 12 }}>
                {t('refresh')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={async () => { 
              await removeSecureToken(); 
              await AsyncStorage.removeItem('userData'); 
              setCurrentUser(null); 
              router.replace('/login'); 
            }} 
            style={[styles.refreshBtn, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' }]}
          >
            <Ionicons name="log-out-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Email SMTP Status & Toolbar Banner */}
      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: emailConfig?.configured ? '#10B98110' : '#F59E0B10',
        borderBottomWidth: 1,
        borderBottomColor: emailConfig?.configured ? '#10B98125' : '#F59E0B25',
        gap: 8,
      }}>
        {/* Status Line */}
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons 
            name={emailConfig?.configured ? 'checkmark-circle' : 'alert-circle'} 
            size={16} 
            color={emailConfig?.configured ? '#10B981' : '#D97706'} 
          />
          <Text 
            numberOfLines={1}
            style={{ fontSize: 12, fontWeight: 'bold', color: emailConfig?.configured ? '#10B981' : '#D97706', flex: 1, textAlign: isRTL ? 'right' : 'left' }}
          >
            {emailConfig?.configured 
              ? `${isRTL ? 'إرسال Gmail الحقيقي مفعّل:' : 'Gmail Active:'} ${emailConfig.user}`
              : (isRTL ? 'إرسال البريد في وضع المحاكاة \u2066(Simulation)\u2069' : 'Emails in Simulation Mode')}
          </Text>
        </View>

        {/* Action Buttons Horizontal Scroll Strip */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, alignItems: 'center' }}
        >
          <TouchableOpacity
            onPress={() => setShowAgencySettingsModal(true)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 11,
              borderRadius: 8,
              backgroundColor: '#8B5CF618',
              borderWidth: 1,
              borderColor: '#8B5CF644',
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 5
            }}
          >
            <Ionicons name="business-outline" size={14} color="#8B5CF6" />
            <Text style={{ color: '#8B5CF6', fontSize: 11, fontWeight: 'bold' }}>
              {isRTL ? 'إعدادات الوكالة والبنك' : 'Agency & Bank'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowEmailConfigModal(true)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 11,
              borderRadius: 8,
              backgroundColor: emailConfig?.configured ? '#10B98120' : '#D9770620',
              borderWidth: 1,
              borderColor: emailConfig?.configured ? '#10B98155' : '#D9770655',
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 5
            }}
          >
            <Ionicons name="settings-outline" size={14} color={emailConfig?.configured ? '#10B981' : '#D97706'} />
            <Text style={{ color: emailConfig?.configured ? '#10B981' : '#D97706', fontSize: 11, fontWeight: 'bold' }}>
              {isRTL ? 'إعدادات Gmail' : 'Gmail Setup'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowSentEmailsModal(true)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 11,
              borderRadius: 8,
              backgroundColor: theme.card,
              borderWidth: 1,
              borderColor: theme.border,
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 5
            }}
          >
            <Ionicons name="mail-unread-outline" size={14} color={theme.text} />
            <Text style={{ color: theme.text, fontSize: 11, fontWeight: 'bold' }}>
              {isRTL ? `سجل الرسائل (${sentEmails.length})` : `History (${sentEmails.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              const url = `${BASE_URL}/email-preview`;
              if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(url, '_blank');
              else Linking.openURL(url);
            }}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 11,
              borderRadius: 8,
              backgroundColor: '#0284c718',
              borderWidth: 1,
              borderColor: '#0284c744',
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 5
            }}
          >
            <Ionicons name="sparkles-outline" size={14} color="#0284c7" />
            <Text style={{ color: '#0284c7', fontSize: 11, fontWeight: 'bold' }}>
              {isRTL ? 'معاينة شكل الإيميل' : 'Showcase'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Tabs */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.card }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexDirection: isRTL ? 'row-reverse' : 'row', paddingHorizontal: 6 }}
        >
          {[
            { id: 'quotes', label: isRTL ? 'طلبات التسعير' : 'Quotes', icon: 'document-text-outline', count: quotes.length },
            { id: 'invoices', label: isRTL ? 'الفواتير' : 'Invoices', icon: 'receipt-outline', count: invoices.length },
            { id: 'analytics', label: isRTL ? 'التحليلات' : 'Analytics', icon: 'pie-chart-outline' },
            { id: 'users', label: isRTL ? 'العملاء المسجلين' : 'Clients', icon: 'people-outline', count: users.length },
            { id: 'support', label: isRTL ? 'الدعم الفني' : 'Support', icon: 'chatbubbles-outline', count: chats.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity 
                key={tab.id}
                style={[
                  styles.tabBtn,
                  { flexDirection: isRTL ? 'row-reverse' : 'row', gap: 6 },
                  isActive && { borderBottomColor: theme.primary, borderBottomWidth: 3 }
                ]}
                onPress={() => setActiveTab(tab.id as any)}
              >
                <Ionicons 
                  name={tab.icon as any} 
                  size={15} 
                  color={isActive ? theme.primary : theme.textMuted} 
                />
                <Text style={[styles.tabText, { color: isActive ? theme.primary : theme.textMuted }]}>
                  {tab.label}
                </Text>
                {tab.count !== undefined && tab.count > 0 && (
                  <View style={{
                    backgroundColor: isActive ? `${theme.primary}25` : `${theme.textMuted}20`,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 10,
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: isActive ? theme.primary : theme.textMuted }}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Universal Search Bar */}
      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: theme.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}>
        <View style={{
          backgroundColor: theme.bg,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.border,
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: Platform.OS === 'ios' ? 8 : 4,
          gap: 8,
        }}>
          <Ionicons name="search" size={18} color={theme.textMuted} />
          <TextInput
            style={{
              flex: 1,
              color: theme.text,
              fontSize: 13,
              paddingVertical: 4,
              textAlign: isRTL ? 'right' : 'left',
            }}
            placeholder={isRTL ? 'بحث بالاسم، الإيميل، رقم الفاتورة، أو المشروع...' : 'Search by name, email, invoice #, or project...'}
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Content */}
      {/* Content */}
      <KeyboardAwareScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          {
            maxWidth: responsive.containerWidth as any,
            paddingHorizontal: responsive.paddingHorizontal
          }
        ]} 
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
      >
        {loading ? (
          <View style={{ marginTop: 20 }}>
            <Skeleton height={200} borderRadius={16} theme={theme} style={{ marginBottom: 16 }} />
            <Skeleton height={140} borderRadius={16} theme={theme} style={{ marginBottom: 16 }} />
            <Skeleton height={140} borderRadius={16} theme={theme} style={{ marginBottom: 16 }} />
          </View>
        ) : (
          <>
            {activeTab === 'quotes' && renderQuotes()}
            {activeTab === 'invoices' && renderInvoices()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'analytics' && renderAnalytics()}
            {activeTab === 'support' && renderChats()}
          </>
        )}
      </KeyboardAwareScrollView>

      {/* Manual Invoice Creation Modal */}
      <Modal visible={showNewInvoiceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>
                {isRTL ? 'إصدار فاتورة جديدة' : 'Create New Invoice'}
              </Text>
              <TouchableOpacity onPress={() => setShowNewInvoiceModal(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: theme.textMuted, fontSize: 13, marginBottom: 6, textAlign: isRTL ? 'right' : 'left' }}>
              {isRTL ? 'اختر العميل:' : 'Select Client:'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {users.filter(u => u.role !== 'admin').map(u => (
                  <TouchableOpacity
                    key={u.id}
                    onPress={() => setSelectedUserForInvoice(u)}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 20,
                      borderWidth: 1,
                      backgroundColor: selectedUserForInvoice?.id === u.id ? theme.primary : theme.btnBg,
                      borderColor: selectedUserForInvoice?.id === u.id ? theme.primary : theme.border
                    }}
                  >
                    <Text style={{ color: selectedUserForInvoice?.id === u.id ? '#FFF' : theme.text, fontSize: 12, fontWeight: 'bold' }}>
                      {u.fullName || u.email}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TextInput 
              style={[styles.input, { borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'عنوان الفاتورة (مثال: دفعة ثانية 30%)' : 'Invoice Title'}
              placeholderTextColor={theme.textMuted}
              value={newInvTitle}
              onChangeText={setNewInvTitle}
            />

            <TextInput 
              style={[styles.input, { borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'المبلغ ($)' : 'Amount ($)'}
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={newInvAmount}
              onChangeText={setNewInvAmount}
            />

            <TextInput 
              style={[styles.input, { borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'ملاحظات إضافية' : 'Notes'}
              placeholderTextColor={theme.textMuted}
              value={newInvNotes}
              onChangeText={setNewInvNotes}
            />

            <TouchableOpacity 
              style={[styles.confirmModalBtn, { backgroundColor: theme.primary }]}
              onPress={handleCreateManualInvoice}
              disabled={creatingInv}
            >
              {creatingInv ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Ionicons name="paper-plane" size={16} color="#FFF" />
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>
                    {isRTL ? 'إصدار الفاتورة وإرسالها للعميل' : 'Issue Invoice'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Receipt Image Viewer Modal */}
      <Modal visible={!!viewingReceipt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border, alignItems: 'center' }]}>
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: theme.text, fontWeight: 'bold' }}>{isRTL ? 'إيصال الدفع المرفوع' : 'Payment Receipt'}</Text>
              <TouchableOpacity onPress={() => setViewingReceipt(null)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            {viewingReceipt ? (
              <Image source={{ uri: viewingReceipt }} style={{ width: '100%', height: 350, borderRadius: 12 }} resizeMode="contain" />
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Email Configuration Modal */}
      <Modal visible={showEmailConfigModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border, maxWidth: 540 }]}>
              {/* Header */}
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="settings-outline" size={18} color={theme.text} />
                  <Text style={{ color: theme.text, fontSize: 17, fontWeight: 'bold' }}>
                    {isRTL ? 'إعداد خادم البريد (Gmail SMTP)' : 'Gmail SMTP Setup'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowEmailConfigModal(false)}>
                  <Ionicons name="close" size={24} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Explanatory Guide Box */}
              <View style={{
                backgroundColor: activeTheme === 'light' ? '#F0FDF4' : '#064E3B25',
                borderColor: '#10B98144',
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                marginBottom: 14
              }}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <Ionicons name="bulb-outline" size={15} color="#10B981" />
                  <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 13 }}>
                    {isRTL ? 'كيفية تفعيل إرسال Gmail الحقيقي:' : 'How to enable real Gmail delivery:'}
                  </Text>
                </View>
                <Text style={{ color: theme.text, fontSize: 12, lineHeight: 18, textAlign: isRTL ? 'right' : 'left' }}>
                  {isRTL 
                    ? '1. فعّل "التحقق بخطوتين" في حساب Google الخاص بك.\n2. افتح الرابط: myaccount.google.com/apppasswords\n3. اختر إنشاء كلمة مرور باسم Apex ثم انسخ الـ 16 حرفاً وضعها هنا في خانة App Password.'
                    : '1. Enable 2-Step Verification on your Google account.\n2. Visit myaccount.google.com/apppasswords\n3. Create an App Password and paste the 16 characters below.'}
                </Text>
              </View>

              {/* Status indicator */}
              <View style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 6,
                marginBottom: 14,
                padding: 8,
                borderRadius: 8,
                backgroundColor: emailConfig?.configured ? '#10B98115' : '#F59E0B15'
              }}>
                <Ionicons 
                  name={emailConfig?.configured ? "checkmark-circle" : "alert-circle"} 
                  size={18} 
                  color={emailConfig?.configured ? "#10B981" : "#F59E0B"} 
                />
                <Text style={{ color: emailConfig?.configured ? '#10B981' : '#D97706', fontSize: 12, fontWeight: 'bold' }}>
                  {emailConfig?.configured 
                    ? (isRTL ? `مربوط حالياً بـ: ${emailConfig.user}` : `Connected to: ${emailConfig.user}`)
                    : (isRTL ? 'الحالة: وضع المحاكاة (لم يتم ربط Gmail بعد)' : 'Status: Simulation mode (Not connected)')}
                </Text>
              </View>

              {/* Input: Gmail User */}
              <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL ? 'بريد المرسل (Gmail):' : 'Sender Gmail Address:'}
              </Text>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left', marginBottom: 12 }]}
                placeholder="yourname@gmail.com"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={gmailUser}
                onChangeText={setGmailUser}
              />

              {/* Input: Gmail App Password */}
              <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL ? 'كلمة مرور التطبيقات (Google App Password - 16 حرف):' : 'Google App Password (16 characters):'}
              </Text>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left', marginBottom: 14 }]}
                placeholder="abcd efgh ijkl mnop"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
                secureTextEntry
                value={gmailPass}
                onChangeText={setGmailPass}
              />

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.confirmModalBtn, { backgroundColor: '#10B981', marginBottom: 16 }]}
                onPress={handleSaveEmailConfig}
                disabled={savingEmailConfig}
              >
                {savingEmailConfig ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
                      {isRTL ? 'حفظ وتفعيل الإرسال الحقيقي' : 'Save & Activate Gmail'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: theme.border, marginBottom: 14 }} />

              {/* Test Email Section */}
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <Ionicons name="flask-outline" size={15} color={theme.text} />
                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13 }}>
                  {isRTL ? 'إرسال بريد تجريبي فوراً للتأكد:' : 'Send Immediate Test Email:'}
                </Text>
              </View>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left', marginBottom: 10 }]}
                placeholder="target@gmail.com"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={testEmailTarget}
                onChangeText={setTestEmailTarget}
              />
              <TouchableOpacity
                style={[styles.confirmModalBtn, { backgroundColor: theme.primary }]}
                onPress={handleSendTestEmail}
                disabled={testingEmail}
              >
                {testingEmail ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Ionicons name="paper-plane-outline" size={16} color="#FFF" />
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
                      {isRTL ? 'إرسال بريد اختبار الآن' : 'Send Test Email Now'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Sent Emails History Modal */}
      <Modal visible={showSentEmailsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border, maxHeight: '85%', width: '95%', maxWidth: 650 }]}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="mail-outline" size={18} color={theme.text} />
                  <Text style={{ color: theme.text, fontSize: 17, fontWeight: 'bold' }}>
                    {isRTL ? `سجل الرسائل الصادرة (${sentEmails.length})` : `Sent Emails History (${sentEmails.length})`}
                  </Text>
                </View>
                <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                  {isRTL ? 'جميع الرسائل المنشأة من النظام مع حالتها' : 'All emails generated with delivery status'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSentEmailsModal(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ marginTop: 8 }} showsVerticalScrollIndicator={false}>
              {sentEmails.length === 0 ? (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                    {isRTL ? 'لا توجد رسائل مسجلة بعد' : 'No emails sent yet'}
                  </Text>
                </View>
              ) : (
                sentEmails.map((item, idx) => (
                  <View 
                    key={idx}
                    style={{
                      backgroundColor: theme.bg,
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14, textAlign: isRTL ? 'right' : 'left' }}>
                          {item.subject}
                        </Text>
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Ionicons name="mail-outline" size={12} color={theme.textMuted} />
                          <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                            {item.to}
                          </Text>
                        </View>
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Ionicons name="time-outline" size={12} color={theme.textMuted} />
                          <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                            {new Date(item.timestamp).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                      <View style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: item.status === 'delivered' ? '#10B98120' : '#F59E0B20',
                      }}>
                        <Text style={{
                          color: item.status === 'delivered' ? '#10B981' : '#D97706',
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}>
                          {item.status === 'delivered'
                            ? (isRTL ? 'تم التسليم' : 'Delivered')
                            : (isRTL ? 'محاكاة' : 'Simulated')}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => setViewingHtmlEmail(item)}
                      style={{
                        marginTop: 6,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        backgroundColor: theme.card,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 8,
                        alignSelf: isRTL ? 'flex-start' : 'flex-end',
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Ionicons name="eye-outline" size={14} color={theme.primary} />
                      <Text style={{ color: theme.primary, fontSize: 12, fontWeight: 'bold' }}>
                        {isRTL ? 'معاينة محتوى البريد (HTML)' : 'Preview Email (HTML)'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* HTML Email Preview Modal */}
      <Modal visible={!!viewingHtmlEmail} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border, maxHeight: '90%', width: '95%', maxWidth: 700 }]}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 15 }} numberOfLines={1}>
                  {viewingHtmlEmail?.subject}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                  {isRTL ? 'إلى:' : 'To:'} {viewingHtmlEmail?.to} | {viewingHtmlEmail?.status === 'delivered' ? 'Delivered' : 'Simulated'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setViewingHtmlEmail(null)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
              padding: 12,
              maxHeight: 450,
            }}>
              {Platform.OS === 'web' && typeof window !== 'undefined' ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: viewingHtmlEmail?.html || '<p>No content</p>' }} 
                  style={{ color: '#111', fontFamily: 'sans-serif' }}
                />
              ) : (
                <Text style={{ color: '#111', fontSize: 13, lineHeight: 20 }}>
                  {viewingHtmlEmail?.html?.replace(/<[^>]+>/g, ' ') || 'No content'}
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Agency & Bank Settings Modal */}
      <Modal visible={showAgencySettingsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border, maxWidth: 580 }]}>
              {/* Header */}
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="business-outline" size={18} color={theme.text} />
                  <Text style={{ color: theme.text, fontSize: 17, fontWeight: 'bold' }}>
                    {isRTL ? 'إعدادات الوكالة والحسابات البنكية' : 'Agency & Bank Accounts'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowAgencySettingsModal(false)}>
                  <Ionicons name="close" size={24} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Informative Note */}
              <View style={{
                backgroundColor: `${theme.primary}12`,
                borderColor: `${theme.primary}33`,
                borderWidth: 1,
                borderRadius: 10,
                padding: 10,
                marginBottom: 16
              }}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="information-circle-outline" size={15} color={theme.primary} />
                  <Text style={{ color: theme.primary, fontSize: 12, lineHeight: 18, textAlign: isRTL ? 'right' : 'left', flex: 1 }}>
                    {isRTL 
                      ? 'هذه البيانات تنعكس تلقائياً في فواتير العملاء المطبوعة (PDF) ونافذة تحويلات الفواتير المباشرة في بوابة العميل.' 
                      : 'These details are automatically reflected on printable PDF invoices and client transfer modals.'}
                  </Text>
                </View>
              </View>

              {/* Company Name */}
              <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL ? 'اسم الوكالة / الشركة:' : 'Company / Agency Name:'}
              </Text>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left', marginBottom: 10 }]}
                value={agencySettings.companyName || ''}
                onChangeText={(val) => setAgencySettings({ ...agencySettings, companyName: val })}
                placeholder="Apex Software Agency"
                placeholderTextColor={theme.textMuted}
              />

              {/* Phone & Email Row */}
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 10, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? 'رقم الهاتف الرسمي:' : 'Official Phone:'}
                  </Text>
                  <TextInput
                    style={[styles.input, { borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left', marginBottom: 0 }]}
                    value={agencySettings.companyPhone || ''}
                    onChangeText={(val) => setAgencySettings({ ...agencySettings, companyPhone: val })}
                    placeholder="+20 100 000 0000"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? 'البريد الرسمي:' : 'Official Email:'}
                  </Text>
                  <TextInput
                    style={[styles.input, { borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left', marginBottom: 0 }]}
                    value={agencySettings.companyEmail || ''}
                    onChangeText={(val) => setAgencySettings({ ...agencySettings, companyEmail: val })}
                    placeholder="contact@apex.com"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </View>

              {/* Address & Tax ID Row */}
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 10, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? 'العنوان / المقر:' : 'Address / HQ:'}
                  </Text>
                  <TextInput
                    style={[styles.input, { borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left', marginBottom: 0 }]}
                    value={agencySettings.address || ''}
                    onChangeText={(val) => setAgencySettings({ ...agencySettings, address: val })}
                    placeholder="Cairo, Egypt"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? 'الرقم الضريبي (Tax ID):' : 'Tax ID:'}
                  </Text>
                  <TextInput
                    style={[styles.input, { borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left', marginBottom: 0 }]}
                    value={agencySettings.taxId || ''}
                    onChangeText={(val) => setAgencySettings({ ...agencySettings, taxId: val })}
                    placeholder="TX-948201-EG"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </View>

              {/* Section Header: Electronic & Bank Accounts */}
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 8 }}>
                <Ionicons name="card-outline" size={16} color={theme.primary} />
                <Text style={{ color: theme.primary, fontSize: 13, fontWeight: 'bold' }}>
                  {isRTL ? 'حسابات التحويل المالي (المحافظ والبنوك)' : 'Payment Transfer Accounts'}
                </Text>
              </View>

              {/* Vodafone Cash & InstaPay */}
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 10, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? 'فودافون كاش / المحافظ:' : 'Vodafone Cash / Wallets:'}
                  </Text>
                  <TextInput
                    style={[styles.input, { borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left', marginBottom: 0 }]}
                    value={agencySettings.vodafoneCash || ''}
                    onChangeText={(val) => setAgencySettings({ ...agencySettings, vodafoneCash: val })}
                    placeholder="01000000000"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? 'معرف انستاباي (InstaPay):' : 'InstaPay Handle:'}
                  </Text>
                  <TextInput
                    style={[styles.input, { borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left', marginBottom: 0 }]}
                    value={agencySettings.instapayHandle || ''}
                    onChangeText={(val) => setAgencySettings({ ...agencySettings, instapayHandle: val })}
                    placeholder="apex@instapay"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </View>

              {/* Bank Name */}
              <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL ? 'اسم البنك المعتمد:' : 'Bank Name:'}
              </Text>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left', marginBottom: 10 }]}
                value={agencySettings.bankName || ''}
                onChangeText={(val) => setAgencySettings({ ...agencySettings, bankName: val })}
                placeholder="CIB (Commercial International Bank)"
                placeholderTextColor={theme.textMuted}
              />

              {/* Bank Account & IBAN */}
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 10, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? 'رقم الحساب البنكي:' : 'Bank Account Number:'}
                  </Text>
                  <TextInput
                    style={[styles.input, { borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left', marginBottom: 0 }]}
                    value={agencySettings.bankAccount || ''}
                    onChangeText={(val) => setAgencySettings({ ...agencySettings, bankAccount: val })}
                    placeholder="100029384729"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? 'رقم الآيبان (IBAN):' : 'IBAN:'}
                  </Text>
                  <TextInput
                    style={[styles.input, { borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left', marginBottom: 0 }]}
                    value={agencySettings.bankIban || ''}
                    onChangeText={(val) => setAgencySettings({ ...agencySettings, bankIban: val })}
                    placeholder="EG1200000000100029384729"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSaveAgencySettings}
                disabled={savingAgencySettings}
                style={[styles.confirmModalBtn, { backgroundColor: theme.primary, marginTop: 4 }]}
              >
                {savingAgencySettings ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>
                      {isRTL ? 'حفظ إعدادات الوكالة والحسابات' : 'Save Agency & Bank Settings'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
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

const PROGRESS_PRESETS = [25, 50, 75, 100];

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
