import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { EmptyState } from '@/src/components/EmptyState';
import { MotorcycleCard } from '@/src/components/MotorcycleCard';
import { useAppStore } from '@/src/store/app.store';
import { CARD_SHADOW } from '@/src/theme/theme';

export default function GarageScreen() {
  const router = useRouter();
  const theme = useTheme();
  const motorcycles = useAppStore((state) => state.motorcycles);
  const activeId = useAppStore((state) => state.activeMotorcycleId);
  const setActive = useAppStore((state) => state.setActiveMotorcycle);
  const cardStyle = [
    styles.card,
    CARD_SHADOW,
    {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outlineVariant,
    },
  ];

  return (
    <Screen>
      <View style={styles.header}>
        <View
          style={[
            styles.headerIcon,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name="garage-variant"
            size={24}
            color={theme.colors.onPrimaryContainer}
          />
        </View>
        <View style={styles.copy}>
          <Text
            variant="headlineSmall"
            accessibilityRole="header"
            style={styles.title}
          >
            Garage saya
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Semua motor, satu tempat untuk dirawat.
          </Text>
        </View>
      </View>

      {motorcycles.length > 0 ? (
        <>
          <Card mode="outlined" style={cardStyle}>
            <Card.Content style={styles.summary}>
              <View style={styles.copy}>
                <Text
                  variant="labelMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  KOLEKSI MOTOR
                </Text>
                <Text variant="titleLarge" style={styles.countTitle}>
                  {motorcycles.length} motor tersimpan
                </Text>
              </View>
              <MaterialCommunityIcons
                name="motorbike"
                size={32}
                color={theme.colors.primary}
              />
            </Card.Content>
          </Card>
          <Text
            variant="titleMedium"
            accessibilityRole="header"
            style={styles.sectionTitle}
          >
            Daftar motor
          </Text>
          {motorcycles.map((motorcycle) => (
            <MotorcycleCard
              key={motorcycle.id}
              motorcycle={motorcycle}
              active={activeId === motorcycle.id}
              onPress={() => {
                setActive(motorcycle.id);
                router.push(`/motorcycle/${motorcycle.id}`);
              }}
            />
          ))}
        </>
      ) : (
        <Card mode="outlined" style={cardStyle}>
          <Card.Content>
            <EmptyState
              title="Garage masih kosong"
              description="Tambahkan motor untuk mulai mencatat perawatan."
            />
          </Card.Content>
        </Card>
      )}

      <Button
        icon="plus"
        mode="contained"
        onPress={() => router.push('/motorcycle/add')}
        contentStyle={styles.buttonContent}
        style={styles.add}
      >
        Tambah motor
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    lineHeight: 22,
  },
  card: {
    borderRadius: 20,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 24,
  },
  countTitle: {
    fontWeight: '700',
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: '700',
    marginTop: 32,
    marginBottom: 16,
  },
  buttonContent: {
    minHeight: 48,
  },
  add: {
    marginTop: 16,
  },
});
