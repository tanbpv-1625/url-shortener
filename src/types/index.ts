export interface UrlData {
  id: string
  shortCode: string
  originalUrl: string
  createdAt: Date
  clickCount: number
  isActive: boolean
}

export interface ClickData {
  id: string
  urlId: string
  shortCode: string
  timestamp: Date
  referrer: string
  userAgent: string
  device: DeviceType
  browser: string
  os: string
  country?: string
  city?: string
}

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown'

export interface AnalyticsData {
  totalClicks: number
  clicksByDay: { date: string; clicks: number }[]
  clicksByDevice: { device: DeviceType; count: number }[]
  clicksByBrowser: { browser: string; count: number }[]
  clicksByReferrer: { referrer: string; count: number }[]
  topLinks: { shortCode: string; originalUrl: string; clicks: number }[]
}

export interface DashboardStats {
  totalLinks: number
  totalClicks: number
  clicksToday: number
  clicksThisWeek: number
}
