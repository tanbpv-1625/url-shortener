# Firestore Client SDK Contracts

**Feature**: `001-url-shortener-analytics`  
**Date**: 2026-02-09  
**Type**: Firestore Client SDK Operations (no REST API — direct Firestore access)

## Overview

This project uses **Firebase Firestore Client SDK** directly from the React app. There is no REST API layer. The "contracts" below define the Firestore operations (reads/writes) that the frontend performs, serving the same role as API endpoint documentation.

One **Cloud Function** handles the redirect flow (server-side, not called by the React app directly).

---

## URL Operations (Client SDK)

### Create Short URL

**Operation**: `setDoc(doc(db, 'urls', shortCode), data)`  
**Trigger**: User submits URL on Shortener Page (FR-001, FR-004)

**Input Document**:

```typescript
{
  shortCode: string // 7-char nanoid (generated client-side)
  originalUrl: string // Validated URL, max 2048 chars, auto-prepend https://
  createdAt: Timestamp // serverTimestamp()
  clickCount: number // Always 0 on creation
}
```

**Validation (client-side before write)**:

- `originalUrl` is non-empty, valid URL format, ≤ 2048 characters
- `shortCode` uniqueness check via `getDoc` before `setDoc`

**Validation (Firestore Security Rules)**:

- All required fields present
- `originalUrl` is string with length 1–2048
- `shortCode` is string with length 6–8
- `clickCount` equals 0

**Error States**:
| Code | Meaning | UI Treatment |
|------|---------|--------------|
| `permission-denied` | Security rules rejected the write | "Unable to create link. Please try again." |
| `unavailable` | Firestore unreachable | "Service temporarily unavailable. Please try again." + retry button |
| Collision (doc exists) | Short code already taken | Auto-retry with new code (up to 3 attempts) |

---

### List User's Short URLs

**Operation**: `getDocs(query(collection(db, 'urls'), orderBy('createdAt', 'desc')))`  
**Trigger**: Shortener Page mount / after URL creation (FR-006)

**Response Document** (per doc):

```typescript
{
  shortCode: string
  originalUrl: string
  createdAt: Timestamp
  clickCount: number
}
```

**Notes**:

- Ordered by `createdAt` descending (newest first)
- No pagination for MVP (assumption: < 1000 URLs per user)
- Real-time listener (`onSnapshot`) optional for live `clickCount` updates

---

### Delete Short URL

**Operation**: `deleteDoc(doc(db, 'urls', shortCode))`  
**Trigger**: User clicks delete button with confirmation (FR-007)

**Input**: `shortCode` (document ID)

**Side Effects**:

- Deleting the parent URL document does NOT automatically delete the `clicks` subcollection (Firestore limitation)
- Orphaned clicks are acceptable for MVP; a cleanup Cloud Function can be added later

**Error States**:
| Code | Meaning | UI Treatment |
|------|---------|--------------|
| `permission-denied` | Security rules rejected | "Unable to delete link." |
| `not-found` | Doc already deleted | Remove from UI (idempotent) |

---

## Analytics Operations (Client SDK)

### Get Dashboard Summary

**Operations** (parallel):

1. `getDocs(query(collection(db, 'urls'), orderBy('clickCount', 'desc'), limit(10)))` — top links
2. `getCountFromServer(collection(db, 'urls'))` — total links count
3. `getDocs(collectionGroup(db, 'clicks').where('timestamp', '>=', thirtyDaysAgo))` — recent clicks for aggregation

**Trigger**: Dashboard Page mount (FR-009, FR-010, FR-011)

**Computed Output** (client-side aggregation):

```typescript
{
  totalLinks: number
  totalClicks: number // Sum of all urls.clickCount
  clicksToday: number // Filtered from recent clicks
  dailyClicks: Array<{ date: string; count: number }>
  weeklyClicks: Array<{ week: string; count: number }>
  topLinks: Array<ShortUrl> // Top 10 by clickCount
}
```

---

### Get Per-Link Analytics

**Operations** (sequential):

1. `getDoc(doc(db, 'urls', shortCode))` — URL details + total clicks
2. `getDocs(query(collection(db, 'urls', shortCode, 'clicks'), orderBy('timestamp', 'desc')))` — all click events

**Trigger**: User clicks a link row on Dashboard (FR-012, FR-013)

**Computed Output** (client-side aggregation):

```typescript
{
  shortCode: string
  originalUrl: string
  totalClicks: number
  clickTrend: Array<{ date: string; count: number }>
  referrerBreakdown: {
    direct: number
    search: number
    social: number
    other: number
  }
  deviceBreakdown: {
    mobile: number
    tablet: number
    desktop: number
  }
}
```

---

## Cloud Function Contract

### Redirect Function

**Endpoint**: `https://{hosting-domain}/{shortCode}`  
**Method**: GET  
**Invoked by**: Firebase Hosting rewrite rule (NOT called by the React app)

**Flow**:

```
GET /{shortCode}
  → Firestore lookup: urls/{shortCode}
  → If not found: 302 redirect to /not-found
  → If found:
      → Parse user-agent (device type)
      → Parse referer header (referrer category)
      → Write ClickEvent to urls/{shortCode}/clicks/{autoId}
      → Increment urls/{shortCode}.clickCount
      → 302 redirect to originalUrl
```

**Response Codes**:
| Code | Condition |
|------|-----------|
| 302 | Successful redirect to `originalUrl` |
| 302 | Short code not found → redirect to `/not-found` SPA route |

**Click Event Written** (by Admin SDK):

```typescript
{
  timestamp: FieldValue.serverTimestamp(),
  referrer: 'direct' | 'search' | 'social' | 'other',
  referrerRaw: string,
  deviceType: 'mobile' | 'tablet' | 'desktop'
}
```

---

## Firebase Configuration

### firebase.json

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "/dashboard/**", "destination": "/index.html" },
      { "source": "/not-found", "destination": "/index.html" },
      { "source": "/link/**", "destination": "/index.html" },
      {
        "source": "/**",
        "function": {
          "functionId": "redirect",
          "region": "us-central1"
        }
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  }
}
```

### Hosting Rewrite Priority

1. Static files from `dist/` (exact match: `index.html`, JS/CSS bundles, assets)
2. SPA routes: `/dashboard/**`, `/not-found`, `/link/**` → `index.html`
3. Catch-all `/**` → Cloud Function `redirect` (handles `/{shortCode}`)

### Environment Variables

| Variable                            | Purpose               | Example                           |
| ----------------------------------- | --------------------- | --------------------------------- |
| `VITE_FIREBASE_API_KEY`             | Firebase Web API key  | `AIzaSy...`                       |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain  | `myapp.firebaseapp.com`           |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase project ID   | `url-shortener-12345`             |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Storage bucket        | `url-shortener-12345.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID   | `123456789`                       |
| `VITE_FIREBASE_APP_ID`              | Firebase app ID       | `1:123:web:abc`                   |
| `VITE_BASE_URL`                     | Short URL base domain | `https://myapp.web.app`           |
