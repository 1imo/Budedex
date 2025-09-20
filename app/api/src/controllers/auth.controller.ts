import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { SignUpDto, SignInDto } from '../DTOs/sign-up.dto';

export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UserService
    ) { }

    async signUp(req: Request, res: Response): Promise<void> {
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

            const signUpDto: SignUpDto = req.body;
            const result = await this.authService.signUp(signUpDto);

            res.status(201).json({
                success: true,
                message: 'Account created successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Sign up failed'
            });
        }
    }

    async signIn(req: Request, res: Response): Promise<void> {
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

            const signInDto: SignInDto = req.body;
            const result = await this.authService.signIn(signInDto);

            res.status(200).json({
                success: true,
                message: 'Sign in successful',
                data: result
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: error instanceof Error ? error.message : 'Sign in failed'
            });
        }
    }

    async logout(req: Request, res: Response) {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                await this.authService.logout(token);
            }

            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Logout failed'
            });
        }
    }
}

