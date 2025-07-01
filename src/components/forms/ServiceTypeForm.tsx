'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ColorPicker from '@/components/ui/color-picker'
import { getDefaultColorForService } from '@/lib/service-colors'
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
  ArrowRight
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'

// Types
interface DeliverableField {
  id: string
  name: string
  type: 'TEXT' | 'TEXTAREA' | 'DATE' | 'URL' | 'SELECT' | 'NUMBER' | 'CHECKBOX'
  isRequired: boolean
  sortOrder: number
  defaultValue?: string
  options?: string[]
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
    type: 'TEXT', 
    label: 'Short Text', 
    icon: Type, 
    description: 'Single line text input',
    example: 'Project title, client name'
  },
  { 
    type: 'TEXTAREA', 
    label: 'Long Text', 
    icon: AlignLeft, 
    description: 'Multi-line text area',
    example: 'Description, notes, feedback'
  },
  { 
    type: 'DATE', 
    label: 'Date', 
    icon: Calendar, 
    description: 'Date picker',
    example: 'Due date, launch date'
  },
  { 
    type: 'URL', 
    label: 'URL', 
    icon: Link, 
    description: 'Website or file link',
    example: 'Asset links, references'
  },
  { 
    type: 'SELECT', 
    label: 'Dropdown', 
    icon: List, 
    description: 'Single selection from options',
    example: 'Priority, status, category'
  },
  { 
    type: 'NUMBER', 
    label: 'Number', 
    icon: Hash, 
    description: 'Numeric input',
    example: 'Budget, quantity, rating'
  },
  { 
    type: 'CHECKBOX', 
    label: 'Checkbox', 
    icon: CheckSquare, 
    description: 'True/false toggle',
    example: 'Approved, completed, urgent'
  }
] as const

// Service type templates
const SERVICE_TEMPLATES = [
  {
    name: 'Social Media Management',
    description: 'Recurring social media content creation and posting',
    workflowType: 'recurring' as const,
    fields: [
      { name: 'Content Type', type: 'SELECT' as const, isRequired: true, options: ['Post', 'Story', 'Reel', 'Video'] },
      { name: 'Platform', type: 'SELECT' as const, isRequired: true, options: ['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'TikTok'] },
      { name: 'Caption', type: 'TEXTAREA' as const, isRequired: true },
      { name: 'Publish Date', type: 'DATE' as const, isRequired: true },
      { name: 'Asset URL', type: 'URL' as const, isRequired: false },
      { name: 'Hashtags', type: 'TEXTAREA' as const, isRequired: false },
      { name: 'Approved', type: 'CHECKBOX' as const, isRequired: false }
    ]
  },
  {
    name: 'Web Design Project',
    description: 'Complete website design and development project',
    workflowType: 'milestone' as const,
    fields: [
      { name: 'Page Name', type: 'TEXT' as const, isRequired: true },
      { name: 'Design Brief', type: 'TEXTAREA' as const, isRequired: true },
      { name: 'Wireframe URL', type: 'URL' as const, isRequired: false },
      { name: 'Design URL', type: 'URL' as const, isRequired: false },
      { name: 'Priority', type: 'SELECT' as const, isRequired: true, options: ['Low', 'Medium', 'High', 'Urgent'] },
      { name: 'Due Date', type: 'DATE' as const, isRequired: true },
      { name: 'Budget', type: 'NUMBER' as const, isRequired: false },
      { name: 'Client Approved', type: 'CHECKBOX' as const, isRequired: false }
    ]
  },
  {
    name: 'Content Writing',
    description: 'Blog posts, articles, and written content',
    workflowType: 'project' as const,
    fields: [
      { name: 'Article Title', type: 'TEXT' as const, isRequired: true },
      { name: 'Topic/Brief', type: 'TEXTAREA' as const, isRequired: true },
      { name: 'Word Count', type: 'NUMBER' as const, isRequired: true },
      { name: 'Target Keywords', type: 'TEXTAREA' as const, isRequired: false },
      { name: 'Due Date', type: 'DATE' as const, isRequired: true },
      { name: 'Draft URL', type: 'URL' as const, isRequired: false },
      { name: 'SEO Optimized', type: 'CHECKBOX' as const, isRequired: false },
      { name: 'Client Review Complete', type: 'CHECKBOX' as const, isRequired: false }
    ]
  },
  {
    name: 'Brand Identity',
    description: 'Logo design and brand identity development',
    workflowType: 'milestone' as const,
    fields: [
      { name: 'Asset Type', type: 'SELECT' as const, isRequired: true, options: ['Logo', 'Business Card', 'Letterhead', 'Brand Guide'] },
      { name: 'Description', type: 'TEXTAREA' as const, isRequired: true },
      { name: 'File URL', type: 'URL' as const, isRequired: false },
      { name: 'Color Palette', type: 'TEXT' as const, isRequired: false },
      { name: 'Due Date', type: 'DATE' as const, isRequired: true },
      { name: 'Revision Round', type: 'NUMBER' as const, isRequired: false },
      { name: 'Final Approved', type: 'CHECKBOX' as const, isRequired: false }
    ]
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
  const [draggedField, setDraggedField] = useState<number | null>(null)
  const [editingField, setEditingField] = useState<DeliverableField | null>(null)
  const [showFieldConfig, setShowFieldConfig] = useState(false)
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
            type: field.type,
            isRequired: field.isRequired,
            sortOrder: index,
            defaultValue: field.defaultValue,
            options: field.options,
            placeholder: '',
            helpText: '',
            minLength: null,
            maxLength: null,
            minValue: null,
            maxValue: null,
            pattern: null
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
  const applyTemplate = (template: typeof SERVICE_TEMPLATES[0]) => {
    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      workflowType: template.workflowType,
      color: getDefaultColorForService(template.name),
      deliverableFields: template.fields.map((field, index) => ({
        id: generateFieldId(),
        name: field.name,
        type: field.type,
        isRequired: field.isRequired,
        sortOrder: index,
        defaultValue: '',
        options: field.options || []
      }))
    }))
    setActiveTab('fields')
    toast.success('Template applied successfully!')
  }

  // Add new field
  const addField = (type: DeliverableField['type']) => {
    const newField: DeliverableField = {
      id: generateFieldId(),
      name: `New ${FIELD_TYPES.find(ft => ft.type === type)?.label || 'Field'}`,
      type,
      isRequired: false,
      sortOrder: formData.deliverableFields.length,
      defaultValue: '',
      options: type === 'SELECT' ? ['Option 1', 'Option 2'] : []
    }
    
    setFormData(prev => ({
      ...prev,
      deliverableFields: [...prev.deliverableFields, newField]
    }))
    
    setEditingField(newField)
    setShowFieldConfig(true)
  }

  // Update field
  const updateField = (fieldId: string, updates: Partial<DeliverableField>) => {
    setFormData(prev => ({
      ...prev,
      deliverableFields: prev.deliverableFields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }))
  }

  // Remove field
  const removeField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      deliverableFields: prev.deliverableFields.filter(field => field.id !== fieldId)
    }))
  }

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedField(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedField === null) return
    
    const newFields = [...formData.deliverableFields]
    const draggedItem = newFields[draggedField]
    
    // Remove dragged item
    newFields.splice(draggedField, 1)
    
    // Insert at new position
    newFields.splice(dropIndex, 0, draggedItem)
    
    // Update sort order
    newFields.forEach((field, index) => {
      field.sortOrder = index
    })
    
    setFormData(prev => ({ ...prev, deliverableFields: newFields }))
    setDraggedField(null)
  }

  // Get field type icon
  const getFieldIcon = (type: string) => {
    const fieldType = FIELD_TYPES.find(ft => ft.type === type)
    return fieldType ? fieldType.icon : Type
  }

  // Render field preview
  const renderFieldPreview = (field: DeliverableField) => {
    const Icon = getFieldIcon(field.type)
    
    switch (field.type) {
      case 'TEXT':
        return (
          <input
            type="text"
            placeholder={field.defaultValue || `Enter ${field.name.toLowerCase()}...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled
          />
        )
      case 'TEXTAREA':
        return (
          <textarea
            placeholder={field.defaultValue || `Enter ${field.name.toLowerCase()}...`}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            disabled
          />
        )
      case 'DATE':
        return (
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled
          />
        )
      case 'URL':
        return (
          <input
            type="url"
            placeholder={field.defaultValue || 'https://...'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled
          />
        )
      case 'SELECT':
        return (
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" disabled>
            <option>Select {field.name.toLowerCase()}...</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        )
      case 'NUMBER':
        return (
          <input
            type="number"
            placeholder={field.defaultValue || '0'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled
          />
        )
      case 'CHECKBOX':
        return (
          <label className="flex items-center">
            <input type="checkbox" className="rounded border-gray-300 text-emerald-600" disabled />
            <span className="ml-2 text-gray-700">{field.name}</span>
          </label>
        )
      default:
        return null
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

      {/* Progress Tabs */}
      <div className="flex items-center mb-8">
        <div className="flex items-center space-x-1">
          {[
            { key: 'setup', label: 'Setup', icon: Settings },
            { key: 'fields', label: 'Fields', icon: List },
            { key: 'preview', label: 'Preview', icon: Eye }
          ].map((tab, index) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            const isCompleted = (tab.key === 'setup' && formData.name) || 
                              (tab.key === 'fields' && formData.deliverableFields.length > 0)
            
            return (
              <React.Fragment key={tab.key}>
                <button
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : isCompleted
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
                {index < 2 && (
                  <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Setup Tab */}
        {activeTab === 'setup' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
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
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this service type..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workflow Type *
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'recurring', label: 'Recurring', desc: 'Ongoing, repetitive work (e.g., social media posts)', icon: '🔄' },
                      { value: 'project', label: 'Project', desc: 'One-time projects with clear deliverables', icon: '📋' },
                      { value: 'milestone', label: 'Milestone', desc: 'Complex projects broken into phases', icon: '🎯' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="workflowType"
                          value={option.value}
                          checked={formData.workflowType === option.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, workflowType: e.target.value as any }))}
                          className="mt-1 text-emerald-600"
                        />
                        <div className="ml-3">
                          <div className="flex items-center">
                            <span className="mr-2">{option.icon}</span>
                            <span className="font-medium text-gray-900">{option.label}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{option.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <ColorPicker
                    label="Service Type Color *"
                    value={formData.color || '#10B981'}
                    onChange={(color) => setFormData(prev => ({ ...prev, color }))}
                    placeholder="#10B981"
                    existingColors={[]} // We'll get this from other service types in real implementation
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This color will be used for badges and visual identification throughout the app
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Quick Start Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Start with a pre-built template and customize as needed
                </p>
                <div className="space-y-3">
                  {SERVICE_TEMPLATES.map((template, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          <div className="flex items-center mt-2">
                            <Badge variant="outline" className="text-xs">
                              {template.workflowType.charAt(0).toUpperCase() + template.workflowType.slice(1)}
                            </Badge>
                            <span className="text-xs text-gray-500 ml-2">
                              {template.fields.length} fields
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyTemplate(template)}
                          className="ml-3"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Use
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Fields Tab */}
        {activeTab === 'fields' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Field Types */}
            <Card>
              <CardHeader>
                <CardTitle>Deliverable Fields</CardTitle>
                <p className="text-sm text-gray-600">
                  Add fields that users will fill out when creating deliverables
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {FIELD_TYPES.map((fieldType) => {
                    const Icon = fieldType.icon
                    return (
                      <button
                        key={fieldType.type}
                        onClick={() => addField(fieldType.type)}
                        className="flex items-start p-3 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-left"
                      >
                        <div className="p-2 bg-gray-100 rounded-md mr-3 group-hover:bg-emerald-100">
                          <Icon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{fieldType.label}</h4>
                          <p className="text-sm text-gray-600 mt-1">{fieldType.description}</p>
                          <p className="text-xs text-gray-500 mt-1">e.g., {fieldType.example}</p>
                        </div>
                        <Plus className="h-4 w-4 text-gray-400 ml-2" />
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Current Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Current Fields ({formData.deliverableFields.length})</CardTitle>
                <p className="text-sm text-gray-600">
                  Drag to reorder fields
                </p>
              </CardHeader>
              <CardContent>
                {formData.deliverableFields.length === 0 ? (
                  <div className="text-center py-8">
                    <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No fields added yet</p>
                    <p className="text-sm text-gray-500">Add fields from the left panel</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.deliverableFields.map((field, index) => {
                      const Icon = getFieldIcon(field.type)
                      return (
                        <div
                          key={field.id}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          className="flex items-center p-3 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow cursor-move"
                        >
                          <GripVertical className="h-4 w-4 text-gray-400 mr-3" />
                          <div className="p-2 bg-gray-100 rounded-md mr-3">
                            <Icon className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900">{field.name}</span>
                              {field.isRequired && (
                                <Badge variant="outline" className="text-xs ml-2 bg-red-50 text-red-700 border-red-200">
                                  Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {FIELD_TYPES.find(ft => ft.type === field.type)?.label}
                              {field.type === 'SELECT' && field.options?.length && (
                                <span className="ml-1">({field.options.length} options)</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingField(field)
                                setShowFieldConfig(true)
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeField(field.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
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
                          {renderFieldPreview(field)}
                          {field.type === 'SELECT' && field.options?.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">No options configured</p>
                          )}
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

      {/* Field Configuration Modal */}
      {showFieldConfig && editingField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Configure Field</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFieldConfig(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field Name
                  </label>
                  <Input
                    value={editingField.name}
                    onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
                    placeholder="Enter field name..."
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingField.isRequired}
                      onChange={(e) => setEditingField({ ...editingField, isRequired: e.target.checked })}
                      className="rounded border-gray-300 text-emerald-600"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Required field</span>
                  </label>
                </div>

                {['TEXT', 'TEXTAREA', 'URL', 'NUMBER'].includes(editingField.type) ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Value (optional)
                    </label>
                    <Input
                      value={editingField.defaultValue || ''}
                      onChange={(e) => setEditingField({ ...editingField, defaultValue: e.target.value })}
                      placeholder="Enter default value..."
                    />
                  </div>
                ) : null}

                {editingField.type === 'SELECT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options (one per line)
                    </label>
                    <textarea
                      value={editingField.options?.join('\n') || ''}
                      onChange={(e) => setEditingField({ 
                        ...editingField, 
                        options: e.target.value.split('\n').filter(opt => opt.trim()) 
                      })}
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowFieldConfig(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    updateField(editingField.id, editingField)
                    setShowFieldConfig(false)
                    setEditingField(null)
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Save Field
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 