import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider } from '../context/SettingsContext';
import { ApexToastProvider } from '../components/ApexToast';
import { LogBox, Platform } from 'react-native';

// Disable error/warning toasts & red/yellow boxes from showing on client screen
LogBox.ignoreAllLogs(true);

// Silence noisy web-only development warnings
if (Platform.OS === 'web') {
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args) => {
    if (typeof args[0] === 'string') {
      if (args[0].includes('shadow*') || args[0].includes('textShadow*')) return;
      if (args[0].includes('expo-av')) return;
      if (args[0].includes('useNativeDriver')) return;
      if (args[0].includes('props.pointerEvents is deprecated')) return;
      if (args[0].includes('Cannot record touch end without a touch start')) return;
    }
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    if (typeof args[0] === 'string') {
      if (args[0].includes('Blocked aria-hidden on an element')) return;
      if (args[0].includes('Cross-Origin-Opener-Policy policy would block')) return;
      if (args[0].includes('validateDOMNesting')) return;
    }
    originalError.apply(console, args);
  };
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ApexToastProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="estimator" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="admin" />
          </Stack>
        </ApexToastProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
