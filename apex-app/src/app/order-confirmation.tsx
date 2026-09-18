import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, isRTL } = useSettings();

  const transactionId = (params.transactionId as string) || `txn_mock_${Date.now()}`;
  const orderId = (params.orderId as string) || `ORD-${Date.now().toString().slice(-6)}`;
  const amount = (params.amount as string) || '399.00';
  const currency = (params.currency as string) || 'USD';
  const cardBrand = (params.cardBrand as string) || 'visa';
  const cardLast4 = (params.cardLast4 as string) || '4242';
  const timestamp = (params.timestamp as string) || new Date().toLocaleString('ar-EG');
  const authCode = (params.authCode as string) || '849201';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Success Icon Badge */}
        <View style={styles.successIconWrapper}>
          <View style={styles.successIconOuter}>
            <View style={styles.successIconInner}>
              <Ionicons name="checkmark" size={48} color="#0B132B" />
            </View>
          </View>
        </View>

        {/* Header Titles */}
        <Text style={[styles.successTitle, { color: theme.text }]}>
          {isRTL ? 'تمت عملية الدفع بنجاح!' : 'Payment Successful!'}
        </Text>
        <Text style={[styles.successSubtitle, { color: theme.textMuted }]}>
          {isRTL 
            ? 'شكراً لك! تم استلام دفعتك وتأكيد طلبك بنجاح في بيئة التطوير التجريبية (Sandbox).' 
            : 'Thank you! Your payment has been received and verified in sandbox mode.'}
        </Text>

        {/* Amount Badge */}
        <View style={[styles.amountCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.amountLabel, { color: theme.textMuted }]}>
            {isRTL ? 'إجمالي المبلغ المدفوع' : 'Total Amount Paid'}
          </Text>
          <Text style={[styles.amountValue, { color: theme.primary }]}>
            ${amount} {currency}
          </Text>
        </View>

        {/* Receipt Details Table */}
        <View style={[styles.receiptCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.receiptSectionHeader, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'تفاصيل المعاملة المالية' : 'Transaction Details'}
          </Text>

          <View style={[styles.receiptRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.rowLabel, { color: theme.textMuted }]}>
              {isRTL ? 'رقم الطلب' : 'Order ID'}
            </Text>
            <Text style={[styles.rowValue, { color: theme.text }]}>
              {orderId}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={[styles.receiptRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.rowLabel, { color: theme.textMuted }]}>
              {isRTL ? 'معرّف المعاملة' : 'Transaction ID'}
            </Text>
            <Text style={[styles.rowValueCode, { color: theme.primary }]}>
              {transactionId}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={[styles.receiptRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.rowLabel, { color: theme.textMuted }]}>
              {isRTL ? 'رمز التفويض (Auth Code)' : 'Auth Code'}
            </Text>
            <Text style={[styles.rowValue, { color: theme.text }]}>
              {authCode}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={[styles.receiptRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.rowLabel, { color: theme.textMuted }]}>
              {isRTL ? 'طريقة الدفع' : 'Payment Method'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="card" size={16} color={theme.primary} />
              <Text style={[styles.rowValue, { color: theme.text }]}>
                {cardBrand.toUpperCase()} •••• {cardLast4}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={[styles.receiptRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.rowLabel, { color: theme.textMuted }]}>
              {isRTL ? 'حالة المعاملة' : 'Status'}
            </Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {isRTL ? 'مكتملة (مؤكدة)' : 'Settled & Verified'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={[styles.receiptRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.rowLabel, { color: theme.textMuted }]}>
              {isRTL ? 'التاريخ والوقت' : 'Date & Time'}
            </Text>
            <Text style={[styles.rowValue, { color: theme.textMuted, fontSize: 12 }]}>
              {timestamp}
            </Text>
          </View>
        </View>

        {/* Security & Sandbox Notice */}
        <View style={[styles.noticeCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Feather name="shield" size={20} color="#10B981" />
          <Text style={[styles.noticeText, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL 
              ? 'هذه المعاملة تم إجراؤها بنجاح في بيئة التطوير (Development Sandbox). لم يتم خصم أي مبالغ حقيقية من بطاقتك البنكية.' 
              : 'This transaction was executed in development sandbox. No real funds were deducted from your bank.'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsCol}>
          <TouchableOpacity
            onPress={() => router.push('/invoices')}
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          >
            <Feather name="file-text" size={18} color="#0B132B" />
            <Text style={styles.primaryBtnText}>
              {isRTL ? 'عرض الفواتير وسجل المعاملات' : 'View Invoices & Receipts'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/dashboard')}
            style={[styles.secondaryBtn, { borderColor: theme.border, backgroundColor: theme.btnBg }]}
          >
            <Ionicons name="home-outline" size={18} color={theme.text} />
            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
              {isRTL ? 'العودة للوحة التحكم الرئيسية' : 'Return to Dashboard'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  successIconWrapper: {
    marginTop: 20,
    marginBottom: 16,
  },
  successIconOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: 20,
  },
  amountCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '900',
  },
  receiptCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  receiptSectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  receiptRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  rowValueCode: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  noticeCard: {
    width: '100%',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  noticeText: {
    flex: 1,
    color: '#10B981',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  actionButtonsCol: {
    width: '100%',
    gap: 12,
    marginBottom: 30,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#0B132B',
    fontSize: 15,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
