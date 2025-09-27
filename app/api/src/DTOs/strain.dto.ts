// Strain Data Transfer Objects

export interface Strain {
    name: string;
    url?: string;
    type: 'Indica' | 'Sativa' | 'Hybrid';
    thc?: string;
    cbd?: string;
    rating?: number;
    review_count: number;
    top_effect?: string;
    category?: string;
    image_path?: string;
    image_url?: string;
    description?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface StrainComplete extends Strain {
    strain_id?: number;
    aliases?: string;
    positive_effects?: string;
    negative_effects?: string;
    flavors?: string;
    terpenes?: string;
    medical_benefits?: string;
    parents?: string;
    children?: string;
}

export interface StrainSearch {
    name: string;
    type: 'Indica' | 'Sativa' | 'Hybrid';
    rating?: number;
    review_count: number;
    top_effect?: string;
    category?: string;
    image_path?: string;
    description?: string;
    search_text: string;
}

export interface CreateStrainRequest {
    name: string;
    url?: string;
    type: 'Indica' | 'Sativa' | 'Hybrid';
    thc?: string;
    cbd?: string;
    rating?: number;
    review_count?: number;
    top_effect?: string;
    category?: string;
    image_path?: string;
    image_url?: string;
    description?: string;
}

export interface UpdateStrainRequest {
    name?: string;
    url?: string;
    type?: 'Indica' | 'Sativa' | 'Hybrid';
    thc?: string;
    cbd?: string;
    rating?: number;
    review_count?: number;
    top_effect?: string;
    category?: string;
    image_path?: string;
    image_url?: string;
    description?: string;
}

export interface StrainQuery {
    page: number;
    limit: number;
    type?: 'Indica' | 'Sativa' | 'Hybrid';
    min_rating?: number;
    max_rating?: number;
    search?: string;
    sort: 'name' | 'rating' | 'review_count' | 'created_at';
    order: 'asc' | 'desc';
}

export interface SearchStrainsRequest {
    query: string;
    page: number;
    limit: number;
    filters?: {
        type?: 'Indica' | 'Sativa' | 'Hybrid';
        effects?: string[];
        flavors?: string[];
        terpenes?: string[];
        medical_conditions?: string[];
        min_rating?: number;
    };
}

export interface StrainResponse {
    strains: Strain[];
    total: number;
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}