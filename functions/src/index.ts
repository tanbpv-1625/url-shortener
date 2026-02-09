import * as functions from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { UAParser } from 'ua-parser-js'

admin.initializeApp()
const db = admin.firestore()

type ReferrerCategory = 'direct' | 'search' | 'social' | 'other'
type DeviceType = 'mobile' | 'tablet' | 'desktop'

const SEARCH_DOMAINS = [
  'google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'yandex',
  'ecosia', 'ask', 'aol', 'startpage',
]

const SOCIAL_DOMAINS = [
  'facebook', 'twitter', 'x.com', 'instagram', 'linkedin', 'reddit',
  'pinterest', 'tiktok', 'youtube', 'snapchat', 'threads', 'mastodon',
  'tumblr', 'whatsapp', 't.co',
]

function categorizeReferrer(referrer: string | undefined): { category: ReferrerCategory; raw: string } {
  if (!referrer || referrer === '' || referrer === '-') {
    return { category: 'direct', raw: 'direct' }
  }

  const lowerRef = referrer.toLowerCase()

  for (const domain of SEARCH_DOMAINS) {
    if (lowerRef.includes(domain)) {
      return { category: 'search', raw: referrer }
    }
  }

  for (const domain of SOCIAL_DOMAINS) {
    if (lowerRef.includes(domain)) {
      return { category: 'social', raw: referrer }
    }
  }

  return { category: 'other', raw: referrer }
}

function detectDeviceType(userAgent: string | undefined): DeviceType {
  if (!userAgent) return 'desktop'

  const parser = new UAParser(userAgent)
  const deviceType = parser.getDevice().type

  if (deviceType === 'mobile') return 'mobile'
  if (deviceType === 'tablet') return 'tablet'
  return 'desktop'
}

export const redirect = functions.onRequest(
  { region: 'us-central1' },
  async (req, res) => {
    const path = req.path.replace(/^\//, '')

    // Skip if path looks like a static asset or SPA route
    if (
      !path ||
      path.includes('.') ||
      path === 'dashboard' ||
      path.startsWith('dashboard/') ||
      path === 'not-found' ||
      path.startsWith('link/')
    ) {
      res.redirect(302, '/not-found')
      return
    }

    const shortCode = path

    try {
      const urlDoc = await db.collection('urls').doc(shortCode).get()

      if (!urlDoc.exists) {
        res.redirect(302, '/not-found')
        return
      }

      const urlData = urlDoc.data()!
      const originalUrl = urlData.originalUrl as string

      // Parse referrer and device
      const referrerHeader = req.headers.referer || req.headers.referrer
      const { category, raw } = categorizeReferrer(
        typeof referrerHeader === 'string' ? referrerHeader : undefined,
      )
      const deviceType = detectDeviceType(req.headers['user-agent'])

      // Write click event and increment counter in parallel
      const batch = db.batch()

      // Add click event
      const clickRef = db.collection('urls').doc(shortCode).collection('clicks').doc()
      batch.set(clickRef, {
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        referrer: category,
        referrerRaw: raw,
        deviceType,
      })

      // Increment click count
      const urlRef = db.collection('urls').doc(shortCode)
      batch.update(urlRef, {
        clickCount: admin.firestore.FieldValue.increment(1),
      })

      await batch.commit()

      // 302 redirect to original URL
      res.redirect(302, originalUrl)
    } catch (error) {
      console.error('Redirect error:', error)
      res.redirect(302, '/not-found')
    }
  },
)
