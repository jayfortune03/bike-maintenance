import { describe, expect, it } from 'vitest';
import { projectSportMotorcycle, rotateSportMotorcycle } from '../src/components/sport-motorcycle-model';

describe('sport motorcycle 3D model', () => {
  it('projects finite, depth-sorted filled faces', () => {
    // Given a three-quarter camera angle
    // When the local motorcycle mesh is projected into the preview viewport
    const faces = projectSportMotorcycle({ yaw: 30, width: 360, height: 240 });

    // Then broad shaded surfaces form a complete drawable model from back to front
    expect(faces.length).toBeGreaterThan(40);
    expect(new Set(faces.map(({ material }) => material))).toEqual(new Set(['body', 'frame', 'rubber', 'metal', 'glass']));
    expect(faces.every(({ x, y, width, height, angle, depth, tone }) => [x, y, width, height, angle, depth, tone].every(Number.isFinite) && width > 0 && height > 0 && tone >= 0.58 && tone <= 1)).toBe(true);
    expect(faces.every((face, index) => index === 0 || face.depth >= (faces[index - 1]?.depth ?? face.depth))).toBe(true);
    expect(faces.some(({ material, height }) => material === 'body' && height > 20)).toBe(true);
    expect(faces.some(({ material, round, width, height }) => material === 'rubber' && round && Math.min(width, height) > 40)).toBe(true);
  });

  it('changes the silhouette through a genuine yaw projection', () => {
    // Given side-on and front-on views of the same XYZ mesh
    const side = projectSportMotorcycle({ yaw: 0, width: 360, height: 240 });

    // When the camera yaw turns ninety degrees
    const front = projectSportMotorcycle({ yaw: 90, width: 360, height: 240 });
    const horizontalSpan = (faces: typeof side) => {
      const positions = faces.flatMap(({ x, width }) => [x - width / 2, x + width / 2]);
      return Math.max(...positions) - Math.min(...positions);
    };

    // Then perspective exposes the motorcycle's narrow front instead of rotating a flat image
    expect(horizontalSpan(side)).toBeGreaterThan(horizontalSpan(front) * 2);
    expect(front.at(-1)?.depth).toBeGreaterThan(front[0]?.depth ?? 0);
  });

  it('rotates in discrete steps and wraps without an animation loop', () => {
    // Given a neutral view
    let yaw = 0;

    // When twenty explicit right-rotation actions complete one revolution
    for (let step = 0; step < 20; step += 1) yaw = rotateSportMotorcycle(yaw, 1);

    // Then the view returns exactly to neutral and left rotation remains available
    expect(yaw).toBe(0);
    expect(rotateSportMotorcycle(0, -1)).toBe(-18);
  });
});
