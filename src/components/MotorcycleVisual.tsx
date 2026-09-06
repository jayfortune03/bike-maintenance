import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { accentColors } from '@/src/theme/accent';

export function MotorcycleVisual({ color, size = 56 }: { color: string; size?: number }) {
  const theme = useTheme();
  const palette = accentColors(color, theme.dark);
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.visual, { width: size, height: size, backgroundColor: palette.primaryContainer }]}>
    <MaterialCommunityIcons name="motorbike" size={28} color={palette.onPrimaryContainer} />
  </View>;
}

const styles = StyleSheet.create({ visual: { alignItems: 'center', justifyContent: 'center', borderRadius: 16 } });
