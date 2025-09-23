// Achievement-related DTOs

export interface Achievement {
    id: number;
    name: string;
    description: string;
    category: string;
    type: string;
    target_value: number;
    icon: string;
    rarity: string;
    points: number;
    created_at: string;
}

export interface UserAchievement {
    id: number;
    username: string;
    achievement_id: number;
    unlocked_at: string;
    progress_value: number;
    is_completed: boolean;
}

export interface AchievementProgress {
    username: string;
    achievement_id: number;
    name: string;
    description: string;
    category: string;
    type: string;
    target_value: number;
    icon: string;
    rarity: string;
    points: number;
    current_progress: number;
    is_completed: boolean;
    unlocked_at: string | null;
    calculated_progress: number;
    should_be_completed: boolean;
    completion_percentage: number;
}

export interface UserAchievementStats {
    username: string;
    // Strain types
    hybrid_strains_seen: number;
    indica_strains_seen: number;
    sativa_strains_seen: number;
    hybrid_strains_favorited: number;
    indica_strains_favorited: number;
    sativa_strains_favorited: number;

    // Family trees
    complete_family_trees_seen: number;
    complete_family_trees_favorited: number;
    landrace_strains_seen: number;
    landrace_strains_favorited: number;

    // Coverage percentages
    total_effects_available: number;
    unique_effects_discovered: number;
    effects_completion_percentage: number;

    total_flavors_available: number;
    unique_flavors_discovered: number;
    flavors_completion_percentage: number;

    total_terpenes_available: number;
    unique_terpenes_discovered: number;
    terpenes_completion_percentage: number;

    total_conditions_available: number;
    unique_conditions_discovered: number;
    conditions_completion_percentage: number;

    // Exploration
    total_strains_seen: number;
    total_strains_favorited: number;
    total_strains_available: number;
    strains_completion_percentage: number;
}

export interface AchievementCategory {
    category: string;
    title: string;
    description: string;
    achievements: AchievementProgress[];
    total_achievements: number;
    completed_achievements: number;
    total_points: number;
    earned_points: number;
}

export interface UserAchievementSummary {
    username: string;
    total_achievements: number;
    completed_achievements: number;
    completion_percentage: number;
    total_points_available: number;
    total_points_earned: number;
    categories: AchievementCategory[];
}

