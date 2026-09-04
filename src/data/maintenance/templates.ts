import type { MaintenanceRule, MaintenanceSource, MaintenanceType, MotorcycleType } from '@/src/domain/types';

interface TemplateRule {
  type: MaintenanceType;
  title: string;
  intervalKm?: number;
  intervalDays?: number;
  sourceType: MaintenanceSource;
  sourceLabel: string;
  description?: string;
}

const scooter: TemplateRule[] = [
  { type: 'engine-oil', title: 'Ganti oli mesin', intervalKm: 2500, intervalDays: 90, sourceType: 'generic', sourceLabel: 'Rekomendasi umum' },
  { type: 'gear-oil', title: 'Ganti oli gardan', intervalKm: 9000, intervalDays: 180, sourceType: 'generic', sourceLabel: 'Rekomendasi umum' },
  { type: 'general-service', title: 'Servis umum', intervalKm: 4000, intervalDays: 120, sourceType: 'generic', sourceLabel: 'Rekomendasi umum' },
  { type: 'tire-pressure', title: 'Cek tekanan ban', intervalDays: 30, sourceType: 'generic', sourceLabel: 'Rekomendasi umum', description: 'Gunakan tekanan yang tertera di motor atau buku manual.' },
  { type: 'brake', title: 'Cek rem', intervalDays: 30, sourceType: 'generic', sourceLabel: 'Rekomendasi umum' },
  { type: 'battery', title: 'Cek aki', intervalDays: 30, sourceType: 'generic', sourceLabel: 'Rekomendasi umum' },
  { type: 'cvt', title: 'Cek CVT', intervalKm: 5000, sourceType: 'generic', sourceLabel: 'Rekomendasi umum' },
];

const manual: TemplateRule[] = [
  { type: 'engine-oil', title: 'Ganti oli mesin', intervalKm: 2500, intervalDays: 90, sourceType: 'generic', sourceLabel: 'Rekomendasi umum' },
  { type: 'general-service', title: 'Servis umum', intervalKm: 4000, intervalDays: 120, sourceType: 'generic', sourceLabel: 'Rekomendasi umum' },
  { type: 'tire-pressure', title: 'Cek tekanan ban', intervalDays: 30, sourceType: 'generic', sourceLabel: 'Rekomendasi umum', description: 'Gunakan tekanan yang tertera di motor atau buku manual.' },
  { type: 'brake', title: 'Cek rem', intervalDays: 30, sourceType: 'generic', sourceLabel: 'Rekomendasi umum' },
  { type: 'battery', title: 'Cek aki', intervalDays: 30, sourceType: 'generic', sourceLabel: 'Rekomendasi umum' },
  { type: 'drive-chain', title: 'Cek rantai', intervalDays: 30, sourceType: 'generic', sourceLabel: 'Rekomendasi umum' },
];

const modelTemplates: Record<string, TemplateRule[]> = {
  'yamaha:nmax': scooter,
  'honda:vario 160': scooter,
};

export function getTemplateRules(brand: string, model: string, type: MotorcycleType): TemplateRule[] {
  return modelTemplates[`${brand.toLowerCase()}:${model.toLowerCase()}`] ?? (type === 'scooter' ? scooter : manual);
}

export function createRulesForMotorcycle(motorcycleId: string, brand: string, model: string, type: MotorcycleType, now = new Date().toISOString()): MaintenanceRule[] {
  return getTemplateRules(brand, model, type).map((template) => ({
    ...template,
    id: `${motorcycleId}-${template.type}`,
    motorcycleId,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  }));
}
