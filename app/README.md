# Pokedex - Cannabis Strain Database

A full-stack application for exploring, tracking, and learning about cannabis strains. Built with modern web technologies and following clean architecture principles.

## 🏗️ Architecture Overview

```
app/
├── api/        # Backend (Express + GraphQL + TypeScript)
└── front/      # Frontend (Astro + React + TypeScript)
```

## 🚀 Features

### 🔐 Authentication & User Management
- JWT-based authentication
- User registration and login
- Protected routes and actions
- User profiles with statistics

### 🌿 Strain Database
- **2,300+ cannabis strains** with detailed information
- Advanced search and filtering
- Categories: Sativa, Indica, Hybrid
- Effects, flavors, and medical benefits
- High-quality strain images
- Genetic lineage (parent/child strains)

### 📊 User Tracking
- **Favorites**: Mark strains you love
- **Wishlist**: Strains you want to try
- **Completed**: Strains you've experienced
- **Scoring System**: Earn points for engagement

### 🏆 Leaderboard
- User rankings based on activity
- Point system: Complete (10pts), Favorite (2pts), Wishlist (1pt)
- Personal stats and global rankings

### 🛠️ Technical Features
- **Hybrid API**: REST for actions, GraphQL for queries
- **Server-Side Rendering**: Fast, SEO-friendly pages
- **Partial Hydration**: Interactive components only when needed
- **Type Safety**: Full TypeScript coverage
- **Modern UI**: shadcn/ui components with Tailwind CSS
- **Rate Limiting**: DDoS protection
- **Security**: Helmet, CORS, input validation

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Start the Backend API

```bash
cd app/api
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

API available at:
- REST: `http://localhost:4000/api/rest`
- GraphQL: `http://localhost:4000/api/gql`

### 2. Start the Frontend

```bash
cd app/front
npm install
npm run dev
```

Frontend available at: `http://localhost:3000`

## 📋 API Documentation

### REST Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `POST /api/rest/account/sign-up` | Create account | ❌ |
| `POST /api/rest/account/sign-in` | Sign in | ❌ |
| `POST /api/rest/account/favourites` | Add to favorites | ✅ |
| `POST /api/rest/account/wishlist` | Add to wishlist | ✅ |
| `POST /api/rest/account/complete` | Mark as complete | ✅ |

### GraphQL Queries

```graphql
# Get paginated strains
query {
  strains(page: 1, limit: 20) {
    strains {
      id
      name
      description
      positive_effects
      image_url
    }
    pageInfo {
      hasNextPage
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

# Get leaderboard with current user position
query {
  leaderboard(page: 1, limit: 20) {
    entries { rank username score }
    currentUser { rank username score }
  }
}
```

## 🎨 Frontend Stack

- **Astro**: Static site generation with partial hydration
- **React**: Interactive components
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Beautiful, accessible components

### Key Pages
- `/` - Landing page with featured strains
- `/account/sign-in` - User authentication
- `/account/sign-up` - User registration  
- `/leaderboard` - User rankings

## 🔧 Backend Stack

- **Express.js**: REST API framework
- **Apollo Server**: GraphQL implementation
- **TypeScript**: Type safety
- **JWT**: Authentication
- **bcrypt**: Password hashing
- **express-validator**: Input validation
- **express-rate-limit**: Rate limiting

### Architecture Layers
- **Interfaces**: REST routes, GraphQL resolvers
- **Controllers**: Request handling
- **Services**: Business logic
- **Repositories**: Data access
- **DTOs**: Data transfer objects
- **Models**: Domain models

## 📊 Data Source

The application uses scraped data from Leafly.com containing:
- 2,304 cannabis strains
- Detailed strain information
- Effects and medical benefits
- Flavor profiles
- Genetic lineage
- High-quality images

Data is loaded from `../../data-scraper/enhanced-data.json` with fallback mock data.

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: 100 req/15min (5 for auth)
- **Input Validation**: Request sanitization
- **CORS Protection**: Cross-origin security
- **Helmet**: Security headers
- **Password Hashing**: bcrypt with salt

## 🚀 Deployment

### Backend Deployment
```bash
cd app/api
npm run build
npm start
```

### Frontend Deployment
```bash
cd app/front
npm run build
# Deploy dist/ folder to static hosting
```

Recommended platforms:
- **Backend**: Railway, Heroku, DigitalOcean
- **Frontend**: Vercel, Netlify, GitHub Pages

## 📈 Performance

### Frontend Optimizations
- **Static Generation**: Pre-rendered HTML
- **Partial Hydration**: Minimal JavaScript
- **Image Optimization**: Automatic optimization
- **Code Splitting**: Load only what's needed

### Backend Optimizations
- **In-memory caching**: Fast data access
- **Rate limiting**: Resource protection
- **Efficient queries**: Optimized data fetching
- **Compression**: Gzip response compression

## 🧪 Development

### Project Structure
```
app/
├── api/
│   ├── src/server.ts           # Main server file
│   ├── interfaces/             # API layer
│   ├── controllers/            # Request handlers
│   ├── services/              # Business logic
│   ├── repository/            # Data access
│   ├── DTOs/                  # Data transfer objects
│   └── models/                # Domain models
└── front/
    ├── src/
    │   ├── pages/             # Astro routes
    │   ├── components/        # UI components
    │   ├── services/          # API integration
    │   └── styles/            # Global styles
    └── public/                # Static assets
```

### Environment Variables

**API (.env)**:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="24h"
PORT=4000
NODE_ENV="development"
```

**Frontend (.env)**:
```env
PUBLIC_API_URL=http://localhost:4000
```

## 📝 Success Criteria

✅ **API and frontend scaffolds compile successfully**  
✅ **REST endpoints functional with validations + auth**  
✅ **GraphQL resolvers functional with pagination + currentUser guarantee**  
✅ **Middleware tested for rate limiting + JWT auth**  
✅ **shadcn/ui components render correctly in Astro**  
✅ **Frontend services successfully call REST + GraphQL endpoints**  

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Strain data sourced from Leafly.com
- UI components inspired by shadcn/ui
- Built with modern web technologies

