import { useState, useEffect } from 'react'
import { startOfDay, startOfWeek, isAfter } from 'date-fns'
import toast from 'react-hot-toast'
import StatsCards from '../components/StatsCards'
import LinksTable from '../components/LinksTable'
import AnalyticsCharts from '../components/AnalyticsCharts'
import { UrlData, ClickData, DashboardStats } from '../types'
import { getAllUrls, getAllClicks, deleteUrl } from '../lib/urlService'
import { RefreshCw } from 'lucide-react'

const DashboardPage = () => {
  const [urls, setUrls] = useState<UrlData[]>([])
  const [clicks, setClicks] = useState<ClickData[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalLinks: 0,
    totalClicks: 0,
    clicksToday: 0,
    clicksThisWeek: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      const [urlsData, clicksData] = await Promise.all([getAllUrls(), getAllClicks()])

      setUrls(urlsData)
      setClicks(clicksData)

      // Calculate stats
      const today = startOfDay(new Date())
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

      const clicksToday = clicksData.filter((click) => isAfter(click.timestamp, today)).length

      const clicksThisWeek = clicksData.filter((click) =>
        isAfter(click.timestamp, weekStart),
      ).length

      setStats({
        totalLinks: urlsData.length,
        totalClicks: clicksData.length,
        clicksToday,
        clicksThisWeek,
      })
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Không thể tải dữ liệu. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchData()
  }

  const handleDelete = async (id: string, shortCode: string) => {
    if (!confirm('Bạn có chắc muốn xóa link này?')) return

    try {
      await deleteUrl(id, shortCode)
      toast.success('Đã xóa link!')
      fetchData()
    } catch (error) {
      console.error('Error deleting URL:', error)
      toast.error('Không thể xóa link. Vui lòng thử lại.')
    }
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Dashboard</h1>
          <p className='text-gray-500'>Tổng quan về links và analytics</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className='btn-secondary flex items-center gap-2'
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={isLoading} />

      {/* Charts */}
      <AnalyticsCharts clicks={clicks} isLoading={isLoading} />

      {/* Links Table */}
      <LinksTable links={urls} onDelete={handleDelete} isLoading={isLoading} />
    </div>
  )
}

export default DashboardPage
