'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!username || !password) {
      setError('กรุณากรอก Username และ Password');
      return;
    }

    try {
      setLoading(true);
      const user = await login(username, password);

      if (user.role === 'DRIVER') {
        setError('บัญชีนี้เป็นบัญชีคนขับรถ กรุณาใช้แอปมือถือ');
        return;
      }

      router.replace('/');
    } catch {
      setError('Username หรือ Password ไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold">Ice Delivery</h1>
          <p className="mt-1 text-sm text-neutral-500">
            แดชบอร์ดโรงงานน้ำแข็ง
          </p>
        </div>

        <div className="space-y-3">
          <input
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            placeholder="Username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            placeholder="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-60"
        >
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  );
}
