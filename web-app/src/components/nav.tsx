'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth-context';

const LINKS = [
  { href: '/', label: 'ภาพรวม' },
  { href: '/trips', label: 'เที่ยวรถ' },
  { href: '/reports/daily', label: 'สรุปรายวัน' },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <span className="text-lg font-bold">🧊 Ice Delivery</span>

          <nav className="flex gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  pathname === link.href
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-neutral-600">{user?.name}</span>
          <button
            onClick={() => {
              logout();
              router.replace('/login');
            }}
            className="font-medium text-red-600 hover:underline"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </header>
  );
}
