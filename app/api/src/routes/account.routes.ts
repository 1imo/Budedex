import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { UserController } from '../controllers/user.controller';
import { AuthMiddleware } from '../interfaces/rest/middleware/auth.middleware';

export function createAccountRoutes(
    authController: AuthController,
    userController: UserController,
    authMiddleware: AuthMiddleware
): Router {
    const router = Router();

    // Authentication routes
    router.post('/sign-up', authController.signUp.bind(authController));
    router.post('/sign-in', authController.signIn.bind(authController));
    router.post('/logout', authMiddleware.authenticate.bind(authMiddleware), authController.logout.bind(authController));

    // User routes (protected)
    router.get('/profile', authMiddleware.authenticate.bind(authMiddleware), userController.getProfile.bind(userController));
    router.post('/favourites', authMiddleware.authenticate.bind(authMiddleware), userController.addToFavourites.bind(userController));
    router.delete('/favourites', authMiddleware.authenticate.bind(authMiddleware), userController.removeFromFavourites.bind(userController));
    router.get('/favourites', authMiddleware.authenticate.bind(authMiddleware), userController.getFavourites.bind(userController));
    router.post('/complete', authMiddleware.authenticate.bind(authMiddleware), userController.markAsComplete.bind(userController));
    router.delete('/complete', authMiddleware.authenticate.bind(authMiddleware), userController.removeFromCompleted.bind(userController));
    router.post('/status', authMiddleware.authenticate.bind(authMiddleware), userController.getStrainStatus.bind(userController));

    return router;
}
