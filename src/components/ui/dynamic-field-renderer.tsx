'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Type,
  AlignLeft,
  Calendar,
  Link,
  List,
  Hash,
  CheckSquare,
  AlertCircle
} from 'lucide-react'

// Types
export interface DeliverableField {
  id: string
  name: string
  slug: string
  type: 'TEXT' | 'TEXTAREA' | 'DATE' | 'URL' | 'SELECT' | 'NUMBER' | 'CHECKBOX'
  isRequired: boolean
  sortOrder: number
  defaultValue?: string
  placeholder?: string
  helpText?: string
  options?: string[]
  minLength?: number
  maxLength?: number
  minValue?: number
  maxValue?: number
  pattern?: string
}

interface DynamicFieldRendererProps {
  field: DeliverableField
  value: any
  onChange: (value: any) => void
  error?: string
  disabled?: boolean
}

// Field type configurations
const FIELD_TYPES = {
  TEXT: { icon: Type, label: 'Text' },
  TEXTAREA: { icon: AlignLeft, label: 'Text Area' },
  DATE: { icon: Calendar, label: 'Date' },
  URL: { icon: Link, label: 'URL' },
  SELECT: { icon: List, label: 'Dropdown' },
  NUMBER: { icon: Hash, label: 'Number' },
  CHECKBOX: { icon: CheckSquare, label: 'Checkbox' }
}

export default function DynamicFieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled = false
}: DynamicFieldRendererProps) {
  const config = FIELD_TYPES[field.type]
  const Icon = config.icon

  const handleChange = (newValue: any) => {
    // Convert checkbox value to boolean
    if (field.type === 'CHECKBOX') {
      onChange(newValue.target.checked)
    } else {
      onChange(newValue.target.value)
    }
  }

  const renderField = () => {
    switch (field.type) {
      case 'TEXT':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
            disabled={disabled}
            minLength={field.minLength}
            maxLength={field.maxLength}
            pattern={field.pattern}
            className={error ? 'border-red-500' : ''}
          />
        )

      case 'TEXTAREA':
        return (
          <textarea
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
            disabled={disabled}
            minLength={field.minLength}
            maxLength={field.maxLength}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        )

      case 'DATE':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
          />
        )

      case 'URL':
        return (
          <Input
            type="url"
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder || 'https://example.com'}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
          />
        )

      case 'SELECT':
        return (
          <select
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select {field.name.toLowerCase()}...</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'NUMBER':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder || '0'}
            disabled={disabled}
            min={field.minValue}
            max={field.maxValue}
            className={error ? 'border-red-500' : ''}
          />
        )

      case 'CHECKBOX':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={handleChange}
              disabled={disabled}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">{field.name}</span>
          </div>
        )

      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={handleChange}
            placeholder={`Enter ${field.name.toLowerCase()}`}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {field.name}
          {field.isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </div>

      {field.helpText && (
        <p className="text-xs text-gray-500">{field.helpText}</p>
      )}

      {renderField()}

      {error && (
        <div className="flex items-center space-x-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
} 