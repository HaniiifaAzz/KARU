'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Halaman Peta Geofencing telah digabungkan ke dalam menu WorkSpace.
 * Menggunakan client-side redirect agar tidak conflict dengan router initialization.
 */
export default function GeofencingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/workspace');
  }, [router]);

  // Tampilkan loading state sementara menunggu redirect
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-4xl text-emerald-400 animate-spin">refresh</span>
        <p className="text-sm font-semibold text-slate-500">Mengalihkan ke WorkSpace...</p>
      </div>
    </div>
  );
}
