'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getWorkspacesAction, deleteWorkspaceAction, updateWorkspaceAction } from '@/app/actions/workspace.actions';
import { getAllBatchesAction } from '@/app/actions/qr-node.actions';

// ── Type dari database ─────────────────────────────────────────────────────────
type WorkspaceItem = {
    id: string;
    name: string;
    category: string | null;
    status: string | null;
    priority: string | null;
    image: string | null;
    description: string | null;
    areaInfo: string | null;
    createdAt: Date | null;
};

// ── Badge helpers ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string | null }) {
    const map: Record<string, string> = {
        Aktif: 'bg-emerald-100 text-emerald-700', aktif: 'bg-emerald-100 text-emerald-700',
        Perencanaan: 'bg-blue-100 text-blue-700', perencanaan: 'bg-blue-100 text-blue-700',
        Ditangguhkan: 'bg-amber-100 text-amber-700', ditangguhkan: 'bg-amber-100 text-amber-700',
    };
    const s = status ?? '-';
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${map[s] ?? 'bg-slate-100 text-slate-500'}`}>{s}</span>;
}

function PriorityBadge({ priority }: { priority: string | null }) {
    const map: Record<string, string> = {
        Normal: 'bg-slate-100 text-slate-500', normal: 'bg-slate-100 text-slate-500',
        Tinggi: 'bg-amber-100 text-amber-600', tinggi: 'bg-amber-100 text-amber-600',
        Kritis: 'bg-rose-100 text-rose-600', kritis: 'bg-rose-100 text-rose-600',
    };
    const icons: Record<string, string> = { normal: 'radio_button_unchecked', tinggi: 'priority_high', kritis: 'emergency' };
    const p = priority ?? 'Normal';
    const lc = p.toLowerCase();
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${map[p] ?? 'bg-slate-100 text-slate-500'}`}>
            <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icons[lc] ?? 'radio_button_unchecked'}</span>
            {p}
        </span>
    );
}

// ── Delete Dialog ──────────────────────────────────────────────────────────────
function DeleteDialog({ name, onConfirm, onCancel, loading }: { name: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
    return <>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[3px] z-[60]" onClick={loading ? undefined : onCancel} />
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" style={{ animation: 'scaleIn 0.18s ease-out' }}>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-rose-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>delete</span>
                    </div>
                    <div>
                        <h3 className="font-manrope font-extrabold text-primary text-base">Hapus Ruang Kerja?</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Tindakan ini tidak bisa dibatalkan.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-5">
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">workspaces</span>
                    <div>
                        <p className="text-sm font-bold text-slate-700">{name}</p>
                        <p className="text-xs text-slate-400">Beserta semua batas zona yang terdaftar.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button type="button" disabled={loading} onClick={onCancel} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 disabled:opacity-50">Batal</button>
                    <button type="button" disabled={loading} onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-md disabled:opacity-70 flex items-center justify-center gap-2">
                        {loading ? <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Menghapus...</> : 'Ya, Hapus'}
                    </button>
                </div>
            </div>
        </div>
        <style>{`@keyframes scaleIn{from{transform:scale(0.9);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </>;
}

// ── Detail Drawer ──────────────────────────────────────────────────────────────
function DetailDrawer({ ws, onClose, onDeleted, onUpdated }: { ws: WorkspaceItem; onClose: () => void; onDeleted: (id: string) => void; onUpdated: (u: WorkspaceItem) => void }) {
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [form, setForm] = useState({ name: ws.name, description: ws.description ?? '', status: ws.status ?? 'Aktif', priority: ws.priority ?? 'Normal' });
    const [coverImage, setCoverImage] = useState<string | null>(ws.image);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');

    // State Node Terdaftar
    const [wsBatches, setWsBatches] = useState<any[]>([]);
    const [isLoadingNodes, setIsLoadingNodes] = useState(true);

    useEffect(() => {
        async function fetchNodes() {
            setIsLoadingNodes(true);
            const r = await getAllBatchesAction();
            if (r.success) {
                const all = r.data as any[];
                setWsBatches(all.filter(b => b.workspaceId === ws.id));
            }
            setIsLoadingNodes(false);
        }
        fetchNodes();
    }, [ws.id]);

    const handleImageFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => setCoverImage(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const catLabel = ws.category === 'makro' ? 'Lahan Makro' : ws.category === 'mikro' ? 'Lahan Mikro' : ws.category ?? '-';
    const catColor = ws.category === 'makro' ? 'bg-emerald-500/80 text-white' : 'bg-violet-500/80 text-white';

    const handleDelete = async () => {
        setIsDeleting(true);
        const r = await deleteWorkspaceAction(ws.id);
        setIsDeleting(false);
        if (r.success) { onDeleted(ws.id); onClose(); }
        else { setShowDelete(false); setError(r.error ?? 'Gagal menghapus'); }
    };

    const handleSave = async () => {
        setIsSaving(true); setError('');
        const r = await updateWorkspaceAction(ws.id, { ...form, image: coverImage || undefined });
        setIsSaving(false);
        if (r.success) { onUpdated({ ...ws, ...form, image: coverImage }); setMode('view'); }
        else setError(r.error ?? 'Gagal menyimpan');
    };

    const createdLabel = ws.createdAt
        ? new Date(ws.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
        : '—';

    return <>
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40" onClick={mode === 'view' ? onClose : undefined} />
        <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col overflow-hidden" style={{ animation: 'slideInRight 0.25s ease-out' }}>

            {/* Cover */}
            <div className="relative h-48 flex-shrink-0 bg-slate-200 overflow-hidden">
                {(mode === 'edit' ? coverImage : ws.image)
                    ? <img src={(mode === 'edit' ? coverImage : ws.image)!} alt={ws.name} className={`w-full h-full object-cover ${mode === 'edit' ? 'brightness-75' : ''}`} />
                    : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100">
                        <span className="material-symbols-outlined text-6xl text-slate-300">landscape</span>
                    </div>
                }
                {/* Edit mode overlay — tombol ganti foto */}
                {mode === 'edit' && (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-2 hover:bg-black/20 transition-colors group">
                        <div className="w-10 h-10 bg-white/90 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-slate-600 text-[20px]">add_photo_alternate</span>
                        </div>
                        <span className="text-[11px] font-bold text-white drop-shadow">Ganti Foto Cover</span>
                    </button>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute top-4 left-5">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest backdrop-blur-md ${mode === 'edit' ? 'bg-amber-500/90 text-white' : catColor}`}>
                        {mode === 'edit' ? '✏ Mode Edit' : catLabel}
                    </span>
                </div>
                <button type="button" onClick={mode === 'view' ? onClose : () => setMode('view')} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
                <div className="absolute bottom-5 left-5 right-5 pointer-events-none">
                    <h2 className="text-xl font-manrope font-extrabold text-white tracking-tight">{ws.name}</h2>
                    {mode === 'view' && <div className="flex items-center gap-2 mt-2">
                        <StatusBadge status={ws.status} />
                        <PriorityBadge priority={ws.priority} />
                    </div>}
                </div>
            </div>

            {/* Error */}
            {error && <div className="bg-rose-50 border-b border-rose-200 px-5 py-2.5 text-xs font-semibold text-rose-700 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">error</span>{error}</div>}

            {/* Body — VIEW MODE */}
            {mode === 'view' && <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Info tiles */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Luas Area', val: ws.areaInfo ?? '—', icon: 'straighten', color: 'text-emerald-600' },
                        { label: 'Kategori', val: catLabel, icon: 'category', color: 'text-violet-600' },
                        { label: 'Dibuat', val: createdLabel, icon: 'calendar_today', color: 'text-sky-600' },
                    ].map(c => (
                        <div key={c.label} className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                            <span className={`material-symbols-outlined text-[18px] ${c.color} mb-1 block`} style={{ fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{c.label}</p>
                            <p className="text-xs font-manrope font-extrabold text-primary leading-tight">{c.val}</p>
                        </div>
                    ))}
                </div>

                {/* Description */}
                <section>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Deskripsi</p>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{ws.description ?? 'Belum ada deskripsi.'}</p>
                </section>

                {/* Set Node QR Terdaftar */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Set Node QR Terdaftar</p>
                        <Link href="/dashboard/qr-node" onClick={onClose} className="text-xs font-bold text-emerald-700 hover:text-emerald-600 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>Kelola Node
                        </Link>
                    </div>
                    {isLoadingNodes ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400">
                            <span className="material-symbols-outlined animate-spin text-[18px] block mb-1">refresh</span>
                            Memuat data stiker QR Node...
                        </div>
                    ) : wsBatches.length === 0 ? (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-5 flex items-center gap-4">
                            <span className="material-symbols-outlined text-3xl text-slate-300">qr_code_2</span>
                            <div>
                                <p className="text-sm font-bold text-slate-500">Belum ada node stiker QR</p>
                                <p className="text-xs text-slate-400 mt-0.5">Generate set node QR baru untuk ruang kerja ini di halaman QR Node.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                            {wsBatches.map(b => (
                                <div key={b.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-emerald-200 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                                            QR
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-mono font-extrabold text-slate-800 truncate">{b.id}</p>
                                            <p className="text-[10px] text-slate-500 truncate">Zona: {b.zone || 'Ruang Utama'} • <strong className="text-slate-700">{b.nodeCount} Nodes</strong></p>
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0 ${b.status?.toLowerCase() === 'dicetak' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {b.status || 'Belum Dicetak'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Map info */}
                <section>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Informasi Spasial</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-9 h-9 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-[18px] text-slate-400">map</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-600">Batas Geofencing</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Zona tersimpan dalam format PostGIS (SRID 4326)</p>
                        </div>
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md uppercase tracking-wider whitespace-nowrap">WKT Aktif</span>
                    </div>
                </section>
            </div>}

            {/* Body — EDIT MODE */}
            {mode === 'edit' && <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-500 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
                    <p className="text-xs font-semibold text-amber-800">Anda sedang mengedit data workspace ini.</p>
                </div>

                {/* Upload Foto Cover */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Foto Cover <span className="text-slate-300 font-normal normal-case">(opsional)</span>
                    </label>
                    {coverImage ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 h-32 group">
                            <img src={coverImage} alt="preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-1.5 bg-white/90 text-slate-700 rounded-lg text-xs font-bold hover:bg-white">Ganti</button>
                                <button type="button" onClick={() => setCoverImage(null)}
                                    className="px-3 py-1.5 bg-rose-500/90 text-white rounded-lg text-xs font-bold hover:bg-rose-500">Hapus</button>
                            </div>
                        </div>
                    ) : (
                        <div onClick={() => fileInputRef.current?.click()}
                            className="rounded-xl border-2 border-dashed border-slate-200 h-28 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all">
                            <span className="material-symbols-outlined text-slate-300 text-[32px]">add_photo_alternate</span>
                            <p className="text-xs font-semibold text-slate-400">Klik untuk unggah foto cover</p>
                        </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Ruang Kerja</label>
                    <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deskripsi</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                        <div className="relative">
                            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 appearance-none">
                                <option>Aktif</option><option>Perencanaan</option><option>Ditangguhkan</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prioritas</label>
                        <div className="relative">
                            <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 appearance-none">
                                <option>Normal</option><option>Tinggi</option><option>Kritis</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
                        </div>
                    </div>
                </div>
            </div>}

            {/* Footer */}
            {mode === 'view' ? (
                <div className="flex-shrink-0 p-5 border-t border-slate-100 flex gap-3">
                    <button type="button" onClick={() => setShowDelete(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-rose-100 text-rose-500 hover:bg-rose-50 rounded-xl text-sm font-bold transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>Hapus
                    </button>
                    <button type="button" onClick={() => setMode('edit')} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-md hover:brightness-105 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-[18px]">edit</span>Edit Ruang Kerja
                    </button>
                </div>
            ) : (
                <div className="flex-shrink-0 p-5 border-t border-slate-100 flex gap-3">
                    <button type="button" onClick={() => setMode('view')} disabled={isSaving} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-bold disabled:opacity-50">
                        <span className="material-symbols-outlined text-[18px]">undo</span>Batal
                    </button>
                    <button type="button" onClick={handleSave} disabled={isSaving} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-md hover:brightness-105 active:scale-95 disabled:opacity-50">
                        {isSaving ? <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
                        {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            )}
        </div>

        {showDelete && <DeleteDialog name={ws.name} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={isDeleting} />}
        <style>{`@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </>;
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function WorkspacePage() {
    const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWs, setSelectedWs] = useState<WorkspaceItem | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        const r = await getWorkspacesAction();
        if (r.success) setWorkspaces(r.data as WorkspaceItem[]);
        setIsLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDeleted = (id: string) => setWorkspaces(p => p.filter(w => w.id !== id));
    const handleUpdated = (u: WorkspaceItem) => { setWorkspaces(p => p.map(w => w.id === u.id ? u : w)); setSelectedWs(u); };

    // Stats dihitung dari data real
    const totalArea = workspaces.reduce((sum, ws) => {
        const m = ws.areaInfo?.match(/[\d.]+/);
        return m ? sum + parseFloat(m[0]) : sum;
    }, 0);

    const stats = [
        { label: 'Proyek Aktif', value: isLoading ? '...' : workspaces.filter(w => ['aktif', 'Aktif'].includes(w.status ?? '')).length, icon: 'check_circle', bg: 'bg-emerald-50', color: 'text-emerald-700', border: 'border-emerald-100' },
        { label: 'Total Workspace', value: isLoading ? '...' : workspaces.length, icon: 'workspaces', bg: 'bg-teal-50', color: 'text-teal-700', border: 'border-teal-100' },
        { label: 'Cakupan Lahan (m²)', value: isLoading ? '...' : totalArea.toFixed(1), icon: 'straighten', bg: 'bg-sky-50', color: 'text-sky-700', border: 'border-sky-100' },
        { label: 'Lahan Makro', value: isLoading ? '...' : workspaces.filter(w => w.category === 'makro').length, icon: 'landscape', bg: 'bg-violet-50', color: 'text-violet-700', border: 'border-violet-100' },
    ];

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full pb-20">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline-variant/10 pb-6">
                <div>
                    <h1 className="text-3xl font-manrope font-extrabold text-emerald-950 tracking-tight">Manajemen Ruang Kerja</h1>
                    <p className="text-slate-500 mt-1 max-w-xl">Kelola zona monitoring — gambar batas lahan, pantau status, dan hubungkan node sensor.</p>
                </div>
                <Link href="/dashboard/workspace/buat"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-950/10 hover:shadow-emerald-950/20 transition-all active:scale-95 whitespace-nowrap">
                    <span className="material-symbols-outlined text-[18px]">add</span>Buat Ruang Kerja
                </Link>
            </div>

            {/* Stats Cards — gaya users-access */}
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

            {/* Content */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <span className="material-symbols-outlined text-5xl text-emerald-400 animate-spin">refresh</span>
                    <p className="text-slate-500 font-semibold">Memuat data workspace...</p>
                </div>
            ) : workspaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300">workspaces</span>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-manrope font-bold text-slate-600">Belum Ada Ruang Kerja</p>
                        <p className="text-sm text-slate-400 mt-1">Mulai dengan membuat ruang kerja pertama dan gambar batas zonanya di peta.</p>
                    </div>
                    <Link href="/dashboard/workspace/buat"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl font-semibold shadow-lg active:scale-95 transition-all text-sm">
                        <span className="material-symbols-outlined">add</span>Buat Ruang Kerja Pertama
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {workspaces.map(ws => (
                        <div key={ws.id} className="group bg-surface-container-lowest rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-300 border border-outline-variant/10 flex flex-col">

                            {/* Card Image */}
                            <div className="relative h-48 overflow-hidden bg-slate-100">
                                {ws.image
                                    ? <img alt={ws.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={ws.image} />
                                    : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100">
                                        <span className="material-symbols-outlined text-5xl text-slate-300">landscape</span>
                                    </div>
                                }
                                <div className="absolute top-4 left-4">
                                    <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-md uppercase tracking-widest shadow-sm ${ws.category === 'makro' ? 'bg-primary/90 text-white' : 'bg-secondary text-white'}`}>
                                        {ws.category === 'makro' ? 'Lahan Makro' : ws.category === 'mikro' ? 'Lahan Mikro' : ws.category ?? '-'}
                                    </span>
                                </div>
                                {ws.areaInfo && (
                                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                                        <span className="material-symbols-outlined text-emerald-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>straighten</span>
                                        <span className="text-xs font-bold text-primary">{ws.areaInfo}</span>
                                    </div>
                                )}
                            </div>

                            {/* Card Body */}
                            <div className="p-6 flex flex-col flex-grow">
                                <h3 className="text-xl font-manrope font-extrabold text-primary mb-2">{ws.name}</h3>
                                <div className="flex items-center gap-2 mb-4">
                                    <StatusBadge status={ws.status} />
                                    <PriorityBadge priority={ws.priority} />
                                </div>
                                <p className="text-sm text-on-surface-variant line-clamp-2 mb-6 font-medium leading-relaxed">{ws.description ?? 'Belum ada deskripsi.'}</p>
                                <div className="mt-auto pt-5 border-t border-surface-container flex items-center justify-between">
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        {ws.createdAt ? new Date(ws.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
                                    </p>
                                    <button type="button" onClick={() => setSelectedWs(ws)}
                                        className="text-sm font-bold text-primary hover:text-emerald-600 transition-colors flex items-center gap-1 group/btn px-2 py-1 rounded-lg hover:bg-emerald-50">
                                        Lihat Detail
                                        <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add New Card */}
                    <Link href="/dashboard/workspace/buat"
                        className="border-2 border-dashed border-outline-variant/30 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-emerald-400 hover:bg-emerald-50/20 transition-all min-h-[400px] group/new h-full">
                        <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mb-5 group-hover/new:bg-emerald-100 group-hover/new:scale-110 transition-all duration-300">
                            <span className="material-symbols-outlined text-3xl text-slate-400 group-hover/new:text-emerald-600 transition-colors">add_circle</span>
                        </div>
                        <h3 className="text-xl font-manrope font-bold text-slate-500 group-hover/new:text-emerald-900 transition-colors">Tambah Proyek Baru</h3>
                        <p className="text-sm text-slate-400 text-center mt-2 max-w-[220px] font-medium leading-relaxed">Tentukan batas lahan dan mulai monitoring zona baru.</p>
                    </Link>
                </div>
            )}

            {/* Detail Drawer */}
            {selectedWs && (
                <DetailDrawer ws={selectedWs} onClose={() => setSelectedWs(null)} onDeleted={handleDeleted} onUpdated={handleUpdated} />
            )}
        </div>
    );
}
