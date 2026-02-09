# Tasks: URL Shortener with Click Analytics

**Input**: Design documents from `/specs/001-url-shortener-analytics/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/firestore-contracts.md, quickstart.md

**Tests**: Not explicitly requested in feature specification. Test framework is configured in Setup but individual test tasks are omitted. Add test tasks if TDD is desired.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **SPA source**: `src/` at repository root
- **Cloud Functions**: `functions/` at repository root
- **Firebase config**: repository root (`firebase.json`, `firestore.rules`, etc.)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and tooling configuration

- [x] T001 Initialize Vite + React + TypeScript project and install runtime dependencies (react-router-dom, firebase, recharts, nanoid, date-fns, clsx, tailwind-merge, ua-parser-js) and dev dependencies (vitest, @testing-library/react, eslint, prettier, typescript-eslint) in package.json
- [x] T002 [P] Configure Tailwind CSS v3.4 with tailwind.config.js (content paths, mobile-first breakpoints md:768px lg:1024px), postcss.config.js (tailwindcss + autoprefixer), and src/styles/globals.css (@tailwind base/components/utilities directives)
- [x] T003 [P] Configure TypeScript strict mode in tsconfig.json (strict: true, noUncheckedIndexedAccess, paths aliases) and create src/vite-env.d.ts
- [x] T004 [P] Configure ESLint (typescript-eslint flat config, zero warnings) in eslint.config.js and Prettier in .prettierrc
- [x] T005 [P] Create .env.example with all VITE*FIREBASE*\* environment variables and VITE_BASE_URL per contracts/firestore-contracts.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Firebase & Configuration

- [x] T006 Initialize Firebase app and export Firestore db instance in src/lib/firebase.ts (use environment variables via import.meta.env)
- [x] T007 [P] Create firebase.json with hosting rewrites (SPA routes → index.html, catch-all → Cloud Function redirect), Firestore rules/indexes references, and Functions config per contracts/firestore-contracts.md
- [x] T008 [P] Create Firestore security rules allowing urls collection CRUD and clicks subcollection reads in firestore.rules
- [x] T009 [P] Create Firestore composite indexes (clickCount DESC + createdAt DESC on urls collection) in firestore.indexes.json

### TypeScript Types

- [x] T010 [P] Define ShortUrl and CreateUrlRequest interfaces in src/types/url.ts per data-model.md
- [x] T011 [P] Define ClickEvent, AnalyticsSummary, LinkAnalytics, TimeSeriesPoint, ReferrerCategory, DeviceType in src/types/analytics.ts per data-model.md
- [x] T012 [P] Define AsyncState\<T\> discriminated union (idle | loading | success | error) in src/types/api.ts per data-model.md

### Utilities

- [x] T013 [P] Create cn() utility function (clsx + tailwind-merge) in src/lib/utils.ts

### Common UI Components

- [x] T014 [P] Create Button component (variants: primary, secondary, danger; sizes: sm, md, lg; loading state; min touch target 44px) in src/components/common/Button/index.tsx
- [x] T015 [P] Create Input component (label, error message slot, full-width mobile, min height 44px) in src/components/common/Input/index.tsx
- [x] T016 [P] Create Card component (padding, shadow, rounded container) in src/components/common/Card/index.tsx
- [x] T017 [P] Create Loading spinner component (centered, accessible aria-label) in src/components/common/Loading/index.tsx
- [x] T018 [P] Create Toast notification component (success/error variants, auto-dismiss, accessible role="alert") in src/components/common/Toast/index.tsx
- [x] T019 [P] Create EmptyState component (icon, title, description, optional action button) in src/components/common/EmptyState/index.tsx
- [x] T020 [P] Create ErrorBoundary component with fallback UI in src/components/common/ErrorBoundary/index.tsx

### Layout Components

- [x] T021 Create Navbar component with links to Home (/) and Dashboard (/dashboard), responsive with mobile hamburger menu in src/components/layout/Navbar/index.tsx
- [x] T022 [P] Create MobileNav responsive drawer/bottom navigation in src/components/layout/MobileNav/index.tsx
- [x] T023 Create PageLayout wrapper component (Navbar + main content area + responsive padding) in src/components/layout/PageLayout/index.tsx

### Application Shell

- [x] T024 Create App.tsx with React Router v6 routes: / (HomePage), /dashboard (DashboardPage), /link/:shortCode (LinkDetailPage), /not-found (NotFoundPage), \* (redirect to /not-found). Use React.lazy + Suspense for page-level code splitting in src/App.tsx
- [x] T025 [P] Create NotFoundPage with "Link not found" message and navigation back to home in src/pages/NotFoundPage.tsx
- [x] T026 Create main.tsx entry point rendering App with BrowserRouter in src/main.tsx
- [x] T027 [P] Update index.html with meta tags (viewport, description, charset), favicon reference, and Tailwind font link

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 — Create a Short URL (Priority: P1) 🎯 MVP

**Goal**: User can paste a long URL, click "Shorten", get a short link, and copy it to clipboard.

**Independent Test**: Enter a valid URL on the Shortener Page, click "Shorten", verify short link appears with a working "Copy" button. Test with invalid URLs (blank, missing protocol, >2048 chars) and verify inline errors.

### Implementation for User Story 1

- [x] T028 [US1] Implement url-service.ts with createShortUrl (nanoid 7-char generation, Firestore setDoc, duplicate short code retry up to 3 attempts), duplicateUrlCheck (getDoc by originalUrl), and URL validation (format check, https:// auto-prepend, max 2048 chars) in src/services/url-service.ts
- [x] T029 [US1] Create useShortUrl hook managing create flow with AsyncState, clipboard copy (navigator.clipboard with fallback), and toast feedback in src/hooks/useShortUrl.ts
- [x] T030 [P] [US1] Create UrlForm component with URL input field, "Shorten" button, inline validation errors, loading state on submit, and generated short URL display with "Copy" button in src/components/url/UrlForm/index.tsx
- [x] T031 [US1] Create HomePage rendering UrlForm inside PageLayout, displaying generated short URL result, responsive full-width layout on mobile in src/pages/HomePage.tsx

**Checkpoint**: User Story 1 fully functional — users can create and copy short URLs. This is the MVP deliverable.

---

## Phase 4: User Story 2 — Short URL Redirect with Click Tracking (Priority: P1)

**Goal**: Visiting a short URL redirects to the original URL and records click metadata (timestamp, referrer, device type).

**Independent Test**: Visit a short URL in a browser, verify (a) 302 redirect to original URL happens, (b) a click document is created in the Firestore clicks subcollection with correct metadata. Visit a nonexistent short code, verify redirect to /not-found.

### Implementation for User Story 2

- [x] T032 [US2] Initialize Cloud Functions project: create functions/package.json (firebase-functions v2, firebase-admin, ua-parser-js@1.x MIT), functions/tsconfig.json (strict, ES2021, Node20), and install dependencies in functions/
- [x] T033 [US2] Implement redirect Cloud Function in functions/src/index.ts: Firestore lookup by shortCode, 302 redirect to originalUrl (or /not-found if missing), referrer categorization (parse Referer header → direct/search/social/other using domain matching), device detection (ua-parser-js v1.x → mobile/tablet/desktop), write ClickEvent to urls/{shortCode}/clicks subcollection, and atomic increment of urls/{shortCode}.clickCount

**Checkpoint**: User Story 2 fully functional — short URLs redirect and clicks are tracked. Combined with US1, the core URL shortener works end-to-end.

---

## Phase 5: User Story 3 — View Analytics Dashboard (Priority: P1)

**Goal**: User navigates to /dashboard and sees summary cards (total links, total clicks, clicks today), a toggleable daily/weekly trend chart, and a top links table.

**Independent Test**: Navigate to /dashboard with existing URL and click data, verify summary cards show correct counts, trend chart renders with toggle between daily/weekly, and top links table shows ranked links. Test empty dashboard state with no data.

### Implementation for User Story 3

- [x] T034 [US3] Implement getDashboardSummary in src/services/analytics-service.ts: parallel Firestore queries (top 10 urls by clickCount, total urls count via getCountFromServer, collectionGroup clicks query for last 30 days), client-side aggregation for dailyClicks/weeklyClicks using date-fns (startOfDay, startOfWeek, format), compute totalClicks and clicksToday
- [x] T035 [US3] Create useDashboard hook managing dashboard data fetch with AsyncState, daily/weekly toggle state, and auto-refresh on mount in src/hooks/useDashboard.ts
- [x] T036 [P] [US3] Create StatsOverview component rendering 3 summary cards (total links, total clicks, clicks today) in a responsive grid (1-col mobile, 3-col desktop) in src/components/dashboard/StatsOverview/index.tsx
- [x] T037 [P] [US3] Create TrendChart component with Recharts ResponsiveContainer + LineChart, daily/weekly toggle buttons, formatted X-axis dates, tooltip, and responsive sizing in src/components/dashboard/TrendChart/index.tsx
- [x] T038 [P] [US3] Create TopLinksTable component with columns (short URL, original URL truncated, total clicks), rows sorted by clickCount DESC, clickable rows navigating to /link/:shortCode, horizontally scrollable on mobile in src/components/dashboard/TopLinksTable/index.tsx
- [x] T039 [US3] Create DashboardPage assembling StatsOverview, TrendChart, TopLinksTable inside PageLayout with loading states and empty state ("No data yet — create and share links!") in src/pages/DashboardPage.tsx

**Checkpoint**: User Story 3 fully functional — dashboard shows aggregate analytics. Combined with US1+US2, the product delivers full create → track → analyze workflow.

---

## Phase 6: User Story 4 — View Per-Link Analytics Detail (Priority: P2)

**Goal**: User clicks a link row on the dashboard and sees that link's detailed analytics: click trend, referrer breakdown, and device breakdown.

**Independent Test**: Click a link row on the dashboard (or navigate directly to /link/:shortCode), verify per-link click trend chart renders, referrer breakdown shows direct/search/social/other with counts, and device breakdown shows mobile/tablet/desktop with counts.

### Implementation for User Story 4

- [x] T040 [US4] Implement getLinkAnalytics in src/services/analytics-service.ts: fetch URL doc (getDoc), fetch all click events from subcollection (orderBy timestamp desc), client-side aggregation for clickTrend (daily with date-fns), referrerBreakdown (Record\<ReferrerCategory, number\>), deviceBreakdown (Record\<DeviceType, number\>)
- [x] T041 [US4] Create useAnalytics hook accepting shortCode param, managing per-link analytics fetch with AsyncState in src/hooks/useAnalytics.ts
- [x] T042 [P] [US4] Create ClickChart component with Recharts ResponsiveContainer + LineChart for per-link daily click trend in src/components/analytics/ClickChart/index.tsx
- [x] T043 [P] [US4] Create ReferrerBreakdown component with Recharts PieChart or horizontal BarChart showing direct/search/social/other distribution with counts and percentages in src/components/analytics/ReferrerBreakdown/index.tsx
- [x] T044 [P] [US4] Create DeviceBreakdown component with Recharts PieChart showing mobile/tablet/desktop distribution with counts and percentages in src/components/analytics/DeviceBreakdown/index.tsx
- [x] T045 [US4] Create LinkDetailPage assembling link info header, ClickChart, ReferrerBreakdown, DeviceBreakdown inside PageLayout with loading state and back navigation to dashboard in src/pages/LinkDetailPage.tsx

**Checkpoint**: User Story 4 fully functional — users can drill into per-link analytics from the dashboard.

---

## Phase 7: User Story 5 — Manage Shortened Links (Priority: P2)

**Goal**: User sees a list of all their short URLs on the Shortener Page (below the form) with creation date and total clicks, and can delete links.

**Independent Test**: Create multiple short URLs, verify they appear in the list below the form (newest first) with short URL, truncated original URL, date, and click count. Delete a link and verify it's removed with success toast. Verify empty state when no links exist.

### Implementation for User Story 5

- [x] T046 [US5] Add listUrls (query urls collection orderBy createdAt desc, map Firestore docs to ShortUrl[]) and deleteUrl (deleteDoc by shortCode with confirmation) to src/services/url-service.ts
- [x] T047 [US5] Extend useShortUrl hook with list fetching on mount, delete with confirmation flow, and list refresh after create/delete in src/hooks/useShortUrl.ts
- [x] T048 [P] [US5] Create UrlCard component displaying short URL (linked), truncated original URL, formatted creation date, click count badge, and delete button with confirmation dialog in src/components/url/UrlCard/index.tsx
- [x] T049 [P] [US5] Create UrlList component rendering UrlCard items in a vertical list with EmptyState fallback ("No links yet. Create your first short URL above!") in src/components/url/UrlList/index.tsx
- [x] T050 [US5] Integrate UrlList into HomePage below UrlForm, passing url list and delete handler, auto-refresh list after new URL creation in src/pages/HomePage.tsx

**Checkpoint**: User Story 5 fully functional — users can view and manage all their links from the home page.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories — accessibility, performance, and final quality

- [x] T051 [P] Ensure responsive layouts across all pages and components: verify mobile (default), tablet (md:), desktop (lg:) breakpoints, single-column mobile layouts, full-width charts in ResponsiveContainer, touch targets ≥ 44px
- [x] T052 [P] Add ARIA labels, roles, and accessible alternatives for all Recharts chart components (aria-label on SVG, screen-reader-only data tables as fallback) per FR-015
- [x] T053 [P] Add comprehensive error handling: retry buttons on Firestore failures (FR-021), loading indicators during all async operations (FR-022), graceful Firebase offline handling
- [x] T054 [P] Create public/favicon.svg and verify index.html meta tags, Open Graph tags, and document title
- [x] T055 Run Lighthouse audit on all pages and optimize for scores ≥ 90 (Performance, Accessibility, Best Practices) per SC-003
- [x] T056 Run quickstart.md validation: verify all setup steps, dev commands, quality check commands, and build/deploy commands work correctly

---

## Phase 9: Google Analytics 4 (GA4) Integration (FR-023)

**Purpose**: Add Firebase Analytics / GA4 to track page views and key user actions across the SPA.

**Independent Test**: Open browser DevTools → Network tab, filter by `collect` or `google-analytics`. Verify GA events fire on: page navigation, URL creation, link copy, link deletion, dashboard load.

- [x] T057 [P] Initialize Firebase Analytics in src/lib/firebase.ts (getAnalytics with VITE_GA_MEASUREMENT_ID), export analytics instance. Add VITE_GA_MEASUREMENT_ID to .env.example
- [x] T058 [P] Create src/lib/ga.ts with GA4 event tracking helpers: trackPageView(pagePath, pageTitle), trackEvent(eventName, params) wrapping Firebase Analytics logEvent. Include standard events: url_created, url_copied, url_deleted, dashboard_viewed, link_detail_viewed
- [x] T059 Add automatic page view tracking in src/App.tsx using React Router useLocation + useEffect to call trackPageView on route changes
- [x] T060 [P] Add trackEvent calls to useShortUrl hook: 'url_created' on successful create (with shortCode), 'url_copied' on clipboard copy, 'url_deleted' on successful delete
- [x] T061 [P] Add trackEvent calls to useDashboard hook: 'dashboard_viewed' on mount, 'dashboard_time_view_changed' on daily/weekly toggle
- [x] T062 [P] Add trackEvent calls to useAnalytics hook: 'link_detail_viewed' on mount (with shortCode)

**Checkpoint**: GA4 integration complete — all page views and key user actions are tracked and visible in Google Analytics dashboard.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–7)**: All depend on Foundational phase completion
  - US1 (Phase 3): No dependencies on other stories — **start here for MVP**
  - US2 (Phase 4): No dependencies on other stories (independent Cloud Function)
  - US3 (Phase 5): Benefits from US2 click data but can be built with mock/empty data
  - US4 (Phase 6): Benefits from US3 (navigation from dashboard) but accessible directly via URL
  - US5 (Phase 7): Shares url-service.ts with US1 but adds new functions (no conflicts)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (BLOCKS ALL)
    ↓
    ├── Phase 3: US1 - Create Short URL (P1) 🎯 MVP
    ├── Phase 4: US2 - Redirect + Click Tracking (P1) [independent]
    ├── Phase 5: US3 - Analytics Dashboard (P1) [needs click data from US2 for full demo]
    ├── Phase 6: US4 - Per-Link Detail (P2) [navigates from US3, but direct URL access works]
    └── Phase 7: US5 - Manage Links (P2) [extends US1 url-service.ts]
        ↓
    Phase 8: Polish
```

### Within Each User Story

- Services before hooks (hooks depend on service functions)
- Hooks before page components (pages consume hooks)
- UI components (marked [P]) can be built in parallel with services/hooks
- Page component integrates everything — always last in the story

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002–T005)
- All Foundational type definitions (T010–T013) in parallel
- All common UI components (T014–T020) in parallel
- All layout components (T021–T023) can overlap with common components
- Dashboard components (T036, T037, T038) in parallel
- Analytics components (T042, T043, T044) in parallel
- UrlCard and UrlList (T048, T049) in parallel
- US1 and US2 can be worked on in parallel (completely different codebases: SPA vs Cloud Function)
- US3, US4, US5 can be started in parallel after Foundational phase

---

## Parallel Example: User Story 3 (Dashboard)

```bash
# Step 1: Service + components in parallel
Task T034: "Implement getDashboardSummary in src/services/analytics-service.ts"
Task T036: "[P] Create StatsOverview component in src/components/dashboard/StatsOverview/index.tsx"
Task T037: "[P] Create TrendChart component in src/components/dashboard/TrendChart/index.tsx"
Task T038: "[P] Create TopLinksTable component in src/components/dashboard/TopLinksTable/index.tsx"

# Step 2: Hook (depends on service T034)
Task T035: "Create useDashboard hook in src/hooks/useDashboard.ts"

# Step 3: Page (depends on hook T035 + components T036-T038)
Task T039: "Create DashboardPage in src/pages/DashboardPage.tsx"
```

---

## Parallel Example: User Story 1 + User Story 2

```bash
# These two stories are completely independent and can run simultaneously:

# Developer A: US1 (React SPA)
Task T028: "Implement url-service.ts in src/services/url-service.ts"
Task T029: "Create useShortUrl hook in src/hooks/useShortUrl.ts"
Task T030: "[P] Create UrlForm component in src/components/url/UrlForm/index.tsx"
Task T031: "Create HomePage in src/pages/HomePage.tsx"

# Developer B: US2 (Cloud Function)
Task T032: "Initialize Cloud Functions project in functions/"
Task T033: "Implement redirect function in functions/src/index.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 — Create Short URL
4. **STOP and VALIDATE**: User can create and copy short URLs
5. Deploy to Firebase Hosting if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. **Add US1** → Create short URLs → Deploy (MVP!)
3. **Add US2** → Short URLs redirect and track clicks → Deploy
4. **Add US3** → Dashboard shows analytics → Deploy (core product complete)
5. **Add US4** → Per-link detail view → Deploy
6. **Add US5** → Link management list → Deploy
7. **Polish** → Accessibility, performance, Lighthouse ≥ 90 → Final deploy

### Suggested MVP Scope

**US1 (Create Short URL)** is the minimum standalone deliverable. However, the true product value requires **US1 + US2 + US3** (create → track → analyze). Recommend completing all P1 stories (Phases 3–5) before first meaningful demo.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Tests not included (not explicitly requested) — add Vitest + RTL test tasks per story if TDD desired
- Cloud Function (US2) uses ua-parser-js **v1.x (MIT)** — do NOT install v2.x (AGPL license)
- All Recharts charts must use `<ResponsiveContainer>` for responsive sizing
- Tailwind deviation from constitution (CSS Modules) is documented and justified in plan.md
