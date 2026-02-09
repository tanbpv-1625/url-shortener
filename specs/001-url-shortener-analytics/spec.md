# Feature Specification: URL Shortener with Click Analytics

**Feature Branch**: `001-url-shortener-analytics`  
**Created**: 2026-02-09  
**Status**: Draft  
**Input**: User description: "Build a URL shortening service with click analytics. Users create Short URLs, system tracks clicks, sources, devices. Dashboard with daily/weekly stats and top links. Two pages: Shortener page and Analytics dashboard. React TypeScript SPA."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create a Short URL (Priority: P1)

A user visits the **Shortener Page** (`/`), pastes a long URL into the input field, and clicks "Shorten". The system generates a short link and displays it on screen. The user can copy the short link to clipboard with one click or share it directly.

**Why this priority**: This is the core value proposition — without URL shortening, the entire service has no purpose. It is the minimum viable feature that delivers immediate standalone value.

**Independent Test**: Can be fully tested by entering a valid URL, clicking "Shorten", and verifying the short link is generated and copyable. Delivers value even without analytics.

**Acceptance Scenarios**:

1. **Given** the user is on the Shortener Page, **When** they paste a valid URL and click "Shorten", **Then** a short URL is generated and displayed with a "Copy" button.
2. **Given** the user is on the Shortener Page, **When** they submit an invalid URL (e.g., missing protocol, blank input), **Then** a clear inline validation error message is displayed.
3. **Given** a short URL has been generated, **When** the user clicks the "Copy" button, **Then** the short URL is copied to clipboard and a success feedback (toast/indicator) is shown.
4. **Given** the user is on mobile (< 768px), **When** they interact with the shorten form, **Then** the input and button are full-width, touch-friendly (≥ 44px height), and usable with one hand.

---

### User Story 2 - Short URL Redirect with Click Tracking (Priority: P1)

When anyone accesses a short URL, the system redirects them to the original URL and records the click event with metadata: timestamp, referrer source, and device type.

**Why this priority**: Core infrastructure — redirect is the fundamental function of a URL shortener, and tracking is what makes it an analytics tool. Without this, neither the shortener nor the dashboard works.

**Independent Test**: Can be tested by visiting a short URL in a browser and verifying: (a) redirect to original URL occurs, (b) a click event is recorded with correct metadata.

**Acceptance Scenarios**:

1. **Given** a valid short URL exists, **When** anyone visits the short URL, **Then** they are redirected to the original URL.
2. **Given** a valid short URL is visited, **When** the redirect occurs, **Then** a click event is recorded with timestamp, referrer (or "direct"), and device type (mobile/tablet/desktop).
3. **Given** an invalid or non-existent short URL is visited, **When** redirect is attempted, **Then** the user sees a "Link not found" error page.

---

### User Story 3 - View Analytics Dashboard (Priority: P1)

A user navigates to the **Analytics Dashboard Page** (`/dashboard`) to see an overview of all their shortened links' performance. The dashboard shows summary stats, a trend chart (daily/weekly toggle), and a top links table ranked by click count.

**Why this priority**: Analytics is the key differentiator. Without it, users have no reason to use this over any other URL shortener. Equally critical as the shortening feature for the product value proposition.

**Independent Test**: Can be tested by navigating to the dashboard and verifying that summary cards, trend chart, and top links table render correctly with data (or appropriate empty states when no data exists).

**Acceptance Scenarios**:

1. **Given** the user has created short URLs with clicks, **When** they navigate to the Dashboard Page, **Then** they see summary cards (total links, total clicks, clicks today) and a clicks trend chart.
2. **Given** the user is on the Dashboard Page, **When** they toggle between "Daily" and "Weekly" views, **Then** the trend chart updates to show data grouped by the selected time period.
3. **Given** the user is on the Dashboard Page, **When** they view the "Top Links" table, **Then** it displays links ranked by total click count with short URL, original URL (truncated), and click count.
4. **Given** the user is on mobile (< 768px), **When** they view the Dashboard Page, **Then** the layout switches to single-column, charts scale to full width, and the top links table is horizontally scrollable.

---

### User Story 4 - View Per-Link Analytics Detail (Priority: P2)

From the dashboard's top links table, a user clicks on a specific short URL to see its detailed analytics: click trend over time, referrer source breakdown, and device type distribution.

**Why this priority**: Provides deeper per-link insight, building on the dashboard overview. Important for power users but not critical for MVP since the dashboard already provides aggregate data.

**Independent Test**: Can be tested by clicking a link row on the dashboard and verifying the detail view loads with per-link chart, referrer list, and device breakdown.

**Acceptance Scenarios**:

1. **Given** the user is on the Dashboard Page, **When** they click on a specific link row, **Then** they navigate to a link detail view showing that link's click trend chart, referrer sources, and device type breakdown.
2. **Given** the user is viewing a link's detail analytics, **When** the link has clicks from multiple referrers, **Then** a referrer breakdown is displayed (direct, social, search, other) with counts or percentages.
3. **Given** the user is viewing a link's detail analytics, **When** the link has clicks from multiple device types, **Then** a device breakdown is displayed (mobile, tablet, desktop) with counts or percentages.
4. **Given** the user is on the link detail view on mobile, **Then** all charts and data are rendered in single-column layout and fully readable.

---

### User Story 5 - Manage Shortened Links (Priority: P2)

A user can see a list of all their created short URLs on the Shortener Page (below the form), including creation date and total clicks. They can delete a link they no longer need.

**Why this priority**: Link management supports the core workflow but is secondary to creating and analyzing links. Users can function without it initially.

**Independent Test**: Can be tested by creating multiple short URLs, verifying they appear in the list, and confirming deletion removes a link.

**Acceptance Scenarios**:

1. **Given** the user has created multiple short URLs, **When** they view the Shortener Page, **Then** a list of their links is displayed below the form with: short URL, original URL (truncated), creation date, and total clicks.
2. **Given** the user sees the link list, **When** they click delete on a link and confirm, **Then** the link is removed from the list and a success message is shown.
3. **Given** the user has no created links, **When** they view the Shortener Page, **Then** an empty state message is shown (e.g., "No links yet. Create your first short URL above!").

---

### Edge Cases

- **Duplicate URL submission**: When the user submits a URL that has already been shortened, the system returns the existing short URL rather than creating a duplicate.
- **API unreachable**: When the backend API is unreachable or returns an error, the user sees a clear error message (e.g., "Service temporarily unavailable") with a retry option.
- **Empty dashboard**: When the dashboard has no data (new user, no clicks), empty states are shown with a prompt to create and share links.
- **Very long URL**: URL length is validated with a maximum of 2,048 characters; a clear error is displayed for exceeding the limit.
- **Rapid clicks**: Multiple rapid clicks on the same short URL are each tracked individually; no deduplication of click events.
- **Missing protocol**: When a URL is submitted without a protocol prefix (e.g., `example.com`), `https://` is auto-prepended and the corrected URL is shown to the user.
- **Clipboard API unavailable**: When the browser does not support the Clipboard API (older browsers, non-HTTPS), fall back to a selectable text field with manual copy instructions.

## Requirements _(mandatory)_

### Functional Requirements

**Page 1 — Shortener Page (`/`)**

- **FR-001**: System MUST provide a URL input field with a "Shorten" button on the home page.
- **FR-002**: System MUST validate submitted URLs (valid format, non-empty, max 2,048 characters) and display inline error messages for invalid input.
- **FR-003**: System MUST auto-prepend `https://` when a URL is submitted without a protocol prefix.
- **FR-004**: System MUST call the backend REST API to create a short URL and display the generated result.
- **FR-005**: System MUST provide a "Copy to clipboard" button for the generated short URL with visual success feedback.
- **FR-006**: System MUST display a list of user-created short URLs below the form showing: short URL, original URL (truncated), creation date, and total clicks.
- **FR-007**: System MUST allow users to delete a short URL from the list with a confirmation prompt.
- **FR-008**: System MUST show an appropriate empty state when no links have been created.

**Page 2 — Analytics Dashboard Page (`/dashboard`)**

- **FR-009**: Dashboard MUST display summary cards: total links created, total clicks, and clicks today.
- **FR-010**: Dashboard MUST display a click trend chart with toggleable daily/weekly grouping.
- **FR-011**: Dashboard MUST display a "Top Links" table ranked by total click count with columns: short URL, original URL (truncated), total clicks.
- **FR-012**: Dashboard MUST allow users to click a link row to navigate to a per-link detail view.
- **FR-013**: Per-link detail view MUST display: click trend chart, referrer source breakdown (direct, social, search, other), and device type breakdown (mobile, tablet, desktop).
- **FR-014**: All charts MUST be responsive and scale with container width across all breakpoints.
- **FR-015**: Chart components MUST provide accessible alternative representations (data table or screen reader text).

**Navigation & Layout**

- **FR-016**: System MUST provide navigation between the Shortener Page and the Analytics Dashboard Page.
- **FR-017**: Layout MUST be responsive with 3 breakpoints: mobile (< 768px), tablet (768px–1024px), desktop (> 1024px).
- **FR-018**: All interactive elements MUST have a minimum touch target size of 44px.
- **FR-019**: System MUST display a 404 (Not Found) page for invalid routes.

**API & Data**

- **FR-020**: System MUST communicate with the backend via REST API using the base URL from environment configuration.
- **FR-021**: System MUST handle API errors gracefully with user-friendly error messages and retry options.
- **FR-022**: System MUST show loading indicators during all API calls.

### Key Entities

- **ShortUrl**: Represents a shortened URL. Key attributes: short code, original URL, creation date, aggregate click count. Created by the user on the Shortener Page; displayed in the link list and dashboard.
- **ClickEvent**: Represents a single click on a short URL. Key attributes: timestamp, referrer source (direct/social/search/other), device type (mobile/tablet/desktop). Recorded on redirect; aggregated for analytics display.
- **AnalyticsSummary**: Aggregated analytics data for the dashboard. Key attributes: total links count, total clicks count, clicks grouped by time period (day/week), top links ranking, per-link breakdowns by referrer and device.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can create a short URL and copy it to clipboard in under 10 seconds.
- **SC-002**: Dashboard page loads and renders all charts and tables within 2 seconds on a standard connection.
- **SC-003**: All pages achieve a Lighthouse score ≥ 90 for Performance, Accessibility, and Best Practices.
- **SC-004**: Dashboard is fully usable on mobile (< 768px) — all data is readable without horizontal page scrolling.
- **SC-005**: 100% of interactive elements meet the 44px minimum touch target on mobile viewports.
- **SC-006**: All form interactions provide immediate feedback (validation errors within 200ms, loading states on submit).
- **SC-007**: The application functions correctly on the latest 2 versions of Chrome, Firefox, Safari, and Edge.
- **SC-008**: Chart components provide accessible alternatives verifiable by screen reader testing.

### Assumptions

- A backend REST API is available and documented separately (not part of this frontend spec).
- Authentication/authorization is out of scope — the service is open-use or auth is handled by a separate layer.
- URL redirect logic (short URL → original URL) is handled by the backend; the frontend only handles the "Link not found" error page.
- Analytics data retention period is managed by the backend; the frontend displays whatever data the API returns.
- The application does not require offline support or PWA capabilities for the initial release.
