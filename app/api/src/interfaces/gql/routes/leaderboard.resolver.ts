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
            const result = await ctx.services.leaderboard.getLeaderboard({ page, limit, category: 'overall' });

            // Transform to match both old and new schema
            return {
                entries: result.data,
                data: result.data,
                pageInfo: result.pagination,
                pagination: result.pagination,
                currentUser: null // TODO: implement if needed
            };
        },

        categoryLeaders: async (_: any, __: any, ctx: Context) => {
            const result = await ctx.services.leaderboard.getCategoryLeaders();
            return result;
        },

        userRank: async (_: any, { username }: { username: string }, ctx: Context) => {
            const result = await ctx.services.leaderboard.getUserRank(username);
            return result;
        },
    },
};

