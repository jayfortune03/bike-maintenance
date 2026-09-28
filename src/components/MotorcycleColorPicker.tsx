import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { MOTORCYCLE_COLORS, type MotorcycleColor } from '@/src/data/motorcycle-colors';
import { contrastTextColor } from '@/src/theme/accent';
import { CARD_SHADOW } from '@/src/theme/theme';

export function MotorcycleColorPicker({ selected, onSelect }: {
  selected: MotorcycleColor;
  onSelect: (color: MotorcycleColor) => void;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.container, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      <Text variant="titleMedium">Warna motor</Text>
      <View style={styles.swatches} accessibilityLabel="Pilihan warna motor">
        {MOTORCYCLE_COLORS.map((color) => {
          const isSelected = selected.value === color.value;
          return (
            <Button
              key={color.value}
              mode={isSelected ? 'contained' : 'outlined'}
              icon={isSelected ? 'check' : undefined}
              accessibilityLabel={`Warna ${color.name}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(color)}
              style={styles.swatch}
              contentStyle={styles.button}
              buttonColor={isSelected ? color.value : undefined}
              textColor={isSelected ? contrastTextColor(color.value) : theme.colors.onSurface}
            >
              {color.name}
            </Button>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, padding: 20, borderRadius: 20, borderWidth: 1 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: { flexGrow: 1, flexBasis: '40%', minWidth: 136 },
  button: { minHeight: 48 },
});
