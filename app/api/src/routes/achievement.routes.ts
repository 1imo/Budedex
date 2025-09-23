import { Router } from 'express';
import { AchievementController } from '../controllers/achievement.controller';
import { AuthMiddleware } from '../interfaces/rest/middleware/auth.middleware';
import { Pool } from 'pg';

export function createAchievementRoutes(achievementController: AchievementController, authMiddleware: AuthMiddleware, pool?: Pool): Router {
    const router = Router();

    // Simple test route
    router.get('/test', (req, res) => {
        res.json({ success: true, message: 'Achievements routes working' });
    });

    // Real achievements endpoint with database queries
    router.get('/', async (req: any, res: any) => {
        try {
            // Extract username from auth token (simplified for now)
            const authHeader = req.headers.authorization;
            let username = '1imo'; // Default for testing

            if (authHeader && authHeader.includes('8129b3268be24e585f6c3aaa0cca7c1b6d96b96a6d8859746cafa382839d0e2d')) {
                username = '1imo';
            }

            // Get database connection from server (we'll need to pass this)
            // For now, create a direct connection
            const { Pool } = require('pg');
            const dbPool = new Pool({
                host: '147.182.235.71',
                port: 5432,
                database: 'budedex',
                user: 'papstorea',
                password: 'vuxmev-zuxcyf-5Savga'
            });

            // Query ALL achievements with user progress using dynamic view
            const achievementsQuery = `
                SELECT 
                    a.id,
                    a.name,
                    a.description,
                    a.category,
                    a.type,
                    a.target_value,
                    a.icon,
                    a.rarity,
                    a.points,
                    COALESCE(ast.calculated_progress, 0) as calculated_progress,
                    COALESCE(ast.should_be_completed, false) as is_completed,
                    ast.unlocked_at
                FROM achievements a
                LEFT JOIN achievement_status ast ON a.id = ast.achievement_id AND ast.username = $1
                ORDER BY a.category, a.target_value
            `;
            const achievementsResult = await dbPool.query(achievementsQuery, [username]);
            const allAchievements = achievementsResult.rows;

            if (allAchievements.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        username: username,
                        total_achievements: 0,
                        completed_achievements: 0,
                        completion_percentage: 0,
                        total_points_available: 0,
                        total_points_earned: 0,
                        categories: []
                    }
                });
            }

            // Group achievements by category dynamically
            const categoriesMap = new Map();

            allAchievements.forEach(achievement => {
                if (!categoriesMap.has(achievement.category)) {
                    categoriesMap.set(achievement.category, []);
                }

                // Convert string values to proper types
                achievement.calculated_progress = parseFloat(achievement.calculated_progress) || 0;

                categoriesMap.get(achievement.category).push(achievement);
            });

            // Build categories with real data
            const categoryTitles = {
                'strain_types': 'Strain Types',
                'families': 'Genetics & Families',
                'effects': 'Effects Explorer',
                'flavors': 'Flavor Profiles',
                'terpenes': 'Terpene Discovery',
                'medical': 'Medical Research',
                'exploration': 'Exploration Milestones'
            };

            const categoryDescriptions = {
                'strain_types': 'Master different cannabis strain types',
                'families': 'Explore strain genetics and family trees',
                'effects': 'Discover the full spectrum of cannabis effects',
                'flavors': 'Experience diverse flavor profiles',
                'terpenes': 'Uncover the world of terpenes',
                'medical': 'Research medical applications and benefits',
                'exploration': 'General exploration and collection milestones'
            };

            const categories = [];
            for (const [categoryKey, achievements] of categoriesMap) {
                const completedCount = achievements.filter(a => a.is_completed).length;
                const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);
                const earnedPoints = achievements.filter(a => a.is_completed).reduce((sum, a) => sum + a.points, 0);

                categories.push({
                    category: categoryKey,
                    title: categoryTitles[categoryKey] || categoryKey,
                    description: categoryDescriptions[categoryKey] || '',
                    achievements: achievements,
                    total_achievements: achievements.length,
                    completed_achievements: completedCount,
                    total_points: totalPoints,
                    earned_points: earnedPoints
                });
            }


            const totalCompleted = categories.reduce((sum, cat) => sum + cat.completed_achievements, 0);
            const totalPoints = categories.reduce((sum, cat) => sum + cat.earned_points, 0);

            await dbPool.end();

            res.json({
                success: true,
                data: {
                    username: username,
                    total_achievements: 40,
                    completed_achievements: totalCompleted,
                    completion_percentage: Math.round((totalCompleted / 40) * 100),
                    total_points_available: 5000,
                    total_points_earned: totalPoints,
                    categories: categories
                }
            });

        } catch (error) {
            console.error('Achievements route error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch achievements: ' + error.message
            });
        }
    });

    // Recent achievements endpoint
    router.get('/recent', (req, res) => {
        res.json({
            success: true,
            data: []
        });
    });

    return router;
}
