import type { MaintenanceRule, Motorcycle, Reminder } from './types';
import { oilReminderPlan } from './oil-reminder';

export function notificationTarget(data: Record<string, unknown>, state: { reminders: Reminder[]; motorcycles: Motorcycle[]; maintenanceRules: MaintenanceRule[]; preferences?: { oilReminders?: Record<string, { enabled: boolean }> } }) {
  if (typeof data.reminderId === 'string') {
    const reminder = state.reminders.find((item) => item.id === data.reminderId);
    if (!reminder || reminder.completed) return null;
    const motorcycle = state.motorcycles.find((item) => item.id === reminder.motorcycleId);
    if (reminder.motorcycleId && !motorcycle) return null;
    const rule = state.maintenanceRules.find((item) => item.id === reminder.maintenanceRuleId && item.motorcycleId === reminder.motorcycleId);
    return { motorcycleId: motorcycle?.id, ruleId: rule?.id, reminderId: reminder.id };
  }
  if (typeof data.oilRuleId !== 'string' || typeof data.oilCycle !== 'string') return null;
  if (!state.preferences?.oilReminders?.[data.oilRuleId]?.enabled) return null;
  const rule = state.maintenanceRules.find((item) => item.id === data.oilRuleId && item.type === 'engine-oil' && item.enabled);
  const motorcycle = rule && state.motorcycles.find((item) => item.id === rule.motorcycleId);
  if (!rule || !motorcycle) return null;
  const plan = oilReminderPlan(rule, motorcycle, new Date().toISOString());
  if (!plan || plan.cycle !== data.oilCycle) return null;
  return { motorcycleId: motorcycle.id, ruleId: rule.id, reminderId: undefined };
}
