import { Pool } from 'pg';
import {
    Strain,
    StrainComplete,
    StrainSearch,
    CreateStrainRequest,
    UpdateStrainRequest,
    StrainQuery,
    SearchStrainsRequest
} from '../DTOs/strain.dto';

export class StrainRepository {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async getAll(query: StrainQuery): Promise<{ strains: Strain[], total: number }> {
        const { page, limit, type, min_rating, max_rating, search, sort, order } = query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params: any[] = [];
        let paramCount = 0;

        if (type) {
            whereClause += ` AND type = $${++paramCount}`;
            params.push(type);
        }

        if (min_rating !== undefined) {
            whereClause += ` AND rating >= $${++paramCount}`;
            params.push(min_rating);
        }

        if (max_rating !== undefined) {
            whereClause += ` AND rating <= $${++paramCount}`;
            params.push(max_rating);
        }

        if (search) {
            whereClause += ` AND (name ILIKE $${++paramCount} OR description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        const orderClause = `ORDER BY ${sort} ${order.toUpperCase()}`;

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM strains ${whereClause}`;
        const countResult = await this.pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Get strains
        const strainsQuery = `
            SELECT * FROM strains 
            ${whereClause} 
            ${orderClause}
            LIMIT $${++paramCount} OFFSET $${++paramCount}
        `;
        params.push(limit, offset);

        const result = await this.pool.query(strainsQuery, params);
        return { strains: result.rows, total };
    }

    async getAllComplete(query: StrainQuery): Promise<{ strains: StrainComplete[], total: number }> {
        const { page, limit, type, min_rating, max_rating, search, sort, order } = query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params: any[] = [];
        let paramCount = 0;

        if (type) {
            whereClause += ` AND type = $${++paramCount}`;
            params.push(type);
        }

        if (min_rating !== undefined) {
            whereClause += ` AND rating >= $${++paramCount}`;
            params.push(min_rating);
        }

        if (max_rating !== undefined) {
            whereClause += ` AND rating <= $${++paramCount}`;
            params.push(max_rating);
        }

        if (search) {
            whereClause += ` AND (name ILIKE $${++paramCount} OR description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        const orderClause = `ORDER BY ${sort} ${order.toUpperCase()}`;

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM strain_complete ${whereClause}`;
        const countResult = await this.pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Get strains with complete data including genetics
        const strainsQuery = `
            SELECT * FROM strain_complete 
            ${whereClause} 
            ${orderClause}
            LIMIT $${++paramCount} OFFSET $${++paramCount}
        `;
        params.push(limit, offset);

        const result = await this.pool.query(strainsQuery, params);
        return { strains: result.rows, total };
    }

    async getByName(name: string): Promise<Strain | null> {
        const query = 'SELECT * FROM strains WHERE name = $1';
        const result = await this.pool.query(query, [name]);
        return result.rows[0] || null;
    }

    async getComplete(name: string): Promise<StrainComplete | null> {
        const query = 'SELECT * FROM strain_complete WHERE name = $1';
        const result = await this.pool.query(query, [name]);
        return result.rows[0] || null;
    }

    async search(searchRequest: SearchStrainsRequest): Promise<{ strains: StrainSearch[], total: number }> {
        const { query: searchQuery, page, limit, filters } = searchRequest;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE search_text ILIKE $1';
        const params: any[] = [`%${searchQuery}%`];
        let paramCount = 1;

        if (filters?.type) {
            whereClause += ` AND type = $${++paramCount}`;
            params.push(filters.type);
        }

        if (filters?.min_rating !== undefined) {
            whereClause += ` AND rating >= $${++paramCount}`;
            params.push(filters.min_rating);
        }

        // Advanced filtering with effects, flavors, etc.
        if (filters?.effects && filters.effects.length > 0) {
            whereClause += ` AND name IN (
                SELECT DISTINCT se.strain_name 
                FROM strain_effects se 
                JOIN effects e ON se.effect = e.effect 
                WHERE e.effect = ANY($${++paramCount})
            )`;
            params.push(filters.effects);
        }

        if (filters?.flavors && filters.flavors.length > 0) {
            whereClause += ` AND name IN (
                SELECT DISTINCT sf.strain_name 
                FROM strain_flavors sf 
                WHERE sf.flavor = ANY($${++paramCount})
            )`;
            params.push(filters.flavors);
        }

        if (filters?.terpenes && filters.terpenes.length > 0) {
            whereClause += ` AND name IN (
                SELECT DISTINCT st.strain_name 
                FROM strain_terpenes st 
                WHERE st.terpene_name = ANY($${++paramCount})
            )`;
            params.push(filters.terpenes);
        }

        if (filters?.medical_conditions && filters.medical_conditions.length > 0) {
            whereClause += ` AND name IN (
                SELECT DISTINCT smb.strain_name 
                FROM strain_medical_benefits smb 
                WHERE smb.condition_name = ANY($${++paramCount})
            )`;
            params.push(filters.medical_conditions);
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM strain_search ${whereClause}`;
        const countResult = await this.pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Add clean search query parameter for relevance scoring
        const cleanQuery = searchQuery; // Remove % wildcards for exact matching
        params.push(cleanQuery);
        const cleanQueryParam = `$${++paramCount}`;

        // Get strains with smart ranking
        const strainsQuery = `
            SELECT *,
                -- Relevance scoring for better ranking
                CASE 
                    -- Exact name match gets highest priority
                    WHEN LOWER(name) = LOWER(${cleanQueryParam}) THEN 1000
                    -- Name starts with query gets high priority  
                    WHEN LOWER(name) LIKE LOWER(${cleanQueryParam}) || '%' THEN 900
                    -- Exact alias match gets high priority
                    WHEN EXISTS (
                        SELECT 1 FROM strain_akas sa 
                        WHERE sa.strain_name = strain_search.name 
                        AND LOWER(sa.aka) = LOWER(${cleanQueryParam})
                    ) THEN 850
                    -- Alias starts with query
                    WHEN EXISTS (
                        SELECT 1 FROM strain_akas sa 
                        WHERE sa.strain_name = strain_search.name 
                        AND LOWER(sa.aka) LIKE LOWER(${cleanQueryParam}) || '%'
                    ) THEN 800
                    -- Name contains query (word boundary)
                    WHEN LOWER(name) LIKE '% ' || LOWER(${cleanQueryParam}) || ' %' 
                      OR LOWER(name) LIKE LOWER(${cleanQueryParam}) || ' %'
                      OR LOWER(name) LIKE '% ' || LOWER(${cleanQueryParam}) THEN 700
                    -- Multiple word matches in search_text
                    WHEN (LENGTH(search_text) - LENGTH(REPLACE(LOWER(search_text), LOWER(${cleanQueryParam}), ''))) / LENGTH(${cleanQueryParam}) > 1 THEN 600
                    -- Single match in search_text
                    ELSE 500
                END as relevance_score
            FROM strain_search 
            ${whereClause} 
            ORDER BY relevance_score DESC, rating DESC NULLS LAST, review_count DESC
            LIMIT $${++paramCount} OFFSET $${++paramCount}
        `;
        params.push(limit, offset);

        const result = await this.pool.query(strainsQuery, params);
        return { strains: result.rows, total };
    }

    async create(strain: CreateStrainRequest): Promise<Strain> {
        const query = `
            INSERT INTO strains (name, url, type, thc, cbd, rating, review_count, top_effect, category, image_path, image_url, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;
        const values = [
            strain.name,
            strain.url,
            strain.type,
            strain.thc,
            strain.cbd,
            strain.rating,
            strain.review_count,
            strain.top_effect,
            strain.category,
            strain.image_path,
            strain.image_url,
            strain.description
        ];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async update(name: string, strain: UpdateStrainRequest): Promise<Strain | null> {
        const fields = Object.keys(strain).filter(key => strain[key as keyof UpdateStrainRequest] !== undefined);
        if (fields.length === 0) {
            return this.getByName(name);
        }

        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const values = [name, ...fields.map(field => strain[field as keyof UpdateStrainRequest])];

        const query = `
            UPDATE strains 
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE name = $1
            RETURNING *
        `;

        const result = await this.pool.query(query, values);
        return result.rows[0] || null;
    }

    async delete(name: string): Promise<boolean> {
        const query = 'DELETE FROM strains WHERE name = $1';
        const result = await this.pool.query(query, [name]);
        return (result.rowCount ?? 0) > 0;
    }

    async getPopularStrains(limit: number = 10, type?: string): Promise<any[]> {
        let whereClause = '';
        const params: any[] = [limit];

        if (type) {
            whereClause = 'WHERE type = $2';
            params.push(type);
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

    async getEffects(): Promise<any[]> {
        const query = 'SELECT * FROM effects ORDER BY effect';
        const result = await this.pool.query(query);
        return result.rows;
    }

    async getFlavors(): Promise<any[]> {
        const query = 'SELECT * FROM flavors ORDER BY flavor';
        const result = await this.pool.query(query);
        return result.rows;
    }

    async getTerpenes(): Promise<any[]> {
        const query = 'SELECT * FROM terpenes ORDER BY terpene_name';
        const result = await this.pool.query(query);
        return result.rows;
    }

    async getMedicalConditions(): Promise<any[]> {
        const query = 'SELECT * FROM medical_conditions ORDER BY condition_name';
        const result = await this.pool.query(query);
        return result.rows;
    }
}
