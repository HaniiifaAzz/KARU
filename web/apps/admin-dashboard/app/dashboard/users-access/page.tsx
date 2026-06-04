'use client';

import React, { useState, useMemo } from 'react';

import { getUsers, createUser, updateUser, deleteUser, toggleUserStatus } from '@/app/actions/user.actions';

// ── Types ──────────────────────────────────────────────────────────────────────
type RoleType = 'admin' | 'operator' | 'pengguna';

type User = {
  id: string; // Changed from number to string for Better Auth UUIDs
  name: string;
  email: string;
  phone: string;
  role: RoleType;
  status: 'Aktif' | 'Nonaktif';
  joinDate: string;
  lastLogin: string;
  avatar?: string;
  isPermanent?: boolean;
};

// ── Mock Data (Bisa dihapus keseluruhan tapi kita inisiasi kosong saja) ────────
const INIT_USERS: User[] = [];

// ── Role Config ────────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<RoleType, { label: string; badgeClass: string; icon: string; iconBg: string; desc: string }> = {
  admin: {
    label: 'Admin Utama',
    badgeClass: 'bg-violet-100 text-violet-800 border border-violet-200',
    icon: 'shield_person',
    iconBg: 'bg-violet-100 text-violet-600',
    desc: 'Akses penuh & permanen ke seluruh platform',
  },
  operator: {
    label: 'Operator',
    badgeClass: 'bg-sky-100 text-sky-800 border border-sky-200',
    icon: 'manage_accounts',
    iconBg: 'bg-sky-100 text-sky-600',
    desc: 'Akses dashboard untuk pengelolaan konten & data',
  },
  pengguna: {
    label: 'Pengguna',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    icon: 'smartphone',
    iconBg: 'bg-emerald-100 text-emerald-600',
    desc: 'Pengguna aplikasi mobile KARU',
  },
};

// ── Avatar ────────────────────────────────────────────────────────────────────
function UserAvatar({ user, size = 'md' }: { user: Pick<User, 'name' | 'avatar' | 'role'>; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-[11px]' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-[13px]';
  const ringColor = user.role === 'admin' ? 'ring-violet-100' : user.role === 'operator' ? 'ring-sky-100' : 'ring-emerald-100';
  const bgColor = user.role === 'admin' ? 'bg-violet-100 text-violet-800' : user.role === 'operator' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800';
  const initials = user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  if (user.avatar) {
    return <img src={user.avatar} alt={user.name} className={`${sizeClass} rounded-full object-cover ring-2 ${ringColor}`} />;
  }
  return (
    <div className={`${sizeClass} ${bgColor} rounded-full flex items-center justify-center font-bold ring-2 ${ringColor} border border-white shadow-sm`}>
      {initials}
    </div>
  );
}

// ── Role Badge ─────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: RoleType }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide ${cfg.badgeClass}`}>
      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ── Drawer Form ────────────────────────────────────────────────────────────────
type DrawerMode = 'add' | 'edit' | 'view';

type UserForm = {
  name: string;
  email: string;
  phone: string;
  role: RoleType;
  status: 'Aktif' | 'Nonaktif';
  password: string;
  confirmPassword: string;
};

const EMPTY_FORM: UserForm = {
  name: '',
  email: '',
  phone: '',
  role: 'pengguna',
  status: 'Aktif',
  password: '',
  confirmPassword: '',
};

function UserDrawer({
  mode,
  user,
  onClose,
  onSave,
}: {
  mode: DrawerMode;
  user: User | null;
  onClose: () => void;
  onSave: (u: User, rawPass?: string) => Promise<{ success: boolean; message?: string }>;
}) {
  const [form, setForm] = useState<UserForm>(
    user
      ? { name: user.name, email: user.email, phone: user.phone, role: user.role, status: user.status, password: '', confirmPassword: '' }
      : { ...EMPTY_FORM }
  );
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(mode);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Partial<UserForm>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isEditable = drawerMode === 'add' || drawerMode === 'edit';

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<UserForm> = {};
    if (!form.name.trim()) newErrors.name = 'Nama wajib diisi';
    if (!form.email.trim() || !form.email.includes('@')) newErrors.email = 'Email tidak valid';
    if (drawerMode === 'add') {
      if (!form.password || form.password.length < 6) newErrors.password = 'Password minimal 6 karakter';
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Password tidak cocok';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError(null);
    const saved: User = {
      ...(user ?? {
        id: Date.now().toString(),
        joinDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        lastLogin: '-',
      }),
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      status: form.status,
    };
    const result = await onSave(saved, form.password);
    setSaving(false);
    if (result?.success === false) {
      setSaveError(result.message || 'Terjadi kesalahan.');
    } else {
      onClose();
    }
  };

  const modeLabel = drawerMode === 'add' ? 'Tambah Pengguna Baru' : drawerMode === 'edit' ? 'Edit Pengguna' : 'Detail Pengguna';
  const modeIcon = drawerMode === 'add' ? 'person_add' : drawerMode === 'edit' ? 'edit' : 'person';
  const headerBg = drawerMode === 'edit' ? 'bg-amber-50' : drawerMode === 'add' ? 'bg-emerald-50' : 'bg-slate-50';
  const iconBg = drawerMode === 'edit' ? 'bg-amber-500' : drawerMode === 'add' ? 'bg-emerald-600' : 'bg-violet-600';

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40" onClick={drawerMode === 'view' ? onClose : undefined} />
      <div
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: 'slideInRight 0.25s ease-out' }}
      >
        {/* Header */}
        <div className={`flex-shrink-0 px-6 py-5 flex items-center justify-between border-b border-slate-100 ${headerBg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
              <span className="material-symbols-outlined text-white text-[18px]">{modeIcon}</span>
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${drawerMode === 'edit' ? 'text-amber-600' : drawerMode === 'add' ? 'text-emerald-700' : 'text-slate-400'}`}>
                {drawerMode === 'add' ? 'Akun Baru' : drawerMode === 'edit' ? 'Mode Edit' : 'Informasi Akun'}
              </p>
              <h2 className="text-sm font-manrope font-extrabold text-primary leading-tight">{modeLabel}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* VIEW MODE */}
          {drawerMode === 'view' && user && (
            <>
              {/* User Card */}
              <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <UserAvatar user={user} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-manrope font-extrabold text-primary text-base">{user.name}</h3>
                    {user.isPermanent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[10px] font-bold border border-violet-200">
                        <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                        Permanen
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                  <p className="text-xs text-slate-400 mt-1">{user.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <RoleBadge role={user.role} />
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${user.status === 'Aktif' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={`text-xs font-bold ${user.status === 'Aktif' ? 'text-emerald-700' : 'text-slate-400'}`}>{user.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Bergabung', val: user.joinDate, icon: 'calendar_today' },
                  { label: 'Login Terakhir', val: user.lastLogin, icon: 'login' },
                ].map((m) => (
                  <div key={m.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">{m.icon}</span>{m.label}
                    </p>
                    <p className="text-sm font-bold text-slate-700 mt-1">{m.val}</p>
                  </div>
                ))}
              </div>

              {/* Role description */}
              <div className={`rounded-xl p-4 border ${ROLE_CONFIG[user.role].iconBg.includes('violet') ? 'bg-violet-50 border-violet-100' : user.role === 'operator' ? 'bg-sky-50 border-sky-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Keterangan Peran</p>
                <p className="text-sm font-semibold text-slate-700">{ROLE_CONFIG[user.role].desc}</p>
              </div>

              {user.isPermanent && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-start gap-3">
                  <span className="material-symbols-outlined text-violet-500 text-[20px] flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                  <p className="text-xs text-violet-700 font-semibold leading-relaxed">Akun Admin Utama ini bersifat permanen dan tidak dapat dihapus dari sistem untuk menjamin keberlangsungan administrasi platform.</p>
                </div>
              )}
            </>
          )}

          {/* ADD / EDIT MODE */}
          {isEditable && (
            <>
              {/* Role Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Peran Pengguna *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(ROLE_CONFIG) as [RoleType, typeof ROLE_CONFIG[RoleType]][]).map(([roleKey, cfg]) => (
                    <button
                      key={roleKey}
                      type="button"
                      disabled={roleKey === 'admin'}
                      onClick={() => setForm((p) => ({ ...p, role: roleKey }))}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-center transition-all
                        ${form.role === roleKey
                          ? roleKey === 'operator' ? 'border-sky-400 bg-sky-50' : 'border-emerald-500 bg-emerald-50'
                          : roleKey === 'admin' ? 'border-dashed border-violet-200 bg-violet-50/50 opacity-50 cursor-not-allowed' : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                    >
                      <span className={`material-symbols-outlined text-[22px] ${form.role === roleKey ? (roleKey === 'operator' ? 'text-sky-600' : 'text-emerald-600') : 'text-slate-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {cfg.icon}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 leading-tight">{cfg.label}</span>
                      {roleKey === 'admin' && <span className="text-[9px] text-violet-500 font-bold">Terkunci</span>}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 pl-1">{ROLE_CONFIG[form.role].desc}</p>
              </div>

              {/* Nama */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInput}
                  placeholder="cth. Ahmad Yani"
                  className={`w-full bg-slate-50 border rounded-xl py-3 px-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all ${errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                />
                {errors.name && <p className="text-[11px] text-red-500 font-semibold pl-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alamat Email *</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">alternate_email</span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInput}
                    placeholder="nama@email.com"
                    className={`w-full bg-slate-50 border rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-red-500 font-semibold pl-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nomor HP <span className="font-normal normal-case text-slate-300">(opsional)</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">phone</span>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleInput}
                    placeholder="+62 8xx-xxxx-xxxx"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Akun *</label>
                <div className="flex gap-3">
                  {(['Aktif', 'Nonaktif'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, status: s }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${form.status === s
                        ? s === 'Aktif' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-slate-100 text-slate-600'
                        : 'border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${s === 'Aktif' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password (hanya mode tambah) */}
              {drawerMode === 'add' && (
                <>
                  <div className="border-t border-slate-100 pt-5 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keamanan Akun</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password *</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock</span>
                      <input
                        type={showPass ? 'text' : 'password'}
                        name="password"
                        value={form.password}
                        onChange={handleInput}
                        placeholder="Minimal 6 karakter"
                        className={`w-full bg-slate-50 border rounded-xl py-3 pl-10 pr-10 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                      />
                      <button type="button" onClick={() => setShowPass((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">{showPass ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                    {errors.password && <p className="text-[11px] text-red-500 font-semibold pl-1">{errors.password}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Konfirmasi Password *</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock_reset</span>
                      <input
                        type={showPass ? 'text' : 'password'}
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleInput}
                        placeholder="Ulangi password"
                        className={`w-full bg-slate-50 border rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-[11px] text-red-500 font-semibold pl-1">{errors.confirmPassword}</p>}
                  </div>
                </>
              )}

              {/* Edit mode — reset password note */}
              {drawerMode === 'edit' && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-[18px] flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                  <p className="text-xs text-amber-800 font-semibold">Untuk mengubah password, gunakan fitur Reset Password yang terpisah.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-slate-100">
          {saveError && (
            <div className="px-5 pt-4 pb-0">
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <span className="material-symbols-outlined text-red-500 text-[18px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                <p className="text-xs text-red-700 font-semibold">{saveError}</p>
              </div>
            </div>
          )}
          <div className="p-5 flex gap-3">
            {drawerMode === 'view' ? (
              <>
                <button type="button" onClick={onClose} className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">close</span>Tutup
                </button>
                {!user?.isPermanent && (
                  <button type="button" onClick={() => setDrawerMode('edit')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-md hover:brightness-105 active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-[18px]">edit</span>Edit Pengguna
                  </button>
                )}
              </>
            ) : (
              <>
                <button type="button" disabled={saving} onClick={drawerMode === 'edit' ? () => setDrawerMode('view') : onClose} className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-50">
                  <span className="material-symbols-outlined text-[18px]">undo</span>Batal
                </button>
                <button type="button" disabled={saving} onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-md hover:brightness-105 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                  {saving ? (
                    <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Menyimpan...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[18px]">save</span>{drawerMode === 'add' ? 'Buat Akun' : 'Simpan Perubahan'}</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </>
  );
}

// ── Delete Dialog ──────────────────────────────────────────────────────────────
function DeleteDialog({ user, onConfirm, onCancel, loading }: { user: User; onConfirm: () => void; onCancel: () => void; loading?: boolean }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[3px] z-[60]" onClick={loading ? undefined : onCancel} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm pointer-events-auto" style={{ animation: 'scaleIn 0.18s ease-out' }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-red-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_remove</span>
            </div>
            <div>
              <h3 className="font-manrope font-extrabold text-primary text-base">Hapus Pengguna?</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tindakan ini tidak bisa dibatalkan.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-5">
            <UserAvatar user={user} size="sm" />
            <div>
              <p className="text-sm font-bold text-slate-700">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" disabled={loading} onClick={onCancel} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-50">Batal</button>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Menghapus...</>
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

// ── Toggle Status Dialog ───────────────────────────────────────────────────────
function ToggleStatusDialog({ user, onConfirm, onCancel }: { user: User; onConfirm: () => void; onCancel: () => void }) {
  const isDeactivating = user.status === 'Aktif';
  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" style={{ animation: 'scaleIn 0.18s ease-out' }}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDeactivating ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              <span className={`material-symbols-outlined text-2xl ${isDeactivating ? 'text-amber-600' : 'text-emerald-600'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {isDeactivating ? 'block' : 'check_circle'}
              </span>
            </div>
            <div>
              <h3 className="font-manrope font-extrabold text-primary text-base">{isDeactivating ? 'Nonaktifkan Akun?' : 'Aktifkan Akun?'}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{isDeactivating ? 'Pengguna tidak bisa login selama dinonaktifkan.' : 'Pengguna dapat kembali mengakses platform.'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-5">
            <UserAvatar user={user} size="sm" />
            <div>
              <p className="text-sm font-bold text-slate-700">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">Batal</button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 py-2.5 text-white rounded-xl text-sm font-bold transition-colors shadow-md ${isDeactivating ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {isDeactivating ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Halaman Utama ──────────────────────────────────────────────────────────────
export default function UsersAccessPage() {
  const [users, setUsers] = useState<User[]>(INIT_USERS);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    async function fetchUsers() {
      const res = await getUsers();
      if (res.success && res.data) {
        // Map data db ke tipe User frontend
        const mapped: User[] = res.data.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || '-',
          role: u.role as RoleType,
          status: u.status as 'Aktif' | 'Nonaktif',
          joinDate: new Date(u.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
          lastLogin: u.updatedAt ? new Date(u.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
          isPermanent: u.role === 'admin'
        }));
        setUsers(mapped);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);
  const [filterRole, setFilterRole] = useState<'semua' | RoleType>('semua');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'Aktif' | 'Nonaktif'>('semua');
  const [drawerState, setDrawerState] = useState<{ open: boolean; mode: DrawerMode; user: User | null }>({ open: false, mode: 'add', user: null });
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [toggleTarget, setToggleTarget] = useState<User | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.phone.includes(search);
      const matchRole = filterRole === 'semua' || u.role === filterRole;
      const matchStatus = filterStatus === 'semua' || u.status === filterStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, filterRole, filterStatus]);

  // Stats
  const totalAdmin = users.filter((u) => u.role === 'admin').length;
  const totalOperator = users.filter((u) => u.role === 'operator').length;
  const totalPengguna = users.filter((u) => u.role === 'pengguna').length;
  const totalAktif = users.filter((u) => u.status === 'Aktif').length;

  const openDrawer = (mode: DrawerMode, user: User | null = null) =>
    setDrawerState({ open: true, mode, user });

  const handleSave = async (saved: User, rawPassword?: string): Promise<{ success: boolean; message?: string }> => {
    if (drawerState.mode === 'add') {
      const payload = { ...saved, password: rawPassword };
      const res = await createUser(payload);
      if (res.success) {
        // Re-fetch setelah berhasil
        const usersRes = await getUsers();
        if (usersRes.success && usersRes.data) {
          const mapped: User[] = usersRes.data.map((u: any) => ({
            id: u.id, name: u.name, email: u.email, phone: u.phone || '-',
            role: u.role as RoleType, status: u.status as 'Aktif' | 'Nonaktif',
            joinDate: new Date(u.createdAt).toLocaleDateString('id-ID'),
            lastLogin: u.updatedAt ? new Date(u.updatedAt).toLocaleDateString('id-ID') : '-',
            isPermanent: u.role === 'admin'
          }));
          setUsers(mapped);
        }
      }
      return res;
    } else {
      const res = await updateUser(saved.id, saved);
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === saved.id ? saved : u));
      }
      return res;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const res = await deleteUser(deleteTarget.id);
    setIsDeleting(false);
    if (res.success) {
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    } else {
      alert(res.message);
    }
    setDeleteTarget(null);
  };

  const handleToggleStatus = async () => {
    if (!toggleTarget) return;
    const newStatus = toggleTarget.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    const res = await toggleUserStatus(toggleTarget.id, newStatus);
    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => u.id === toggleTarget.id ? { ...u, status: newStatus } : u)
      );
    } else {
      alert(res.message);
    }
    setToggleTarget(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline-variant/10 pb-6">
        <div>
          <h1 className="text-3xl font-manrope font-extrabold text-emerald-950 tracking-tight">Pengguna &amp; Akses</h1>
          <p className="text-slate-500 mt-1 max-w-xl">
            Kelola akun <span className="font-bold text-violet-700">Admin Utama</span>, <span className="font-bold text-sky-700">Operator</span>, dan <span className="font-bold text-emerald-700">Pengguna Mobile</span> pada platform KARU.
          </p>
        </div>
        <button
          onClick={() => openDrawer('add')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-950/10 hover:shadow-emerald-950/20 transition-all active:scale-95 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Tambah Pengguna
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Admin Utama', value: totalAdmin, icon: 'shield_person', bg: 'bg-violet-50', color: 'text-violet-700', border: 'border-violet-100' },
          { label: 'Operator', value: totalOperator, icon: 'manage_accounts', bg: 'bg-sky-50', color: 'text-sky-700', border: 'border-sky-100' },
          { label: 'Pengguna Mobile', value: totalPengguna, icon: 'smartphone', bg: 'bg-emerald-50', color: 'text-emerald-700', border: 'border-emerald-100' },
          { label: 'Akun Aktif', value: totalAktif, icon: 'check_circle', bg: 'bg-teal-50', color: 'text-teal-700', border: 'border-teal-100' },
        ].map((s) => (
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

      {/* Filter bar */}
      <div className="bg-white rounded-2xl p-4 flex flex-wrap items-center gap-3 shadow-sm border border-slate-100">
        <div className="relative flex-1 min-w-[220px]">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau nomor HP..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Role filter tabs */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(['semua', 'admin', 'operator', 'pengguna'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all capitalize ${filterRole === r ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {r === 'semua' ? 'Semua' : ROLE_CONFIG[r as RoleType].label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="bg-slate-100 border-0 rounded-xl py-2 pl-3 pr-7 text-[11px] font-bold text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
            >
              <option value="semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[14px]">expand_more</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 font-medium ml-auto">{filtered.length} pengguna ditemukan</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-manrope font-bold text-slate-400 uppercase tracking-widest w-[300px]">Pengguna</th>
                <th className="px-6 py-4 text-[10px] font-manrope font-bold text-slate-400 uppercase tracking-widest w-[160px]">Peran</th>
                <th className="px-6 py-4 text-[10px] font-manrope font-bold text-slate-400 uppercase tracking-widest w-[120px]">Status</th>
                <th className="px-6 py-4 text-[10px] font-manrope font-bold text-slate-400 uppercase tracking-widest w-[140px]">Bergabung</th>
                <th className="px-6 py-4 text-[10px] font-manrope font-bold text-slate-400 uppercase tracking-widest w-[140px]">Login Terakhir</th>
                <th className="px-6 py-4 text-[10px] font-manrope font-bold text-slate-400 uppercase tracking-widest text-right w-[160px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-slate-200 mb-3 block">manage_search</span>
                    <p className="text-slate-400 font-bold text-sm">Tidak ada pengguna yang cocok.</p>
                    <button
                      type="button"
                      onClick={() => { setSearch(''); setFilterRole('semua'); setFilterStatus('semua'); }}
                      className="mt-2 text-xs text-emerald-600 font-bold hover:underline"
                    >
                      Reset filter
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Pengguna */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="text-sm font-bold text-primary hover:underline cursor-pointer truncate"
                              onClick={() => openDrawer('view', user)}
                            >
                              {user.name}
                            </span>
                            {user.isPermanent && (
                              <span className="material-symbols-outlined text-[13px] text-violet-500 flex-shrink-0" title="Akun Permanen" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-slate-400 truncate">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Peran */}
                    <td className="px-6 py-4">
                      <RoleBadge role={user.role} />
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${user.status === 'Aktif' ? 'bg-emerald-500 shadow-sm shadow-emerald-400' : 'bg-slate-300'}`} />
                        <span className={`text-xs font-bold ${user.status === 'Aktif' ? 'text-emerald-700' : 'text-slate-400'}`}>{user.status}</span>
                      </div>
                    </td>

                    {/* Bergabung */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-500">{user.joinDate}</span>
                    </td>

                    {/* Last login */}
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium ${user.lastLogin === '-' ? 'text-slate-300' : 'text-slate-500'}`}>{user.lastLogin}</span>
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Detail */}
                        <button
                          type="button"
                          onClick={() => openDrawer('view', user)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100"
                          title="Lihat Detail"
                        >
                          <span className="material-symbols-outlined text-[17px]">info</span>
                        </button>

                        {/* Edit */}
                        {!user.isPermanent && (
                          <button
                            type="button"
                            onClick={() => openDrawer('edit', user)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all border border-transparent hover:border-amber-100"
                            title="Edit Pengguna"
                          >
                            <span className="material-symbols-outlined text-[17px]">edit</span>
                          </button>
                        )}

                        {/* Toggle Status */}
                        {!user.isPermanent && (
                          <button
                            type="button"
                            onClick={() => setToggleTarget(user)}
                            className={`p-2 rounded-lg transition-all border border-transparent ${user.status === 'Aktif' ? 'text-slate-400 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-100' : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-100'}`}
                            title={user.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            <span className="material-symbols-outlined text-[17px]">{user.status === 'Aktif' ? 'block' : 'check_circle'}</span>
                          </button>
                        )}

                        {/* Delete */}
                        {!user.isPermanent && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(user)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100"
                            title="Hapus Permanen"
                          >
                            <span className="material-symbols-outlined text-[17px]">delete</span>
                          </button>
                        )}

                        {/* Admin permanen info */}
                        {user.isPermanent && (
                          <span className="px-2 py-1 text-[10px] font-bold text-violet-500 bg-violet-50 border border-violet-100 rounded-lg">Dilindungi</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 font-medium">
            Menampilkan <span className="font-bold text-slate-700">{filtered.length}</span> dari <span className="font-bold text-slate-700">{users.length}</span> pengguna
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-[11px] text-slate-500 font-medium">Admin Utama: {totalAdmin}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="text-[11px] text-slate-500 font-medium">Operator: {totalOperator}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-slate-500 font-medium">Pengguna: {totalPengguna}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role legend */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Panduan Peran</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.entries(ROLE_CONFIG) as [RoleType, typeof ROLE_CONFIG[RoleType]][]).map(([roleKey, cfg]) => (
            <div key={roleKey} className={`flex items-start gap-3 p-4 rounded-xl border ${roleKey === 'admin' ? 'bg-violet-50 border-violet-100' : roleKey === 'operator' ? 'bg-sky-50 border-sky-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
                <span className={`material-symbols-outlined text-[20px]`} style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-bold text-slate-700">{cfg.label}</p>
                  {roleKey === 'admin' && (
                    <span className="text-[9px] font-bold bg-violet-200 text-violet-700 px-1.5 py-0.5 rounded-md uppercase">Permanen</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{cfg.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drawer */}
      {drawerState.open && (
        <UserDrawer
          mode={drawerState.mode}
          user={drawerState.user}
          onClose={() => setDrawerState((s) => ({ ...s, open: false }))}
          onSave={handleSave}
        />
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <DeleteDialog
          user={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={isDeleting}
        />
      )}

      {/* Toggle Status Dialog */}
      {toggleTarget && (
        <ToggleStatusDialog user={toggleTarget} onConfirm={handleToggleStatus} onCancel={() => setToggleTarget(null)} />
      )}
    </div>
  );
}
