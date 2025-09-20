import { Pool } from 'pg';
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
    UserAnalyticsQuery
} from '../DTOs/leaderboard.dto';

export class LeaderboardRepository {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    // Leaderboard queries
    async getLeaderboard(query: LeaderboardQuery): Promise<{ entries: LeaderboardEntry[], total: number }> {
        const { page, limit, category } = query;
        const offset = (page - 1) * limit;

        if (category === 'overall') {
            // Get total count
            const countQuery = 'SELECT COUNT(*) as total FROM leaderboard';
            const countResult = await this.pool.query(countQuery);
            const total = parseInt(countResult.rows[0].total);

            // Get leaderboard entries
            const leaderboardQuery = `
                SELECT * FROM leaderboard 
                ORDER BY overall_rank 
                LIMIT $1 OFFSET $2
            `;
            const result = await this.pool.query(leaderboardQuery, [limit, offset]);

            return { entries: result.rows, total };
        } else {
            // Category-specific leaderboard
            const orderField = this.getCategoryOrderField(category);
            const rankField = this.getCategoryRankField(category);

            const countQuery = `SELECT COUNT(*) as total FROM user_totals WHERE ${orderField} > 0`;
            const countResult = await this.pool.query(countQuery);
            const total = parseInt(countResult.rows[0].total);

            const leaderboardQuery = `
                SELECT 
                    ut.*,
                    ROW_NUMBER() OVER (ORDER BY ${orderField} DESC) as ${rankField},
                    (ut.favourites_count * 10 + 
                     ut.seen_count * 5 + 
                     ut.unique_effects * 15 + 
                     ut.unique_flavors * 12 + 
                     ut.unique_terpenes * 20 + 
                     ut.unique_medical_conditions * 18) as total_score,
                    CASE 
                        WHEN (ut.favourites_count * 10 + ut.seen_count * 5 + ut.unique_effects * 15 + 
                              ut.unique_flavors * 12 + ut.unique_terpenes * 20 + ut.unique_medical_conditions * 18) >= 1000 
                        THEN 'Master Cultivator'
                        WHEN (ut.favourites_count * 10 + ut.seen_count * 5 + ut.unique_effects * 15 + 
                              ut.unique_flavors * 12 + ut.unique_terpenes * 20 + ut.unique_medical_conditions * 18) >= 500 
                        THEN 'Expert Grower'
                        WHEN (ut.favourites_count * 10 + ut.seen_count * 5 + ut.unique_effects * 15 + 
                              ut.unique_flavors * 12 + ut.unique_terpenes * 20 + ut.unique_medical_conditions * 18) >= 250 
                        THEN 'Advanced User'
                        WHEN (ut.favourites_count * 10 + ut.seen_count * 5 + ut.unique_effects * 15 + 
                              ut.unique_flavors * 12 + ut.unique_terpenes * 20 + ut.unique_medical_conditions * 18) >= 100 
                        THEN 'Experienced'
                        WHEN (ut.favourites_count * 10 + ut.seen_count * 5 + ut.unique_effects * 15 + 
                              ut.unique_flavors * 12 + ut.unique_terpenes * 20 + ut.unique_medical_conditions * 18) >= 50 
                        THEN 'Budding Enthusiast'
                        ELSE 'Seedling'
                    END as level_tier
                FROM user_totals ut
                WHERE ${orderField} > 0
                ORDER BY ${orderField} DESC
                LIMIT $1 OFFSET $2
            `;

            const result = await this.pool.query(leaderboardQuery, [limit, offset]);
            return { entries: result.rows, total };
        }
    }

    async getCategoryLeaders(): Promise<CategoryLeader[]> {
        const query = 'SELECT * FROM category_leaders ORDER BY category, rank';
        const result = await this.pool.query(query);
        return result.rows;
    }

    async getUserRank(username: string): Promise<LeaderboardEntry | null> {
        const query = 'SELECT * FROM leaderboard WHERE username = $1';
        const result = await this.pool.query(query, [username]);
        return result.rows[0] || null;
    }

    // Analytics queries
    async getPopularStrains(limit: number = 10, strainType?: string): Promise<PopularStrain[]> {
        let whereClause = '';
        const params: any[] = [limit];

        if (strainType) {
            whereClause = 'WHERE type = $2';
            params.push(strainType);
        }

        const query = `
            SELECT * FROM popular_strains 
            ${whereClause}
            ORDER BY popularity_score DESC
            LIMIT $1
        `;

        const result = await this.pool.query(query, params);
        return result.rows;
    }

    async getEffectPopularity(limit: number = 10): Promise<EffectPopularity[]> {
        const query = `
            SELECT * FROM effect_popularity 
            ORDER BY strain_count DESC, user_interactions DESC
            LIMIT $1
        `;
        const result = await this.pool.query(query, [limit]);
        return result.rows;
    }

    async getFlavorPopularity(limit: number = 10): Promise<FlavorPopularity[]> {
        const query = `
            SELECT * FROM flavor_popularity 
            ORDER BY strain_count DESC, user_interactions DESC
            LIMIT $1
        `;
        const result = await this.pool.query(query, [limit]);
        return result.rows;
    }

    async getTerpenePopularity(limit: number = 10): Promise<TerpenePopularity[]> {
        const query = `
            SELECT * FROM terpene_popularity 
            ORDER BY strain_count DESC, user_interactions DESC
            LIMIT $1
        `;
        const result = await this.pool.query(query, [limit]);
        return result.rows;
    }

    async getMedicalConditionPopularity(limit: number = 10): Promise<MedicalConditionPopularity[]> {
        const query = `
            SELECT * FROM medical_condition_popularity 
            ORDER BY strain_count DESC, avg_effectiveness DESC
            LIMIT $1
        `;
        const result = await this.pool.query(query, [limit]);
        return result.rows;
    }

    // User-specific analytics
    async getUserAnalytics(query: UserAnalyticsQuery): Promise<any[]> {
        const { username, category, limit } = query;

        switch (category) {
            case 'effects':
                return this.getUserEffects(username, limit);
            case 'flavors':
                return this.getUserFlavors(username, limit);
            case 'terpenes':
                return this.getUserTerpenes(username, limit);
            case 'medical_benefits':
                return this.getUserMedicalBenefits(username, limit);
            default:
                return [];
        }
    }

    private async getUserEffects(username: string, limit: number): Promise<any[]> {
        const query = `
            SELECT * FROM user_effects 
            WHERE username = $1 
            ORDER BY count DESC 
            LIMIT $2
        `;
        const result = await this.pool.query(query, [username, limit]);
        return result.rows;
    }

    private async getUserFlavors(username: string, limit: number): Promise<any[]> {
        const query = `
            SELECT * FROM user_flavors 
            WHERE username = $1 
            ORDER BY count DESC 
            LIMIT $2
        `;
        const result = await this.pool.query(query, [username, limit]);
        return result.rows;
    }

    private async getUserTerpenes(username: string, limit: number): Promise<any[]> {
        const query = `
            SELECT * FROM user_terpenes 
            WHERE username = $1 
            ORDER BY count DESC 
            LIMIT $2
        `;
        const result = await this.pool.query(query, [username, limit]);
        return result.rows;
    }

    private async getUserMedicalBenefits(username: string, limit: number): Promise<any[]> {
        const query = `
            SELECT * FROM user_medical_benefits 
            WHERE username = $1 
            ORDER BY count DESC 
            LIMIT $2
        `;
        const result = await this.pool.query(query, [username, limit]);
        return result.rows;
    }

    // Global statistics
    async getGlobalStats(): Promise<any> {
        const queries = await Promise.all([
            this.pool.query('SELECT COUNT(*) as total_strains FROM strains'),
            this.pool.query('SELECT COUNT(*) as total_users FROM users'),
            this.pool.query('SELECT COUNT(*) as total_effects FROM effects'),
            this.pool.query('SELECT COUNT(*) as total_flavors FROM flavors'),
            this.pool.query('SELECT COUNT(*) as total_terpenes FROM terpenes'),
            this.pool.query('SELECT COUNT(*) as total_conditions FROM medical_conditions'),
            this.pool.query('SELECT COUNT(*) as total_favourites FROM favourited'),
            this.pool.query('SELECT COUNT(*) as total_seen FROM seen'),
        ]);

        return {
            total_strains: parseInt(queries[0].rows[0].total_strains),
            total_users: parseInt(queries[1].rows[0].total_users),
            total_effects: parseInt(queries[2].rows[0].total_effects),
            total_flavors: parseInt(queries[3].rows[0].total_flavors),
            total_terpenes: parseInt(queries[4].rows[0].total_terpenes),
            total_conditions: parseInt(queries[5].rows[0].total_conditions),
            total_favourites: parseInt(queries[6].rows[0].total_favourites),
            total_seen: parseInt(queries[7].rows[0].total_seen),
        };
    }

    // Helper methods
    private getCategoryOrderField(category: string): string {
        switch (category) {
            case 'favourites':
                return 'favourites_count';
            case 'seen':
                return 'seen_count';
            case 'effects':
                return 'unique_effects';
            case 'flavors':
                return 'unique_flavors';
            case 'terpenes':
                return 'unique_terpenes';
            case 'medical_conditions':
                return 'unique_medical_conditions';
            default:
                return 'favourites_count';
        }
    }

    private getCategoryRankField(category: string): string {
        switch (category) {
            case 'favourites':
                return 'favourites_rank';
            case 'seen':
                return 'seen_rank';
            case 'effects':
                return 'effects_rank';
            case 'flavors':
                return 'flavors_rank';
            case 'terpenes':
                return 'terpenes_rank';
            case 'medical_conditions':
                return 'medical_conditions_rank';
            default:
                return 'favourites_rank';
        }
    }
}
