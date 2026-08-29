import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../lib/configure-notifications';
import { requestNotificationPermission } from '../lib/notification-permissions';

export default function RootLayout() {
  useEffect(() => {
    void requestNotificationPermission();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationBar hidden style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
