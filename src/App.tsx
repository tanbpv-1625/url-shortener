import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import RedirectPage from './pages/RedirectPage'
import LinkDetailPage from './pages/LinkDetailPage'

function App() {
  return (
    <Routes>
      {/* Redirect route - no layout */}
      <Route path='/r/:shortCode' element={<RedirectPage />} />

      {/* Main routes with layout */}
      <Route path='/' element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path='dashboard' element={<DashboardPage />} />
        <Route path='link/:shortCode' element={<LinkDetailPage />} />
      </Route>
    </Routes>
  )
}

export default App
