import { LeaderboardService } from '../../../services/leaderboard.service';
import { validateLeaderboardArgs } from '../validations/leaderboard.validation';

interface Context {
    services: {
        leaderboard: LeaderboardService;
    };
    user?: {
        id: string;
        username: string;
        email: string;
    };
}

export const leaderboardResolvers = {
    Query: {
        leaderboard: async (_: any, { page, limit }: { page: number; limit: number }, ctx: Context) => {
            validateLeaderboardArgs(page, limit);

            const currentUserId = ctx.user?.id;
            return await ctx.services.leaderboard.getLeaderboard({ page, limit, category: 'overall' });
        },
    },
};

