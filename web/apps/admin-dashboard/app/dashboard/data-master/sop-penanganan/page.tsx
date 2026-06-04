'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { saveSopAction, deleteSopAction, getSopsAction } from '@/app/actions/master-data.actions';

// ── Types ──────────────────────────────────────────────────────────────────────
type KategoriSOP = 'Pengendalian Hama' | 'Pengendalian Penyakit' | 'Darurat & Mitigasi' | 'Teknis & Perawatan' | 'Preventif';
type UrgensiBadge = 'Segera' | 'Rutin' | 'Preventif';

type SOP = {
  id: string;
  judul: string;
  kategori: KategoriSOP;
  urgensi: UrgensiBadge;
  penyakitHamaTerkait: { id: string; nama: string }[];
  tanamanTarget: { id: string; nama: string }[];
  langkah: string[];                // numbered steps
  pdfUrl: string | null;            // link PDF jika ada
  dibuat: string;
  diupdate: string;
  dibuatOleh: string;
};

// ── Mock Data ──────────────────────────────────────────────────────────────────
const INIT_SOP: SOP[] = [];

// ── Pilihan data ───────────────────────────────────────────────────────────────
const KATEGORI_OPTS: KategoriSOP[] = ['Pengendalian Hama', 'Pengendalian Penyakit', 'Darurat & Mitigasi', 'Teknis & Perawatan', 'Preventif'];
const URGENSI_OPTS: UrgensiBadge[] = ['Segera', 'Rutin', 'Preventif'];



// ── Badge helpers ──────────────────────────────────────────────────────────────
function UrgensiBadgeComp({ u }: { u: UrgensiBadge }) {
  const map: Record<UrgensiBadge, string> = {
    'Segera': 'bg-red-100 text-red-700 border border-red-200',
    'Rutin': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    'Preventif': 'bg-blue-100 text-blue-700 border border-blue-200',
  };
  const icon: Record<UrgensiBadge, string> = {
    'Segera': 'emergency', 'Rutin': 'autorenew', 'Preventif': 'shield',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${map[u]}`}>
      <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon[u]}</span>
      {u}
    </span>
  );
}

function KategoriBadge({ k }: { k: KategoriSOP }) {
  const map: Record<KategoriSOP, string> = {
    'Pengendalian Hama': 'bg-red-50 text-red-700',
    'Pengendalian Penyakit': 'bg-amber-50 text-amber-800',
    'Darurat & Mitigasi': 'bg-rose-50 text-rose-800',
    'Teknis & Perawatan': 'bg-blue-50 text-blue-700',
    'Preventif': 'bg-violet-50 text-violet-700',
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${map[k]}`}>{k}</span>
  );
}

// ── SOP Card ───────────────────────────────────────────────────────────────────
function SOPCard({ sop, onDetail, onEdit, onDelete }: { sop: SOP; onDetail: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      {/* Top row */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <UrgensiBadgeComp u={sop.urgensi} />
        <KategoriBadge k={sop.kategori} />
      </div>

      {/* Title */}
      <h3 className="font-manrope font-extrabold text-primary text-base leading-snug mb-2">{sop.judul}</h3>

      {/* Penyakit/Hama terkait */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {sop.penyakitHamaTerkait.map(p => (
          <span key={p.id} className="text-[10px] font-bold bg-amber-50 border border-amber-100 text-amber-800 px-2 py-0.5 rounded-md">{p.nama}</span>
        ))}
        {sop.tanamanTarget.map(t => (
          <span key={t.id} className="text-[10px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">{t.nama}</span>
        ))}
      </div>

      {/* Step count preview */}
      <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 mb-4">
        {sop.langkah[0]}
      </p>

      {/* Footer */}
      <div className="mt-auto border-t border-slate-100 pt-4 space-y-3">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">format_list_numbered</span>
            {sop.langkah.length} langkah
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">calendar_today</span>
            Update: {sop.diupdate}
          </span>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onDetail}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-sm">
            <span className="material-symbols-outlined text-[14px]">checklist</span>
            Lihat Langkah
          </button>
          {sop.pdfUrl ? (
            <a href={sop.pdfUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 px-3 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-[14px]">download</span>
              PDF
            </a>
          ) : (
            <button type="button" disabled title="Belum ada lampiran PDF"
              className="flex items-center justify-center gap-1 px-3 py-2.5 border border-dashed border-slate-200 text-slate-300 rounded-xl text-xs font-bold cursor-not-allowed">
              <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
              PDF
            </button>
          )}
        </div>

        {/* Edit & Delete */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-amber-200 text-amber-700 rounded-lg text-[11px] font-bold hover:bg-amber-50 transition-colors">
            <span className="material-symbols-outlined text-[13px]">edit</span>Edit
          </button>
          <button type="button" onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-red-200 text-red-500 rounded-lg text-[11px] font-bold hover:bg-red-50 transition-colors">
            <span className="material-symbols-outlined text-[13px]">delete</span>Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Drawer ─────────────────────────────────────────────────────────────────────
type DrawerMode = 'view' | 'add' | 'edit';

const EMPTY_FORM: Omit<SOP, 'id' | 'dibuat' | 'diupdate' | 'dibuatOleh'> = {
  judul: '', kategori: 'Pengendalian Penyakit', urgensi: 'Rutin',
  penyakitHamaTerkait: [], tanamanTarget: [], langkah: [''], pdfUrl: null,
};

function SOPDrawer({ mode, sop, availablePlants, availablePests, onClose, onSave }: { mode: DrawerMode; sop: SOP | null; availablePlants: any[]; availablePests: any[]; onClose: () => void; onSave: (s: SOP) => void }) {
  const [form, setForm] = useState<Omit<SOP, 'id' | 'dibuat' | 'diupdate' | 'dibuatOleh'>>(
    sop ? { judul: sop.judul, kategori: sop.kategori, urgensi: sop.urgensi, penyakitHamaTerkait: sop.penyakitHamaTerkait, tanamanTarget: sop.tanamanTarget, langkah: sop.langkah, pdfUrl: sop.pdfUrl } : { ...EMPTY_FORM, langkah: [''] }
  );
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(mode);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleMultiPest = (valId: string, valNama: string) => {
    setForm(prev => {
      const exists = prev.penyakitHamaTerkait.find(p => p.id === valId);
      if (exists) return { ...prev, penyakitHamaTerkait: prev.penyakitHamaTerkait.filter(p => p.id !== valId) };
      return { ...prev, penyakitHamaTerkait: [...prev.penyakitHamaTerkait, { id: valId, nama: valNama }] };
    });
  };

  const toggleMultiPlant = (valId: string, valNama: string) => {
    setForm(prev => {
      const exists = prev.tanamanTarget.find(t => t.id === valId);
      if (exists) return { ...prev, tanamanTarget: prev.tanamanTarget.filter(t => t.id !== valId) };
      return { ...prev, tanamanTarget: [...prev.tanamanTarget, { id: valId, nama: valNama }] };
    });
  };

  const updateLangkah = (idx: number, val: string) => {
    setForm(prev => { const next = [...prev.langkah]; next[idx] = val; return { ...prev, langkah: next }; });
  };
  const addLangkah = () => setForm(prev => ({ ...prev, langkah: [...prev.langkah, ''] }));
  const removeLangkah = (idx: number) => setForm(prev => ({ ...prev, langkah: prev.langkah.filter((_, i) => i !== idx) }));

  const handleSave = () => {
    const saved: SOP = {
      ...(sop ?? { id: '', dibuat: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }), dibuatOleh: 'Admin' }),
      ...form,
      diupdate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      langkah: form.langkah.filter(l => l.trim()),
    };
    onSave(saved);
  };

  const isEditable = drawerMode === 'add' || drawerMode === 'edit';
  const modeColor = drawerMode === 'edit' ? 'bg-amber-50' : drawerMode === 'add' ? 'bg-emerald-50' : 'bg-slate-50';

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
        onClick={drawerMode === 'view' ? onClose : undefined} />
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: 'slideInRight 0.25s ease-out' }}>

        {/* Header */}
        <div className={`flex-shrink-0 px-6 py-5 flex items-center justify-between border-b border-slate-100 ${modeColor}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${drawerMode === 'edit' ? 'bg-amber-500' : drawerMode === 'add' ? 'bg-emerald-600' : 'bg-primary'}`}>
              <span className="material-symbols-outlined text-white text-[18px]">
                {drawerMode === 'add' ? 'add' : drawerMode === 'edit' ? 'edit' : 'checklist'}
              </span>
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${drawerMode === 'edit' ? 'text-amber-600' : drawerMode === 'add' ? 'text-emerald-700' : 'text-slate-400'}`}>
                {drawerMode === 'add' ? 'SOP Baru' : drawerMode === 'edit' ? 'Mode Edit' : 'Detail SOP'}
              </p>
              <h2 className="text-sm font-manrope font-extrabold text-primary leading-tight line-clamp-1 max-w-[280px]">
                {drawerMode === 'add' ? 'Tambah SOP Baru' : form.judul}
              </h2>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* VIEW MODE */}
          {drawerMode === 'view' && sop && (
            <>
              {/* Badges row */}
              <div className="flex flex-wrap gap-2">
                <UrgensiBadgeComp u={sop.urgensi} />
                <KategoriBadge k={sop.kategori} />
              </div>

              {/* Relasi */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penyakit / Hama Terkait</p>
                <div className="flex flex-wrap gap-1.5">
                  {sop.penyakitHamaTerkait.map(p => <span key={p.id} className="text-xs font-bold bg-amber-50 border border-amber-100 text-amber-800 px-2.5 py-1 rounded-lg">{p.nama}</span>)}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">Tanaman Target</p>
                <div className="flex flex-wrap gap-1.5">
                  {sop.tanamanTarget.map(t => <span key={t.id} className="text-xs font-bold bg-emerald-50 border border-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">{t.nama}</span>)}
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Dibuat', val: sop.dibuat },
                  { label: 'Diperbarui', val: sop.diupdate },
                  { label: 'Oleh', val: sop.dibuatOleh },
                  { label: 'Jumlah Langkah', val: `${sop.langkah.length} langkah` },
                ].map(m => (
                  <div key={m.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400">{m.label}</p>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">{m.val}</p>
                  </div>
                ))}
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Langkah-langkah Penanganan</p>
                {sop.langkah.map((l, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white text-[11px] font-extrabold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{l}</p>
                  </div>
                ))}
              </div>

              {/* PDF */}
              {sop.pdfUrl && (
                <a href={sop.pdfUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 border-2 border-primary/20 text-primary rounded-xl text-sm font-bold hover:bg-primary/5 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Unduh Lampiran PDF
                </a>
              )}
            </>
          )}

          {/* ADD / EDIT MODE */}
          {isEditable && (
            <>
              {/* AI placeholder banner */}
              <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-violet-500 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                  <p className="text-xs font-semibold text-violet-800">Generate langkah-langkah dengan AI</p>
                </div>
                <button type="button" disabled
                  className="px-3 py-1.5 bg-violet-200 text-violet-500 text-[11px] font-bold rounded-lg cursor-not-allowed uppercase tracking-wide">
                  Segera Hadir
                </button>
              </div>

              {/* Judul */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Judul SOP *</label>
                <input type="text" name="judul" value={form.judul} onChange={handleInput}
                  placeholder="cth. Penanganan Blas pada Padi"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all" />
              </div>

              {/* Kategori + Urgensi */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori *</label>
                  <div className="relative">
                    <select name="kategori" value={form.kategori} onChange={handleInput}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all appearance-none">
                      {KATEGORI_OPTS.map(k => <option key={k}>{k}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Urgensi *</label>
                  <div className="relative">
                    <select name="urgensi" value={form.urgensi} onChange={handleInput}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all appearance-none">
                      {URGENSI_OPTS.map(u => <option key={u}>{u}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Penyakit/Hama multi-select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>coronavirus</span>
                  Penyakit / Hama Terkait *
                </label>
                <div className="flex flex-wrap gap-2">
                  {availablePests.map(p => {
                    const isSelected = form.penyakitHamaTerkait.some(ph => ph.id === p.id);
                    return (
                      <button key={p.id} type="button" onClick={() => toggleMultiPest(p.id, p.nama)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'}`}>
                        {p.nama}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tanaman target multi-select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                  Tanaman Target *
                </label>
                <div className="flex flex-wrap gap-2">
                  {availablePlants.map(t => {
                    const isSelected = form.tanamanTarget.some(tt => tt.id === t.id);
                    return (
                      <button key={t.id} type="button" onClick={() => toggleMultiPlant(t.id, t.namaLokal)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'}`}>
                        {t.namaLokal}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Langkah-langkah */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Langkah-langkah Penanganan *</label>
                {form.langkah.map((l, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold flex items-center justify-center mt-2">{i + 1}</span>
                    <textarea value={l} onChange={e => updateLangkah(i, e.target.value)} rows={2}
                      placeholder={`Langkah ke-${i + 1}...`}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all resize-none" />
                    {form.langkah.length > 1 && (
                      <button type="button" onClick={() => removeLangkah(i)}
                        className="flex-shrink-0 w-7 h-7 rounded-lg bg-red-50 border border-red-100 text-red-400 hover:bg-red-100 flex items-center justify-center mt-2 transition-colors">
                        <span className="material-symbols-outlined text-[14px]">remove</span>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addLangkah}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-600 transition-colors pl-9">
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  Tambah Langkah
                </button>
              </div>

              {/* URL PDF Opsional */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  URL Lampiran PDF <span className="font-normal normal-case text-slate-300">(opsional)</span>
                </label>
                <input type="url" name="pdfUrl" value={form.pdfUrl ?? ''} onChange={e => setForm(p => ({ ...p, pdfUrl: e.target.value || null }))}
                  placeholder="https://drive.google.com/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all" />
                <p className="text-[10px] text-slate-400 pl-1">Tempel URL Google Drive, OneDrive, atau link publik lainnya</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-5 border-t border-slate-100 flex gap-3">
          {drawerMode === 'view' ? (
            <>
              <button type="button" onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>Tutup
              </button>
              <button type="button" onClick={() => setDrawerMode('edit')}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-md hover:brightness-105 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-[18px]">edit</span>Edit SOP
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={drawerMode === 'edit' ? () => setDrawerMode('view') : onClose}
                className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
                <span className="material-symbols-outlined text-[18px]">undo</span>Batal
              </button>
              <button type="button" onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-md hover:brightness-105 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-[18px]">save</span>Simpan SOP
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </>
  );
}

// ── Delete Dialog ──────────────────────────────────────────────────────────────
function DeleteDialog({ sop, onConfirm, onCancel }: { sop: SOP; onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[3px] z-50" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" style={{ animation: 'scaleIn 0.18s ease-out' }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-red-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
            </div>
            <div>
              <h3 className="font-manrope font-extrabold text-primary text-base">Hapus SOP?</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tindakan ini tidak bisa dibatalkan.</p>
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-5 line-clamp-2">{sop.judul}</p>
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">Batal</button>
            <button type="button" onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-md">Ya, Hapus</button>
          </div>
        </div>
      </div>
      <style>{`@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </>
  );
}

// ── Halaman Utama ──────────────────────────────────────────────────────────────
export default function SopPenangananPage() {
  const [data, setData] = useState<SOP[]>([]);
  const [availablePlants, setAvailablePlants] = useState<any[]>([]);
  const [availablePests, setAvailablePests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('semua');
  const [filterUrgensi, setFilterUrgensi] = useState('semua');
  const [drawerState, setDrawerState] = useState<{ open: boolean; mode: DrawerMode; sop: SOP | null }>({ open: false, mode: 'view', sop: null });
  const [deleteTarget, setDeleteTarget] = useState<SOP | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { getPlantsAction, getPestsAction } = await import('@/app/actions/master-data.actions');
      const plantsRes = await getPlantsAction();
      const pestsRes = await getPestsAction();
      setAvailablePlants(plantsRes);
      setAvailablePests(pestsRes);

      const result = await getSopsAction();
      const mapped = result.map((r: any) => ({
        id: r.id,
        judul: r.judul,
        kategori: r.kategori || 'Pengendalian Penyakit',
        urgensi: r.urgensi || 'Rutin',
        penyakitHamaTerkait: r.penyakitHamaTerkait || [],
        tanamanTarget: r.tanamanTarget || [],
        langkah: r.langkah || [],
        pdfUrl: r.pdfUrl || null,
        dibuat: r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID') : '',
        diupdate: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('id-ID') : '',
        dibuatOleh: r.createdBy || 'Admin',
      }));
      setData(mapped as SOP[]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = data.filter(s => {
    const matchSearch = s.judul.toLowerCase().includes(search.toLowerCase()) ||
      s.penyakitHamaTerkait.some(p => p.nama.toLowerCase().includes(search.toLowerCase())) ||
      s.tanamanTarget.some(t => t.nama.toLowerCase().includes(search.toLowerCase()));
    const matchKat = filterKategori === 'semua' || s.kategori === filterKategori;
    const matchUrg = filterUrgensi === 'semua' || s.urgensi === filterUrgensi;
    return matchSearch && matchKat && matchUrg;
  });

  const handleSave = async (saved: SOP) => {
    const formData = new FormData();
    if (saved.id && saved.id !== '') formData.append('id', saved.id);
    formData.append('judul', saved.judul);
    formData.append('kategori', saved.kategori);
    formData.append('urgensi', saved.urgensi);
    formData.append('langkah', JSON.stringify(saved.langkah));
    if (saved.pdfUrl) formData.append('pdfUrl', saved.pdfUrl);

    formData.append('plantIds', JSON.stringify(saved.tanamanTarget.map(t => t.id)));
    formData.append('pestIds', JSON.stringify(saved.penyakitHamaTerkait.map(p => p.id)));

    const res = await saveSopAction(formData);
    if (res.success) {
      fetchData();
      setDrawerState(s => ({ ...s, open: false }));
    } else {
      alert('Gagal menyimpan SOP: ' + res.error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteSopAction(deleteTarget.id);
    if (res.success) {
      fetchData();
      setDeleteTarget(null);
    } else {
      alert('Gagal menghapus SOP: ' + res.error);
    }
  };

  const openDrawer = (mode: DrawerMode, sop: SOP | null = null) =>
    setDrawerState({ open: true, mode, sop });

  const totalSegera = data.filter(s => s.urgensi === 'Segera').length;
  const hasPdf = data.filter(s => s.pdfUrl).length;

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto w-full pb-16">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-manrope font-extrabold text-primary tracking-tight">Panduan SOP Penanganan</h1>
          <p className="text-slate-500 mt-2 font-body max-w-2xl">
            Prosedur penanganan terstruktur yang terhubung ke Kamus Penyakit &amp; Hama. Digunakan sebagai acuan tindakan lapangan saat AI mendeteksi serangan.
          </p>
        </div>
        <button type="button" onClick={() => openDrawer('add')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl font-semibold shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-95 transition-all text-sm whitespace-nowrap self-start md:self-auto">
          <span className="material-symbols-outlined text-sm">add</span>
          Tambah SOP Baru
        </button>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-8 border-b border-slate-200">
        <Link href="/dashboard/data-master/kamus-tanaman" className="pb-4 text-sm font-semibold text-slate-400 hover:text-primary transition-colors">Kamus Tanaman</Link>
        <Link href="/dashboard/data-master/kamus-penyakit-hama" className="pb-4 text-sm font-semibold text-slate-400 hover:text-primary transition-colors">Kamus Penyakit &amp; Hama</Link>
        <Link href="/dashboard/data-master/sop-penanganan" className="pb-4 text-sm font-bold text-primary relative">
          Panduan SOP
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total SOP', value: data.length, icon: 'article', color: 'text-primary', bg: 'bg-emerald-50' },
          { label: 'Urgensi Segera', value: totalSegera, icon: 'emergency', color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Ada Lampiran PDF', value: hasPdf, icon: 'picture_as_pdf', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Kategori', value: KATEGORI_OPTS.length, icon: 'category', color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <span className={`material-symbols-outlined text-[22px] ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className={`text-xl font-manrope font-extrabold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari SOP, penyakit, atau tanaman..."
            className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm w-full focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
        </div>
        <div className="relative">
          <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl pl-4 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none appearance-none">
            <option value="semua">Semua Kategori</option>
            {KATEGORI_OPTS.map(k => <option key={k}>{k}</option>)}
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
        </div>
        <div className="relative">
          <select value={filterUrgensi} onChange={e => setFilterUrgensi(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl pl-4 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none appearance-none">
            <option value="semua">Semua Urgensi</option>
            {URGENSI_OPTS.map(u => <option key={u}>{u}</option>)}
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
        </div>
        <p className="text-xs text-slate-400 font-medium ml-auto">{filtered.length} SOP ditemukan</p>
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">search_off</span>
          <p className="text-slate-500 font-bold">Tidak ada SOP yang cocok.</p>
          <button type="button" onClick={() => { setSearch(''); setFilterKategori('semua'); setFilterUrgensi('semua'); }}
            className="mt-2 text-xs text-emerald-600 font-bold hover:underline">Reset filter</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(s => (
            <SOPCard key={s.id} sop={s}
              onDetail={() => openDrawer('view', s)}
              onEdit={() => openDrawer('edit', s)}
              onDelete={() => setDeleteTarget(s)}
            />
          ))}
        </div>
      )}

      {/* Drawer */}
      {drawerState.open && (
        <SOPDrawer mode={drawerState.mode} sop={drawerState.sop}
          availablePlants={availablePlants} availablePests={availablePests}
          onClose={() => setDrawerState(s => ({ ...s, open: false }))}
          onSave={handleSave} />
      )}

      {/* Delete */}
      {deleteTarget && (
        <DeleteDialog sop={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
