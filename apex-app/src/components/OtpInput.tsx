import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  hasError?: boolean;
  theme: any;
  isRTL?: boolean;
  onFocus?: () => void;
}

//  Helper: Convert Arabic-Indic (١ ٢ ٣) and Persian (۱ ۲ ۳) numerals to standard ASCII (1 2 3)
const toAsciiDigits = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9');
};

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  hasError,
  theme,
  isRTL = true,
  onFocus
}: OtpInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputsRef = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const asciiVal = toAsciiDigits(value || '');
    const newCode = asciiVal.split('').slice(0, length);
    const filledCode = [...newCode, ...Array(length - newCode.length).fill('')];
    setCode(filledCode);
  }, [value, length]);

  const handleChangeText = (text: string, index: number) => {
    if (onFocus) onFocus();

    const normalized = toAsciiDigits(text).replace(/[^0-9]/g, '');

    // Handle full paste or multi-digit input
    if (normalized.length > 1) {
      const pastedChars = normalized.slice(0, length).split('');
      const newCode = [...code];

      // If pasting full code, start from index 0
      const startIdx = normalized.length >= length ? 0 : index;
      pastedChars.forEach((char, i) => {
        if (startIdx + i < length) {
          newCode[startIdx + i] = char;
        }
      });

      const fullValue = newCode.join('');
      onChange(fullValue);

      const targetFocus = Math.min(startIdx + pastedChars.length, length - 1);
      inputsRef.current[targetFocus]?.focus();

      if (fullValue.length === length && onComplete) {
        onComplete(fullValue);
      }
      return;
    }

    // Single digit typing
    const newCode = [...code];
    newCode[index] = normalized;
    const fullValue = newCode.join('');
    onChange(fullValue);

    // Auto advance focus to the next empty box
    if (normalized !== '' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (fullValue.length === length && onComplete) {
      onComplete(fullValue);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (onFocus) onFocus();

    if (e.nativeEvent?.key === 'Backspace') {
      if (code[index] === '' && index > 0) {
        const newCode = [...code];
        newCode[index - 1] = '';
        onChange(newCode.join(''));
        inputsRef.current[index - 1]?.focus();
      } else {
        const newCode = [...code];
        newCode[index] = '';
        onChange(newCode.join(''));
      }
    }
  };

  return (
    //  NOTE: Numbers and OTP codes are ALWAYS rendered Left-to-Right (LTR) worldwide
    <View style={styles.container}>
      {code.map((digit, index) => {
        const isFocused = focusedIndex === index;
        return (
          <TextInput
            key={index}
            ref={(ref) => {
              inputsRef.current[index] = ref;
            }}
            style={[
              styles.box,
              {
                backgroundColor: theme.btnBg,
                color: theme.text,
                borderColor: hasError
                  ? '#EF4444'
                  : isFocused
                  ? theme.primary
                  : digit
                  ? `${theme.primary}90`
                  : theme.border,
                shadowColor: isFocused ? theme.primary : 'transparent',
                shadowOpacity: isFocused ? 0.35 : 0,
                shadowRadius: 6,
                elevation: isFocused ? 4 : 0,
              },
              hasError && styles.boxError,
            ]}
            value={digit}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
            maxLength={6} // Allow paste detection
            selectTextOnFocus
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            onFocus={() => {
              setFocusedIndex(index);
              if (onFocus) onFocus();
            }}
            onBlur={() => {
              setFocusedIndex(null);
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', // Always LTR for security codes & numbers
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginVertical: 14,
  },
  box: {
    flex: 1,
    maxWidth: 48,
    minWidth: 38,
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
  },
  boxError: {
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
});
