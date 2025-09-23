-- Achievement definitions
-- This file populates the achievements table with predefined achievements

INSERT INTO achievements (name, description, category, type, target_value, icon, rarity, points) VALUES

-- Strain Type Achievements
('Hybrid Explorer I', 'See 10 different Hybrid strains', 'strain_types', 'count', 10, 'hybrid', 'common', 50),
('Hybrid Explorer II', 'See 25 different Hybrid strains', 'strain_types', 'count', 25, 'hybrid', 'rare', 100),
('Hybrid Master', 'See 50 different Hybrid strains', 'strain_types', 'count', 50, 'hybrid', 'epic', 200),

('Indica Explorer I', 'See 10 different Indica strains', 'strain_types', 'count', 10, 'indica', 'common', 50),
('Indica Explorer II', 'See 25 different Indica strains', 'strain_types', 'count', 25, 'indica', 'rare', 100),
('Indica Master', 'See 50 different Indica strains', 'strain_types', 'count', 50, 'indica', 'epic', 200),

('Sativa Explorer I', 'See 10 different Sativa strains', 'strain_types', 'count', 10, 'sativa', 'common', 50),
('Sativa Explorer II', 'See 25 different Sativa strains', 'strain_types', 'count', 25, 'sativa', 'rare', 100),
('Sativa Master', 'See 50 different Sativa strains', 'strain_types', 'count', 50, 'sativa', 'epic', 200),

-- Family Tree Achievements
('Genealogist I', 'Discover 5 complete strain family trees', 'families', 'count', 5, 'family', 'rare', 150),
('Genealogist II', 'Discover 15 complete strain family trees', 'families', 'count', 15, 'family', 'epic', 300),
('Family Tree Master', 'Discover 30 complete strain family trees', 'families', 'count', 30, 'family', 'legendary', 500),

('Landrace Hunter', 'Discover 10 landrace strains', 'families', 'count', 10, 'landrace', 'rare', 200),

-- Effect Coverage Achievements
('Effect Novice', 'Discover 25% of all available effects', 'effects', 'percentage', 25, 'effects', 'common', 75),
('Effect Explorer', 'Discover 50% of all available effects', 'effects', 'percentage', 50, 'effects', 'rare', 150),
('Effect Connoisseur', 'Discover 75% of all available effects', 'effects', 'percentage', 75, 'effects', 'epic', 300),
('Effect Master', 'Discover 90% of all available effects', 'effects', 'percentage', 90, 'effects', 'legendary', 500),

-- Flavor Coverage Achievements
('Flavor Novice', 'Experience 25% of all available flavors', 'flavors', 'percentage', 25, 'flavors', 'common', 75),
('Flavor Explorer', 'Experience 50% of all available flavors', 'flavors', 'percentage', 50, 'flavors', 'rare', 150),
('Flavor Connoisseur', 'Experience 75% of all available flavors', 'flavors', 'percentage', 75, 'flavors', 'epic', 300),
('Flavor Master', 'Experience 90% of all available flavors', 'flavors', 'percentage', 90, 'flavors', 'legendary', 500),

-- Terpene Coverage Achievements
('Terpene Novice', 'Encounter 25% of all available terpenes', 'terpenes', 'percentage', 25, 'terpenes', 'common', 100),
('Terpene Explorer', 'Encounter 50% of all available terpenes', 'terpenes', 'percentage', 50, 'terpenes', 'rare', 200),
('Terpene Expert', 'Encounter 75% of all available terpenes', 'terpenes', 'percentage', 75, 'terpenes', 'epic', 400),
('Terpene Master', 'Encounter 90% of all available terpenes', 'terpenes', 'percentage', 90, 'terpenes', 'legendary', 600),

-- Medical Coverage Achievements
('Medical Novice', 'Explore 25% of medical conditions', 'medical', 'percentage', 25, 'medical', 'common', 100),
('Medical Researcher', 'Explore 50% of medical conditions', 'medical', 'percentage', 50, 'medical', 'rare', 200),
('Medical Expert', 'Explore 75% of medical conditions', 'medical', 'percentage', 75, 'medical', 'epic', 400),
('Medical Master', 'Explore 90% of medical conditions', 'medical', 'percentage', 90, 'medical', 'legendary', 600),

-- Exploration Milestones
('First Steps', 'See your first strain', 'exploration', 'count', 1, 'start', 'common', 10),
('Getting Started', 'See 10 different strains', 'exploration', 'count', 10, 'explore', 'common', 25),
('Strain Seeker', 'See 50 different strains', 'exploration', 'count', 50, 'explore', 'rare', 100),
('Strain Explorer', 'See 100 different strains', 'exploration', 'count', 100, 'explore', 'epic', 200),
('Strain Connoisseur', 'See 250 different strains', 'exploration', 'count', 250, 'explore', 'epic', 400),
('Strain Master', 'See 500 different strains', 'exploration', 'count', 500, 'explore', 'legendary', 800),
('Database Complete', 'See every strain in the database', 'exploration', 'percentage', 100, 'complete', 'legendary', 1000),

-- Favorite Milestones
('Collector I', 'Add 5 strains to favorites', 'exploration', 'count', 5, 'heart', 'common', 25),
('Collector II', 'Add 25 strains to favorites', 'exploration', 'count', 25, 'heart', 'rare', 100),
('Collector III', 'Add 50 strains to favorites', 'exploration', 'count', 50, 'heart', 'epic', 200),
('Ultimate Collector', 'Add 100 strains to favorites', 'exploration', 'count', 100, 'heart', 'legendary', 500);

