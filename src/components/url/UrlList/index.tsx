import type { ShortUrl } from '@/types/url'
import type { AsyncState } from '@/types/api'
import UrlCard from '@/components/url/UrlCard'
import EmptyState from '@/components/common/EmptyState'
import Loading from '@/components/common/Loading'

interface UrlListProps {
  listState: AsyncState<ShortUrl[]>
  onDelete: (shortCode: string) => Promise<void>
  onCopy: (shortCode: string) => Promise<void>
}

export default function UrlList({ listState, onDelete, onCopy }: UrlListProps) {
  if (listState.status === 'loading' || listState.status === 'idle') {
    return <Loading />
  }

  if (listState.status === 'error') {
    return (
      <p className="text-sm text-red-600 text-center py-4" role="alert">
        {listState.error}
      </p>
    )
  }

  const urls = listState.data
  if (urls.length === 0) {
    return <EmptyState title="No links yet" description="Create your first short URL above!" />
  }

  return (
    <div className="space-y-3" role="list" aria-label="Shortened URLs">
      {urls.map((url) => (
        <div key={url.shortCode} role="listitem">
          <UrlCard url={url} onDelete={onDelete} onCopy={onCopy} />
        </div>
      ))}
    </div>
  )
}
