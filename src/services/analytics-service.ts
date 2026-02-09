import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
} from 'firebase/firestore'
import { startOfDay, startOfWeek, format, subDays, addDays } from 'date-fns'
import { db } from '@/lib/firebase'
import type { ShortUrl } from '@/types/url'
import type {
  AnalyticsSummary,
  LinkAnalytics,
  TimeSeriesPoint,
  ClickEvent,
  ReferrerCategory,
  DeviceType,
} from '@/types/analytics'

interface FirestoreClickDoc {
  timestamp: { toDate: () => Date }
  referrer: ReferrerCategory
  referrerRaw: string
  deviceType: DeviceType
}

/**
 * Fill in missing dates so the chart shows a continuous line with 0s for empty days.
 */
function fillDailyGaps(dailyMap: Map<string, number>, days: number): TimeSeriesPoint[] {
  const result: TimeSeriesPoint[] = []
  const today = startOfDay(new Date())
  const start = subDays(today, days - 1)

  for (let i = 0; i < days; i++) {
    const date = format(addDays(start, i), 'yyyy-MM-dd')
    result.push({ date, count: dailyMap.get(date) ?? 0 })
  }

  return result
}

/**
 * Get dashboard summary: top links, total counts, and daily/weekly trends.
 */
export async function getDashboardSummary(): Promise<AnalyticsSummary> {
  const thirtyDaysAgo = Timestamp.fromDate(subDays(new Date(), 30))

  // Execute queries in parallel
  const [topLinksSnapshot, totalLinksResult, recentClicksSnapshot] = await Promise.all([
    // Top 10 links by click count
    getDocs(query(collection(db, 'urls'), orderBy('clickCount', 'desc'), limit(10))),
    // Total links count
    getCountFromServer(collection(db, 'urls')),
    // Recent clicks (last 30 days) for aggregation
    getDocs(
      query(
        collectionGroup(db, 'clicks'),
        where('timestamp', '>=', thirtyDaysAgo),
        orderBy('timestamp', 'desc'),
      ),
    ),
  ])

  // Map top links
  const topLinks: ShortUrl[] = topLinksSnapshot.docs.map((d) => {
    const data = d.data()
    return {
      shortCode: data.shortCode as string,
      originalUrl: data.originalUrl as string,
      createdAt: (data.createdAt as { toDate: () => Date })?.toDate() ?? new Date(),
      clickCount: (data.clickCount as number) ?? 0,
    }
  })

  // Compute total clicks from top links + sum
  const totalClicks = topLinks.reduce((sum, link) => sum + link.clickCount, 0)
  const totalLinks = totalLinksResult.data().count

  // Aggregate clicks by day, week, referrer, device
  const todayStart = startOfDay(new Date())
  let clicksToday = 0
  const dailyMap = new Map<string, number>()
  const weeklyMap = new Map<string, number>()
  const referrerBreakdown: Record<ReferrerCategory, number> = {
    direct: 0,
    search: 0,
    social: 0,
    other: 0,
  }
  const deviceBreakdown: Record<DeviceType, number> = {
    mobile: 0,
    tablet: 0,
    desktop: 0,
  }

  recentClicksSnapshot.docs.forEach((d) => {
    const data = d.data() as FirestoreClickDoc
    const clickDate = data.timestamp.toDate()

    // Clicks today
    if (clickDate >= todayStart) {
      clicksToday++
    }

    // Referrer + device aggregation (safely handle unknown values)
    const ref = data.referrer
    const dev = data.deviceType
    if (ref === 'direct' || ref === 'search' || ref === 'social' || ref === 'other') {
      referrerBreakdown[ref]++
    } else {
      referrerBreakdown.other++
    }
    if (dev === 'mobile' || dev === 'tablet' || dev === 'desktop') {
      deviceBreakdown[dev]++
    } else {
      deviceBreakdown.desktop++
    }

    // Daily aggregation
    const dayKey = format(clickDate, 'yyyy-MM-dd')
    dailyMap.set(dayKey, (dailyMap.get(dayKey) ?? 0) + 1)

    // Weekly aggregation
    const weekStart = startOfWeek(clickDate, { weekStartsOn: 1 })
    const weekKey = format(weekStart, "yyyy-'W'ww")
    weeklyMap.set(weekKey, (weeklyMap.get(weekKey) ?? 0) + 1)
  })

  // Fill missing dates for continuous chart lines
  const dailyClicks = fillDailyGaps(dailyMap, 30)

  const weeklyClicks: TimeSeriesPoint[] = Array.from(weeklyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    totalLinks,
    totalClicks,
    clicksToday,
    dailyClicks,
    weeklyClicks,
    topLinks,
    referrerBreakdown,
    deviceBreakdown,
  }
}

/**
 * Get per-link analytics: click trend, referrer breakdown, device breakdown.
 */
export async function getLinkAnalytics(shortCode: string): Promise<LinkAnalytics> {
  // Fetch URL doc and all clicks
  const urlDocRef = doc(db, 'urls', shortCode)
  const [urlSnap, clicksSnap] = await Promise.all([
    getDoc(urlDocRef),
    getDocs(query(collection(db, 'urls', shortCode, 'clicks'), orderBy('timestamp', 'desc'))),
  ])

  if (!urlSnap.exists()) {
    throw new Error('Short URL not found')
  }

  const urlData = urlSnap.data()

  // Map click events
  const clicks: ClickEvent[] = clicksSnap.docs.map((d) => {
    const data = d.data() as FirestoreClickDoc
    return {
      id: d.id,
      timestamp: data.timestamp.toDate(),
      referrer: data.referrer,
      referrerRaw: data.referrerRaw,
      deviceType: data.deviceType,
    }
  })

  // Click trend (daily)
  const trendMap = new Map<string, number>()
  const referrerBreakdown: Record<ReferrerCategory, number> = {
    direct: 0,
    search: 0,
    social: 0,
    other: 0,
  }
  const deviceBreakdown: Record<DeviceType, number> = {
    mobile: 0,
    tablet: 0,
    desktop: 0,
  }

  clicks.forEach((click) => {
    const dayKey = format(click.timestamp, 'yyyy-MM-dd')
    trendMap.set(dayKey, (trendMap.get(dayKey) ?? 0) + 1)

    referrerBreakdown[click.referrer]++
    deviceBreakdown[click.deviceType]++
  })

  const clickTrend: TimeSeriesPoint[] = Array.from(trendMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    shortCode,
    originalUrl: urlData.originalUrl as string,
    totalClicks: (urlData.clickCount as number) ?? 0,
    clickTrend,
    referrerBreakdown,
    deviceBreakdown,
  }
}
