import { useState } from 'react'
import { Link2, Copy, Check, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { createShortUrl } from '../lib/urlService'
import { trackLinkCreate } from '../lib/analytics'

const UrlShortenerForm = () => {
  const [url, setUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

  const isValidUrl = (string: string): boolean => {
    try {
      const url = new URL(string)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      toast.error('Vui lòng nhập URL')
      return
    }

    if (!isValidUrl(url)) {
      toast.error('URL không hợp lệ. Vui lòng nhập URL đầy đủ (bao gồm http:// hoặc https://)')
      return
    }

    setIsLoading(true)

    try {
      console.log('Creating short URL for:', url)
      const result = await createShortUrl(url)
      console.log('Result:', result)
      const fullShortUrl = `${APP_URL}/r/${result.shortCode}`
      setShortUrl(fullShortUrl)
      trackLinkCreate(result.shortCode)
      toast.success('Tạo link rút gọn thành công!')
    } catch (error: unknown) {
      console.error('Error creating short URL:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Lỗi: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl)
      setCopied(true)
      toast.success('Đã copy link!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Không thể copy link')
    }
  }

  const handleReset = () => {
    setUrl('')
    setShortUrl('')
    setCopied(false)
  }

  return (
    <div className='card max-w-2xl mx-auto'>
      <div className='text-center mb-8'>
        <div className='inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4'>
          <Link2 className='w-8 h-8 text-primary-600' />
        </div>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>Rút gọn URL của bạn</h1>
        <p className='text-gray-500'>Dán link dài và nhận link ngắn với analytics đầy đủ</p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label htmlFor='url' className='block text-sm font-medium text-gray-700 mb-2'>
            URL gốc
          </label>
          <input
            type='text'
            id='url'
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder='https://example.com/your-very-long-url-here'
            className='input-field'
            disabled={isLoading}
          />
        </div>

        <button
          type='submit'
          disabled={isLoading || !url.trim()}
          className='btn-primary w-full flex items-center justify-center gap-2'
        >
          {isLoading ? (
            <>
              <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
              Đang tạo...
            </>
          ) : (
            <>
              <Link2 className='w-5 h-5' />
              Rút gọn URL
            </>
          )}
        </button>
      </form>

      {shortUrl && (
        <div className='mt-6 p-4 bg-green-50 border border-green-200 rounded-lg'>
          <p className='text-sm font-medium text-green-800 mb-2'>Link rút gọn của bạn:</p>
          <div className='flex items-center gap-2'>
            <input
              type='text'
              value={shortUrl}
              readOnly
              className='flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg text-green-700 font-mono text-sm'
            />
            <button
              onClick={handleCopy}
              className='p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors'
              title='Copy link'
            >
              {copied ? <Check className='w-5 h-5' /> : <Copy className='w-5 h-5' />}
            </button>
            <a
              href={shortUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors'
              title='Mở link'
            >
              <ExternalLink className='w-5 h-5' />
            </a>
          </div>
          <button
            onClick={handleReset}
            className='mt-3 text-sm text-green-600 hover:text-green-700 font-medium'
          >
            Tạo link mới
          </button>
        </div>
      )}
    </div>
  )
}

export default UrlShortenerForm
