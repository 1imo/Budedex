export const typeDefs = `#graphql
type Strain {
  name: String!
  url: String
  type: String!
  thc: String
  cbd: String
  rating: Float
  review_count: Int!
  top_effect: String
  category: String
  image_path: String
  image_url: String
  description: String
  aliases: String
  positive_effects: String
  negative_effects: String
  flavors: String
  terpenes: String
  medical_benefits: String
  parents: String
  children: String
  created_at: String
  updated_at: String
}

  type HelpsWithCondition {
    condition: String!
    percentage: Int!
  }

  type TerpeneInfo {
    name: String!
    type: String
    description: String
  }

  type Genetics {
    parents: [String!]
    children: [String!]
  }

  type LeaderboardEntry {
    rank: Int!
    userId: ID!
    username: String!
    score: Int!
  }

  type LeaderboardResult {
    entries: [LeaderboardEntry!]!
    currentUser: LeaderboardEntry
    pageInfo: PageInfo!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    currentPage: Int!
    totalPages: Int!
    total: Int!
  }

  type PaginatedStrains {
    strains: [Strain!]!
    pageInfo: PageInfo!
  }

  type Query {
    strains(page: Int! = 1, limit: Int! = 20): PaginatedStrains!
    strain(name: String!): Strain
    searchStrains(query: String!, page: Int! = 1, limit: Int! = 20): PaginatedStrains!
    strainsByCategory(category: String!, page: Int! = 1, limit: Int! = 20): PaginatedStrains!
    strainsByEffect(effect: String!, page: Int! = 1, limit: Int! = 20): PaginatedStrains!
    leaderboard(page: Int! = 1, limit: Int! = 20): LeaderboardResult!
  }
`;
