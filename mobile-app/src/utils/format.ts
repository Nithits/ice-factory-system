import type { TripStatus } from '../types';

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
