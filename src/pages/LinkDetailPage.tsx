import { useParams, Link } from 'react-router-dom'
import PageLayout from '@/components/layout/PageLayout'
import Loading from '@/components/common/Loading'
import Button from '@/components/common/Button'
import ClickChart from '@/components/analytics/ClickChart'
import ReferrerBreakdown from '@/components/analytics/ReferrerBreakdown'
import DeviceBreakdown from '@/components/analytics/DeviceBreakdown'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function LinkDetailPage() {
  const { shortCode } = useParams<{ shortCode: string }>()
  const { state, refresh } = useAnalytics(shortCode ?? '')

  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin

  return (
    <PageLayout>
      <div className="py-8">
        {/* Back navigation */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </Link>

        {state.status === 'loading' && <Loading className="py-20" size="lg" />}

        {state.status === 'error' && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{state.error}</p>
            <Button onClick={() => void refresh()}>Retry</Button>
          </div>
        )}

        {state.status === 'success' && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {baseUrl}/{state.data.shortCode}
              </h1>
              <p className="mt-1 text-sm text-gray-500 break-all">
                Original: {state.data.originalUrl}
              </p>
              <p className="mt-1 text-sm font-medium text-blue-600">
                {state.data.totalClicks.toLocaleString()} total clicks
              </p>
            </div>

            {/* Charts */}
            <ClickChart data={state.data.clickTrend} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReferrerBreakdown data={state.data.referrerBreakdown} />
              <DeviceBreakdown data={state.data.deviceBreakdown} />
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
