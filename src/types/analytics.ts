import type { ShortUrl } from './url'

export type ReferrerCategory = 'direct' | 'search' | 'social' | 'other'
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export interface ClickEvent {
  id: string
  timestamp: Date
  referrer: ReferrerCategory
  referrerRaw: string
  deviceType: DeviceType
}

export interface TimeSeriesPoint {
  date: string // ISO date string "YYYY-MM-DD" or "YYYY-Www"
  count: number
}

export interface AnalyticsSummary {
  totalLinks: number
  totalClicks: number
  clicksToday: number
  dailyClicks: TimeSeriesPoint[]
  weeklyClicks: TimeSeriesPoint[]
  topLinks: ShortUrl[]
  referrerBreakdown: Record<ReferrerCategory, number>
  deviceBreakdown: Record<DeviceType, number>
}

export interface LinkAnalytics {
  shortCode: string
  originalUrl: string
  totalClicks: number
  clickTrend: TimeSeriesPoint[]
  referrerBreakdown: Record<ReferrerCategory, number>
  deviceBreakdown: Record<DeviceType, number>
}
