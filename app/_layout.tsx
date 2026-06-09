import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { WorryProvider } from '@/context/WorryContext';

// 앱이 포그라운드에 있을 때도 알림 배너 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  return (
    <WorryProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </WorryProvider>
  );
}
