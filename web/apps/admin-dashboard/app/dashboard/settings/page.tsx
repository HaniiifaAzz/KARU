'use client';

import React, { useState, useEffect } from 'react';
import { getSystemSettingsAction, updateSystemSettingsAction } from '@/app/actions/settings.actions';
import { uploadFileAction } from '@/app/actions/upload.actions';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'identitas' | 'branding' | 'preferensi'>('identitas');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const res = await getSystemSettingsAction();
      if (res.success) {
        setSettings(res.data);
        setLogoPreview(res.data?.logoUrl || null);
      }
      setIsLoading(false);
    }
    loadSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setSettings((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await uploadFileAction(formData, 'system');
    if (res.success) {
      setSettings((prev: any) => ({ ...prev, logoUrl: res.url }));
      toast.success('Logo berhasil diunggah.');
    } else {
      toast.error(res.message || 'Gagal mengunggah logo.');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await updateSystemSettingsAction(settings);
    if (res.success) {
      toast.success('Pengaturan sistem berhasil diperbarui.');
    } else {
      toast.error(res.error || 'Gagal menyimpan pengaturan.');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-4xl text-emerald-600">refresh</span>
          <p className="text-sm font-bold text-slate-400">Memuat konfigurasi sistem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1200px] mx-auto w-full pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline-variant/10 pb-6">
        <div>
          <h1 className="text-3xl font-manrope font-extrabold text-emerald-950 tracking-tight font-headline">
            Pengaturan Sistem
          </h1>
          <p className="text-slate-500 mt-1 max-w-xl text-sm md:text-base">
            Kelola identitas aplikasi, branding visual, dan preferensi operasional platform KARU secara terpusat.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          {isSaving ? (
             <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
          ) : (
            <span className="material-symbols-outlined text-[20px]">save</span>
          )}
          Simpan Perubahan
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Tabs (Sidebar style on Large) */}
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab('identitas')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'identitas' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined">info</span>
            Identitas Sistem
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'branding' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined">palette</span>
            Branding & Visual
          </button>
          <button
            onClick={() => setActiveTab('preferensi')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'preferensi' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined">settings_suggest</span>
            Preferensi Global
          </button>
        </div>

        {/* Tab Panels */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
          {activeTab === 'identitas' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-slate-50 pb-4 mb-2">
                <h3 className="text-lg font-bold text-slate-800">Identitas Aplikasi</h3>
                <p className="text-xs text-slate-500">Informasi dasar yang muncul di judul halaman dan metadata.</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Nama Aplikasi / Situs</label>
                  <input
                    type="text"
                    name="siteName"
                    value={settings.siteName || ''}
                    onChange={handleChange}
                    placeholder="Contoh: KARU - Plant Monitoring"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Deskripsi Sistem</label>
                  <textarea
                    name="siteDescription"
                    value={settings.siteDescription || ''}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Jelaskan tujuan atau slogan aplikasi ini..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Email Kontak Admin</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={settings.contactEmail || ''}
                    onChange={handleChange}
                    placeholder="punyanyahanipa@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-slate-50 pb-4 mb-2">
                <h3 className="text-lg font-bold text-slate-800">Visual Branding</h3>
                <p className="text-xs text-slate-500">Kelola aset visual utama yang merepresentasikan identitas brand.</p>
              </div>

              <div className="space-y-8">
                {/* Logo Section */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-full md:w-48 h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden flex items-center justify-center relative group">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo Preview" className="max-w-full max-h-full object-contain p-4" />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-slate-300">image</span>
                    )}
                    <div className="absolute inset-0 bg-emerald-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <label className="cursor-pointer bg-white px-4 py-2 rounded-full text-xs font-bold text-emerald-950 shadow-lg active:scale-90 transition-transform">
                        Ganti Logo
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4 pt-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Logo Utama Aplikasi</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Gunakan logo dengan format PNG transparan atau SVG untuk hasil terbaik di berbagai latar belakang. Rekomendasi rasio 1:1 atau horizontal pendek.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => { setLogoPreview(null); setSettings((p:any)=>({...p, logoUrl: null})); }}
                        className="text-[10px] font-bold text-rose-600 hover:underline"
                      >
                        Hapus Logo
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">URL Favicon (Ikon Tab)</label>
                  <input
                    type="text"
                    name="faviconUrl"
                    value={settings.faviconUrl || ''}
                    onChange={handleChange}
                    placeholder="https://example.com/favicon.ico"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferensi' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-slate-50 pb-4 mb-2">
                <h3 className="text-lg font-bold text-slate-800">Preferensi Global</h3>
                <p className="text-xs text-slate-500">Konfigurasi operasional dan tampilan tambahan sistem.</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Mode Pemeliharaan (Maintenance)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Jika aktif, sistem hanya bisa diakses oleh administrator.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="maintenanceMode"
                      checked={settings.maintenanceMode || false}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Teks Kaki (Footer Text)</label>
                  <input
                    type="text"
                    name="footerText"
                    value={settings.footerText || ''}
                    onChange={handleChange}
                    placeholder="© 2026 KARU System. All rights reserved."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
