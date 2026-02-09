import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export default function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-xl bg-white p-6 shadow-sm border border-gray-100', className)}
      {...props}
    >
      {children}
    </div>
  )
}
