import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator, Image, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api, BASE_URL } from '../services/api';
import WhatsAppFAB from '../components/WhatsAppFAB';
import { haptics } from '../utils/haptics';
import { notifications } from '../utils/notifications';
import { useResponsive } from '../hooks/useResponsive';
import { Skeleton } from '../components/Skeleton';
import { ReceiptDropzone } from '../components/ReceiptDropzone';
import { FloatingInput } from '../components/FloatingInput';

export default function InvoicesScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const { theme, t, isRTL, activeTheme, currentUser } = useSettings();
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  
  // Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [paymentTab, setPaymentTab] = useState<'transfer' | 'card'>('transfer');
  const [processing, setProcessing] = useState(false);
  
  // Transfer Form State
  const [senderDetails, setSenderDetails] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardHolder, setCardHolder] = useState(currentUser?.fullName || '');
  const [agencySettings, setAgencySettings] = useState<any>(null);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const [invRes, agencyRes] = await Promise.all([
        api.getInvoices(),
        api.getAgencySettings(),
      ]);
      if (invRes?.isOffline || agencyRes?.isOffline) {
        setIsOffline(true);
      } else {
        setIsOffline(false);
      }
      if (invRes.success && invRes.invoices) {
        setInvoices(invRes.invoices);
      }
      if (agencyRes?.success && agencyRes.settings) {
        setAgencySettings(agencyRes.settings);
      }
    } catch (e) {
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const totalOutstanding = invoices
    .filter(i => i.status === 'PENDING' || i.status === 'UNDER_REVIEW')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const pickReceipt = async () => {
    haptics.selection();
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const handleSubmitTransfer = async () => {
    if (!selectedInvoice) return;
    if (!senderDetails || !receiptImage) {
      haptics.error();
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى إدخال بيانات الحساب وإرفاق صورة إيصال التحويل.' : 'Please provide sender info and attach receipt image.');
      return;
    }
    
    setProcessing(true);
    try {
      let uploadedUrl = receiptImage;
      if (receiptImage.startsWith('file:') || receiptImage.startsWith('blob:')) {
        const upRes = await api.uploadFile(receiptImage, 'receipt.jpg', 'image/jpeg');
        if (upRes.success) {
          uploadedUrl = `${BASE_URL}${upRes.url}`;
        }
      }

      const notes = `المحول: ${senderDetails} | ملاحظات: ${transferNotes}`;
      const res = await api.submitInvoicePayment(selectedInvoice.id, uploadedUrl, notes);
      setProcessing(false);

      if (res.success) {
        haptics.success();
        notifications.sendLocalNotification(
          isRTL ? 'تم إرسال إيصال التحويل' : 'Transfer Receipt Submitted',
          isRTL 
            ? `تم استلام إيصال الفاتورة #${selectedInvoice.invoiceNumber} وجاري اعتماده فوراً.` 
            : `Receipt for invoice #${selectedInvoice.invoiceNumber} submitted for verification.`
        );
        setSelectedInvoice(null);
        setReceiptImage(null);
        setSenderDetails('');
        setTransferNotes('');
        loadInvoices();
        Alert.alert(
          isRTL ? 'تم الإرسال بنجاح' : 'Submitted Successfully', 
          isRTL ? 'تم استلام إيصال الدفع وجاري مراجعته من المحاسبة لاعتماده فوراً.' : 'Payment receipt received for verification.'
        );
      } else {
        haptics.error();
        Alert.alert('Error', res.message || 'Failed to submit payment.');
      }
    } catch (err: any) {
      setProcessing(false);
      haptics.error();
      Alert.alert('Error', err.message || 'Network error.');
    }
  };

  const handleCardPayment = async () => {
    if (!selectedInvoice) return;
    if (!cardNumber || !cardExpiry || !cardCvc) {
      haptics.error();
      Alert.alert(isRTL ? 'تنبيه' : 'Alert', isRTL ? 'يرجى ملء بيانات البطاقة البنكية كاملة' : 'Please fill card details');
      return;
    }

    setProcessing(true);
    // Simulate instant secure gateway transaction
    setTimeout(async () => {
      const res = await api.updateInvoiceStatus(selectedInvoice.id, 'PAID');
      setProcessing(false);
      if (res.success) {
        haptics.success();
        notifications.sendLocalNotification(
          isRTL ? 'تم الدفع بنجاح!' : 'Payment Received!',
          isRTL 
            ? `تم سداد الفاتورة #${selectedInvoice.invoiceNumber} بمبلغ $${selectedInvoice.amount} بنجاح.` 
            : `Invoice #${selectedInvoice.invoiceNumber} ($${selectedInvoice.amount}) paid successfully.`
        );
        setSelectedInvoice(null);
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
        loadInvoices();
        Alert.alert(
          isRTL ? 'تم الدفع بنجاح!' : 'Payment Successful!',
          isRTL ? `تم سداد الفاتورة #${selectedInvoice.invoiceNumber} بمبلغ $${selectedInvoice.amount} بنجاح وإرسال التأكيد لبريدك.` : `Invoice #${selectedInvoice.invoiceNumber} paid successfully.`
        );
      } else {
        haptics.error();
        Alert.alert('Error', 'Payment processing failed.');
      }
    }, 1500);
  };

  const handleOpenPrintInvoice = async (invoiceId: number) => {
    haptics.light();
    const token = await api.getToken();
    const url = `${BASE_URL}/invoice-print/${invoiceId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const handleGoBack = () => {
    haptics.light();
    if (router.canGoBack()) router.back();
    else router.push('/dashboard');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: theme.primary }]}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('viewInvoice')}</Text>
        <TouchableOpacity 
          onPress={() => {
            haptics.light();
            loadInvoices();
          }} 
          style={styles.refreshBtn}
        >
          <Ionicons name="refresh" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Offline Status Banner */}
      {isOffline && (
        <View style={[styles.offlineBanner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <Ionicons name="cloud-offline" size={18} color="#B45309" />
            <Text style={{ color: '#92400E', fontSize: 12, fontWeight: 'bold', flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
              {isRTL ? 'وضع عدم الاتصال: يتم عرض الفواتير المحفوظة محلياً' : 'Offline Mode: Showing cached invoices'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              haptics.medium();
              loadInvoices();
            }}
            style={styles.offlineRetryBtn}
          >
            <Text style={styles.offlineRetryText}>
              {isRTL ? 'إعادة المحاولة' : 'Retry'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
        
        {/* Financial Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text style={[styles.summaryTitle, { color: theme.textMuted }]}>
                {isRTL ? 'إجمالي المبالغ المستحقة' : 'Total Outstanding'}
              </Text>
              <Text style={[styles.summaryAmount, { color: theme.primary }]}>
                ${totalOutstanding.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}15` }]}>
              <Ionicons name="wallet-outline" size={32} color={theme.primary} />
            </View>
          </View>
          
          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 10, textAlign: isRTL ? 'right' : 'left' }}>
            {isRTL ? 'يتم إصدار الفواتير وفق مراحل العمل المتفق عليها في عقد المشروع.' : 'Invoices are issued based on agreed project milestone phases.'}
          </Text>
        </View>

        {/* Invoices List Header */}
        <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.listTitle, { color: theme.text }]}>
            {isRTL ? 'سجل الفواتير والدفعات' : 'Invoices & Payments Record'}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>
            {invoices.length} {isRTL ? 'فاتورة' : 'Invoices'}
          </Text>
        </View>

        {loading ? (
          <View style={{ marginTop: 10 }}>
            <Skeleton height={140} borderRadius={16} theme={theme} style={{ marginBottom: 12 }} />
            <Skeleton height={140} borderRadius={16} theme={theme} style={{ marginBottom: 12 }} />
            <Skeleton height={140} borderRadius={16} theme={theme} style={{ marginBottom: 12 }} />
          </View>
        ) : invoices.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="receipt-outline" size={48} color={theme.textMuted} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {isRTL ? 'لا توجد فواتير صادرة حالياً' : 'No Invoices Issued Yet'}
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>
              {isRTL 
                ? 'عند اعتماد طلبك من الإدارة وتحديد مراحل الدفع، ستظهر الفواتير هنا مع خيارات السداد الفوري.'
                : 'When your quote is approved and payments are scheduled, your invoices will appear here.'}
            </Text>
          </View>
        ) : (
          invoices.map((inv) => {
            const isPaid = inv.status === 'PAID';
            const isReview = inv.status === 'UNDER_REVIEW';

            let statusColor = '#EF4444';
            let statusText = isRTL ? 'مستحقة للدفع' : 'PENDING';
            if (isPaid) {
              statusColor = '#10B981';
              statusText = isRTL ? 'مدفوعة ومؤكدة' : 'PAID';
            } else if (isReview) {
              statusColor = '#F59E0B';
              statusText = isRTL ? 'قيد مراجعة السداد' : 'UNDER REVIEW';
            }

            return (
              <View key={inv.id || inv.invoiceNumber} style={[styles.invoiceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.invoiceHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                    <Text style={[styles.invoiceId, { color: theme.text }]}>#{inv.invoiceNumber}</Text>
                    <Text style={[styles.invoiceTitle, { color: theme.textMuted }]}>{inv.title || (isRTL ? 'دفعة مشروع برمجي' : 'Software Milestone')}</Text>
                    <Text style={[styles.invoiceDate, { color: theme.textMuted }]}>{inv.date}</Text>
                  </View>
                  <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
                    <Text style={[styles.invoiceAmount, { color: theme.primary }]}>${inv.amount}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                      <Text style={{ color: statusColor, fontWeight: 'bold', fontSize: 11 }}>{statusText}</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.invoiceActions, { flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, flexWrap: 'wrap' }]}>
                  {/* Print / Save as PDF Button */}
                  <TouchableOpacity 
                    style={[styles.actionPrintBtn, { borderColor: theme.primary, borderWidth: 1, backgroundColor: `${theme.primary}12` }]}
                    onPress={() => handleOpenPrintInvoice(inv.id)}
                  >
                    <Ionicons name="print-outline" size={16} color={theme.primary} />
                    <Text style={[styles.actionPrintBtnText, { color: theme.primary }]}>
                      {isRTL ? 'طباعة / حفظ كـ PDF' : 'Print / Save PDF'}
                    </Text>
                  </TouchableOpacity>

                  {/* Pay Button if not paid */}
                  {!isPaid && (
                    <TouchableOpacity 
                      style={[styles.actionPayBtn, { backgroundColor: isReview ? '#F59E0B' : theme.primary }]}
                      onPress={() => {
                        haptics.selection();
                        setSelectedInvoice(inv);
                      }}
                    >
                      <Ionicons name={isReview ? 'eye-outline' : 'card-outline'} size={16} color="#FFF" />
                      <Text style={styles.actionPayBtnText}>
                        {isReview ? (isRTL ? 'تعديل أو إعادة رفع الإيصال' : 'View / Re-upload Receipt') : (isRTL ? 'سداد الفاتورة الآن' : 'Pay Invoice Now')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Luxury Payment Modal */}
      <Modal visible={!!selectedInvoice} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            
            {/* Modal Header */}
            <View style={[styles.modalHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? 'سداد الفاتورة' : 'Invoice Payment'} #{selectedInvoice?.invoiceNumber}
                </Text>
                <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 18, textAlign: isRTL ? 'right' : 'left' }}>
                  ${selectedInvoice?.amount}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => {
                  haptics.light();
                  setSelectedInvoice(null);
                }} 
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Payment Method Switcher Tabs */}
            <View style={[styles.methodTabsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity 
                style={[styles.methodTab, paymentTab === 'transfer' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => {
                  haptics.selection();
                  setPaymentTab('transfer');
                }}
              >
                <Ionicons name="business" size={16} color={paymentTab === 'transfer' ? '#FFF' : theme.textMuted} />
                <Text style={[styles.methodTabText, { color: paymentTab === 'transfer' ? '#FFF' : theme.text }]}>
                  {isRTL ? 'تحويل بنكي / محافظ' : 'Bank / Wallets'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.methodTab, paymentTab === 'card' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => {
                  haptics.selection();
                  setPaymentTab('card');
                }}
              >
                <Ionicons name="card" size={16} color={paymentTab === 'card' ? '#FFF' : theme.textMuted} />
                <Text style={[styles.methodTabText, { color: paymentTab === 'card' ? '#FFF' : theme.text }]}>
                  {isRTL ? 'بطاقة بنكية (Card)' : 'Credit Card'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {paymentTab === 'transfer' ? (
                /* Bank / Wallet Transfer View */
                <View style={{ marginTop: 10 }}>
                  <View style={[styles.instructionsBox, { backgroundColor: theme.btnBg, borderColor: theme.border }]}>
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Ionicons name="business-outline" size={16} color={theme.primary} />
                      <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 13 }}>
                        {agencySettings?.companyName || 'Apex Software Agency'}
                      </Text>
                    </View>
                    <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 8, textAlign: isRTL ? 'right' : 'left' }}>
                      {isRTL ? 'يرجى تحويل المبلغ لحساب الوكالة التالي:' : 'Transfer the amount to the agency account:'}
                    </Text>

                    {/* Structured Info Rows */}
                    <View style={{ gap: 6, marginVertical: 4 }}>
                      {/* Bank Name */}
                      <View style={{
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 5,
                        borderBottomWidth: 1,
                        borderBottomColor: `${theme.border}44`
                      }}>
                        <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                          {isRTL ? 'حساب البنك:' : 'Bank:'}
                        </Text>
                        <Text style={{ color: theme.text, fontWeight: '600', fontSize: 12, writingDirection: 'ltr' }}>
                          {agencySettings?.bankName || 'CIB (Commercial International)'}
                        </Text>
                      </View>

                      {/* Account Number */}
                      <View style={{
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 5,
                        borderBottomWidth: 1,
                        borderBottomColor: `${theme.border}44`
                      }}>
                        <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                          {isRTL ? 'رقم الحساب:' : 'Account Number:'}
                        </Text>
                        <Text selectable style={{ color: theme.primary, fontWeight: 'bold', fontSize: 13, writingDirection: 'ltr' }}>
                          {agencySettings?.bankAccount || '100029384729'}
                        </Text>
                      </View>

                      {/* IBAN */}
                      <View style={{
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 5,
                        borderBottomWidth: 1,
                        borderBottomColor: `${theme.border}44`
                      }}>
                        <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                          {isRTL ? 'الآيبان \u2066(IBAN)\u2069:' : 'IBAN:'}
                        </Text>
                        <Text selectable style={{ color: theme.text, fontWeight: '600', fontSize: 12, writingDirection: 'ltr' }}>
                          {agencySettings?.bankIban || 'EG1200000000100029384729'}
                        </Text>
                      </View>

                      {/* InstaPay */}
                      <View style={{
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 5,
                        borderBottomWidth: 1,
                        borderBottomColor: `${theme.border}44`
                      }}>
                        <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                          {isRTL ? 'إنستاباي \u2066(InstaPay)\u2069:' : 'InstaPay:'}
                        </Text>
                        <Text selectable style={{ color: '#8B5CF6', fontWeight: 'bold', fontSize: 12, writingDirection: 'ltr' }}>
                          {agencySettings?.instapayHandle || 'apex@instapay'}
                        </Text>
                      </View>

                      {/* Vodafone Cash */}
                      <View style={{
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 5
                      }}>
                        <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                          {isRTL ? 'فودافون كاش:' : 'Vodafone Cash:'}
                        </Text>
                        <Text selectable style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 12, writingDirection: 'ltr' }}>
                          {agencySettings?.vodafoneCash || '01000000000'}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 4, textAlign: isRTL ? 'right' : 'left' }}>
                      {isRTL ? 'ثم ارفع صورة إيصال التحويل أدناه.' : 'Then upload your receipt below.'}
                    </Text>

                    {/* Quick Copy Chips */}
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      <TouchableOpacity
                        onPress={() => {
                          haptics.selection();
                          const val = agencySettings?.vodafoneCash || '01000000000';
                          if (Platform.OS === 'web' && typeof navigator !== 'undefined') navigator.clipboard.writeText(val);
                          Alert.alert(isRTL ? 'تم النسخ!' : 'Copied!', `${isRTL ? 'تم نسخ رقم فودافون كاش:' : 'Copied Vodafone Cash:'} ${val}`);
                        }}
                        style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: '#EF444420', borderWidth: 1, borderColor: '#EF444455' }}
                      >
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="phone-portrait-outline" size={12} color="#EF4444" />
                          <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: 'bold' }}>
                            {isRTL ? 'نسخ كاش' : 'Copy Cash'}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          haptics.selection();
                          const val = agencySettings?.instapayHandle || 'apex@instapay';
                          if (Platform.OS === 'web' && typeof navigator !== 'undefined') navigator.clipboard.writeText(val);
                          Alert.alert(isRTL ? 'تم النسخ!' : 'Copied!', `${isRTL ? 'تم نسخ عنوان InstaPay:' : 'Copied InstaPay:'} ${val}`);
                        }}
                        style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: '#8B5CF620', borderWidth: 1, borderColor: '#8B5CF655' }}
                      >
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="flash-outline" size={12} color="#8B5CF6" />
                          <Text style={{ color: '#8B5CF6', fontSize: 11, fontWeight: 'bold' }}>
                            {isRTL ? 'نسخ انستاباي' : 'Copy InstaPay'}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          haptics.selection();
                          const val = agencySettings?.bankAccount || '100029384729';
                          if (Platform.OS === 'web' && typeof navigator !== 'undefined') navigator.clipboard.writeText(val);
                          Alert.alert(isRTL ? 'تم النسخ!' : 'Copied!', `${isRTL ? 'تم نسخ رقم الحساب البنكي:' : 'Copied Bank Account:'} ${val}`);
                        }}
                        style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: '#3B82F620', borderWidth: 1, borderColor: '#3B82F655' }}
                      >
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="business-outline" size={12} color="#3B82F6" />
                          <Text style={{ color: '#3B82F6', fontSize: 11, fontWeight: 'bold' }}>
                            {isRTL ? 'نسخ الحساب' : 'Copy Bank'}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          haptics.selection();
                          const val = agencySettings?.bankIban || 'EG1200000000100029384729';
                          if (Platform.OS === 'web' && typeof navigator !== 'undefined') navigator.clipboard.writeText(val);
                          Alert.alert(isRTL ? 'تم النسخ!' : 'Copied!', `${isRTL ? 'تم نسخ رقم الآيبان:' : 'Copied IBAN:'} ${val}`);
                        }}
                        style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: '#10B98120', borderWidth: 1, borderColor: '#10B98155' }}
                      >
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="card-outline" size={12} color="#10B981" />
                          <Text style={{ color: '#10B981', fontSize: 11, fontWeight: 'bold' }}>
                            {isRTL ? 'نسخ الآيبان' : 'Copy IBAN'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <FloatingInput
                    label={isRTL ? 'رقم أو اسم الحساب المحول منه' : 'Sender Account / Phone Number'}
                    value={senderDetails}
                    onChangeText={setSenderDetails}
                    leftIcon="person-outline"
                    theme={theme}
                    isRTL={isRTL}
                  />

                  <FloatingInput
                    label={isRTL ? 'ملاحظات إضافية (اختياري)' : 'Additional Notes (Optional)'}
                    value={transferNotes}
                    onChangeText={setTransferNotes}
                    leftIcon="chatbox-ellipses-outline"
                    theme={theme}
                    isRTL={isRTL}
                  />

                  <ReceiptDropzone
                    receiptUri={receiptImage}
                    onPick={pickReceipt}
                    onRemove={() => setReceiptImage(null)}
                    theme={theme}
                    isRTL={isRTL}
                  />

                  <TouchableOpacity 
                    style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
                    onPress={handleSubmitTransfer}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Ionicons name="send" size={16} color={activeTheme === 'light' ? '#FFF' : '#000'} />
                        <Text style={[styles.confirmBtnText, { color: activeTheme === 'light' ? '#FFF' : '#000' }]}>
                          {isRTL ? 'إرسال الإيصال للاعتماد' : 'Submit for Verification'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* Card Checkout View */
                <View style={{ marginTop: 10 }}>
                  <View style={[styles.cardMock, { backgroundColor: '#1E293B' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <Ionicons name="hardware-chip" size={28} color="#F59E0B" />
                      <Ionicons name="card" size={30} color="#FFF" />
                    </View>
                    <Text style={{ color: '#FFF', fontSize: 18, letterSpacing: 3, fontWeight: 'bold', marginBottom: 16 }}>
                      {cardNumber || '•••• •••• •••• ••••'}
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#94A3B8', fontSize: 12 }}>{cardHolder || 'CARDHOLDER'}</Text>
                      <Text style={{ color: '#94A3B8', fontSize: 12 }}>{cardExpiry || 'MM/YY'}</Text>
                    </View>
                  </View>

                  <TextInput 
                    style={[styles.input, { borderColor: theme.border, color: theme.text, textAlign: 'left' }]}
                    placeholder="Card Number (e.g. 4242 4242 4242 4242)"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    value={cardNumber}
                    onChangeText={setCardNumber}
                  />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput 
                      style={[styles.input, { flex: 1, borderColor: theme.border, color: theme.text, textAlign: 'center' }]}
                      placeholder="MM/YY"
                      placeholderTextColor={theme.textMuted}
                      value={cardExpiry}
                      onChangeText={setCardExpiry}
                      maxLength={5}
                    />
                    <TextInput 
                      style={[styles.input, { flex: 1, borderColor: theme.border, color: theme.text, textAlign: 'center' }]}
                      placeholder="CVC / CVV"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      secureTextEntry
                      value={cardCvc}
                      onChangeText={setCardCvc}
                      maxLength={4}
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.confirmBtn, { backgroundColor: '#10B981' }]}
                    onPress={handleCardPayment}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Ionicons name="lock-closed" size={16} color="#FFF" />
                        <Text style={[styles.confirmBtnText, { color: '#FFF' }]}>
                          {isRTL ? `دفع $${selectedInvoice?.amount} فوراً` : `Pay $${selectedInvoice?.amount} Now`}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

          </View>
        </View>
      </Modal>

      {/* Floating WhatsApp FAB */}
      <WhatsAppFAB />
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
  refreshBtn: { padding: 8 },
  scrollContent: {
    padding: 20,
    maxWidth: 650,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 80,
  },
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '900',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyCard: {
    borderRadius: 16,
    padding: 30,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 360,
  },
  invoiceCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 12,
  },
  invoiceHeader: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceId: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  invoiceTitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 12,
  },
  invoiceAmount: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  invoiceActions: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.15)',
    justifyContent: 'flex-end',
  },
  actionPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  actionPayBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  actionPrintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  actionPrintBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  modalHeaderRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  methodTabsRow: {
    gap: 10,
    marginBottom: 14,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
  },
  methodTabText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  instructionsBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  uploadBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  cardMock: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
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
});
