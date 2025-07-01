import React from 'react'
import { Badge } from '@/components/ui/badge'

export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'ARCHIVED'
export type ServiceStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED'
export type DeliverableStatus = 'PENDING' | 'IN_PROGRESS' | 'NEEDS_REVIEW' | 'COMPLETED' | 'OVERDUE'

interface StatusBadgeProps {
  status: ClientStatus | ServiceStatus | DeliverableStatus
  type?: 'client' | 'service' | 'deliverable'
  size?: 'sm' | 'default'
}

const getStatusColor = (status: ClientStatus | ServiceStatus | DeliverableStatus, type: 'client' | 'service' | 'deliverable' = 'client') => {
  if (type === 'deliverable') {
    switch (status as DeliverableStatus) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'NEEDS_REVIEW':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  } else if (type === 'service') {
    switch (status as ServiceStatus) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  } else {
    switch (status as ClientStatus) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ARCHIVED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
}

const getStatusText = (status: ClientStatus | ServiceStatus | DeliverableStatus) => {
  switch (status) {
    case 'ACTIVE':
      return 'Active'
    case 'INACTIVE':
      return 'Inactive'
    case 'PAUSED':
      return 'Paused'
    case 'ARCHIVED':
      return 'Archived'
    case 'COMPLETED':
      return 'Completed'
    case 'CANCELLED':
      return 'Cancelled'
    case 'PENDING':
      return 'Pending'
    case 'IN_PROGRESS':
      return 'In Progress'
    case 'NEEDS_REVIEW':
      return 'Needs Review'
    case 'OVERDUE':
      return 'Overdue'
    default:
      return status
  }
}

export function StatusBadge({ status, type = 'client', size = 'default' }: StatusBadgeProps) {
  const colorClasses = getStatusColor(status, type)
  const text = getStatusText(status)
  
  return (
    <span
      className={`
        inline-flex items-center font-medium border rounded-full
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-sm'}
        ${colorClasses}
      `}
    >
      {text}
    </span>
  )
}

export default StatusBadge 