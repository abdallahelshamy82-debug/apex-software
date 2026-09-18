import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider } from '../context/SettingsContext';
import { ApexToastProvider } from '../components/ApexToast';
import { LogBox } from 'react-native';

// Disable error/warning toasts & red/yellow boxes from showing on client screen
LogBox.ignoreAllLogs(true);

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
