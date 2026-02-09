import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Loading from '@/components/common/Loading'

export default function RedirectPage() {
  const { shortCode } = useParams<{ shortCode: string }>()
  const [notFound, setNotFound] = useState(!shortCode)

  useEffect(() => {
    if (!shortCode) return

    let cancelled = false

    const doRedirect = async () => {
      try {
        const urlDoc = await getDoc(doc(db, 'urls', shortCode))

        if (!urlDoc.exists()) {
          if (!cancelled) setNotFound(true)
          return
        }

        const data = urlDoc.data()
        const originalUrl = data.originalUrl as string

        // Track the click (fire-and-forget)
        const referrerRaw = document.referrer || ''
        let referrer = 'direct'
        if (referrerRaw) {
          const lower = referrerRaw.toLowerCase()
          if (
            ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'yandex'].some((d) =>
              lower.includes(d),
            )
          ) {
            referrer = 'search'
          } else if (
            [
              'facebook',
              'twitter',
              'x.com',
              'instagram',
              'linkedin',
              'reddit',
              'tiktok',
              'youtube',
              't.co',
            ].some((d) => lower.includes(d))
          ) {
            referrer = 'social'
          } else {
            referrer = 'other'
          }
        }

        const ua = navigator.userAgent
        const deviceType = /Mobi/i.test(ua)
          ? 'mobile'
          : /Tablet|iPad/i.test(ua)
            ? 'tablet'
            : 'desktop'

        const clickRef = collection(db, 'urls', shortCode, 'clicks')
        void addDoc(clickRef, {
          timestamp: serverTimestamp(),
          referrer,
          referrerRaw: referrerRaw || 'direct',
          deviceType,
        })
        void updateDoc(doc(db, 'urls', shortCode), {
          clickCount: increment(1),
        })

        // Redirect
        window.location.replace(originalUrl)
      } catch {
        if (!cancelled) setNotFound(true)
      }
    }

    void doRedirect()

    return () => {
      cancelled = true
    }
  }, [shortCode])

  if (notFound) {
    return <Navigate to="/not-found" replace />
  }

  return <Loading className="min-h-screen" size="lg" />
}
