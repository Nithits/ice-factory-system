'use client';

import { useEffect, useMemo, useState } from 'react';

import { getErrorMessage, shiftsApi, usersApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import type { AuthUser, Shift, UserRole } from '@/types';

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'แอดมิน',
  STAFF: 'พนักงานโรงงาน',
  DRIVER: 'พนักงานขับรถ',
};

const SHIFT_STATUS_LABEL: Record<Shift['status'], string> = {
  ACTIVE: 'กำลังทำงาน',
  ON_BREAK: 'กำลังพัก',
  ENDED: 'จบกะแล้ว',
};

const emptyForm = {
  name: '',
  username: '',
  password: '',
  phone: '',
  role: 'DRIVER' as UserRole,
};

export default function EmployeesPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [activeShifts, setActiveShifts] = useState<Shift[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const [userList, shiftList] = await Promise.all([
      usersApi.list(),
      shiftsApi.findActive(),
    ]);
    setUsers(userList);
    setActiveShifts(shiftList);
  };

  useEffect(() => {
    // load() is also called from handleSubmit below after adding an
    // employee, so it stays a shared component function.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();

    const socket = getSocket();
    const onShiftUpdated = () => shiftsApi.findActive().then(setActiveShifts);
    socket.on('shift-updated', onShiftUpdated);
    return () => {
      socket.off('shift-updated', onShiftUpdated);
    };
  }, []);

  const shiftByUserId = useMemo(() => {
    const map = new Map<number, Shift>();
    for (const shift of activeShifts) map.set(shift.userId, shift);
    return map;
  }, [activeShifts]);

  const handleSubmit = async () => {
    setError('');

    if (!form.name.trim() || !form.username.trim() || !form.password) {
      setError('กรุณากรอกชื่อ, username และ password ให้ครบ');
      return;
    }

    if (form.password.length < 6) {
      setError('password ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    try {
      setSubmitting(true);
      await usersApi.create({
        name: form.name.trim(),
        username: form.username.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        role: form.role,
      });
      setForm(emptyForm);
      setShowAddForm(false);
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'เพิ่มพนักงานไม่สำเร็จ'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">พนักงาน</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          {showAddForm ? 'ยกเลิก' : '+ เพิ่มพนักงาน'}
        </button>
      </div>

      {showAddForm && (
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              placeholder="ชื่อ-นามสกุล"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Password (อย่างน้อย 6 ตัว)"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="เบอร์โทร (ไม่บังคับ)"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <select
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value as UserRole }))
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="DRIVER">พนักงานขับรถ</option>
              <option value="STAFF">พนักงานโรงงาน</option>
              <option value="ADMIN">แอดมิน</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกพนักงานใหม่'}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500">
            <tr>
              <th className="px-4 py-3">ชื่อ</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">บทบาท</th>
              <th className="px-4 py-3">สถานะตอนนี้</th>
              <th className="px-4 py-3">รถที่ประจำอยู่</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const shift = shiftByUserId.get(u.id);
              return (
                <tr
                  key={u.id}
                  className="border-b border-neutral-100 last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-neutral-500">{u.username}</td>
                  <td className="px-4 py-3">{ROLE_LABEL[u.role]}</td>
                  <td className="px-4 py-3">
                    {shift ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          shift.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {SHIFT_STATUS_LABEL[shift.status]}
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">
                        ไม่ได้ทำงาน
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {shift
                      ? `${shift.trip.vehicle.name} (${shift.trip.vehicle.plate})`
                      : '-'}
                  </td>
                </tr>
              );
            })}

            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                  ยังไม่มีพนักงานในระบบ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
