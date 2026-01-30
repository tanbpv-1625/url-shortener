import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import { ClickData } from '../types'
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns'
import { vi } from 'date-fns/locale'

interface AnalyticsChartsProps {
  clicks: ClickData[]
  isLoading?: boolean
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const AnalyticsCharts = ({ clicks, isLoading }: AnalyticsChartsProps) => {
  if (isLoading) {
    return (
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className='card animate-pulse'>
            <div className='h-6 bg-gray-200 rounded w-40 mb-4' />
            <div className='h-64 bg-gray-100 rounded' />
          </div>
        ))}
      </div>
    )
  }

  // Process clicks by day (last 7 days)
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  })

  const clicksByDay = last7Days.map((day) => {
    const dayStart = startOfDay(day)
    const count = clicks.filter((click) => {
      const clickDay = startOfDay(click.timestamp)
      return clickDay.getTime() === dayStart.getTime()
    }).length

    return {
      date: format(day, 'dd/MM', { locale: vi }),
      fullDate: format(day, 'EEEE, dd/MM/yyyy', { locale: vi }),
      clicks: count,
    }
  })

  // Process clicks by device
  const deviceCounts = clicks.reduce(
    (acc, click) => {
      const device = click.device || 'unknown'
      acc[device] = (acc[device] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const deviceData = Object.entries(deviceCounts).map(([name, value]) => ({
    name:
      name === 'desktop'
        ? 'Desktop'
        : name === 'mobile'
          ? 'Mobile'
          : name === 'tablet'
            ? 'Tablet'
            : 'Khác',
    value,
  }))

  // Process clicks by browser
  const browserCounts = clicks.reduce(
    (acc, click) => {
      const browser = click.browser || 'Unknown'
      acc[browser] = (acc[browser] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const browserData = Object.entries(browserCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }))

  // Process clicks by referrer
  const referrerCounts = clicks.reduce(
    (acc, click) => {
      const referrer = click.referrer || 'Direct'
      const domain =
        referrer === 'Direct'
          ? 'Direct'
          : (() => {
              try {
                return new URL(referrer).hostname
              } catch {
                return referrer
              }
            })()
      acc[domain] = (acc[domain] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const referrerData = Object.entries(referrerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }))

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      {/* Clicks over time */}
      <div className='card lg:col-span-2'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Lượt click theo ngày (7 ngày gần nhất)
        </h3>
        <div className='h-64'>
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={clicksByDay}>
              <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
              <XAxis dataKey='date' stroke='#6b7280' fontSize={12} />
              <YAxis stroke='#6b7280' fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [value, 'Clicks']}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
              />
              <Area
                type='monotone'
                dataKey='clicks'
                stroke='#3b82f6'
                fill='#93c5fd'
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Clicks by device */}
      <div className='card'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Thiết bị</h3>
        <div className='h-64'>
          {deviceData.length > 0 ? (
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx='50%'
                  cy='50%'
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey='value'
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {deviceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className='flex items-center justify-center h-full text-gray-500'>
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </div>

      {/* Clicks by browser */}
      <div className='card'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Trình duyệt</h3>
        <div className='h-64'>
          {browserData.length > 0 ? (
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={browserData} layout='vertical'>
                <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                <XAxis type='number' stroke='#6b7280' fontSize={12} allowDecimals={false} />
                <YAxis dataKey='name' type='category' stroke='#6b7280' fontSize={12} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey='value' fill='#3b82f6' radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className='flex items-center justify-center h-full text-gray-500'>
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </div>

      {/* Top referrers */}
      <div className='card lg:col-span-2'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Nguồn truy cập</h3>
        <div className='h-64'>
          {referrerData.length > 0 ? (
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={referrerData}>
                <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                <XAxis dataKey='name' stroke='#6b7280' fontSize={12} />
                <YAxis stroke='#6b7280' fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey='value' name='Clicks' fill='#10b981' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className='flex items-center justify-center h-full text-gray-500'>
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsCharts
