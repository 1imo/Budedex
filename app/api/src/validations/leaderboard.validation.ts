import { z } from 'zod';

// Leaderboard query validation
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

// Analytics query validation
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

// User analytics query validation
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
