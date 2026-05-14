'use client';

import React, { useState, useEffect } from 'react';
import { getActivityLogsAction } from '@/app/actions/activity-log.actions';

// Konfigurasi visual untuk masing-masing tipe log
const TYPE_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  create: { bg: 'bg-emerald-50', color: 'text-emerald-700', label: 'Tambah Data' },
  update: { bg: 'bg-blue-50', color: 'text-blue-700', label: 'Ubah Data' },
  delete: { bg: 'bg-rose-50', color: 'text-rose-700', label: 'Hapus Data' },
  system: { bg: 'bg-amber-50', color: 'text-amber-700', label: 'Sistem Otonom' },
  auth: { bg: 'bg-violet-50', color: 'text-violet-700', label: 'Autentikasi' },
};

export default function LogAktivitasPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('semua');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Fetch data log aktivitas dengan debounce pada pencarian
  useEffect(() => {
    setPage(1); // Reset halaman ke 1 setiap kali filter atau pencarian berubah
  }, [search, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      async function fetchLogs() {
        setIsLoading(true);
        try {
          const res = await getActivityLogsAction({
            type: typeFilter,
            search: search,
            limit: limit,
            offset: (page - 1) * limit,
          });
          if (res.success && res.data) {
            setLogs(res.data as any[]);
          } else {
            setLogs([]);
          }
        } catch (err) {
          console.error('Gagal mengambil data log aktivitas:', err);
          setLogs([]);
        } finally {
          setIsLoading(false);
        }
      }
      fetchLogs();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, typeFilter, page]);

  // Handler ekspor ke CSV secara lokal
  const handleExportCsv = () => {
    if (logs.length === 0) return;
    const headers = ['Waktu', 'Pelaku', 'Peran', 'Aksi', 'Deskripsi', 'Tipe', 'IP Address'];
    const rows = logs.map(l => [
      l.createdAt ? new Date(l.createdAt).toLocaleString('id-ID') : '-',
      `"${l.userName || 'Sistem'}"`,
      `"${l.userRole || 'Sistem Otonom'}"`,
      `"${l.action || '-'}"`,
      `"${(l.description || '').replace(/"/g, '""')}"`,
      l.type || '-',
      l.ipAddress || '-'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Log_Audit_KARU_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline-variant/10 pb-6">
        <div>
          <h1 className="text-3xl font-manrope font-extrabold text-emerald-950 tracking-tight font-headline">
            Log Aktivitas & Audit
          </h1>
          <p className="text-slate-500 mt-1 max-w-xl text-sm md:text-base">
            Pantau seluruh riwayat interaksi, modifikasi data master, dan jejak audit perubahan dalam sistem KARU.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={logs.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          Ekspor Log (CSV)
        </button>
      </div>

      {/* Filter Bar Terintegrasi */}
      <div className="bg-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm border border-slate-100">
        {/* Search Input Real-time */}
        <div className="relative flex-1 min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari deskripsi aktivitas, nama pelaku, atau IP Address..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Pemilih Filter Tipe Aktivitas */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5">
            <span className="material-symbols-outlined text-[16px] text-slate-400">filter_alt</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent border-0 text-xs font-bold text-slate-700 focus:ring-0 outline-none cursor-pointer pr-2"
            >
              <option value="semua">Semua Kategori</option>
              <option value="create">Tambah Data</option>
              <option value="update">Ubah Data</option>
              <option value="delete">Hapus Data</option>
              <option value="system">Sistem Otonom</option>
              <option value="auth">Autentikasi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Utama Log Aktivitas */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
        <div className="overflow-x-auto pr-1">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-manrope font-extrabold text-slate-400 uppercase tracking-widest w-[180px]">
                  Waktu Perekaman
                </th>
                <th className="px-6 py-4 text-[10px] font-manrope font-extrabold text-slate-400 uppercase tracking-widest w-[220px]">
                  Pelaku & Peran
                </th>
                <th className="px-6 py-4 text-[10px] font-manrope font-extrabold text-slate-400 uppercase tracking-widest min-w-[250px]">
                  Rincian Aktivitas
                </th>
                <th className="px-6 py-4 text-[10px] font-manrope font-extrabold text-slate-400 uppercase tracking-widest w-[140px]">
                  Kategori
                </th>
                <th className="px-6 py-4 text-[10px] font-manrope font-extrabold text-slate-400 uppercase tracking-widest w-[160px]">
                  Alamat IP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <span className="material-symbols-outlined animate-spin text-3xl text-emerald-500 block mb-2">
                      refresh
                    </span>
                    <p className="text-xs font-bold text-slate-400">Memuat rekam aktivitas dari server...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">
                      history_toggle_off
                    </span>
                    <p className="text-xs font-bold text-slate-500">Tidak ada log aktivitas yang sesuai dengan kueri.</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Coba sesuaikan kata kunci pencarian atau kategori filter.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const config = TYPE_CONFIG[log.type] || { bg: 'bg-slate-50', color: 'text-slate-700', label: log.type || 'Lainnya' };
                  const timeStr = log.createdAt ? new Date(log.createdAt).toLocaleString('id-ID', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                  }) : '-';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-700 font-mono tracking-tight">{timeStr}</p>
                      </td>
                      <td className="px-6 py-4 min-w-0">
                        <p className="text-xs font-extrabold text-slate-800 truncate">
                          {log.userName || 'Sistem Otonom'}
                        </p>
                        <p className="text-[9px] uppercase font-extrabold text-primary tracking-wider mt-0.5">
                          {log.userRole || 'Sistem'}
                        </p>
                      </td>
                      <td className="px-6 py-4 min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 leading-tight">
                          {log.action}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-2 leading-relaxed pr-2">
                          {log.description}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${config.bg} ${config.color} border border-slate-100`}>
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] text-slate-500 font-mono font-bold tracking-tight bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {log.ipAddress || '127.0.0.1'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginasi Dinamis */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs font-medium text-slate-500 hidden sm:block">
            Halaman <strong className="text-slate-700">{page}</strong> (Maksimal {limit} entri/halaman)
          </p>
          <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto justify-between">
            <button
              type="button"
              disabled={page === 1 || isLoading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all disabled:opacity-40 disabled:hover:bg-white active:scale-95"
            >
              Sebelumnya
            </button>
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg font-mono">
              {page}
            </span>
            <button
              type="button"
              disabled={logs.length < limit || isLoading}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all disabled:opacity-40 disabled:hover:bg-white active:scale-95"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
