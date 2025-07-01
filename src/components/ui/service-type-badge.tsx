'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { validateColorAccessibility } from '@/lib/service-colors'

interface ServiceTypeBadgeProps {
  serviceType: {
    id: string
    name: string
    color?: string
  }
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'subtle'
  className?: string
  showIcon?: boolean
}

export default function ServiceTypeBadge({ 
  serviceType, 
  size = 'sm', 
  variant = 'default',
  className = '',
  showIcon = false
}: ServiceTypeBadgeProps) {
  const color = serviceType.color || '#10B981'
  const accessibility = validateColorAccessibility(color)
  
  // Generate inline styles for custom colors
  const getColorStyles = () => {
    switch (variant) {
      case 'outline':
        return {
          borderColor: color,
          color: color,
          backgroundColor: 'transparent'
        }
      case 'subtle':
        return {
          backgroundColor: `${color}15`, // 15% opacity
          color: color,
          borderColor: `${color}30` // 30% opacity
        }
      default:
        return {
          backgroundColor: color,
          color: accessibility.recommendedTextColor,
          borderColor: color
        }
    }
  }

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'lg':
        return 'px-3 py-1.5 text-sm'
      case 'md':
        return 'px-2.5 py-1 text-sm'
      default:
        return 'px-2 py-0.5 text-xs'
    }
  }

  // Service type icon mapping
  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase()
    if (name.includes('social')) return '📱'
    if (name.includes('website') || name.includes('web')) return '🌐'
    if (name.includes('seo')) return '🔍'
    if (name.includes('content') || name.includes('writing')) return '✍️'
    if (name.includes('brand') || name.includes('logo')) return '🎨'
    if (name.includes('video')) return '🎬'
    if (name.includes('photo')) return '📸'
    if (name.includes('email')) return '📧'
    if (name.includes('marketing')) return '📊'
    if (name.includes('analytics')) return '📈'
    if (name.includes('consulting')) return '💡'
    return '⚡'
  }

  const styles = getColorStyles()

  return (
    <Badge
      className={`
        inline-flex items-center gap-1 font-medium rounded-full border
        ${getSizeClasses()}
        ${className}
      `}
      style={styles}
    >
      {showIcon && (
        <span className="flex-shrink-0" role="img" aria-hidden="true">
          {getServiceIcon(serviceType.name)}
        </span>
      )}
      <span className="truncate">
        {serviceType.name}
      </span>
    </Badge>
  )
} 