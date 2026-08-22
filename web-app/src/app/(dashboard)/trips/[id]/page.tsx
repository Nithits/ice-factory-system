'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { deliveriesApi, tripsApi } from '@/lib/api';
import { formatCurrency, TRIP_STATUS_COLOR, TRIP_STATUS_LABEL } from '@/lib/format';
import type { Delivery, Trip } from '@/types';

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => {
    const tripId = Number(params.id);

    Promise.all([tripsApi.get(tripId), deliveriesApi.list()]).then(
      ([tripData, allDeliveries]) => {
        setTrip(tripData);
        setDeliveries(allDeliveries.filter((d) => d.tripId === tripId));
      },
    );
  }, [params.id]);

  if (!trip) {
    return <p className="text-neutral-500">กำลังโหลด...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">
          เที่ยว #{trip.id} · {trip.vehicle.name} ({trip.vehicle.plate})
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          คนขับ: {trip.driver.name}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">สถานะ</p>
          <span
            className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${TRIP_STATUS_COLOR[trip.status]}`}
          >
            {TRIP_STATUS_LABEL[trip.status]}
          </span>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">ยอดขายรวม</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">
            {formatCurrency(trip.totalAmount)}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">จำนวนจุดส่ง</p>
          <p className="mt-1 text-xl font-bold">{deliveries.length}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">น้ำแข็งที่โหลดขึ้นรถ</h2>
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-neutral-500">
              <tr>
                <th className="px-4 py-3">สินค้า</th>
                <th className="px-4 py-3">โหลดขึ้นรถ</th>
                <th className="px-4 py-3">ส่งแล้ว</th>
                <th className="px-4 py-3">คงเหลือ</th>
              </tr>
            </thead>
            <tbody>
              {trip.items.map((item) => (
                <tr key={item.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">{item.iceProduct.name}</td>
                  <td className="px-4 py-3">
                    {item.loadedQuantity} {item.iceProduct.unit}
                  </td>
                  <td className="px-4 py-3">{item.deliveredQuantity}</td>
                  <td className="px-4 py-3">{item.remainingQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">ประวัติการส่งของ</h2>
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-neutral-500">
              <tr>
                <th className="px-4 py-3">ลูกค้า</th>
                <th className="px-4 py-3">หมู่บ้าน</th>
                <th className="px-4 py-3">เวลา</th>
                <th className="px-4 py-3">ยอดเงิน</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((delivery) => (
                <tr key={delivery.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">{delivery.customerName ?? '-'}</td>
                  <td className="px-4 py-3">{delivery.village ?? '-'}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(delivery.deliveredAt).toLocaleTimeString('th-TH')}
                  </td>
                  <td className="px-4 py-3 font-medium text-emerald-700">
                    {formatCurrency(delivery.totalAmount)}
                  </td>
                </tr>
              ))}

              {deliveries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-neutral-400">
                    ยังไม่มีการส่งของ
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
