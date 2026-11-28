import type { RemoteMotorcycle, RemoteMotorcycleRole } from '@/src/auth/contracts';

export function currentMembershipRole(motorcycle: RemoteMotorcycle): RemoteMotorcycleRole | undefined {
  return motorcycle.members[0]?.role;
}
