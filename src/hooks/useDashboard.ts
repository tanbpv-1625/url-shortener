import { useState, useEffect, useCallback } from 'react'
import type { AnalyticsSummary } from '@/types/analytics'
import type { AsyncState } from '@/types/api'
import { getDashboardSummary } from '@/services/analytics-service'
import { trackEvent } from '@/lib/ga'

type TimeView = 'daily' | 'weekly'

interface UseDashboardReturn {
  state: AsyncState<AnalyticsSummary>
  timeView: TimeView
  setTimeView: (view: TimeView) => void
  refresh: () => void
}

export function useDashboard(): UseDashboardReturn {
  const [state, setState] = useState<AsyncState<AnalyticsSummary>>({ status: 'loading' })
  const [timeView, setTimeView] = useState<TimeView>('daily')
  const [trigger, setTrigger] = useState(0)

  useEffect(() => {
    let cancelled = false
    void trackEvent('dashboard_viewed')

    getDashboardSummary()
      .then((data) => {
        if (!cancelled) setState({ status: 'success', data })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load dashboard data'
          setState({ status: 'error', error: message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [trigger])

  const refresh = useCallback(() => {
    setState({ status: 'loading' })
    setTrigger((t) => t + 1)
  }, [])

  const handleSetTimeView = useCallback((view: TimeView) => {
    setTimeView(view)
    void trackEvent('dashboard_time_view_changed', { view })
  }, [])

  return {
    state,
    timeView,
    setTimeView: handleSetTimeView,
    refresh,
  }
}
