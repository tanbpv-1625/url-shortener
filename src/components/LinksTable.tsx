import { Link } from 'react-router-dom'
import { ExternalLink, Copy, Trash2, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { UrlData } from '../types'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface LinksTableProps {
  links: UrlData[]
  onDelete: (id: string, shortCode: string) => void
  isLoading?: boolean
}

const LinksTable = ({ links, onDelete, isLoading }: LinksTableProps) => {
  const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

  const handleCopy = async (shortCode: string) => {
    try {
      await navigator.clipboard.writeText(`${APP_URL}/r/${shortCode}`)
      toast.success('Đã copy link!')
    } catch {
      toast.error('Không thể copy link')
    }
  }

  const truncateUrl = (url: string, maxLength: number = 50): string => {
    if (url.length <= maxLength) return url
    return url.substring(0, maxLength) + '...'
  }

  if (isLoading) {
    return (
      <div className='card'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Links của bạn</h3>
        <div className='space-y-3'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-lg'
            >
              <div className='flex-1'>
                <div className='h-4 bg-gray-200 rounded w-32 mb-2' />
                <div className='h-3 bg-gray-200 rounded w-64' />
              </div>
              <div className='h-8 w-16 bg-gray-200 rounded' />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (links.length === 0) {
    return (
      <div className='card text-center py-12'>
        <div className='inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4'>
          <ExternalLink className='w-8 h-8 text-gray-400' />
        </div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>Chưa có link nào</h3>
        <p className='text-gray-500'>Tạo link rút gọn đầu tiên của bạn!</p>
      </div>
    )
  }

  return (
    <div className='card overflow-hidden'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>Links của bạn</h3>

      <div className='overflow-x-auto -mx-6'>
        <table className='w-full'>
          <thead className='bg-gray-50 border-y border-gray-100'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Short Link
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                URL gốc
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Clicks
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Ngày tạo
              </th>
              <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100'>
            {links.map((link) => (
              <tr key={link.id} className='hover:bg-gray-50 transition-colors'>
                <td className='px-6 py-4'>
                  <div className='flex items-center gap-2'>
                    <a
                      href={`${APP_URL}/r/${link.shortCode}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-primary-600 hover:text-primary-700 font-medium'
                    >
                      /r/{link.shortCode}
                    </a>
                    <button
                      onClick={() => handleCopy(link.shortCode)}
                      className='p-1 text-gray-400 hover:text-gray-600 transition-colors'
                      title='Copy link'
                    >
                      <Copy className='w-4 h-4' />
                    </button>
                  </div>
                </td>
                <td className='px-6 py-4'>
                  <a
                    href={link.originalUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-gray-600 hover:text-gray-900 text-sm'
                    title={link.originalUrl}
                  >
                    {truncateUrl(link.originalUrl)}
                  </a>
                </td>
                <td className='px-6 py-4'>
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                    {link.clickCount.toLocaleString()}
                  </span>
                </td>
                <td className='px-6 py-4 text-sm text-gray-500'>
                  {format(link.createdAt, 'dd/MM/yyyy HH:mm', { locale: vi })}
                </td>
                <td className='px-6 py-4 text-right'>
                  <div className='flex items-center justify-end gap-2'>
                    <Link
                      to={`/link/${link.shortCode}`}
                      className='p-2 text-gray-400 hover:text-primary-600 transition-colors'
                      title='Xem analytics'
                    >
                      <BarChart2 className='w-4 h-4' />
                    </Link>
                    <button
                      onClick={() => onDelete(link.id, link.shortCode)}
                      className='p-2 text-gray-400 hover:text-red-600 transition-colors'
                      title='Xóa link'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LinksTable
