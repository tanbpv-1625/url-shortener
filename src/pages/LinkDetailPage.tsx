import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Copy, Calendar, MousePointer } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import toast from 'react-hot-toast'
import AnalyticsCharts from '../components/AnalyticsCharts'
import { UrlData, ClickData } from '../types'
import { getUrlByShortCode, getClicksByUrl } from '../lib/urlService'

const LinkDetailPage = () => {
  const { shortCode } = useParams<{ shortCode: string }>()
  const navigate = useNavigate()
  const [urlData, setUrlData] = useState<UrlData | null>(null)
  const [clicks, setClicks] = useState<ClickData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

  useEffect(() => {
    const fetchData = async () => {
      if (!shortCode) return

      try {
        const [url, clicksData] = await Promise.all([
          getUrlByShortCode(shortCode),
          getClicksByUrl(shortCode),
        ])

        if (!url) {
          toast.error('Link không tồn tại')
          navigate('/dashboard')
          return
        }

        setUrlData(url)
        setClicks(clicksData)
      } catch (error) {
        console.error('Error fetching link data:', error)
        toast.error('Không thể tải dữ liệu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [shortCode, navigate])

  const handleCopy = async () => {
    if (!shortCode) return
    try {
      await navigator.clipboard.writeText(`${APP_URL}/r/${shortCode}`)
      toast.success('Đã copy link!')
    } catch {
      toast.error('Không thể copy link')
    }
  }

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-48 mb-4' />
          <div className='card'>
            <div className='h-6 bg-gray-200 rounded w-64 mb-2' />
            <div className='h-4 bg-gray-200 rounded w-96' />
          </div>
        </div>
      </div>
    )
  }

  if (!urlData) {
    return null
  }

  return (
    <div className='space-y-6'>
      {/* Back button */}
      <Link
        to='/dashboard'
        className='inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors'
      >
        <ArrowLeft className='w-4 h-4' />
        Quay lại Dashboard
      </Link>

      {/* Link Info Card */}
      <div className='card'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-2'>
              <h1 className='text-xl font-bold text-gray-900'>/r/{shortCode}</h1>
              <button
                onClick={handleCopy}
                className='p-1.5 text-gray-400 hover:text-gray-600 transition-colors'
                title='Copy link'
              >
                <Copy className='w-4 h-4' />
              </button>
            </div>
            <a
              href={urlData.originalUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-gray-500 hover:text-primary-600 flex items-center gap-1 truncate'
            >
              {urlData.originalUrl}
              <ExternalLink className='w-4 h-4 flex-shrink-0' />
            </a>
          </div>

          <div className='flex items-center gap-6'>
            <div className='text-center'>
              <div className='flex items-center gap-1 text-gray-500 text-sm mb-1'>
                <MousePointer className='w-4 h-4' />
                Clicks
              </div>
              <p className='text-2xl font-bold text-primary-600'>
                {urlData.clickCount.toLocaleString()}
              </p>
            </div>
            <div className='text-center'>
              <div className='flex items-center gap-1 text-gray-500 text-sm mb-1'>
                <Calendar className='w-4 h-4' />
                Ngày tạo
              </div>
              <p className='font-medium text-gray-900'>
                {format(urlData.createdAt, 'dd/MM/yyyy', { locale: vi })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <AnalyticsCharts clicks={clicks} />

      {/* Recent Clicks Table */}
      <div className='card'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Lượt click gần đây ({clicks.length})
        </h3>

        {clicks.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>Chưa có lượt click nào</div>
        ) : (
          <div className='overflow-x-auto -mx-6'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-y border-gray-100'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Thời gian
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Thiết bị
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Trình duyệt
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Hệ điều hành
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Nguồn
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {clicks.slice(0, 20).map((click) => (
                  <tr key={click.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-3 text-sm text-gray-900'>
                      {format(click.timestamp, 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                    </td>
                    <td className='px-6 py-3 text-sm'>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          click.device === 'mobile'
                            ? 'bg-green-100 text-green-800'
                            : click.device === 'tablet'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {click.device === 'mobile'
                          ? 'Mobile'
                          : click.device === 'tablet'
                            ? 'Tablet'
                            : 'Desktop'}
                      </span>
                    </td>
                    <td className='px-6 py-3 text-sm text-gray-600'>{click.browser}</td>
                    <td className='px-6 py-3 text-sm text-gray-600'>{click.os}</td>
                    <td className='px-6 py-3 text-sm text-gray-600 max-w-xs truncate'>
                      {click.referrer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default LinkDetailPage
