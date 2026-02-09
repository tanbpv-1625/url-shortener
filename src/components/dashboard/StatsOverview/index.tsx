import Card from '@/components/common/Card'

interface StatsOverviewProps {
  totalLinks: number
  totalClicks: number
  clicksToday: number
}

const stats = (props: StatsOverviewProps) => [
  { label: 'Total Links', value: props.totalLinks, color: 'text-blue-600' },
  { label: 'Total Clicks', value: props.totalClicks, color: 'text-green-600' },
  { label: 'Clicks Today', value: props.clicksToday, color: 'text-purple-600' },
]

export default function StatsOverview(props: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {stats(props).map((stat) => (
        <Card key={stat.label}>
          <p className="text-sm font-medium text-gray-500">{stat.label}</p>
          <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value.toLocaleString()}</p>
        </Card>
      ))}
    </div>
  )
}
