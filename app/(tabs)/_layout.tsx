import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

const icons = { index: 'view-dashboard-outline', garage: 'garage-variant', maintenance: 'wrench-clock-outline', settings: 'cog-outline' } as const;

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      animation: 'fade',
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      tabBarStyle: { height: 78, paddingTop: 8, paddingBottom: 8, backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant },
      tabBarItemStyle: { paddingHorizontal: 3 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name={icons[route.name as keyof typeof icons]} size={size} color={color} />,
    })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="garage" options={{ title: 'Garage' }} />
      <Tabs.Screen name="maintenance" options={{ title: 'Perawatan' }} />
      <Tabs.Screen name="settings" options={{ title: 'Pengaturan' }} />
    </Tabs>
  );
}
