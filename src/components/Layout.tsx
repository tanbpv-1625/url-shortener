import { Outlet, Link, useLocation } from 'react-router-dom'
import { Link2, BarChart3, Home } from 'lucide-react'

const Layout = () => {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Trang chủ', icon: Home },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  ]

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b border-gray-100'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            {/* Logo */}
            <Link to='/' className='flex items-center gap-2'>
              <div className='bg-primary-600 p-2 rounded-lg'>
                <Link2 className='w-5 h-5 text-white' />
              </div>
              <span className='font-bold text-xl text-gray-900'>URL Shortener</span>
            </Link>

            {/* Navigation */}
            <nav className='flex items-center gap-1'>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className='w-4 h-4' />
                    <span className='hidden sm:inline'>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className='bg-white border-t border-gray-100 mt-auto'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <p className='text-center text-gray-500 text-sm'>
            © 2026 URL Shortener. Built with React + Firebase.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
