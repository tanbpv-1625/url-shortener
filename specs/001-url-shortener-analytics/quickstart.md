# Quickstart: URL Shortener with Click Analytics

**Feature**: `001-url-shortener-analytics`  
**Branch**: `001-url-shortener-analytics`

## Prerequisites

- Node.js 18+ (LTS)
- npm 9+
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project with Firestore, Hosting, and Cloud Functions enabled (Blaze plan required for Cloud Functions)

## Setup

```bash
# 1. Clone and switch to feature branch
git clone <repo-url> url-shorteners
cd url-shorteners
git checkout 001-url-shortener-analytics

# 2. Install dependencies
npm install

# 3. Install Cloud Functions dependencies
cd functions && npm install && cd ..

# 4. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase project config values

# 5. Login to Firebase and select project
firebase login
firebase use --add  # Select your Firebase project
```

## Environment Variables

Create `.env.local` in the project root:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_BASE_URL=http://localhost:5000
```

## Development

```bash
# Start Vite dev server (SPA only, no Cloud Functions)
npm run dev
# → Opens http://localhost:5173

# Start Firebase emulators (Firestore + Functions + Hosting)
firebase emulators:start
# → Hosting: http://localhost:5000
# → Firestore: http://localhost:8080
# → Functions: http://localhost:5001

# Run both in parallel (recommended)
npm run dev:full
# Requires concurrently: runs Vite + Firebase emulators
```

## Quality Checks

```bash
# Type check (must pass with zero errors)
npx tsc --noEmit

# Lint (must pass with zero warnings)
npx eslint . --max-warnings 0

# Format check
npx prettier --check .

# Run tests
npx vitest run

# Run tests with coverage (target: ≥ 80%)
npx vitest run --coverage
```

## Build & Deploy

```bash
# Build SPA for production
npm run build
# → Output: dist/

# Deploy everything (Hosting + Firestore rules + Functions)
firebase deploy

# Deploy only specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

## Project Structure

```
/
├── index.html                    # Vite entry point
├── vite.config.ts                # Vite configuration
├── tailwind.config.js            # Tailwind CSS config
├── postcss.config.js             # PostCSS config (Tailwind + autoprefixer)
├── tsconfig.json                 # TypeScript config (strict mode)
├── firebase.json                 # Firebase Hosting/Functions/Firestore config
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Firestore composite indexes
├── .env.example                  # Environment variable template
├── package.json
├── src/
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Root component + React Router
│   ├── vite-env.d.ts
│   ├── lib/
│   │   ├── firebase.ts           # Firebase app initialization
│   │   └── utils.ts              # cn() utility (clsx + tailwind-merge)
│   ├── types/
│   │   ├── url.ts                # ShortUrl, CreateUrlRequest
│   │   ├── analytics.ts          # ClickEvent, AnalyticsSummary, LinkAnalytics
│   │   └── api.ts                # AsyncState<T> discriminated union
│   ├── services/
│   │   ├── url-service.ts        # Firestore CRUD for urls collection
│   │   └── analytics-service.ts  # Firestore reads for analytics data
│   ├── hooks/
│   │   ├── useShortUrl.ts        # Create, list, delete short URLs
│   │   ├── useAnalytics.ts       # Per-link analytics
│   │   └── useDashboard.ts       # Dashboard summary data
│   ├── components/
│   │   ├── common/               # Button, Input, Card, Loading, Toast, EmptyState
│   │   ├── layout/               # Navbar, PageLayout, MobileNav
│   │   ├── url/                  # UrlForm, UrlList, UrlCard
│   │   ├── analytics/            # ClickChart, DeviceBreakdown, ReferrerBreakdown
│   │   └── dashboard/            # StatsOverview, TopLinksTable, TrendChart
│   ├── pages/
│   │   ├── HomePage.tsx          # Shortener Page (/)
│   │   ├── DashboardPage.tsx     # Analytics Dashboard (/dashboard)
│   │   ├── LinkDetailPage.tsx    # Per-link analytics (/link/:shortCode)
│   │   └── NotFoundPage.tsx      # 404 page (/not-found)
│   └── styles/
│       └── globals.css           # Tailwind directives + global styles
├── functions/                    # Firebase Cloud Functions
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts              # Redirect Cloud Function
├── public/
│   └── favicon.svg
├── specs/                        # Speckit documentation
└── README.md
```

## Key Dependencies

| Package            | Version | Purpose                            |
| ------------------ | ------- | ---------------------------------- |
| `react`            | ^18.3   | UI framework                       |
| `react-dom`        | ^18.3   | React DOM renderer                 |
| `react-router-dom` | ^6.28   | Client-side routing                |
| `firebase`         | ^10.x   | Firebase Web SDK (Firestore, etc.) |
| `nanoid`           | ^5.1    | Short code generation (118 bytes)  |
| `recharts`         | ^2.13   | Charts for analytics dashboard     |
| `date-fns`         | ^3.x    | Date formatting/grouping           |
| `clsx`             | ^2.1    | Conditional class joining          |
| `tailwind-merge`   | ^2.x    | Tailwind class deduplication       |

| Dev Dependency           | Version | Purpose                 |
| ------------------------ | ------- | ----------------------- |
| `vite`                   | ^5.x    | Build tool              |
| `typescript`             | ^5.x    | Type checking           |
| `tailwindcss`            | ^3.4    | Utility-first CSS       |
| `autoprefixer`           | ^10.x   | CSS vendor prefixes     |
| `postcss`                | ^8.x    | CSS processing          |
| `eslint`                 | ^8.x    | Linting                 |
| `@typescript-eslint/*`   | ^7.x    | TypeScript ESLint       |
| `prettier`               | ^3.x    | Code formatting         |
| `vitest`                 | ^2.x    | Testing framework       |
| `@testing-library/react` | ^16.x   | React component testing |
| `firebase-tools`         | ^13.x   | Firebase CLI (global)   |

## Firebase Cloud Function Dependencies

| Package              | Version | Purpose                                          |
| -------------------- | ------- | ------------------------------------------------ |
| `firebase-admin`     | ^12.x   | Admin SDK (Firestore writes)                     |
| `firebase-functions` | ^5.x    | Cloud Functions framework                        |
| `ua-parser-js`       | ^1.0    | User-Agent parsing (MIT license — NOT v2.x AGPL) |
