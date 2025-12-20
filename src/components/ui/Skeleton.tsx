import React from 'react'
import { cn } from '@/lib/utils'

// Base Skeleton component
export interface SkeletonProps {
  className?: string
  variant?: 'default' | 'rounded' | 'circular'
  animate?: boolean
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', animate = true, ...props }, ref) => {
    const baseClasses = 'bg-gray-200 dark:bg-gray-700'

    const variantClasses = {
      default: 'rounded-md',
      rounded: 'rounded-lg',
      circular: 'rounded-full',
    }

    const animationClasses = animate
      ? 'animate-pulse'
      : ''

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          animationClasses,
          className
        )}
        {...props}
      />
    )
  }
)

Skeleton.displayName = 'Skeleton'

// Specific skeleton components for common patterns
export const SkeletonText = ({
  lines = 1,
  className,
  ...props
}: {
  lines?: number
  className?: string
} & Omit<SkeletonProps, 'className'>) => {
  if (lines === 1) {
    return <Skeleton className={cn('h-4 w-full', className)} {...props} />
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full' // Last line is shorter
          )}
          {...props}
        />
      ))}
    </div>
  )
}

export const SkeletonAvatar = ({
  size = 'md',
  className,
  ...props
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
} & Omit<SkeletonProps, 'className'>) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }

  return (
    <Skeleton
      variant="circular"
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  )
}

export const SkeletonButton = ({
  className,
  ...props
}: {
  className?: string
} & Omit<SkeletonProps, 'className'>) => {
  return (
    <Skeleton
      className={cn('h-10 w-24 rounded-md', className)}
      {...props}
    />
  )
}

export const SkeletonCard = ({
  className,
  showAvatar = false,
  lines = 3,
  ...props
}: {
  className?: string
  showAvatar?: boolean
  lines?: number
} & Omit<SkeletonProps, 'className'>) => {
  return (
    <div className={cn('p-6 space-y-4 border rounded-lg', className)}>
      {showAvatar && (
        <div className="flex items-center space-x-4">
          <SkeletonAvatar size="md" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/6" />
          </div>
        </div>
      )}
      <SkeletonText lines={lines} />
      <div className="flex space-x-2">
        <SkeletonButton />
        <SkeletonButton />
      </div>
    </div>
  )
}

export const SkeletonTable = ({
  rows = 5,
  columns = 4,
  className,
  ...props
}: {
  rows?: number
  columns?: number
  className?: string
} & Omit<SkeletonProps, 'className'>) => {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Table header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 flex-1" {...props} />
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4">
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className={cn(
                'h-4 flex-1',
                colIndex === columns - 1 && 'w-1/4' // Last column narrower
              )}
              {...props}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export const SkeletonList = ({
  items = 3,
  className,
  ...props
}: {
  items?: number
  className?: string
} & Omit<SkeletonProps, 'className'>) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }, (_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <SkeletonAvatar size="sm" {...props} />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" {...props} />
            <Skeleton className="h-3 w-1/2" {...props} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Loading overlay component
interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  className?: string
  skeleton?: React.ReactNode
}

export const LoadingOverlay = ({
  isLoading,
  children,
  className,
  skeleton,
}: LoadingOverlayProps) => {
  if (!isLoading) {
    return <>{children}</>
  }

  return (
    <div className={cn('relative', className)}>
      {skeleton || (
        <div className="space-y-4">
          <SkeletonText lines={3} />
          <SkeletonCard />
        </div>
      )}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    </div>
  )
}

// Export all skeleton components
export default Skeleton
