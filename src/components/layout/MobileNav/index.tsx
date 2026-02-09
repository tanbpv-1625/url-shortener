import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavLink {
  readonly to: string
  readonly label: string
}

export interface MobileNavProps {
  open: boolean
  onClose: () => void
  links: readonly NavLink[]
}

export default function MobileNav({ open, onClose, links }: MobileNavProps) {
  const location = useLocation()

  if (!open) return null

  return (
    <div className="md:hidden border-t border-gray-200 bg-white">
      <div className="px-4 py-2 space-y-1">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={cn(
              'block px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-touch',
              location.pathname === link.to
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
