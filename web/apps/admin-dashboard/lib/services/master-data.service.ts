import { MasterDataRepository } from '../repositories/master-data.repository';
import { plants, pestsDiseases } from '../db/schema';

export class MasterDataService {
  private repo: MasterDataRepository;

  constructor() {
    this.repo = new MasterDataRepository();
  }

  async getMasterDataCollections() {
    const allPlants = await this.repo.getAllPlants();
    const allPests = await this.repo.getAllPests();
    const allSops = await this.repo.getAllSops();

    return {
      plants: allPlants,
      pests: allPests,
      sops: allSops,
    };
  }

  // --- Plants ---
  async getPlant(id: string) {
    return await this.repo.getPlantDetails(id);
  }

  async createPlant(data: typeof plants.$inferInsert) {
    return await this.repo.createPlant(data);
  }

  async updatePlant(id: string, data: Partial<typeof plants.$inferInsert>) {
    return await this.repo.updatePlant(id, data);
  }

  async deletePlant(id: string) {
    return await this.repo.deletePlant(id);
  }

  // --- Pests / Diseases ---
  async createPest(data: typeof pestsDiseases.$inferInsert) {
    return await this.repo.createPest(data);
  }

  async updatePest(id: string, data: Partial<typeof pestsDiseases.$inferInsert>) {
    return await this.repo.updatePest(id, data);
  }

  async deletePest(id: string) {
    return await this.repo.deletePest(id);
  }

  // --- SOPs ---
  async createSop(data: any) {
    return await this.repo.createSop(data);
  }

  async updateSop(id: string, data: any) {
    return await this.repo.updateSop(id, data);
  }

  async deleteSop(id: string) {
    return await this.repo.deleteSop(id);
  }

  // --- Relations ---
  async updatePlantPestRelations(plantId: string, pestIds: string[]) {
    return await this.repo.updatePlantPestRelations(plantId, pestIds);
  }

  async updatePestPlantRelations(pestId: string, plantIds: string[]) {
    return await this.repo.updatePestPlantRelations(pestId, plantIds);
  }

  async updateSopRelations(sopId: string, plantIds: string[], pestIds: string[]) {
    return await this.repo.updateSopRelations(sopId, plantIds, pestIds);
  }
}
