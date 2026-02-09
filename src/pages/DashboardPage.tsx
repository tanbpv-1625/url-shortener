import PageLayout from '@/components/layout/PageLayout'
import Loading from '@/components/common/Loading'
import EmptyState from '@/components/common/EmptyState'
import Button from '@/components/common/Button'
import StatsOverview from '@/components/dashboard/StatsOverview'
import SourceDeviceOverview from '@/components/dashboard/SourceDeviceOverview'
import TrendChart from '@/components/dashboard/TrendChart'
import TopLinksTable from '@/components/dashboard/TopLinksTable'
import { useDashboard } from '@/hooks/useDashboard'

export default function DashboardPage() {
  const { state, timeView, setTimeView, refresh } = useDashboard()

  return (
    <PageLayout>
      <div className="py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-2 text-gray-500">
              Track click performance across all your short URLs.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refresh()}
            disabled={state.status === 'loading'}
          >
            Refresh
          </Button>
        </div>

        {state.status === 'loading' && <Loading className="py-20" size="lg" />}

        {state.status === 'error' && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{state.error}</p>
            <Button onClick={() => void refresh()}>Retry</Button>
          </div>
        )}

        {state.status === 'success' && state.data.totalLinks === 0 && (
          <EmptyState
            title="No data yet"
            description="Create and share short URLs to start seeing analytics here."
          />
        )}

        {state.status === 'success' && state.data.totalLinks > 0 && (
          <div className="space-y-6">
            <StatsOverview
              totalLinks={state.data.totalLinks}
              totalClicks={state.data.totalClicks}
              clicksToday={state.data.clicksToday}
            />

            <SourceDeviceOverview
              referrerBreakdown={state.data.referrerBreakdown}
              deviceBreakdown={state.data.deviceBreakdown}
            />

            <TrendChart
              dailyData={state.data.dailyClicks}
              weeklyData={state.data.weeklyClicks}
              timeView={timeView}
              onTimeViewChange={setTimeView}
            />

            <TopLinksTable links={state.data.topLinks} />
          </div>
        )}
      </div>
    </PageLayout>
  )
}
