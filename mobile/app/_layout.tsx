import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../contexts/AuthContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => { SplashScreen.hideAsync(); }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="events/[slug]"                           options={{ headerShown: true, title: 'Event' }} />
          <Stack.Screen name="events/[slug]/q/[queueSlug]/index"      options={{ headerShown: true, title: 'Join Queue' }} />
          <Stack.Screen name="events/[slug]/q/[queueSlug]/ticket"     options={{ headerShown: true, title: 'My Ticket' }} />
          <Stack.Screen name="admin/index"                            options={{ headerShown: true, title: 'Admin Dashboard' }} />
          <Stack.Screen name="profile/setup"                          options={{ headerShown: true, title: 'Set Up Profile' }} />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
