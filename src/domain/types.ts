export type MotorcycleType = 'scooter' | 'cub' | 'manual' | 'sport' | 'other';

export type MaintenanceType =
  | 'engine-oil'
  | 'gear-oil'
  | 'tire-pressure'
  | 'tire-condition'
  | 'brake'
  | 'brake-fluid'
  | 'air-filter'
  | 'spark-plug'
  | 'battery'
  | 'coolant'
  | 'cvt'
  | 'v-belt'
  | 'drive-chain'
  | 'general-service'
  | 'custom';

export type MaintenanceSource = 'manufacturer' | 'model-template' | 'motorcycle-type' | 'generic' | 'custom';
export type MaintenanceStatus = 'good' | 'soon' | 'due' | 'overdue';

export interface Motorcycle {
  id: string;
  nickname: string;
  brand: string;
  model: string;
  variant?: string;
  year?: number;
  type: MotorcycleType;
  colorName?: string;
  themeColor: string;
  photoUri?: string;
  currentOdometer: number;
  purchaseDate?: string;
  plateNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OdometerLog {
  id: string;
  motorcycleId: string;
  value: number;
  recordedAt: string;
  createdAt: string;
}

export interface MaintenanceRule {
  id: string;
  motorcycleId: string;
  type: MaintenanceType;
  title: string;
  description?: string;
  intervalKm?: number;
  intervalDays?: number;
  lastCompletedKm?: number;
  lastCompletedAt?: string;
  sourceType: MaintenanceSource;
  sourceLabel?: string;
  sourceReference?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceLog {
  id: string;
  motorcycleId: string;
  maintenanceRuleId: string;
  maintenanceType: MaintenanceType;
  title: string;
  completedAt: string;
  odometer?: number;
  cost?: number;
  workshop?: string;
  notes?: string;
  createdAt: string;
}

export type ReminderRepeat = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface Reminder {
  id: string;
  motorcycleId?: string;
  maintenanceRuleId?: string;
  title: string;
  description?: string;
  scheduledAt: string;
  repeat: ReminderRepeat;
  repeatInterval?: number;
  notificationEnabled: boolean;
  notificationId?: string;
  calendarEnabled: boolean;
  calendarEventId?: string;
  calendarId?: string;
  integrationWarning?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ThemeMode = 'system' | 'light' | 'dark';

export interface UserPreferences {
  themeMode: ThemeMode;
  useMotorcycleAccent: boolean;
}

export interface MaintenanceStatusResult {
  status: MaintenanceStatus;
  dueKm?: number;
  dueDate?: string;
  remainingKm?: number;
  remainingDays?: number;
  overdueKm?: number;
  overdueDays?: number;
  primaryTrigger: 'distance' | 'time' | null;
}
