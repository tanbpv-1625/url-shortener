import { useState, type FormEvent } from 'react'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Card from '@/components/common/Card'
import type { ShortUrl } from '@/types/url'
import type { AsyncState } from '@/types/api'

interface UrlFormProps {
  createState: AsyncState<ShortUrl>
  validationError: string | null
  create: (rawUrl: string) => Promise<void>
  copyToClipboard: (shortCode: string) => Promise<void>
  reset: () => void
}

export default function UrlForm({
  createState,
  validationError,
  create,
  copyToClipboard,
  reset,
}: UrlFormProps) {
  const [url, setUrl] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    void create(url)
  }

  const handleNewUrl = () => {
    setUrl('')
    reset()
  }

  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin
  const shortUrl =
    createState.status === 'success' ? `${baseUrl}/${createState.data.shortCode}` : null

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
          <div className="flex-1">
            <Input
              placeholder="Paste your long URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              error={validationError ?? undefined}
              aria-label="URL to shorten"
              disabled={createState.status === 'loading'}
            />
          </div>
          <Button
            type="submit"
            loading={createState.status === 'loading'}
            disabled={!url.trim()}
            className="w-full md:w-auto"
          >
            Shorten
          </Button>
        </div>

        {createState.status === 'error' && (
          <p className="text-sm text-red-600" role="alert">
            {createState.error}
          </p>
        )}
      </form>

      {/* Generated short URL result */}
      {shortUrl && (
        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-gray-600 mb-2">Your short URL:</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-medium text-lg break-all hover:underline"
            >
              {shortUrl}
            </a>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  if (createState.status === 'success') {
                    void copyToClipboard(createState.data.shortCode)
                  }
                }}
              >
                Copy
              </Button>
              <Button size="sm" variant="secondary" onClick={handleNewUrl}>
                Shorten Another
              </Button>
            </div>
          </div>
          {createState.status === 'success' && (
            <p className="mt-2 text-xs text-gray-500">Original: {createState.data.originalUrl}</p>
          )}
        </div>
      )}
    </Card>
  )
}
