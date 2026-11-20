import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, HelperText, Text, useTheme } from 'react-native-paper';
import { accentColors } from '@/src/theme/accent';
import { CARD_SHADOW, RADII, SPACING } from '@/src/theme/theme';
import type { ProjectedMotorcycleFace, SportMotorcycleMaterial } from './sport-motorcycle-model';

type ModelModule = typeof import('./sport-motorcycle-model');
const DEFAULT_YAW = 30;

type PreviewState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly model: ModelModule }
  | { readonly kind: 'error' };

type RotationControlProps = {
  readonly icon: keyof typeof MaterialCommunityIcons.glyphMap;
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
};

function RotationControl({ icon, label, onPress, disabled = false }: RotationControlProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        { backgroundColor: theme.colors.surfaceVariant, opacity: disabled ? 0.42 : pressed ? 0.72 : 1 },
      ]}
    >
      <MaterialCommunityIcons accessible={false} name={icon} size={22} color={theme.colors.onSurfaceVariant} />
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
    </Pressable>
  );
}

function MotorcycleMesh({ faces, color }: { readonly faces: readonly ProjectedMotorcycleFace[]; readonly color: string }) {
  const theme = useTheme();
  const palette = accentColors(color, theme.dark);
  const materialColors: Record<SportMotorcycleMaterial, string> = {
    body: palette.primary,
    frame: theme.colors.onSurfaceVariant,
    rubber: theme.colors.onSurface,
    metal: theme.colors.outline,
    glass: palette.primaryContainer,
  };

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Ilustrasi tiga dimensi motor sport"
      importantForAccessibility="yes"
      style={StyleSheet.absoluteFill}
    >
      {faces.map((face, index) => (
        <View
          key={`${index}-${face.material}`}
          accessible={false}
          importantForAccessibility="no"
          style={{
            position: 'absolute',
            left: face.x - face.width / 2,
            top: face.y - face.height / 2,
            width: face.width,
            height: face.height,
            borderRadius: face.round ? Math.min(face.width, face.height) / 2 : Math.min(SPACING.xs, face.height / 4),
            backgroundColor: materialColors[face.material],
            opacity: face.tone,
            transform: [{ rotate: `${face.angle}deg` }],
          }}
        />
      ))}
    </View>
  );
}

export function SportMotorcyclePreview({ color }: { readonly color: string }) {
  const theme = useTheme();
  const requestId = useRef(0);
  const [preview, setPreview] = useState<PreviewState>({ kind: 'idle' });
  const [yaw, setYaw] = useState(DEFAULT_YAW);
  const [width, setWidth] = useState(0);

  useEffect(() => () => { requestId.current += 1; }, []);

  const openPreview = () => {
    const currentRequest = ++requestId.current;
    setPreview({ kind: 'loading' });
    void import('./sport-motorcycle-model').then(
      (model) => {
        if (requestId.current === currentRequest) setPreview({ kind: 'ready', model });
      },
      () => {
        if (requestId.current === currentRequest) setPreview({ kind: 'error' });
      },
    );
  };
  const closePreview = () => {
    requestId.current += 1;
    setYaw(DEFAULT_YAW);
    setPreview({ kind: 'idle' });
  };

  const faces = preview.kind === 'ready' && width > 0
    ? preview.model.projectSportMotorcycle({ yaw, width, height: 240 })
    : [];

  return (
    <View style={[styles.card, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      <View style={styles.heading}>
        <View style={[styles.iconWell, { backgroundColor: theme.colors.primaryContainer }]}>
          <MaterialCommunityIcons accessible={false} name="rotate-3d-variant" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.headingCopy}>
          <Text variant="titleMedium" style={styles.title}>Pratinjau motor sport 3D</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Ilustrasi generik 3D, bukan model atau merek tertentu.
          </Text>
        </View>
      </View>

      {preview.kind === 'idle' ? (
        <Button mode="contained-tonal" icon="cube-scan" onPress={openPreview} contentStyle={styles.primaryAction}>
          Muat pratinjau 3D
        </Button>
      ) : null}

      {preview.kind === 'loading' ? (
        <View style={styles.status} accessibilityLiveRegion="polite">
          <Button loading disabled mode="contained-tonal" contentStyle={styles.primaryAction}>Memuat model 3D</Button>
          <Button onPress={closePreview}>Batalkan</Button>
        </View>
      ) : null}

      {preview.kind === 'error' ? (
        <View style={styles.status}>
          <HelperText type="error" visible accessibilityLiveRegion="polite" style={styles.errorText}>
            Model 3D tidak dapat dimuat. Tidak ada gambar pengganti yang ditampilkan.
          </HelperText>
          <View style={styles.errorActions}>
            <Button mode="contained-tonal" onPress={openPreview}>Coba lagi</Button>
            <Button onPress={closePreview}>Tutup</Button>
          </View>
        </View>
      ) : null}

      {preview.kind === 'ready' ? (
        <View>
          <View
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
            style={[styles.viewport, { backgroundColor: theme.colors.surfaceVariant }]}
          >
            <View style={[styles.ground, { backgroundColor: theme.colors.onSurface, opacity: theme.dark ? 0.16 : 0.08 }]} />
            <MotorcycleMesh faces={faces} color={color} />
          </View>
          <Text accessibilityLiveRegion="polite" variant="bodySmall" style={[styles.angle, { color: theme.colors.onSurfaceVariant }]}>
            Sudut tampilan {yaw} derajat
          </Text>
          <View style={styles.controls}>
            <RotationControl icon="rotate-left" label="Putar kiri" onPress={() => setYaw(preview.model.rotateSportMotorcycle(yaw, -1))} />
            <RotationControl icon="restore" label="Atur ulang" disabled={yaw === DEFAULT_YAW} onPress={() => setYaw(DEFAULT_YAW)} />
            <RotationControl icon="rotate-right" label="Putar kanan" onPress={() => setYaw(preview.model.rotateSportMotorcycle(yaw, 1))} />
          </View>
          <Button icon="close" onPress={closePreview} contentStyle={styles.primaryAction}>Tutup model 3D</Button>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: RADII.card, padding: SPACING.lg, gap: SPACING.lg },
  heading: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  headingCopy: { flex: 1, minWidth: 0, gap: SPACING.xs },
  title: { fontWeight: '700' },
  iconWell: { width: SPACING.touch, height: SPACING.touch, borderRadius: RADII.control, alignItems: 'center', justifyContent: 'center' },
  primaryAction: { minHeight: SPACING.touch },
  status: { gap: SPACING.sm },
  errorText: { paddingHorizontal: 0 },
  errorActions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  viewport: { height: 240, borderRadius: RADII.compact, overflow: 'hidden' },
  ground: { position: 'absolute', left: '12%', right: '12%', bottom: SPACING.section, height: SPACING.md, borderRadius: RADII.badge, transform: [{ scaleY: 0.45 }] },
  angle: { textAlign: 'center', marginTop: SPACING.sm },
  controls: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: SPACING.sm, marginVertical: SPACING.sm },
  control: { minWidth: 88, minHeight: SPACING.touch, borderRadius: RADII.control, paddingHorizontal: SPACING.sm, alignItems: 'center', justifyContent: 'center', gap: 2 },
});
