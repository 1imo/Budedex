import { z } from 'zod';

// Leaderboard entry
export const LeaderboardEntrySchema = z.object({
    username: z.string(),
    total_score: z.number().int().min(0),
    overall_rank: z.number().int().min(1),
    level_tier: z.enum([
        'Seedling',
        'Budding Enthusiast',
        'Experienced',
        'Advanced User',
        'Expert Grower',
        'Master Cultivator'
    ]),
    favourites_count: z.number().int().min(0),
    seen_count: z.number().int().min(0),
    unique_effects: z.number().int().min(0),
    unique_flavors: z.number().int().min(0),
    unique_terpenes: z.number().int().min(0),
    unique_medical_conditions: z.number().int().min(0),
    favourites_rank: z.number().int().min(1),
    seen_rank: z.number().int().min(1),
    effects_rank: z.number().int().min(1),
    flavors_rank: z.number().int().min(1),
    terpenes_rank: z.number().int().min(1),
    medical_conditions_rank: z.number().int().min(1),
    joined_date: z.date(),
});

// Category leader
export const CategoryLeaderSchema = z.object({
    category: z.enum([
        'favourites',
        'seen',
        'effects',
        'flavors',
        'terpenes',
        'medical_conditions'
    ]),
    username: z.string(),
    count: z.number().int().min(0),
    rank: z.number().int().min(1),
});

// Popular strain
export const PopularStrainSchema = z.object({
    name: z.string(),
    type: z.enum(['Indica', 'Sativa', 'Hybrid']),
    rating: z.number().min(0).max(5).optional(),
    review_count: z.number().int().min(0),
    favourite_count: z.number().int().min(0),
    seen_count: z.number().int().min(0),
    popularity_score: z.number().min(0),
});

// Effect popularity
export const EffectPopularitySchema = z.object({
    effect: z.string(),
    type: z.enum(['positive', 'negative']),
    strain_count: z.number().int().min(0),
    user_interactions: z.number().int().min(0),
});

// Flavor popularity
export const FlavorPopularitySchema = z.object({
    flavor: z.string(),
    strain_count: z.number().int().min(0),
    user_interactions: z.number().int().min(0),
});

// Terpene popularity
export const TerpenePopularitySchema = z.object({
    terpene_name: z.string(),
    terpene_type: z.string().optional(),
    strain_count: z.number().int().min(0),
    user_interactions: z.number().int().min(0),
});

// Medical condition popularity
export const MedicalConditionPopularitySchema = z.object({
    condition_name: z.string(),
    strain_count: z.number().int().min(0),
    avg_effectiveness: z.number().min(0).max(100).optional(),
    user_interactions: z.number().int().min(0),
});

// Leaderboard query parameters
export const LeaderboardQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    category: z.enum([
        'overall',
        'favourites',
        'seen',
        'effects',
        'flavors',
        'terpenes',
        'medical_conditions'
    ]).default('overall'),
});

// Analytics query parameters
export const AnalyticsQuerySchema = z.object({
    type: z.enum([
        'popular_strains',
        'effect_popularity',
        'flavor_popularity',
        'terpene_popularity',
        'medical_condition_popularity'
    ]),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    strain_type: z.enum(['Indica', 'Sativa', 'Hybrid']).optional(),
});

// User analytics request
export const UserAnalyticsQuerySchema = z.object({
    username: z.string(),
    category: z.enum([
        'effects',
        'flavors',
        'terpenes',
        'medical_benefits'
    ]),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

// Leaderboard response
export const LeaderboardResponseSchema = z.object({
    data: z.array(LeaderboardEntrySchema),
    pagination: z.object({
        page: z.number().int(),
        limit: z.number().int(),
        total: z.number().int(),
        pages: z.number().int(),
    }),
});

// Category leaders response
export const CategoryLeadersResponseSchema = z.object({
    data: z.array(CategoryLeaderSchema),
});

// Analytics response
export const AnalyticsResponseSchema = z.object({
    type: z.string(),
    data: z.array(z.union([
        PopularStrainSchema,
        EffectPopularitySchema,
        FlavorPopularitySchema,
        TerpenePopularitySchema,
        MedicalConditionPopularitySchema,
    ])),
});

// Type exports
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type CategoryLeader = z.infer<typeof CategoryLeaderSchema>;
export type PopularStrain = z.infer<typeof PopularStrainSchema>;
export type EffectPopularity = z.infer<typeof EffectPopularitySchema>;
export type FlavorPopularity = z.infer<typeof FlavorPopularitySchema>;
export type TerpenePopularity = z.infer<typeof TerpenePopularitySchema>;
export type MedicalConditionPopularity = z.infer<typeof MedicalConditionPopularitySchema>;
export type LeaderboardQuery = z.infer<typeof LeaderboardQuerySchema>;
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
export type UserAnalyticsQuery = z.infer<typeof UserAnalyticsQuerySchema>;
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;
export type CategoryLeadersResponse = z.infer<typeof CategoryLeadersResponseSchema>;
export type AnalyticsResponse = z.infer<typeof AnalyticsResponseSchema>;