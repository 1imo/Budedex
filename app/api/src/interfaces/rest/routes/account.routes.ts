import { Router } from 'express';
import { AuthController } from '../../../controllers/auth.controller';
import { UserController } from '../../../controllers/user.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { authRateLimit } from '../middleware/rate-limit.middleware';
import {
    signUpValidation,
    signInValidation,
    favouriteValidation,
    wishlistValidation,
    completeValidation
} from '../validations/account.validation';

export function createAccountRoutes(
    authController: AuthController,
    userController: UserController,
    authMiddleware: AuthMiddleware
): Router {
    const router = Router();

    // Authentication routes (with stricter rate limiting)
    router.post('/sign-up', authRateLimit, signUpValidation, authController.signUp.bind(authController));
    router.post('/sign-in', authRateLimit, signInValidation, authController.signIn.bind(authController));

    // Protected user routes
    router.post('/favourites', authMiddleware.authenticate, favouriteValidation, userController.addToFavourites.bind(userController));
    router.post('/wishlist', authMiddleware.authenticate, wishlistValidation, userController.addToWishlist.bind(userController));
    router.post('/complete', authMiddleware.authenticate, completeValidation, userController.markAsComplete.bind(userController));

    // Get user profile
    router.get('/profile', authMiddleware.authenticate, userController.getUserProfile.bind(userController));

    return router;
}

