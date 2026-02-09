import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  type PieLabelRenderProps,
} from 'recharts'
import Card from '@/components/common/Card'
import type { DeviceType } from '@/types/analytics'

interface DeviceBreakdownProps {
  data: Record<DeviceType, number>
}

const COLORS: Record<DeviceType, string> = {
  desktop: '#2563eb',
  mobile: '#f59e0b',
  tablet: '#10b981',
}

const LABELS: Record<DeviceType, string> = {
  desktop: 'Desktop',
  mobile: 'Mobile',
  tablet: 'Tablet',
}

export default function DeviceBreakdown({ data }: DeviceBreakdownProps) {
  const total = Object.values(data).reduce((sum, v) => sum + v, 0)

  const chartData = (Object.entries(data) as [DeviceType, number][])
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({
      name: LABELS[key],
      value: count,
      color: COLORS[key],
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
    }))

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>

      {total === 0 ? (
        <p className="text-center text-gray-400 py-8">No device data available.</p>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="h-56 w-full lg:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart aria-label="Device breakdown pie chart">
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                  label={(props: PieLabelRenderProps) =>
                    `${String(props.name)}: ${((props.percent ?? 0) * 100).toFixed(1)}%`
                  }
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [Number(value), 'Clicks']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Data table for accessibility */}
          <div className="w-full lg:w-1/2">
            <table className="w-full text-sm" aria-label="Device breakdown table">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-500">Device</th>
                  <th className="text-right py-2 text-gray-500">Clicks</th>
                  <th className="text-right py-2 text-gray-500">%</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((entry) => (
                  <tr key={entry.name} className="border-b border-gray-50">
                    <td className="py-2 font-medium flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      {entry.name}
                    </td>
                    <td className="text-right py-2">{entry.value}</td>
                    <td className="text-right py-2 text-gray-500">{entry.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  )
}
