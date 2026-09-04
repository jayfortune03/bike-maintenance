import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { useAppStore, selectActiveMotorcycle } from '@/src/store/app.store';
import { getAppTheme } from '@/src/theme/theme';

export default function RootLayout() {
  const systemIsDark = useColorScheme() === 'dark';
  const preferences = useAppStore((state) => state.preferences);
  const motorcycle = useAppStore(selectActiveMotorcycle);
  const theme = getAppTheme(preferences.themeMode, systemIsDark, preferences.useMotorcycleAccent ? motorcycle?.themeColor : undefined);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </PaperProvider>
  );
}
