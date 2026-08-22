'use client';

import { useEffect, useMemo, useState } from 'react';

import { deliveriesApi, tripsApi } from '@/lib/api';
import { formatCurrency, isSameDay } from '@/lib/format';
import type { Delivery, Trip } from '@/types';

function toDateInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

export default function DailyReportPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [dateValue, setDateValue] = useState(() =>
    toDateInputValue(new Date()),
  );

  useEffect(() => {
    Promise.all([tripsApi.list(), deliveriesApi.list()]).then(
      ([tripData, deliveryData]) => {
        setTrips(tripData);
        setDeliveries(deliveryData);
      },
    );
  }, []);

  const selectedDay = useMemo(() => new Date(`${dateValue}T00:00:00`), [
    dateValue,
  ]);

  const tripsById = useMemo(() => {
    const map = new Map<number, Trip>();
    trips.forEach((trip) => map.set(trip.id, trip));
    return map;
  }, [trips]);

  const dayDeliveries = useMemo(
    () => deliveries.filter((d) => isSameDay(d.deliveredAt, selectedDay)),
    [deliveries, selectedDay],
  );

  const rows = useMemo(() => {
    const grouped = new Map<
      string,
      {
        vehicleName: string;
        driverName: string;
        sacks: number;
        revenue: number;
        deliveryCount: number;
      }
    >();

    for (const delivery of dayDeliveries) {
      const trip = tripsById.get(delivery.tripId);
      if (!trip) continue;

      const key = `${trip.vehicleId}-${trip.driverId}`;
      const current = grouped.get(key) ?? {
        vehicleName: `${trip.vehicle.name} (${trip.vehicle.plate})`,
        driverName: trip.driver.name,
        sacks: 0,
        revenue: 0,
        deliveryCount: 0,
      };

      current.revenue += Number(delivery.totalAmount);
      current.sacks += delivery.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      current.deliveryCount += 1;

      grouped.set(key, current);
    }

    return Array.from(grouped.values()).sort((a, b) => b.revenue - a.revenue);
  }, [dayDeliveries, tripsById]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          sacks: acc.sacks + row.sacks,
          revenue: acc.revenue + row.revenue,
          deliveryCount: acc.deliveryCount + row.deliveryCount,
        }),
        { sacks: 0, revenue: 0, deliveryCount: 0 },
      ),
    [rows],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">สรุปผลประจำวัน</h1>

        <input
          type="date"
          value={dateValue}
          onChange={(e) => setDateValue(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">จำนวนจุดส่ง</p>
          <p className="mt-1 text-2xl font-bold">{totals.deliveryCount}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">น้ำแข็งที่ส่งรวม</p>
          <p className="mt-1 text-2xl font-bold">{totals.sacks} กระสอบ</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">ยอดขายรวม</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {formatCurrency(totals.revenue)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500">
            <tr>
              <th className="px-4 py-3">รถ</th>
              <th className="px-4 py-3">คนขับ</th>
              <th className="px-4 py-3">จำนวนจุดส่ง</th>
              <th className="px-4 py-3">น้ำแข็ง (กระสอบ)</th>
              <th className="px-4 py-3">ยอดขาย</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.vehicleName}-${row.driverName}`}
                className="border-b border-neutral-100 last:border-0"
              >
                <td className="px-4 py-3 font-medium">{row.vehicleName}</td>
                <td className="px-4 py-3">{row.driverName}</td>
                <td className="px-4 py-3">{row.deliveryCount}</td>
                <td className="px-4 py-3">{row.sacks}</td>
                <td className="px-4 py-3 font-medium text-emerald-700">
                  {formatCurrency(row.revenue)}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                  ไม่มีข้อมูลการส่งของในวันที่เลือก
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
