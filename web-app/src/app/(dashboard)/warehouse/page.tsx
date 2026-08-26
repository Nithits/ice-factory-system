'use client';

import { useEffect, useMemo, useState } from 'react';

import { tripsApi } from '@/lib/api';
import { isSameDay } from '@/lib/format';
import type { Trip } from '@/types';

function toDateInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

export default function WarehousePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [dateValue, setDateValue] = useState(() =>
    toDateInputValue(new Date()),
  );

  useEffect(() => {
    tripsApi.list().then(setTrips);
  }, []);

  const selectedDay = useMemo(() => new Date(`${dateValue}T00:00:00`), [
    dateValue,
  ]);

  const dayTrips = useMemo(
    () => trips.filter((trip) => isSameDay(trip.createdAt, selectedDay)),
    [trips, selectedDay],
  );

  const rows = useMemo(() => {
    const byVehicle = new Map<
      number,
      {
        vehicleName: string;
        loaded: number;
        sold: number;
        remaining: number;
      }
    >();

    for (const trip of dayTrips) {
      const current = byVehicle.get(trip.vehicleId) ?? {
        vehicleName: `${trip.vehicle.name} (${trip.vehicle.plate})`,
        loaded: 0,
        sold: 0,
        remaining: 0,
      };

      for (const item of trip.items) {
        current.loaded += item.loadedQuantity;
        current.sold += item.deliveredQuantity;
        current.remaining += item.remainingQuantity;
      }

      byVehicle.set(trip.vehicleId, current);
    }

    return Array.from(byVehicle.values()).sort(
      (a, b) => b.loaded - a.loaded,
    );
  }, [dayTrips]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          loaded: acc.loaded + row.loaded,
          sold: acc.sold + row.sold,
          remaining: acc.remaining + row.remaining,
        }),
        { loaded: 0, sold: 0, remaining: 0 },
      ),
    [rows],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">คลังสินค้า</h1>

        <input
          type="date"
          value={dateValue}
          onChange={(e) => setDateValue(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">ออกจากโรงงาน</p>
          <p className="mt-1 text-2xl font-bold">{totals.loaded} กระสอบ</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">ขายไปแล้ว</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {totals.sold} กระสอบ
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">คงเหลือบนรถ</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {totals.remaining} กระสอบ
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500">
            <tr>
              <th className="px-4 py-3">รถ</th>
              <th className="px-4 py-3">ออกจากโรงงาน</th>
              <th className="px-4 py-3">ขายไปแล้ว</th>
              <th className="px-4 py-3">คงเหลือ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.vehicleName}
                className="border-b border-neutral-100 last:border-0"
              >
                <td className="px-4 py-3 font-medium">{row.vehicleName}</td>
                <td className="px-4 py-3">{row.loaded}</td>
                <td className="px-4 py-3 text-emerald-700">{row.sold}</td>
                <td className="px-4 py-3 text-amber-700">{row.remaining}</td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-400">
                  ไม่มีเที่ยวรถในวันที่เลือก
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
