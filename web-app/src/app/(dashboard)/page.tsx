'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

import { deliveriesApi, trackingApi, tripsApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { formatCurrency, isToday, TRIP_STATUS_LABEL } from '@/lib/format';
import type { Delivery, GpsLog, Trip, VehicleWithLocation } from '@/types';

const VehicleMap = dynamic(() => import('@/components/vehicle-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-neutral-400">
      กำลังโหลดแผนที่...
    </div>
  ),
});

const REFRESH_INTERVAL_MS = 15000;

export default function DashboardPage() {
  const [vehicles, setVehicles] = useState<VehicleWithLocation[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => {
    const load = async () => {
      const [vehicleData, tripData, deliveryData] = await Promise.all([
        trackingApi.latestVehicles(),
        tripsApi.list(),
        deliveriesApi.list(),
      ]);

      setVehicles(vehicleData);
      setTrips(tripData);
      setDeliveries(deliveryData);
    };

    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);

    const socket = getSocket();

    const onLocation = (location: GpsLog) => {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === location.vehicleId ? { ...v, location } : v,
        ),
      );
    };

    const onDeliveryCreated = () => {
      deliveriesApi.list().then(setDeliveries);
    };

    const onTripUpdated = (trip: Trip) => {
      setTrips((prev) => {
        const exists = prev.some((t) => t.id === trip.id);
        return exists
          ? prev.map((t) => (t.id === trip.id ? trip : t))
          : [trip, ...prev];
      });
    };

    socket.on('vehicle-location', onLocation);
    socket.on('delivery-created', onDeliveryCreated);
    socket.on('trip-updated', onTripUpdated);

    return () => {
      clearInterval(interval);
      socket.off('vehicle-location', onLocation);
      socket.off('delivery-created', onDeliveryCreated);
      socket.off('trip-updated', onTripUpdated);
    };
  }, []);

  const tripsById = useMemo(() => {
    const map = new Map<number, Trip>();
    trips.forEach((trip) => map.set(trip.id, trip));
    return map;
  }, [trips]);

  const todayDeliveries = useMemo(
    () => deliveries.filter((d) => isToday(d.deliveredAt)),
    [deliveries],
  );

  const vehicleStats = useMemo(() => {
    const stats = new Map<number, { sacks: number; revenue: number }>();

    for (const delivery of todayDeliveries) {
      const trip = tripsById.get(delivery.tripId);
      if (!trip) continue;

      const current = stats.get(trip.vehicleId) ?? { sacks: 0, revenue: 0 };
      current.revenue += Number(delivery.totalAmount);
      current.sacks += delivery.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      stats.set(trip.vehicleId, current);
    }

    return stats;
  }, [todayDeliveries, tripsById]);

  const activeTrips = trips.filter((t) => t.status === 'IN_PROGRESS');

  const todayTotals = useMemo(() => {
    let sacks = 0;
    let revenue = 0;

    for (const stat of vehicleStats.values()) {
      sacks += stat.sacks;
      revenue += stat.revenue;
    }

    return { sacks, revenue };
  }, [vehicleStats]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="รถที่กำลังออกส่ง" value={`${activeTrips.length} คัน`} />
        <SummaryCard
          label="น้ำแข็งที่ส่งวันนี้"
          value={`${todayTotals.sacks} กระสอบ`}
        />
        <SummaryCard
          label="ยอดขายวันนี้"
          value={formatCurrency(todayTotals.revenue)}
        />
      </div>

      <div className="h-[420px] overflow-hidden rounded-2xl border border-neutral-200">
        <VehicleMap vehicles={vehicles} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">
          รถแต่ละคัน (เรียลไทม์)
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-neutral-500">
              <tr>
                <th className="px-4 py-3">รถ</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">อัปเดตล่าสุด</th>
                <th className="px-4 py-3">ส่งวันนี้ (กระสอบ)</th>
                <th className="px-4 py-3">ยอดขายวันนี้</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => {
                const trip = trips.find(
                  (t) =>
                    t.vehicleId === vehicle.id && t.status === 'IN_PROGRESS',
                );
                const stat = vehicleStats.get(vehicle.id) ?? {
                  sacks: 0,
                  revenue: 0,
                };

                return (
                  <tr
                    key={vehicle.id}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      {vehicle.name} ({vehicle.plate})
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {trip
                        ? `${TRIP_STATUS_LABEL[trip.status]} · ${trip.driver.name}`
                        : 'ไม่ได้ออกส่ง'}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {vehicle.location
                        ? new Date(
                            vehicle.location.recordedAt,
                          ).toLocaleTimeString('th-TH')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">{stat.sacks}</td>
                    <td className="px-4 py-3 font-medium text-emerald-700">
                      {formatCurrency(stat.revenue)}
                    </td>
                  </tr>
                );
              })}

              {vehicles.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-neutral-400"
                  >
                    ยังไม่มีรถที่ใช้งานอยู่
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
