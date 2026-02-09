import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ShortUrl } from '@/types/url'

const URLS_COLLECTION = 'urls'
const SHORT_CODE_LENGTH = 7
const MAX_RETRY_ATTEMPTS = 3
const MAX_URL_LENGTH = 2048

// Custom alphabet: no ambiguous chars (0/O, 1/l/I)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

function generateShortCode(): string {
  // nanoid with custom alphabet
  const chars = ALPHABET
  let result = ''
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

/**
 * Validate URL format. Auto-prepends https:// if no protocol.
 * Returns normalized URL or throws with error message.
 */
export function validateAndNormalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) {
    throw new Error('URL is required')
  }

  // Auto-prepend https:// if no protocol
  let url = trimmed
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }

  if (url.length > MAX_URL_LENGTH) {
    throw new Error(`URL must be ${MAX_URL_LENGTH} characters or less`)
  }

  // Validate URL format
  try {
    new URL(url)
  } catch {
    throw new Error('Please enter a valid URL')
  }

  return url
}

/**
 * Check if a URL has already been shortened. Returns existing ShortUrl if found.
 */
export async function findExistingUrl(originalUrl: string): Promise<ShortUrl | null> {
  const q = query(collection(db, URLS_COLLECTION), where('originalUrl', '==', originalUrl))
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null

  const docSnap = snapshot.docs[0]!
  const data = docSnap.data()
  return {
    shortCode: data.shortCode as string,
    originalUrl: data.originalUrl as string,
    createdAt: (data.createdAt as { toDate: () => Date }).toDate(),
    clickCount: data.clickCount as number,
  }
}

/**
 * Create a new short URL. Retries up to 3 times on short code collision.
 * If the URL was already shortened, returns the existing entry.
 */
export async function createShortUrl(rawUrl: string): Promise<ShortUrl> {
  const originalUrl = validateAndNormalizeUrl(rawUrl)

  // Check for duplicate
  const existing = await findExistingUrl(originalUrl)
  if (existing) return existing

  // Generate short code with collision handling
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    const shortCode = generateShortCode()
    const docRef = doc(db, URLS_COLLECTION, shortCode)

    // Check if short code already exists
    const existingDoc = await getDoc(docRef)
    if (existingDoc.exists()) continue

    // Create the document
    await setDoc(docRef, {
      shortCode,
      originalUrl,
      createdAt: serverTimestamp(),
      clickCount: 0,
    })

    return {
      shortCode,
      originalUrl,
      createdAt: new Date(),
      clickCount: 0,
    }
  }

  throw new Error('Failed to generate a unique short code. Please try again.')
}

/**
 * List all short URLs, ordered by creation date descending.
 */
export async function listUrls(): Promise<ShortUrl[]> {
  const q = query(collection(db, URLS_COLLECTION), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data()
    return {
      shortCode: data.shortCode as string,
      originalUrl: data.originalUrl as string,
      createdAt: (data.createdAt as { toDate: () => Date })?.toDate() ?? new Date(),
      clickCount: (data.clickCount as number) ?? 0,
    }
  })
}

/**
 * Delete a short URL by its short code.
 * Note: Firestore doesn't auto-delete subcollections (clicks).
 */
export async function deleteUrl(shortCode: string): Promise<void> {
  const docRef = doc(db, URLS_COLLECTION, shortCode)
  await deleteDoc(docRef)
}
