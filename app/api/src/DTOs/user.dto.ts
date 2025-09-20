// User Data Transfer Objects

export interface User {
  id?: string; // For compatibility with existing middleware
  username: string;
  email?: string; // For compatibility with existing middleware
  created_at?: Date;
  updated_at?: Date;
}

export interface Auth {
    id?: number;
    username: string;
    password_hash: string;
    reset_token?: string;
    reset_token_expires?: Date;
    last_login?: Date;
    login_attempts: number;
    locked_until?: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface RegisterUserRequest {
    username: string;
    password: string;
    confirmPassword: string;
}

export interface LoginUserRequest {
    username: string;
    password: string;
}

export interface PasswordResetRequest {
    username: string;
}

export interface PasswordReset {
    token: string;
    password: string;
    confirmPassword: string;
}

export interface UserSession {
    id?: number;
    username: string;
    session_token: string;
    refresh_token?: string;
    expires_at: Date;
    created_at?: Date;
    ip_address?: string;
    user_agent?: string;
    is_active: boolean;
}

export interface UserStats {
    username: string;
    favourites_count: number;
    seen_count: number;
    joined_date: Date;
}

export interface UserTotals {
    username: string;
    favourites_count: number;
    seen_count: number;
    unique_effects: number;
    total_effect_interactions: number;
    unique_positive_effects: number;
    unique_negative_effects: number;
    unique_flavors: number;
    total_flavor_interactions: number;
    unique_terpenes: number;
    total_terpene_interactions: number;
    unique_medical_conditions: number;
    total_medical_interactions: number;
    joined_date: Date;
}

export interface Favourited {
    id?: number;
    username: string;
    strain_name: string;
    created_at?: Date;
}

export interface Seen {
    id?: number;
    username: string;
    strain_name: string;
    seen_at?: Date;
}

export interface FavouriteAction {
    strain_name: string;
}

export interface MarkSeen {
    strain_name: string;
}

export interface UserResponse {
    user: User;
    stats?: UserStats;
    totals?: UserTotals;
}

export interface AuthResponse {
    user: User;
    session: UserSession;
    token: string;
}

export interface FavouritesResponse {
    favourites: any[];
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