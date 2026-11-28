import { describe, expect, it } from 'vitest';
import type { RemoteMotorcycle } from '@/src/auth/contracts';
import { currentMembershipRole } from '@/src/domain/shared-motorcycle';

describe('shared motorcycle membership', () => {
  it('uses the authenticated account membership returned by the motorcycle list', () => {
    const motorcycle: RemoteMotorcycle = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Motor bersama',
      odometerKm: 1200,
      createdAt: '2030-01-01T00:00:00.000Z',
      updatedAt: '2030-01-01T00:00:00.000Z',
      members: [{ role: 'OWNER' }],
    };

    expect(currentMembershipRole(motorcycle)).toBe('OWNER');
  });
});
