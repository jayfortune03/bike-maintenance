import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { useAppStore, selectActiveMotorcycle } from '@/src/store/app.store';
import { getAppTheme } from '@/src/theme/theme';
import { useReducedMotion } from 'react-native-reanimated';
import { NotificationObserver } from '@/src/components/NotificationObserver';

export default function RootLayout() {
  const reducedMotion = useReducedMotion();
  const systemIsDark = useColorScheme() === 'dark';
  const preferences = useAppStore((state) => state.preferences);
  const motorcycle = useAppStore(selectActiveMotorcycle);
  const theme = getAppTheme(preferences.themeMode, systemIsDark, preferences.useMotorcycleAccent ? motorcycle?.themeColor : undefined);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: reducedMotion ? 'none' : 'slide_from_right', contentStyle: { backgroundColor: theme.colors.background } }} />
      <NotificationObserver />
    </PaperProvider>
  );
}
