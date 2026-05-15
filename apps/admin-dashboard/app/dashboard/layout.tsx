"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';
import { getSystemSettingsAction } from '@/app/actions/settings.actions';

// ─────────────────────────────────────────────
// Inner component: uses usePathname safely
// Must be wrapped in <Suspense> by the parent
// ─────────────────────────────────────────────
function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const { data: session } = useSession();

  const currentUser = session?.user;
  const userName = currentUser?.name ?? 'Pengguna';
  const userEmail = currentUser?.email ?? '';
  const userImage = currentUser?.image ?? null;
  const userRole = (currentUser as any)?.role ?? 'pengguna';
  const roleLabels: Record<string, string> = { admin: 'Admin Utama', operator: 'Operator', pengguna: 'Pengguna' };
  const roleLabel = roleLabels[userRole] ?? 'Pengguna';

  // Avatar initials
  const initials = userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  const [isDataMasterOpen, setIsDataMasterOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [timeString, setTimeString] = useState('');
  const [systemSettings, setSystemSettings] = useState<any>(null);

  useEffect(() => {
    async function loadSettings() {
      const res = await getSystemSettingsAction();
      if (res.success) {
        setSystemSettings(res.data);
      }
    }
    loadSettings();
  }, []);

  // Auto-open Data Master section when on those routes
  useEffect(() => {
    if (pathname.includes('/data-master')) {
      setIsDataMasterOpen(true);
    }
  }, [pathname]);

  // Real-time Clock — runs only on client, no hydration mismatch
  useEffect(() => {
    const tick = () => {
      setTimeString(
        new Intl.DateTimeFormat('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).format(new Date())
      );
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Breadcrumbs ──
  let breadcrumbCategory = 'KARU';
  let breadcrumbPage = 'Beranda';

  if (pathname.includes('/data-master')) {
    breadcrumbCategory = 'Data Master';
    if (pathname.includes('/kamus-tanaman')) breadcrumbPage = 'Kamus Tanaman';
    else if (pathname.includes('/kamus-penyakit-hama')) breadcrumbPage = 'Kamus Penyakit & Hama';
    else if (pathname.includes('/sop-penanganan')) breadcrumbPage = 'SOP Penanganan';
    else breadcrumbPage = 'Referensi';
  } else if (pathname.includes('/workspace/buat')) {
    breadcrumbCategory = 'WorkSpace';
    breadcrumbPage = 'Buat Ruang Kerja';
  } else if (pathname.includes('/workspace')) {
    breadcrumbPage = 'Ruang Kerja';
  } else if (pathname.includes('/qr-node')) {
    breadcrumbCategory = 'Aset Fisik';
    breadcrumbPage = 'Aset Node QR';
  } else if (pathname.includes('/reports-ai')) {
    breadcrumbCategory = 'Laporan';
    breadcrumbPage = 'Wawasan AI';
  } else if (pathname.includes('/users-access')) {
    breadcrumbCategory = 'Administrasi';
    breadcrumbPage = 'Pengguna & Akses';
  } else if (pathname.includes('/log-aktivitas')) {
    breadcrumbCategory = 'Administrasi';
    breadcrumbPage = 'Log Aktivitas';
  } else if (pathname.includes('/profile')) {
    breadcrumbCategory = 'Pengguna';
    breadcrumbPage = 'Profil Saya';
  } else if (pathname.includes('/settings')) {
    breadcrumbCategory = 'Administrasi';
    breadcrumbPage = 'Pengaturan Sistem';
  }

  const isActive = (path: string) => pathname === path;
  const isActivePrefix = (prefix: string) => pathname.startsWith(prefix);

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-3 px-4 py-3 transition-all duration-200 ${active
      ? 'text-emerald-300 border-l-4 border-emerald-400 bg-emerald-900/30 font-semibold'
      : 'text-emerald-100/60 hover:text-emerald-50 hover:bg-emerald-900/20'
    }`;

  return (
    <div className="flex h-screen bg-background text-on-surface font-body overflow-hidden">

      {/* ── Sidebar ── */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-emerald-950 dark:bg-slate-950 flex flex-col z-50 overflow-y-auto transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
          }`}
      >
        {/* Logo */}
        <div className="px-5 py-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-[72px] h-[72px] shrink-0 flex items-center justify-center -ml-2">
              <img src={systemSettings?.logoUrl || "/logo-karu.png"} alt="Logo" className="w-full h-full object-contain drop-shadow-lg scale-110" />
            </div>
            <div className="flex flex-col justify-center pt-1">
              <span className="text-emerald-50 font-headline font-black text-2xl tracking-tight uppercase leading-none truncate max-w-[140px]">
                {systemSettings?.siteName || "KARU"}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-emerald-400/80 font-bold mt-1">Ekologi Presisi</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-emerald-800/50 text-emerald-100/50 hover:text-emerald-50 transition-colors border border-transparent hover:border-emerald-700"
            title="Tutup Sidebar"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 mt-4">
          <Link href="/dashboard" className={navLinkClass(isActive('/dashboard'))}>
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm font-medium">Dashboard</span>
          </Link>

          {/* Data Master (collapsible) */}
          <div>
            <button
              type="button"
              onClick={() => setIsDataMasterOpen(prev => !prev)}
              className={`w-full text-left flex items-center justify-between px-4 py-3 transition-all duration-200 ${isActivePrefix('/dashboard/data-master')
                ? 'text-emerald-300 border-l-4 border-emerald-400 bg-emerald-900/30 font-semibold'
                : 'text-emerald-100/60 hover:text-emerald-50 hover:bg-emerald-900/20'
                }`}
            >
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined">database</span>
                <span className="text-sm font-medium">Data Master</span>
              </span>
              <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${isDataMasterOpen ? 'rotate-180' : 'rotate-0'}`}>
                expand_more
              </span>
            </button>

            <div className={`bg-emerald-950/50 flex flex-col overflow-hidden transition-all duration-300 ${isDataMasterOpen ? 'max-h-40 py-1 opacity-100' : 'max-h-0 opacity-0'}`}>
              <Link
                href="/dashboard/data-master/kamus-tanaman"
                className={`pl-12 pr-4 py-2.5 text-[12px] transition-colors ${isActivePrefix('/dashboard/data-master/kamus-tanaman')
                  ? 'text-emerald-300 font-bold'
                  : 'text-emerald-100/50 hover:text-emerald-50 hover:bg-emerald-900/10'
                  }`}
              >
                Kamus Tanaman
              </Link>
              <Link
                href="/dashboard/data-master/kamus-penyakit-hama"
                className={`pl-12 pr-4 py-2.5 text-[12px] transition-colors ${isActivePrefix('/dashboard/data-master/kamus-penyakit-hama')
                  ? 'text-emerald-300 font-bold'
                  : 'text-emerald-100/50 hover:text-emerald-50 hover:bg-emerald-900/10'
                  }`}
              >
                Kamus Penyakit &amp; Hama
              </Link>
              <Link
                href="/dashboard/data-master/sop-penanganan"
                className={`pl-12 pr-4 py-2.5 text-[12px] transition-colors ${isActivePrefix('/dashboard/data-master/sop-penanganan')
                  ? 'text-emerald-300 font-bold'
                  : 'text-emerald-100/50 hover:text-emerald-50 hover:bg-emerald-900/10'
                  }`}
              >
                SOP Penanganan
              </Link>
            </div>
          </div>

          <Link href="/dashboard/workspace" className={navLinkClass(isActivePrefix('/dashboard/workspace'))}>
            <span className="material-symbols-outlined">view_quilt</span>
            <span className="text-sm font-medium">WorkSpace</span>
          </Link>

          <Link href="/dashboard/qr-node" className={navLinkClass(isActivePrefix('/dashboard/qr-node'))}>
            <span className="material-symbols-outlined">qr_code_2</span>
            <span className="text-sm font-medium">Aset Node QR</span>
          </Link>

          <Link href="/dashboard/reports-ai" className={navLinkClass(isActivePrefix('/dashboard/reports-ai'))}>
            <span className="material-symbols-outlined">monitoring</span>
            <span className="text-sm font-medium">Laporan &amp; Wawasan AI</span>
          </Link>

          <Link href="/dashboard/users-access" className={navLinkClass(isActivePrefix('/dashboard/users-access'))}>
            <span className="material-symbols-outlined">group</span>
            <span className="text-sm font-medium">Pengguna &amp; Akses</span>
          </Link>

          <Link href="/dashboard/log-aktivitas" className={navLinkClass(isActivePrefix('/dashboard/log-aktivitas'))}>
            <span className="material-symbols-outlined">history</span>
            <span className="text-sm font-medium">Log Aktivitas</span>
          </Link>

          <Link href="/dashboard/settings" className={navLinkClass(isActivePrefix('/dashboard/settings'))}>
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm font-medium">Pengaturan</span>
          </Link>
        </nav>

        {/* Bottom links */}
        <div className="p-6 border-t border-emerald-900/50 flex-shrink-0">
          <Link href="/" className="flex items-center gap-3 px-4 py-2 text-emerald-100/40 hover:text-emerald-100 transition-colors">
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className="text-sm">Keluar</span>
          </Link>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className={`flex-1 flex flex-col h-screen transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'} bg-surface overflow-hidden`}>

        {/* ── Top Navbar ── */}
        <header className="flex-shrink-0 relative z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-white/40 flex justify-between items-center h-16 px-8 shadow-sm">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-200/50 transition-colors focus:ring focus:ring-emerald-500/20 outline-none"
                title="Buka Sidebar"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
            )}

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>{breadcrumbCategory}</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="font-bold text-emerald-700">{breadcrumbPage}</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Clock */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              <span>{timeString || 'Memuat...'}</span>
            </div>

            {/* Notifications */}
            <button type="button" className="p-2 text-slate-500 hover:bg-slate-200/50 rounded-lg transition-colors duration-200 relative">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>

            <div className="h-8 w-px bg-slate-200 mx-1" />

            {/* Profile trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(prev => !prev)}
                className="flex items-center gap-3 pl-2 rounded-lg hover:bg-slate-100 transition-colors p-1"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[13px] font-extrabold text-emerald-800">{userName}</p>
                  <p className="text-[11px] text-slate-500 font-bold tracking-tight">{roleLabel}</p>
                </div>
                {userImage ? (
                  <img
                    alt="Foto Profil"
                    className="w-9 h-9 rounded-full object-cover shadow-sm ring-2 ring-emerald-500/20"
                    src={userImage}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-white text-[13px] font-bold shadow-sm ring-2 ring-emerald-500/20">
                    {initials}
                  </div>
                )}
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200/60 z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                      {userImage ? (
                        <img src={userImage} alt={userName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-emerald-800 truncate">{userName}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{userEmail}</p>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">account_circle</span>
                        Profil Saya
                      </Link>
                    </div>
                    <div className="p-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={async () => { await signOut(); window.location.href = '/'; }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        Keluar Aplikasi
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Outer layout: wraps shell in Suspense.
// This is REQUIRED by Next.js App Router when
// any child uses usePathname / useSearchParams.
// ─────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-emerald-400 animate-spin">refresh</span>
          <p className="text-sm font-semibold text-slate-500">Memuat Dashboard...</p>
        </div>
      </div>
    }>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
