import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import Card from '@/components/common/Card'
import type { TimeSeriesPoint } from '@/types/analytics'

interface ClickChartProps {
  data: TimeSeriesPoint[]
}

export default function ClickChart({ data }: ClickChartProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Click Trend</h3>

      {data.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No click data available.</p>
      ) : (
        <div className="h-64 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} aria-label="Per-link click trend chart">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value: string) => value.slice(5)}
              />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                labelFormatter={(label) => `Date: ${String(label)}`}
                formatter={(value) => [Number(value), 'Clicks']}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Screen-reader-only data table fallback */}
      {data.length > 0 && (
        <table className="sr-only" aria-label="Click trend data">
          <thead>
            <tr>
              <th>Date</th>
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
