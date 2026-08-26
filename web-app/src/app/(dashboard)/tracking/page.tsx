'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

import { shiftsApi, trackingApi, tripsApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { TRIP_STATUS_LABEL } from '@/lib/format';
import type { GpsLog, Shift, Trip, VehicleWithLocation } from '@/types';

const VehicleMap = dynamic(() => import('@/components/vehicle-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-neutral-400">
      กำลังโหลดแผนที่...
    </div>
  ),
});

const SHIFT_STATUS_LABEL: Record<Shift['status'], string> = {
  ACTIVE: 'กำลังทำงาน',
  ON_BREAK: 'กำลังพัก',
  ENDED: 'จบกะแล้ว',
};

export default function TrackingPage() {
  const [vehicles, setVehicles] = useState<VehicleWithLocation[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeShifts, setActiveShifts] = useState<Shift[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const load = async () => {
      const [vehicleData, tripData, shiftData] = await Promise.all([
        trackingApi.latestVehicles(),
        tripsApi.list(),
        shiftsApi.findActive(),
      ]);
      setVehicles(vehicleData);
      setTrips(tripData);
      setActiveShifts(shiftData);
    };

    load();
    const interval = setInterval(load, 15000);

    const socket = getSocket();

    const onLocation = (location: GpsLog) => {
      setVehicles((prev) =>
        prev.map((v) => (v.id === location.vehicleId ? { ...v, location } : v)),
      );
    };

    const onTripUpdated = (trip: Trip) => {
      setTrips((prev) => {
        const exists = prev.some((t) => t.id === trip.id);
        return exists
          ? prev.map((t) => (t.id === trip.id ? trip : t))
          : [trip, ...prev];
      });
    };

    const onShiftUpdated = () => {
      shiftsApi.findActive().then(setActiveShifts);
    };

    socket.on('vehicle-location', onLocation);
    socket.on('trip-updated', onTripUpdated);
    socket.on('shift-updated', onShiftUpdated);

    return () => {
      clearInterval(interval);
      socket.off('vehicle-location', onLocation);
      socket.off('trip-updated', onTripUpdated);
      socket.off('shift-updated', onShiftUpdated);
    };
  }, []);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const selectedTrip = trips.find(
    (t) => t.vehicleId === selectedVehicleId && t.status === 'IN_PROGRESS',
  );

  const shiftsByUserId = useMemo(() => {
    const map = new Map<number, Shift>();
    for (const shift of activeShifts) map.set(shift.userId, shift);
    return map;
  }, [activeShifts]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">ติดตามรถเรียลไทม์</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {vehicles.map((vehicle) => {
            const trip = trips.find(
              (t) => t.vehicleId === vehicle.id && t.status === 'IN_PROGRESS',
            );

            return (
              <button
                key={vehicle.id}
                onClick={() => setSelectedVehicleId(vehicle.id)}
                className={`w-full rounded-xl border p-3 text-left text-sm transition ${
                  selectedVehicleId === vehicle.id
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50'
                }`}
              >
                <p className="font-medium">
                  {vehicle.name} ({vehicle.plate})
                </p>
                <p
                  className={
                    selectedVehicleId === vehicle.id
                      ? 'text-neutral-300'
                      : 'text-neutral-500'
                  }
                >
                  {trip ? trip.driver.name : 'ไม่ได้ออกส่ง'}
                </p>
              </button>
            );
          })}

          {vehicles.length === 0 && (
            <p className="text-sm text-neutral-400">ยังไม่มีรถที่ใช้งานอยู่</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="h-[420px] overflow-hidden rounded-2xl border border-neutral-200">
            <VehicleMap vehicles={vehicles} />
          </div>

          {selectedVehicle && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h2 className="text-base font-semibold">
                {selectedVehicle.name} ({selectedVehicle.plate})
              </h2>

              {!selectedTrip && (
                <p className="mt-2 text-sm text-neutral-400">
                  ไม่มีเที่ยวที่กำลังออกส่งอยู่
                </p>
              )}

              {selectedTrip && (
                <div className="mt-3 space-y-3 text-sm">
                  <p className="text-neutral-600">
                    สถานะ: {TRIP_STATUS_LABEL[selectedTrip.status]}
                  </p>

                  <div>
                    <p className="mb-1 font-medium text-neutral-700">
                      ทีมงาน
                    </p>
                    <ul className="space-y-1">
                      {selectedTrip.crew.map((member) => {
                        const shift = shiftsByUserId.get(member.userId);
                        return (
                          <li
                            key={member.userId}
                            className="flex items-center justify-between"
                          >
                            <span>
                              {member.user.name}{' '}
                              <span className="text-xs text-neutral-400">
                                (
                                {member.roleOnTrip === 'DRIVER'
                                  ? 'คนขับหลัก'
                                  : 'ผู้ช่วย'}
                                )
                              </span>
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                shift?.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : shift?.status === 'ON_BREAK'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-neutral-100 text-neutral-500'
                              }`}
                            >
                              {shift
                                ? SHIFT_STATUS_LABEL[shift.status]
                                : 'ยังไม่เข้าเวร'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <p className="text-neutral-500">
                    อัปเดตพิกัดล่าสุด:{' '}
                    {selectedVehicle.location
                      ? new Date(
                          selectedVehicle.location.recordedAt,
                        ).toLocaleTimeString('th-TH')
                      : '-'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
