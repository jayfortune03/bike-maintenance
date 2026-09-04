import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

export function EmptyState({ title, description, action, onPress }: { title: string; description: string; action?: string; onPress?: () => void }) {
  const theme = useTheme();
  return <View style={styles.container}><View style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}><Text variant="headlineSmall">+</Text></View><Text variant="titleMedium" style={styles.title}>{title}</Text><Text variant="bodyMedium" style={styles.description}>{description}</Text>{action && onPress ? <Button mode="contained" onPress={onPress} style={styles.button}>{action}</Button> : null}</View>;
}

const styles = StyleSheet.create({ container: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 52 }, icon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }, title: { textAlign: 'center', marginBottom: 8 }, description: { textAlign: 'center', opacity: 0.7, lineHeight: 21 }, button: { marginTop: 24 } });
