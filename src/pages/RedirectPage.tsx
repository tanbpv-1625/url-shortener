import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUrlByShortCode, recordClick } from '../lib/urlService'
import { trackLinkClick } from '../lib/analytics'
import { Loader2, AlertCircle } from 'lucide-react'

const RedirectPage = () => {
  const { shortCode } = useParams<{ shortCode: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const handleRedirect = async () => {
      if (!shortCode) {
        setError('Link không hợp lệ')
        return
      }

      try {
        const urlData = await getUrlByShortCode(shortCode)

        if (!urlData) {
          setError('Link không tồn tại hoặc đã bị xóa')
          return
        }

        if (!urlData.isActive) {
          setError('Link này đã bị vô hiệu hóa')
          return
        }

        // Record click with analytics
        const referrer = document.referrer
        const userAgent = navigator.userAgent

        await recordClick(urlData.id, shortCode, referrer, userAgent)
        trackLinkClick(shortCode, urlData.originalUrl)

        // Redirect countdown
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              window.location.href = urlData.originalUrl
              return 0
            }
            return prev - 1
          })
        }, 1000)

        return () => clearInterval(timer)
      } catch (err) {
        console.error('Error during redirect:', err)
        setError('Có lỗi xảy ra. Vui lòng thử lại.')
      }
    }

    handleRedirect()
  }, [shortCode])

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <div className='card max-w-md w-full text-center'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4'>
            <AlertCircle className='w-8 h-8 text-red-600' />
          </div>
          <h1 className='text-xl font-bold text-gray-900 mb-2'>Không thể chuyển hướng</h1>
          <p className='text-gray-500 mb-6'>{error}</p>
          <button onClick={() => navigate('/')} className='btn-primary'>
            Về trang chủ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <div className='card max-w-md w-full text-center'>
        <Loader2 className='w-12 h-12 text-primary-600 animate-spin mx-auto mb-4' />
        <h1 className='text-xl font-bold text-gray-900 mb-2'>Đang chuyển hướng...</h1>
        <p className='text-gray-500'>
          Bạn sẽ được chuyển hướng sau{' '}
          <span className='font-bold text-primary-600'>{countdown}</span> giây
        </p>
        <div className='mt-4 w-full bg-gray-200 rounded-full h-2'>
          <div
            className='bg-primary-600 h-2 rounded-full transition-all duration-1000'
            style={{ width: `${((3 - countdown) / 3) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default RedirectPage
