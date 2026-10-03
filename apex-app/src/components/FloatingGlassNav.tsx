import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSettings } from '../context/SettingsContext';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface NavItem {
  name: string;
  icon: IconName;
  activeIcon: IconName;
  route?: string;
  onPress?: () => void;
  isWhatsApp?: boolean;
}

export default function FloatingGlassNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isRTL, theme, currentUser } = useSettings();

  const isUserAdmin = currentUser?.role === 'admin' || currentUser?.isAdmin;
  const portalRoute = currentUser ? (isUserAdmin ? '/admin' : '/dashboard') : '/login';
  const portalName = currentUser ? (isRTL ? 'لوحتي' : 'Dashboard') : (isRTL ? 'حسابي' : 'Portal');
  const portalIcon: IconName = currentUser ? 'grid-outline' : 'person-outline';
  const portalActiveIcon: IconName = currentUser ? 'grid' : 'person';

  const handleOpenWhatsApp = () => {
    const defaultMsg = isRTL 
      ? 'مرحباً فريق Magixa، أود استشارة برمجية بخصوص مشروعي وتكلفته التقديرية...'
      : 'Hello Magixa team, I would like a consultation regarding my software project...';
    const url = `https://wa.me/201027877209?text=${encodeURIComponent(defaultMsg)}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => {});
    }
  };

  const navItems: NavItem[] = [
    { name: isRTL ? 'الرئيسية' : 'Home', icon: 'home-outline', activeIcon: 'home', route: '/' },
    { name: isRTL ? 'التكلفة' : 'Cost', icon: 'calculator-outline', activeIcon: 'calculator', route: '/estimator' },
    { 
      name: isRTL ? 'تحدث معنا' : 'WhatsApp', 
      icon: 'logo-whatsapp', 
      activeIcon: 'logo-whatsapp', 
      onPress: handleOpenWhatsApp,
      isWhatsApp: true,
    },
    { name: portalName, icon: portalIcon, activeIcon: portalActiveIcon, route: portalRoute },
  ];

  if (pathname === '/login') return null;

  const flexDirection = (isRTL ? 'row-reverse' : 'row') as 'row' | 'row-reverse';

  const renderNavItems = () => (
    navItems.map((item, index) => {
      const isActive = item.route ? pathname === item.route : false;
      const iconColor = item.isWhatsApp 
        ? '#25D366' 
        : (isActive ? (theme?.primary || '#B4F82C') : 'rgba(255, 255, 255, 0.6)');
      const textColor = item.isWhatsApp
        ? '#25D366'
        : (isActive ? (theme?.primary || '#B4F82C') : 'rgba(255, 255, 255, 0.6)');

      return (
        <TouchableOpacity 
          key={index} 
          style={styles.navItem} 
          onPress={() => {
            if (item.onPress) {
              item.onPress();
            } else if (item.route) {
              router.push(item.route as any);
            }
          }}
          activeOpacity={0.7}
          accessibilityLabel={item.name}
        >
          <Ionicons 
            name={isActive ? item.activeIcon : item.icon} 
            size={item.isWhatsApp ? 23 : 22} 
            color={iconColor} 
          />
          <Text style={[styles.navText, { color: textColor }]}>{item.name}</Text>
          {isActive && <View style={[styles.activeIndicator, { backgroundColor: theme?.primary || '#B4F82C', shadowColor: theme?.primary || '#B4F82C' }]} />}
        </TouchableOpacity>
      );
    })
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrapper}>
        <View style={[styles.glassContainerWeb as any, { flexDirection }]}>
          {renderNavItems()}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={20} tint="dark" style={[styles.glassContainerNative, { flexDirection }]}>
        {renderNavItems()}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 24 : 36,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  glassContainerWeb: {
    backgroundColor: 'rgba(10, 15, 29, 0.75)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    maxWidth: 400,
    height: 64,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
  } as any,
  glassContainerNative: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    maxWidth: 400,
    height: 64,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    flex: 1,
    position: 'relative',
  },
  navText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#B4F82C',
    shadowColor: '#B4F82C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  }
});
