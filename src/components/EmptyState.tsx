import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Text, useTheme } from 'react-native-paper';
import { RADII, SPACING } from '@/src/theme/theme';

type EmptyStateProps = {
  readonly title: string;
  readonly description: string;
  readonly icon?: keyof typeof MaterialCommunityIcons.glyphMap;
} & ({ readonly action?: never; readonly onPress?: never } | { readonly action: string; readonly onPress: () => void });

export function EmptyState({ title, description, icon = 'garage-variant', action, onPress }: EmptyStateProps) {
  const theme = useTheme();
  return <View style={styles.container}><View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}><MaterialCommunityIcons name={icon} size={28} color={theme.colors.onPrimaryContainer} /></View><Text accessibilityRole="header" variant="titleMedium" style={styles.title}>{title}</Text><Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>{description}</Text>{action && onPress ? <Button mode="contained" onPress={onPress} contentStyle={styles.buttonContent} style={styles.button}>{action}</Button> : null}</View>;
}

const styles = StyleSheet.create({ container: { alignItems: 'center', alignSelf: 'center', width: '100%', maxWidth: 480, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.wide }, icon: { width: 64, height: 64, borderRadius: RADII.card, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg }, title: { textAlign: 'center', marginBottom: SPACING.sm }, description: { textAlign: 'center' }, button: { marginTop: SPACING.xxl }, buttonContent: { minHeight: SPACING.touch } });
