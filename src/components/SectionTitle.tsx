import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export function SectionTitle({ children, action }: { children: string; action?: string }) {
  const theme = useTheme();
  return <View style={styles.row}><Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>{children}</Text>{action ? <Text variant="labelLarge" style={{ color: theme.colors.primary }}>{action}</Text> : null}</View>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 12 }, title: { fontWeight: '700', letterSpacing: 0.1 } });
