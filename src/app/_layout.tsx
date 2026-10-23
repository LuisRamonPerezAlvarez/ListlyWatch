import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { WatchProvider } from '../store';
import { useWatchTheme } from '../theme';

function WatchNavigator() {
  const { colors } = useWatchTheme();

  return (
    <>
      <StatusBar style={colors.isDark ? 'light' : 'dark'} hidden={false} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="list/[id]" />
        <Stack.Screen name="settings" options={{ presentation: 'card' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <WatchProvider>
      <WatchNavigator />
    </WatchProvider>
  );
}
