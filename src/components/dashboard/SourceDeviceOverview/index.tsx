import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import Card from '@/components/common/Card'
import type { ReferrerCategory, DeviceType } from '@/types/analytics'

interface SourceDeviceOverviewProps {
  referrerBreakdown: Record<ReferrerCategory, number>
  deviceBreakdown: Record<DeviceType, number>
}

const REFERRER_CONFIG: { key: ReferrerCategory; label: string; color: string }[] = [
  { key: 'direct', label: 'Direct', color: '#2563eb' },
  { key: 'search', label: 'Search', color: '#16a34a' },
  { key: 'social', label: 'Social', color: '#9333ea' },
  { key: 'other', label: 'Other', color: '#6b7280' },
]

const DEVICE_CONFIG: { key: DeviceType; label: string; color: string }[] = [
  { key: 'desktop', label: 'Desktop', color: '#2563eb' },
  { key: 'mobile', label: 'Mobile', color: '#f59e0b' },
  { key: 'tablet', label: 'Tablet', color: '#10b981' },
]

interface ChartItem {
  name: string
  value: number
  color: string
}

function MiniPieChart({ data, title }: { data: ChartItem[]; title: string }) {
  const total = data.reduce((s, d) => s + d.value, 0)

  if (total === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
        <p className="text-sm text-gray-400 text-center py-6">No data yet</p>
      </Card>
    )
  }

  const filtered = data.filter((d) => d.value > 0)

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="flex flex-col items-center gap-2">
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={filtered}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                dataKey="value"
                nameKey="name"
                strokeWidth={2}
              >
                {filtered.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => {
                  const v = Number(value)
                  return [`${v} (${total > 0 ? ((v / total) * 100).toFixed(0) : 0}%)`, 'Clicks']
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => {
                  const item = filtered.find((d) => d.name === value)
                  const pct = item && total > 0 ? ((item.value / total) * 100).toFixed(0) : '0'
                  return `${value}: ${item?.value ?? 0} (${pct}%)`
                }}
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  )
}

export default function SourceDeviceOverview({
  referrerBreakdown,
  deviceBreakdown,
}: SourceDeviceOverviewProps) {
  const referrerData: ChartItem[] = REFERRER_CONFIG.map((c) => ({
    name: c.label,
    value: referrerBreakdown[c.key] ?? 0,
    color: c.color,
  }))

  const deviceData: ChartItem[] = DEVICE_CONFIG.map((c) => ({
    name: c.label,
    value: deviceBreakdown[c.key] ?? 0,
    color: c.color,
  }))

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <MiniPieChart data={referrerData} title="Traffic Sources" />
      <MiniPieChart data={deviceData} title="Devices" />
    </div>
  )
}
