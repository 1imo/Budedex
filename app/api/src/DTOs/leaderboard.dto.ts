// Leaderboard Data Transfer Objects

export interface LeaderboardEntry {
    username: string;
    total_score: number;
    overall_rank: number;
    level_tier: 'Seedling' | 'Budding Enthusiast' | 'Experienced' | 'Advanced User' | 'Expert Grower' | 'Master Cultivator';
    favourites_count: number;
    seen_count: number;
    unique_effects: number;
    unique_flavors: number;
    unique_terpenes: number;
    unique_medical_conditions: number;
    favourites_rank: number;
    seen_rank: number;
    effects_rank: number;
    flavors_rank: number;
    terpenes_rank: number;
    medical_conditions_rank: number;
    joined_date: Date;
}

export interface CategoryLeader {
    category: 'favourites' | 'seen' | 'effects' | 'flavors' | 'terpenes' | 'medical_conditions';
    username: string;
    count: number;
    rank: number;
}

export interface PopularStrain {
    name: string;
    type: 'Indica' | 'Sativa' | 'Hybrid';
    rating?: number;
    review_count: number;
    favourite_count: number;
    seen_count: number;
    popularity_score: number;
}

export interface EffectPopularity {
    effect: string;
    type: 'positive' | 'negative';
    strain_count: number;
    user_interactions: number;
}

export interface FlavorPopularity {
    flavor: string;
    strain_count: number;
    user_interactions: number;
}

export interface TerpenePopularity {
    terpene_name: string;
    terpene_type?: string;
    strain_count: number;
    user_interactions: number;
}

export interface MedicalConditionPopularity {
    condition_name: string;
    strain_count: number;
    avg_effectiveness?: number;
    user_interactions: number;
}

export interface LeaderboardQuery {
    page: number;
    limit: number;
    category: 'overall' | 'favourites' | 'seen' | 'effects' | 'flavors' | 'terpenes' | 'medical_conditions';
}

export interface AnalyticsQuery {
    type: 'popular_strains' | 'effect_popularity' | 'flavor_popularity' | 'terpene_popularity' | 'medical_condition_popularity';
    limit: number;
    strain_type?: 'Indica' | 'Sativa' | 'Hybrid';
}

export interface UserAnalyticsQuery {
    username: string;
    category: 'effects' | 'flavors' | 'terpenes' | 'medical_benefits';
    limit: number;
}

export interface LeaderboardResponse {
    data: LeaderboardEntry[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface CategoryLeadersResponse {
    data: CategoryLeader[];
}

export interface AnalyticsResponse {
    type: string;
    data: (PopularStrain | EffectPopularity | FlavorPopularity | TerpenePopularity | MedicalConditionPopularity)[];
}

export interface GlobalStats {
    total_strains: number;
    total_users: number;
    total_effects: number;
    total_flavors: number;
    total_terpenes: number;
    total_conditions: number;
    total_favourites: number;
    total_seen: number;
}