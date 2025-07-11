'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ColorPicker from '@/components/ui/color-picker'
import { getDefaultColorForService } from '@/lib/service-colors'
import DraggableFieldBuilder, { DeliverableField as BuilderField } from '@/components/ui/draggable-field-builder'
import FieldConfigModal from '@/components/ui/field-config-modal'
import ServiceTypeTemplates from '@/components/ui/service-type-templates'
import { 
  Plus,
  X,
  GripVertical,
  Type,
  AlignLeft,
  Calendar,
  Link,
  List,
  Hash,
  CheckSquare,
  Eye,
  Save,
  Trash2,
  Settings,
  Sparkles,
  Copy,
  ArrowRight,
  FileText
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'

// Types
interface DeliverableField {
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

interface ServiceType {
  id?: string
  name: string
  slug?: string
  description?: string
  workflowType: 'recurring' | 'project' | 'milestone'
  isActive: boolean
  color?: string
  deliverableFields: DeliverableField[]
}

interface ServiceTypeFormProps {
  serviceType?: ServiceType | null
  onSave: (serviceType: ServiceType) => void
  onCancel: () => void
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

export default function ServiceTypeForm({ serviceType, onSave, onCancel }: ServiceTypeFormProps) {
  const [formData, setFormData] = useState<ServiceType>({
    name: '',
    description: '',
    workflowType: 'project',
    isActive: true,
    color: '#10B981',
    deliverableFields: []
  })
  const [activeTab, setActiveTab] = useState<'setup' | 'fields' | 'preview'>('setup')
  const [editingField, setEditingField] = useState<DeliverableField | null>(null)
  const [showFieldConfig, setShowFieldConfig] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Initialize form data
  useEffect(() => {
    if (serviceType) {
      setFormData({
        ...serviceType,
        color: serviceType.color || getDefaultColorForService(serviceType.name)
      })
    }
  }, [serviceType])

  // Generate unique field ID
  const generateFieldId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  // Handle form submission
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Service name is required')
      return
    }

    setIsSaving(true)
    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const method = serviceType?.id ? 'PUT' : 'POST'
      const url = serviceType?.id ? `/api/service-types/${serviceType.id}` : '/api/service-types'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          workflowType: formData.workflowType.toUpperCase(),
          color: formData.color,
          deliverableFields: formData.deliverableFields.map((field, index) => ({
            name: field.name,
            slug: field.slug,
            type: field.type,
            isRequired: field.isRequired,
            sortOrder: index,
            defaultValue: field.defaultValue,
            placeholder: field.placeholder,
            helpText: field.helpText,
            options: field.options,
            minLength: field.minLength,
            maxLength: field.maxLength,
            minValue: field.minValue,
            maxValue: field.maxValue,
            pattern: field.pattern
          }))
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Service type ${serviceType?.id ? 'updated' : 'created'} successfully!`)
        onSave(result.data)
      } else {
        throw new Error('Failed to save service type')
      }
    } catch (error) {
      console.error('Error saving service type:', error)
      toast.error('Failed to save service type')
    } finally {
      setIsSaving(false)
    }
  }

  // Apply template
  const applyTemplate = (template: any) => {
    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      workflowType: template.workflowType.toLowerCase(),
      color: getDefaultColorForService(template.name),
      deliverableFields: template.fields.map((field: any, index: number) => ({
        id: generateFieldId(),
        name: field.name,
        slug: field.slug,
        type: field.type,
        isRequired: field.isRequired,
        sortOrder: index,
        defaultValue: field.defaultValue || '',
        placeholder: field.placeholder || '',
        helpText: field.helpText || '',
        options: field.options || []
      }))
    }))
    setActiveTab('fields')
    setShowTemplates(false)
    toast.success('Template applied successfully!')
  }

  // Handle field changes from the builder
  const handleFieldsChange = (fields: BuilderField[]) => {
    setFormData(prev => ({
      ...prev,
      deliverableFields: fields
    }))
  }

  // Handle field edit
  const handleFieldEdit = (field: BuilderField) => {
    setEditingField(field)
    setShowFieldConfig(true)
  }

  // Handle field save
  const handleFieldSave = (updatedField: BuilderField) => {
    setFormData(prev => ({
      ...prev,
      deliverableFields: prev.deliverableFields.map(field =>
        field.id === updatedField.id ? updatedField : field
      )
    }))
    setShowFieldConfig(false)
    setEditingField(null)
  }

  // Handle field delete
  const handleFieldDelete = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      deliverableFields: prev.deliverableFields.filter(field => field.id !== fieldId)
    }))
  }

  // Handle field duplicate
  const handleFieldDuplicate = (field: BuilderField) => {
    const duplicatedField: BuilderField = {
      ...field,
      id: generateFieldId(),
      name: `${field.name} (Copy)`,
      slug: `${field.slug}_copy`,
      sortOrder: formData.deliverableFields.length
    }
    
    setFormData(prev => ({
      ...prev,
      deliverableFields: [...prev.deliverableFields, duplicatedField]
    }))
  }

  // Handle field move
  const handleFieldMove = (fieldId: string, direction: 'up' | 'down') => {
    const currentIndex = formData.deliverableFields.findIndex(f => f.id === fieldId)
    if (currentIndex === -1) return

    const newFields = [...formData.deliverableFields]
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex >= 0 && targetIndex < newFields.length) {
      [newFields[currentIndex], newFields[targetIndex]] = [newFields[targetIndex], newFields[currentIndex]]
      
      // Update sort orders
      newFields.forEach((field, index) => {
        field.sortOrder = index
      })

      setFormData(prev => ({
        ...prev,
        deliverableFields: newFields
      }))
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {serviceType?.id ? 'Edit Service Type' : 'Create Service Type'}
          </h2>
          <p className="text-gray-600">
            Configure your service offering and deliverable structure
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? 'Saving...' : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Service Type
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <Button
          variant={activeTab === 'setup' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('setup')}
        >
          Setup
        </Button>
        <Button
          variant={activeTab === 'fields' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('fields')}
        >
          Fields
        </Button>
        <Button
          variant={activeTab === 'preview' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Setup Tab */}
        {activeTab === 'setup' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <p className="text-sm text-gray-600">
                  Configure the basic details of your service type
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Social Media Management"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this service includes..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workflow Type
                  </label>
                  <select
                    value={formData.workflowType}
                    onChange={(e) => setFormData(prev => ({ ...prev, workflowType: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="project">Project-based</option>
                    <option value="recurring">Recurring</option>
                    <option value="milestone">Milestone-based</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Color
                  </label>
                  <ColorPicker
                    value={formData.color || '#10B981'}
                    onChange={(color) => setFormData(prev => ({ ...prev, color }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Quick Start Templates
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Start with a pre-built template
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={() => setShowTemplates(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Browse Templates
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    Choose from social media, web design, content writing, and more
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Fields Tab */}
        {activeTab === 'fields' && (
          <div className="space-y-6">
            {/* Field Builder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Field Builder
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Drag and drop to build your custom fields
                </p>
              </CardHeader>
              <CardContent>
                <DraggableFieldBuilder
                  fields={formData.deliverableFields}
                  onFieldsChange={handleFieldsChange}
                  onFieldEdit={handleFieldEdit}
                  onFieldDelete={handleFieldDelete}
                  onFieldDuplicate={handleFieldDuplicate}
                  onFieldMove={handleFieldMove}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Deliverable Creation Preview
              </CardTitle>
              <p className="text-sm text-gray-600">
                This is how the deliverable creation form will look for your team
              </p>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl mx-auto">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Create New Deliverable - {formData.name}
                  </h3>
                  
                  {formData.deliverableFields.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No fields configured yet</p>
                      <p className="text-sm text-gray-500">Add fields in the Fields tab to see the preview</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.deliverableFields.map((field) => (
                        <div key={field.id}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {field.name}
                            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <div className="p-3 bg-white border rounded-md">
                            <span className="text-sm text-gray-500">
                              {field.type} field preview
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-end space-x-3">
                          <Button variant="outline" disabled>Cancel</Button>
                          <Button disabled className="bg-emerald-600">Create Deliverable</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      {showFieldConfig && editingField && (
        <FieldConfigModal
          field={editingField}
          isOpen={showFieldConfig}
          onClose={() => setShowFieldConfig(false)}
          onSave={handleFieldSave}
        />
      )}

      {showTemplates && (
        <ServiceTypeTemplates
          onSelectTemplate={applyTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  )
} 