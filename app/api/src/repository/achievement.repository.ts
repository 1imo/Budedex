import { Pool } from 'pg';
import {
    Achievement,
    UserAchievement,
    AchievementProgress,
    UserAchievementStats
} from '../DTOs/achievement.dto';

export class AchievementRepository {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    // Get all achievements
    async getAllAchievements(): Promise<Achievement[]> {
        const query = 'SELECT * FROM achievements ORDER BY category, target_value';
        const result = await this.pool.query(query);
        return result.rows;
    }

    // Get achievements by category
    async getAchievementsByCategory(category: string): Promise<Achievement[]> {
        const query = 'SELECT * FROM achievements WHERE category = $1 ORDER BY target_value';
        const result = await this.pool.query(query, [category]);
        return result.rows;
    }

    // Get user's achievement progress
    async getUserAchievementProgress(username: string): Promise<AchievementProgress[]> {
        const query = 'SELECT * FROM achievement_status WHERE username = $1 ORDER BY category, target_value';
        const result = await this.pool.query(query, [username]);
        return result.rows;
    }

    // Get user's achievement stats
    async getUserAchievementStats(username: string): Promise<UserAchievementStats | null> {
        const query = 'SELECT * FROM user_achievement_progress WHERE username = $1';
        const result = await this.pool.query(query, [username]);
        return result.rows[0] || null;
    }

    // Get completed achievements for user
    async getUserCompletedAchievements(username: string): Promise<UserAchievement[]> {
        const query = `
            SELECT ua.* FROM user_achievements ua
            WHERE ua.username = $1 AND ua.is_completed = TRUE
            ORDER BY ua.unlocked_at DESC
        `;
        const result = await this.pool.query(query, [username]);
        return result.rows;
    }

    // Check and unlock achievements for user
    async checkAndUnlockAchievements(username: string): Promise<UserAchievement[]> {
        // Get achievements that should be completed but aren't marked as such
        const checkQuery = `
            SELECT achievement_id, calculated_progress
            FROM achievement_status 
            WHERE username = $1 
            AND should_be_completed = TRUE 
            AND is_completed = FALSE
        `;
        const checkResult = await this.pool.query(checkQuery, [username]);

        const newlyUnlocked: UserAchievement[] = [];

        for (const achievement of checkResult.rows) {
            try {
                // Insert or update user achievement
                const upsertQuery = `
                    INSERT INTO user_achievements (username, achievement_id, progress_value, is_completed, unlocked_at)
                    VALUES ($1, $2, $3, TRUE, CURRENT_TIMESTAMP)
                    ON CONFLICT (username, achievement_id) 
                    DO UPDATE SET 
                        progress_value = $3,
                        is_completed = TRUE,
                        unlocked_at = CURRENT_TIMESTAMP
                    RETURNING *
                `;
                const upsertResult = await this.pool.query(upsertQuery, [
                    username,
                    achievement.achievement_id,
                    achievement.calculated_progress
                ]);

                if (upsertResult.rows[0]) {
                    newlyUnlocked.push(upsertResult.rows[0]);
                }
            } catch (error) {
                console.error(`Error unlocking achievement ${achievement.achievement_id} for ${username}:`, error);
            }
        }

        return newlyUnlocked;
    }

    // Update achievement progress for user (called when user performs actions)
    async updateAchievementProgress(username: string, achievementId: number, progressValue: number): Promise<void> {
        const query = `
            INSERT INTO user_achievements (username, achievement_id, progress_value, is_completed)
            VALUES ($1, $2, $3, FALSE)
            ON CONFLICT (username, achievement_id) 
            DO UPDATE SET progress_value = $3
        `;
        await this.pool.query(query, [username, achievementId, progressValue]);
    }

    // Get achievement by ID
    async getAchievementById(id: number): Promise<Achievement | null> {
        const query = 'SELECT * FROM achievements WHERE id = $1';
        const result = await this.pool.query(query, [id]);
        return result.rows[0] || null;
    }

    // Get user's achievement summary
    async getUserAchievementSummary(username: string): Promise<any> {
        const query = `
            SELECT 
                COUNT(*) as total_achievements,
                COUNT(CASE WHEN is_completed THEN 1 END) as completed_achievements,
                ROUND(
                    (COUNT(CASE WHEN is_completed THEN 1 END)::NUMERIC / COUNT(*)) * 100, 
                    1
                ) as completion_percentage,
                SUM(points) as total_points_available,
                SUM(CASE WHEN is_completed THEN points ELSE 0 END) as total_points_earned
            FROM achievement_status 
            WHERE username = $1
        `;
        const result = await this.pool.query(query, [username]);
        return result.rows[0];
    }

    // Get achievements by rarity
    async getAchievementsByRarity(rarity: string): Promise<Achievement[]> {
        const query = 'SELECT * FROM achievements WHERE rarity = $1 ORDER BY points DESC';
        const result = await this.pool.query(query, [rarity]);
        return result.rows;
    }

    // Get recent achievements across all users
    async getRecentAchievements(limit: number = 10): Promise<any[]> {
        const query = `
            SELECT 
                ua.username,
                ua.unlocked_at,
                a.name,
                a.description,
                a.rarity,
                a.points
            FROM user_achievements ua
            JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.is_completed = TRUE
            ORDER BY ua.unlocked_at DESC
            LIMIT $1
        `;
        const result = await this.pool.query(query, [limit]);
        return result.rows;
    }
}
