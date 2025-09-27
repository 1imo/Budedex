# Budedex V2 - Pokédex Interface

A TUI-inspired, Pokédex-style interface for the cannabis strain database.

## Features

- **Pokédex Grid**: 64x64 pixel strain images in a grid layout
- **TUI Design**: Terminal User Interface aesthetic with pixel fonts and retro colors
- **Real-time Search**: Search and filter strains with instant results
- **Responsive Layout**: Desktop has grid + detail pane, mobile stacks vertically
- **Strain Collection**: Mark strains as "seen" and "caught" like Pokémon
- **Keyboard Navigation**: Use arrow keys to navigate, / to focus search, ESC to clear
- **Pixel Art Styling**: Crisp, retro gaming aesthetic throughout

## Layout

### Desktop
```
┌─────────────────────────────────────────┐
│ SEARCH BAR | STATS | AUTH BUTTONS       │
├─────────────────────┬───────────────────┤
│                     │                   │
│   STRAIN GRID       │  STRAIN DETAILS   │
│   (64x64 images)    │  (Mobile format)  │
│                     │                   │
└─────────────────────┴───────────────────┘
```

### Mobile
```
┌─────────────────────────────────────────┐
│ SEARCH BAR | STATS | AUTH              │
├─────────────────────────────────────────┤
│          STRAIN DETAILS                 │
│        (Compact format)                 │
├─────────────────────────────────────────┤
│                                         │
│        STRAIN GRID (48x48)              │
│                                         │
└─────────────────────────────────────────┘
```

## Components

- `TUIHeader.astro` - Search bar, stats, and authentication
- `PokedexGrid.astro` - Grid of strain images with selection
- `StrainDetailPane.astro` - Detailed strain information panel
- `Layout.astro` - Base layout with TUI styling

## Development

```bash
cd app/front-v2
npm install
npm run dev
```

Runs on port 3001 to avoid conflicts with the original front-end.

## API Integration

Uses the same GraphQL API as the original frontend:
- Strain listing and pagination
- Strain details and search
- Image URLs and metadata

## Local Storage

- `seen-strains`: Array of strain names the user has viewed
- `caught-strains`: Array of strain names the user has "caught"
- `budedex-v2-welcome`: Flag for welcome message

## Keyboard Shortcuts

- `/` - Focus search input
- `ESC` - Clear search and blur input
- `Arrow Keys` - Navigate strain grid
- `Enter` - Search (when in search input)

## Debug Console

Access `window.budedexDebug` in browser console:
- `getState()` - View current application state
- `clearUserData()` - Reset all progress and reload
- `markAllSeen()` - Mark all strains as seen

## Color Scheme

TUI-inspired dark theme with:
- Green: Primary accent, borders, text highlights
- Cyan: Secondary information, stats
- Yellow: Warnings, hover states
- Red: Destructive actions, "caught" indicators
- Blue: Links, special info
- Gray: Borders, muted content