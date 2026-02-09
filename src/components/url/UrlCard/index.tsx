import { useState } from 'react'
import { format } from 'date-fns'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import type { ShortUrl } from '@/types/url'

interface UrlCardProps {
  url: ShortUrl
  onDelete: (shortCode: string) => Promise<void>
  onCopy: (shortCode: string) => Promise<void>
}

export default function UrlCard({ url, onDelete, onCopy }: UrlCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin
  const shortUrl = `${baseUrl}/${url.shortCode}`

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    await onDelete(url.shortCode)
    setConfirmDelete(false)
  }

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <a
          href={shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 font-medium hover:underline break-all"
        >
          {shortUrl}
        </a>
        <p className="mt-1 text-sm text-gray-500 truncate" title={url.originalUrl}>
          {url.originalUrl}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
          <span>{format(url.createdAt, 'MMM d, yyyy')}</span>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 font-medium">
            {url.clickCount} {url.clickCount === 1 ? 'click' : 'clicks'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" variant="secondary" onClick={() => void onCopy(url.shortCode)}>
          Copy
        </Button>
        <Button
          size="sm"
          variant={confirmDelete ? 'danger' : 'secondary'}
          onClick={() => void handleDelete()}
          onBlur={() => setConfirmDelete(false)}
        >
          {confirmDelete ? 'Confirm?' : 'Delete'}
        </Button>
      </div>
    </Card>
  )
}
