import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import { UrlData, ClickData, DeviceType } from '../types'
import { customAlphabet } from 'nanoid'

// Generate short codes (6 characters, URL-safe)
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6)

const URLS_COLLECTION = 'urls'
const CLICKS_COLLECTION = 'clicks'

// Parse user agent to get device info
export const parseUserAgent = (ua: string): { device: DeviceType; browser: string; os: string } => {
  const device: DeviceType = /Mobile|Android|iPhone|iPad/i.test(ua)
    ? /iPad|Tablet/i.test(ua)
      ? 'tablet'
      : 'mobile'
    : 'desktop'

  let browser = 'Unknown'
  if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Edg')) browser = 'Edge'
  else if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Safari')) browser = 'Safari'
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera'

  let os = 'Unknown'
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

  return { device, browser, os }
}

// Create a new short URL
export const createShortUrl = async (originalUrl: string): Promise<UrlData> => {
  const shortCode = nanoid()

  const urlData = {
    shortCode,
    originalUrl,
    createdAt: Timestamp.now(),
    clickCount: 0,
    isActive: true,
  }

  const docRef = await addDoc(collection(db, URLS_COLLECTION), urlData)

  return {
    id: docRef.id,
    shortCode,
    originalUrl,
    createdAt: new Date(),
    clickCount: 0,
    isActive: true,
  }
}

// Get URL by short code
export const getUrlByShortCode = async (shortCode: string): Promise<UrlData | null> => {
  const q = query(collection(db, URLS_COLLECTION), where('shortCode', '==', shortCode), limit(1))

  const snapshot = await getDocs(q)

  if (snapshot.empty) return null

  const doc = snapshot.docs[0]
  const data = doc.data()

  return {
    id: doc.id,
    shortCode: data.shortCode,
    originalUrl: data.originalUrl,
    createdAt: data.createdAt.toDate(),
    clickCount: data.clickCount,
    isActive: data.isActive,
  }
}

// Record a click
export const recordClick = async (
  urlId: string,
  shortCode: string,
  referrer: string,
  userAgent: string,
): Promise<void> => {
  const { device, browser, os } = parseUserAgent(userAgent)

  // Add click record
  await addDoc(collection(db, CLICKS_COLLECTION), {
    urlId,
    shortCode,
    timestamp: Timestamp.now(),
    referrer: referrer || 'Direct',
    userAgent,
    device,
    browser,
    os,
  })

  // Increment click count on URL
  const urlRef = doc(db, URLS_COLLECTION, urlId)
  await updateDoc(urlRef, {
    clickCount: increment(1),
  })
}

// Get all URLs
export const getAllUrls = async (): Promise<UrlData[]> => {
  const q = query(collection(db, URLS_COLLECTION), orderBy('createdAt', 'desc'))

  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      shortCode: data.shortCode,
      originalUrl: data.originalUrl,
      createdAt: data.createdAt.toDate(),
      clickCount: data.clickCount,
      isActive: data.isActive,
    }
  })
}

// Get clicks for a specific URL
export const getClicksByUrl = async (shortCode: string): Promise<ClickData[]> => {
  const q = query(
    collection(db, CLICKS_COLLECTION),
    where('shortCode', '==', shortCode),
    orderBy('timestamp', 'desc'),
  )

  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      urlId: data.urlId,
      shortCode: data.shortCode,
      timestamp: data.timestamp.toDate(),
      referrer: data.referrer,
      userAgent: data.userAgent,
      device: data.device,
      browser: data.browser,
      os: data.os,
    }
  })
}

// Get all clicks
export const getAllClicks = async (): Promise<ClickData[]> => {
  const q = query(collection(db, CLICKS_COLLECTION), orderBy('timestamp', 'desc'))

  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      urlId: data.urlId,
      shortCode: data.shortCode,
      timestamp: data.timestamp.toDate(),
      referrer: data.referrer,
      userAgent: data.userAgent,
      device: data.device,
      browser: data.browser,
      os: data.os,
    }
  })
}

// Delete a URL and its clicks
export const deleteUrl = async (urlId: string, shortCode: string): Promise<void> => {
  // Delete the URL
  await deleteDoc(doc(db, URLS_COLLECTION, urlId))

  // Delete associated clicks
  const clicksQuery = query(collection(db, CLICKS_COLLECTION), where('shortCode', '==', shortCode))

  const clicksSnapshot = await getDocs(clicksQuery)

  const deletePromises = clicksSnapshot.docs.map((clickDoc) =>
    deleteDoc(doc(db, CLICKS_COLLECTION, clickDoc.id)),
  )

  await Promise.all(deletePromises)
}

// Toggle URL active status
export const toggleUrlStatus = async (urlId: string, isActive: boolean): Promise<void> => {
  const urlRef = doc(db, URLS_COLLECTION, urlId)
  await updateDoc(urlRef, { isActive })
}
