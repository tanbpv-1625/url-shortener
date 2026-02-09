import { Link } from 'react-router-dom'
import PageLayout from '@/components/layout/PageLayout'

export default function NotFoundPage() {
  return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">Link not found</h2>
        <p className="mt-2 text-gray-500">
          The short URL you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-touch"
        >
          Go to Home
        </Link>
      </div>
    </PageLayout>
  )
}
