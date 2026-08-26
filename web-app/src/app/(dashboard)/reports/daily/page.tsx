'use client';

import { useEffect, useMemo, useState } from 'react';

import { deliveriesApi, tripsApi, vehiclesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { Delivery, Trip, Vehicle } from '@/types';

function toDateInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function isWithinRange(isoDate: string, from: Date, to: Date) {
  const date = new Date(isoDate);
  return date >= from && date <= to;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell);
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(','),
    )
    .join('\r\n');

  // ใส่ BOM ให้ Excel เปิดภาษาไทยได้ถูกต้อง
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fromDate, setFromDate] = useState(() => toDateInputValue(new Date()));
  const [toDate, setToDate] = useState(() => toDateInputValue(new Date()));
  const [vehicleId, setVehicleId] = useState<string>('all');

  useEffect(() => {
    Promise.all([tripsApi.list(), deliveriesApi.list(), vehiclesApi.list()]).then(
      ([tripData, deliveryData, vehicleData]) => {
        setTrips(tripData);
        setDeliveries(deliveryData);
        setVehicles(vehicleData);
      },
    );
  }, []);

  const range = useMemo(
    () => ({
      from: new Date(`${fromDate}T00:00:00`),
      to: new Date(`${toDate}T23:59:59.999`),
    }),
    [fromDate, toDate],
  );

  const tripsById = useMemo(() => {
    const map = new Map<number, Trip>();
    trips.forEach((trip) => map.set(trip.id, trip));
    return map;
  }, [trips]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((delivery) => {
      if (!isWithinRange(delivery.deliveredAt, range.from, range.to)) {
        return false;
      }
      if (vehicleId === 'all') return true;
      const trip = tripsById.get(delivery.tripId);
      return trip?.vehicleId === Number(vehicleId);
    });
  }, [deliveries, range, vehicleId, tripsById]);

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

    for (const delivery of filteredDeliveries) {
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
  }, [filteredDeliveries, tripsById]);

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

  const handleExport = () => {
    downloadCsv(`รายงาน-${fromDate}-ถึง-${toDate}.csv`, [
      ['รถ', 'คนขับ', 'จำนวนจุดส่ง', 'น้ำแข็ง (กระสอบ)', 'ยอดขาย (บาท)'],
      ...rows.map((row) => [
        row.vehicleName,
        row.driverName,
        row.deliveryCount,
        row.sacks,
        row.revenue.toFixed(2),
      ]),
      ['รวม', '', totals.deliveryCount, totals.sacks, totals.revenue.toFixed(2)],
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">รายงานผลการดำเนินงาน</h1>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <span className="text-sm text-neutral-400">ถึง</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="all">ทุกคัน</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name} ({vehicle.plate})
              </option>
            ))}
          </select>
          <button
            onClick={handleExport}
            disabled={rows.length === 0}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-40"
          >
            ⬇ Export CSV
          </button>
        </div>
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
                  ไม่มีข้อมูลการส่งของในช่วงที่เลือก
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
