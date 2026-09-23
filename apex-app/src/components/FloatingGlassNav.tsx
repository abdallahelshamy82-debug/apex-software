import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSettings } from '../context/SettingsContext';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface NavItem {
  name: string;
  icon: IconName;
  activeIcon: IconName;
  route: string;
}

export default function FloatingGlassNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isRTL, theme } = useSettings();

  const navItems: NavItem[] = [
    { name: 'Home', icon: 'home-outline', activeIcon: 'home', route: '/' },
    { name: 'Cost', icon: 'calculator-outline', activeIcon: 'calculator', route: '/estimator' },
    { name: 'Copilot', icon: 'hardware-chip-outline', activeIcon: 'hardware-chip', route: '/copilot' },
    { name: 'Portal', icon: 'person-outline', activeIcon: 'person', route: '/login' },
  ];

  if (pathname === '/login') return null;

  const flexDirection = (isRTL ? 'row-reverse' : 'row') as 'row' | 'row-reverse';

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrapper}>
        <View style={[styles.glassContainerWeb as any, { flexDirection }]}>
          {navItems.map((item, index) => {
            const isActive = pathname === item.route;
            return (
              <TouchableOpacity key={index} style={styles.navItem} onPress={() => router.push(item.route as any)}>
                <Ionicons name={isActive ? item.activeIcon : item.icon} size={22} color={isActive ? (theme?.primary || '#B4F82C') : 'rgba(255, 255, 255, 0.6)'} />
                <Text style={[styles.navText, { color: isActive ? (theme?.primary || '#B4F82C') : 'rgba(255, 255, 255, 0.6)' }]}>{item.name}</Text>
                {isActive && <View style={[styles.activeIndicator, { backgroundColor: theme?.primary || '#B4F82C', shadowColor: theme?.primary || '#B4F82C' }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={20} tint="dark" style={[styles.glassContainerNative, { flexDirection }]}>
        {navItems.map((item, index) => {
          const isActive = pathname === item.route;
          return (
            <TouchableOpacity key={index} style={styles.navItem} onPress={() => router.push(item.route as any)}>
              <Ionicons name={isActive ? item.activeIcon : item.icon} size={22} color={isActive ? (theme?.primary || '#B4F82C') : 'rgba(255, 255, 255, 0.6)'} />
              <Text style={[styles.navText, { color: isActive ? (theme?.primary || '#B4F82C') : 'rgba(255, 255, 255, 0.6)' }]}>{item.name}</Text>
              {isActive && <View style={[styles.activeIndicator, { backgroundColor: theme?.primary || '#B4F82C', shadowColor: theme?.primary || '#B4F82C' }]} />}
            </TouchableOpacity>
          );
        })}
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
