'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import {
  customersApi,
  deliveriesApi,
  getErrorMessage,
  tripsApi,
  tripStopsApi,
} from '@/lib/api';
import { formatCurrency, TRIP_STATUS_COLOR, TRIP_STATUS_LABEL } from '@/lib/format';
import type { Customer, Delivery, Trip, TripStop } from '@/types';

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const tripId = Number(params.id);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stops, setStops] = useState<TripStop[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadStops = useCallback(
    () => tripStopsApi.listByTrip(tripId).then(setStops),
    [tripId],
  );

  useEffect(() => {
    Promise.all([
      tripsApi.get(tripId),
      deliveriesApi.list(),
      customersApi.list(),
    ]).then(([tripData, allDeliveries, customerList]) => {
      setTrip(tripData);
      setDeliveries(allDeliveries.filter((d) => d.tripId === tripId));
      setCustomers(customerList);
    });

    loadStops();
  }, [tripId, loadStops]);

  const assignedCustomerIds = useMemo(
    () => new Set(stops.map((s) => s.customerId)),
    [stops],
  );

  const availableCustomers = useMemo(
    () =>
      customers
        .filter((c) => !assignedCustomerIds.has(c.id))
        .sort((a, b) => a.name.localeCompare(b.name, 'th')),
    [customers, assignedCustomerIds],
  );

  const handleAddStop = async () => {
    setError('');

    if (!selectedCustomerId) {
      setError('กรุณาเลือกร้านค้า');
      return;
    }

    try {
      setSubmitting(true);
      await tripStopsApi.create({
        tripId,
        customerId: Number(selectedCustomerId),
        note: note.trim() || undefined,
      });
      setSelectedCustomerId('');
      setNote('');
      await loadStops();
    } catch (err) {
      setError(getErrorMessage(err, 'เพิ่มรายการไม่สำเร็จ'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStop = async (stop: TripStop) => {
    if (!confirm(`ลบรายการ "${stop.customer.name}" ออกจากเที่ยวนี้?`)) return;
    await tripStopsApi.remove(stop.id);
    await loadStops();
  };

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
        <h2 className="mb-3 text-lg font-semibold">
          รายการที่ต้องส่ง (มอบหมายให้คนขับ)
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-neutral-500">
              <tr>
                <th className="px-4 py-3">ร้านค้า</th>
                <th className="px-4 py-3">หมู่บ้าน</th>
                <th className="px-4 py-3">หมายเหตุ</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {stops.map((stop) => (
                <tr
                  key={stop.id}
                  className="border-b border-neutral-100 last:border-0"
                >
                  <td className="px-4 py-3 font-medium">
                    {stop.customer.name}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {stop.customer.village.name} (
                    {stop.customer.village.zone.name})
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {stop.note ?? '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        stop.status === 'DONE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {stop.status === 'DONE' ? 'ส่งแล้ว' : 'ยังไม่ส่ง'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRemoveStop(stop)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}

              {stops.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-neutral-400"
                  >
                    ยังไม่ได้มอบหมายร้านค้าให้เที่ยวนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-2 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="min-w-[220px]">
            <label className="mb-1 block text-xs text-neutral-500">
              ร้านค้า
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">เลือกร้านค้า</option>
              {availableCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} — {customer.village.name} (
                  {customer.village.zone.name})
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-1 block text-xs text-neutral-500">
              หมายเหตุ (ไม่บังคับ)
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ลูกค้าสั่งด่วน"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleAddStop}
            disabled={submitting}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? 'กำลังเพิ่ม...' : '+ เพิ่มรายการ'}
          </button>
          {error && <p className="w-full text-sm text-red-600">{error}</p>}
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
