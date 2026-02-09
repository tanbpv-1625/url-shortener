# Implementation Plan: URL Shortener with Click Analytics

**Branch**: `001-url-shortener-analytics` | **Date**: 2026-02-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-url-shortener-analytics/spec.md`

## Summary

Build a 2-page React TypeScript SPA for URL shortening with click analytics. Page 1 (Shortener `/`) lets users create, copy, and manage short URLs. Page 2 (Dashboard `/dashboard`) shows click statistics with daily/weekly trend charts, top links, and per-link analytics (referrer + device breakdowns). Uses Firebase as the full backend: Firestore for data storage, one Cloud Function for redirect + click tracking, and Firebase Hosting for static deployment. Styled with Tailwind CSS (mobile-first responsive). Charts rendered with Recharts (SVG, accessible).

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode), Node.js 20 (Cloud Functions)  
**Primary Dependencies**: React 18+, React Router v6, Tailwind CSS v3.4, Firebase SDK v10 (Firestore), Recharts, nanoid, date-fns, clsx + tailwind-merge  
**Storage**: Cloud Firestore — `urls` collection (doc ID = short code) + `clicks` subcollection per URL  
**Testing**: Vitest + React Testing Library; Coverage target ≥ 80%  
**Target Platform**: Web (SPA) — static deploy via Firebase Hosting; Cloud Function (Node.js 20) for redirect  
**Project Type**: web (frontend SPA + serverless function)  
**Performance Goals**: Lighthouse ≥ 90 (Perf, A11y, Best Practices); Dashboard load < 2s; URL creation < 10s end-to-end  
**Constraints**: No custom backend server; Firebase Blaze plan required (Cloud Functions); ua-parser-js must be v1.x (MIT, NOT v2.x AGPL)  
**Scale/Scope**: 2 pages + 1 detail view; < 1000 URLs expected; single-user (no auth for MVP)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                       | Status                | Notes                                                                                                                                                                                 |
| ------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. React TypeScript SPA         | PASS                  | React 18 + TS strict mode + Vite + static deploy to Firebase Hosting                                                                                                                  |
| II. Mobile-First & Responsive   | PASS                  | Tailwind mobile-first with `md:` (768px) and `lg:` (1024px) breakpoints; touch targets ≥ 44px                                                                                         |
| III. Type Safety & Code Quality | PASS                  | Strict TS, discriminated unions (`AsyncState<T>`), exported interfaces, ESLint + Prettier                                                                                             |
| IV. Component Architecture      | PASS (with deviation) | Atomic-inspired structure; **Deviation**: Tailwind replaces CSS Modules (justified by DX speed + smaller CSS output). Component directories follow `ComponentName/index.tsx` pattern. |
| V. Performance & Accessibility  | PASS                  | Code splitting via React.lazy + Suspense; Recharts SVG (accessible); WCAG 2.1 AA; Lighthouse ≥ 90                                                                                     |

**Constitution Deviation — Tailwind CSS replacing CSS Modules**:

- Constitution IV specifies CSS Modules (`.module.css`).
- This plan uses Tailwind CSS utility classes instead.
- **Justification**: Tailwind is faster to develop with, produces smaller production CSS via JIT purging, eliminates CSS file management. Widely adopted industry standard. Constitution amendment recommended to update the styling section.

### Post-Design Re-Check

| Principle                     | Status | Notes                                                                                                                         |
| ----------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| I. React TypeScript SPA       | PASS   | All types defined in `src/types/`. Firebase SDK modular (tree-shakeable).                                                     |
| II. Mobile-First & Responsive | PASS   | Tailwind breakpoints verified: mobile (default) → `md:` tablet → `lg:` desktop. Charts use `<ResponsiveContainer>`.           |
| III. Type Safety              | PASS   | `ShortUrl`, `ClickEvent`, `AnalyticsSummary`, `LinkAnalytics`, `AsyncState<T>` all defined. No `any`.                         |
| IV. Component Architecture    | PASS   | Components in `common/`, `url/`, `analytics/`, `dashboard/`, `layout/`. Hooks: `useShortUrl`, `useAnalytics`, `useDashboard`. |
| V. Performance & A11y         | PASS   | Recharts SVG supports ARIA labels. Code splitting per route. `<ResponsiveContainer>` for charts.                              |

## Project Structure

### Documentation (this feature)

```text
specs/001-url-shortener-analytics/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: Technology research & decisions
├── data-model.md        # Phase 1: Firestore data model & TypeScript types
├── quickstart.md        # Phase 1: Setup & development guide
├── contracts/           # Phase 1: Firestore SDK operation contracts
│   └── firestore-contracts.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
/
├── index.html                        # Vite entry point
├── vite.config.ts                    # Vite config
├── tailwind.config.js                # Tailwind CSS config
├── postcss.config.js                 # PostCSS (Tailwind + autoprefixer)
├── tsconfig.json                     # TypeScript strict config
├── firebase.json                     # Hosting rewrites + Firestore config
├── firestore.rules                   # Security rules
├── firestore.indexes.json            # Composite indexes
├── .env.example                      # Env var template
├── package.json
│
├── src/                              # React SPA source
│   ├── main.tsx                      # Entry point
│   ├── App.tsx                       # Root + React Router setup
│   ├── vite-env.d.ts
│   │
│   ├── lib/                          # Core utilities
│   │   ├── firebase.ts               # Firebase initialization
│   │   └── utils.ts                  # cn() = clsx + tailwind-merge
│   │
│   ├── types/                        # TypeScript type definitions
│   │   ├── url.ts                    # ShortUrl, CreateUrlRequest
│   │   ├── analytics.ts              # ClickEvent, AnalyticsSummary, LinkAnalytics
│   │   └── api.ts                    # AsyncState<T> discriminated union
│   │
│   ├── services/                     # Firestore data access layer
│   │   ├── url-service.ts            # createShortUrl, listUrls, deleteUrl
│   │   └── analytics-service.ts      # getDashboardSummary, getLinkAnalytics
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useShortUrl.ts            # URL CRUD state management
│   │   ├── useAnalytics.ts           # Per-link analytics
│   │   └── useDashboard.ts           # Dashboard summary data
│   │
│   ├── components/                   # UI components (Atomic-inspired)
│   │   ├── common/                   # Atoms: Button, Input, Card, Loading, Toast, EmptyState
│   │   ├── layout/                   # Organisms: Navbar, PageLayout, MobileNav
│   │   ├── url/                      # Molecules: UrlForm, UrlList, UrlCard
│   │   ├── analytics/                # Molecules: ClickChart, DeviceBreakdown, ReferrerBreakdown
│   │   └── dashboard/                # Organisms: StatsOverview, TopLinksTable, TrendChart
│   │
│   ├── pages/                        # Route-level page components
│   │   ├── HomePage.tsx              # Shortener Page (/)
│   │   ├── DashboardPage.tsx         # Analytics Dashboard (/dashboard)
│   │   ├── LinkDetailPage.tsx        # Per-link detail (/link/:shortCode)
│   │   └── NotFoundPage.tsx          # 404 (/not-found)
│   │
│   └── styles/
│       └── globals.css               # Tailwind directives (@tailwind base/components/utilities)
│
├── functions/                        # Firebase Cloud Functions
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts                  # Redirect + click tracking function
│
└── public/
    └── favicon.svg
```

**Structure Decision**: Web SPA (frontend) + serverless Cloud Function (redirect). No separate backend directory — the `functions/` dir is a lightweight Firebase Functions project with a single HTTP function. All data access from the React app goes directly through Firestore Client SDK.

## Complexity Tracking

| Deviation                                    | Why Needed                                                                              | Simpler Alternative Rejected Because                                                        |
| -------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Tailwind CSS instead of CSS Modules          | Faster development, co-located styles, smaller CSS in production                        | CSS Modules require separate files, more context-switching, can accumulate dead styles      |
| Cloud Function for redirect                  | Server-side 302 redirect is reliable, fast, SEO-friendly, and guarantees click tracking | Client-side redirect adds 1–3s latency, can be blocked by ad-blockers, unreliable tracking  |
| `clicks` subcollection (not flat collection) | Co-locates click events with parent URL for efficient per-link queries                  | Flat `clicks` collection requires filtering by `shortCode` on every query — slower at scale |
