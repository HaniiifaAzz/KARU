'use server';

import { revalidatePath } from 'next/cache';
import { BannerService } from '@/lib/services/banner.service';
import { logActivity } from '@/lib/activity-logger';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const bannerService = new BannerService();

export async function getBannersAction() {
  try {
    const banners = await bannerService.getAllBanners();
    return { success: true, data: banners };
  } catch (error: any) {
    console.error('Error in getBannersAction:', error);
    return { success: false, error: error.message || 'Gagal memuat banner.' };
  }
}

export async function getBannerByIdAction(id: number) {
  try {
    const banner = await bannerService.getBannerById(id);
    return { success: true, data: banner };
  } catch (error: any) {
    console.error('Error in getBannerByIdAction:', error);
    return { success: false, error: error.message || 'Gagal memuat banner.' };
  }
}

export async function createBannerAction(data: any) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || !session.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const newBanner = await bannerService.createBanner({
      ...data,
      createdBy: session.user.id
    });

    await logActivity({
      type: 'create',
      action: 'Pembuatan Banner Mobile',
      description: `Membuat banner baru: ${data.title}`,
      userId: session.user.id,
    });

    revalidatePath('/dashboard/settings/banners');
    revalidatePath('/dashboard/settings');
    
    return { success: true, data: newBanner };
  } catch (error: any) {
    console.error('Error in createBannerAction:', error);
    return { success: false, error: error.message || 'Gagal membuat banner.' };
  }
}

export async function updateBannerAction(id: number, data: any) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || !session.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const updated = await bannerService.updateBanner(id, data);

    await logActivity({
      type: 'update',
      action: 'Pembaruan Banner Mobile',
      description: `Memperbarui banner: ${data.title || id}`,
      userId: session.user.id,
    });

    revalidatePath('/dashboard/settings/banners');
    
    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Error in updateBannerAction:', error);
    return { success: false, error: error.message || 'Gagal memperbarui banner.' };
  }
}

export async function deleteBannerAction(id: number) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || !session.user) {
      return { success: false, error: 'Unauthorized' };
    }

    await bannerService.deleteBanner(id);

    await logActivity({
      type: 'delete',
      action: 'Penghapusan Banner Mobile',
      description: `Menghapus banner ID: ${id}`,
      userId: session.user.id,
    });

    revalidatePath('/dashboard/settings/banners');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteBannerAction:', error);
    return { success: false, error: error.message || 'Gagal menghapus banner.' };
  }
}
