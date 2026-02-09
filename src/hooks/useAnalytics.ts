import { useState, useEffect, useCallback } from 'react'
import type { LinkAnalytics } from '@/types/analytics'
import type { AsyncState } from '@/types/api'
import { getLinkAnalytics } from '@/services/analytics-service'
import { trackEvent } from '@/lib/ga'

interface UseAnalyticsReturn {
  state: AsyncState<LinkAnalytics>
  refresh: () => void
}

export function useAnalytics(shortCode: string): UseAnalyticsReturn {
  const [state, setState] = useState<AsyncState<LinkAnalytics>>({ status: 'loading' })
  const [trigger, setTrigger] = useState(0)

  useEffect(() => {
    if (!shortCode) return

    let cancelled = false
    void trackEvent('link_detail_viewed', { short_code: shortCode })

    getLinkAnalytics(shortCode)
      .then((data) => {
        if (!cancelled) setState({ status: 'success', data })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load analytics'
          setState({ status: 'error', error: message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [shortCode, trigger])

  const refresh = useCallback(() => {
    setState({ status: 'loading' })
    setTrigger((t) => t + 1)
  }, [])

  return { state, refresh }
}
