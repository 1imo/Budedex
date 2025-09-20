import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { ApolloServer, BaseContext } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Import services, repositories, and controllers
import { UserRepository } from './repository/user.repository';
import { StrainRepository } from './repository/strain.repository';
import { LeaderboardRepository } from './repository/leaderboard.repository';
import { StrainService } from './services/strain.service';
import { UserService } from './services/user.service';
import { LeaderboardService } from './services/leaderboard.service';
import { AuthService } from './services/auth.service';

// Import controllers
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';

// Import middleware and routes
import { AuthMiddleware } from './interfaces/rest/middleware/auth.middleware';
import { apiRateLimit, graphqlRateLimit } from './interfaces/rest/middleware/rate-limit.middleware';
import { createAccountRoutes } from './routes/account.routes';

// Import GraphQL schema and resolvers
import { typeDefs } from './interfaces/gql/routes/schema';
import { strainResolvers } from './interfaces/gql/routes/strain.resolver';
import { leaderboardResolvers } from './interfaces/gql/routes/leaderboard.resolver';

// Load environment variables
dotenv.config();

class Server {
    private app: express.Application;
    private httpServer: any;
    private apolloServer: ApolloServer<BaseContext> | null = null;

    // Repositories
    private userRepository!: UserRepository;
    private strainRepository!: StrainRepository;
    private leaderboardRepository!: LeaderboardRepository;

    // Services
    private authService!: AuthService;
    private userService!: UserService;
    private strainService!: StrainService;
    private leaderboardService!: LeaderboardService;

    // Controllers
    private authController!: AuthController;
    private userController!: UserController;

    // Middleware
    private authMiddleware!: AuthMiddleware;

    constructor() {
        this.app = express();
        this.httpServer = createServer(this.app);

        // Initialize dependencies
        this.initializeDependencies();
        this.setupMiddleware();
        this.setupRoutes();
    }

    private initializeDependencies() {
        // Initialize database pool
        const pool = new Pool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });

        // Initialize repositories
        this.userRepository = new UserRepository(pool);
        this.strainRepository = new StrainRepository(pool);
        this.leaderboardRepository = new LeaderboardRepository(pool);

        // Initialize services
        this.authService = new AuthService(this.userRepository);
        this.userService = new UserService(this.userRepository);
        this.strainService = new StrainService(this.strainRepository);
        this.leaderboardService = new LeaderboardService(this.leaderboardRepository);

        // Initialize controllers
        this.authController = new AuthController(this.authService, this.userService);
        this.userController = new UserController(this.userService, this.leaderboardService);

        // Initialize middleware
        this.authMiddleware = new AuthMiddleware(this.authService);
    }

    private setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: false, // Disable CSP for GraphQL playground
            crossOriginEmbedderPolicy: false
        }));

        // CORS configuration
        this.app.use(cors({
            origin: [
                process.env.FRONTEND_URL || 'http://localhost:3000',
                'http://localhost:3001', // Alternative port
                'http://localhost:3002', // Another alternative
                'http://localhost:4321'  // Astro default
            ],
            credentials: true
        }));

        // Body parsing middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Rate limiting for REST API
        this.app.use('/api/rest', apiRateLimit);
    }

    private setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({ status: 'OK', timestamp: new Date().toISOString() });
        });

        // Serve static images from data-scraper directory
        const imagesPath = path.join(process.cwd(), '../../data-scraper/images');
        this.app.use('/api/images', express.static(imagesPath));
        console.log('Serving images from:', imagesPath);

        // REST API routes
        this.app.use('/api/rest/account', createAccountRoutes(
            this.authController,
            this.userController,
            this.authMiddleware
        ));

        // 404 handler for REST routes
        this.app.use('/api/rest/*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'REST endpoint not found'
            });
        });
    }

    private async setupGraphQL() {
        // Merge resolvers
        const resolvers = {
            Query: {
                ...strainResolvers.Query,
                ...leaderboardResolvers.Query,
            },
        };

        // Create Apollo Server
        this.apolloServer = new ApolloServer<BaseContext>({
            typeDefs,
            resolvers,
            plugins: [ApolloServerPluginDrainHttpServer({ httpServer: this.httpServer })],
            formatError: (err) => {
                console.error('GraphQL Error:', err);
                return {
                    message: err.message,
                    code: err.extensions?.code || 'INTERNAL_ERROR',
                    path: err.path,
                };
            },
        });

        await this.apolloServer!.start();

        // Apply GraphQL middleware
        this.app.use(
            '/api/gql',
            graphqlRateLimit,
            expressMiddleware(this.apolloServer!, {
                context: async ({ req }) => {
                    // Extract user from auth header for GraphQL context
                    let user = undefined;

                    try {
                        const authHeader = req.headers.authorization;
                        if (authHeader && authHeader.startsWith('Bearer ')) {
                            const token = authHeader.substring(7);
                            const authenticatedUser = await this.authService.verifyToken(token);
                            if (authenticatedUser) {
                                user = {
                                    id: authenticatedUser.user.username, // Use username as id
                                    username: authenticatedUser.user.username,
                                    email: authenticatedUser.user.email,
                                };
                            }
                        }
                    } catch (error) {
                        // User remains undefined if token is invalid
                    }

                    return {
                        services: {
                            strain: this.strainService,
                            leaderboard: this.leaderboardService,
                        },
                        user,
                    };
                },
            })
        );
    }

    public async start() {
        try {
            // Setup GraphQL
            await this.setupGraphQL();

            // Start server
            const port = process.env.PORT || 4002;

            this.httpServer.listen(port, () => {
                console.log(`🚀 Server ready at http://localhost:${port}`);
                console.log(`📊 REST API: http://localhost:${port}/api/rest`);
                console.log(`🎯 GraphQL: http://localhost:${port}/api/gql`);
                console.log(`❤️  Health check: http://localhost:${port}/health`);
            });

            // Graceful shutdown
            process.on('SIGTERM', () => this.shutdown());
            process.on('SIGINT', () => this.shutdown());

        } catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    }

    private async shutdown() {
        console.log('Shutting down server...');

        if (this.apolloServer) {
            await this.apolloServer.stop();
        }

        this.httpServer.close(() => {
            console.log('Server shut down gracefully');
            process.exit(0);
        });
    }
}

// Start the server
const server = new Server();
server.start().catch(error => {
    console.error('Server startup error:', error);
    process.exit(1);
});
