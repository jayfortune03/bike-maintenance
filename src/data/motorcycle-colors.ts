export const MOTORCYCLE_COLORS = [
  { name: 'Biru', value: '#2563EB' },
  { name: 'Merah', value: '#DC2626' },
  { name: 'Hitam', value: '#334155' },
  { name: 'Putih', value: '#CBD5E1' },
  { name: 'Hijau', value: '#16A34A' },
  { name: 'Kuning', value: '#CA8A04' },
  { name: 'Abu-abu', value: '#64748B' },
  { name: 'Perak', value: '#94A3B8' },
  { name: 'Jingga', value: '#EA580C' },
  { name: 'Ungu', value: '#7C3AED' },
  { name: 'Merah muda', value: '#DB2777' },
  { name: 'Cokelat', value: '#92400E' },
  { name: 'Toska', value: '#0F766E' },
  { name: 'Marun', value: '#9F1239' },
  { name: 'Navy', value: '#1E3A8A' },
] as const;

export type MotorcycleColor = (typeof MOTORCYCLE_COLORS)[number];
