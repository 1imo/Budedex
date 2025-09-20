import { LeaderboardRepository } from '../repository/leaderboard.repository';
import {
    LeaderboardEntry,
    CategoryLeader,
    PopularStrain,
    EffectPopularity,
    FlavorPopularity,
    TerpenePopularity,
    MedicalConditionPopularity,
    LeaderboardQuery,
    AnalyticsQuery,
    UserAnalyticsQuery,
    LeaderboardResponse,
    CategoryLeadersResponse,
    AnalyticsResponse
} from '../DTOs/leaderboard.dto';

export class LeaderboardService {
    private leaderboardRepository: LeaderboardRepository;

    constructor(leaderboardRepository: LeaderboardRepository) {
        this.leaderboardRepository = leaderboardRepository;
    }

    // Leaderboard methods
    async getLeaderboard(query: LeaderboardQuery): Promise<LeaderboardResponse> {
        const { entries, total } = await this.leaderboardRepository.getLeaderboard(query);

        const pagination = {
            page: query.page,
            limit: query.limit,
            total,
            pages: Math.ceil(total / query.limit),
        };

        return {
            data: entries,
            pagination
        };
    }

    async getCategoryLeaders(): Promise<CategoryLeadersResponse> {
        const leaders = await this.leaderboardRepository.getCategoryLeaders();

        return {
            data: leaders
        };
    }

    async getUserRank(username: string): Promise<LeaderboardEntry | null> {
        return await this.leaderboardRepository.getUserRank(username);
    }

    // Analytics methods
    async getAnalytics(query: AnalyticsQuery): Promise<AnalyticsResponse> {
        const { type, limit, strain_type } = query;
        let data: any[] = [];

        switch (type) {
            case 'popular_strains':
                data = await this.leaderboardRepository.getPopularStrains(limit, strain_type);
                break;
            case 'effect_popularity':
                data = await this.leaderboardRepository.getEffectPopularity(limit);
                break;
            case 'flavor_popularity':
                data = await this.leaderboardRepository.getFlavorPopularity(limit);
                break;
            case 'terpene_popularity':
                data = await this.leaderboardRepository.getTerpenePopularity(limit);
                break;
            case 'medical_condition_popularity':
                data = await this.leaderboardRepository.getMedicalConditionPopularity(limit);
                break;
            default:
                throw new Error(`Invalid analytics type: ${type}`);
        }

        return {
            type,
            data
        };
    }

    async getUserAnalytics(query: UserAnalyticsQuery): Promise<any[]> {
        return await this.leaderboardRepository.getUserAnalytics(query);
    }

    async getGlobalStats(): Promise<any> {
        return await this.leaderboardRepository.getGlobalStats();
    }

    // Utility methods for level calculation
    calculateLevel(totalScore: number): string {
        if (totalScore >= 1000) return 'Master Cultivator';
        if (totalScore >= 500) return 'Expert Grower';
        if (totalScore >= 250) return 'Advanced User';
        if (totalScore >= 100) return 'Experienced';
        if (totalScore >= 50) return 'Budding Enthusiast';
        return 'Seedling';
    }

    calculateScore(stats: any): number {
        const {
            favourites_count = 0,
            seen_count = 0,
            unique_effects = 0,
            unique_flavors = 0,
            unique_terpenes = 0,
            unique_medical_conditions = 0
        } = stats;

        return (
            favourites_count * 10 +
            seen_count * 5 +
            unique_effects * 15 +
            unique_flavors * 12 +
            unique_terpenes * 20 +
            unique_medical_conditions * 18
        );
    }

    getNextLevelThreshold(currentLevel: string): { nextLevel: string, pointsNeeded: number } {
        const levelThresholds = {
            'Seedling': { next: 'Budding Enthusiast', threshold: 50 },
            'Budding Enthusiast': { next: 'Experienced', threshold: 100 },
            'Experienced': { next: 'Advanced User', threshold: 250 },
            'Advanced User': { next: 'Expert Grower', threshold: 500 },
            'Expert Grower': { next: 'Master Cultivator', threshold: 1000 },
            'Master Cultivator': { next: 'Master Cultivator', threshold: Infinity }
        };

        return {
            nextLevel: levelThresholds[currentLevel as keyof typeof levelThresholds]?.next || 'Master Cultivator',
            pointsNeeded: levelThresholds[currentLevel as keyof typeof levelThresholds]?.threshold || Infinity
        };
    }

    // Analytics helper methods
    async getTopPerformers(category: string, limit: number = 10): Promise<any[]> {
        const query: LeaderboardQuery = {
            page: 1,
            limit,
            category: category as any
        };

        const { data } = await this.getLeaderboard(query);
        return data;
    }

    async getStrainAnalytics(strainName: string): Promise<any> {
        // This would require additional repository methods
        // For now, return basic structure
        return {
            strain_name: strainName,
            favourite_count: 0,
            seen_count: 0,
            average_user_rating: 0,
            popularity_rank: 0
        };
    }

    // Ranking calculation helpers
    calculatePercentile(rank: number, total: number): number {
        if (total === 0) return 100;
        return Math.round(((total - rank + 1) / total) * 100);
    }

    formatRankDisplay(rank: number): string {
        if (rank === 1) return '1st';
        if (rank === 2) return '2nd';
        if (rank === 3) return '3rd';
        return `${rank}th`;
    }

    // Achievement system helpers
    checkAchievements(userStats: any): string[] {
        const achievements: string[] = [];

        if (userStats.favourites_count >= 100) {
            achievements.push('Strain Collector');
        }

        if (userStats.seen_count >= 500) {
            achievements.push('Explorer');
        }

        if (userStats.unique_effects >= 15) {
            achievements.push('Effect Connoisseur');
        }

        if (userStats.unique_terpenes >= 8) {
            achievements.push('Terpene Expert');
        }

        if (userStats.unique_medical_conditions >= 20) {
            achievements.push('Medical Researcher');
        }

        return achievements;
    }

    // Recommendation helpers
  async getRecommendationsForUser(username: string): Promise<any[]> {
    // This would analyze user preferences and suggest similar strains
    // For now, return empty array
    return [];
  }

  // Legacy methods for controller compatibility
  async updateUserScore(username: string): Promise<void> {
    // This would update ranking tables
    // For now, do nothing as we use dynamic views
    console.log(`Score update triggered for user: ${username}`);
  }

  async getUserScore(username: string): Promise<any> {
    // Get user's current leaderboard position
    const userRank = await this.getUserRank(username);
    return userRank ? {
      total_score: userRank.total_score,
      overall_rank: userRank.overall_rank,
      level_tier: userRank.level_tier
    } : null;
  }
}