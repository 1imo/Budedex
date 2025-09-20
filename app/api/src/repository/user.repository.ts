import { Pool } from 'pg';
import {
    User,
    Auth,
    RegisterUserRequest,
    UserSession,
    UserStats,
    UserTotals,
    Favourited,
    Seen,
    FavouriteAction,
    MarkSeen
} from '../DTOs/user.dto';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export class UserRepository {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    // User CRUD operations
    async findByUsername(username: string): Promise<User | null> {
        const query = 'SELECT * FROM users WHERE username = $1';
        const result = await this.pool.query(query, [username]);
        return result.rows[0] || null;
    }

    async create(userData: RegisterUserRequest): Promise<User> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // Create user
            const userQuery = 'INSERT INTO users (username) VALUES ($1) RETURNING *';
            const userResult = await client.query(userQuery, [userData.username]);
            const user = userResult.rows[0];

            // Create auth record
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(userData.password, saltRounds);

            const authQuery = `
                INSERT INTO auth (username, password_hash) 
                VALUES ($1, $2)
            `;
            await client.query(authQuery, [userData.username, passwordHash]);

            await client.query('COMMIT');
            return user;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async delete(username: string): Promise<boolean> {
        const query = 'DELETE FROM users WHERE username = $1';
        const result = await this.pool.query(query, [username]);
        return (result.rowCount ?? 0) > 0;
    }

    // Auth operations
    async findAuthByUsername(username: string): Promise<Auth | null> {
        const query = 'SELECT * FROM auth WHERE username = $1';
        const result = await this.pool.query(query, [username]);
        return result.rows[0] || null;
    }

    async validatePassword(username: string, password: string): Promise<boolean> {
        const auth = await this.findAuthByUsername(username);
        if (!auth) return false;

        return bcrypt.compare(password, auth.password_hash);
    }

    async updateLastLogin(username: string): Promise<void> {
        const query = 'UPDATE auth SET last_login = CURRENT_TIMESTAMP WHERE username = $1';
        await this.pool.query(query, [username]);
    }

    async incrementLoginAttempts(username: string): Promise<void> {
        const query = `
            UPDATE auth 
            SET login_attempts = login_attempts + 1,
                locked_until = CASE 
                    WHEN login_attempts >= 4 THEN CURRENT_TIMESTAMP + INTERVAL '15 minutes'
                    ELSE locked_until
                END
            WHERE username = $1
        `;
        await this.pool.query(query, [username]);
    }

    async resetLoginAttempts(username: string): Promise<void> {
        const query = 'UPDATE auth SET login_attempts = 0, locked_until = NULL WHERE username = $1';
        await this.pool.query(query, [username]);
    }

    async isAccountLocked(username: string): Promise<boolean> {
        const query = 'SELECT locked_until FROM auth WHERE username = $1';
        const result = await this.pool.query(query, [username]);

        if (!result.rows[0] || !result.rows[0].locked_until) return false;

        return new Date() < new Date(result.rows[0].locked_until);
    }

    // Session management
    async createSession(username: string, ipAddress?: string, userAgent?: string): Promise<UserSession> {
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const refreshToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const query = `
            INSERT INTO user_sessions (username, session_token, refresh_token, expires_at, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const result = await this.pool.query(query, [
            username, sessionToken, refreshToken, expiresAt, ipAddress, userAgent
        ]);

        return result.rows[0];
    }

    async findSessionByToken(sessionToken: string): Promise<UserSession | null> {
        const query = `
            SELECT * FROM user_sessions 
            WHERE session_token = $1 AND expires_at > CURRENT_TIMESTAMP AND is_active = true
        `;
        const result = await this.pool.query(query, [sessionToken]);
        return result.rows[0] || null;
    }

    async deactivateSession(sessionToken: string): Promise<void> {
        const query = 'UPDATE user_sessions SET is_active = false WHERE session_token = $1';
        await this.pool.query(query, [sessionToken]);
    }

    async deactivateAllUserSessions(username: string): Promise<void> {
        const query = 'UPDATE user_sessions SET is_active = false WHERE username = $1';
        await this.pool.query(query, [username]);
    }

    // Password reset
    async createPasswordResetToken(username: string): Promise<string> {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        const query = `
            UPDATE auth 
            SET reset_token = $1, reset_token_expires = $2 
            WHERE username = $3
        `;

        await this.pool.query(query, [resetToken, expiresAt, username]);
        return resetToken;
    }

    async validatePasswordResetToken(token: string): Promise<string | null> {
        const query = `
            SELECT username FROM auth 
            WHERE reset_token = $1 AND reset_token_expires > CURRENT_TIMESTAMP
        `;
        const result = await this.pool.query(query, [token]);
        return result.rows[0]?.username || null;
    }

    async resetPassword(username: string, newPassword: string): Promise<void> {
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        const query = `
            UPDATE auth 
            SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL,
                login_attempts = 0, locked_until = NULL
            WHERE username = $2
        `;

        await this.pool.query(query, [passwordHash, username]);
    }

    // User analytics
    async getUserStats(username: string): Promise<UserStats | null> {
        const query = 'SELECT * FROM user_stats WHERE username = $1';
        const result = await this.pool.query(query, [username]);
        return result.rows[0] || null;
    }

    async getUserTotals(username: string): Promise<UserTotals | null> {
        const query = 'SELECT * FROM user_totals WHERE username = $1';
        const result = await this.pool.query(query, [username]);
        return result.rows[0] || null;
    }

    async getUserEffects(username: string, limit: number = 10): Promise<any[]> {
        const query = 'SELECT * FROM user_effects WHERE username = $1 ORDER BY count DESC LIMIT $2';
        const result = await this.pool.query(query, [username, limit]);
        return result.rows;
    }

    async getUserFlavors(username: string, limit: number = 10): Promise<any[]> {
        const query = 'SELECT * FROM user_flavors WHERE username = $1 ORDER BY count DESC LIMIT $2';
        const result = await this.pool.query(query, [username, limit]);
        return result.rows;
    }

    async getUserTerpenes(username: string, limit: number = 10): Promise<any[]> {
        const query = 'SELECT * FROM user_terpenes WHERE username = $1 ORDER BY count DESC LIMIT $2';
        const result = await this.pool.query(query, [username, limit]);
        return result.rows;
    }

    async getUserMedicalBenefits(username: string, limit: number = 10): Promise<any[]> {
        const query = 'SELECT * FROM user_medical_benefits WHERE username = $1 ORDER BY count DESC LIMIT $2';
        const result = await this.pool.query(query, [username, limit]);
        return result.rows;
    }

    // Favourites management
    async addFavourite(username: string, strainName: string): Promise<Favourited> {
        const query = `
            INSERT INTO favourited (username, strain_name)
            VALUES ($1, $2)
            ON CONFLICT (username, strain_name) DO NOTHING
            RETURNING *
        `;
        const result = await this.pool.query(query, [username, strainName]);
        return result.rows[0];
    }

    async removeFavourite(username: string, strainName: string): Promise<boolean> {
        const query = 'DELETE FROM favourited WHERE username = $1 AND strain_name = $2';
        const result = await this.pool.query(query, [username, strainName]);
        return (result.rowCount ?? 0) > 0;
    }

    async getFavourites(username: string, page: number = 1, limit: number = 20): Promise<{ favourites: any[], total: number }> {
        const offset = (page - 1) * limit;

        // Get total count
        const countQuery = 'SELECT COUNT(*) as total FROM favourited WHERE username = $1';
        const countResult = await this.pool.query(countQuery, [username]);
        const total = parseInt(countResult.rows[0].total);

        // Get favourites with strain info
        const favouritesQuery = `
            SELECT f.*, s.* FROM favourited f
            JOIN strains s ON f.strain_name = s.name
            WHERE f.username = $1
            ORDER BY f.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const result = await this.pool.query(favouritesQuery, [username, limit, offset]);

        return { favourites: result.rows, total };
    }

    async isFavourite(username: string, strainName: string): Promise<boolean> {
        const query = 'SELECT 1 FROM favourited WHERE username = $1 AND strain_name = $2';
        const result = await this.pool.query(query, [username, strainName]);
        return result.rows.length > 0;
    }

    // Seen strains management
    async markAsSeen(username: string, strainName: string): Promise<Seen> {
        const query = `
            INSERT INTO seen (username, strain_name)
            VALUES ($1, $2)
            ON CONFLICT (username, strain_name) DO UPDATE SET seen_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        const result = await this.pool.query(query, [username, strainName]);
        return result.rows[0];
    }

    async getSeenStrains(username: string, page: number = 1, limit: number = 20): Promise<{ seen: any[], total: number }> {
        const offset = (page - 1) * limit;

        // Get total count
        const countQuery = 'SELECT COUNT(*) as total FROM seen WHERE username = $1';
        const countResult = await this.pool.query(countQuery, [username]);
        const total = parseInt(countResult.rows[0].total);

        // Get seen strains with strain info
        const seenQuery = `
            SELECT s.*, st.* FROM seen s
            JOIN strains st ON s.strain_name = st.name
            WHERE s.username = $1
            ORDER BY s.seen_at DESC
            LIMIT $2 OFFSET $3
        `;
        const result = await this.pool.query(seenQuery, [username, limit, offset]);

        return { seen: result.rows, total };
    }

    async hasSeenStrain(username: string, strainName: string): Promise<boolean> {
        const query = 'SELECT 1 FROM seen WHERE username = $1 AND strain_name = $2';
        const result = await this.pool.query(query, [username, strainName]);
        return result.rows.length > 0;
    }
}
