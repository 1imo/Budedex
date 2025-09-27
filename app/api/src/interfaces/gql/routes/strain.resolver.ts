import { StrainService } from '../../../services/strain.service';
import { validateStrainsArgs } from '../validations/leaderboard.validation';

interface Context {
    services: {
        strain: StrainService;
    };
    user?: {
        id: string;
        username: string;
        email: string;
    };
}

export const strainResolvers = {
    Query: {
        strains: async (_: any, { page, limit }: { page: number; limit: number }, ctx: Context) => {
            validateStrainsArgs(page, limit);
            const result = await ctx.services.strain.getStrains(page, limit);
            return {
                strains: result.strains,
                pageInfo: {
                    hasNextPage: result.pagination.hasNext,
                    hasPreviousPage: result.pagination.hasPrev,
                    currentPage: result.pagination.page,
                    totalPages: result.pagination.pages,
                    total: result.total
                }
            };
        },

        strain: async (_: any, { name }: { name: string }, ctx: Context) => {
            return await ctx.services.strain.getStrainById(name);
        },

        searchStrains: async (_: any, { query, page, limit }: { query: string; page: number; limit: number }, ctx: Context) => {
            validateStrainsArgs(page, limit);
            const result = await ctx.services.strain.searchStrains({ query, page, limit });
            return {
                strains: result.strains,
                pageInfo: {
                    hasNextPage: result.pagination.hasNext,
                    hasPreviousPage: result.pagination.hasPrev,
                    currentPage: result.pagination.page,
                    totalPages: result.pagination.pages,
                    total: result.total
                }
            };
        },

        searchExact: async (_: any, { query }: { query: string }, ctx: Context) => {
            return await ctx.services.strain.searchExact(query);
        },

        strainsByCategory: async (_: any, { category, page, limit }: { category: string; page: number; limit: number }, ctx: Context) => {
            validateStrainsArgs(page, limit);
            const result = await ctx.services.strain.getStrainsByCategory(category, page, limit);
            return {
                strains: result.strains,
                pageInfo: {
                    hasNextPage: result.pagination.hasNext,
                    hasPreviousPage: result.pagination.hasPrev,
                    currentPage: result.pagination.page,
                    totalPages: result.pagination.pages,
                    total: result.total
                }
            };
        },

        strainsByEffect: async (_: any, { effect, page, limit }: { effect: string; page: number; limit: number }, ctx: Context) => {
            validateStrainsArgs(page, limit);
            const result = await ctx.services.strain.getStrainsByEffect(effect, page, limit);
            return {
                strains: result.strains,
                pageInfo: {
                    hasNextPage: result.pagination.hasNext,
                    hasPreviousPage: result.pagination.hasPrev,
                    currentPage: result.pagination.page,
                    totalPages: result.pagination.pages,
                    total: result.total
                }
            };
        },
    },
};

