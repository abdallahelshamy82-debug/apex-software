/**
 * ==============================================================================
 * Payment Service - Mock/Sandbox Architecture for React Native & Expo
 * ==============================================================================
 * This service provides a complete, production-ready interface for processing
 * credit/debit card transactions in development mode without legal merchant accounts.
 * 
 * 🔌 PLUG-AND-PLAY MIGRATION TO LIVE GATEWAYS:
 * When your legal commercial registration is ready, simply replace the simulation logic
 * inside `processPayment()` with your real provider:
 *  - Stripe: Use Stripe PaymentIntents API via backend (`POST /api/create-payment-intent`)
 *  - Paymob: Use Paymob Intention API or Card Tokenization (`POST /api/acceptance/payment_keys`)
 *  - Tap Payments / Moyasar: Call their charge endpoints with tokenized card data.
 * ==============================================================================
 */

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'meeza' | 'mada' | 'unknown';

export interface CardDetails {
  cardNumber: string;
  cardholderName: string;
  expiry: string; // MM/YY
  cvv: string;
}

export interface CardValidationResult {
  isValid: boolean;
  brand: CardBrand;
  errors: {
    cardNumber?: string;
    cardholderName?: string;
    expiry?: string;
    cvv?: string;
  };
}

export interface PaymentRequest {
  orderId?: string;
  amount: number;
  currency: string;
  card: CardDetails;
  customerName?: string;
  customerEmail?: string;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  authorizationCode?: string;
  orderId?: string;
  amount: number;
  currency: string;
  cardBrand?: CardBrand;
  cardLast4?: string;
  cardholderName?: string;
  timestamp: string;
  errorCode?: string;
  errorMessage?: string;
  gatewayReceipt?: string;
}

// ==============================================================================
// 1. Client-Side Validation Utilities (Luhn Algorithm, Brand & Expiry)
// ==============================================================================

/**
 * Standard Luhn Formula (Mod 10) for validating Credit Card numbers.
 */
export function checkLuhn(cardNumber: string): boolean {
  const sanitized = cardNumber.replace(/\D/g, '');
  if (sanitized.length < 13 || sanitized.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Identifies the card network brand from the BIN/prefix.
 */
export function detectCardBrand(cardNumber: string): CardBrand {
  const clean = cardNumber.replace(/\D/g, '');
  if (!clean) return 'unknown';

  // Meeza (Egyptian Local Scheme: starts with 5078, 6051, 5893, 5889)
  if (/^(5078|6051|5893|5889)/.test(clean)) return 'meeza';
  // Mada (Saudi Scheme: popular BINs like 588845, 440647, 440795, 417633, etc.)
  if (/^(440647|440795|417633|588845|462220|455708)/.test(clean)) return 'mada';
  // Visa (starts with 4)
  if (/^4/.test(clean)) return 'visa';
  // Mastercard (starts with 51-55 or 2221-2720)
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
  // American Express (starts with 34 or 37)
  if (/^3[47]/.test(clean)) return 'amex';
  // Discover (starts with 6011, 622126-622925, 644-649, 65)
  if (/^(6011|65|64[4-9])/.test(clean)) return 'discover';

  return 'unknown';
}

/**
 * Validates the expiry date string (MM/YY).
 */
export function validateExpiryDate(expiry: string): { isValid: boolean; message?: string } {
  const clean = expiry.replace(/\s+/g, '');
  if (!/^\d{2}\/\d{2}$/.test(clean)) {
    return { isValid: false, message: 'صيغة تاريخ الانتهاء يجب أن تكون MM/YY' };
  }

  const [monthStr, yearStr] = clean.split('/');
  const month = parseInt(monthStr, 10);
  const year = 2000 + parseInt(yearStr, 10);

  if (month < 1 || month > 12) {
    return { isValid: false, message: 'الشهر يجب أن يكون بين 01 و 12' };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { isValid: false, message: 'البطاقة منتهية الصلاحية' };
  }

  if (year > currentYear + 20) {
    return { isValid: false, message: 'تاريخ انتهاء غير صالح' };
  }

  return { isValid: true };
}

/**
 * Validates CVV based on card brand (3 digits or 4 for Amex).
 */
export function validateCVV(cvv: string, brand: CardBrand = 'unknown'): { isValid: boolean; message?: string } {
  const clean = cvv.replace(/\D/g, '');
  const requiredLength = brand === 'amex' ? 4 : 3;

  if (clean.length !== requiredLength) {
    return { 
      isValid: false, 
      message: brand === 'amex' ? 'رمز CVV لبطاقة أمريكان إكسبريس يتكون من 4 أرقام' : 'رمز CVV يتكون من 3 أرقام' 
    };
  }

  return { isValid: true };
}

/**
 * Validates complete card details prior to submission.
 */
export function validateCardDetails(card: CardDetails): CardValidationResult {
  const errors: CardValidationResult['errors'] = {};
  const cleanNum = card.cardNumber.replace(/\s+/g, '');
  const brand = detectCardBrand(cleanNum);

  // 1. Card Number Validation
  if (!cleanNum) {
    errors.cardNumber = 'رقم البطاقة مطلوب';
  } else if (cleanNum.length < 13 || cleanNum.length > 19) {
    errors.cardNumber = 'طول رقم البطاقة غير صالح';
  } else if (!checkLuhn(cleanNum)) {
    errors.cardNumber = 'رقم البطاقة غير صحيح (فشل فحص الخوارزمية)';
  }

  // 2. Cardholder Name
  const cleanName = (card.cardholderName || '').trim();
  if (!cleanName) {
    errors.cardholderName = 'اسم حامل البطاقة مطلوب';
  } else if (cleanName.length < 3) {
    errors.cardholderName = 'الاسم يجب أن يحتوي على 3 أحرف على الأقل';
  }

  // 3. Expiry
  const expiryCheck = validateExpiryDate(card.expiry || '');
  if (!expiryCheck.isValid) {
    errors.expiry = expiryCheck.message;
  }

  // 4. CVV
  const cvvCheck = validateCVV(card.cvv || '', brand);
  if (!cvvCheck.isValid) {
    errors.cvv = cvvCheck.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    brand,
    errors,
  };
}

/**
 * Auto-formats card number with a space every 4 digits.
 */
export function formatCardNumberInput(input: string): string {
  const clean = input.replace(/\D/g, '').substring(0, 19);
  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.substring(i, i + 4));
  }
  return parts.join(' ');
}

/**
 * Auto-formats expiry input as MM/YY with automatic slash injection.
 */
export function formatExpiryInput(input: string): string {
  const clean = input.replace(/\D/g, '').substring(0, 4);
  if (clean.length >= 3) {
    return `${clean.substring(0, 2)}/${clean.substring(2)}`;
  }
  return clean;
}

// ==============================================================================
// 2. Mock Test Cards Catalog for Developer Testing
// ==============================================================================
export interface TestCardPreset {
  title: string;
  subtitle: string;
  brand: CardBrand;
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholderName: string;
  behavior: 'success' | 'declined' | 'insufficient_funds';
}

export const TEST_CARDS: TestCardPreset[] = [
  {
    title: 'Visa (ناجحة)',
    subtitle: 'قبول فوري ومحاكاة عملية مكتملة',
    brand: 'visa',
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/28',
    cvv: '123',
    cardholderName: 'AHMED MOHAMED',
    behavior: 'success',
  },
  {
    title: 'Mastercard (ناجحة)',
    subtitle: 'قبول فوري ماستركارد',
    brand: 'mastercard',
    cardNumber: '5555 5555 5555 4444',
    expiry: '10/29',
    cvv: '888',
    cardholderName: 'SARAH AL-OTAIBI',
    behavior: 'success',
  },
  {
    title: 'ميزة / Meeza (ناجحة)',
    subtitle: 'بطاقة محلية مصرية',
    brand: 'meeza',
    cardNumber: '5078 1234 5678 9012',
    expiry: '09/27',
    cvv: '456',
    cardholderName: 'MAHMOUD HASSAN',
    behavior: 'success',
  },
  {
    title: 'بطاقة مرفوضة (Declined)',
    subtitle: 'محاكاة رفض البنك للعملية',
    brand: 'visa',
    cardNumber: '4000 0000 0000 0002',
    expiry: '05/27',
    cvv: '321',
    cardholderName: 'TEST DECLINED',
    behavior: 'declined',
  },
  {
    title: 'رصيد غير كافٍ (Insufficient)',
    subtitle: 'محاكاة فشل نقص الرصيد',
    brand: 'visa',
    cardNumber: '4000 0000 0000 9999',
    expiry: '08/28',
    cvv: '999',
    cardholderName: 'TEST LOW FUNDS',
    behavior: 'insufficient_funds',
  },
];

// ==============================================================================
// 3. Payment Service Core Implementation
// ==============================================================================

class PaymentService {
  private isSandbox: boolean = true;

  constructor(isSandbox: boolean = true) {
    this.isSandbox = isSandbox;
  }

  /**
   * Toggle between Mock Sandbox and Live Mode.
   */
  public setSandboxMode(enabled: boolean) {
    this.isSandbox = enabled;
  }

  public getIsSandbox(): boolean {
    return this.isSandbox;
  }

  /**
   * Main payment processing method.
   */
  public async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Step 1: Strict client-side verification before touching network
    const validation = validateCardDetails(request.card);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0] || 'بيانات البطاقة غير صالحة';
      throw new Error(firstError);
    }

    const cleanCardNumber = request.card.cardNumber.replace(/\s+/g, '');
    const last4 = cleanCardNumber.slice(-4);
    const brand = validation.brand;

    // Step 2: In Live Mode, plug in your gateway API here
    if (!this.isSandbox) {
      return await this.processLivePaymentGateway(request, validation);
    }

    // Step 3: Mock/Sandbox Simulation with realistic network latency (1.8s)
    await new Promise((resolve) => setTimeout(resolve, 1800));

    // Evaluate simulated business response based on test cards
    if (cleanCardNumber === '4000000000000002') {
      return {
        success: false,
        amount: request.amount,
        currency: request.currency,
        cardBrand: brand,
        cardLast4: last4,
        cardholderName: request.card.cardholderName,
        timestamp: new Date().toISOString(),
        errorCode: 'CARD_DECLINED',
        errorMessage: 'تم رفض العملية من البنك المصدر للبطاقة. يرجى مراجعة البنك أو استخدام بطاقة أخرى.',
      };
    }

    if (cleanCardNumber === '4000000000009999') {
      return {
        success: false,
        amount: request.amount,
        currency: request.currency,
        cardBrand: brand,
        cardLast4: last4,
        cardholderName: request.card.cardholderName,
        timestamp: new Date().toISOString(),
        errorCode: 'INSUFFICIENT_FUNDS',
        errorMessage: 'رصيد البطاقة غير كافٍ لإتمام هذه المعاملة.',
      };
    }

    // Default: Approved Transaction
    const mockTxnId = `txn_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const mockAuthCode = Math.floor(100000 + Math.random() * 900000).toString();

    return {
      success: true,
      transactionId: mockTxnId,
      authorizationCode: mockAuthCode,
      orderId: request.orderId || `ORD-${Date.now()}`,
      amount: request.amount,
      currency: request.currency,
      cardBrand: brand,
      cardLast4: last4,
      cardholderName: request.card.cardholderName,
      timestamp: new Date().toISOString(),
      gatewayReceipt: `https://mock-gateway.apex-software.internal/receipts/${mockTxnId}`,
    };
  }

  /**
   * 🔌 LIVE GATEWAY INTEGRATION SLOT:
   * Plug in real Paymob or Stripe credentials here once commercial registration is complete.
   */
  private async processLivePaymentGateway(
    request: PaymentRequest,
    validation: CardValidationResult
  ): Promise<PaymentResponse> {
    /**
     * EXAMPLE FOR STRIPE:
     * 1. Call your Node backend: const { clientSecret } = await api.createPaymentIntent(request.amount);
     * 2. Confirm card payment: const { paymentIntent, error } = await confirmPayment(clientSecret, { paymentMethodType: 'Card' });
     * 
     * EXAMPLE FOR PAYMOB (Accept):
     * 1. POST /api/auth/tokens -> authToken
     * 2. POST /api/ecommerce/orders -> orderId
     * 3. POST /api/acceptance/payment_keys -> paymentKey
     * 4. POST /api/acceptance/payments/pay with tokenized card data.
     */
    throw new Error('Live payment gateway is not configured yet. Please enable Sandbox Mode.');
  }
}

export const paymentService = new PaymentService(true);
export default paymentService;
