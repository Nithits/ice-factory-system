'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { tripsApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { formatCurrency, TRIP_STATUS_COLOR, TRIP_STATUS_LABEL } from '@/lib/format';
import type { Trip } from '@/types';

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    tripsApi.list().then(setTrips);

    const socket = getSocket();
    const onTripUpdated = (trip: Trip) => {
      setTrips((prev) => {
        const exists = prev.some((t) => t.id === trip.id);
        return exists
          ? prev.map((t) => (t.id === trip.id ? trip : t))
          : [trip, ...prev];
      });
    };

    socket.on('trip-updated', onTripUpdated);
    return () => {
      socket.off('trip-updated', onTripUpdated);
    };
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">เที่ยวรถทั้งหมด</h1>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">รถ</th>
              <th className="px-4 py-3">คนขับ</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3">ยอดขาย</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr
                key={trip.id}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
              >
                <td className="px-4 py-3">
                  <Link href={`/trips/${trip.id}`} className="hover:underline">
                    #{trip.id}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {trip.vehicle.name} ({trip.vehicle.plate})
                </td>
                <td className="px-4 py-3">{trip.driver.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${TRIP_STATUS_COLOR[trip.status]}`}
                  >
                    {TRIP_STATUS_LABEL[trip.status]}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-emerald-700">
                  {formatCurrency(trip.totalAmount)}
                </td>
              </tr>
            ))}

            {trips.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                  ยังไม่มีเที่ยวรถ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
