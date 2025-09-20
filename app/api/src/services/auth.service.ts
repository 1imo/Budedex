import { UserRepository } from '../repository/user.repository';
import { User, LoginUserRequest, RegisterUserRequest, UserSession } from '../DTOs/user.dto';

export class AuthService {
    private userRepository: UserRepository;

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    async signIn(loginData: LoginUserRequest, ipAddress?: string, userAgent?: string): Promise<{ user: User, session: UserSession }> {
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

    async signUp(userData: RegisterUserRequest): Promise<{ user: User, session: UserSession }> {
        // Check if username already exists
        const existingUser = await this.userRepository.findByUsername(userData.username);
        if (existingUser) {
            throw new Error('Username already exists');
        }

        // Create user
        const user = await this.userRepository.create(userData);

        // Create initial session
        const session = await this.userRepository.createSession(user.username);

        return { user, session };
    }

    async logout(sessionToken: string): Promise<void> {
        await this.userRepository.deactivateSession(sessionToken);
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

    async verifyToken(sessionToken: string): Promise<{ user: User, session: UserSession } | null> {
        return this.validateSession(sessionToken);
    }
}

// Authentication service for user login/logout
