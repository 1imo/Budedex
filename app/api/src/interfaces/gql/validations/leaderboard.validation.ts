import { GraphQLError } from "graphql";

export const validateLeaderboardArgs = (page: number, limit: number) => {
    if (page < 1) {
        throw new GraphQLError("Page must be greater than 0", {
            extensions: { code: "BAD_USER_INPUT" }
        });
    }

    if (limit < 1 || limit > 100) {
        throw new GraphQLError("Limit must be between 1 and 100", {
            extensions: { code: "BAD_USER_INPUT" }
        });
    }
};

export const validateStrainsArgs = (page: number, limit: number) => {
    if (page < 1) {
        throw new GraphQLError("Page must be greater than 0", {
            extensions: { code: "BAD_USER_INPUT" }
        });
    }

    if (limit < 1 || limit > 100) {
        throw new GraphQLError("Limit must be between 1 and 100", {
            extensions: { code: "BAD_USER_INPUT" }
        });
    }
};

