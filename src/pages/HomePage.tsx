import UrlShortenerForm from '../components/UrlShortenerForm'
import { Link } from 'react-router-dom'
import { BarChart3, Zap, Shield, MousePointer } from 'lucide-react'

const HomePage = () => {
  const features = [
    {
      icon: Zap,
      title: 'Nhanh chóng',
      description: 'Tạo link rút gọn chỉ trong vài giây',
    },
    {
      icon: MousePointer,
      title: 'Click Analytics',
      description: 'Theo dõi số lượt click, nguồn, thiết bị',
    },
    {
      icon: BarChart3,
      title: 'Dashboard đầy đủ',
      description: 'Thống kê theo ngày, tuần với biểu đồ trực quan',
    },
    {
      icon: Shield,
      title: 'Miễn phí',
      description: 'Sử dụng hoàn toàn miễn phí, không giới hạn',
    },
  ]

  return (
    <div className='space-y-12'>
      {/* Hero Section */}
      <div className='text-center py-8'>
        <h1 className='text-4xl sm:text-5xl font-bold text-gray-900 mb-4'>
          Rút gọn URL với <span className='text-primary-600'>Analytics</span>
        </h1>
        <p className='text-xl text-gray-500 max-w-2xl mx-auto'>
          Tạo link ngắn gọn và theo dõi hiệu suất với click analytics đầy đủ. Hoàn toàn miễn phí!
        </p>
      </div>

      {/* URL Shortener Form */}
      <UrlShortenerForm />

      {/* Features Grid */}
      <div className='pt-8'>
        <h2 className='text-2xl font-bold text-gray-900 text-center mb-8'>Tính năng nổi bật</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className='card text-center hover:shadow-md transition-shadow'>
                <div className='inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-4'>
                  <Icon className='w-6 h-6 text-primary-600' />
                </div>
                <h3 className='font-semibold text-gray-900 mb-2'>{feature.title}</h3>
                <p className='text-sm text-gray-500'>{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div className='text-center py-8'>
        <p className='text-gray-500 mb-4'>Đã có links? Xem thống kê ngay!</p>
        <Link to='/dashboard' className='btn-primary inline-flex items-center gap-2'>
          <BarChart3 className='w-5 h-5' />
          Đi đến Dashboard
        </Link>
      </div>
    </div>
  )
}

export default HomePage
