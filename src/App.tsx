import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Loading from '@/components/common/Loading'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { trackPageView } from '@/lib/ga'

const HomePage = lazy(() => import('@/pages/HomePage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const LinkDetailPage = lazy(() => import('@/pages/LinkDetailPage'))
const RedirectPage = lazy(() => import('@/pages/RedirectPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function PageViewTracker() {
  const location = useLocation()
  useEffect(() => {
    void trackPageView(location.pathname)
  }, [location.pathname])
  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <PageViewTracker />
      <Suspense fallback={<Loading className="min-h-screen" size="lg" />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/link/:shortCode" element={<LinkDetailPage />} />
          <Route path="/not-found" element={<NotFoundPage />} />
          <Route path="/:shortCode" element={<RedirectPage />} />
          <Route path="*" element={<Navigate to="/not-found" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
