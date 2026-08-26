'use client';

import { useEffect, useState } from 'react';

import {
  getErrorMessage,
  iceProductsApi,
  vehiclesApi,
} from '@/lib/api';
import type { IceProduct, Vehicle, VehicleStatus } from '@/types';

const VEHICLE_STATUS_LABEL: Record<VehicleStatus, string> = {
  ACTIVE: 'พร้อมใช้งาน',
  INACTIVE: 'ไม่ได้ใช้งาน',
  MAINTENANCE: 'ซ่อมบำรุง',
};

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      <h1 className="text-xl font-semibold">ตั้งค่า</h1>
      <IceProductsSection />
      <VehiclesSection />
    </div>
  );
}

function IceProductsSection() {
  const [products, setProducts] = useState<IceProduct[]>([]);
  const [form, setForm] = useState({ name: '', unit: 'กระสอบ', price: '' });
  const [error, setError] = useState('');

  const load = () => iceProductsApi.list().then(setProducts);

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    setError('');
    const price = Number(form.price);

    if (!form.name.trim() || !price || price <= 0) {
      setError('กรุณากรอกชื่อสินค้าและราคาที่ถูกต้อง');
      return;
    }

    try {
      await iceProductsApi.create({
        name: form.name.trim(),
        unit: form.unit.trim() || undefined,
        price,
      });
      setForm({ name: '', unit: 'กระสอบ', price: '' });
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'เพิ่มสินค้าไม่สำเร็จ'));
    }
  };

  const handlePriceCommit = async (product: IceProduct, value: string) => {
    const price = Number(value);
    if (!price || price <= 0 || price === Number(product.price)) return;
    const updated = await iceProductsApi.update(product.id, { price });
    setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
  };

  const handleToggleActive = async (product: IceProduct) => {
    const updated = await iceProductsApi.update(product.id, {
      isActive: !product.isActive,
    });
    setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
  };

  const handleDelete = async (product: IceProduct) => {
    if (!confirm(`ลบสินค้า "${product.name}"?`)) return;
    try {
      await iceProductsApi.remove(product.id);
      load();
    } catch (err) {
      alert(getErrorMessage(err, 'ลบไม่สำเร็จ'));
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">สินค้าน้ำแข็ง & ราคา</h2>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500">
            <tr>
              <th className="px-4 py-3">ชื่อสินค้า</th>
              <th className="px-4 py-3">หน่วย</th>
              <th className="px-4 py-3">ราคา/หน่วย</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-b border-neutral-100 last:border-0"
              >
                <td className="px-4 py-3 font-medium">{product.name}</td>
                <td className="px-4 py-3 text-neutral-500">{product.unit}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    defaultValue={product.price}
                    onBlur={(e) => handlePriceCommit(product, e.target.value)}
                    className="w-24 rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(product)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      product.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {product.isActive ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(product)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                  ยังไม่มีสินค้าน้ำแข็งในระบบ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-neutral-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs text-neutral-500">
            ชื่อสินค้า
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="เช่น น้ำแข็งหลอดใหญ่"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">หน่วย</label>
          <input
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            className="w-28 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">ราคา</label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            className="w-24 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleAdd}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + เพิ่มสินค้า
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </div>
    </section>
  );
}

function VehiclesSection() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({ name: '', plate: '' });
  const [error, setError] = useState('');

  const load = () => vehiclesApi.list().then(setVehicles);

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    setError('');

    if (!form.name.trim() || !form.plate.trim()) {
      setError('กรุณากรอกชื่อรถและทะเบียนรถ');
      return;
    }

    try {
      await vehiclesApi.create({
        name: form.name.trim(),
        plate: form.plate.trim(),
      });
      setForm({ name: '', plate: '' });
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'เพิ่มรถไม่สำเร็จ'));
    }
  };

  const handleStatusChange = async (vehicle: Vehicle, status: VehicleStatus) => {
    const updated = await vehiclesApi.update(vehicle.id, { status });
    setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? updated : v)));
  };

  const handleDelete = async (vehicle: Vehicle) => {
    if (!confirm(`ลบรถ "${vehicle.name}"?`)) return;
    try {
      await vehiclesApi.remove(vehicle.id);
      load();
    } catch (err) {
      alert(getErrorMessage(err, 'ลบไม่สำเร็จ'));
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">รถส่งน้ำแข็ง</h2>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500">
            <tr>
              <th className="px-4 py-3">ชื่อรถ</th>
              <th className="px-4 py-3">ทะเบียน</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr
                key={vehicle.id}
                className="border-b border-neutral-100 last:border-0"
              >
                <td className="px-4 py-3 font-medium">{vehicle.name}</td>
                <td className="px-4 py-3 text-neutral-500">{vehicle.plate}</td>
                <td className="px-4 py-3">
                  <select
                    value={vehicle.status}
                    onChange={(e) =>
                      handleStatusChange(
                        vehicle,
                        e.target.value as VehicleStatus,
                      )
                    }
                    className="rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                  >
                    {Object.entries(VEHICLE_STATUS_LABEL).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(vehicle)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}

            {vehicles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-400">
                  ยังไม่มีรถในระบบ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-neutral-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs text-neutral-500">ชื่อรถ</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="เช่น รถน้ำแข็งคันที่ 3"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">
            ทะเบียนรถ
          </label>
          <input
            value={form.plate}
            onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value }))}
            placeholder="กข 1234"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleAdd}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + เพิ่มรถ
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </div>
    </section>
  );
}
