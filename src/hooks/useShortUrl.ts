import { useState, useCallback, useEffect } from 'react'
import type { ShortUrl } from '@/types/url'
import type { AsyncState } from '@/types/api'
import {
  createShortUrl,
  validateAndNormalizeUrl,
  listUrls,
  deleteUrl,
} from '@/services/url-service'
import { useToast } from '@/components/common/Toast'
import { trackEvent } from '@/lib/ga'

interface UseShortUrlReturn {
  createState: AsyncState<ShortUrl>
  listState: AsyncState<ShortUrl[]>
  validationError: string | null
  create: (rawUrl: string) => Promise<void>
  copyToClipboard: (shortCode: string) => Promise<void>
  reset: () => void
  refreshList: () => void
  remove: (shortCode: string) => Promise<void>
}

export function useShortUrl(): UseShortUrlReturn {
  const [createState, setCreateState] = useState<AsyncState<ShortUrl>>({ status: 'idle' })
  const [listState, setListState] = useState<AsyncState<ShortUrl[]>>({ status: 'loading' })
  const [validationError, setValidationError] = useState<string | null>(null)
  const [listTrigger, setListTrigger] = useState(0)
  const { showToast } = useToast()

  // Fetch list on mount and when trigger changes
  useEffect(() => {
    let cancelled = false

    listUrls()
      .then((urls) => {
        if (!cancelled) setListState({ status: 'success', data: urls })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load URLs'
          setListState({ status: 'error', error: message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [listTrigger])

  const refreshList = useCallback(() => {
    setListState({ status: 'loading' })
    setListTrigger((t) => t + 1)
  }, [])

  const create = useCallback(
    async (rawUrl: string) => {
      // Client-side validation first
      try {
        validateAndNormalizeUrl(rawUrl)
        setValidationError(null)
      } catch (err) {
        setValidationError(err instanceof Error ? err.message : 'Invalid URL')
        return
      }

      setCreateState({ status: 'loading' })

      try {
        const result = await createShortUrl(rawUrl)
        setCreateState({ status: 'success', data: result })
        showToast('Short URL created!', 'success')
        void trackEvent('url_created', { short_code: result.shortCode })
        // Refresh list after creating
        refreshList()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create short URL'
        setCreateState({ status: 'error', error: message })
        showToast(message, 'error')
      }
    },
    [showToast, refreshList],
  )

  const remove = useCallback(
    async (shortCode: string) => {
      try {
        await deleteUrl(shortCode)
        showToast('Link deleted successfully', 'success')
        void trackEvent('url_deleted', { short_code: shortCode })
        refreshList()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete link'
        showToast(message, 'error')
      }
    },
    [showToast, refreshList],
  )

  const copyToClipboard = useCallback(
    async (shortCode: string) => {
      const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin
      const shortUrl = `${baseUrl}/${shortCode}`

      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shortUrl)
        } else {
          // Fallback for older browsers
          const textarea = document.createElement('textarea')
          textarea.value = shortUrl
          textarea.style.position = 'fixed'
          textarea.style.opacity = '0'
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand('copy')
          document.body.removeChild(textarea)
        }
        showToast('Copied to clipboard!', 'success')
        void trackEvent('url_copied', { short_code: shortCode })
      } catch {
        showToast('Failed to copy. Please copy manually.', 'error')
      }
    },
    [showToast],
  )

  const reset = useCallback(() => {
    setCreateState({ status: 'idle' })
    setValidationError(null)
  }, [])

  return {
    createState,
    listState,
    validationError,
    create,
    copyToClipboard,
    reset,
    refreshList,
    remove,
  }
}
