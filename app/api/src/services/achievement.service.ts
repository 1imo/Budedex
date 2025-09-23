import { AchievementRepository } from '../repository/achievement.repository';
import {
    Achievement,
    UserAchievement,
    AchievementProgress,
    UserAchievementStats,
    AchievementCategory,
    UserAchievementSummary
} from '../DTOs/achievement.dto';

export class AchievementService {
    private achievementRepository: AchievementRepository;

    constructor(achievementRepository: AchievementRepository) {
        this.achievementRepository = achievementRepository;
    }

    // Get user's complete achievement summary
    async getUserAchievements(username: string): Promise<UserAchievementSummary> {
        const [progress, summary] = await Promise.all([
            this.achievementRepository.getUserAchievementProgress(username),
            this.achievementRepository.getUserAchievementSummary(username)
        ]);

        // Group achievements by category
        const categoriesMap = new Map<string, AchievementProgress[]>();

        progress.forEach(achievement => {
            if (!categoriesMap.has(achievement.category)) {
                categoriesMap.set(achievement.category, []);
            }
            categoriesMap.get(achievement.category)!.push(achievement);
        });

        // Create category summaries
        const categories: AchievementCategory[] = [];

        for (const [categoryKey, achievements] of categoriesMap) {
            const totalAchievements = achievements.length;
            const completedAchievements = achievements.filter(a => a.is_completed).length;
            const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);
            const earnedPoints = achievements.filter(a => a.is_completed).reduce((sum, a) => sum + a.points, 0);

            categories.push({
                category: categoryKey,
                title: this.getCategoryTitle(categoryKey),
                description: this.getCategoryDescription(categoryKey),
                achievements,
                total_achievements: totalAchievements,
                completed_achievements: completedAchievements,
                total_points: totalPoints,
                earned_points: earnedPoints
            });
        }

        return {
            username,
            total_achievements: summary.total_achievements,
            completed_achievements: summary.completed_achievements,
            completion_percentage: summary.completion_percentage,
            total_points_available: summary.total_points_available,
            total_points_earned: summary.total_points_earned,
            categories
        };
    }

    // Check and unlock new achievements for user
    async checkUserAchievements(username: string): Promise<UserAchievement[]> {
        return await this.achievementRepository.checkAndUnlockAchievements(username);
    }

    // Get user's achievement stats
    async getUserStats(username: string): Promise<UserAchievementStats | null> {
        return await this.achievementRepository.getUserAchievementStats(username);
    }

    // Get all achievements
    async getAllAchievements(): Promise<Achievement[]> {
        return await this.achievementRepository.getAllAchievements();
    }

    // Get achievements by category
    async getAchievementsByCategory(category: string): Promise<Achievement[]> {
        return await this.achievementRepository.getAchievementsByCategory(category);
    }

    // Get recent achievements across all users
    async getRecentAchievements(limit: number = 10): Promise<any[]> {
        return await this.achievementRepository.getRecentAchievements(limit);
    }

    // Helper methods
    private getCategoryTitle(category: string): string {
        const titles = {
            'strain_types': 'Strain Types',
            'families': 'Genetics & Families',
            'effects': 'Effects Explorer',
            'flavors': 'Flavor Profiles',
            'terpenes': 'Terpene Discovery',
            'medical': 'Medical Research',
            'exploration': 'Exploration Milestones'
        };
        return titles[category as keyof typeof titles] || category;
    }

    private getCategoryDescription(category: string): string {
        const descriptions = {
            'strain_types': 'Master different cannabis strain types',
            'families': 'Explore strain genetics and family trees',
            'effects': 'Discover the full spectrum of cannabis effects',
            'flavors': 'Experience diverse flavor profiles',
            'terpenes': 'Uncover the world of terpenes',
            'medical': 'Research medical applications and benefits',
            'exploration': 'General exploration and collection milestones'
        };
        return descriptions[category as keyof typeof descriptions] || '';
    }

    // Calculate completion percentage for achievement
    calculateCompletionPercentage(current: number, target: number): number {
        if (target === 0) return 100;
        return Math.min(Math.round((current / target) * 100), 100);
    }

    // Get rarity color class
    getRarityColor(rarity: string): string {
        const colors = {
            'common': 'text-gray-600',
            'rare': 'text-blue-600',
            'epic': 'text-purple-600',
            'legendary': 'text-yellow-600'
        };
        return colors[rarity as keyof typeof colors] || 'text-gray-600';
    }

    // Get rarity background class
    getRarityBgColor(rarity: string): string {
        const colors = {
            'common': 'bg-gray-100',
            'rare': 'bg-blue-100',
            'epic': 'bg-purple-100',
            'legendary': 'bg-yellow-100'
        };
        return colors[rarity as keyof typeof colors] || 'bg-gray-100';
    }
}

