import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { oilReminderPlan } from '@/src/domain/oil-reminder';
import type { MaintenanceRule, Motorcycle, OilReminderPreference } from '@/src/domain/types';

const channelId = 'maintenance-reminders';
const prefix = 'motorcare-oil-';
// ponytail: one global queue is enough for this local single-user app; shard by rule only if scheduling throughput matters.
let operationTail: Promise<void> = Promise.resolve();

type ReconcileInput = {
  readonly rule: MaintenanceRule;
  readonly motorcycle: Motorcycle;
  readonly preference: OilReminderPreference;
  readonly currentDate?: string;
};

type CurrentReconcileInput = {
  readonly ruleId: string;
  readonly current: () => ReconcileInput | undefined;
  readonly commit: (preference: OilReminderPreference | undefined) => void;
};

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const result = operationTail.then(operation, operation);
  operationTail = result.then(() => undefined, () => undefined);
  return result;
}

export const oilReminderNotificationId = (ruleId: string) => `${prefix}${ruleId}`;

async function cancelOilReminderNow(ruleId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const identifier = oilReminderNotificationId(ruleId);
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  if (scheduled.some((request) => request.identifier === identifier)) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }
}

export function cancelOilReminder(ruleId: string): Promise<void> {
  return enqueue(() => cancelOilReminderNow(ruleId));
}

export function cancelOilReminders(ruleIds: readonly string[]): Promise<void> {
  return enqueue(async () => {
    for (const ruleId of ruleIds) await cancelOilReminderNow(ruleId);
  });
}

async function reconcileOilReminderNow(input: ReconcileInput): Promise<OilReminderPreference> {
  const { rule, motorcycle, preference } = input;
  if (Platform.OS === 'web') return { ...preference, error: 'Notifikasi otomatis hanya tersedia di aplikasi Android/iOS.' };
  if (!preference.enabled || !rule.enabled || rule.type !== 'engine-oil') {
    await cancelOilReminderNow(rule.id);
    return { enabled: preference.enabled };
  }
  const permission = await Notifications.getPermissionsAsync();
  const allowed = permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!allowed) return { ...preference, error: permission.canAskAgain ? 'Izin notifikasi belum diberikan.' : 'Notifikasi diblokir di pengaturan perangkat.' };

  const now = input.currentDate ?? new Date().toISOString();
  const plan = oilReminderPlan(rule, motorcycle, now);
  if (!plan) {
    await cancelOilReminderNow(rule.id);
    return { enabled: true };
  }

  const identifier = oilReminderNotificationId(rule.id);
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const existing = scheduled.find((request) => request.identifier === identifier);
  const existingCycle = existing?.content.data?.oilCycle;
  const content = {
    title: 'Waktunya ganti oli',
    body: `${rule.title} untuk ${motorcycle.nickname} sudah jatuh tempo.`,
    sound: 'default' as const,
    data: { oilRuleId: rule.id, motorcycleId: motorcycle.id, oilCycle: plan.cycle },
  };

  const notifyNow = async (delivery: 'time' | 'distance') => {
    if (existing) await Notifications.cancelScheduledNotificationAsync(identifier);
    await Notifications.scheduleNotificationAsync({ identifier, content, trigger: null });
    return { enabled: true, cycle: plan.cycle, delivery } satisfies OilReminderPreference;
  };

  if (plan.timeDue && preference.cycle === plan.cycle && preference.delivery === 'scheduled') {
    return { enabled: true, cycle: plan.cycle, delivery: 'time' };
  }
  if (plan.distanceDue) {
    if (preference.cycle === plan.cycle && (preference.delivery === 'time' || preference.delivery === 'distance')) return { enabled: true, cycle: plan.cycle, delivery: preference.delivery };
    return notifyNow('distance');
  }
  if (plan.timeDue) {
    if (preference.cycle === plan.cycle) return { enabled: true, cycle: plan.cycle, delivery: 'time' };
    return notifyNow('time');
  }
  if (plan.dueDate) {
    if (existing && existingCycle === plan.cycle) return { enabled: true, cycle: plan.cycle, delivery: 'scheduled' };
    if (existing) await Notifications.cancelScheduledNotificationAsync(identifier);
    await Notifications.scheduleNotificationAsync({
      identifier,
      content,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, channelId, date: new Date(plan.dueDate) },
    });
    return { enabled: true, cycle: plan.cycle, delivery: 'scheduled' };
  }
  if (existing) await Notifications.cancelScheduledNotificationAsync(identifier);
  return { enabled: true };
}

export function reconcileOilReminder(input: ReconcileInput): Promise<OilReminderPreference>;
export function reconcileOilReminder(input: CurrentReconcileInput): Promise<OilReminderPreference | undefined>;
export function reconcileOilReminder(input: ReconcileInput | CurrentReconcileInput): Promise<OilReminderPreference | undefined> {
  return enqueue(async () => {
    if ('current' in input) {
      const current = input.current();
      if (!current) {
        await cancelOilReminderNow(input.ruleId);
        input.commit(undefined);
        return undefined;
      }
      const next = await reconcileOilReminderNow(current);
      input.commit(next);
      return next;
    }
    return reconcileOilReminderNow(input);
  });
}
