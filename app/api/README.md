# Pokedex API

Hybrid REST + GraphQL backend for the cannabis strain database application.

## Architecture

This API follows a clean architecture pattern with clear separation of concerns:

```
api/
├── interfaces/          # API layer (REST & GraphQL)
│   ├── rest/           # REST endpoints, middleware, validations
│   └── gql/            # GraphQL schema, resolvers, validations
├── controllers/        # Request handlers
├── services/          # Business logic
├── repository/        # Data access layer
├── DTOs/             # Data transfer objects
└── models/           # Domain models
```

## Features

### REST API (`/api/rest`)
- **Authentication**: Sign up, sign in with JWT tokens
- **User Actions**: Add to favorites, wishlist, mark as complete
- **Rate Limiting**: 100 requests per 15 minutes (5 for auth endpoints)
- **Validation**: Request validation with express-validator
- **Security**: Helmet, CORS, input sanitization

### GraphQL API (`/api/gql`)
- **Strains**: Paginated queries with search and filtering
- **Leaderboard**: User rankings with current user position
- **Flexible Queries**: Request only the fields you need
- **Context-aware**: Optional authentication for personalized results

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp env.example .env
```

3. Update `.env` with your configuration:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"
PORT=4000
NODE_ENV="development"
```

### Development

Start the development server:
```bash
npm run dev
```

The API will be available at:
- REST API: `http://localhost:4000/api/rest`
- GraphQL: `http://localhost:4000/api/gql`
- Health check: `http://localhost:4000/health`

### Building for Production

```bash
npm run build
npm start
```

## API Endpoints

### REST Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/rest/account/sign-up` | POST | Create account | No |
| `/api/rest/account/sign-in` | POST | Sign in | No |
| `/api/rest/account/favourites` | POST | Add to favorites | Yes |
| `/api/rest/account/wishlist` | POST | Add to wishlist | Yes |
| `/api/rest/account/complete` | POST | Mark as complete | Yes |
| `/api/rest/account/profile` | GET | Get user profile | Yes |

### GraphQL Queries

```graphql
# Get paginated strains
query {
  strains(page: 1, limit: 20) {
    strains {
      id
      name
      description
      category
      positive_effects
      image_url
    }
    pageInfo {
      hasNextPage
      currentPage
      totalPages
    }
  }
}

# Search strains
query {
  searchStrains(query: "relaxing", page: 1, limit: 10) {
    strains { id name description }
  }
}

# Get leaderboard
query {
  leaderboard(page: 1, limit: 20) {
    entries {
      rank
      username
      score
    }
    currentUser {
      rank
      username
      score
    }
  }
}
```

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

For GraphQL queries, authentication is optional but provides personalized results (like current user position in leaderboard).

## Data Models

### User
- `id`: Unique identifier
- `username`: Display name
- `email`: User email
- `password`: Hashed password
- `createdAt`: Account creation date

### Strain
- `id`: Unique identifier
- `name`: Strain name
- `description`: Detailed description
- `category`: Strain type (Sativa, Indica, Hybrid)
- `thc_content`: THC percentage
- `rating`: User rating (1-5)
- `positive_effects`: Array of positive effects
- `negative_effects`: Array of side effects
- `flavors`: Array of flavor profiles
- `helps_with`: Medical conditions with percentages
- `genetics`: Parent and child strains
- `image_path`: Local image path
- `image_url`: External image URL

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

GraphQL errors follow the standard GraphQL error format with additional error codes.

## Rate Limiting

- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- GraphQL: 200 requests per 15 minutes

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin request handling
- **Rate Limiting**: DDoS protection
- **Input Validation**: Request sanitization
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds

## Development

### Adding New Endpoints

1. Create DTO in `DTOs/`
2. Add validation in `interfaces/rest/validations/` or `interfaces/gql/validations/`
3. Implement service logic in `services/`
4. Add repository methods in `repository/`
5. Create controller in `controllers/`
6. Add routes in `interfaces/rest/routes/` or resolvers in `interfaces/gql/routes/`

### Testing

```bash
npm test
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a production database (PostgreSQL recommended)
3. Set strong JWT secret
4. Configure proper CORS origins
5. Set up SSL/HTTPS
6. Use process manager (PM2)
7. Set up monitoring and logging

