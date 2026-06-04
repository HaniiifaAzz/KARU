'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Halaman /register tidak tersedia.
 * Pendaftaran pengguna hanya dilakukan oleh Admin melalui menu "Pengguna & Akses".
 * Redirect otomatis ke halaman login.
 */
export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-surface-container-lowest">
      <div className="flex flex-col items-center gap-3 text-center px-8">
        <span className="material-symbols-outlined text-4xl text-emerald-400 animate-spin">refresh</span>
        <p className="text-sm font-semibold text-slate-500">Mengalihkan ke halaman login...</p>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          Pendaftaran akun hanya dapat dilakukan oleh Administrator sistem.
        </p>
      </div>
    </div>
  );
}
