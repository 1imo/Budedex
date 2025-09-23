import { Request, Response } from 'express';
import { AchievementService } from '../services/achievement.service';

interface AuthenticatedRequest extends Request {
    user: {
        username: string;
        email: string;
    };
}

export class AchievementController {
    private achievementService: AchievementService;

    constructor(achievementService: AchievementService) {
        this.achievementService = achievementService;
    }

    // GET /api/rest/achievements - Get user's achievements
    async getUserAchievements(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { username } = req.user;
            const achievements = await this.achievementService.getUserAchievements(username);

            res.json({
                success: true,
                data: achievements
            });
        } catch (error) {
            console.error('Error fetching user achievements:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch achievements'
            });
        }
    }

    // GET /api/rest/achievements/stats - Get user's achievement stats
    async getUserAchievementStats(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { username } = req.user;
            const stats = await this.achievementService.getUserStats(username);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error fetching user achievement stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch achievement stats'
            });
        }
    }

    // POST /api/rest/achievements/check - Check and unlock new achievements
    async checkAchievements(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { username } = req.user;
            const newAchievements = await this.achievementService.checkUserAchievements(username);

            res.json({
                success: true,
                data: {
                    newly_unlocked: newAchievements,
                    count: newAchievements.length
                },
                message: newAchievements.length > 0
                    ? `Unlocked ${newAchievements.length} new achievement(s)!`
                    : 'No new achievements unlocked'
            });
        } catch (error) {
            console.error('Error checking achievements:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check achievements'
            });
        }
    }

    // GET /api/rest/achievements/recent - Get recent achievements across all users
    async getRecentAchievements(req: Request, res: Response): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 10;
            const recentAchievements = await this.achievementService.getRecentAchievements(limit);

            res.json({
                success: true,
                data: recentAchievements
            });
        } catch (error) {
            console.error('Error fetching recent achievements:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch recent achievements'
            });
        }
    }

    // GET /api/rest/achievements/all - Get all available achievements
    async getAllAchievements(req: Request, res: Response): Promise<void> {
        try {
            const achievements = await this.achievementService.getAllAchievements();

            res.json({
                success: true,
                data: achievements
            });
        } catch (error) {
            console.error('Error fetching all achievements:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch achievements'
            });
        }
    }

    // GET /api/rest/achievements/category/:category - Get achievements by category
    async getAchievementsByCategory(req: Request, res: Response): Promise<void> {
        try {
            const { category } = req.params;
            const achievements = await this.achievementService.getAchievementsByCategory(category);

            res.json({
                success: true,
                data: achievements
            });
        } catch (error) {
            console.error('Error fetching achievements by category:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch achievements'
            });
        }
    }
}

