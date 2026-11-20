import { Image, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { accentColors } from '@/src/theme/accent';
import { RADII } from '@/src/theme/theme';

export function MotorcycleVisual({ color, photoUri, size = 56 }: { color: string; photoUri?: string; size?: number }) {
  const theme = useTheme();
  const palette = accentColors(color, theme.dark);
  if (photoUri) return <Image source={{ uri: photoUri }} resizeMode="cover" accessibilityLabel="Foto motor" style={[styles.visual, { width: size, height: size }]} />;
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.visual, { width: size, height: size, backgroundColor: palette.primaryContainer }]}>
    <MaterialCommunityIcons name="motorbike" size={28} color={palette.onPrimaryContainer} />
  </View>;
}

const styles = StyleSheet.create({ visual: { alignItems: 'center', justifyContent: 'center', borderRadius: RADII.compact } });
