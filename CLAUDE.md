# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run expo:dev          # Start Expo dev server (with Replit proxy config)
npm run server:dev        # Start Express backend with tsx

# Build
npm run expo:static:build # Build static Expo bundle (runs scripts/build.js)
npm run server:build      # Build server to ESM via esbuild
npm run db:push           # Push Drizzle schema changes to PostgreSQL

# Code quality
npm run lint              # ESLint via expo lint
npm run lint:fix          # Auto-fix lint issues
```

Ports: `5000` (Express API), `8081` (Metro), `8082` (Web preview in Replit).

No test framework is configured — there are no test commands.

## Architecture

**Dumb Calorie** is a local-first calorie/macro/weight tracker built with Expo + React Native, targeting iOS, Android, and Web from a single codebase.

### Data Flow

All user data is stored **locally in SQLite** (`expo-sqlite`). The Express server in `/server` is primarily for Replit deployment (serving static Expo bundles and manifests) — it is not a typical REST API for the mobile client.

- **Local DB**: `/db/init.ts` initializes SQLite with 3 tables (`settings`, `intake_entries`, `weight_entries`). Queries are in `/db/queries.ts`.
- **Global State**: `AppContext` (`/context/AppContext.tsx`) holds all app state (entries, settings, calorie totals) and exposes mutation functions that write to SQLite then update state.
- **Theme**: `ThemeContext` (`/context/ThemeContext.tsx`) manages light/dark mode, persisted via AsyncStorage.
- **Optional backend DB**: `/shared/schema.ts` defines a Drizzle/PostgreSQL schema — currently only a `users` table scaffold, unused by the mobile client.

### Provider Stack (root layout)

```
ErrorBoundary → QueryClientProvider → SafeAreaProvider →
GestureHandlerRootView → KeyboardProvider → ThemeProvider → AppProvider
```

### Routing

File-based routing via `expo-router` v6. Pages live in `/app/`:
- `index.tsx` — main dashboard (the entire app UI essentially)
- `_layout.tsx` — root layout with provider stack

### Key Conventions

- **Date keys**: `YYYY-MM-DD` strings used to group entries by day (see `/utils/dates.ts`)
- **Settings row**: Always `id=1` singleton in the `settings` table
- **Path aliases**: `@/*` maps to project root, `@shared/*` maps to `/shared/`
- **Theme colors**: Defined in `/constants/colors.ts` for light and dark variants
- **Icons**: `@expo/vector-icons` (Feather set)
- **Fonts**: DM Sans (400/500/700) from `@expo-google-fonts/dm-sans`

### Static Build

`scripts/build.js` is a complex custom script that:
1. Runs `expo export` to produce Metro bundles for iOS/Android
2. Rewrites asset URLs to use the `EXPO_PUBLIC_DOMAIN` env var
3. Generates Expo manifests for each platform
4. Builds a landing page from `/server/templates/`

This is the Replit-specific deployment path; normal local development uses `expo:dev`.
