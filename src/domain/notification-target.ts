import type { MaintenanceRule, Motorcycle, Reminder } from './types';

export function notificationTarget(data: Record<string, unknown>, state: { reminders: Reminder[]; motorcycles: Motorcycle[]; maintenanceRules: MaintenanceRule[] }) {
  if (typeof data.reminderId !== 'string') return null;
  const reminder = state.reminders.find((item) => item.id === data.reminderId);
  if (!reminder || reminder.completed) return null;
  const motorcycle = state.motorcycles.find((item) => item.id === reminder.motorcycleId);
  if (reminder.motorcycleId && !motorcycle) return null;
  const rule = state.maintenanceRules.find((item) => item.id === reminder.maintenanceRuleId && item.motorcycleId === reminder.motorcycleId);
  return { motorcycleId: motorcycle?.id, ruleId: rule?.id, reminderId: reminder.id };
}
