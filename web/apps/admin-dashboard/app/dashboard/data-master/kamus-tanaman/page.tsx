'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { savePlantAction, deletePlantAction, getPlantsAction } from '@/app/actions/master-data.actions';

// ── Types ──────────────────────────────────────────────────────────────────────
type Kategori = 'Sayuran' | 'Buah' | 'Palawija' | 'Umbi-umbian' | 'Rempah' | 'Perkebunan' | 'Hias';
type RisikoPenyakit = 'Tinggi' | 'Sedang' | 'Rendah';

type Tanaman = {
  id: string;
  namaLokal: string;
  namaIlmiah: string;
  kategori: Kategori;
  risikoPenyakit: RisikoPenyakit;
  siklusPanen: string;
  habitat: string;
  deskripsi: string;
  hama: { id: string; nama: string }[];
  foto: string;
  ditambahkan: string;
};

// ── Mock Data (tanaman umum perkebunan/pertanian) ─────────────────────────────
const INIT_DATA: Tanaman[] = [];

const KATEGORI_OPTS: Kategori[] = ['Sayuran', 'Buah', 'Palawija', 'Umbi-umbian', 'Rempah', 'Perkebunan', 'Hias'];
const RISIKO_OPTS: RisikoPenyakit[] = ['Tinggi', 'Sedang', 'Rendah'];

// ── Badge helpers ──────────────────────────────────────────────────────────────
function KategoriBadge({ k }: { k: Kategori }) {
  const map: Record<Kategori, string> = {
    'Sayuran': 'bg-emerald-100 text-emerald-800',
    'Buah': 'bg-orange-100 text-orange-800',
    'Palawija': 'bg-yellow-100 text-yellow-800',
    'Umbi-umbian': 'bg-amber-100 text-amber-800',
    'Rempah': 'bg-rose-100 text-rose-800',
    'Perkebunan': 'bg-teal-100 text-teal-800',
    'Hias': 'bg-purple-100 text-purple-800',
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${map[k] || 'bg-slate-100 text-slate-800'}`}>
      {k || 'Lainnya'}
    </span>
  );
}

function RisikoBadge({ r }: { r: RisikoPenyakit }) {
  const map: Record<RisikoPenyakit, { cls: string; dot: string }> = {
    'Tinggi': { cls: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
    'Sedang': { cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    'Rendah': { cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  };
  const { cls, dot } = map[r] || map['Sedang'];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {r}
    </span>
  );
}

// ── CRUD Drawer ────────────────────────────────────────────────────────────────
type DrawerMode = 'view' | 'add' | 'edit';

const EMPTY_FORM: Omit<Tanaman, 'id' | 'ditambahkan'> = {
  namaLokal: '', namaIlmiah: '', kategori: 'Sayuran', risikoPenyakit: 'Sedang',
  siklusPanen: '', habitat: '', deskripsi: '',
  hama: [], foto: '',
};

function TanamanDrawer({
  mode, tanaman, availablePests, onClose, onSave,
}: {
  mode: DrawerMode;
  tanaman: Tanaman | null;
  availablePests: any[];
  onClose: () => void;
  onSave: (data: Tanaman, file: File | null) => void;
}) {
  const [form, setForm] = useState<Omit<Tanaman, 'id' | 'ditambahkan'>>(
    tanaman ? { ...tanaman } : { ...EMPTY_FORM }
  );
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(mode);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const togglePest = (pestId: string, pestName: string) => {
    setForm(prev => {
      const exists = prev.hama.find(p => p.id === pestId);
      if (exists) return { ...prev, hama: prev.hama.filter(p => p.id !== pestId) };
      return { ...prev, hama: [...prev.hama, { id: pestId, nama: pestName }] };
    });
  };

  const handleGenerateAI = async () => {
    if (!form.namaLokal) return;
    setIsGeneratingAI(true);
    try {
      const { generatePlantInfoAction } = await import('@/app/actions/ai-sop.actions');
      const res = await generatePlantInfoAction(form.namaLokal);
      if (res.success && res.data) {
        setForm(prev => ({
          ...prev,
          namaIlmiah: res.data.namaIlmiah || prev.namaIlmiah,
          siklusPanen: res.data.siklusPanen || prev.siklusPanen,
          deskripsi: res.data.deskripsi || prev.deskripsi,
        }));
      } else {
        alert('Gagal menghasilkan data AI: ' + res.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleBlurNamaLokal = () => {
    if (drawerMode === 'add' && form.namaLokal && !form.namaIlmiah && !form.deskripsi) {
      handleGenerateAI();
    }
  };

  const handleSave = () => {
    const saved: Tanaman = {
      ...(tanaman ?? { id: '', ditambahkan: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }),
      ...form,
    };
    onSave(saved, fotoFile);
  };

  const isEditable = drawerMode === 'add' || drawerMode === 'edit';
  const title = drawerMode === 'add' ? 'Tambah Tanaman Baru' : drawerMode === 'edit' ? `Edit: ${form.namaLokal}` : form.namaLokal;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
        onClick={drawerMode === 'view' ? onClose : undefined}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: 'slideInRight 0.25s ease-out' }}>

        {/* Header */}
        <div className={`flex-shrink-0 px-6 py-5 flex items-center justify-between border-b border-slate-100 ${drawerMode === 'edit' ? 'bg-amber-50' : drawerMode === 'add' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${drawerMode === 'edit' ? 'bg-amber-500' : drawerMode === 'add' ? 'bg-emerald-600' : 'bg-primary'}`}>
              <span className="material-symbols-outlined text-white text-[18px]">{drawerMode === 'add' ? 'add' : drawerMode === 'edit' ? 'edit' : 'eco'}</span>
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${drawerMode === 'edit' ? 'text-amber-600' : drawerMode === 'add' ? 'text-emerald-700' : 'text-slate-400'}`}>
                {drawerMode === 'add' ? 'Tambah Baru' : drawerMode === 'edit' ? 'Mode Edit' : 'Detail Tanaman'}
              </p>
              <h2 className="text-base font-manrope font-extrabold text-primary leading-tight">{title}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Photo */}
          {drawerMode === 'view' && form.foto && (
            <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
              <img src={form.foto} alt={form.namaLokal} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Foto URL input (edit/add) */}
          {isEditable && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unggah Foto (Atau URL)</label>
              <div className="flex flex-col gap-2">
                <input type="file" accept="image/*" onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-medium text-slate-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer transition-all" />
                <p className="text-xs text-slate-400 font-bold px-1">Atau gunakan URL Foto:</p>
                <input type="text" name="foto" value={form.foto || ''} onChange={handleInput}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all" />
              </div>
            </div>
          )}

          {/* Nama Lokal + Ilmiah */}
          {isEditable ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lokal</label>
                  {form.namaLokal && (
                    <button type="button" onClick={handleGenerateAI} disabled={isGeneratingAI}
                      className="text-[10px] font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-2 py-0.5 rounded-md flex items-center gap-1 hover:shadow-md transition-all disabled:opacity-50">
                      <span className={`material-symbols-outlined text-[12px] ${isGeneratingAI ? 'animate-spin' : ''}`}>{isGeneratingAI ? 'sync' : 'auto_awesome'}</span>
                      {isGeneratingAI ? 'Generating...' : 'AI Autofill'}
                    </button>
                  )}
                </div>
                <input type="text" name="namaLokal" value={form.namaLokal} onChange={handleInput} onBlur={handleBlurNamaLokal} disabled={isGeneratingAI}
                  placeholder="cth. Padi" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all disabled:opacity-70" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Ilmiah</label>
                <input type="text" name="namaIlmiah" value={form.namaIlmiah} onChange={handleInput} disabled={isGeneratingAI}
                  placeholder="cth. Oryza sativa" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium italic text-slate-700 placeholder:text-slate-300 placeholder:not-italic focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all disabled:opacity-70" />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xl font-manrope font-extrabold text-primary">{form.namaLokal}</p>
              <p className="text-sm italic text-slate-500 font-medium mt-0.5">{form.namaIlmiah}</p>
              <div className="flex items-center gap-2 mt-3">
                <KategoriBadge k={form.kategori} />
                <RisikoBadge r={form.risikoPenyakit} />
              </div>
            </div>
          )}

          {/* Kategori + Risiko */}
          {isEditable && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</label>
                <div className="relative">
                  <select name="kategori" value={form.kategori} onChange={handleInput}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all appearance-none">
                    {KATEGORI_OPTS.map(k => <option key={k}>{k}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Risiko Penyakit</label>
                <div className="relative">
                  <select name="risikoPenyakit" value={form.risikoPenyakit} onChange={handleInput}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all appearance-none">
                    {RISIKO_OPTS.map(r => <option key={r}>{r}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
                </div>
              </div>
            </div>
          )}

          {/* Siklus + Habitat */}
          {isEditable ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Durasi Panen / Keterangan</label>
                <input type="text" name="siklusPanen" value={form.siklusPanen} onChange={handleInput} disabled={isGeneratingAI}
                  placeholder="cth. 3-4 Bulan / Tanaman Hias" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all disabled:opacity-70" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Habitat / Lokasi Tanam</label>
                <input type="text" name="habitat" value={form.habitat} onChange={handleInput}
                  placeholder="cth. Sawah / Lahan Basah" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 mb-1">Durasi Panen / Keterangan</p>
                <p className="text-sm font-bold text-slate-700">{form.siklusPanen}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 mb-1">Habitat</p>
                <p className="text-sm font-bold text-slate-700">{form.habitat}</p>
              </div>
            </div>
          )}

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deskripsi</label>
            {isEditable ? (
              <textarea name="deskripsi" value={form.deskripsi} onChange={handleInput} rows={3} disabled={isGeneratingAI}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all resize-none disabled:opacity-70" />
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed font-medium">{form.deskripsi}</p>
            )}
          </div>

          {/* Penyakit & Hama Terkait */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>coronavirus</span>
              Penyakit / Hama Terkait
            </label>
            {isEditable ? (
              <div className="flex flex-wrap gap-2">
                {availablePests.map(p => {
                  const isSelected = form.hama.some(h => h.id === p.id);
                  return (
                    <button key={p.id} type="button" onClick={() => togglePest(p.id, p.nama)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'}`}>
                      {p.nama}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {form.hama.map(h => (
                  <span key={h.id} className="bg-amber-50 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-lg border border-amber-100">{h.nama}</span>
                ))}
              </div>
            )}
          </div>
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
                <span className="material-symbols-outlined text-[18px]">edit</span>Edit Data
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
                <span className="material-symbols-outlined text-[18px]">save</span>Simpan
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ── Delete Confirm Dialog ──────────────────────────────────────────────────────
function DeleteDialog({ tanaman, onConfirm, onCancel }: { tanaman: Tanaman; onConfirm: () => void; onCancel: () => void }) {
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
              <h3 className="font-manrope font-extrabold text-primary text-base">Hapus Tanaman?</h3>
              <p className="text-xs text-slate-500 mt-0.5">Data yang dihapus tidak dapat dikembalikan.</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl px-4 py-3 mb-5 flex items-center gap-3 border border-slate-100">
            {tanaman.foto ? (
              <img src={tanaman.foto} alt={tanaman.namaLokal} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-slate-400 text-sm">image</span>
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-primary">{tanaman.namaLokal}</p>
              <p className="text-xs italic text-slate-500">{tanaman.namaIlmiah}</p>
            </div>
          </div>
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

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function KamusTanamanPage() {
  const [data, setData] = useState<Tanaman[]>([]);
  const [availablePests, setAvailablePests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('semua');
  const [filterRisiko, setFilterRisiko] = useState<string>('semua');
  const [drawerState, setDrawerState] = useState<{ open: boolean; mode: DrawerMode; tanaman: Tanaman | null }>({ open: false, mode: 'view', tanaman: null });
  const [deleteTarget, setDeleteTarget] = useState<Tanaman | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { getPestsAction } = await import('@/app/actions/master-data.actions');
      const result = await getPlantsAction();
      const pestsRes = await getPestsAction();
      setAvailablePests(pestsRes);

      // Mapping result dari database ke format Tanaman untuk UI
      const mapped = result.map((r: any) => ({
        id: r.id,
        namaLokal: r.namaLokal,
        namaIlmiah: r.namaIlmiah || '',
        kategori: r.kategori || 'Sayuran',
        risikoPenyakit: r.risikoPenyakit || 'Sedang',
        siklusPanen: r.siklusPanen || '',
        habitat: r.habitat || '',
        deskripsi: r.deskripsi || '',
        hama: r.hama || [],
        foto: r.foto || '',
        ditambahkan: r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID') : '',
      }));
      setData(mapped as Tanaman[]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = data.filter(t => {
    const matchSearch = t.namaLokal.toLowerCase().includes(search.toLowerCase()) || t.namaIlmiah.toLowerCase().includes(search.toLowerCase());
    const matchKat = filterKategori === 'semua' || t.kategori === filterKategori;
    const matchRisiko = filterRisiko === 'semua' || t.risikoPenyakit === filterRisiko;
    return matchSearch && matchKat && matchRisiko;
  });

  const handleSave = async (saved: Tanaman, file: File | null) => {
    const formData = new FormData();
    if (saved.id && saved.id !== '') formData.append('id', saved.id);
    formData.append('namaLokal', saved.namaLokal);
    formData.append('namaIlmiah', saved.namaIlmiah);
    formData.append('kategori', saved.kategori);
    formData.append('risikoPenyakit', saved.risikoPenyakit);
    formData.append('siklusPanen', saved.siklusPanen);
    formData.append('habitat', saved.habitat);
    formData.append('deskripsi', saved.deskripsi);
    formData.append('fotoUrl', saved.foto);
    formData.append('pestIds', JSON.stringify(saved.hama.map(h => h.id)));
    if (file) formData.append('fotoFile', file);

    const res = await savePlantAction(formData);
    if (res.success) {
      fetchData();
      setDrawerState(s => ({ ...s, open: false }));
    } else {
      alert('Gagal menyimpan tanaman: ' + res.error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deletePlantAction(deleteTarget.id);
    if (res.success) {
      fetchData();
      setDeleteTarget(null);
    } else {
      alert('Gagal menghapus tanaman: ' + res.error);
    }
  };

  const openDrawer = (mode: DrawerMode, tanaman: Tanaman | null = null) =>
    setDrawerState({ open: true, mode, tanaman });

  // Stats
  const totalTinggi = data.filter(t => t.risikoPenyakit === 'Tinggi').length;

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto w-full pb-16">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-manrope font-extrabold text-primary tracking-tight">Kamus Tanaman</h1>
          <p className="text-slate-500 mt-2 font-body max-w-2xl">
            Basis data referensi tanaman untuk sistem deteksi AI. Berisi informasi morfologi, kategori, serta daftar hama dan penyakit yang sering menyerang.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openDrawer('add')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl font-semibold shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-95 transition-all text-sm whitespace-nowrap self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Tambah Tanaman
        </button>
      </div>

      {/* Sub-nav Tabs */}
      <div className="flex gap-8 border-b border-slate-200">
        <Link href="/dashboard/data-master/kamus-tanaman" className="pb-4 text-sm font-bold text-primary relative">
          Kamus Tanaman
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
        </Link>
        <Link href="/dashboard/data-master/kamus-penyakit-hama" className="pb-4 text-sm font-semibold text-slate-400 hover:text-primary transition-colors">
          Kamus Penyakit &amp; Hama
        </Link>
        <Link href="/dashboard/data-master/sop-penanganan" className="pb-4 text-sm font-semibold text-slate-400 hover:text-primary transition-colors">
          Panduan SOP
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tanaman', value: data.length, icon: 'eco', color: 'text-primary', bg: 'bg-emerald-50' },
          { label: 'Risiko Tinggi', value: totalTinggi, icon: 'warning', color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Jenis Kategori', value: KATEGORI_OPTS.length, icon: 'category', color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Diperbarui', value: 'Hari Ini', icon: 'sync', color: 'text-teal-600', bg: 'bg-teal-50' },
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
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama tanaman..."
            className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm w-full focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>

        {/* Kategori filter */}
        <div className="relative">
          <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl pl-4 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all">
            <option value="semua">Semua Kategori</option>
            {KATEGORI_OPTS.map(k => <option key={k}>{k}</option>)}
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
        </div>

        {/* Risiko filter */}
        <div className="relative">
          <select value={filterRisiko} onChange={e => setFilterRisiko(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl pl-4 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all">
            <option value="semua">Semua Risiko</option>
            {RISIKO_OPTS.map(r => <option key={r}>{r}</option>)}
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
        </div>

        <p className="text-xs text-slate-400 font-medium ml-auto">{filtered.length} tanaman ditemukan</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Foto</th>
                <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nama Tanaman</th>
                <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kategori</th>
                <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Risiko Penyakit</th>
                <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hama / Penyakit Utama</th>
                <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">search_off</span>
                  <p className="text-slate-500 font-bold">Tidak ada tanaman yang cocok</p>
                  <button type="button" onClick={() => { setSearch(''); setFilterKategori('semua'); setFilterRisiko('semua'); }}
                    className="mt-2 text-xs text-emerald-600 font-bold hover:underline">Reset filter</button>
                </td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-100 shadow-sm flex-shrink-0 bg-slate-50 flex items-center justify-center">
                      {t.foto ? (
                        <img src={t.foto} alt={t.namaLokal} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-slate-300">image</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 min-w-[160px]">
                    <p className="text-sm font-bold text-primary">{t.namaLokal}</p>
                    <p className="text-xs italic text-slate-400 mt-0.5">{t.namaIlmiah}</p>
                  </td>
                  <td className="px-4 py-4"><KategoriBadge k={t.kategori} /></td>
                  <td className="px-4 py-4"><RisikoBadge r={t.risikoPenyakit} /></td>
                  <td className="px-4 py-4 max-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {t.hama.slice(0, 2).map(h => (
                        <span key={h.id} className="text-[10px] bg-red-50 text-red-600 font-semibold px-2 py-0.5 rounded-md border border-red-100">{h.nama}</span>
                      ))}
                      {t.hama.length > 2 && <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-md">+{t.hama.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button type="button" title="Lihat Detail" onClick={() => openDrawer('view', t)}
                        className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-emerald-50 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      <button type="button" title="Edit" onClick={() => openDrawer('edit', t)}
                        className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button type="button" title="Hapus" onClick={() => setDeleteTarget(t)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination row */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Menampilkan <span className="font-bold text-primary">{filtered.length}</span> dari <span className="font-bold text-primary">{data.length}</span> tanaman
          </p>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-lg bg-primary text-white text-xs font-bold shadow-sm">1</button>
            <button className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors">2</button>
            <button className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Drawer */}
      {drawerState.open && (
        <TanamanDrawer
          mode={drawerState.mode}
          tanaman={drawerState.tanaman}
          availablePests={availablePests}
          onClose={() => setDrawerState(s => ({ ...s, open: false }))}
          onSave={handleSave}
        />
      )}

      {/* Delete dialog */}
      {deleteTarget && (
        <DeleteDialog
          tanaman={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
