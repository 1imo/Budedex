import { StrainRepository } from '../repository/strain.repository';
import {
    Strain,
    StrainComplete,
    StrainSearch,
    CreateStrainRequest,
    UpdateStrainRequest,
    StrainQuery,
    SearchStrainsRequest
} from '../DTOs/strain.dto';

export class StrainService {
    private strainRepository: StrainRepository;

    constructor(strainRepository: StrainRepository) {
        this.strainRepository = strainRepository;
    }

    async getAllStrains(query: StrainQuery): Promise<{ strains: Strain[], total: number, pagination: any }> {
        const { strains, total } = await this.strainRepository.getAll(query);

        const pagination = {
            page: query.page,
            limit: query.limit,
            total,
            pages: Math.ceil(total / query.limit),
            hasNext: query.page < Math.ceil(total / query.limit),
            hasPrev: query.page > 1
        };

        return { strains, total, pagination };
    }

    async getAllCompleteStrains(query: StrainQuery): Promise<{ strains: StrainComplete[], total: number, pagination: any }> {
        const { strains, total } = await this.strainRepository.getAllComplete(query);

        const pagination = {
            page: query.page,
            limit: query.limit,
            total,
            pages: Math.ceil(total / query.limit),
            hasNext: query.page < Math.ceil(total / query.limit),
            hasPrev: query.page > 1
        };

        return { strains, total, pagination };
    }

    async getStrainByName(name: string): Promise<StrainComplete | null> {
        return await this.strainRepository.getComplete(name);
    }

    async getCompleteStrain(name: string): Promise<StrainComplete | null> {
        return await this.strainRepository.getComplete(name);
    }

    async searchStrains(searchRequest: SearchStrainsRequest): Promise<{ strains: StrainSearch[], total: number, pagination: any }> {
        const { strains, total } = await this.strainRepository.search(searchRequest);

        const pagination = {
            page: searchRequest.page,
            limit: searchRequest.limit,
            total,
            pages: Math.ceil(total / searchRequest.limit),
            hasNext: searchRequest.page < Math.ceil(total / searchRequest.limit),
            hasPrev: searchRequest.page > 1
        };

        return { strains, total, pagination };
    }

    async searchExact(query: string): Promise<StrainComplete | null> {
        return await this.strainRepository.searchExact(query);
    }

    async createStrain(strainData: CreateStrainRequest): Promise<Strain> {
        // Check if strain already exists
        const existingStrain = await this.strainRepository.getByName(strainData.name);
        if (existingStrain) {
            throw new Error(`Strain with name '${strainData.name}' already exists`);
        }

        return await this.strainRepository.create(strainData);
    }

    async updateStrain(name: string, strainData: UpdateStrainRequest): Promise<Strain | null> {
        // Check if strain exists
        const existingStrain = await this.strainRepository.getByName(name);
        if (!existingStrain) {
            throw new Error(`Strain with name '${name}' not found`);
        }

        // If updating name, check if new name already exists
        if (strainData.name && strainData.name !== name) {
            const strainWithNewName = await this.strainRepository.getByName(strainData.name);
            if (strainWithNewName) {
                throw new Error(`Strain with name '${strainData.name}' already exists`);
            }
        }

        return await this.strainRepository.update(name, strainData);
    }

    async deleteStrain(name: string): Promise<boolean> {
        // Check if strain exists
        const existingStrain = await this.strainRepository.getByName(name);
        if (!existingStrain) {
            throw new Error(`Strain with name '${name}' not found`);
        }

        return await this.strainRepository.delete(name);
    }

    async getPopularStrains(limit: number = 10, type?: string): Promise<any[]> {
        return await this.strainRepository.getPopularStrains(limit, type);
    }

    // Lookup data methods
    async getEffects(): Promise<any[]> {
        return await this.strainRepository.getEffects();
    }

    async getFlavors(): Promise<any[]> {
        return await this.strainRepository.getFlavors();
    }

    async getTerpenes(): Promise<any[]> {
        return await this.strainRepository.getTerpenes();
    }

    async getMedicalConditions(): Promise<any[]> {
        return await this.strainRepository.getMedicalConditions();
    }

    // Utility methods
    generateSlug(name: string): string {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    }

    validateStrainType(type: string): boolean {
        return ['Indica', 'Sativa', 'Hybrid'].includes(type);
    }

    validateRating(rating: number): boolean {
        return rating >= 0 && rating <= 5;
    }

    // Legacy methods for GraphQL resolver compatibility
    async getStrains(page: number = 1, limit: number = 20): Promise<{ strains: StrainComplete[], total: number, pagination: any }> {
        const query = { page, limit, sort: 'name' as const, order: 'asc' as const };
        return this.getAllCompleteStrains(query);
    }

    async getStrainById(name: string): Promise<StrainComplete | null> {
        return this.getStrainByName(name);
    }

    async getStrainsByCategory(category: string, page: number = 1, limit: number = 20): Promise<{ strains: Strain[], total: number, pagination: any }> {
        const query = { page, limit, search: category, sort: 'name' as const, order: 'asc' as const };
        return this.getAllStrains(query);
    }

    async getStrainsByEffect(effect: string, page: number = 1, limit: number = 20): Promise<{ strains: Strain[], total: number, pagination: any }> {
        const query = { page, limit, search: effect, sort: 'name' as const, order: 'asc' as const };
        return this.getAllStrains(query);
    }
}