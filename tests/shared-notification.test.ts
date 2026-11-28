import { describe, expect, it } from 'vitest';
import type { RemoteMotorcycle } from '@/src/auth/contracts';
import { authorizeSharedNotification, parseSharedNotification } from '@/src/domain/shared-notification';

const motorcycle: RemoteMotorcycle = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Motor bersama',
  odometerKm: 1200,
  createdAt: '2030-01-01T00:00:00.000Z',
  updatedAt: '2030-01-01T00:00:00.000Z',
  members: [{ role: 'EDITOR' }],
};

describe('shared report notification', () => {
  it('routes only a valid payload authorized by the current motorcycle list', () => {
    const target = parseSharedNotification({
      motorcycleId: motorcycle.id,
      reportId: '22222222-2222-4222-8222-222222222222',
    });

    expect(target).not.toBeNull();
    if (!target) return;
    expect(authorizeSharedNotification(target, [motorcycle])).toEqual(target);
    expect(authorizeSharedNotification(target, [])).toBeNull();
  });

  it('rejects malformed and expanded payloads instead of trusting navigation data', () => {
    expect(parseSharedNotification({ motorcycleId: motorcycle.id })).toBeNull();
    expect(parseSharedNotification({ motorcycleId: 'not-an-id', reportId: 'also-not-an-id' })).toBeNull();
    expect(parseSharedNotification({ motorcycleId: motorcycle.id, reportId: '22222222-2222-4222-8222-222222222222', url: '/settings' })).toBeNull();
  });
});
