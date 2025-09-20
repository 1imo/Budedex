# Pokedex Frontend

Modern Astro-based frontend for the cannabis strain database application, featuring React components with shadcn/ui styling.

## Features

- **🚀 Astro**: Static site generation with partial hydration
- **⚛️ React Integration**: Interactive components where needed
- **🎨 shadcn/ui Components**: Beautiful, accessible UI components
- **📱 Responsive Design**: Mobile-first responsive layout
- **🔐 Authentication**: JWT-based user authentication
- **📊 GraphQL Integration**: Efficient data fetching
- **🎯 TypeScript**: Full type safety

## Architecture

```
front/
├── src/
│   ├── pages/              # Astro routes
│   │   ├── index.astro     # Landing page
│   │   ├── account/        # Auth pages
│   │   └── leaderboard.astro
│   ├── components/         # UI components
│   │   ├── ui/             # shadcn/ui components
│   │   └── layouts/        # Layout components
│   ├── services/           # API integration
│   │   ├── account.ts      # REST API calls
│   │   └── graphql.ts      # GraphQL queries
│   ├── lib/                # Utilities
│   └── styles/             # Global styles
└── public/                 # Static assets
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run preview
```

## Pages

### Public Pages
- **`/`**: Landing page with featured strains
- **`/account/sign-in`**: User authentication
- **`/account/sign-up`**: User registration
- **`/leaderboard`**: User rankings and scoring

### Features
- **Static Generation**: Fast loading with Astro's SSG
- **Partial Hydration**: React components load only when needed
- **SEO Optimized**: Server-side rendered content
- **Responsive**: Mobile-first design

## Components

### UI Components (shadcn/ui style)
- `Button`: Customizable button with variants
- `Card`: Content containers with header/footer
- `Input`: Form input with validation styling

### React Components
- `SignInForm`: Interactive authentication form
- `SignUpForm`: User registration form

### Astro Components
- `Layout`: Main page layout with header/footer

## Services

### REST API Integration (`services/account.ts`)
```typescript
// Authentication
await signUp({ username, email, password });
await signIn({ email, password });

// User actions (requires auth token)
await addToFavourites(strainId, token);
await addToWishlist(strainId, token);
await markAsComplete(strainId, token);
```

### GraphQL Integration (`services/graphql.ts`)
```typescript
// Fetch strains with pagination
const { strains } = await getStrains(page, limit);

// Search strains
const results = await searchStrains(query, page, limit);

// Get leaderboard with current user
const { leaderboard } = await getLeaderboard(page, limit, token);
```

## Styling

### Tailwind CSS
- Utility-first CSS framework
- Custom design system with CSS variables
- Dark mode support
- Responsive breakpoints

### Design Tokens
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96%;
  /* ... */
}
```

## Authentication

### JWT Token Storage
```typescript
// Store token after successful auth
localStorage.setItem('auth_token', token);
localStorage.setItem('user', JSON.stringify(user));

// Use token in API calls
const token = localStorage.getItem('auth_token');
```

### Protected Routes
Authentication state is managed client-side. Protected actions require valid JWT tokens.

## Data Fetching

### Server-Side (Astro)
```typescript
// Fetch data at build time or request time
const strainsData = await getStrains(1, 12);
```

### Client-Side (React)
```typescript
// Interactive components fetch data as needed
const handleAddToFavorites = async () => {
  await addToFavourites(strainId, token);
};
```

## Environment Variables

Create `.env` file:
```env
PUBLIC_API_URL=http://localhost:4000
```

## Performance

### Astro Benefits
- **Zero JS by default**: Only interactive components ship JavaScript
- **Partial Hydration**: `client:load`, `client:visible`, `client:idle`
- **Static Generation**: Pre-rendered HTML for fast loading
- **Optimized Assets**: Automatic image optimization

### Loading Strategies
```astro
<!-- Load immediately -->
<SignInForm client:load />

<!-- Load when visible -->
<StrainCard client:visible />

<!-- Load when page is idle -->
<SearchForm client:idle />
```

## Development

### Adding New Pages

1. Create `.astro` file in `src/pages/`
2. Use `Layout` component for consistent styling
3. Add navigation links as needed

### Adding New Components

For static components:
```astro
---
// src/components/MyComponent.astro
export interface Props {
  title: string;
}
const { title } = Astro.props;
---

<div class="my-component">
  <h2>{title}</h2>
  <slot />
</div>
```

For interactive components:
```tsx
// src/components/MyComponent.tsx
import React from 'react';

interface Props {
  title: string;
}

export default function MyComponent({ title }: Props) {
  return <div>{title}</div>;
}
```

### Styling Guidelines

1. Use Tailwind utility classes
2. Follow shadcn/ui patterns for components
3. Use CSS variables for theming
4. Maintain responsive design

## Deployment

### Static Deployment
Astro generates static files that can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

### Build Output
```bash
npm run build
# Generates dist/ folder with static assets
```

## Browser Support

- Modern browsers (ES2022+)
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow TypeScript best practices
2. Use Prettier for code formatting
3. Maintain accessibility standards
4. Test responsive design
5. Optimize for performance

