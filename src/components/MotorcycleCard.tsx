import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, useTheme } from 'react-native-paper';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import type { Motorcycle } from '@/src/domain/types';
import { MotorcycleVisual } from '@/src/components/MotorcycleVisual';
import { CARD_SHADOW, RADII, SPACING } from '@/src/theme/theme';

type MotorcycleCardProps = {
  readonly motorcycle: Motorcycle;
  readonly active: boolean;
  readonly onPress: () => void;
  readonly index?: number;
};

export function MotorcycleCard({ motorcycle, active, onPress, index = 0 }: MotorcycleCardProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const titleColor = active ? theme.colors.onPrimaryContainer : theme.colors.onSurface;
  const supportingColor = active ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant;

  return (
    <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(Math.min(index, 5) * 55).duration(260)}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={`${motorcycle.nickname}, ${motorcycle.brand} ${motorcycle.model}, ${motorcycle.currentOdometer.toLocaleString('id-ID')} kilometer${active ? ', motor aktif' : ''}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          CARD_SHADOW,
          {
            backgroundColor: active ? theme.colors.primaryContainer : theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
            opacity: pressed ? 0.82 : 1,
          },
        ]}
      >
        <MotorcycleVisual color={motorcycle.themeColor} photoUri={motorcycle.photoUri} size={64} />
        <View style={styles.copy}>
          <View style={styles.heading}>
            <Text variant="titleMedium" style={[styles.name, { color: titleColor }]}>
              {motorcycle.nickname}
            </Text>
            {active ? (
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={styles.active}
              >
                <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.onPrimaryContainer} />
                <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                  AKTIF
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="bodyMedium" numberOfLines={1} style={{ color: supportingColor }}>
            {motorcycle.brand} {motorcycle.model}
          </Text>
          <View style={styles.meta}>
            <MaterialCommunityIcons name="speedometer" size={16} color={supportingColor} />
            <Text variant="bodySmall" style={{ color: supportingColor }}>
              {motorcycle.currentOdometer.toLocaleString('id-ID')} km
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={supportingColor} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADII.card,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  copy: { flex: 1, minWidth: 0 },
  heading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  name: { flexGrow: 1, flexShrink: 1 },
  active: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.badge,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.sm },
});
