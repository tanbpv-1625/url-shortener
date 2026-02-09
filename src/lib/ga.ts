import { logEvent } from 'firebase/analytics'
import { analyticsPromise } from './firebase'

/**
 * Track a page view in GA4.
 */
export async function trackPageView(pagePath: string, pageTitle?: string): Promise<void> {
  const analytics = await analyticsPromise
  if (!analytics) return
  logEvent(analytics, 'page_view', {
    page_path: pagePath,
    page_title: pageTitle ?? document.title,
  })
}

/**
 * Track a custom event in GA4.
 */
export async function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
): Promise<void> {
  const analytics = await analyticsPromise
  if (!analytics) return
  logEvent(analytics, eventName, params)
}
