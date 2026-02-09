import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import Card from '@/components/common/Card'
import type { ShortUrl } from '@/types/url'

interface TopLinksTableProps {
  links: ShortUrl[]
}

function truncateUrl(url: string, maxLength = 40): string {
  if (url.length <= maxLength) return url
  return url.slice(0, maxLength) + '...'
}

export default function TopLinksTable({ links }: TopLinksTableProps) {
  const navigate = useNavigate()
  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Links</h3>

      {links.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No links created yet.</p>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Short URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {links.map((link) => (
                <tr
                  key={link.shortCode}
                  onClick={() => navigate(`/link/${link.shortCode}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  role="link"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/link/${link.shortCode}`)
                    }
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {baseUrl}/{link.shortCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {truncateUrl(link.originalUrl)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {format(link.createdAt, 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {link.clickCount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
