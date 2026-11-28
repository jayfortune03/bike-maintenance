import * as z from 'zod';
import type { RemoteMotorcycle } from '@/src/auth/contracts';

const sharedNotificationSchema = z.strictObject({
  motorcycleId: z.uuid(),
  reportId: z.uuid(),
}).readonly();

export type SharedNotificationTarget = z.infer<typeof sharedNotificationSchema>;

export function parseSharedNotification(data: Record<string, unknown>): SharedNotificationTarget | null {
  const parsed = sharedNotificationSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export function authorizeSharedNotification(
  target: SharedNotificationTarget,
  motorcycles: readonly RemoteMotorcycle[],
): SharedNotificationTarget | null {
  return motorcycles.some((motorcycle) => motorcycle.id === target.motorcycleId) ? target : null;
}
