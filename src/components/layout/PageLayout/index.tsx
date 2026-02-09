import type { ReactNode } from 'react'
import Navbar from '@/components/layout/Navbar'

export interface PageLayoutProps {
  children: ReactNode
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
