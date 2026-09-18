import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Keyboard } from 'react-native';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  theme: any;
  isRTL: boolean;
  onFocus?: () => void;
}

export function OtpInput({ length = 6, value, onChange, hasError, theme, isRTL, onFocus }: OtpInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const newCode = value.split('').slice(0, length);
    const filledCode = [...newCode, ...Array(length - newCode.length).fill('')];
    setCode(filledCode);
  }, [value, length]);

  const handleChangeText = (text: string, index: number) => {
    // Call onFocus to clear error state
    if (onFocus) onFocus();

    // Handle paste
    if (text.length > 1) {
      const pastedData = text.replace(/[^0-9]/g, '').slice(0, length).split('');
      if (pastedData.length > 0) {
        const newCode = [...code];
        pastedData.forEach((char, i) => {
          if (index + i < length) {
            newCode[index + i] = char;
          }
        });
        const newValue = newCode.join('');
        onChange(newValue);
        
        // Focus the next empty input or the last one
        const nextIndex = Math.min(index + pastedData.length, length - 1);
        inputsRef.current[nextIndex]?.focus();
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = text;
    onChange(newCode.join(''));

    // Move to next input if typing a character
    if (text !== '' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (onFocus) onFocus();
    
    if (e.nativeEvent.key === 'Backspace') {
      if (code[index] === '' && index > 0) {
        // Move to previous and clear it
        const newCode = [...code];
        newCode[index - 1] = '';
        onChange(newCode.join(''));
        inputsRef.current[index - 1]?.focus();
      } else {
        // Just clear current
        const newCode = [...code];
        newCode[index] = '';
        onChange(newCode.join(''));
      }
    }
  };

  return (
    <View style={[styles.container, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      {code.map((digit, index) => (
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
              borderColor: hasError ? '#EF4444' : (digit ? theme.primary : theme.border),
            },
            hasError && styles.boxError
          ]}
          value={digit}
          onChangeText={(text) => handleChangeText(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="numeric"
          maxLength={6} // Allow paste up to 6
          onFocus={onFocus}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  box: {
    width: 45,
    height: 55,
    borderWidth: 1.5,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
  },
  boxError: {
    borderWidth: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  }
});
