'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  GripVertical,
  Type,
  AlignLeft,
  Calendar,
  Link,
  List,
  Hash,
  CheckSquare,
  Settings,
  Trash2,
  Plus,
  Eye,
  Copy,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react'
import { toast } from 'sonner'

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

interface FieldTypeConfig {
  type: DeliverableField['type']
  label: string
  icon: React.ComponentType<any>
  description: string
  example: string
  color: string
}

interface DraggableFieldBuilderProps {
  fields: DeliverableField[]
  onFieldsChange: (fields: DeliverableField[]) => void
  onFieldEdit: (field: DeliverableField) => void
  onFieldDelete: (fieldId: string) => void
  onFieldDuplicate: (field: DeliverableField) => void
  onFieldMove: (fieldId: string, direction: 'up' | 'down') => void
}

// Field type configurations with enhanced styling
const FIELD_TYPES: FieldTypeConfig[] = [
  { 
    type: 'TEXT', 
    label: 'Short Text', 
    icon: Type, 
    description: 'Single line text input',
    example: 'Project title, client name',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  { 
    type: 'TEXTAREA', 
    label: 'Long Text', 
    icon: AlignLeft, 
    description: 'Multi-line text area',
    example: 'Description, notes, feedback',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  { 
    type: 'DATE', 
    label: 'Date', 
    icon: Calendar, 
    description: 'Date picker',
    example: 'Due date, launch date',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  { 
    type: 'URL', 
    label: 'URL', 
    icon: Link, 
    description: 'Website or file link',
    example: 'Asset links, references',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  { 
    type: 'SELECT', 
    label: 'Dropdown', 
    icon: List, 
    description: 'Single selection from options',
    example: 'Priority, status, category',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  { 
    type: 'NUMBER', 
    label: 'Number', 
    icon: Hash, 
    description: 'Numeric input',
    example: 'Budget, quantity, rating',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  { 
    type: 'CHECKBOX', 
    label: 'Checkbox', 
    icon: CheckSquare, 
    description: 'True/false toggle',
    example: 'Approved, completed, urgent',
    color: 'bg-pink-100 text-pink-800 border-pink-200'
  }
]

export default function DraggableFieldBuilder({
  fields,
  onFieldsChange,
  onFieldEdit,
  onFieldDelete,
  onFieldDuplicate,
  onFieldMove
}: DraggableFieldBuilderProps) {
  const [draggedField, setDraggedField] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [showFieldTypes, setShowFieldTypes] = useState(false)

  // Generate unique field ID
  const generateFieldId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  // Add new field
  const addField = (type: DeliverableField['type']) => {
    const newField: DeliverableField = {
      id: generateFieldId(),
      name: `New ${FIELD_TYPES.find(t => t.type === type)?.label || 'Field'}`,
      slug: generateSlug(`New ${FIELD_TYPES.find(t => t.type === type)?.label || 'Field'}`),
      type,
      isRequired: false,
      sortOrder: fields.length,
      defaultValue: '',
      placeholder: '',
      helpText: '',
      options: type === 'SELECT' ? ['Option 1', 'Option 2'] : undefined
    }

    const updatedFields = [...fields, newField]
    onFieldsChange(updatedFields)
    setShowFieldTypes(false)
    
    // Auto-edit the new field
    setTimeout(() => onFieldEdit(newField), 100)
  }

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedField(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML)
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  // Handle drop
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedField === null || draggedField === dropIndex) {
      setDraggedField(null)
      setDragOverIndex(null)
      return
    }

    const updatedFields = [...fields]
    const [draggedItem] = updatedFields.splice(draggedField, 1)
    updatedFields.splice(dropIndex, 0, draggedItem)

    // Update sort orders
    updatedFields.forEach((field, index) => {
      field.sortOrder = index
    })

    onFieldsChange(updatedFields)
    setDraggedField(null)
    setDragOverIndex(null)
  }

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedField(null)
    setDragOverIndex(null)
  }

  // Get field type config
  const getFieldTypeConfig = (type: DeliverableField['type']) => {
    return FIELD_TYPES.find(t => t.type === type) || FIELD_TYPES[0]
  }

  // Render field preview
  const renderFieldPreview = (field: DeliverableField) => {
    const config = getFieldTypeConfig(field.type)
    const Icon = config.icon

    return (
      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
        <Icon className="w-4 h-4 text-gray-500" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">{field.name}</span>
            {field.isRequired && (
              <Badge variant="error" className="text-xs">Required</Badge>
            )}
            <Badge variant="outline" className={`text-xs ${config.color}`}>
              {config.label}
            </Badge>
          </div>
          {field.helpText && (
            <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Field Type Selector */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowFieldTypes(!showFieldTypes)}
          className="w-full justify-between"
        >
          <span>Add Field</span>
          <Plus className="w-4 h-4" />
        </Button>

        {showFieldTypes && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 p-2">
            <div className="grid grid-cols-1 gap-2">
              {FIELD_TYPES.map((fieldType) => {
                const Icon = fieldType.icon
                return (
                  <button
                    key={fieldType.type}
                    onClick={() => addField(fieldType.type)}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <Icon className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{fieldType.label}</div>
                      <div className="text-xs text-gray-500">{fieldType.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Fields List */}
      <div className="space-y-2">
        {fields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No fields added yet</p>
            <p className="text-xs">Click "Add Field" to start building your form</p>
          </div>
        ) : (
          fields.map((field, index) => {
            const config = getFieldTypeConfig(field.type)
            const Icon = config.icon

            return (
              <div
                key={field.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  group relative p-4 bg-white border rounded-lg shadow-sm
                  ${draggedField === index ? 'opacity-50' : ''}
                  ${dragOverIndex === index ? 'border-blue-300 bg-blue-50' : ''}
                  hover:shadow-md transition-all duration-200
                `}
              >
                {/* Drag Handle */}
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                </div>

                {/* Field Content */}
                <div className="ml-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-sm">{field.name}</span>
                                             {field.isRequired && (
                         <Badge variant="error" className="text-xs">Required</Badge>
                       )}
                      <Badge variant="outline" className={`text-xs ${config.color}`}>
                        {config.label}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onFieldEdit(field)}
                        className="h-8 w-8 p-0"
                      >
                        <Settings className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onFieldDuplicate(field)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onFieldDelete(field.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Field Preview */}
                  {renderFieldPreview(field)}

                  {/* Move Buttons */}
                  <div className="flex items-center space-x-1 mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onFieldMove(field.id, 'up')}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onFieldMove(field.id, 'down')}
                      disabled={index === fields.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Summary */}
      {fields.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          {fields.length} field{fields.length !== 1 ? 's' : ''} • 
          {fields.filter(f => f.isRequired).length} required
        </div>
      )}
    </div>
  )
} 