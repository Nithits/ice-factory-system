import type { TripStatus } from '@/types';

export function formatCurrency(value: string | number) {
  const amount = typeof value === 'string' ? Number(value) : value;

  return `${amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} บาท`;
}

export const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  LOADING: 'กำลังโหลดของ',
  IN_PROGRESS: 'กำลังออกส่ง',
  COMPLETED: 'จบงานแล้ว',
  CANCELLED: 'ยกเลิก',
};

export const TRIP_STATUS_COLOR: Record<TripStatus, string> = {
  LOADING: 'bg-amber-100 text-amber-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-neutral-200 text-neutral-600',
};

export function isToday(isoDate: string) {
  const date = new Date(isoDate);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function isSameDay(isoDate: string, day: Date) {
  const date = new Date(isoDate);

  return (
    date.getFullYear() === day.getFullYear() &&
    date.getMonth() === day.getMonth() &&
    date.getDate() === day.getDate()
  );
}
