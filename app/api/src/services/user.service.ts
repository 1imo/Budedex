import { UserRepository } from '../repository/user.repository';
import {
    User,
    RegisterUserRequest,
    LoginUserRequest,
    UserSession,
    UserStats,
    UserTotals,
    FavouriteAction,
    MarkSeen,
    PasswordResetRequest,
    PasswordReset
} from '../DTOs/user.dto';

export class UserService {
    private userRepository: UserRepository;

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    // Authentication methods
    async register(userData: RegisterUserRequest): Promise<{ user: User, session: UserSession }> {
        // Check if username already exists
        const existingUser = await this.userRepository.findByUsername(userData.username);
        if (existingUser) {
            throw new Error('Username already exists');
        }

        // Validate username format
        if (!this.validateUsername(userData.username)) {
            throw new Error('Username must be 3-50 characters and contain only letters, numbers, hyphens, and underscores');
        }

        // Validate password strength
        if (!this.validatePassword(userData.password)) {
            throw new Error('Password must be at least 8 characters long');
        }

        // Create user
        const user = await this.userRepository.create(userData);

        // Create initial session
        const session = await this.userRepository.createSession(user.username);

        return { user, session };
    }

    async login(loginData: LoginUserRequest, ipAddress?: string, userAgent?: string): Promise<{ user: User, session: UserSession }> {
        const { username, password } = loginData;

        // Check if account is locked
        const isLocked = await this.userRepository.isAccountLocked(username);
        if (isLocked) {
            throw new Error('Account is temporarily locked due to too many failed login attempts');
        }

        // Find user
        const user = await this.userRepository.findByUsername(username);
        if (!user) {
            await this.userRepository.incrementLoginAttempts(username);
            throw new Error('Invalid username or password');
        }

        // Validate password
        const isValidPassword = await this.userRepository.validatePassword(username, password);
        if (!isValidPassword) {
            await this.userRepository.incrementLoginAttempts(username);
            throw new Error('Invalid username or password');
        }

        // Reset login attempts and update last login
        await this.userRepository.resetLoginAttempts(username);
        await this.userRepository.updateLastLogin(username);

        // Create session
        const session = await this.userRepository.createSession(username, ipAddress, userAgent);

        return { user, session };
    }

    async logout(sessionToken: string): Promise<void> {
        await this.userRepository.deactivateSession(sessionToken);
    }

    async logoutAllSessions(username: string): Promise<void> {
        await this.userRepository.deactivateAllUserSessions(username);
    }

    async validateSession(sessionToken: string): Promise<{ user: User, session: UserSession } | null> {
        const session = await this.userRepository.findSessionByToken(sessionToken);
        if (!session) {
            return null;
        }

        const user = await this.userRepository.findByUsername(session.username);
        if (!user) {
            return null;
        }

        return { user, session };
    }

    // Password reset methods
    async requestPasswordReset(request: PasswordResetRequest): Promise<string> {
        const user = await this.userRepository.findByUsername(request.username);
        if (!user) {
            // Don't reveal if username exists
            throw new Error('If the username exists, a password reset email will be sent');
        }

        const resetToken = await this.userRepository.createPasswordResetToken(request.username);

        // TODO: Send email with reset token
        // In production, you would send an email here
        console.log(`Password reset token for ${request.username}: ${resetToken}`);

        return resetToken;
    }

    async resetPassword(resetData: PasswordReset): Promise<void> {
        const username = await this.userRepository.validatePasswordResetToken(resetData.token);
        if (!username) {
            throw new Error('Invalid or expired reset token');
        }

        if (!this.validatePassword(resetData.password)) {
            throw new Error('Password must be at least 8 characters long');
        }

        await this.userRepository.resetPassword(username, resetData.password);
    }

    // User profile methods
    async getUserProfile(username: string): Promise<{ user: User, stats: UserStats | null, totals: UserTotals | null }> {
        const user = await this.userRepository.findByUsername(username);
        if (!user) {
            throw new Error('User not found');
        }

        const stats = await this.userRepository.getUserStats(username);
        const totals = await this.userRepository.getUserTotals(username);

        return { user, stats, totals };
    }

    async deleteUser(username: string): Promise<boolean> {
        const user = await this.userRepository.findByUsername(username);
        if (!user) {
            throw new Error('User not found');
        }

        return await this.userRepository.delete(username);
    }

    // User analytics methods
    async getUserAnalytics(username: string, category: string, limit: number = 10): Promise<any[]> {
        const user = await this.userRepository.findByUsername(username);
        if (!user) {
            throw new Error('User not found');
        }

        switch (category) {
            case 'effects':
                return await this.userRepository.getUserEffects(username, limit);
            case 'flavors':
                return await this.userRepository.getUserFlavors(username, limit);
            case 'terpenes':
                return await this.userRepository.getUserTerpenes(username, limit);
            case 'medical_benefits':
                return await this.userRepository.getUserMedicalBenefits(username, limit);
            default:
                throw new Error('Invalid analytics category');
        }
    }

    // Favourites methods (with legacy method names for compatibility)
    async addToFavourites(username: string, favouriteData: FavouriteAction): Promise<any> {
        return this.addFavourite(username, favouriteData);
    }

    async addFavourite(username: string, favouriteData: FavouriteAction): Promise<any> {
        const user = await this.userRepository.findByUsername(username);
        if (!user) {
            throw new Error('User not found');
        }

        return await this.userRepository.addFavourite(username, favouriteData.strain_name);
    }

    async removeFavourite(username: string, favouriteData: FavouriteAction): Promise<boolean> {
        const user = await this.userRepository.findByUsername(username);
        if (!user) {
            throw new Error('User not found');
        }

        return await this.userRepository.removeFavourite(username, favouriteData.strain_name);
    }

    async getUserFavourites(username: string, page: number = 1, limit: number = 20): Promise<{ favourites: any[], total: number, pagination: any }> {
        return this.getFavourites(username, page, limit);
    }

    async getFavourites(username: string, page: number = 1, limit: number = 20): Promise<{ favourites: any[], total: number, pagination: any }> {
        const user = await this.userRepository.findByUsername(username);
        if (!user) {
            throw new Error('User not found');
        }

        const { favourites, total } = await this.userRepository.getFavourites(username, page, limit);

        const pagination = {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
        };

        return { favourites, total, pagination };
    }

    async isFavourite(username: string, strainName: string): Promise<boolean> {
        return await this.userRepository.isFavourite(username, strainName);
    }

    // Seen strains methods
    async markAsSeen(username: string, seenData: MarkSeen): Promise<any> {
        const user = await this.userRepository.findByUsername(username);
        if (!user) {
            throw new Error('User not found');
        }

        return await this.userRepository.markAsSeen(username, seenData.strain_name);
    }

    async removeFromSeen(username: string, seenData: MarkSeen): Promise<boolean> {
        const user = await this.userRepository.findByUsername(username);
        if (!user) {
            throw new Error('User not found');
        }

        return await this.userRepository.removeFromSeen(username, seenData.strain_name);
    }

    async getSeenStrains(username: string, page: number = 1, limit: number = 20): Promise<{ seen: any[], total: number, pagination: any }> {
        const user = await this.userRepository.findByUsername(username);
        if (!user) {
            throw new Error('User not found');
        }

        const { seen, total } = await this.userRepository.getSeenStrains(username, page, limit);

        const pagination = {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
        };

        return { seen, total, pagination };
    }

    async hasSeenStrain(username: string, strainName: string): Promise<boolean> {
        return await this.userRepository.hasSeenStrain(username, strainName);
    }

    // Legacy methods for controller compatibility
    async addToWishlist(username: string, wishlistData: any): Promise<any> {
        // For now, treat wishlist same as favourites
        return this.addFavourite(username, { strain_name: wishlistData.strain_name });
    }

    async getUserWishlist(username: string, page: number = 1, limit: number = 20): Promise<any> {
        // For now, return empty wishlist
        return { wishlist: [], total: 0, pagination: { page, limit, total: 0, pages: 0, hasNext: false, hasPrev: false } };
    }

    async markAsComplete(username: string, completeData: any): Promise<any> {
        // Mark as seen for now
        return this.markAsSeen(username, { strain_name: completeData.strain_name });
    }

    async removeFromCompleted(username: string, completeData: any): Promise<any> {
        // Remove from seen for now
        return this.removeFromSeen(username, { strain_name: completeData.strain_name });
    }

    async getUserCompleted(username: string, page: number = 1, limit: number = 20): Promise<any> {
        // For now, return seen strains as completed
        return this.getSeenStrains(username, page, limit);
    }

    // Strain status checking methods
    async getStrainStatus(username: string, strainNames: string[]): Promise<{ strain_name: string, is_liked: boolean, is_seen: boolean }[]> {
        return await this.userRepository.getStrainStatus(username, strainNames);
    }

    async getSingleStrainStatus(username: string, strainName: string): Promise<{ strain_name: string, is_liked: boolean, is_seen: boolean } | null> {
        return await this.userRepository.getSingleStrainStatus(username, strainName);
    }

    // Validation methods
    private validateUsername(username: string): boolean {
        const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
        return usernameRegex.test(username);
    }

    private validatePassword(password: string): boolean {
        return password.length >= 8 && password.length <= 128;
    }

    // Utility methods
    sanitizeUser(user: User): Omit<User, 'password'> {
        const { ...sanitizedUser } = user;
        return sanitizedUser;
    }

    generateSessionToken(): string {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
}