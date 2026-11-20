import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { SPACING } from '@/src/theme/theme';

type SectionTitleProps = {
  readonly children: string;
  readonly description?: string;
} & ({ readonly action?: never; readonly onAction?: never } | { readonly action: string; readonly onAction: () => void });

export function SectionTitle({ children, description, action, onAction }: SectionTitleProps) {
  const theme = useTheme();
  return <View style={styles.row}><View style={styles.copy}><Text accessibilityRole="header" variant="titleMedium" style={{ color: theme.colors.onSurface }}>{children}</Text>{description ? <Text variant="bodySmall" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>{description}</Text> : null}</View>{action && onAction ? <Button compact onPress={onAction} contentStyle={styles.action}>{action}</Button> : null}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.wide, marginBottom: SPACING.md },
  copy: { flex: 1, minWidth: 0 },
  description: { marginTop: SPACING.xs },
  action: { minHeight: SPACING.touch },
});
