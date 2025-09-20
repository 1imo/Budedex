import { z } from 'zod';

// Strain validation schemas
export const StrainSchema = z.object({
    name: z.string().min(1).max(100),
    url: z.string().url().optional(),
    type: z.enum(['Indica', 'Sativa', 'Hybrid']),
    thc: z.string().max(20).optional(),
    cbd: z.string().max(20).optional(),
    rating: z.number().min(0).max(5).optional(),
    review_count: z.number().int().min(0).default(0),
    top_effect: z.string().max(50).optional(),
    category: z.string().max(50).optional(),
    image_path: z.string().max(500).optional(),
    image_url: z.string().url().max(500).optional(),
    description: z.string().optional(),
});

// Create strain validation
export const CreateStrainSchema = StrainSchema.omit({});

// Update strain validation
export const UpdateStrainSchema = CreateStrainSchema.partial();

// Strain query parameters validation
export const StrainQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(['Indica', 'Sativa', 'Hybrid']).optional(),
    min_rating: z.coerce.number().min(0).max(5).optional(),
    max_rating: z.coerce.number().min(0).max(5).optional(),
    search: z.string().optional(),
    sort: z.enum(['name', 'rating', 'review_count', 'created_at']).default('name'),
    order: z.enum(['asc', 'desc']).default('asc'),
});

// Search strains validation
export const SearchStrainsSchema = z.object({
    query: z.string().min(1),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    filters: z.object({
        type: z.enum(['Indica', 'Sativa', 'Hybrid']).optional(),
        effects: z.array(z.string()).optional(),
        flavors: z.array(z.string()).optional(),
        terpenes: z.array(z.string()).optional(),
        medical_conditions: z.array(z.string()).optional(),
        min_rating: z.number().min(0).max(5).optional(),
    }).optional(),
});

// Strain name parameter validation
export const StrainNameSchema = z.object({
    name: z.string().min(1).max(100),
});
