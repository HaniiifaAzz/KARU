'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getBannersAction, createBannerAction, updateBannerAction, deleteBannerAction } from '@/app/actions/banner.actions';
import { uploadFileAction } from '@/app/actions/upload.actions';
import { toast } from 'sonner';

export default function MobileBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<any>({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    isActive: true,
    displayOrder: 0,
    durationMs: 5000,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    setIsLoading(true);
    const res = await getBannersAction();
    if (res.success) {
      setBanners(res.data ?? []);
    } else {
      toast.error(res.error || 'Gagal memuat data banner.');
    }
    setIsLoading(false);
  }

  const handleOpenModal = (banner: any = null) => {
    if (banner) {
      setCurrentBanner(banner);
      setImagePreview(banner.imageUrl);
      setIsEditing(true);
    } else {
      setCurrentBanner({
        title: '',
        description: '',
        imageUrl: '',
        linkUrl: '',
        isActive: true,
        displayOrder: banners.length,
        durationMs: 5000,
      });
      setImagePreview(null);
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPEG, PNG, WebP, atau GIF.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Ukuran file terlalu besar (maksimal 5MB). File Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('file', file);
    
    const res = await uploadFileAction(formData, 'banners');
    if (res.success) {
      setCurrentBanner((prev: any) => ({ ...prev, imageUrl: res.url }));
      toast.success('Gambar berhasil diunggah.');
    } else {
      toast.error(res.message || 'Gagal mengunggah gambar.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBanner.title || !currentBanner.imageUrl) {
      toast.error('Judul dan Gambar wajib diisi.');
      return;
    }

    setIsSaving(true);
    let res;
    if (isEditing) {
      res = await updateBannerAction(currentBanner.id, currentBanner);
    } else {
      res = await createBannerAction(currentBanner);
    }

    if (res.success) {
      toast.success(`Banner berhasil di${isEditing ? 'perbarui' : 'tambahkan'}.`);
      handleCloseModal();
      loadBanners();
    } else {
      toast.error(res.error || 'Gagal menyimpan banner.');
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus banner ini?')) {
      const res = await deleteBannerAction(id);
      if (res.success) {
        toast.success('Banner berhasil dihapus.');
        loadBanners();
      } else {
        toast.error(res.error || 'Gagal menghapus banner.');
      }
    }
  };

  const toggleActiveStatus = async (banner: any) => {
    const res = await updateBannerAction(banner.id, { isActive: !banner.isActive });
    if (res.success) {
      toast.success(`Status banner ${!banner.isActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
      loadBanners();
    } else {
      toast.error(res.error || 'Gagal memperbarui status.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-4xl text-emerald-600">refresh</span>
          <p className="text-sm font-bold text-slate-400">Memuat data banner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1200px] mx-auto w-full pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline-variant/10 pb-6">
        <div>
          <Link href="/dashboard/settings" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 mb-2 transition-colors">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali ke Pengaturan
          </Link>
          <h1 className="text-3xl font-manrope font-extrabold text-emerald-950 tracking-tight font-headline">
            Banner Aplikasi Mobile
          </h1>
          <p className="text-slate-500 mt-1 max-w-xl text-sm md:text-base">
            Kelola gambar carousel yang ditampilkan pada beranda aplikasi mobile KARU.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Tambah Banner
        </button>
      </div>

      {/* Content */}
      {banners.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-6xl text-emerald-200 mb-4">imagesmode</span>
          <h3 className="text-xl font-bold text-slate-800">Belum Ada Banner</h3>
          <p className="text-slate-500 mt-2 max-w-sm">
            Tambahkan banner baru untuk ditampilkan di carousel beranda aplikasi mobile.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-6 px-6 py-2.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors"
          >
            Tambah Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group relative">
              <div className="aspect-[16/9] relative bg-slate-100 border-b border-slate-100">
                {banner.imageUrl ? (
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    fill
                    className={`object-cover ${!banner.isActive ? 'grayscale opacity-60' : ''}`}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400">No Image</div>
                )}
                {!banner.isActive && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-slate-800/80 text-white text-[10px] font-bold rounded-md backdrop-blur-sm">
                    TIDAK AKTIF
                  </div>
                )}
                <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 text-emerald-800 text-[10px] font-bold rounded-md shadow-sm">
                  Urutan: {banner.displayOrder}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-slate-800 line-clamp-1">{banner.title}</h3>
                {banner.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{banner.description}</p>
                )}
                
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50 mt-4">
                  <button
                    onClick={() => toggleActiveStatus(banner)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                      banner.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {banner.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(banner)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Edit Banner"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus Banner"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md px-8 py-5 border-b border-slate-100 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-800">
                {isEditing ? 'Edit Banner' : 'Tambah Banner Baru'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              {/* Image Upload Area */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Gambar Banner *</label>
                <div className="flex flex-col gap-4">
                  {imagePreview ? (
                    // Use native <img> for data-URL previews to avoid Next/Image issues,
                    // otherwise use Next/Image for external URLs.
                    (typeof imagePreview === 'string' && (imagePreview.startsWith('data:') || imagePreview.includes('base64,'))) ? (
                      <div className="relative aspect-[16/9] w-full max-w-md bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 group">
                        <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <label className="cursor-pointer bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">upload</span>
                            Ganti Gambar
                            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} className="hidden" />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="relative aspect-[16/9] w-full max-w-md bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 group">
                        <Image src={imagePreview as string} alt="Preview" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <label className="cursor-pointer bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">upload</span>
                            Ganti Gambar
                            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} className="hidden" />
                          </label>
                        </div>
                      </div>
                    )
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-[16/9] w-full max-w-md bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 hover:border-emerald-300 transition-colors group">
                      <span className="material-symbols-outlined text-4xl text-slate-300 group-hover:text-emerald-400 transition-colors mb-2">add_photo_alternate</span>
                      <span className="text-sm font-bold text-slate-500 group-hover:text-emerald-600 transition-colors">Pilih Gambar</span>
                      <span className="text-xs text-slate-400 mt-1">Rekomendasi rasio 16:9</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                  {/* Upload Requirements */}
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">image</span>
                      Format: JPEG, PNG, WebP, GIF
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">sd_card</span>
                      Maksimal: 5MB
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">aspect_ratio</span>
                      Rasio: 16:9
                    </span>
                  </div>
                  {/* Manual URL Input Fallback */}
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="Atau masukkan URL gambar..."
                      value={currentBanner.imageUrl}
                      onChange={(e) => {
                        setCurrentBanner({...currentBanner, imageUrl: e.target.value});
                        setImagePreview(e.target.value);
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Judul *</label>
                  <input
                    type="text"
                    required
                    value={currentBanner.title}
                    onChange={(e) => setCurrentBanner({...currentBanner, title: e.target.value})}
                    placeholder="Contoh: Promo Pertanian"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Tautan / URL (Opsional)</label>
                  <input
                    type="text"
                    value={currentBanner.linkUrl || ''}
                    onChange={(e) => setCurrentBanner({...currentBanner, linkUrl: e.target.value})}
                    placeholder="Contoh: https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Deskripsi Singkat</label>
                <textarea
                  value={currentBanner.description || ''}
                  onChange={(e) => setCurrentBanner({...currentBanner, description: e.target.value})}
                  rows={2}
                  placeholder="Tambahkan sedikit penjelasan jika diperlukan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Urutan Tampil</label>
                  <input
                    type="number"
                    min="0"
                    value={currentBanner.displayOrder}
                    onChange={(e) => setCurrentBanner({...currentBanner, displayOrder: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Durasi (ms)</label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={currentBanner.durationMs}
                    onChange={(e) => setCurrentBanner({...currentBanner, durationMs: parseInt(e.target.value) || 5000})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 rounded-xl bg-slate-50 w-full hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={currentBanner.isActive}
                      onChange={(e) => setCurrentBanner({...currentBanner, isActive: e.target.checked})}
                      className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span className="text-sm font-bold text-slate-700">Aktifkan Banner</span>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50"
                >
                  {isSaving ? (
                    <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">save</span>
                  )}
                  Simpan Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
