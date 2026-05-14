'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  getAllBatchesAction,
  createBatchAction,
  deleteBatchAction,
  updateBatchStatusAction
} from '@/app/actions/qr-node.actions';
import { getWorkspacesAction } from '@/app/actions/workspace.actions';

// ── Types ──────────────────────────────────────────────────────────────────────
type BatchItem = {
  id: string;
  workspaceId: string | null;
  workspaceName: string | null;
  zone: string | null;
  nodeCount: number;
  prefix: string | null;
  status: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: Date | null;
};

type WorkspaceOpt = {
  id: string;
  name: string;
};

const QR_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBsMqpcH76Sznl3sot8zBTHI5d7yrHlJGVeNOCtGYGYyp52b6Gpnna8BJG8c-dLgx0RNdYMVfe_kdXGfiNJEjdOlNpegiIDmS907XNEHjFEgjnFJgFZ1gXV6TCcrKKJm-L_NICFuaUbpftuTHvvLoDSWD6F_udGbdLcjP3EOFou-8s1-dJNXcn3v1nj7nsy4O0KYCXZUR8DFAv6xVvFs9LcafOpQwVLkvMf7C7_OiF7Qk6sUAYW8SNX_2zqtSrD5n6xCQlko2M-7lnP',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCnUdU0VnCnknBZq2zgpULlE96IacrkPR3lm5gZVz6116wsOe1RT6TO7LpvONTmchePrqVMbKWiyS6gePEm9IsfVZVUrLcsOvhVZV399sWLAih4TjtNwjlEbArenV-A19PCai6mHoXi5sj5bZHRPbnARzu7gqQYg0nIhZ9Ekk1ZDLojWEraJtaIjWJcGe9ZLei3FUM-0n5rPZlpiEfBQXyggey2ymF3R2AcJRy3GKjAjqMwrg-pX8k_2BiiFsXKJoIvFVzRQvEJR_mp',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDK0OFMkgFVbwovbN2bBC8JAkt1zK0_pkc0m49HuqgvrsuAq7mxgLR9mo64K9i1EHE-46YFTxJNg-gm4q3VRoCCAXyHJK4iMkf7bDEPm4A8k0vvG3GUBgWGij28r76Z29mVBZGnujzgD6O0hdtQ3pxmYf_nixqfAQQ9NNvs-32dTQp34QI6O6ftxC3U_ykoX0WMbSBeu9jTuz8z9hZ3EdMDNEp4E6i0fenImr1rfyjG4My6ju4nyIkzGNyJNlYiH7SajU6NIFZrsM_P',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDevMffxmghueM9rh9UPHCnR40jWmBBwO1Z0xazeoVkn4T5_AUbVnTKNy7NM3vrLbh3bLLP62gQcYf0oSOJgeBqhzclEDDD6ynf7q6LQFTZs0oVHRFWjRNQKx6xsrIN4AlCTcKBYPn-gUBJu4TW-JUVVynvBqiH2OASlv1cMYi855qXhRUprvyzffrgCxFfNyyMctrv1gikLqYCzio7BPuJrYblkuPmZz5Ep0nNj47J2QZRheBXV8cYADGjHfSOXOZ1xbK4LSLYYWTd',
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string | null }) {
  const isPrinted = status?.toLowerCase() === 'dicetak';
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
        isPrinted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
      }`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full inline-block"
        style={{ background: isPrinted ? '#10b981' : '#f59e0b' }}
      />
      {status || 'Belum Dicetak'}
    </span>
  );
}

// ── Delete Confirmation Modal ──────────────────────────────────────────────────
function DeleteModal({
  batchId,
  loading,
  onConfirm,
  onCancel,
}: {
  batchId: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[3px] z-[60]" onClick={loading ? undefined : onCancel} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" style={{ animation: 'scaleIn 0.18s ease-out' }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-rose-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                delete
              </span>
            </div>
            <div>
              <h3 className="font-manrope font-extrabold text-primary text-base">Hapus Batch QR?</h3>
              <p className="text-xs text-slate-500 mt-0.5">Seluruh QR node di dalamnya akan ikut terhapus.</p>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-5">
            <p className="text-xs text-slate-400">ID Batch:</p>
            <p className="font-mono text-sm font-bold text-slate-700">{batchId}</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Menghapus...
                </>
              ) : (
                'Ya, Hapus'
              )}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes scaleIn{from{transform:scale(0.9);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────────
export default function QRNodePage() {
  const [activeTab, setActiveTab] = useState<'riwayat' | 'buat'>('riwayat');
  const [filterWs, setFilterWs] = useState('semua');
  const [search, setSearch] = useState('');

  // Data dari Server
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceOpt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State Form Pembuatan Batch
  const [selectedWs, setSelectedWs] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [nodeCount, setNodeCount] = useState(12);
  const [prefix, setPrefix] = useState('KARU-NODE');
  const [keterangan, setKeterangan] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State Konfirmasi Hapus
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [resBatches, resWs] = await Promise.all([
      getAllBatchesAction(),
      getWorkspacesAction(),
    ]);

    if (resBatches.success) {
      setBatches(resBatches.data as BatchItem[]);
    }
    if (resWs.success) {
      const wsOpts = (resWs.data as any[]).map(w => ({ id: w.id, name: w.name }));
      setWorkspaces(wsOpts);
      if (wsOpts.length > 0) {
        setSelectedWs(wsOpts[0].id);
        // Set prefix pintar berdasarkan inisial workspace jika diinginkan
        const initials = wsOpts[0].name
          .split(' ')
          .map((word: string) => word[0])
          .join('')
          .toUpperCase()
          .slice(0, 3);
        setPrefix(`KARU-${initials || 'NODE'}`);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler Ganti Workspace Dropdown untuk menyesuaikan Prefix Otomatis
  const handleWsChange = (wsId: string) => {
    setSelectedWs(wsId);
    const found = workspaces.find(w => w.id === wsId);
    if (found) {
      const initials = found.name
        .split(' ')
        .map((word: string) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 3);
      setPrefix(`KARU-${initials || 'NODE'}`);
    }
  };

  // Submit Generate Batch Baru
  const handleGenerateBatch = async () => {
    if (!selectedWs) {
      setFormError('Pilih ruang kerja target terlebih dahulu.');
      return;
    }
    if (!prefix.trim()) {
      setFormError('Awalan kode aset tidak boleh kosong.');
      return;
    }

    setIsGenerating(true);
    setFormError('');
    setSuccessMessage('');

    const res = await createBatchAction({
      workspaceId: selectedWs,
      zone: zoneName.trim() || 'Ruang Utama',
      nodeCount,
      prefix: prefix.trim().toUpperCase(),
      keterangan: keterangan.trim() || undefined,
    });

    setIsGenerating(false);

    if (res.success) {
      setSuccessMessage(`Berhasil menghasilkan batch QR dengan ${nodeCount} node.`);
      // Reload daftar batch
      const updatedBatches = await getAllBatchesAction();
      if (updatedBatches.success) {
        setBatches(updatedBatches.data as BatchItem[]);
      }
      // Pindah ke tab riwayat setelah beberapa saat
      setTimeout(() => {
        setActiveTab('riwayat');
        setShowPreview(false);
        setSuccessMessage('');
      }, 1500);
    } else {
      setFormError((res as any).error || 'Terjadi kesalahan saat membuat batch.');
    }
  };

  // Handler Hapus Batch
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const res = await deleteBatchAction(deleteId);
    setIsDeleting(false);

    if (res.success) {
      setBatches(p => p.filter(b => b.id !== deleteId));
      setDeleteId(null);
    } else {
      alert(res.error || 'Gagal menghapus batch.');
    }
  };

  // Handler Update Status (Cetak Ulang / Toggle Status)
  const handleToggleStatus = async (batchId: string, currentStatus: string | null) => {
    const nextStatus = currentStatus?.toLowerCase() === 'dicetak' ? 'Belum Dicetak' : 'Dicetak';
    const res = await updateBatchStatusAction(batchId, nextStatus);
    if (res.success) {
      setBatches(p =>
        p.map(b => (b.id === batchId ? { ...b, status: nextStatus } : b))
      );
    }
  };

  // Filter batches
  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      const matchWs = filterWs === 'semua' || b.workspaceId === filterWs;
      const matchSearch = !search.trim() ||
        b.id.toLowerCase().includes(search.toLowerCase()) ||
        (b.workspaceName || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.zone || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.prefix || '').toLowerCase().includes(search.toLowerCase());
      return matchWs && matchSearch;
    });
  }, [batches, filterWs, search]);

  // Nodes dummy untuk preview UI
  const previewNodes = Array.from({ length: Math.min(nodeCount, 8) }, (_, i) => ({
    id: `${prefix.trim().toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
    zone: zoneName.trim() || 'Ruang Utama',
  }));

  // Konfigurasi Stats Cards seragam dengan halaman Workspace
  const stats = [
    { label: 'Total Batch', value: isLoading ? '...' : batches.length, icon: 'layers', bg: 'bg-emerald-50', color: 'text-emerald-700', border: 'border-emerald-100' },
    { label: 'Total Node Dibuat', value: isLoading ? '...' : batches.reduce((s, b) => s + b.nodeCount, 0), icon: 'qr_code_2', bg: 'bg-teal-50', color: 'text-teal-700', border: 'border-teal-100' },
    { label: 'Sudah Dicetak', value: isLoading ? '...' : batches.filter(b => b.status?.toLowerCase() === 'dicetak').length, icon: 'print', bg: 'bg-sky-50', color: 'text-sky-700', border: 'border-sky-100' },
    { label: 'Belum Dicetak', value: isLoading ? '...' : batches.filter(b => b.status?.toLowerCase() !== 'dicetak').length, icon: 'pending', bg: 'bg-amber-50', color: 'text-amber-700', border: 'border-amber-100' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full pb-20 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline-variant/10 pb-6">
        <div>
          <h2 className="text-3xl font-manrope font-extrabold text-primary tracking-tight">Aset Node QR</h2>
          <p className="text-slate-500 mt-2 font-body text-sm md:text-base">
            Kelola dan hasilkan set stiker QR fisik sebagai checkpoint operator lapangan di setiap ruang kerja.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant/30 rounded-xl text-sm font-semibold text-primary hover:bg-slate-50 transition-colors shadow-sm bg-white"
          >
            <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            Muat Ulang
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { key: 'riwayat', label: 'Daftar & Riwayat Batch', icon: 'history' },
          { key: 'buat', label: 'Generate Set Batch Baru', icon: 'add_circle' },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key as 'riwayat' | 'buat');
              setFormError('');
              setSuccessMessage('');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Riwayat ── */}
      {activeTab === 'riwayat' && (
        <div className="space-y-6">
          {/* Summary stats seragam dengan workspace */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(s => (
              <div key={s.label} className={`bg-white rounded-2xl p-5 border ${s.border} shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                  <span className={`material-symbols-outlined text-[24px] ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                  <p className={`text-2xl font-manrope font-extrabold ${s.color}`}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl p-4 flex flex-wrap items-center gap-3 shadow-sm border border-slate-100">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari ID batch, ruang kerja, zona, atau prefix..."
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Dropdown Filter Workspace */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                Ruang Kerja:
              </span>
              <div className="relative">
                <select
                  value={filterWs}
                  onChange={e => setFilterWs(e.target.value)}
                  className="bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 pl-3 pr-8 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none appearance-none min-w-[150px]"
                >
                  <option value="semua">Semua Ruang Kerja</option>
                  {workspaces.map(ws => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[16px]">
                  expand_more
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-bold ml-auto pl-1">
              {filteredBatches.length} batch
            </p>
          </div>

          {/* Batch table */}
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Batch ID
                    </th>
                    <th className="text-left px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Ruang Kerja Target
                    </th>
                    <th className="text-left px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Zona / Sub-area
                    </th>
                    <th className="text-center px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Jumlah Node
                    </th>
                    <th className="text-left px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Dibuat Oleh
                    </th>
                    <th className="text-center px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Status Cetak
                    </th>
                    <th className="text-center px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <span className="material-symbols-outlined animate-spin text-2xl block mb-2">refresh</span>
                        Memuat data batch...
                      </td>
                    </tr>
                  ) : filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 block">inbox</span>
                        <p className="text-slate-500 font-bold">Belum ada batch QR terdaftar.</p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('buat')}
                          className="mt-3 text-sm text-emerald-600 font-bold hover:underline"
                        >
                          + Generate Set Batch Baru
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map(batch => (
                      <tr key={batch.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-primary bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                            {batch.id}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href="/dashboard/workspace"
                            className="font-semibold text-slate-700 hover:text-emerald-700 transition-colors flex items-center gap-1"
                          >
                            {batch.workspaceName || 'Ruang Kerja Terhapus'}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-slate-600 font-medium">{batch.zone || '—'}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {batch.nodeCount}
                          </span>
                          <span className="text-slate-400 text-xs ml-1">node</span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-slate-700 font-medium text-xs">
                            {batch.createdByName || batch.createdBy || 'Sistem'}
                          </p>
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            {batch.createdAt
                              ? new Date(batch.createdAt).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(batch.id, batch.status)}
                            title="Klik untuk mengubah status cetak"
                            className="hover:scale-105 transition-transform"
                          >
                            <StatusPill status={batch.status} />
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(batch.id, batch.status)}
                              title="Tandai Dicetak / Belum"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">print</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId(batch.id)}
                              title="Hapus Batch"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Buat Node ── */}
      {activeTab === 'buat' && (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left: Config form */}
          <div className="w-full lg:w-[400px] flex-shrink-0 space-y-5">
            <div className="bg-white rounded-2xl p-6 border border-outline-variant/10 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <span className="material-symbols-outlined text-emerald-700">tune</span>
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider font-manrope">
                  Parameter Pembuatan Batch
                </h3>
              </div>

              {/* Status Alert */}
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {formError}
                </div>
              )}
              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  {successMessage}
                </div>
              )}

              {/* Workspace select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Ruang Kerja Target <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedWs}
                    onChange={e => handleWsChange(e.target.value)}
                    className="w-full bg-slate-50 border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-semibold text-primary focus:ring-2 focus:ring-primary/20 appearance-none outline-none transition-all"
                  >
                    {workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">
                    expand_more
                  </span>
                </div>
                {workspaces.length === 0 && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-1">
                    ⚠️ Belum ada workspace terdaftar. Silakan buat workspace terlebih dahulu.
                  </p>
                )}
              </div>

              {/* Zone name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nama Zona / Sektor <span className="text-slate-400 font-normal normal-case">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={zoneName}
                  onChange={e => setZoneName(e.target.value)}
                  placeholder="cth. Zona A — Blok Barat"
                  className="w-full bg-slate-50 border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-medium text-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              {/* Node count */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah Node</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNodeCount(n => Math.max(1, n - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition-colors flex-shrink-0"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={nodeCount}
                    onChange={e => setNodeCount(Math.min(100, Math.max(1, Number(e.target.value))))}
                    min={1}
                    max={100}
                    className="flex-1 bg-slate-50 border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm font-bold text-primary text-center focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setNodeCount(n => Math.min(100, n + 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition-colors flex-shrink-0"
                  >
                    +
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-medium pl-1">
                  Direkomendasikan sesuai jumlah stiker/titik fisik di lapangan.
                </p>
              </div>

              {/* Prefix */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Awalan ID Node</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={e => setPrefix(e.target.value.toUpperCase())}
                  placeholder="cth. KARU-ARB"
                  className="w-full bg-slate-50 border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-bold font-mono text-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all uppercase placeholder:normal-case placeholder:text-slate-300"
                />
                <p className="text-[10px] text-slate-400 font-medium pl-1">
                  Contoh output: <span className="font-mono font-bold text-slate-600">{prefix || 'KARU'}-001</span>
                </p>
              </div>

              {/* Keterangan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Keterangan <span className="text-slate-300 font-normal normal-case">(opsional)</span>
                </label>
                <textarea
                  value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                  rows={2}
                  placeholder="Catatan penempatan fisik stiker..."
                  className="w-full bg-slate-50 border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-medium text-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none placeholder:text-slate-300"
                />
              </div>

              <div className="pt-2 gap-3 flex flex-col">
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  Lihat Preview Pola Kode
                </button>

                <button
                  type="button"
                  disabled={isGenerating || workspaces.length === 0}
                  onClick={handleGenerateBatch}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-xl text-sm font-bold shadow-md hover:brightness-105 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">add_task</span>
                      Simpan & Generate Set Batch
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tips Info */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-emerald-700 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  lightbulb
                </span>
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Peran QR Node di Mobile</h4>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                Sistem **tidak mewajibkan** operator melakukan pemindaian QR saat mengambil log AI pindaian tanaman di lahan mikro.
                Namun pada **lahan Makro**, kode QR ini berperan membantu verifikasi checkpoint kunjungan patroli secara presisi.
              </p>
            </div>
          </div>

          {/* Right: Preview Panel */}
          <div className="flex-1 w-full">
            {showPreview ? (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                {/* Preview header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Simulasi Layout Cetak
                    </p>
                    <h3 className="text-lg font-manrope font-extrabold text-primary">
                      {workspaces.find(w => w.id === selectedWs)?.name || 'Pilih Ruang Kerja'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {zoneName.trim() || 'Ruang Utama'} · {nodeCount} node
                    </p>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Pola Prefix</p>
                    <p className="font-mono text-xs font-extrabold text-emerald-800">{prefix || 'KARU-NODE'}</p>
                  </div>
                </div>

                {/* QR grid */}
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {previewNodes.map((node, i) => (
                      <div
                        key={node.id}
                        className="flex flex-col items-center gap-2 p-3 bg-white border border-slate-200/80 rounded-xl shadow-sm hover:border-emerald-300 transition-colors"
                      >
                        <div className="w-full aspect-square bg-slate-50 p-2 border border-slate-100 rounded-lg flex items-center justify-center">
                          <img
                            alt={`QR ${node.id}`}
                            className="w-full h-full object-cover contrast-125 mix-blend-multiply"
                            src={QR_IMAGES[i % QR_IMAGES.length]}
                          />
                        </div>
                        <div className="text-center w-full min-w-0">
                          <p className="text-[11px] font-mono font-extrabold text-slate-800 truncate">{node.id}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate mt-0.5">
                            {node.zone}
                          </p>
                        </div>
                      </div>
                    ))}
                    {nodeCount > 8 && (
                      <div className="flex flex-col items-center justify-center aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                        <span className="text-xl font-manrope font-extrabold text-slate-500">+{nodeCount - 8}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">stiker lainnya</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer simulation info */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
                  💡 Setelah menekan tombol <strong>Simpan & Generate Set Batch</strong>, set stiker ini akan didaftarkan ke PostgreSQL dan siap divalidasi via aplikasi mobile.
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-12 hover:border-emerald-300 transition-colors bg-white/50">
                <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">qr_code_scanner</span>
                <h3 className="text-base font-manrope font-bold text-slate-600">Simulasi Pola Stiker</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-xs font-medium leading-relaxed">
                  Isi parameter di samping lalu klik tombol <strong className="text-slate-600">Lihat Preview Pola Kode</strong> untuk melihat penamaan stiker yang akan dihasilkan.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Konfirmasi Hapus Modal */}
      {deleteId && (
        <DeleteModal
          batchId={deleteId}
          loading={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
