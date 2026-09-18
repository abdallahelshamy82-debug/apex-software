import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import {
  paymentService,
  detectCardBrand,
  formatCardNumberInput,
  formatExpiryInput,
  validateCardDetails,
  TEST_CARDS,
  TestCardPreset,
  CardBrand,
} from '../services/paymentService';
import CreditCardVisual from '../components/CreditCardVisual';

export default function CheckoutScreen() {
  const router = useRouter();
  const { theme, isRTL, currentUser } = useSettings();

  // Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState(currentUser?.fullName || '');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [showCvv, setShowCvv] = useState(false);

  // Field Errors
  const [errors, setErrors] = useState<{
    cardNumber?: string;
    cardholderName?: string;
    expiry?: string;
    cvv?: string;
    general?: string;
  }>({});

  // Payment Lifecycle State: 'idle' | 'processing' | 'error' | 'success'
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Order Details
  const orderSummary = {
    orderId: `APX-${Math.floor(100000 + Math.random() * 900000)}`,
    serviceTitle: isRTL ? 'باقة تطوير برمجيات واستشارات AI' : 'Apex Software & AI Consultation',
    subtotal: 350.00,
    cloudSync: 49.00,
    tax: 0.00,
    total: 399.00,
    currency: 'USD',
  };

  const detectedBrand: CardBrand = detectCardBrand(cardNumber);

  // Quick fill preset card for fast developer / sandbox testing
  const handleSelectTestCard = (preset: TestCardPreset) => {
    setCardNumber(preset.cardNumber);
    setCardholderName(preset.cardholderName);
    setExpiry(preset.expiry);
    setCvv(preset.cvv);
    setErrors({});
    setErrorMessage(null);
    setPaymentStatus('idle');
  };

  // Handle Card Number Change with auto formatting
  const handleCardNumberChange = (val: string) => {
    const formatted = formatCardNumberInput(val);
    setCardNumber(formatted);
    if (errors.cardNumber) {
      setErrors((prev) => ({ ...prev, cardNumber: undefined }));
    }
  };

  // Handle Expiry Change with auto slash injection
  const handleExpiryChange = (val: string) => {
    const formatted = formatExpiryInput(val);
    setExpiry(formatted);
    if (errors.expiry) {
      setErrors((prev) => ({ ...prev, expiry: undefined }));
    }
  };

  // Process Checkout
  const handlePayNow = async () => {
    if (paymentStatus === 'processing') return;

    // 1. Client-Side Pre-validation
    const validation = validateCardDetails({
      cardNumber,
      cardholderName,
      expiry,
      cvv,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert(
        isRTL ? 'خطأ في البيانات' : 'Validation Error',
        isRTL 
          ? 'يرجى مراجعة وتصحيح الحقول المحددة باللون الأحمر أدناه.' 
          : 'Please review and correct the highlighted fields below.'
      );
      return;
    }

    setErrors({});
    setErrorMessage(null);
    setPaymentStatus('processing');

    try {
      // 2. Call Payment Service (Simulates Network Gateway Request)
      const result = await paymentService.processPayment({
        orderId: orderSummary.orderId,
        amount: orderSummary.total,
        currency: orderSummary.currency,
        card: {
          cardNumber,
          cardholderName,
          expiry,
          cvv,
        },
        customerName: cardholderName,
        customerEmail: currentUser?.email || 'client@apex-software.io',
        description: orderSummary.serviceTitle,
      });

      if (result.success) {
        setPaymentStatus('success');

        // Optional: clear user cart or reset form
        setCardNumber('');
        setExpiry('');
        setCvv('');

        // Route to Order Confirmation Screen
        router.push({
          pathname: '/order-confirmation',
          params: {
            transactionId: result.transactionId || `txn_mock_${Date.now()}`,
            orderId: result.orderId || orderSummary.orderId,
            amount: result.amount.toFixed(2),
            currency: result.currency,
            cardBrand: result.cardBrand || detectedBrand,
            cardLast4: result.cardLast4 || '4242',
            authCode: result.authorizationCode || '729104',
            timestamp: new Date().toLocaleString(isRTL ? 'ar-EG' : 'en-US'),
          },
        });
      } else {
        setPaymentStatus('error');
        Alert.alert(
          isRTL ? 'فشل الدفع' : 'Payment Declined',
          result.errorMessage || 
          (isRTL ? 'تعذر إتمام عملية الدفع. يرجى المحاولة مرة أخرى.' : 'Payment transaction declined.')
        );
      }
    } catch (err: any) {
      setPaymentStatus('error');
      Alert.alert(
        isRTL ? 'خطأ في الاتصال' : 'Connection Error',
        err.message || (isRTL ? 'حدث خطأ في الاتصال ببوابة الدفع.' : 'Payment gateway connection error.')
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.card,
              borderBottomColor: theme.border,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.btnBg }]}>
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={theme.text} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', flex: 1, marginRight: isRTL ? 0 : 36, marginLeft: isRTL ? 36 : 0 }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {isRTL ? 'إتمام الدفع الآمن' : 'Secure Checkout'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="lock-closed" size={11} color="#10B981" />
              <Text style={styles.headerSubtitle}>
                {isRTL ? 'بيئة تجريبية مشفرة (Sandbox)' : 'Encrypted Sandbox Mode'}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Order Summary Box */}
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.summaryHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                  {orderSummary.serviceTitle}
                </Text>
                <Text style={[styles.orderIdText, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? `رقم الفاتورة: ${orderSummary.orderId}` : `Ref: ${orderSummary.orderId}`}
                </Text>
              </View>
              <Text style={[styles.summaryTotalAmount, { color: theme.primary }]}>
                ${orderSummary.total.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.summaryRowLabel, { color: theme.textMuted }]}>
                {isRTL ? 'الخدمة البرمجية' : 'Development Service'}
              </Text>
              <Text style={[styles.summaryRowValue, { color: theme.text }]}>
                ${orderSummary.subtotal.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.summaryRowLabel, { color: theme.textMuted }]}>
                {isRTL ? 'خدمات السحابة والمزامنة' : 'Cloud & AI Setup'}
              </Text>
              <Text style={[styles.summaryRowValue, { color: theme.text }]}>
                ${orderSummary.cloudSync.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.summaryRowLabel, { color: theme.textMuted }]}>
                {isRTL ? 'الضريبة المضافة' : 'VAT / Sales Tax'}
              </Text>
              <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 13 }}>
                {isRTL ? '0.00$ (معفاة تجريبياً)' : '$0.00 (Waived)'}
              </Text>
            </View>
          </View>

          {/* Interactive Live Card Visual */}
          <CreditCardVisual
            cardNumber={cardNumber}
            cardholderName={cardholderName}
            expiry={expiry}
            brand={detectedBrand}
            isRTL={isRTL}
          />

          {/* Quick Test Cards Picker for Developers & Sandbox */}
          <View style={styles.testCardsContainer}>
            <Text style={[styles.testCardsHeader, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? '⚡ بطاقات اختبار تجريبية سريعة (Sandbox):' : '⚡ Quick Test Cards (Sandbox):'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.testCardsRow}>
              {TEST_CARDS.map((testCard, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSelectTestCard(testCard)}
                  style={[
                    styles.testCardChip,
                    {
                      backgroundColor: theme.card,
                      borderColor: testCard.behavior === 'declined' ? '#EF4444' : theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={testCard.behavior === 'declined' ? 'alert-circle' : 'card'}
                    size={14}
                    color={testCard.behavior === 'declined' ? '#EF4444' : theme.primary}
                  />
                  <Text style={[styles.testCardChipText, { color: theme.text }]}>
                    {testCard.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Payment Card Input Form */}
          <View style={[styles.formContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            
            {/* Cardholder Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'اسم حامل البطاقة (كما يظهر عليها)' : 'Cardholder Name'}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.btnBg,
                    borderColor: errors.cardholderName ? '#EF4444' : theme.border,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  },
                ]}
              >
                <Feather name="user" size={18} color={theme.textMuted} />
                <TextInput
                  value={cardholderName}
                  onChangeText={(val) => {
                    setCardholderName(val);
                    if (errors.cardholderName) setErrors((prev) => ({ ...prev, cardholderName: undefined }));
                  }}
                  placeholder={isRTL ? 'مثال: AHMED MOHAMED' : 'e.g. JOHN DOE'}
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="characters"
                  editable={paymentStatus !== 'processing'}
                  style={[styles.textInput, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
                />
              </View>
              {errors.cardholderName && (
                <Text style={[styles.errorFieldText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {errors.cardholderName}
                </Text>
              )}
            </View>

            {/* Card Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'رقم البطاقة الائتمانية' : 'Card Number'}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.btnBg,
                    borderColor: errors.cardNumber ? '#EF4444' : theme.border,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  },
                ]}
              >
                <Feather name="credit-card" size={18} color={theme.textMuted} />
                <TextInput
                  value={cardNumber}
                  onChangeText={handleCardNumberChange}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  maxLength={19}
                  editable={paymentStatus !== 'processing'}
                  style={[styles.textInput, { color: theme.text, textAlign: isRTL ? 'right' : 'left', letterSpacing: 1 }]}
                />
                {detectedBrand !== 'unknown' && (
                  <View style={styles.detectedBrandBadge}>
                    <Text style={styles.detectedBrandText}>
                      {detectedBrand.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              {errors.cardNumber && (
                <Text style={[styles.errorFieldText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {errors.cardNumber}
                </Text>
              )}
            </View>

            {/* Row: Expiry Date & CVV */}
            <View style={[styles.rowInputs, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              
              {/* Expiry Date */}
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? 'تاريخ الانتهاء' : 'Expiry (MM/YY)'}
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.btnBg,
                      borderColor: errors.expiry ? '#EF4444' : theme.border,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                    },
                  ]}
                >
                  <Feather name="calendar" size={18} color={theme.textMuted} />
                  <TextInput
                    value={expiry}
                    onChangeText={handleExpiryChange}
                    placeholder="MM/YY"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    maxLength={5}
                    editable={paymentStatus !== 'processing'}
                    style={[styles.textInput, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
                  />
                </View>
                {errors.expiry && (
                  <Text style={[styles.errorFieldText, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {errors.expiry}
                  </Text>
                )}
              </View>

              {/* CVV */}
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? 'رمز الأمان (CVV)' : 'CVV / CVC'}
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.btnBg,
                      borderColor: errors.cvv ? '#EF4444' : theme.border,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                    },
                  ]}
                >
                  <Feather name="shield" size={18} color={theme.textMuted} />
                  <TextInput
                    value={cvv}
                    onChangeText={(val) => {
                      const clean = val.replace(/\D/g, '').substring(0, 4);
                      setCvv(clean);
                      if (errors.cvv) setErrors((prev) => ({ ...prev, cvv: undefined }));
                    }}
                    placeholder="123"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    secureTextEntry={!showCvv}
                    maxLength={4}
                    editable={paymentStatus !== 'processing'}
                    style={[styles.textInput, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
                  />
                  <TouchableOpacity onPress={() => setShowCvv(!showCvv)}>
                    <Ionicons
                      name={showCvv ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={theme.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {errors.cvv && (
                  <Text style={[styles.errorFieldText, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {errors.cvv}
                  </Text>
                )}
              </View>
            </View>

          </View>

          {/* Secure Pay Now Button */}
          <TouchableOpacity
            onPress={handlePayNow}
            disabled={paymentStatus === 'processing'}
            activeOpacity={0.85}
            style={[
              styles.payButton,
              {
                backgroundColor: paymentStatus === 'processing' ? 'rgba(6, 182, 212, 0.7)' : theme.primary,
              },
            ]}
          >
            {paymentStatus === 'processing' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#0B132B" size="small" />
                <Text style={styles.payButtonText}>
                  {isRTL ? 'جاري التحقق والاتصال بالبوابة...' : 'Connecting to Gateway...'}
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="lock-closed" size={18} color="#0B132B" />
                <Text style={styles.payButtonText}>
                  {isRTL ? `دفع ${orderSummary.total.toFixed(2)}$ الآن` : `Pay $${orderSummary.total.toFixed(2)} Now`}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Security & Compliance Badges */}
          <View style={styles.securityTrustSection}>
            <View style={styles.trustBadgeItem}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.trustBadgeText}>PCI-DSS Level 1</Text>
            </View>
            <View style={styles.trustBadgeDivider} />
            <View style={styles.trustBadgeItem}>
              <MaterialCommunityIcons name="lock" size={16} color="#10B981" />
              <Text style={styles.trustBadgeText}>256-Bit SSL</Text>
            </View>
            <View style={styles.trustBadgeDivider} />
            <View style={styles.trustBadgeItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.trustBadgeText}>3D Secure 2.0</Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  summaryHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderIdText: {
    fontSize: 11,
    marginTop: 2,
  },
  summaryTotalAmount: {
    fontSize: 22,
    fontWeight: '900',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 10,
  },
  summaryRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  summaryRowLabel: {
    fontSize: 13,
  },
  summaryRowValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  testCardsContainer: {
    marginVertical: 10,
  },
  testCardsHeader: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  testCardsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  testCardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  testCardChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  formContainer: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  detectedBrandBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detectedBrandText: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: 'bold',
  },
  errorFieldText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  rowInputs: {
    gap: 12,
  },
  payButton: {
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 16,
  },
  payButtonText: {
    color: '#0B132B',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  securityTrustSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  trustBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  trustBadgeDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
