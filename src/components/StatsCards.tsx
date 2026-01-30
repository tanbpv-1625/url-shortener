import { Link, MousePointer, TrendingUp, Calendar } from 'lucide-react'
import { DashboardStats } from '../types'

interface StatsCardsProps {
  stats: DashboardStats
  isLoading?: boolean
}

const StatsCards = ({ stats, isLoading }: StatsCardsProps) => {
  const cards = [
    {
      title: 'Tổng số links',
      value: stats.totalLinks,
      icon: Link,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Tổng lượt click',
      value: stats.totalClicks,
      icon: MousePointer,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Click hôm nay',
      value: stats.clicksToday,
      icon: Calendar,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Click tuần này',
      value: stats.clicksThisWeek,
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
  ]

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className='card animate-pulse'>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 bg-gray-200 rounded-lg' />
              <div className='flex-1'>
                <div className='h-4 bg-gray-200 rounded w-20 mb-2' />
                <div className='h-6 bg-gray-200 rounded w-16' />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div key={index} className='card'>
            <div className='flex items-center gap-4'>
              <div className={`p-3 ${card.bgColor} rounded-lg`}>
                <Icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
              </div>
              <div>
                <p className='text-sm text-gray-500'>{card.title}</p>
                <p className='text-2xl font-bold text-gray-900'>{card.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default StatsCards
