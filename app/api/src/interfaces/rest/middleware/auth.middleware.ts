import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../../services/auth.service';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        username: string;
        email: string;
    };
}

export class AuthMiddleware {
    constructor(private authService: AuthService) { }

    authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({
                    success: false,
                    message: 'Access token required'
                });
                return;
            }

            const token = authHeader.substring(7); // Remove 'Bearer ' prefix
            const user = await this.authService.verifyToken(token);

            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid or expired token'
                });
                return;
            }

            req.user = {
                id: user.user.username, // Use username as id
                username: user.user.username,
                email: user.user.email || ''
            };

            next();
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Authentication failed'
            });
        }
    };

    optional = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                next();
                return;
            }

            const token = authHeader.substring(7);
            const user = await this.authService.verifyToken(token);

            if (user) {
                req.user = {
                    id: user.user.username, // Use username as id
                    username: user.user.username,
                    email: user.user.email || ''
                };
            }

            next();
        } catch (error) {
            // For optional auth, we continue even if token is invalid
            next();
        }
    };
}

