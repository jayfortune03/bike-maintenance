import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Text, useTheme } from 'react-native-paper';

export function EmptyState({ title, description, action, onPress }: { title: string; description: string; action?: string; onPress?: () => void }) {
  const theme = useTheme();
  return <View style={styles.container}><View style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}><MaterialCommunityIcons name="garage-variant" size={28} color={theme.colors.primary} /></View><Text variant="titleMedium" style={styles.title}>{title}</Text><Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>{description}</Text>{action && onPress ? <Button mode="contained" onPress={onPress} style={styles.button}>{action}</Button> : null}</View>;
}

const styles = StyleSheet.create({ container: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 52 }, icon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, title: { textAlign: 'center', marginBottom: 8, fontWeight: '700' }, description: { textAlign: 'center', lineHeight: 21 }, button: { marginTop: 24 } });
