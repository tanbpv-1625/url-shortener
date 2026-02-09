# Technical Research: URL Shortener with Click Analytics

**Feature**: `001-url-shortener-analytics`  
**Date**: 2026-02-09  
**Stack**: React 18 + TypeScript + Tailwind CSS + Firebase (no custom backend)

---

## Table of Contents

1. [Firebase as Full Backend Replacement](#topic-1-firebase-as-full-backend-replacement)
2. [Short Code Generation on Client-Side](#topic-2-short-code-generation-on-client-side)
3. [Click Tracking Without Custom Backend](#topic-3-click-tracking-without-custom-backend)
4. [Tailwind CSS with React TypeScript](#topic-4-tailwind-css-with-react-typescript)
5. [Chart Library for Analytics Dashboard](#topic-5-chart-library-for-analytics-dashboard)

---

## Topic 1: Firebase as Full Backend Replacement

### 1.1 Can Firestore Be Used Directly from Client-Side for CRUD?

**Decision**: Yes — use the Firebase Web SDK (v9+ modular) to perform all Firestore CRUD operations directly from the browser.

**Rationale**:

- Firebase JS SDK v9+ (`firebase/firestore`) provides `addDoc`, `setDoc`, `getDoc`, `getDocs`, `updateDoc`, `deleteDoc`, `onSnapshot` — a complete CRUD surface callable from any browser client.
- No intermediate REST API or backend server is needed. The client authenticates directly with Firebase and Firestore Security Rules enforce access control.
- The modular (tree-shakeable) SDK keeps bundle size manageable — only the Firestore functions actually imported are bundled.
- For this project's scale (single-user, no auth required per spec assumptions), client-side Firestore is ideal. High-traffic production shorteners would need a serverless layer, but the spec's scope does not require it.

**Alternatives Considered**:
| Alternative | Why Rejected |
|---|---|
| Firebase REST API (direct HTTP) | Unnecessary complexity; SDK handles auth, caching, retries. |
| Supabase / PlanetScale | Adds another vendor; Firebase covers hosting + DB + functions in one platform. |
| Custom Express backend | Spec explicitly requests no separate backend server. |

### 1.2 Firebase Services Required

**Decision**: Use three Firebase services — **Firestore**, **Firebase Hosting**, and **Cloud Functions (2nd gen)**.

| Service                                    | Purpose                                                                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Cloud Firestore**                        | Primary database for `urls` collection and `clicks` subcollection. Real-time queries for dashboard analytics.                                          |
| **Firebase Hosting**                       | Static SPA hosting (Vite build output). Custom domain support. Rewrite rules to route short URLs to Cloud Functions.                                   |
| **Cloud Functions for Firebase (2nd gen)** | Single HTTP function to handle the redirect flow (`/{shortCode}` → look up Firestore → 302 redirect). Also logs click events server-side for accuracy. |

**Rationale**:

- Firestore provides real-time listeners (`onSnapshot`) which enable the dashboard to update live without polling.
- Firebase Hosting + Cloud Functions integrate seamlessly via `firebase.json` rewrite rules — no CORS, no separate domain.
- Cloud Functions 2nd gen runs on Cloud Run under the hood, offering better cold start times and concurrency control.
- All three services share a single Firebase project and deploy together via `firebase deploy`.

**Alternatives Considered**:
| Alternative | Why Rejected |
|---|---|
| Firestore + Hosting only (no Functions) | Redirect requires server-side 302 response; a client-side redirect page adds latency and leaks the original URL to the browser before redirect. |
| Firebase Realtime Database | Firestore has better querying (compound queries, collection groups), which analytics aggregation needs. |
| Cloud Run (standalone container) | Over-engineered for a single redirect function; Cloud Functions is simpler and has free tier. |

### 1.3 Redirect Flow: Short URL → Original URL

**Decision**: Use **Firebase Hosting rewrites** to route `/:shortCode` requests to a **Cloud Function** that performs lookup + 302 redirect + click logging.

**Architecture**:

```
Browser hits: https://myapp.web.app/abc123
        │
        ▼
Firebase Hosting (firebase.json rewrite)
        │  "source": "/**" → function: "redirect"
        │  (after SPA static files are checked)
        ▼
Cloud Function: redirect(req, res)
        │
        ├─ 1. Extract shortCode from req.path
        ├─ 2. Firestore lookup: urls/{shortCode}
        ├─ 3. If found → log click event to clicks subcollection
        ├─ 4. res.redirect(302, originalUrl)
        └─ 5. If not found → res.redirect(302, '/not-found')
```

**firebase.json configuration**:

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "/dashboard/**",
        "destination": "/index.html"
      },
      {
        "source": "/not-found",
        "destination": "/index.html"
      },
      {
        "source": "/**",
        "function": {
          "functionId": "redirect",
          "region": "us-central1"
        }
      }
    ]
  }
}
```

**Key behavior** (per Firebase Hosting priority order):

1. Static files in `dist/` are served first (exact match).
2. Explicit SPA routes (`/dashboard/**`, `/not-found`) serve `index.html`.
3. Everything else (`/**`) hits the `redirect` Cloud Function — this catches `/{shortCode}` patterns.

**Rationale**:

- Server-side 302 redirect is the **standard approach** for URL shorteners (used by bit.ly, TinyURL). It's fast (single HTTP round-trip), SEO-friendly, and doesn't expose the original URL in the page source.
- Firebase Hosting's priority order ensures static assets and known SPA routes are never intercepted by the catch-all rewrite.
- Click logging happens server-side in the same function, guaranteeing every redirect is tracked (client-side logging could be blocked by ad-blockers or skipped if the page never fully loads).

**Alternatives Considered**:
| Alternative | Why Rejected |
|---|---|
| Client-side redirect page (load SPA → read Firestore → `window.location`) | Adds 1–3s latency (SPA bundle download + Firestore read). User sees a flash of the redirect page. Ad-blockers may block Firestore calls. |
| Cloudflare Workers | External to Firebase ecosystem; adds deployment complexity. |
| Firebase Hosting `redirects` (static) | Only supports static destination URLs, not dynamic database lookups. |

### 1.4 Firestore Security Rules

**Decision**: Use layered security rules — public read on `urls` (for redirect function), controlled write via validation rules, and append-only `clicks` subcollection.

**Recommended rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // URLs collection
    match /urls/{shortCode} {
      // Anyone can read (needed for redirect lookup, dashboard display)
      allow read: if true;

      // Create: validate required fields and data types
      allow create: if
        request.resource.data.keys().hasAll(['originalUrl', 'shortCode', 'createdAt', 'clickCount']) &&
        request.resource.data.originalUrl is string &&
        request.resource.data.originalUrl.size() > 0 &&
        request.resource.data.originalUrl.size() <= 2048 &&
        request.resource.data.shortCode is string &&
        request.resource.data.shortCode.size() >= 6 &&
        request.resource.data.shortCode.size() <= 8 &&
        request.resource.data.clickCount == 0 &&
        request.resource.data.createdAt == request.time;

      // Update: only allow clickCount increment (from Cloud Function via Admin SDK — bypasses rules)
      // Client-side updates are denied
      allow update: if false;

      // Delete: allow from client (for link management feature)
      allow delete: if true;

      // Click events subcollection
      match /clicks/{clickId} {
        // Anyone can read (for analytics display)
        allow read: if true;

        // Only Cloud Function (Admin SDK) writes clicks — deny client writes
        allow write: if false;
      }
    }
  }
}
```

**Rationale**:

- **Public read** is required because (a) the redirect Cloud Function uses Admin SDK (bypasses rules anyway), and (b) the SPA dashboard reads analytics data directly from the client.
- **Create validation** enforces data integrity at the database level — prevents malformed documents even if client code has bugs.
- **Click writes are denied for clients** — only the Cloud Function (using Firebase Admin SDK, which bypasses security rules) can write click events. This prevents manipulation of analytics data.
- **Delete is open** because the spec has no authentication; if auth is added later, restrict to `request.auth != null`.

**Important note**: The Cloud Function uses the **Firebase Admin SDK**, which **bypasses all Security Rules**. Rules only apply to client-side SDK calls. This is why click logging works via the function even though the rules deny client writes to `clicks`.

**Alternatives Considered**:
| Alternative | Why Rejected |
|---|---|
| All writes via Cloud Functions only | Over-restrictive; URL creation from client is fine with validation rules. |
| Rate limiting in rules | Firestore rules don't support rate limiting natively; use Cloud Functions or Firebase App Check for abuse prevention. |
| Firebase App Check | Good addition for production but adds complexity; out of scope for initial build. Can be layered on later. |

---

## Topic 2: Short Code Generation on Client-Side

### 2.1 Generation Approach

**Decision**: Use **nanoid** with a custom URL-safe alphabet, generating **7-character** codes client-side.

**Implementation**:

```typescript
import { customAlphabet } from 'nanoid'

// URL-safe alphabet: no ambiguous chars (0/O, 1/l/I excluded)
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'
const CODE_LENGTH = 7

const generateShortCode = customAlphabet(ALPHABET, CODE_LENGTH)

// Usage
const shortCode = generateShortCode() // e.g., "Kx7bR3m"
```

**Rationale**:

- **nanoid** is the best fit:
  - Tiny: **118 bytes** (brotli compressed), zero dependencies.
  - Cryptographically secure: uses `crypto.getRandomValues()`.
  - URL-safe by default. Custom alphabet support for human-friendly codes.
  - Built-in TypeScript types.
  - 96M+ weekly downloads — the most widely used ID generator in the JS ecosystem.
  - MIT license.
- **7 characters** with a 55-char alphabet provides $55^7 ≈ 1.5 \times 10^{12}$ unique combinations (1.5 trillion). At 1,000 URLs/day, collision probability remains negligible for decades.

**Alternatives Considered**:
| Alternative | Why Rejected |
|---|---|
| Firestore auto-ID (`addDoc` auto-generated ID) | 20 characters long, not URL-friendly, cannot customize alphabet or length. |
| UUID v4 (via `crypto.randomUUID()`) | 36 characters (with hyphens) — far too long for short URLs. Even truncated, no advantage over nanoid. |
| Counter-based (Firestore transaction increment) | Sequential IDs are predictable/enumerable; requires transactional reads that add latency; not idiomatic for Firestore. |
| hashids / sqids | Requires a numeric input (counter); adds unnecessary complexity for this use case. |

### 2.2 Collision Handling Strategy

**Decision**: Use a **check-then-create** pattern with Firestore `setDoc` using the short code as the document ID.

**Implementation**:

```typescript
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

async function createShortUrl(db: Firestore, originalUrl: string): Promise<string> {
  const MAX_RETRIES = 3

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const shortCode = generateShortCode()
    const docRef = doc(db, 'urls', shortCode)
    const existing = await getDoc(docRef)

    if (!existing.exists()) {
      await setDoc(docRef, {
        shortCode,
        originalUrl,
        createdAt: serverTimestamp(),
        clickCount: 0,
      })
      return shortCode
    }
    // Collision detected — retry with a new code
  }

  throw new Error('Failed to generate unique short code after retries')
}
```

**Rationale**:

- Using the short code as the **Firestore document ID** makes lookups O(1) — `doc(db, 'urls', shortCode)` is a direct document fetch, not a query.
- `getDoc` before `setDoc` prevents overwriting an existing URL. For stronger guarantees, a Firestore transaction can be used, but at this scale the check-then-set pattern is sufficient.
- 3 retries is generous — with 1.5 trillion possible codes and a small dataset, the probability of even 1 collision is negligible ($< 10^{-6}$ at under 1 million documents).

**Alternatives Considered**:
| Alternative | Why Rejected |
|---|---|
| Firestore transaction (`runTransaction`) | Stronger consistency guarantee but adds latency; unnecessary at small scale. Worth adding if traffic grows. |
| Bloom filter client-side | Over-engineered; Firestore lookup is fast enough (< 100ms). |
| Just `setDoc` without check (rely on uniqueness) | Risk of silently overwriting an existing URL. |

### 2.3 Recommended Short Code Length

**Decision**: **7 characters** as the default.

| Length | Alphabet Size | Combinations      | Collision at 1M URLs (birthday problem) |
| ------ | ------------- | ----------------- | --------------------------------------- |
| 6      | 55            | ~27.7 billion     | ~0.002% (very low)                      |
| **7**  | **55**        | **~1.5 trillion** | **~0.00003%** (negligible)              |
| 8      | 55            | ~83.7 trillion    | ~0.0000006% (near zero)                 |

**Rationale**:

- 7 characters balances brevity (important for "short" URLs) with collision resistance.
- Shorter than bit.ly (7 chars) and comparable to TinyURL (6–8 chars).
- The 55-char alphabet (excluding ambiguous characters) is human-friendly for sharing via text/voice.
- If future scale demands it, length can be bumped to 8 with no code changes (just update `CODE_LENGTH`).

---

## Topic 3: Click Tracking Without Custom Backend

### 3.1 Click Event Recording Architecture

**Decision**: Record click events **server-side in the Cloud Function** during the redirect flow — not from a client-side redirect page.

**Implementation** (inside the redirect Cloud Function):

```typescript
import { onRequest } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import * as UAParser from 'ua-parser-js'

export const redirect = onRequest(async (req, res) => {
  const shortCode = req.path.replace('/', '')
  if (!shortCode) {
    res.redirect(302, '/')
    return
  }

  const db = getFirestore()
  const urlDoc = await db.doc(`urls/${shortCode}`).get()

  if (!urlDoc.exists) {
    res.redirect(302, '/not-found')
    return
  }

  const { originalUrl } = urlDoc.data()!
  const userAgent = req.headers['user-agent'] || ''
  const referrer = req.headers['referer'] || 'direct'

  // Parse device type from user-agent
  const parser = new UAParser.UAParser(userAgent)
  const deviceType = parser.getDevice().type || 'desktop' // mobile | tablet | desktop

  // Log click event
  await Promise.all([
    db.collection(`urls/${shortCode}/clicks`).add({
      timestamp: FieldValue.serverTimestamp(),
      referrer: categorizeReferrer(referrer),
      referrerRaw: referrer,
      deviceType: normalizeDevice(deviceType),
      userAgent,
    }),
    db.doc(`urls/${shortCode}`).update({
      clickCount: FieldValue.increment(1),
    }),
  ])

  res.redirect(302, originalUrl)
})

function categorizeReferrer(referrer: string): string {
  if (!referrer || referrer === 'direct') return 'direct'
  const url = referrer.toLowerCase()
  if (/google|bing|yahoo|duckduckgo|baidu/.test(url)) return 'search'
  if (/facebook|twitter|x\.com|linkedin|instagram|reddit|tiktok/.test(url)) return 'social'
  return 'other'
}

function normalizeDevice(type: string): string {
  if (type === 'mobile') return 'mobile'
  if (type === 'tablet') return 'tablet'
  return 'desktop' // default for unrecognized or empty
}
```

**Rationale**:

- **Server-side logging is more reliable**: ad-blockers don't interfere, the user never needs to load a full page, and the click is guaranteed to be recorded before the redirect happens.
- Click data + redirect happen in a single function invocation (low latency).
- `FieldValue.increment(1)` atomically updates the aggregate click count without a transaction.
- The `clicks` subcollection under each URL keeps click events co-located with their parent URL for efficient querying.

### 3.2 Client-Side Redirect Page Alternative

**Decision**: **Not recommended** as the primary approach, but documented as a fallback option.

A client-side redirect page would work as follows:

```
User visits /r/abc123 → SPA loads → React component reads shortCode →
Firestore lookup → log click → window.location.href = originalUrl
```

**Problems**:

- **Latency**: User must download the SPA bundle (~200–500KB), then make a Firestore read + write before redirect. Adds 1–3 seconds vs. ~200ms for a Cloud Function redirect.
- **Blockable**: Ad-blockers and privacy extensions may block Firebase SDK requests.
- **Unreliable tracking**: If the user closes the tab before the Firestore write completes, the click is lost.
- **SEO**: Search engines see an HTML page, not a 302 redirect — link equity doesn't pass through properly.

**When it might be acceptable**: If Cloud Functions cannot be used (e.g., staying on Firebase free Spark plan without Blaze upgrade for Functions). In that case, use a minimal redirect HTML page served by Hosting.

### 3.3 Device Detection

**Decision**: Use **ua-parser-js v1.x** (MIT license) in the Cloud Function for user-agent parsing.

| Library          | Version   | License | Size (server) | TypeScript     | Notes                                    |
| ---------------- | --------- | ------- | ------------- | -------------- | ---------------------------------------- |
| **ua-parser-js** | **1.0.x** | **MIT** | ~17KB         | Built-in types | Use v1.x for MIT; v2.x is AGPL           |
| bowser           | 2.x       | MIT     | ~15KB         | Built-in types | Less maintained, fewer device categories |
| platform.js      | 1.x       | MIT     | ~10KB         | @types needed  | Minimal device detection                 |

**Rationale**:

- ua-parser-js is the most comprehensive UA parsing library — detects browser, OS, device type (mobile/tablet/desktop), and engine.
- **Critical**: Use **v1.0.x** (MIT license), not v2.x (AGPL-3.0). AGPL would require open-sourcing the Cloud Function code.
  ```
  npm install ua-parser-js@^1.0.0
  ```
- Running in Cloud Function (server-side) means bundle size is not a concern for the client.
- Supports detecting: `mobile`, `tablet`, `smarttv`, `console`, `wearable`, or empty (→ `desktop`).

**Alternatives Considered**:
| Alternative | Why Rejected |
|---|---|
| ua-parser-js v2.x | AGPL-3.0 license — copyleft obligation. |
| Client-side `navigator.userAgentData` (UA Client Hints API) | Only available in Chromium browsers; doesn't work in the Cloud Function context. |
| Manual regex parsing | Fragile, unmaintainable, and constantly outdated as new devices/browsers release. |

### 3.4 Referrer Detection

**Decision**: Use the HTTP `Referer` header (available in `req.headers['referer']`) in the Cloud Function and categorize into `direct`, `search`, `social`, or `other`.

**Rationale**:

- The HTTP `Referer` header is automatically sent by browsers when following a link. It's available in the Cloud Function request object (`req.headers['referer']`).
- When no referrer is present (direct navigation, bookmarks, HTTPS → HTTP transitions, `rel="noreferrer"`), categorize as `"direct"`.
- Simple regex-based categorization (shown in 3.1) is sufficient for the spec's requirements (direct/social/search/other).
- No additional library needed — plain string matching.

**`document.referrer` comparison** (client-side alternative):

- `document.referrer` provides the same information but requires loading a page first. Since we're handling redirect in a Cloud Function, the HTTP header is the correct source.
- Both are subject to the same limitations: HTTPS-to-HTTP referrer stripping, user privacy settings, `rel="noreferrer"` links.

**Edge cases**:
| Scenario | Referrer Value | Category |
|---|---|---|
| Typed in address bar | Empty / absent | `direct` |
| Clicked link on Google | `https://www.google.com/...` | `search` |
| Shared on Twitter/X | `https://t.co/...` or `https://x.com/...` | `social` |
| Linked from a blog | `https://someblog.com/post` | `other` |
| HTTPS → HTTP (rare) | Empty (browser strips it) | `direct` |

---

## Topic 4: Tailwind CSS with React TypeScript

### 4.1 Tailwind CSS v3+ with Vite Setup

**Decision**: Use **Tailwind CSS v3.4+** with **Vite** and **PostCSS**.

**Setup steps**:

```bash
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p  # generates tailwind.config.js + postcss.config.js
```

**tailwind.config.js**:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**postcss.config.js** (auto-generated):

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**src/index.css**:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Rationale**:

- Vite has first-class PostCSS support — no extra bundler config needed.
- Tailwind's JIT (Just-In-Time) engine is default since v3, generating only the classes used in source files → tiny CSS bundles.
- `autoprefixer` ensures cross-browser compatibility (Safari, Firefox vendor prefixes).
- The `content` array scans `.tsx` files for class names — critical for tree-shaking unused styles.

**Note on Tailwind v4**: Tailwind CSS v4 (released Jan 2025) uses a new Vite plugin (`@tailwindcss/vite`) instead of PostCSS and replaces `tailwind.config.js` with CSS-based configuration. While cutting-edge, **v3.4 is the safer choice** for this project due to broader community resources, plugin compatibility, and production-proven stability. Migration to v4 can be done later.

### 4.2 Replacing CSS Modules with Tailwind Utility Classes

**Decision**: Use **Tailwind utility classes** exclusively — no CSS Modules.

**Before (CSS Modules)**:

```tsx
// Button.module.css
.button { padding: 0.5rem 1rem; background-color: #3b82f6; border-radius: 0.375rem; }
.button:hover { background-color: #2563eb; }

// Button.tsx
import styles from './Button.module.css';
<button className={styles.button}>Click</button>
```

**After (Tailwind)**:

```tsx
// Button.tsx — no separate CSS file needed
<button className='px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-md text-white'>Click</button>
```

**Rationale**:

- Eliminates context-switching between `.tsx` and `.module.css` files.
- Co-locates styling with markup — easier to read, modify, and delete.
- Tailwind's JIT purges unused classes; CSS Modules can accumulate dead styles over time.
- Team members only need to learn Tailwind's utility vocabulary, not manage a growing CSS architecture.

**When to extract**:

- If the same combination of classes repeats 3+ times, extract to a component (not a CSS class):

```tsx
// Reusable component instead of CSS class
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
      {children}
    </span>
  )
}
```

- For genuinely complex styles (animations, complex selectors), use Tailwind's `@apply` in a global CSS file sparingly.

### 4.3 Responsive Breakpoints

**Decision**: Map the spec's breakpoints to Tailwind's default breakpoint system.

| Spec Breakpoint         | Tailwind Prefix      | Definition          | Usage                                     |
| ----------------------- | -------------------- | ------------------- | ----------------------------------------- |
| Mobile (< 768px)        | (default, no prefix) | Base styles         | Single-column layout, full-width inputs   |
| Tablet (768px – 1024px) | `md:`                | `min-width: 768px`  | 2-column grid, side-by-side cards         |
| Desktop (> 1024px)      | `lg:`                | `min-width: 1024px` | Full multi-column layout, expanded tables |

**Rationale**:

- Tailwind uses **mobile-first** breakpoints (`min-width`). Write base styles for mobile, then layer on `md:` and `lg:` overrides.
- Tailwind's defaults (`sm`: 640px, `md`: 768px, `lg`: 1024px, `xl`: 1280px) align perfectly with the spec's breakpoints:
  - `md` = 768px (matches spec's tablet breakpoint)
  - `lg` = 1024px (matches spec's desktop breakpoint)
- No custom breakpoint configuration needed.

**Example usage**:

```tsx
{
  /* Mobile: single column | Tablet: 2 columns | Desktop: 3 columns */
}
;<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
  <SummaryCard title='Total Links' value={totalLinks} />
  <SummaryCard title='Total Clicks' value={totalClicks} />
  <SummaryCard title='Clicks Today' value={clicksToday} />
</div>

{
  /* Mobile: stacked | Desktop: side-by-side chart + table */
}
;<div className='flex flex-col lg:flex-row gap-6'>
  <div className='w-full lg:w-2/3'>
    <TrendChart />
  </div>
  <div className='w-full lg:w-1/3'>
    <TopLinksTable />
  </div>
</div>

{
  /* FR-018: 44px minimum touch target */
}
;<button className='min-h-[44px] min-w-[44px] px-4 py-2 ...'>Shorten</button>
```

### 4.4 Component Styling Patterns: className Strings vs clsx/cn

**Decision**: Use **`clsx`** for conditional class merging, combined with a **`cn` utility** (clsx + tailwind-merge) for Tailwind-specific merging.

**Setup**:

```bash
npm install clsx tailwind-merge
```

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

**Usage patterns**:

```tsx
import { cn } from '@/lib/utils'

// Pattern 1: Conditional classes
;<button
  className={cn(
    'px-4 py-2 rounded-md font-medium transition-colors',
    variant === 'primary' && 'bg-blue-500 text-white hover:bg-blue-600',
    variant === 'secondary' && 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    disabled && 'opacity-50 cursor-not-allowed',
  )}
>
  {children}
</button>

// Pattern 2: Merging prop classes with defaults (component API)
interface CardProps {
  className?: string
  children: React.ReactNode
}

function Card({ className, children }: CardProps) {
  return <div className={cn('rounded-lg border bg-white p-6 shadow-sm', className)}>{children}</div>
}

// Consumer can override specific styles without conflicts:
;<Card className='p-4 bg-gray-50' /> // p-4 overrides p-6, bg-gray-50 overrides bg-white
```

**Why `tailwind-merge`**:

- Plain `clsx` concatenates classes but doesn't resolve Tailwind conflicts: `clsx("p-6", "p-4")` → `"p-6 p-4"` (both classes applied, unpredictable result).
- `twMerge` intelligently deduplicates: `twMerge("p-6", "p-4")` → `"p-4"` (last value wins).
- This is critical for component APIs where consumers pass `className` overrides.

**Library details**:

| Library               | Size (gzip) | Purpose                            |
| --------------------- | ----------- | ---------------------------------- |
| `clsx` v2.1.1         | 239 bytes   | Conditional class joining          |
| `tailwind-merge` v2.x | ~3.5KB      | Tailwind-aware class deduplication |

**Alternatives Considered**:
| Alternative | Why Rejected |
|---|---|
| Plain string concatenation | No falsy value filtering; error-prone with conditionals. |
| `classnames` package | Same API as `clsx` but 3x larger; `clsx` is the modern drop-in replacement. |
| `clsx` without `tailwind-merge` | Works for simple components but breaks when consumers pass className overrides. |
| `cva` (class-variance-authority) | Good for complex variant systems (design systems); overkill for this project's component count. Worth adopting if component library grows. |

---

## Topic 5: Chart Library for Analytics Dashboard

### 5.1 Recharts vs Chart.js (react-chartjs-2)

| Criteria              | Recharts                                                          | Chart.js (react-chartjs-2)                                            |
| --------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Version**           | 3.7.0                                                             | 5.3.1 (wrapper) + chart.js 4.4.x                                      |
| **Bundle (gzip)**     | ~132KB (full), tree-shakeable per chart type (~60–67KB per chart) | ~67KB (chart.js core, not tree-shakeable by default) + ~5KB (wrapper) |
| **Rendering**         | SVG                                                               | Canvas                                                                |
| **TypeScript**        | Built-in (first-class)                                            | Built-in (chart.js + wrapper both typed)                              |
| **React Integration** | Native React components — fully declarative, composable           | React wrapper around imperative Chart.js — less idiomatic             |
| **Responsiveness**    | `<ResponsiveContainer>` component                                 | Built-in `responsive: true` option                                    |
| **Customization**     | JSX-based — custom tooltips/legends as React components           | Plugin/callback system — less React-idiomatic                         |
| **Animation**         | CSS + SVG transitions                                             | Canvas-based animations (smoother for large datasets)                 |
| **Weekly Downloads**  | ~12.7M                                                            | ~2.7M (wrapper)                                                       |
| **License**           | MIT                                                               | MIT                                                                   |
| **Dependencies**      | 11 (D3 modules, Redux Toolkit)                                    | 0 (chart.js is standalone)                                            |
| **Learning Curve**    | Low for React devs (JSX composability)                            | Moderate (Chart.js config objects + React wrapper patterns)           |
| **SSR Support**       | SVG renders in SSR                                                | Canvas requires extra setup for SSR                                   |

### 5.2 Recommendation

**Decision**: Use **Recharts**.

**Rationale**:

1. **React-native composability**: Recharts charts are built from React components (`<LineChart>`, `<XAxis>`, `<Tooltip>`, `<Line>`). This matches the project's React + TypeScript paradigm perfectly. Custom tooltips, legends, and labels are just React components — no need to learn a separate plugin/callback API.

2. **Sufficient bundle size with tree-shaking**: While the full bundle is ~132KB gzip, Vite's tree-shaking means only imported chart types are bundled. For this project's needs:
   - `LineChart` (trend chart): ~66KB
   - `BarChart` (click counts): ~67KB
   - `PieChart` (device/referrer breakdown): ~65KB
   - Shared dependencies are deduped — realistic total: **~80–90KB gzip** for all three chart types.

3. **SVG rendering advantages for this project**:
   - SVG elements are DOM nodes → accessible to screen readers (spec requirement SC-008 / FR-015).
   - Easy to add `aria-label`, `role`, and `<desc>` elements for accessibility.
   - SVG charts can be styled with CSS/Tailwind for consistent look-and-feel.
   - Better for printing/exporting (vector graphics).

4. **Built-in responsive container**: `<ResponsiveContainer width="100%" height={300}>` handles resize automatically — critical for the spec's 3-breakpoint responsive layout (FR-014).

5. **Simpler developer experience**: No registration of chart types/scales/plugins. Just import and use:

   ```tsx
   import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

   ;<ResponsiveContainer width='100%' height={300}>
     <LineChart data={dailyClicks}>
       <XAxis dataKey='date' />
       <YAxis />
       <Tooltip />
       <Line type='monotone' dataKey='clicks' stroke='#3b82f6' />
     </LineChart>
   </ResponsiveContainer>
   ```

**Chart types needed and Recharts mapping**:

| Dashboard Requirement             | Recharts Component                                | Spec Reference |
| --------------------------------- | ------------------------------------------------- | -------------- |
| Click trend (daily/weekly toggle) | `<LineChart>` or `<BarChart>`                     | FR-010         |
| Top links by clicks               | `<BarChart>` (horizontal)                         | FR-011         |
| Referrer source breakdown         | `<PieChart>`                                      | FR-013         |
| Device type distribution          | `<PieChart>` (doughnut variant via `innerRadius`) | FR-013         |

**Alternatives Considered**:
| Alternative | Why Rejected |
|---|---|
| **Chart.js (react-chartjs-2)** | Canvas rendering makes accessibility harder (opaque to screen readers). Imperative config objects feel foreign in a declarative React codebase. Requires manual registration of chart types/scales. Smaller bundle but at the cost of DX. |
| **Victory** | Similar SVG-based approach but less maintained, larger bundle (~150KB), smaller community. |
| **Nivo** | Feature-rich but heavyweight (~200KB+). Better for complex data visualization — overkill for line + bar + pie. |
| **Lightweight Chart** (uPlot, frappe-charts) | Minimal (~20KB) but lack React bindings, poor TypeScript support, limited chart types. |
| **ECharts (echarts-for-react)** | Very powerful but massive bundle (~350KB gzip). Designed for enterprise data visualization — overkill. |
| **Visx** (Airbnb) | Low-level D3 + React primitives. Maximum flexibility but requires building chart components from scratch — high effort for standard chart types. |

---

## Summary of Decisions

| Topic                 | Decision                                                             | Key Library / Service                                  |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------ |
| Backend               | Firebase (Firestore + Hosting + Cloud Functions) — no custom backend | `firebase` v9+, `firebase-admin`, `firebase-functions` |
| Short Code Generation | nanoid with custom alphabet, 7 chars                                 | `nanoid` v5.1.6 (118B gzip)                            |
| Collision Handling    | Check-then-create with Firestore document ID = short code            | Firestore `setDoc`                                     |
| Redirect Flow         | Firebase Hosting rewrite → Cloud Function → 302 redirect             | Cloud Functions 2nd gen                                |
| Click Tracking        | Server-side in Cloud Function (Firestore write + atomic increment)   | `firebase-admin/firestore`                             |
| Device Detection      | ua-parser-js v1.x (MIT) in Cloud Function                            | `ua-parser-js@^1.0.0`                                  |
| Referrer Detection    | HTTP `Referer` header + regex categorization                         | No additional library                                  |
| CSS Framework         | Tailwind CSS v3.4 with Vite + PostCSS                                | `tailwindcss`, `autoprefixer`                          |
| Class Merging         | clsx + tailwind-merge (`cn` utility)                                 | `clsx` (239B), `tailwind-merge`                        |
| Responsive Layout     | Tailwind mobile-first: default → `md:` (768px) → `lg:` (1024px)      | Tailwind defaults                                      |
| Chart Library         | Recharts (SVG, declarative, accessible)                              | `recharts` v3.7.0                                      |

### Spec Impact Notes

The original spec (FR-004, FR-020, FR-021, FR-022) references a "backend REST API". With the Firebase-direct architecture:

- **FR-004** / **FR-020**: Replace "backend REST API" with "Firestore client SDK calls" for URL creation and analytics data fetching.
- **FR-021**: "API errors" becomes "Firestore/Firebase errors" — same UX treatment (error messages + retry).
- **FR-022**: Loading states apply during Firestore reads/writes instead of REST API calls.
- **Assumptions**: "A backend REST API is available" is replaced by "Firebase project is configured with Firestore, Hosting, and Cloud Functions."

The redirect handling assumption ("URL redirect logic is handled by the backend") is now handled by the Cloud Function — the SPA still only handles the "Link not found" error page via the `/not-found` route.
