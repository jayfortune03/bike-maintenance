import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

const icons = { index: 'home-variant-outline', garage: 'motorbike', maintenance: 'wrench-outline', settings: 'cog-outline' } as const;

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      tabBarStyle: { height: 74, paddingTop: 8, backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant },
      tabBarLabelStyle: { fontSize: 12, marginBottom: 8 },
      tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name={icons[route.name as keyof typeof icons]} size={size} color={color} />,
    })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="garage" options={{ title: 'Garage' }} />
      <Tabs.Screen name="maintenance" options={{ title: 'Perawatan' }} />
      <Tabs.Screen name="settings" options={{ title: 'Pengaturan' }} />
    </Tabs>
  );
}
