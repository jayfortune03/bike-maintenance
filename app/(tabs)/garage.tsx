import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/src/components/EmptyState';
import { MotorcycleCard } from '@/src/components/MotorcycleCard';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SectionTitle } from '@/src/components/SectionTitle';
import { useAppStore } from '@/src/store/app.store';
import { CARD_SHADOW, LAYOUT, RADII, SPACING } from '@/src/theme/theme';

export default function GarageScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= LAYOUT.wideBreakpoint;
  const motorcycles = useAppStore((state) => state.motorcycles);
  const activeId = useAppStore((state) => state.activeMotorcycleId);
  const setActive = useAppStore((state) => state.setActiveMotorcycle);
  const surface = [styles.surface, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }];

  return (
    <Screen>
      <ScreenHeader icon="garage-variant" title="Garasi" description="Pilih motor aktif atau buka detail kendaraan." />

      {motorcycles.length > 0 ? (
        <>
          <View style={[surface, styles.summary]}>
            <View style={styles.summaryCopy}>
              <Text variant="labelMedium" style={{ color: theme.colors.primary }}>KOLEKSI MOTOR</Text>
              <Text variant="titleLarge" style={styles.summaryTitle}>{motorcycles.length} motor tersimpan</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Motor aktif menentukan warna aksen dan jadwal yang ditampilkan.</Text>
            </View>
            <View style={[styles.summaryIcon, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons name="motorbike" size={30} color={theme.colors.onPrimaryContainer} />
            </View>
          </View>

          <SectionTitle description="Ketuk kartu untuk menjadikannya aktif dan melihat detail.">Motor saya</SectionTitle>
          <View style={[styles.list, wide && styles.listWide]}>
            {motorcycles.map((motorcycle, index) => (
              <View key={motorcycle.id} style={[styles.item, wide && styles.itemWide]}>
                <MotorcycleCard
                  motorcycle={motorcycle}
                  active={activeId === motorcycle.id}
                  index={index}
                  onPress={() => {
                    setActive(motorcycle.id);
                    router.push(`/motorcycle/${motorcycle.id}`);
                  }}
                />
              </View>
            ))}
          </View>

          <Button icon="plus" mode="contained" onPress={() => router.push('/motorcycle/add')} contentStyle={styles.buttonContent} style={styles.add}>
            Tambah motor
          </Button>
        </>
      ) : (
        <View style={surface}>
          <EmptyState
            icon="garage-open-variant"
            title="Garasi masih kosong"
            description="Tambahkan motor agar odometer, jadwal perawatan, dan pengingat bisa dicatat."
            action="Tambah motor pertama"
            onPress={() => router.push('/motorcycle/add')}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  surface: { borderWidth: 1, borderRadius: RADII.card, padding: SPACING.lg },
  summary: { minHeight: 152, flexDirection: 'row', alignItems: 'center', gap: SPACING.xl, padding: SPACING.xxl, borderRadius: RADII.featured },
  summaryCopy: { flex: 1, minWidth: 0 },
  summaryTitle: { marginTop: SPACING.sm, marginBottom: SPACING.xs },
  summaryIcon: { width: 64, height: 64, borderRadius: RADII.card, alignItems: 'center', justifyContent: 'center' },
  list: { width: '100%' },
  listWide: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.lg },
  item: { minWidth: 0 },
  itemWide: { flexGrow: 1, flexBasis: '48%', minWidth: 280 },
  buttonContent: { minHeight: SPACING.touch },
  add: { marginTop: SPACING.xs, alignSelf: 'flex-start' },
});
