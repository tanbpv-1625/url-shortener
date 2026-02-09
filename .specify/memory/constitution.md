# URL Shortener Constitution

## Project Overview

A URL shortening service with click analytics. Users create Short URLs, and the system tracks click counts, traffic sources (referrer), and device types (mobile/tablet/desktop). Includes a dashboard with daily/weekly statistics and top links.

### Key Features

- **Create Short URL**: Input original URL → generate short code → return a copyable/shareable short link
- **Redirect & Track**: Access short link → redirect to original URL while recording the click event
- **Click Analytics**: Track total clicks, source (referrer), device type, and timestamp
- **Dashboard**: Click statistics by day/week, trend charts, top links table
- **Link Management**: View list of created short URLs, delete, and view per-link analytics details

## Core Principles

### I. React TypeScript SPA

The application is a **Single Page Application** built with **React 18+** and **TypeScript strict mode**; Client-side rendering — all UI logic runs in the browser; Deployed as static build output (Vite build → `dist/`); All backend interactions via REST API calls from the client; Strict TypeScript: `"strict": true`, no `any` usage except in exceptional cases with an explanatory comment.

### II. Mobile-First & Responsive Design

Design follows the **Mobile-First** principle — styles written for mobile first, using `min-width` media queries to scale up; Minimum 3 breakpoints supported: mobile (< 768px), tablet (768px–1024px), desktop (> 1024px); Dashboard layout transitions from single-column (mobile) to multi-column grid (desktop); All interactive elements MUST be touch-friendly (min target size 44px); Charts MUST be responsive, scaling automatically with their container.

### III. Type Safety & Code Quality

Every component, hook, and utility MUST have explicit **type definitions**; Interface/Type for API responses, request payloads, and component props are mandatory; No `as` type assertions unless absolutely necessary; Use discriminated unions for state management (loading/success/error); ESLint + Prettier are mandatory with a zero warnings policy.

### IV. Component Architecture

Atomic Design pattern: atoms → molecules → organisms → pages; Each component in its own directory: `ComponentName/index.tsx`, `ComponentName.module.css`, `ComponentName.test.tsx`; Custom hooks for reusable logic (`useShortUrl`, `useAnalytics`, `useDashboard`); Separate presentation components (UI) from container components (logic/data fetching); Props interfaces MUST be exported for reuse.

### V. Performance & Accessibility

Target Lighthouse score ≥ 90 (Performance, Accessibility, Best Practices); Code splitting with `React.lazy()` + `Suspense` for routes; Reasonable memoization (`useMemo`, `useCallback`, `React.memo`) — do not over-optimize; WCAG 2.1 Level AA: semantic HTML, keyboard navigation, ARIA labels; Color contrast ratio ≥ 4.5:1; Chart components MUST provide alternative text/table views for screen readers.

## Technology Stack & Constraints

- **Framework**: React 18+ with TypeScript 5+
- **Build Tool**: Vite (fast HMR, optimized production build)
- **Styling**: CSS Modules (`.module.css`) + CSS Custom Properties for theming; Flexbox/Grid for layout
- **Routing**: React Router v6+ (client-side routing)
- **State Management**: React Context + `useReducer` for global state; `useState` for component-level
- **Data Fetching**: Fetch API wrapper with TypeScript generics; Custom hooks (`useFetch<T>`)
- **Charts**: Lightweight chart library (Recharts or Chart.js with react-chartjs-2)
- **Date Handling**: date-fns (tree-shakeable) for day/week processing in analytics
- **Testing**: Vitest + React Testing Library; Coverage target ≥ 80%
- **Linting**: ESLint (typescript-eslint) + Prettier
- **API Communication**: REST API via fetch wrapper; Base URL configured via `VITE_API_URL`
- **Hosting**: Static hosting (Vercel, Netlify, or GitHub Pages) — serves `dist/` only
- **Browser Support**: Latest 2 versions of Chrome, Firefox, Safari, Edge
- **No server-side code** in this repo — frontend SPA only

## Development Workflow

- **Version Control**: Git with conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- **Branching**: `main` (production), `develop` (staging), feature branches (`feat/feature-name`)
- **Code Review**: All changes to `main` MUST go through a Pull Request with at least 1 approval
- **Testing**: `vitest run` MUST pass before merge; Manual responsive testing on mobile + desktop
- **Type Check**: `tsc --noEmit` MUST pass — no type errors allowed
- **Lint**: `eslint . --max-warnings 0` — zero warnings policy
- **Deployment**: Auto deploy from `main` branch via CI/CD pipeline
- **File Organization**:
  ```
  /
  ├── index.html
  ├── vite.config.ts
  ├── tsconfig.json
  ├── package.json
  ├── src/
  │   ├── main.tsx
  │   ├── App.tsx
  │   ├── vite-env.d.ts
  │   ├── types/
  │   │   ├── url.ts
  │   │   ├── analytics.ts
  │   │   └── api.ts
  │   ├── api/
  │   │   ├── client.ts
  │   │   ├── urls.ts
  │   │   └── analytics.ts
  │   ├── hooks/
  │   │   ├── useShortUrl.ts
  │   │   ├── useAnalytics.ts
  │   │   └── useDashboard.ts
  │   ├── components/
  │   │   ├── common/
  │   │   ├── url/
  │   │   ├── analytics/
  │   │   └── dashboard/
  │   ├── pages/
  │   │   ├── HomePage.tsx
  │   │   ├── DashboardPage.tsx
  │   │   ├── LinkDetailPage.tsx
  │   │   └── NotFoundPage.tsx
  │   ├── context/
  │   │   └── AppContext.tsx
  │   ├── utils/
  │   │   ├── format.ts
  │   │   ├── clipboard.ts
  │   │   └── device.ts
  │   └── styles/
  │       ├── global.css
  │       └── variables.css
  ├── public/
  │   └── favicon.svg
  └── README.md
  ```

## Governance

This constitution is the authoritative document guiding all technical decisions for the project. All changes to core principles MUST be documented and reviewed before adoption. When principles conflict, priority order is: Type Safety > Accessibility > Performance > Simplicity > Aesthetics. All PRs MUST pass: type check (`tsc --noEmit`), lint, and tests before merge. Code with unjustified `any` types MUST NOT be merged.

Amendment procedure: Propose changes via PR to this file → team review → merge to `main`. Versioning follows semantic versioning (MAJOR: significant principle changes, MINOR: new sections/expansions, PATCH: wording fixes).

**Version**: 1.0.1 | **Ratified**: 2026-02-09 | **Last Amended**: 2026-02-09
