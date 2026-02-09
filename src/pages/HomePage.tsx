import PageLayout from '@/components/layout/PageLayout'
import UrlForm from '@/components/url/UrlForm'
import UrlList from '@/components/url/UrlList'
import { useShortUrl } from '@/hooks/useShortUrl'

export default function HomePage() {
  const { createState, listState, validationError, create, copyToClipboard, reset, remove } =
    useShortUrl()

  return (
    <PageLayout>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">URL Shortener</h1>
          <p className="mt-2 text-gray-500">Create short URLs and track their performance.</p>
        </div>

        <UrlForm
          createState={createState}
          validationError={validationError}
          create={create}
          copyToClipboard={copyToClipboard}
          reset={reset}
        />

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Links</h2>
          <UrlList listState={listState} onDelete={remove} onCopy={copyToClipboard} />
        </div>
      </div>
    </PageLayout>
  )
}
