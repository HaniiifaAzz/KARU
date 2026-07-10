import { BannerRepository } from '../repositories/banner.repository';
import { mobileBanners } from '../db/schema';

export class BannerService {
  private bannerRepo: BannerRepository;

  constructor() {
    this.bannerRepo = new BannerRepository();
  }

  async getAllBanners() {
    return await this.bannerRepo.getAll();
  }

  async getBannerById(id: number) {
    return await this.bannerRepo.getById(id);
  }

  async createBanner(data: Omit<typeof mobileBanners.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    return await this.bannerRepo.create(data);
  }

  async updateBanner(id: number, data: Partial<typeof mobileBanners.$inferInsert>) {
    return await this.bannerRepo.update(id, data);
  }

  async deleteBanner(id: number) {
    return await this.bannerRepo.delete(id);
  }
}
