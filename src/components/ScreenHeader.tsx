import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, useTheme } from 'react-native-paper';
import { RADII, SPACING } from '@/src/theme/theme';

type ScreenHeaderProps = {
  readonly icon: keyof typeof MaterialCommunityIcons.glyphMap;
  readonly title: string;
  readonly description: string;
};

export function ScreenHeader({ icon, title, description }: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}
      >
        <MaterialCommunityIcons name={icon} size={24} color={theme.colors.onPrimaryContainer} />
      </View>
      <View style={styles.copy}>
        <Text accessibilityRole="header" variant="headlineSmall">
          {title}
        </Text>
        <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginBottom: SPACING.xxl },
  icon: { width: SPACING.touch, height: SPACING.touch, borderRadius: RADII.compact, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  description: { marginTop: SPACING.xs },
});
