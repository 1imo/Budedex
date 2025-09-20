import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { UserService } from '../services/user.service';
import { LeaderboardService } from '../services/leaderboard.service';
import { FavouriteDto, WishlistDto, CompleteDto } from '../DTOs/sign-up.dto';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        username: string;
        email: string;
    };
}

export class UserController {
    constructor(
        private userService: UserService,
        private leaderboardService: LeaderboardService
    ) { }

    async addToFavourites(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
                return;
            }

            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }

            const favouriteDto: FavouriteDto = req.body;
            await this.userService.addToFavourites(req.user.id, favouriteDto);

            // Update user score after adding to favourites
            await this.leaderboardService.updateUserScore(req.user.id);

            res.status(200).json({
                success: true,
                message: 'Added to favourites successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to add to favourites'
            });
        }
    }

    async addToWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
                return;
            }

            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }

            const wishlistDto: WishlistDto = req.body;
            await this.userService.addToWishlist(req.user.id, wishlistDto);

            // Update user score after adding to wishlist
            await this.leaderboardService.updateUserScore(req.user.id);

            res.status(200).json({
                success: true,
                message: 'Added to wishlist successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to add to wishlist'
            });
        }
    }

    async markAsComplete(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
                return;
            }

            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }

            const completeDto: CompleteDto = req.body;
            await this.userService.markAsComplete(req.user.id, completeDto);

            // Update user score after marking as complete
            await this.leaderboardService.updateUserScore(req.user.id);

            res.status(200).json({
                success: true,
                message: 'Marked as complete successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to mark as complete'
            });
        }
    }

    async getUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }

            const [favourites, wishlist, completed] = await Promise.all([
                this.userService.getUserFavourites(req.user.id),
                this.userService.getUserWishlist(req.user.id),
                this.userService.getUserCompleted(req.user.id)
            ]);

            const score = await this.leaderboardService.getUserScore(req.user.id);
            const rank = await this.leaderboardService.getUserRank(req.user.id);

            res.status(200).json({
                success: true,
                data: {
                    user: req.user,
                    stats: {
                        favourites: favourites.total,
                        wishlist: wishlist.total,
                        completed: completed.total,
                        score,
                        rank
                    },
                    favourites,
                    wishlist,
                    completed
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user profile'
            });
        }
    }

    // Alias for route compatibility
    async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
        return this.getUserProfile(req, res);
    }

    async removeFromFavourites(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const favouriteDto = req.body as FavouriteDto;
            await this.userService.removeFavourite(req.user!.id, favouriteDto);

            res.status(200).json({
                success: true,
                message: 'Removed from favourites successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to remove from favourites'
            });
        }
    }

    async getFavourites(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const favourites = await this.userService.getUserFavourites(req.user!.id, page, limit);

            res.status(200).json({
                success: true,
                data: favourites
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get favourites'
            });
        }
    }
}

