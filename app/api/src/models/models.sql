-- Cannabis Strain Database - Complete Schema
-- This file contains all table definitions for the cannabis strain database

-- =============================================================================
-- DROP TABLES (for clean setup)
-- =============================================================================

-- Drop views first (removed for now)

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS rankings_overall;
DROP TABLE IF EXISTS rankings_effects;
DROP TABLE IF EXISTS rankings_flavors;
DROP TABLE IF EXISTS rankings_terpenes;
DROP TABLE IF EXISTS rankings_medical_benefits;
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS seen;
DROP TABLE IF EXISTS favourited;
DROP TABLE IF EXISTS strain_grow_info;
DROP TABLE IF EXISTS strain_genetics;
DROP TABLE IF EXISTS strain_medical_benefits;
DROP TABLE IF EXISTS medical_conditions;
DROP TABLE IF EXISTS strain_terpenes;
DROP TABLE IF EXISTS terpenes;
DROP TABLE IF EXISTS strain_flavors;
DROP TABLE IF EXISTS flavors;
DROP TABLE IF EXISTS strain_effects;
DROP TABLE IF EXISTS effects;
DROP TABLE IF EXISTS strain_akas;
DROP TABLE IF EXISTS strains;
DROP TABLE IF EXISTS auth;
DROP TABLE IF EXISTS users;

-- =============================================================================
-- CREATE TABLES
-- =============================================================================

-- 1. Users table (username as unique ID)
CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Auth table for authentication data
CREATE TABLE auth (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
    UNIQUE (username)
);

-- 3. Strains table (name as ID, comprehensive based on JSON structure)
CREATE TABLE strains (
    name VARCHAR(100) PRIMARY KEY,
    url VARCHAR(500),
    type VARCHAR(10) CHECK (type IN ('Indica', 'Sativa', 'Hybrid')) NOT NULL,
    thc VARCHAR(20),
    cbd VARCHAR(20),
    rating DECIMAL(3,2),
    review_count INT DEFAULT 0,
    top_effect VARCHAR(50),
    category VARCHAR(50),
    image_path VARCHAR(500),
    image_url VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP    -- INDEX idx_type (type)    -- INDEX idx_rating (rating)    -- INDEX idx_category (category)    -- INDEX idx_top_effect (top_effect)    -- FULLTEXT idx_description (description)
    -- FULLTEXT idx_name (name)
);

-- 4. Strain AKAs (also known as) - separate table for multiple aliases
CREATE TABLE strain_akas (
    id SERIAL PRIMARY KEY,
    strain_name VARCHAR(100) NOT NULL,
    aka VARCHAR(100) NOT NULL,
    FOREIGN KEY (strain_name) REFERENCES strains(name) ON DELETE CASCADE
    -- INDEX idx_strain_name (strain_name)
    -- FULLTEXT idx_aka (aka)
);

-- 5. Effects (normalized)
CREATE TABLE effects (
    effect VARCHAR(50) PRIMARY KEY,
    type VARCHAR(10) CHECK (type IN ('positive', 'negative')) NOT NULL
);

-- 6. Strain-Effect Junction Table
CREATE TABLE strain_effects (
    strain_name VARCHAR(100) NOT NULL,
    effect VARCHAR(50) NOT NULL,
    PRIMARY KEY (strain_name, effect),
    FOREIGN KEY (strain_name) REFERENCES strains(name) ON DELETE CASCADE,
    FOREIGN KEY (effect) REFERENCES effects(effect) ON DELETE CASCADE
);

-- 6. Flavors (normalized)
CREATE TABLE flavors (
    flavor VARCHAR(50) PRIMARY KEY
);

-- 7. Strain-Flavor Junction Table
CREATE TABLE strain_flavors (
    strain_name VARCHAR(100) NOT NULL,
    flavor VARCHAR(50) NOT NULL,
    PRIMARY KEY (strain_name, flavor),
    FOREIGN KEY (strain_name) REFERENCES strains(name) ON DELETE CASCADE,
    FOREIGN KEY (flavor) REFERENCES flavors(flavor) ON DELETE CASCADE
);

-- 8. Terpenes (normalized)
CREATE TABLE terpenes (
    terpene_name VARCHAR(50) PRIMARY KEY,
    terpene_type VARCHAR(50),
    description TEXT
);

-- 9. Strain-Terpene Junction Table
CREATE TABLE strain_terpenes (
    strain_name VARCHAR(100) NOT NULL,
    terpene_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (strain_name, terpene_name),
    FOREIGN KEY (strain_name) REFERENCES strains(name) ON DELETE CASCADE,
    FOREIGN KEY (terpene_name) REFERENCES terpenes(terpene_name) ON DELETE CASCADE
);

-- 10. Medical Conditions (normalized)
CREATE TABLE medical_conditions (
    condition_name VARCHAR(100) PRIMARY KEY
);

-- 11. Strain-Medical Benefits Junction Table
CREATE TABLE strain_medical_benefits (
    strain_name VARCHAR(100) NOT NULL,
    condition_name VARCHAR(100) NOT NULL,
    percentage INT,
    PRIMARY KEY (strain_name, condition_name),
    FOREIGN KEY (strain_name) REFERENCES strains(name) ON DELETE CASCADE,
    FOREIGN KEY (condition_name) REFERENCES medical_conditions(condition_name) ON DELETE CASCADE
);

-- 9. Strain Genetics (parents and children)
CREATE TABLE strain_genetics (
    id SERIAL PRIMARY KEY,
    strain_name VARCHAR(100) NOT NULL,
    related_strain VARCHAR(100) NOT NULL,
    relationship VARCHAR(10) CHECK (relationship IN ('parent', 'child')) NOT NULL,
    FOREIGN KEY (strain_name) REFERENCES strains(name) ON DELETE CASCADE    -- INDEX idx_strain_name (strain_name)    -- INDEX idx_related_strain (related_strain)    -- INDEX idx_relationship (relationship)
);

-- 10. Grow Information
CREATE TABLE strain_grow_info (
    id SERIAL PRIMARY KEY,
    strain_name VARCHAR(100) NOT NULL,
    flowering_time VARCHAR(50),
    yield_indoor VARCHAR(50),
    yield_outdoor VARCHAR(50),
    difficulty VARCHAR(20),
    height VARCHAR(50),
    climate VARCHAR(100),
    grow_notes TEXT,
    FOREIGN KEY (strain_name) REFERENCES strains(name) ON DELETE CASCADE    -- INDEX idx_strain_name (strain_name)
);

-- 11. Favourited Junction Table (User ID = username, Strain ID = name)
CREATE TABLE favourited (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    strain_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
    FOREIGN KEY (strain_name) REFERENCES strains(name) ON DELETE CASCADE,
    UNIQUE (username, strain_name)    -- INDEX idx_username (username)    -- INDEX idx_strain_name (strain_name)
);

-- 12. Seen Junction Table (User ID = username, Strain ID = name)
CREATE TABLE seen (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    strain_name VARCHAR(100) NOT NULL,
    seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
    FOREIGN KEY (strain_name) REFERENCES strains(name) ON DELETE CASCADE,
    UNIQUE (username, strain_name)    -- INDEX idx_username (username)    -- INDEX idx_strain_name (strain_name)    -- INDEX idx_seen_at (seen_at)
);

-- 13. User Sessions (for auth management)
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE    -- INDEX idx_username (username)    -- INDEX idx_session_token (session_token)    -- INDEX idx_expires_at (expires_at)
);

-- =============================================================================
-- ACHIEVEMENTS TABLES
-- =============================================================================

-- Master achievements table
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'strain_types', 'families', 'effects', 'flavors', 'terpenes', 'medical', 'exploration'
    type VARCHAR(50) NOT NULL, -- 'count', 'percentage', 'milestone'
    target_value INTEGER, -- Target count or percentage
    icon VARCHAR(50), -- Icon identifier
    rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
    points INTEGER DEFAULT 0, -- Points awarded for this achievement
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User achievements tracking
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    achievement_id INTEGER NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_value INTEGER DEFAULT 0, -- Current progress towards achievement
    is_completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE(username, achievement_id)
);

-- =============================================================================
-- RANKING TABLES
-- =============================================================================

-- Global rankings for medical benefits
CREATE TABLE rankings_medical_benefits (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    condition_name VARCHAR(100) NOT NULL,
    user_count INT NOT NULL,
    user_avg_percentage DECIMAL(5,2),
    user_total_percentage INT,
    global_rank INT,
    percentile DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
    UNIQUE (username, condition_name)    -- INDEX idx_username (username)    -- INDEX idx_condition (condition_name)    -- INDEX idx_global_rank (global_rank)    -- INDEX idx_percentile (percentile)
);

-- Global rankings for terpenes
CREATE TABLE rankings_terpenes (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    terpene_name VARCHAR(50) NOT NULL,
    user_count INT NOT NULL,
    global_rank INT,
    percentile DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
    UNIQUE (username, terpene_name)    -- INDEX idx_username (username)    -- INDEX idx_terpene (terpene_name)    -- INDEX idx_global_rank (global_rank)    -- INDEX idx_percentile (percentile)
);

-- Global rankings for flavors
CREATE TABLE rankings_flavors (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    flavor VARCHAR(50) NOT NULL,
    user_count INT NOT NULL,
    global_rank INT,
    percentile DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
    UNIQUE (username, flavor)    -- INDEX idx_username (username)    -- INDEX idx_flavor (flavor)    -- INDEX idx_global_rank (global_rank)    -- INDEX idx_percentile (percentile)
);

-- Global rankings for effects
CREATE TABLE rankings_effects (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    effect VARCHAR(50) NOT NULL,
    effect_type VARCHAR(10) CHECK (effect_type IN ('positive', 'negative')) NOT NULL,
    user_count INT NOT NULL,
    global_rank INT,
    percentile DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
    UNIQUE (username, effect, effect_type)    -- INDEX idx_username (username)    -- INDEX idx_effect (effect)    -- INDEX idx_effect_type (effect_type)    -- INDEX idx_global_rank (global_rank)    -- INDEX idx_percentile (percentile)
);

-- Overall user rankings (leaderboard)
CREATE TABLE rankings_overall (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    total_score INT DEFAULT 0,
    favourites_rank INT,
    seen_rank INT,
    medical_conditions_rank INT,
    terpenes_rank INT,
    flavors_rank INT,
    effects_rank INT,
    overall_rank INT,
    level_points INT DEFAULT 0,
    level_tier VARCHAR(20) DEFAULT 'Seedling',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
    UNIQUE (username)    -- INDEX idx_overall_rank (overall_rank)    -- INDEX idx_total_score (total_score)    -- INDEX idx_level_tier (level_tier)
);

