import { eq } from 'drizzle-orm';
import { db } from '../db';
import { plants, pestsDiseases, sops, plantPestRelations, sopPlantRelations, sopPestRelations } from '../db/schema';

export class MasterDataRepository {
  // --------- Kategori Tanaman ---------
  async getAllPlants() {
    const allPlants = await db.select().from(plants);
    
    const relations = await db.select({
      plantId: plantPestRelations.plantId,
      pestId: pestsDiseases.id,
      nama: pestsDiseases.nama
    })
    .from(plantPestRelations)
    .innerJoin(pestsDiseases, eq(plantPestRelations.pestDiseaseId, pestsDiseases.id));
    
    return allPlants.map(p => ({
      ...p,
      hama: relations.filter(r => r.plantId === p.id).map(r => ({ id: r.pestId, nama: r.nama }))
    }));
  }

  async getPlantDetails(plantId: string) {
    const plant = await db.select().from(plants).where(eq(plants.id, plantId));
    if (!plant.length) return null;

    const pestsList = await db.select({
      pestId: pestsDiseases.id,
      nama: pestsDiseases.nama,
      jenis: pestsDiseases.jenis,
      risiko: pestsDiseases.tingkatRisiko
    })
    .from(plantPestRelations)
    .innerJoin(pestsDiseases, eq(plantPestRelations.pestDiseaseId, pestsDiseases.id))
    .where(eq(plantPestRelations.plantId, plantId));

    return {
      ...plant[0],
      pests: pestsList
    };
  }

  async createPlant(data: typeof plants.$inferInsert) {
    const [newPlant] = await db.insert(plants).values(data).returning();
    return newPlant;
  }

  async updatePlant(id: string, data: Partial<typeof plants.$inferInsert>) {
    const [updatedPlant] = await db.update(plants).set(data).where(eq(plants.id, id)).returning();
    return updatedPlant;
  }

  async deletePlant(id: string) {
    const [deletedPlant] = await db.delete(plants).where(eq(plants.id, id)).returning();
    return deletedPlant;
  }

  // --------- Kategori Penyakit/Hama ---------
  async getAllPests() {
    const allPests = await db.select().from(pestsDiseases);
    
    const relations = await db.select({
      pestId: plantPestRelations.pestDiseaseId,
      plantId: plants.id,
      namaLokal: plants.namaLokal
    })
    .from(plantPestRelations)
    .innerJoin(plants, eq(plantPestRelations.plantId, plants.id));
    
    return allPests.map(p => ({
      ...p,
      tanamanInang: relations.filter(r => r.pestId === p.id).map(r => ({ id: r.plantId, nama: r.namaLokal }))
    }));
  }

  async createPest(data: typeof pestsDiseases.$inferInsert) {
    const [newPest] = await db.insert(pestsDiseases).values(data).returning();
    return newPest;
  }

  async updatePest(id: string, data: Partial<typeof pestsDiseases.$inferInsert>) {
    const [updatedPest] = await db.update(pestsDiseases).set(data).where(eq(pestsDiseases.id, id)).returning();
    return updatedPest;
  }

  async deletePest(id: string) {
    const [deletedPest] = await db.delete(pestsDiseases).where(eq(pestsDiseases.id, id)).returning();
    return deletedPest;
  }

  // --------- Kategori SOP ---------
  async getAllSops() {
    const allSops = await db.select().from(sops);
    
    const plantRels = await db.select({
      sopId: sopPlantRelations.sopId,
      plantId: plants.id,
      namaLokal: plants.namaLokal
    }).from(sopPlantRelations).innerJoin(plants, eq(sopPlantRelations.plantId, plants.id));
    
    const pestRels = await db.select({
      sopId: sopPestRelations.sopId,
      pestId: pestsDiseases.id,
      nama: pestsDiseases.nama
    }).from(sopPestRelations).innerJoin(pestsDiseases, eq(sopPestRelations.pestDiseaseId, pestsDiseases.id));
    
    return allSops.map(s => ({
      ...s,
      tanamanTarget: plantRels.filter(r => r.sopId === s.id).map(r => ({ id: r.plantId, nama: r.namaLokal })),
      penyakitHamaTerkait: pestRels.filter(r => r.sopId === s.id).map(r => ({ id: r.pestId, nama: r.nama }))
    }));
  }

  async createSop(data: typeof sops.$inferInsert) {
    const [newSop] = await db.insert(sops).values(data).returning();
    return newSop;
  }

  async updateSop(id: string, data: Partial<typeof sops.$inferInsert>) {
    const [updatedSop] = await db.update(sops).set(data).where(eq(sops.id, id)).returning();
    return updatedSop;
  }

  async deleteSop(id: string) {
    const [deletedSop] = await db.delete(sops).where(eq(sops.id, id)).returning();
    return deletedSop;
  }

  // --------- Relasi Many-to-Many ---------
  async updatePlantPestRelations(plantId: string, pestIds: string[]) {
    await db.delete(plantPestRelations).where(eq(plantPestRelations.plantId, plantId));
    if (pestIds.length > 0) {
      const values = pestIds.map(pestId => ({ plantId, pestDiseaseId: pestId }));
      await db.insert(plantPestRelations).values(values);
    }
  }

  async updatePestPlantRelations(pestId: string, plantIds: string[]) {
    await db.delete(plantPestRelations).where(eq(plantPestRelations.pestDiseaseId, pestId));
    if (plantIds.length > 0) {
      const values = plantIds.map(plantId => ({ plantId, pestDiseaseId: pestId }));
      await db.insert(plantPestRelations).values(values);
    }
  }

  async updateSopRelations(sopId: string, plantIds: string[], pestIds: string[]) {
    await db.delete(sopPlantRelations).where(eq(sopPlantRelations.sopId, sopId));
    if (plantIds.length > 0) {
      const pValues = plantIds.map(plantId => ({ sopId, plantId }));
      await db.insert(sopPlantRelations).values(pValues);
    }
    
    await db.delete(sopPestRelations).where(eq(sopPestRelations.sopId, sopId));
    if (pestIds.length > 0) {
      const hValues = pestIds.map(pestId => ({ sopId, pestDiseaseId: pestId }));
      await db.insert(sopPestRelations).values(hValues);
    }
  }
}
