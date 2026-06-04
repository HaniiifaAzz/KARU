'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  getCurrentUserProfile,
  updateProfile,
  changePassword,
  uploadProfilePhoto,
} from '@/app/actions/profile.actions';
import { authClient } from '@/lib/auth-client';

// ── Role config ────────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  admin:    { label: 'Admin Utama', color: 'text-violet-700 bg-violet-100 border-violet-200', icon: 'shield_person' },
  operator: { label: 'Operator',    color: 'text-sky-700 bg-sky-100 border-sky-200',           icon: 'manage_accounts' },
  pengguna: { label: 'Pengguna',    color: 'text-emerald-700 bg-emerald-100 border-emerald-200', icon: 'smartphone' },
};

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-semibold
        ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
      style={{ animation: 'slideUp .25s ease-out' }}
    >
      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
        {type === 'success' ? 'check_circle' : 'error'}
      </span>
      {msg}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
      <style>{`@keyframes slideUp { from { transform: translateY(16px); opacity:0 } to { transform: translateY(0); opacity:1 } }`}</style>
    </div>
  );
}

// ── Halaman Profil ─────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Edit profil
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Ganti password
  const [showPwdSection, setShowPwdSection] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdErr, setPwdErr] = useState<Record<string, string>>({});

  // Upload foto
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Load profil
  useEffect(() => {
    (async () => {
      const res = await getCurrentUserProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        setName(res.data.name ?? '');
        setPhone(res.data.phone ?? '');
        setPreviewUrl(res.data.image ?? null);
      }
      setLoading(false);
    })();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type });

  // ── Simpan profil ──
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { showToast('Nama tidak boleh kosong.', 'error'); return; }
    setSavingProfile(true);
    const res = await updateProfile({ name, phone });
    setSavingProfile(false);
    if (res.success) {
      setProfile((p: any) => ({ ...p, name, phone }));
      // Paksa refresh session di sisi client agar header ikut update
      await authClient.getSession();
      showToast('Profil berhasil disimpan!', 'success');
    } else {
      showToast(res.message ?? 'Gagal menyimpan.', 'error');
    }
  };

  // ── Upload foto ──
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview lokal
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload ke server
    setUploadingPhoto(true);
    const fd = new FormData();
    fd.append('photo', file);
    const res = await uploadProfilePhoto(fd);
    setUploadingPhoto(false);

    if (res.success) {
      setProfile((p: any) => ({ ...p, image: res.imagePath }));
      // Paksa refresh session di sisi client agar header ikut update
      await authClient.getSession();
      showToast('Foto profil diperbarui!', 'success');
    } else {
      setPreviewUrl(profile?.image ?? null); // kembalikan ke foto lama
      showToast(res.message ?? 'Gagal upload foto.', 'error');
    }
  };

  // ── Ganti password ──
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!currentPwd) errs.currentPwd = 'Wajib diisi.';
    if (newPwd.length < 6) errs.newPwd = 'Minimal 6 karakter.';
    if (newPwd !== confirmPwd) errs.confirmPwd = 'Password tidak cocok.';
    if (Object.keys(errs).length) { setPwdErr(errs); return; }
    setPwdErr({});
    setSavingPwd(true);
    const res = await changePassword({ currentPassword: currentPwd, newPassword: newPwd });
    setSavingPwd(false);
    if (res.success) {
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setShowPwdSection(false);
      showToast('Password berhasil diubah!', 'success');
    } else {
      showToast(res.message ?? 'Gagal mengubah password.', 'error');
    }
  };

  const roleInfo = ROLE_CONFIG[profile?.role ?? 'pengguna'];
  const initials = profile?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() ?? '?';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl text-emerald-300 animate-spin">progress_activity</span>
          <p className="text-slate-400 text-sm">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[720px] mx-auto w-full pb-24 space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Card Profil ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header tanpa banner — avatar + info berdampingan */}
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">

          {/* Avatar with upload button */}
          <div className="relative flex-shrink-0">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={profile?.name}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-2xl font-bold text-white shadow-sm">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-7 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center shadow-md transition-colors"
              title="Ganti Foto"
            >
              {uploadingPhoto
                ? <span className="material-symbols-outlined text-[12px] animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-[12px]">photo_camera</span>
              }
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h1 className="text-xl font-manrope font-extrabold text-slate-900">{profile?.name}</h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${roleInfo.color}`}>
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>{roleInfo.icon}</span>
                {roleInfo.label}
              </span>
            </div>
            <p className="text-sm text-slate-500">{profile?.email}</p>
            <p className="text-xs text-slate-400 mt-1">
              Bergabung {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
              &nbsp;·&nbsp;
              <span className={`font-semibold ${profile?.status === 'Nonaktif' ? 'text-slate-400' : 'text-emerald-600'}`}>{profile?.status ?? 'Aktif'}</span>
            </p>
          </div>
        </div>

        {/* Garis */}
        <div className="border-t border-slate-100 mx-6" />

        {/* Form Edit */}
        <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Informasi Profil</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-500 pl-0.5">Nama Lengkap *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
              />
            </div>

            {/* Email (readonly) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 pl-0.5">Email</label>
              <input
                type="email"
                value={profile?.email ?? ''}
                readOnly
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium text-slate-400 outline-none cursor-not-allowed"
              />
            </div>

            {/* HP */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 pl-0.5">Nomor HP</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62 8xx-xxxx-xxxx"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-sm hover:brightness-105 active:scale-95 transition-all disabled:opacity-60"
            >
              {savingProfile
                ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Menyimpan...</>
                : <><span className="material-symbols-outlined text-[16px]">save</span>Simpan</>
              }
            </button>
          </div>
        </form>
      </div>

      {/* ── Keamanan / Ganti Password ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPwdSection((p) => !p)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-amber-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Keamanan Akun</p>
              <p className="text-xs text-slate-400">Ganti password login Anda</p>
            </div>
          </div>
          <span className={`material-symbols-outlined text-slate-400 transition-transform ${showPwdSection ? 'rotate-180' : ''}`}>expand_more</span>
        </button>

        {showPwdSection && (
          <form onSubmit={handleChangePassword} className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-5">
            {/* Password Saat Ini */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Password Saat Ini *</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full bg-slate-50 border rounded-xl py-2.5 px-4 pr-10 text-sm font-medium outline-none transition-all ${pwdErr.currentPwd ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400'}`}
                />
                <button type="button" onClick={() => setShowPwd((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <span className="material-symbols-outlined text-[18px]">{showPwd ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {pwdErr.currentPwd && <p className="text-[11px] text-red-500 font-semibold">{pwdErr.currentPwd}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password Baru */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Password Baru *</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Min. 6 karakter"
                  className={`w-full bg-slate-50 border rounded-xl py-2.5 px-4 text-sm font-medium outline-none transition-all ${pwdErr.newPwd ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400'}`}
                />
                {pwdErr.newPwd && <p className="text-[11px] text-red-500 font-semibold">{pwdErr.newPwd}</p>}
              </div>

              {/* Konfirmasi */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Konfirmasi Password *</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Ulangi password baru"
                  className={`w-full bg-slate-50 border rounded-xl py-2.5 px-4 text-sm font-medium outline-none transition-all ${pwdErr.confirmPwd ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400'}`}
                />
                {pwdErr.confirmPwd && <p className="text-[11px] text-red-500 font-semibold">{pwdErr.confirmPwd}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setShowPwdSection(false)} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button
                type="submit"
                disabled={savingPwd}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-60"
              >
                {savingPwd
                  ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Memproses...</>
                  : <><span className="material-symbols-outlined text-[16px]">key</span>Ubah Password</>
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
