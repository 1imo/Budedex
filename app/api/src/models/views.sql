-- Cannabis Strain Database - Views
-- This file contains all view definitions for efficient querying

-- =============================================================================
-- STRAIN VIEWS
-- =============================================================================

-- Complete strain information with all related data
CREATE VIEW strain_complete AS
SELECT 
    s.*,
    -- Aliases
    STRING_AGG(DISTINCT sa.aka, ', ') as aliases,
    -- Effects
    STRING_AGG(DISTINCT CASE WHEN e.type = 'positive' THEN e.effect END, ', ') as positive_effects,
    STRING_AGG(DISTINCT CASE WHEN e.type = 'negative' THEN e.effect END, ', ') as negative_effects,
    -- Flavors
    STRING_AGG(DISTINCT f.flavor, ', ') as flavors,
    -- Terpenes
    STRING_AGG(DISTINCT t.terpene_name, ', ') as terpenes,
    -- Medical conditions with percentages
    STRING_AGG(DISTINCT CONCAT(mc.condition_name, ' (', smb.percentage, '%)'), ', ') as medical_benefits,
    -- Genetics
    STRING_AGG(DISTINCT CASE WHEN sg.relationship = 'parent' THEN sg.related_strain END, ', ') as parents,
    STRING_AGG(DISTINCT CASE WHEN sg.relationship = 'child' THEN sg.related_strain END, ', ') as children
FROM strains s
LEFT JOIN strain_akas sa ON s.name = sa.strain_name
LEFT JOIN strain_effects se ON s.name = se.strain_name
LEFT JOIN effects e ON se.effect = e.effect
LEFT JOIN strain_flavors sf ON s.name = sf.strain_name
LEFT JOIN flavors f ON sf.flavor = f.flavor
LEFT JOIN strain_terpenes st ON s.name = st.strain_name
LEFT JOIN terpenes t ON st.terpene_name = t.terpene_name
LEFT JOIN strain_medical_benefits smb ON s.name = smb.strain_name
LEFT JOIN medical_conditions mc ON smb.condition_name = mc.condition_name
LEFT JOIN strain_genetics sg ON s.name = sg.strain_name
GROUP BY s.name, s.url, s.type, s.thc, s.cbd, s.rating, s.review_count, 
         s.top_effect, s.category, s.image_path, s.image_url, s.description, 
         s.created_at, s.updated_at;

-- Strain search view (optimized for search queries)
CREATE VIEW strain_search AS
SELECT 
    s.name,
    s.type,
    s.rating,
    s.review_count,
    s.top_effect,
    s.category,
    s.image_path,
    s.description,
    -- Search-friendly concatenated fields
    s.name || ' ' || 
    COALESCE(STRING_AGG(DISTINCT sa.aka, ' '), '') || ' ' ||
    COALESCE(STRING_AGG(DISTINCT e.effect, ' '), '') || ' ' ||
    COALESCE(STRING_AGG(DISTINCT f.flavor, ' '), '') || ' ' ||
    COALESCE(STRING_AGG(DISTINCT t.terpene_name, ' '), '') || ' ' ||
    COALESCE(STRING_AGG(DISTINCT mc.condition_name, ' '), '') || ' ' ||
    COALESCE(s.description, '') as search_text
FROM strains s
LEFT JOIN strain_akas sa ON s.name = sa.strain_name
LEFT JOIN strain_effects se ON s.name = se.strain_name
LEFT JOIN effects e ON se.effect = e.effect
LEFT JOIN strain_flavors sf ON s.name = sf.strain_name
LEFT JOIN flavors f ON sf.flavor = f.flavor
LEFT JOIN strain_terpenes st ON s.name = st.strain_name
LEFT JOIN terpenes t ON st.terpene_name = t.terpene_name
LEFT JOIN strain_medical_benefits smb ON s.name = smb.strain_name
LEFT JOIN medical_conditions mc ON smb.condition_name = mc.condition_name
GROUP BY s.name, s.type, s.rating, s.review_count, s.top_effect, 
         s.category, s.image_path, s.description;

-- =============================================================================
-- USER ANALYTICS VIEWS
-- =============================================================================

-- Basic user statistics
CREATE VIEW user_stats AS
SELECT 
    u.username,
    COUNT(DISTINCT f.strain_name) as favourites_count,
    COUNT(DISTINCT s.strain_name) as seen_count,
    u.created_at as joined_date
FROM users u
LEFT JOIN favourited f ON u.username = f.username
LEFT JOIN seen s ON u.username = s.username
GROUP BY u.username, u.created_at;

-- User effects from seen strains
CREATE VIEW user_effects AS
SELECT 
    s.username,
    e.effect,
    e.type as effect_type,
    COUNT(*) as count
FROM seen s
JOIN strain_effects se ON s.strain_name = se.strain_name
JOIN effects e ON se.effect = e.effect
GROUP BY s.username, e.effect, e.type
ORDER BY s.username, count DESC;

-- User flavors from seen strains
CREATE VIEW user_flavors AS
SELECT 
    s.username,
    f.flavor,
    COUNT(*) as count
FROM seen s
JOIN strain_flavors sf ON s.strain_name = sf.strain_name
JOIN flavors f ON sf.flavor = f.flavor
GROUP BY s.username, f.flavor
ORDER BY s.username, count DESC;

-- User terpenes from seen strains
CREATE VIEW user_terpenes AS
SELECT 
    s.username,
    t.terpene_name,
    COUNT(*) as count
FROM seen s
JOIN strain_terpenes st ON s.strain_name = st.strain_name
JOIN terpenes t ON st.terpene_name = t.terpene_name
GROUP BY s.username, t.terpene_name
ORDER BY s.username, count DESC;

-- User medical benefits from seen strains
CREATE VIEW user_medical_benefits AS
SELECT 
    s.username,
    mc.condition_name,
    COUNT(*) as count,
    AVG(smb.percentage) as avg_percentage,
    SUM(smb.percentage) as total_percentage
FROM seen s
JOIN strain_medical_benefits smb ON s.strain_name = smb.strain_name
JOIN medical_conditions mc ON smb.condition_name = mc.condition_name
GROUP BY s.username, mc.condition_name
ORDER BY s.username, count DESC;

-- Comprehensive user totals for ranking
CREATE VIEW user_totals AS
SELECT 
    u.username,
    -- Basic counts
    COALESCE(stats.favourites_count, 0) as favourites_count,
    COALESCE(stats.seen_count, 0) as seen_count,
    -- Effects totals
    COALESCE(effect_totals.unique_effects, 0) as unique_effects,
    COALESCE(effect_totals.total_effect_interactions, 0) as total_effect_interactions,
    COALESCE(pos_effects.unique_positive_effects, 0) as unique_positive_effects,
    COALESCE(neg_effects.unique_negative_effects, 0) as unique_negative_effects,
    -- Flavors totals
    COALESCE(flavor_totals.unique_flavors, 0) as unique_flavors,
    COALESCE(flavor_totals.total_flavor_interactions, 0) as total_flavor_interactions,
    -- Terpenes totals
    COALESCE(terpene_totals.unique_terpenes, 0) as unique_terpenes,
    COALESCE(terpene_totals.total_terpene_interactions, 0) as total_terpene_interactions,
    -- Medical benefits totals
    COALESCE(medical_totals.unique_conditions, 0) as unique_medical_conditions,
    COALESCE(medical_totals.total_medical_interactions, 0) as total_medical_interactions,
    u.created_at as joined_date
FROM users u
LEFT JOIN user_stats stats ON u.username = stats.username
LEFT JOIN (
    SELECT username,
           COUNT(DISTINCT effect) as unique_effects,
           SUM(count) as total_effect_interactions
    FROM user_effects
    GROUP BY username
) effect_totals ON u.username = effect_totals.username
LEFT JOIN (
    SELECT username,
           COUNT(DISTINCT effect) as unique_positive_effects
    FROM user_effects
    WHERE effect_type = 'positive'
    GROUP BY username
) pos_effects ON u.username = pos_effects.username
LEFT JOIN (
    SELECT username,
           COUNT(DISTINCT effect) as unique_negative_effects
    FROM user_effects
    WHERE effect_type = 'negative'
    GROUP BY username
) neg_effects ON u.username = neg_effects.username
LEFT JOIN (
    SELECT username,
           COUNT(DISTINCT flavor) as unique_flavors,
           SUM(count) as total_flavor_interactions
    FROM user_flavors
    GROUP BY username
) flavor_totals ON u.username = flavor_totals.username
LEFT JOIN (
    SELECT username,
           COUNT(DISTINCT terpene_name) as unique_terpenes,
           SUM(count) as total_terpene_interactions
    FROM user_terpenes
    GROUP BY username
) terpene_totals ON u.username = terpene_totals.username
LEFT JOIN (
    SELECT username,
           COUNT(DISTINCT condition_name) as unique_conditions,
           SUM(count) as total_medical_interactions
    FROM user_medical_benefits
    GROUP BY username
) medical_totals ON u.username = medical_totals.username;

-- =============================================================================
-- LEADERBOARD VIEWS
-- =============================================================================

-- Dynamic leaderboard with calculated rankings
CREATE VIEW leaderboard AS
SELECT 
    ut.username,
    -- Calculate total score based on all activities
    (ut.favourites_count * 10 + 
     ut.seen_count * 5 + 
     ut.unique_effects * 15 + 
     ut.unique_flavors * 12 + 
     ut.unique_terpenes * 20 + 
     ut.unique_medical_conditions * 18) as total_score,
    -- Calculate overall rank
    ROW_NUMBER() OVER (ORDER BY 
        (ut.favourites_count * 10 + 
         ut.seen_count * 5 + 
         ut.unique_effects * 15 + 
         ut.unique_flavors * 12 + 
         ut.unique_terpenes * 20 + 
         ut.unique_medical_conditions * 18) DESC) as overall_rank,
    -- Calculate level tier based on total score
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
    END as level_tier,
    -- Individual stats
    ut.favourites_count,
    ut.seen_count,
    ut.unique_effects,
    ut.unique_flavors,
    ut.unique_terpenes,
    ut.unique_medical_conditions,
    -- Individual category ranks
    ROW_NUMBER() OVER (ORDER BY ut.favourites_count DESC) as favourites_rank,
    ROW_NUMBER() OVER (ORDER BY ut.seen_count DESC) as seen_rank,
    ROW_NUMBER() OVER (ORDER BY ut.unique_effects DESC) as effects_rank,
    ROW_NUMBER() OVER (ORDER BY ut.unique_flavors DESC) as flavors_rank,
    ROW_NUMBER() OVER (ORDER BY ut.unique_terpenes DESC) as terpenes_rank,
    ROW_NUMBER() OVER (ORDER BY ut.unique_medical_conditions DESC) as medical_conditions_rank,
    ut.joined_date
FROM user_totals ut
ORDER BY total_score DESC;

-- Category leaders (top 10 in each category)
CREATE VIEW category_leaders AS
(
    SELECT 
        'favourites' as category,
        username,
        favourites_count as count,
        ROW_NUMBER() OVER (ORDER BY favourites_count DESC) as rank
    FROM user_totals
    WHERE favourites_count > 0
    ORDER BY favourites_count DESC
    LIMIT 10
)
UNION ALL
(
    SELECT 
        'seen' as category,
        username,
        seen_count as count,
        ROW_NUMBER() OVER (ORDER BY seen_count DESC) as rank
    FROM user_totals
    WHERE seen_count > 0
    ORDER BY seen_count DESC
    LIMIT 10
)
UNION ALL
(
    SELECT 
        'effects' as category,
        username,
        unique_effects as count,
        ROW_NUMBER() OVER (ORDER BY unique_effects DESC) as rank
    FROM user_totals
    WHERE unique_effects > 0
    ORDER BY unique_effects DESC
    LIMIT 10
)
UNION ALL
(
    SELECT 
        'flavors' as category,
        username,
        unique_flavors as count,
        ROW_NUMBER() OVER (ORDER BY unique_flavors DESC) as rank
    FROM user_totals
    WHERE unique_flavors > 0
    ORDER BY unique_flavors DESC
    LIMIT 10
)
UNION ALL
(
    SELECT 
        'terpenes' as category,
        username,
        unique_terpenes as count,
        ROW_NUMBER() OVER (ORDER BY unique_terpenes DESC) as rank
    FROM user_totals
    WHERE unique_terpenes > 0
    ORDER BY unique_terpenes DESC
    LIMIT 10
)
UNION ALL
(
    SELECT 
        'medical_conditions' as category,
        username,
        unique_medical_conditions as count,
        ROW_NUMBER() OVER (ORDER BY unique_medical_conditions DESC) as rank
    FROM user_totals
    WHERE unique_medical_conditions > 0
    ORDER BY unique_medical_conditions DESC
    LIMIT 10
);

-- =============================================================================
-- ANALYTICS VIEWS
-- =============================================================================

-- Popular strains by various metrics
CREATE VIEW popular_strains AS
SELECT 
    s.name,
    s.type,
    s.rating,
    s.review_count,
    COUNT(DISTINCT f.username) as favourite_count,
    COUNT(DISTINCT se.username) as seen_count,
    -- Popularity score (weighted)
    (s.rating * 0.3 + 
     (s.review_count / 100.0) * 0.2 + 
     COUNT(DISTINCT f.username) * 0.3 + 
     COUNT(DISTINCT se.username) * 0.2) as popularity_score
FROM strains s
LEFT JOIN favourited f ON s.name = f.strain_name
LEFT JOIN seen se ON s.name = se.strain_name
GROUP BY s.name, s.type, s.rating, s.review_count
ORDER BY popularity_score DESC;

-- Effect popularity
CREATE VIEW effect_popularity AS
SELECT 
    e.effect,
    e.type,
    COUNT(DISTINCT se.strain_name) as strain_count,
    COUNT(DISTINCT f.username) as user_interactions
FROM effects e
LEFT JOIN strain_effects se ON e.effect = se.effect
LEFT JOIN seen s ON se.strain_name = s.strain_name
LEFT JOIN favourited f ON se.strain_name = f.strain_name
GROUP BY e.effect, e.type
ORDER BY strain_count DESC, user_interactions DESC;

-- Flavor popularity
CREATE VIEW flavor_popularity AS
SELECT 
    f.flavor,
    COUNT(DISTINCT sf.strain_name) as strain_count,
    COUNT(DISTINCT fav.username) as user_interactions
FROM flavors f
LEFT JOIN strain_flavors sf ON f.flavor = sf.flavor
LEFT JOIN favourited fav ON sf.strain_name = fav.strain_name
GROUP BY f.flavor
ORDER BY strain_count DESC, user_interactions DESC;

-- Terpene popularity
CREATE VIEW terpene_popularity AS
SELECT 
    t.terpene_name,
    t.terpene_type,
    COUNT(DISTINCT st.strain_name) as strain_count,
    COUNT(DISTINCT s.username) as user_interactions
FROM terpenes t
LEFT JOIN strain_terpenes st ON t.terpene_name = st.terpene_name
LEFT JOIN seen s ON st.strain_name = s.strain_name
GROUP BY t.terpene_name, t.terpene_type
ORDER BY strain_count DESC, user_interactions DESC;

-- Medical condition popularity
CREATE VIEW medical_condition_popularity AS
SELECT 
    mc.condition_name,
    COUNT(DISTINCT smb.strain_name) as strain_count,
    AVG(smb.percentage) as avg_effectiveness,
    COUNT(DISTINCT s.username) as user_interactions
FROM medical_conditions mc
LEFT JOIN strain_medical_benefits smb ON mc.condition_name = smb.condition_name
LEFT JOIN seen s ON smb.strain_name = s.strain_name
GROUP BY mc.condition_name
ORDER BY strain_count DESC, avg_effectiveness DESC;
