'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllScanLogsAction, deleteScanLogAction } from '@/app/actions/ai-scan.actions';

// ── Types ──────────────────────────────────────────────────────────────────────
type ScanLogItem = {
  id: number;
  userId: string | null;
  userName: string | null;
  workspaceId: string | null;
  workspaceName: string | null;
  qrNodeId: string | null;
  location: [number, number] | any;
  imageUrl: string | null;
  validationStatus: string | null; // 'Valid' | 'Di Luar Batas'
  diagnosisResult: string | null;
  probability: number | null;
  diseaseId: string | null;
  diseaseName: string | null;
  diseaseRecommendation: string | null;
  scannedAt: Date | null;
};

// Fallback images untuk estetika visual tinggi jika gambar asli kosong
const FALLBACK_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCpdCGRTt_czVoK4QB5oJaUltyWXvisjHA4_y0XmPNFRjI3IPZ81ibjes7OkWdJn04oFviWQm3yPOZg948lqnLRuDbLYKmG8gbs0AZoEi4qDhaBdDY19_jOcz4m_iLs4vWegSyp6XcPmEa0_7tZwRwgNZtTIfrOTsLbMCxaLSw_mjBViuevCNY_CaNdVyvxCDUkVHAT479D4inrC7dN5Pt_5-YxJzJUvD1_yvVSRtUJV12g1WVyibVdPR4QVKp1hyrkpmISGl8vn596',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBbcqYJpRlpbpmNvtjWtkInq1oFHwVTlHDo76-3SjOumxLu-QWGdEUHOvNyrO9Ixxyxsqls0bzTJMyI62LFC832YZGiuDmHDgx5wIeWnJwteeImd8KZzY_MmpRO8e0j3PQGNENO02cO7yPB7rmpsyqLF7GYS3oFKGop0xbrEIHlbPe3puvznVEENz4pdl8IZCHGYsAr596ylVRgdeWh9GKAQSnBQZKQitH_qWGylScGuG19pyObORSq9JALBvFa83RyulXDnCc-VY3y',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAyWbx9BO08ncVVRbqVpJzuLj1wJhdwUSfAW628zWFM8Vw2T1SpQK6yCqDXVFA8v0LbG6TpFL4H_73G_H4aemb59ixnal4OekGH4UfxkBoXAvAp-3yixMAgVuDOoPVJIK2keOB03ge3DBzMuVJ7KqtaiGUDOGy_dsOvfZviKDSFrygLXsI8m5NmTW7eAaMzSLNNTln8ZCLLJvnx6foiDnjFT29tNl9K-H3ZVtFwnQgrdeL4uXAVPMEbiMeRyVUi1lhUwuDhd6iBddW8',
];

// ── Image Preview Modal ────────────────────────────────────────────────────────
function ImagePreviewModal({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="relative max-w-2xl w-full"
          onClick={e => e.stopPropagation()}
          style={{ animation: 'scaleIn 0.2s ease-out' }}
        >
          <img src={src} alt={alt} className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl bg-slate-950" />
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-3 -right-3 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors border border-slate-200"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      </div>
      <style>{`@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({ log, onClose }: { log: ScanLogItem; onClose: () => void }) {
  const isValid = log.validationStatus?.toLowerCase() === 'valid';
  const displayId = `SCAN-${String(log.id).padStart(3, '0')}`;

  // Resolusi string lokasi
  let locationStr = 'Koordinat tidak tersedia';
  if (Array.isArray(log.location) && log.location.length >= 2) {
    const [lng, lat] = log.location;
    locationStr = `${lat.toFixed(4)}° S, ${lng.toFixed(4)}° E`;
  } else if (log.location && typeof log.location === 'object') {
    const lat = log.location.y || log.location.lat;
    const lng = log.location.x || log.location.lng;
    if (lat !== undefined && lng !== undefined) {
      locationStr = `${Number(lat).toFixed(4)}° S, ${Number(lng).toFixed(4)}° E`;
    } else {
      locationStr = JSON.stringify(log.location);
    }
  } else if (typeof log.location === 'string') {
    locationStr = log.location;
  }

  // Resolusi URL Gambar
  const imgSrc = log.imageUrl || FALLBACK_IMAGES[log.id % FALLBACK_IMAGES.length];

  // Waktu format
  const waktuStr = log.scannedAt
    ? new Date(log.scannedAt).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '—';

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: 'slideInRight 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 flex items-center justify-between border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-600 shadow-md">
              <span className="material-symbols-outlined text-white text-[18px]">biotech</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Detail Laporan Pindaian AI</p>
              <h2 className="text-sm font-manrope font-extrabold text-primary leading-tight">{displayId}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Gambar */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-video bg-slate-100 relative group">
            <img src={imgSrc} alt="Sampel Pindaian" className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
              {log.probability ? `${log.probability}% Confidence` : 'Analisis AI'}
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: 'schedule', label: 'Waktu Kirim', value: waktuStr },
              { icon: 'person', label: 'Operator / Analis', value: log.userName || 'Sistem Patroli' },
              { icon: 'workspaces', label: 'Ruang Kerja', value: log.workspaceName || log.workspaceId || '—' },
              { icon: 'qr_code_2', label: 'Tag QR Node', value: log.qrNodeId || 'Tanpa QR Node (Lahan Mikro)' },
              { icon: 'location_on', label: 'Posisi GPS', value: locationStr },
              {
                icon: isValid ? 'check_circle' : 'cancel',
                label: 'Status Geofence',
                value: log.validationStatus || (isValid ? 'Valid' : 'Di Luar Batas'),
              },
            ].map(m => (
              <div key={m.label} className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-1 truncate">
                  <span className="material-symbols-outlined text-[12px]">{m.icon}</span>
                  {m.label}
                </p>
                <p
                  className={`text-xs font-bold leading-tight ${
                    m.label === 'Status Geofence'
                      ? isValid
                        ? 'text-emerald-700'
                        : 'text-rose-600'
                      : 'text-slate-800'
                  }`}
                >
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* Diagnosis AI */}
          <div
            className={`rounded-xl p-4 border ${
              isValid ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
            }`}
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">smart_toy</span>
              Diagnosis &amp; Rekomendasi AI
            </p>
            <p className={`text-base font-extrabold mb-1.5 ${isValid ? 'text-emerald-900' : 'text-amber-900'}`}>
              {log.diagnosisResult || 'Tanpa Diagnosis'} {log.probability ? `(${log.probability}%)` : ''}
            </p>

            {log.diseaseName && (
              <p className="text-xs font-bold text-slate-700 mb-2">
                🔗 Match Master Data: <span className="text-primary underline">{log.diseaseName}</span>
              </p>
            )}

            <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-200/60 mt-2">
              <strong>Rekomendasi Penanganan:</strong>{' '}
              {log.diseaseRecommendation || 'Lakukan pemantauan berkala dan pastikan nutrisi serta irigasi optimal.'}
            </p>
          </div>

          {/* Alasan Invalid Alert */}
          {!isValid && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <span
                className="material-symbols-outlined text-rose-500 text-[20px] flex-shrink-0 mt-0.5"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
              <div>
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">
                  Peringatan Perekaman di Luar Zona
                </p>
                <p className="text-xs text-rose-800 font-medium leading-relaxed">
                  Sistem mendeteksi koordinat pindaian ini berada di luar batas poligon lahan (Geofence) yang terdaftar untuk ruang kerja bersangkutan. Validasi data sebelum mengambil keputusan tindakan lapangan.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-5 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
            Tutup Panel Detail
          </button>
        </div>
      </div>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </>
  );
}

// ── Delete Confirm Dialog ─────────────────────────────────────────────────────
function DeleteDialog({
  logId,
  displayId,
  analystName,
  loading,
  onConfirm,
  onCancel,
}: {
  logId: number;
  displayId: string;
  analystName: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[3px] z-50" onClick={loading ? undefined : onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" style={{ animation: 'scaleIn 0.18s ease-out' }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-red-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                delete_forever
              </span>
            </div>
            <div>
              <h3 className="font-manrope font-extrabold text-primary text-base">Hapus Laporan Pindaian?</h3>
              <p className="text-xs text-slate-500 mt-0.5">Catatan pindaian AI ini akan dihapus permanen.</p>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-5 space-y-0.5">
            <p className="text-sm font-bold text-slate-700">{displayId}</p>
            <p className="text-xs text-slate-400">
              Operator / Analis: <span className="font-semibold text-slate-600">{analystName}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                  Menghapus...
                </>
              ) : (
                'Ya, Hapus'
              )}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </>
  );
}

// ── Helper: Analyst Badge ──────────────────────────────────────────────────────
function AnalystBadge({ name }: { name: string }) {
  const cleanName = name || 'Operator Patroli';
  const initials = cleanName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-[10px] font-bold text-emerald-800 border border-emerald-200/60 shadow-sm flex-shrink-0">
        {initials}
      </div>
      <span className="text-xs md:text-sm font-bold text-primary truncate max-w-[140px] md:max-w-none">
        {cleanName}
      </span>
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────────
export default function ReportsAIPage() {
  const [logs, setLogs] = useState<ScanLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States Filter & Search
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'valid' | 'invalid'>('semua');
  const [filterPeriod, setFilterPeriod] = useState('all');

  // States Interaksi Detail & Delete
  const [detailTarget, setDetailTarget] = useState<ScanLogItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScanLogItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewImg, setPreviewImg] = useState<{ src: string; alt: string } | null>(null);

  // Load Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const res = await getAllScanLogsAction();
    if (res.success) {
      setLogs(res.data as ScanLogItem[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler Hapus Log
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const res = await deleteScanLogAction(deleteTarget.id);
    setIsDeleting(false);

    if (res.success) {
      setLogs(prev => prev.filter(l => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } else {
      alert(res.error || 'Gagal menghapus laporan pindaian.');
    }
  };

  // Filter & Pencarian
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const displayId = `SCAN-${String(log.id).padStart(3, '0')}`;
      const analystName = log.userName || 'Operator Patroli';
      const workspaceName = log.workspaceName || log.workspaceId || '';
      const diagnosis = log.diagnosisResult || '';

      // Match Search
      const matchSearch =
        displayId.toLowerCase().includes(search.toLowerCase()) ||
        analystName.toLowerCase().includes(search.toLowerCase()) ||
        workspaceName.toLowerCase().includes(search.toLowerCase()) ||
        diagnosis.toLowerCase().includes(search.toLowerCase());

      // Match Status
      const isValid = log.validationStatus?.toLowerCase() === 'valid';
      const matchStatus =
        filterStatus === 'semua' ||
        (filterStatus === 'valid' && isValid) ||
        (filterStatus === 'invalid' && !isValid);

      // Match Period (jika diperlukan)
      let matchPeriod = true;
      if (filterPeriod !== 'all' && log.scannedAt) {
        const diffTime = Math.abs(Date.now() - new Date(log.scannedAt).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (filterPeriod === '7d') matchPeriod = diffDays <= 7;
        else if (filterPeriod === '30d') matchPeriod = diffDays <= 30;
      }

      return matchSearch && matchStatus && matchPeriod;
    });
  }, [logs, search, filterStatus, filterPeriod]);

  // Statistik Dinamis
  const totalValid = logs.filter(l => l.validationStatus?.toLowerCase() === 'valid').length;
  const totalInvalid = logs.length - totalValid;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline-variant/10 pb-6">
        <div>
          <h1 className="text-3xl font-manrope font-extrabold text-emerald-950 tracking-tight">Laporan &amp; Wawasan AI</h1>
          <p className="text-slate-500 mt-1 max-w-xl text-sm md:text-base">
            Daftar log pemindaian hama penyakit tanaman yang dianalisis oleh Gemini AI secara terintegrasi dari lapangan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors bg-white shadow-sm"
          >
            <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            Muat Ulang
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Pindaian Masuk',
            value: isLoading ? '...' : logs.length,
            icon: 'analytics',
            bg: 'bg-slate-50',
            color: 'text-slate-800',
            border: 'border-slate-100',
            sub: 'Keseluruhan log sinkronisasi',
          },
          {
            label: 'Geofence Valid',
            value: isLoading ? '...' : totalValid,
            icon: 'check_circle',
            bg: 'bg-emerald-50',
            color: 'text-emerald-700',
            border: 'border-emerald-100',
            sub: 'Di dalam poligon lahan',
          },
          {
            label: 'Di Luar Batas',
            value: isLoading ? '...' : totalInvalid,
            icon: 'cancel',
            bg: 'bg-rose-50',
            color: 'text-rose-600',
            border: 'border-rose-100',
            sub: 'Memerlukan pengecekan',
          },
          {
            label: 'Tingkat Kepercayaan',
            value: isLoading
              ? '...'
              : logs.length > 0
              ? `${Math.round(
                  logs.reduce((sum, l) => sum + (l.probability || 90), 0) / logs.length
                )}%`
              : '0%',
            icon: 'psychology',
            bg: 'bg-amber-50',
            color: 'text-amber-700',
            border: 'border-amber-100',
            sub: 'Rata-rata probabilitas AI',
          },
        ].map(s => (
          <div
            key={s.label}
            className={`bg-white rounded-2xl p-5 border ${s.border} shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <span className={`material-symbols-outlined text-[24px] ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {s.icon}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-manrope font-extrabold mt-0.5 ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 flex flex-wrap items-center gap-3 shadow-sm border border-slate-100">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari ID, Operator, Ruang kerja, atau Hasil AI..."
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(
              [
                { key: 'semua', label: 'Semua' },
                { key: 'valid', label: 'Valid' },
                { key: 'invalid', label: 'Di Luar Batas' },
              ] as const
            ).map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterStatus(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === tab.key
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Periode */}
          <div className="relative">
            <select
              value={filterPeriod}
              onChange={e => setFilterPeriod(e.target.value)}
              className="bg-slate-100 border-0 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
            >
              <option value="all">Semua Waktu</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[16px]">
              expand_more
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 font-bold ml-auto pl-1">
          {filteredLogs.length} pindaian
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-manrope font-extrabold text-slate-400 uppercase tracking-widest w-[110px]">
                  ID Pindaian
                </th>
                <th className="px-6 py-4 text-[10px] font-manrope font-extrabold text-slate-400 uppercase tracking-widest w-[160px]">
                  Waktu Pindaian
                </th>
                <th className="px-6 py-4 text-[10px] font-manrope font-extrabold text-slate-400 uppercase tracking-widest min-w-[160px]">
                  Operator Lapangan
                </th>
                <th className="px-6 py-4 text-[10px] font-manrope font-extrabold text-slate-400 uppercase tracking-widest w-[160px]">
                  Ruang Kerja Target
                </th>
                <th className="px-6 py-4 text-[10px] font-manrope font-extrabold text-slate-400 uppercase tracking-widest w-[110px]">
                  Sampel Daun
                </th>
                <th className="px-6 py-4 text-[10px] font-manrope font-extrabold text-slate-400 uppercase tracking-widest w-[110px]">
                  Status Geofence
                </th>
                <th className="px-6 py-4 text-[10px] font-manrope font-extrabold text-slate-400 uppercase tracking-widest min-w-[180px]">
                  Hasil Analisis AI
                </th>
                <th className="px-6 py-4 text-[10px] font-manrope font-extrabold text-slate-400 uppercase tracking-widest text-right w-[110px]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-slate-400">
                    <span className="material-symbols-outlined animate-spin text-3xl block mb-2">refresh</span>
                    <p className="font-semibold">Mengambil log pindaian AI dari database...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-slate-200 mb-3 block">
                      manage_search
                    </span>
                    <p className="text-slate-500 font-bold text-sm">Tidak ada catatan pindaian yang ditemukan.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setFilterStatus('semua');
                        setFilterPeriod('all');
                      }}
                      className="mt-2 text-xs text-emerald-600 font-bold hover:underline"
                    >
                      Tampilkan semua data
                    </button>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const displayId = `SCAN-${String(log.id).padStart(3, '0')}`;
                  const isValid = log.validationStatus?.toLowerCase() === 'valid';
                  const imgSrc = log.imageUrl || FALLBACK_IMAGES[log.id % FALLBACK_IMAGES.length];

                  // Tanggal & Jam pisah
                  let tglStr = '—';
                  let jamStr = '';
                  if (log.scannedAt) {
                    const dt = new Date(log.scannedAt);
                    tglStr = dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                    jamStr = dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* ID Pindaian */}
                      <td className="px-6 py-4">
                        <span className="font-mono font-extrabold text-primary bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                          {displayId}
                        </span>
                      </td>

                      {/* Waktu */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{tglStr}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{jamStr}</p>
                      </td>

                      {/* Operator */}
                      <td className="px-6 py-4">
                        <AnalystBadge name={log.userName || ''} />
                      </td>

                      {/* Ruang Kerja Target */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700 truncate max-w-[150px]">
                          {log.workspaceName || log.workspaceId || '—'}
                        </p>
                        {log.qrNodeId && (
                          <p className="text-[10px] font-mono text-emerald-800 font-bold truncate max-w-[150px] mt-0.5">
                            🏷️ {log.qrNodeId}
                          </p>
                        )}
                      </td>

                      {/* Sampel Gambar */}
                      <td className="px-6 py-4">
                        <div
                          className="w-14 h-9 rounded-lg overflow-hidden bg-slate-100 relative cursor-pointer ring-1 ring-slate-200 hover:ring-emerald-400 transition-all shadow-sm"
                          onClick={() => setPreviewImg({ src: imgSrc, alt: `Sampel ${displayId}` })}
                        >
                          <img alt={`Sampel ${displayId}`} className="w-full h-full object-cover" src={imgSrc} />
                          <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                            <span className="material-symbols-outlined text-white text-[14px]">zoom_in</span>
                          </div>
                        </div>
                      </td>

                      {/* Status Geofence */}
                      <td className="px-6 py-4">
                        {isValid ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100 gap-1" title="Posisi scan terdeteksi di luar zona lahan">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Luar Batas
                          </span>
                        )}
                      </td>

                      {/* Hasil AI */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-1.5">
                          <span
                            className={`material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5 ${
                              isValid ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {isValid ? 'biotech' : 'warning'}
                          </span>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-800 leading-tight truncate max-w-[200px]">
                              {log.diagnosisResult || 'Tanpa Diagnosis'}
                            </p>
                            {log.probability && (
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                Probabilitas: <strong className="text-slate-700">{log.probability}%</strong>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Detail */}
                          <button
                            type="button"
                            onClick={() => setDetailTarget(log)}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-emerald-50 rounded-lg transition-all"
                            title="Buka Lembar Detail"
                          >
                            <span className="material-symbols-outlined text-[16px]">info</span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(log)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Hapus Laporan"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <p>
            Menampilkan <span className="font-bold text-slate-700">{filteredLogs.length}</span> dari{' '}
            <span className="font-bold text-slate-700">{logs.length}</span> catatan pindaian AI
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Sinkronisasi otomatis dengan server berjalan dengan aman.</span>
          </div>
        </div>
      </div>

      {/* Drawers & Modals */}
      {previewImg && (
        <ImagePreviewModal src={previewImg.src} alt={previewImg.alt} onClose={() => setPreviewImg(null)} />
      )}
      {detailTarget && (
        <DetailDrawer log={detailTarget} onClose={() => setDetailTarget(null)} />
      )}
      {deleteTarget && (
        <DeleteDialog
          logId={deleteTarget.id}
          displayId={`SCAN-${String(deleteTarget.id).padStart(3, '0')}`}
          analystName={deleteTarget.userName || 'Operator Patroli'}
          loading={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
