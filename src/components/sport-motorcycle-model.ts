export type SportMotorcycleMaterial = 'body' | 'frame' | 'rubber' | 'metal' | 'glass';

type Vertex3 = readonly [x: number, y: number, z: number];

type MeshPanel = {
  readonly from: Vertex3;
  readonly to: Vertex3;
  readonly thickness: number;
  readonly halfWidth: number;
  readonly material: SportMotorcycleMaterial;
};

type MeshDisc = {
  readonly center: Vertex3;
  readonly radius: number;
  readonly material: SportMotorcycleMaterial;
  readonly layer: number;
};

export type ProjectedMotorcycleFace = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly angle: number;
  readonly depth: number;
  readonly material: SportMotorcycleMaterial;
  readonly tone: number;
  readonly round: boolean;
};

type ProjectionOptions = {
  readonly yaw: number;
  readonly width: number;
  readonly height: number;
};

const CAMERA_DISTANCE = 7;
const FOCAL_LENGTH = 6;

type ProjectedPoint = {
  readonly x: number;
  readonly y: number;
  readonly depth: number;
  readonly pixelScale: number;
};

type FaceInput = {
  readonly from: ProjectedPoint;
  readonly to: ProjectedPoint;
  readonly thickness: number;
  readonly material: SportMotorcycleMaterial;
  readonly tone: number;
};

const MOTORCYCLE_PANELS: readonly MeshPanel[] = [
  { from: [-1.42, 0.54, 0], to: [-0.5, 0.58, 0], thickness: 0.26, halfWidth: 0.34, material: 'body' },
  { from: [-1.22, 0.72, 0], to: [-0.43, 0.67, 0], thickness: 0.16, halfWidth: 0.32, material: 'rubber' },
  { from: [-0.56, 0.48, 0], to: [0.18, 0.58, 0], thickness: 0.62, halfWidth: 0.46, material: 'body' },
  { from: [0.08, 0.38, 0], to: [0.82, 0.18, 0], thickness: 0.54, halfWidth: 0.44, material: 'body' },
  { from: [0.68, 0.36, 0], to: [1.2, 0.27, 0], thickness: 0.34, halfWidth: 0.36, material: 'body' },
  { from: [-0.3, -0.08, 0], to: [0.62, -0.1, 0], thickness: 0.4, halfWidth: 0.36, material: 'body' },
  { from: [0.62, 0.72, 0], to: [0.94, 1.04, 0], thickness: 0.12, halfWidth: 0.3, material: 'glass' },
  { from: [-0.44, -0.18, 0], to: [0.28, -0.18, 0], thickness: 0.56, halfWidth: 0.28, material: 'frame' },
  { from: [-1.35, -0.62, 0], to: [-0.14, -0.15, 0], thickness: 0.12, halfWidth: 0.22, material: 'frame' },
  { from: [-0.14, -0.15, 0], to: [-0.48, 0.48, 0], thickness: 0.12, halfWidth: 0.22, material: 'frame' },
  { from: [1.35, -0.62, 0], to: [0.78, 0.52, 0], thickness: 0.12, halfWidth: 0.2, material: 'metal' },
  { from: [-0.4, -0.43, 0], to: [-1.12, -0.45, 0], thickness: 0.18, halfWidth: 0.3, material: 'metal' },
  { from: [0.76, 0.78, -0.58], to: [0.76, 0.78, 0.58], thickness: 0.08, halfWidth: 0.04, material: 'metal' },
];

function buildWheelDiscs(centerX: number): readonly MeshDisc[] {
  const discs: MeshDisc[] = [];
  for (const z of [-0.2, 0.2]) {
    discs.push(
      { center: [centerX, -0.62, z], radius: 0.64, material: 'rubber', layer: 0 },
      { center: [centerX, -0.62, z], radius: 0.4, material: 'metal', layer: 1 },
      { center: [centerX, -0.62, z], radius: 0.11, material: 'frame', layer: 2 },
    );
  }
  return discs;
}

const MOTORCYCLE_DISCS = [...buildWheelDiscs(-1.35), ...buildWheelDiscs(1.35)];

function faceBetween({ from, to, thickness, material, tone }: FaceInput): ProjectedMotorcycleFace {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
    width: Math.max(1, Math.hypot(deltaX, deltaY)),
    height: Math.max(1, thickness * (from.pixelScale + to.pixelScale) / 2),
    angle: Math.atan2(deltaY, deltaX) * 180 / Math.PI,
    depth: (from.depth + to.depth) / 2,
    material,
    tone,
    round: false,
  };
}

export function rotateSportMotorcycle(yaw: number, direction: -1 | 1): number {
  const next = yaw + direction * 18;
  return ((next + 180) % 360 + 360) % 360 - 180;
}

export function projectSportMotorcycle({ yaw, width, height }: ProjectionOptions): readonly ProjectedMotorcycleFace[] {
  const radians = yaw * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const scale = Math.min(width / 4.8, height / 3.1);
  const project = ([x, y, z]: Vertex3) => {
    const rotatedX = x * cosine - z * sine;
    const rotatedZ = x * sine + z * cosine;
    const perspective = FOCAL_LENGTH / (CAMERA_DISTANCE - rotatedZ);
    return {
      x: width / 2 + rotatedX * scale * perspective,
      y: height * 0.52 - y * scale * perspective,
      depth: rotatedZ,
      pixelScale: scale * perspective,
    };
  };

  const faces = MOTORCYCLE_PANELS.flatMap((panel): readonly ProjectedMotorcycleFace[] => {
    const negativeFrom = project([panel.from[0], panel.from[1], panel.from[2] - panel.halfWidth]);
    const negativeTo = project([panel.to[0], panel.to[1], panel.to[2] - panel.halfWidth]);
    const positiveFrom = project([panel.from[0], panel.from[1], panel.from[2] + panel.halfWidth]);
    const positiveTo = project([panel.to[0], panel.to[1], panel.to[2] + panel.halfWidth]);
    const negativeDepth = (negativeFrom.depth + negativeTo.depth) / 2;
    const positiveDepth = (positiveFrom.depth + positiveTo.depth) / 2;
    return [
      faceBetween({ from: negativeFrom, to: negativeTo, thickness: panel.thickness, material: panel.material, tone: negativeDepth > positiveDepth ? 0.96 : 0.64 }),
      faceBetween({ from: positiveFrom, to: positiveTo, thickness: panel.thickness, material: panel.material, tone: positiveDepth > negativeDepth ? 0.96 : 0.64 }),
      faceBetween({ from: negativeFrom, to: positiveFrom, thickness: panel.thickness * 0.76, material: panel.material, tone: 0.76 }),
      faceBetween({ from: negativeTo, to: positiveTo, thickness: panel.thickness * 0.76, material: panel.material, tone: 0.84 }),
    ];
  });

  for (const disc of MOTORCYCLE_DISCS) {
    const center = project(disc.center);
    const horizontal = project([disc.center[0] + disc.radius, disc.center[1], disc.center[2]]);
    const vertical = project([disc.center[0], disc.center[1] + disc.radius, disc.center[2]]);
    faces.push({
      x: center.x,
      y: center.y,
      width: Math.max(2, Math.hypot(horizontal.x - center.x, horizontal.y - center.y) * 2),
      height: Math.max(2, Math.hypot(vertical.x - center.x, vertical.y - center.y) * 2),
      angle: Math.atan2(horizontal.y - center.y, horizontal.x - center.x) * 180 / Math.PI,
      depth: center.depth + disc.layer * 0.001,
      material: disc.material,
      tone: Math.max(0.58, Math.min(1, 0.78 + center.depth * 0.06 + disc.layer * 0.05)),
      round: true,
    });
  }

  return faces.sort((left, right) => left.depth - right.depth);
}
