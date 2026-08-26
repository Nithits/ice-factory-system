'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  customersApi,
  getErrorMessage,
  iceTanksApi,
  villagesApi,
  zonesApi,
} from '@/lib/api';
import { getSocket } from '@/lib/socket';
import type { Customer, TankStatus, Village, Zone } from '@/types';

const TANK_STATUS_LABEL: Record<TankStatus, string> = {
  NORMAL: 'ปกติ',
  NEEDS_REPLACEMENT: 'ต้องเปลี่ยน',
};

export default function CustomersPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [newZoneName, setNewZoneName] = useState('');
  const [addingVillageToZone, setAddingVillageToZone] = useState<
    number | null
  >(null);
  const [newVillageName, setNewVillageName] = useState('');
  const [addingCustomerToVillage, setAddingCustomerToVillage] = useState<
    number | null
  >(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(
    null,
  );
  const [customerDetail, setCustomerDetail] = useState<Customer | null>(null);
  const [addingTank, setAddingTank] = useState(false);
  const [newTank, setNewTank] = useState({ size: '', quantity: '1' });

  const load = async () => {
    const [zoneList, villageList, customerList] = await Promise.all([
      zonesApi.list(),
      villagesApi.list(),
      customersApi.list(),
    ]);
    setZones(zoneList);
    setVillages(villageList);
    setCustomers(customerList);
  };

  useEffect(() => {
    // load() is also called from mutation handlers below (add/delete),
    // so it stays a shared component function rather than living only
    // inside this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();

    const socket = getSocket();
    const onCustomerAdded = () => load();
    const onTankUpdated = () => {
      load();
      if (expandedCustomerId) {
        customersApi.get(expandedCustomerId).then(setCustomerDetail);
      }
    };

    socket.on('customer-added', onCustomerAdded);
    socket.on('tank-updated', onTankUpdated);
    return () => {
      socket.off('customer-added', onCustomerAdded);
      socket.off('tank-updated', onTankUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const villagesByZone = useMemo(() => {
    const map = new Map<number, Village[]>();
    for (const village of villages) {
      const list = map.get(village.zoneId) ?? [];
      list.push(village);
      map.set(village.zoneId, list);
    }
    return map;
  }, [villages]);

  const customersByVillage = useMemo(() => {
    const map = new Map<number, Customer[]>();
    for (const customer of customers) {
      const list = map.get(customer.villageId) ?? [];
      list.push(customer);
      map.set(customer.villageId, list);
    }
    return map;
  }, [customers]);

  const handleAddZone = async () => {
    if (!newZoneName.trim()) return;
    await zonesApi.create(newZoneName.trim());
    setNewZoneName('');
    load();
  };

  const handleAddVillage = async (zoneId: number) => {
    if (!newVillageName.trim()) return;
    await villagesApi.create({ zoneId, name: newVillageName.trim() });
    setNewVillageName('');
    setAddingVillageToZone(null);
    load();
  };

  const handleAddCustomer = async (villageId: number) => {
    if (!newCustomer.name.trim()) return;
    await customersApi.create({
      villageId,
      name: newCustomer.name.trim(),
      phone: newCustomer.phone.trim() || undefined,
    });
    setNewCustomer({ name: '', phone: '' });
    setAddingCustomerToVillage(null);
    load();
  };

  const toggleCustomer = async (customer: Customer) => {
    if (expandedCustomerId === customer.id) {
      setExpandedCustomerId(null);
      setCustomerDetail(null);
      setAddingTank(false);
      return;
    }

    setExpandedCustomerId(customer.id);
    setAddingTank(false);
    const detail = await customersApi.get(customer.id);
    setCustomerDetail(detail);
  };

  const handleAddTank = async () => {
    if (!expandedCustomerId || !newTank.size.trim()) return;
    await iceTanksApi.create({
      customerId: expandedCustomerId,
      size: newTank.size.trim(),
      quantity: Number(newTank.quantity) || 1,
    });
    setNewTank({ size: '', quantity: '1' });
    setAddingTank(false);
    const detail = await customersApi.get(expandedCustomerId);
    setCustomerDetail(detail);
  };

  const handleToggleTankStatus = async (tankId: number, current: TankStatus) => {
    await iceTanksApi.update(
      tankId,
      current === 'NORMAL' ? 'NEEDS_REPLACEMENT' : 'NORMAL',
    );
    if (expandedCustomerId) {
      const detail = await customersApi.get(expandedCustomerId);
      setCustomerDetail(detail);
    }
  };

  const handleDeleteZone = async (zoneId: number) => {
    if (!confirm('ลบโซนนี้? (ต้องไม่มีหมู่บ้านอยู่ข้างในแล้ว)')) return;
    try {
      await zonesApi.remove(zoneId);
      load();
    } catch (err) {
      alert(getErrorMessage(err, 'ลบไม่สำเร็จ'));
    }
  };

  const handleDeleteVillage = async (villageId: number) => {
    if (!confirm('ลบหมู่บ้านนี้? (ต้องไม่มีร้านค้าอยู่ข้างในแล้ว)')) return;
    try {
      await villagesApi.remove(villageId);
      load();
    } catch (err) {
      alert(getErrorMessage(err, 'ลบไม่สำเร็จ'));
    }
  };

  const handleDeleteCustomer = async (customerId: number) => {
    if (!confirm('ลบร้านค้านี้? ถังน้ำแข็งของร้านจะถูกลบไปด้วย')) return;
    await customersApi.remove(customerId);
    if (expandedCustomerId === customerId) {
      setExpandedCustomerId(null);
      setCustomerDetail(null);
    }
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ร้านค้า / โซน / หมู่บ้าน</h1>
      </div>

      <div className="flex gap-2 rounded-2xl border border-neutral-200 bg-white p-4">
        <input
          value={newZoneName}
          onChange={(e) => setNewZoneName(e.target.value)}
          placeholder="ชื่อโซนใหม่ เช่น โซนเหนือ"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          onClick={handleAddZone}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + เพิ่มโซน
        </button>
      </div>

      {zones.length === 0 && (
        <p className="text-sm text-neutral-400">ยังไม่มีโซนในระบบ เพิ่มโซนแรกด้านบนได้เลย</p>
      )}

      <div className="space-y-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="rounded-2xl border border-neutral-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                {zone.name}{' '}
                <span className="text-sm font-normal text-neutral-400">
                  ({zone._count?.villages ?? 0} หมู่บ้าน)
                </span>
              </h2>
              <div className="flex gap-3 text-sm">
                <button
                  onClick={() =>
                    setAddingVillageToZone(
                      addingVillageToZone === zone.id ? null : zone.id,
                    )
                  }
                  className="font-medium text-neutral-600 hover:underline"
                >
                  + เพิ่มหมู่บ้าน
                </button>
                <button
                  onClick={() => handleDeleteZone(zone.id)}
                  className="font-medium text-red-600 hover:underline"
                >
                  ลบ
                </button>
              </div>
            </div>

            {addingVillageToZone === zone.id && (
              <div className="mt-3 flex gap-2">
                <input
                  value={newVillageName}
                  onChange={(e) => setNewVillageName(e.target.value)}
                  placeholder="ชื่อหมู่บ้าน"
                  className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
                <button
                  onClick={() => handleAddVillage(zone.id)}
                  className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
                >
                  บันทึก
                </button>
              </div>
            )}

            <div className="mt-4 space-y-3 border-l-2 border-neutral-100 pl-4">
              {(villagesByZone.get(zone.id) ?? []).map((village) => (
                <div key={village.id}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-800">
                      {village.name}{' '}
                      <span className="font-normal text-neutral-400">
                        ({customersByVillage.get(village.id)?.length ?? 0} ร้าน)
                      </span>
                    </h3>
                    <div className="flex gap-3 text-xs">
                      <button
                        onClick={() =>
                          setAddingCustomerToVillage(
                            addingCustomerToVillage === village.id
                              ? null
                              : village.id,
                          )
                        }
                        className="font-medium text-neutral-600 hover:underline"
                      >
                        + เพิ่มร้านค้า
                      </button>
                      <button
                        onClick={() => handleDeleteVillage(village.id)}
                        className="font-medium text-red-600 hover:underline"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>

                  {addingCustomerToVillage === village.id && (
                    <div className="mt-2 flex gap-2">
                      <input
                        value={newCustomer.name}
                        onChange={(e) =>
                          setNewCustomer((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="ชื่อร้านค้า"
                        className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
                      />
                      <input
                        value={newCustomer.phone}
                        onChange={(e) =>
                          setNewCustomer((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="เบอร์โทร (ไม่บังคับ)"
                        className="w-40 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
                      />
                      <button
                        onClick={() => handleAddCustomer(village.id)}
                        className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
                      >
                        บันทึก
                      </button>
                    </div>
                  )}

                  <div className="mt-2 space-y-1 border-l-2 border-neutral-100 pl-4">
                    {(customersByVillage.get(village.id) ?? []).map(
                      (customer) => (
                        <div key={customer.id} className="py-1">
                          <div className="flex items-center justify-between text-sm">
                            <button
                              onClick={() => toggleCustomer(customer)}
                              className="text-left font-medium text-neutral-800 hover:underline"
                            >
                              {expandedCustomerId === customer.id ? '▾' : '▸'}{' '}
                              {customer.name}
                              {customer.phone && (
                                <span className="ml-2 text-xs font-normal text-neutral-400">
                                  {customer.phone}
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="text-xs font-medium text-red-600 hover:underline"
                            >
                              ลบ
                            </button>
                          </div>

                          {expandedCustomerId === customer.id && (
                            <div className="mt-2 ml-5 space-y-2 rounded-lg bg-neutral-50 p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-neutral-500">
                                  ถังน้ำแข็งประจำร้าน
                                </span>
                                <button
                                  onClick={() => setAddingTank(!addingTank)}
                                  className="text-xs font-medium text-neutral-600 hover:underline"
                                >
                                  + เพิ่มถัง
                                </button>
                              </div>

                              {addingTank && (
                                <div className="flex gap-2">
                                  <input
                                    value={newTank.size}
                                    onChange={(e) =>
                                      setNewTank((prev) => ({
                                        ...prev,
                                        size: e.target.value,
                                      }))
                                    }
                                    placeholder="ขนาด เช่น ใหญ่/เล็ก"
                                    className="flex-1 rounded-lg border border-neutral-300 px-2 py-1 text-xs"
                                  />
                                  <input
                                    type="number"
                                    min={1}
                                    value={newTank.quantity}
                                    onChange={(e) =>
                                      setNewTank((prev) => ({
                                        ...prev,
                                        quantity: e.target.value,
                                      }))
                                    }
                                    className="w-16 rounded-lg border border-neutral-300 px-2 py-1 text-xs"
                                  />
                                  <button
                                    onClick={handleAddTank}
                                    className="rounded-lg bg-neutral-900 px-2 py-1 text-xs font-medium text-white"
                                  >
                                    บันทึก
                                  </button>
                                </div>
                              )}

                              {customerDetail?.id === customer.id &&
                              (customerDetail.iceTanks?.length ?? 0) > 0 ? (
                                <ul className="space-y-1">
                                  {customerDetail.iceTanks!.map((tank) => (
                                    <li
                                      key={tank.id}
                                      className="flex items-center justify-between text-xs"
                                    >
                                      <span>
                                        ถัง{tank.size} × {tank.quantity}
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleToggleTankStatus(
                                            tank.id,
                                            tank.status,
                                          )
                                        }
                                        className={`rounded-full px-2 py-0.5 font-medium ${
                                          tank.status === 'NORMAL'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-amber-100 text-amber-700'
                                        }`}
                                      >
                                        {TANK_STATUS_LABEL[tank.status]}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-neutral-400">
                                  ยังไม่มีถังบันทึกไว้
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
