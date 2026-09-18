import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

/**
 * Wraps English (LTR) text inside an RTL paragraph to prevent
 * BiDi reordering issues (inverted parentheses, broken line order).
 *
 * Usage inside an Arabic <Text>:
 *   <Text>الإشعارات المنبثقة <LtrText>(Push Notifications)</LtrText></Text>
 */
interface LtrTextProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export default function LtrText({ children, style }: LtrTextProps) {
  return (
    <Text style={[{ writingDirection: 'ltr' } as TextStyle, style]}>
      {'\u2066'}{children}{'\u2069'}
    </Text>
  );
}
