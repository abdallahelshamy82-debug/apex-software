import React from 'react';
import { TouchableOpacity, StyleSheet, Text, Linking, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
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
  bottom = 110, // Strictly above the 90px Tab Bar
  inputBarHeight,
  hidden = false,
  style,
}: WhatsAppFABProps) {
  const settings = useSettings();
  const isRTL = settings?.isRTL ?? true;
  const theme = settings?.theme;
  const { showToast } = useToast();
  
  let pathname = '';
  try {
    pathname = usePathname();
  } catch (e) {
    pathname = '';
  }

  // Completely hide inside chat/copilot
  const isChatScreen = hidden || pathname === '/chat' || pathname === '/copilot' || pathname?.startsWith('/chat') || pathname?.startsWith('/copilot');
  if (isChatScreen) {
    return null;
  }

  const effectiveBottom = inputBarHeight ? inputBarHeight + 16 : bottom;
  // Fallback strictly handled here as requested
  const safePrimary = theme?.primary || '#B4F82C';

  const handleOpenWhatsApp = () => {
    const defaultMsg = isRTL 
      ? 'مرحباً فريق Apex Devs، أود الاستفسار عن برمجة مشروع...'
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
          message: isRTL ? 'تعذر فتح واتساب. يرجى التأكد من تثبيته.' : 'Could not open WhatsApp. Please check if installed.',
        });
      });
    }
  };

  return (
    <View 
      style={[
        styles.container,
        { bottom: effectiveBottom },
        isRTL ? { left: 20 } : { right: 20 },
        style
      ]}
    >
      <TouchableOpacity onPress={handleOpenWhatsApp} activeOpacity={0.8} style={styles.touchable}>
        <BlurView 
          intensity={80} 
          tint="dark" 
          style={[
            styles.buttonBase, 
            { 
              backgroundColor: safePrimary, // STRICT INLINE backgroundColor to force re-rendering
              shadowColor: safePrimary 
            }
          ]}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="logo-whatsapp" size={24} color="#09090B" />
          </View>
          <Text style={[styles.fabText, { color: '#09090B' }]}>
            {isRTL ? 'تحدث معنا' : 'Chat'}
          </Text>
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 10,
  },
  touchable: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    paddingEnd: 20, // Logical padding for the text side
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Subtle inner stroke for premium feel
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
    gap: 10,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)', // Slight contrast for the icon container
  },
  fabText: {
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
