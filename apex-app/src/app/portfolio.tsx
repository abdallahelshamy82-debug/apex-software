import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const WEBSITE_URL = 'https://magixa.tech';

export default function IdentityPortfolioScreen() {
  const router = useRouter();

  useEffect(() => {
    // Open the website directly in the system browser
    Linking.openURL(WEBSITE_URL).catch(() => {});
    
    // Automatically navigate back to avoid staying on an empty screen
    const timer = setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/dashboard' as any);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color="#38BDF8" />
      <Text style={styles.text}>جاري فتح معرض الأعمال على موقع الويب...</Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => Linking.openURL(WEBSITE_URL)}
      >
        <Ionicons name="open-outline" size={18} color="#0B0F19" />
        <Text style={styles.btnText}>فتح الموقع الآن</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1D',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  text: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#38BDF8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  btnText: {
    color: '#0B0F19',
    fontWeight: '700',
    fontSize: 14,
  },
});
