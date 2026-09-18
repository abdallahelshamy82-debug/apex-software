import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { CardBrand } from '../services/paymentService';

interface CreditCardVisualProps {
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  brand: CardBrand;
  isRTL?: boolean;
}

export const CreditCardVisual: React.FC<CreditCardVisualProps> = ({
  cardNumber,
  cardholderName,
  expiry,
  brand,
  isRTL = false,
}) => {
  // Format 16 digits into 4 groups, padding unfilled positions with bullet dots
  const cleanDigits = cardNumber.replace(/\D/g, '');
  const displayBlocks = [
    cleanDigits.substring(0, 4).padEnd(4, '•'),
    cleanDigits.substring(4, 8).padEnd(4, '•'),
    cleanDigits.substring(8, 12).padEnd(4, '•'),
    cleanDigits.substring(12, 16).padEnd(4, '•'),
  ];

  const displayName = cardholderName.trim().toUpperCase() || (isRTL ? 'اسم حامل البطاقة' : 'CARDHOLDER NAME');
  const displayExpiry = expiry.trim() || 'MM/YY';

  const renderBrandBadge = () => {
    switch (brand) {
      case 'visa':
        return (
          <View style={[styles.brandBadge, { backgroundColor: '#1A1F71' }]}>
            <Text style={styles.brandVisaText}>VISA</Text>
          </View>
        );
      case 'mastercard':
        return (
          <View style={styles.brandMastercardContainer}>
            <View style={[styles.mcCircle, { backgroundColor: '#EB001B' }]} />
            <View style={[styles.mcCircle, { backgroundColor: '#F79E1B', marginLeft: -12 }]} />
          </View>
        );
      case 'amex':
        return (
          <View style={[styles.brandBadge, { backgroundColor: '#2E77BC' }]}>
            <Text style={styles.brandAmexText}>AMEX</Text>
          </View>
        );
      case 'meeza':
        return (
          <View style={[styles.brandBadge, { backgroundColor: '#00833E' }]}>
            <Text style={styles.brandMeezaText}>ميزة Meeza</Text>
          </View>
        );
      case 'mada':
        return (
          <View style={[styles.brandBadge, { backgroundColor: '#005C8A' }]}>
            <Text style={styles.brandMadaText}>mada مدى</Text>
          </View>
        );
      default:
        return (
          <View style={styles.brandDefaultBadge}>
            <Ionicons name="card-outline" size={20} color="#94A3B8" />
          </View>
        );
    }
  };

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.cardContainer}>
        {/* Glow ambient background elements */}
        <View style={styles.cardGlowTop} />
        <View style={styles.cardGlowBottom} />

        {/* Top Row: Chip & Contactless & Brand Badge */}
        <View style={styles.topRow}>
          <View style={styles.chipRow}>
            {/* Microchip Graphic */}
            <View style={styles.chip}>
              <View style={styles.chipInnerGrid} />
              <View style={styles.chipInnerH} />
            </View>
            {/* Contactless Signal */}
            <MaterialCommunityIcons 
              name="contactless-payment" 
              size={24} 
              color="rgba(255, 255, 255, 0.7)" 
              style={{ marginLeft: 10 }}
            />
          </View>
          {renderBrandBadge()}
        </View>

        {/* Middle Row: Formatted 16 Digits */}
        <View style={styles.numberRow}>
          {displayBlocks.map((block, idx) => (
            <Text key={idx} style={styles.numberBlock}>
              {block}
            </Text>
          ))}
        </View>

        {/* Bottom Row: Cardholder & Expiration Date */}
        <View style={styles.bottomRow}>
          <View style={styles.cardholderCol}>
            <Text style={styles.fieldLabel}>
              {isRTL ? 'حامل البطاقة' : 'CARDHOLDER NAME'}
            </Text>
            <Text numberOfLines={1} style={styles.fieldValueName}>
              {displayName}
            </Text>
          </View>

          <View style={styles.expiryCol}>
            <Text style={styles.fieldLabel}>
              {isRTL ? 'ينتهي في' : 'EXPIRES'}
            </Text>
            <Text style={styles.fieldValueExpiry}>
              {displayExpiry}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 1.586, // Standard ISO/IEC 7810 ID-1 credit card aspect ratio
    backgroundColor: '#0A1128',
    borderRadius: 18,
    padding: 20,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    overflow: 'hidden',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  cardGlowTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  cardGlowBottom: {
    position: 'absolute',
    bottom: -50,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    width: 38,
    height: 28,
    backgroundColor: '#D4AF37',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F3E5AB',
    overflow: 'hidden',
    position: 'relative',
  },
  chipInnerGrid: {
    position: 'absolute',
    top: 4,
    left: 10,
    right: 10,
    bottom: 4,
    borderWidth: 1,
    borderColor: '#AA7C11',
    borderRadius: 2,
  },
  chipInnerH: {
    position: 'absolute',
    top: 13,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#AA7C11',
  },
  brandBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  brandVisaText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontStyle: 'italic',
  },
  brandMastercardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mcCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  brandAmexText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandMeezaText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  brandMadaText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  brandDefaultBadge: {
    padding: 4,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 14,
  },
  numberBlock: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardholderCol: {
    flex: 1,
    marginRight: 10,
  },
  expiryCol: {
    alignItems: 'flex-end',
  },
  fieldLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  fieldValueName: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  fieldValueExpiry: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
});

export default CreditCardVisual;
