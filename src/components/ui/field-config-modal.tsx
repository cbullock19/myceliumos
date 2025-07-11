'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X,
  Type,
  AlignLeft,
  Calendar,
  Link,
  List,
  Hash,
  CheckSquare,
  Settings,
  Plus,
  Trash2,
  Eye,
  AlertCircle,
  Info
} from 'lucide-react'
import { DeliverableField } from './draggable-field-builder'

interface FieldConfigModalProps {
  field: DeliverableField | null
  isOpen: boolean
  onClose: () => void
  onSave: (field: DeliverableField) => void
}

// Field type configurations
const FIELD_TYPES = [
  { 
    type: 'TEXT' as const, 
    label: 'Short Text', 
    icon: Type, 
    description: 'Single line text input',
    example: 'Project title, client name'
  },
  { 
    type: 'TEXTAREA' as const, 
    label: 'Long Text', 
    icon: AlignLeft, 
    description: 'Multi-line text area',
    example: 'Description, notes, feedback'
  },
  { 
    type: 'DATE' as const, 
    label: 'Date', 
    icon: Calendar, 
    description: 'Date picker',
    example: 'Due date, launch date'
  },
  { 
    type: 'URL' as const, 
    label: 'URL', 
    icon: Link, 
    description: 'Website or file link',
    example: 'Asset links, references'
  },
  { 
    type: 'SELECT' as const, 
    label: 'Dropdown', 
    icon: List, 
    description: 'Single selection from options',
    example: 'Priority, status, category'
  },
  { 
    type: 'NUMBER' as const, 
    label: 'Number', 
    icon: Hash, 
    description: 'Numeric input',
    example: 'Budget, quantity, rating'
  },
  { 
    type: 'CHECKBOX' as const, 
    label: 'Checkbox', 
    icon: CheckSquare, 
    description: 'True/false toggle',
    example: 'Approved, completed, urgent'
  }
]

export default function FieldConfigModal({
  field,
  isOpen,
  onClose,
  onSave
}: FieldConfigModalProps) {
  const [formData, setFormData] = useState<DeliverableField>({
    id: '',
    name: '',
    slug: '',
    type: 'TEXT',
    isRequired: false,
    sortOrder: 0,
    defaultValue: '',
    placeholder: '',
    helpText: '',
    options: [],
    minLength: undefined,
    maxLength: undefined,
    minValue: undefined,
    maxValue: undefined,
    pattern: ''
  })
  const [newOption, setNewOption] = useState('')

  // Initialize form data when field changes
  useEffect(() => {
    if (field) {
      setFormData({ ...field })
    }
  }, [field])

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  // Handle name change
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  // Handle save
  const handleSave = () => {
    if (!formData.name.trim()) {
      return
    }

    onSave(formData)
    onClose()
  }

  // Add option for SELECT fields
  const addOption = () => {
    if (newOption.trim() && formData.type === 'SELECT') {
      setFormData(prev => ({
        ...prev,
        options: [...(prev.options || []), newOption.trim()]
      }))
      setNewOption('')
    }
  }

  // Remove option
  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }))
  }

  // Get field type config
  const getFieldTypeConfig = (type: DeliverableField['type']) => {
    return FIELD_TYPES.find(t => t.type === type) || FIELD_TYPES[0]
  }

  if (!isOpen || !field) return null

  const config = getFieldTypeConfig(field.type)
  const Icon = config.icon

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Icon className="w-5 h-5 text-gray-600" />
            <div>
              <h2 className="text-lg font-semibold">Configure Field</h2>
              <p className="text-sm text-gray-500">{config.description}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Basic Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Project Title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type
                </label>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Icon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Help Text
              </label>
              <Input
                value={formData.helpText || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, helpText: e.target.value }))}
                placeholder="Optional help text to guide users"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="required"
                checked={formData.isRequired}
                onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="required" className="text-sm font-medium text-gray-700">
                This field is required
              </label>
            </div>
          </div>

          {/* Field-Specific Settings */}
          {formData.type === 'TEXT' || formData.type === 'TEXTAREA' ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Text Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placeholder Text
                </label>
                <Input
                  value={formData.placeholder || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
                  placeholder="e.g., Enter project title..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Length
                  </label>
                  <Input
                    type="number"
                    value={formData.minLength || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      minLength: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="Optional"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Length
                  </label>
                  <Input
                    type="number"
                    value={formData.maxLength || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxLength: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {formData.type === 'NUMBER' ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Number Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Value
                  </label>
                  <Input
                    type="number"
                    value={formData.minValue || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      minValue: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="Optional"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Value
                  </label>
                  <Input
                    type="number"
                    value={formData.maxValue || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxValue: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {formData.type === 'SELECT' ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Dropdown Options</h3>
              
              <div className="space-y-2">
                {formData.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(formData.options || [])]
                        newOptions[index] = e.target.value
                        setFormData(prev => ({ ...prev, options: newOptions }))
                      }}
                      placeholder="Option text"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeOption(index)}
                      className="h-8 w-8 p-0 text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex items-center space-x-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add new option"
                    onKeyPress={(e) => e.key === 'Enter' && addOption()}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addOption}
                    disabled={!newOption.trim()}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Default Value */}
          {formData.type !== 'SELECT' ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Default Value</h3>
              
              <div>
                <Input
                  value={formData.defaultValue || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
                  placeholder="Optional default value"
                />
              </div>
            </div>
          ) : null}

          {/* Preview */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Preview</h3>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.name} {formData.isRequired && <span className="text-red-500">*</span>}
              </label>
              
              {formData.helpText && (
                <p className="text-xs text-gray-500 mb-2">{formData.helpText}</p>
              )}
              
              {formData.type === 'TEXT' && (
                <Input
                  placeholder={formData.placeholder || `Enter ${formData.name.toLowerCase()}`}
                  defaultValue={formData.defaultValue}
                />
              )}
              
              {formData.type === 'TEXTAREA' && (
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder={formData.placeholder || `Enter ${formData.name.toLowerCase()}`}
                  defaultValue={formData.defaultValue}
                />
              )}
              
              {formData.type === 'DATE' && (
                <Input
                  type="date"
                  defaultValue={formData.defaultValue}
                />
              )}
              
              {formData.type === 'URL' && (
                <Input
                  type="url"
                  placeholder={formData.placeholder || "https://example.com"}
                  defaultValue={formData.defaultValue}
                />
              )}
              
              {formData.type === 'SELECT' && (
                <select className="w-full p-2 border rounded-md">
                  <option value="">Select an option</option>
                  {formData.options?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
              
              {formData.type === 'NUMBER' && (
                <Input
                  type="number"
                  placeholder={formData.placeholder || "Enter number"}
                  defaultValue={formData.defaultValue}
                />
              )}
              
              {formData.type === 'CHECKBOX' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    defaultChecked={formData.defaultValue === 'true'}
                  />
                  <span className="text-sm">{formData.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.name.trim()}>
            Save Field
          </Button>
        </div>
      </div>
    </div>
  )
} 