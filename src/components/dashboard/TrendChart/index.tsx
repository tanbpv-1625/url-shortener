import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import type { TimeSeriesPoint } from '@/types/analytics'

type TimeView = 'daily' | 'weekly'

interface TrendChartProps {
  dailyData: TimeSeriesPoint[]
  weeklyData: TimeSeriesPoint[]
  timeView: TimeView
  onTimeViewChange: (view: TimeView) => void
}

export default function TrendChart({
  dailyData,
  weeklyData,
  timeView,
  onTimeViewChange,
}: TrendChartProps) {
  const data = timeView === 'daily' ? dailyData : weeklyData

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Click Trends</h3>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={timeView === 'daily' ? 'primary' : 'secondary'}
            onClick={() => onTimeViewChange('daily')}
          >
            Daily
          </Button>
          <Button
            size="sm"
            variant={timeView === 'weekly' ? 'primary' : 'secondary'}
            onClick={() => onTimeViewChange('weekly')}
          >
            Weekly
          </Button>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No click data available yet.</p>
      ) : (
        <div className="h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} aria-label="Click trend chart">
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="text-gray-200" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(value: string) => (timeView === 'daily' ? value.slice(5) : value)}
                interval={timeView === 'daily' ? 6 : 0}
              />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                labelFormatter={(label) =>
                  timeView === 'daily' ? `Date: ${String(label)}` : `Week: ${String(label)}`
                }
                formatter={(value) => [Number(value), 'Clicks']}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#colorClicks)"
                dot={{ r: 2 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Screen-reader-only data table fallback */}
      {data.length > 0 && (
        <table className="sr-only" aria-label="Click trend data">
          <thead>
            <tr>
              <th>{timeView === 'daily' ? 'Date' : 'Week'}</th>
              <th>Clicks</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.date}>
                <td>{point.date}</td>
                <td>{point.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}
