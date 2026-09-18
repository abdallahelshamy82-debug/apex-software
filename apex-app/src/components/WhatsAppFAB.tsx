import React from 'react';
import { TouchableOpacity, StyleSheet, Text, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { useSettings } from '../context/SettingsContext';
import { useToast } from './ApexToast';

interface WhatsAppFABProps {
  customMessage?: string;
  phoneNumber?: string;
  bottom?: number;
  inputBarHeight?: number;
  hidden?: boolean;
  style?: any;
}

export default function WhatsAppFAB({
  customMessage,
  phoneNumber = '201000000000',
  bottom = 25,
  inputBarHeight,
  hidden = false,
  style,
}: WhatsAppFABProps) {
  const { isRTL } = useSettings() || { isRTL: true };
  const { showToast } = useToast();
  let pathname = '';
  try {
    pathname = usePathname();
  } catch (e) {
    pathname = '';
  }

  // Completely hide the floating WhatsApp FAB inside dedicated chat & ticket screens
  // to avoid overlapping input bars, send buttons, and keyboard
  const isChatScreen = hidden || pathname === '/chat' || pathname === '/copilot' || pathname?.startsWith('/chat') || pathname?.startsWith('/copilot');
  if (isChatScreen) {
    return null;
  }

  // Calculate dynamic bottom offset if an input bar height exists
  const effectiveBottom = inputBarHeight ? inputBarHeight + 16 : bottom;

  const handleOpenWhatsApp = () => {
    const defaultMsg = isRTL 
      ? 'مرحباً فريق Apex Devs، أود استشارة برمجية بخصوص مشروعي والتكلفة المتوقعة...'
      : 'Hello Apex Devs team, I would like a consultation regarding my software project...';

    const msg = customMessage || defaultMsg;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(msg)}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => {
        showToast({
          type: 'warning',
          title: isRTL ? 'تنبيه' : 'Notice',
          message: isRTL ? 'تعذر فتح تطبيق واتساب. يرجى التأكد من تثبيت التطبيق.' : 'Could not open WhatsApp. Please check if installed.',
        });
      });
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        { bottom: effectiveBottom },
        isRTL ? { left: 20 } : { right: 20 },
        style,
      ]}
      onPress={handleOpenWhatsApp}
      activeOpacity={0.85}
    >
      <Ionicons name="logo-whatsapp" size={30} color="#FFFFFF" />
      <Text style={styles.fabText}>
        {isRTL ? 'تحدث معنا' : 'Chat'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 25,
    zIndex: 999,
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
