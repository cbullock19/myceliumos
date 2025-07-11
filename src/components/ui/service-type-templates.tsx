'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Globe,
  Search,
  PenTool,
  Palette,
  Camera,
  Video,
  FileText,
  Sparkles,
  Copy,
  Eye,
  CheckCircle
} from 'lucide-react'
import { DeliverableField } from './draggable-field-builder'

interface ServiceTypeTemplate {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  color: string
  workflowType: 'RECURRING' | 'PROJECT' | 'MILESTONE'
  fields: DeliverableField[]
  category: 'social' | 'web' | 'content' | 'design' | 'video' | 'seo'
}

interface ServiceTypeTemplatesProps {
  onSelectTemplate: (template: ServiceTypeTemplate) => void
  onClose: () => void
}

// Prebuilt service type templates
const SERVICE_TEMPLATES: ServiceTypeTemplate[] = [
  {
    id: 'social-media-management',
    name: 'Social Media Management',
    description: 'Recurring social media content creation and posting',
    icon: Instagram,
    color: 'bg-gradient-to-r from-pink-500 to-purple-600',
    workflowType: 'RECURRING',
    category: 'social',
    fields: [
      {
        id: 'content_type',
        name: 'Content Type',
        slug: 'content_type',
        type: 'SELECT',
        isRequired: true,
        sortOrder: 0,
        options: ['Post', 'Story', 'Reel', 'Video', 'Carousel'],
        helpText: 'Type of content being created'
      },
      {
        id: 'platform',
        name: 'Platform',
        slug: 'platform',
        type: 'SELECT',
        isRequired: true,
        sortOrder: 1,
        options: ['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'TikTok'],
        helpText: 'Social media platform'
      },
      {
        id: 'caption',
        name: 'Caption',
        slug: 'caption',
        type: 'TEXTAREA',
        isRequired: true,
        sortOrder: 2,
        helpText: 'Post caption and copy'
      },
      {
        id: 'publish_date',
        name: 'Publish Date',
        slug: 'publish_date',
        type: 'DATE',
        isRequired: true,
        sortOrder: 3,
        helpText: 'When to publish this content'
      },
      {
        id: 'asset_url',
        name: 'Asset URL',
        slug: 'asset_url',
        type: 'URL',
        isRequired: false,
        sortOrder: 4,
        helpText: 'Link to image/video assets'
      },
      {
        id: 'hashtags',
        name: 'Hashtags',
        slug: 'hashtags',
        type: 'TEXTAREA',
        isRequired: false,
        sortOrder: 5,
        helpText: 'Relevant hashtags for the post'
      },
      {
        id: 'approved',
        name: 'Client Approved',
        slug: 'approved',
        type: 'CHECKBOX',
        isRequired: false,
        sortOrder: 6,
        defaultValue: 'false',
        helpText: 'Mark when client has approved this content'
      }
    ]
  },
  {
    id: 'web-design-project',
    name: 'Web Design Project',
    description: 'Complete website design and development project',
    icon: Globe,
    color: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    workflowType: 'MILESTONE',
    category: 'web',
    fields: [
      {
        id: 'page_name',
        name: 'Page Name',
        slug: 'page_name',
        type: 'TEXT',
        isRequired: true,
        sortOrder: 0,
        helpText: 'Name of the page being designed'
      },
      {
        id: 'design_brief',
        name: 'Design Brief',
        slug: 'design_brief',
        type: 'TEXTAREA',
        isRequired: true,
        sortOrder: 1,
        helpText: 'Detailed design requirements and specifications'
      },
      {
        id: 'wireframe_url',
        name: 'Wireframe URL',
        slug: 'wireframe_url',
        type: 'URL',
        isRequired: false,
        sortOrder: 2,
        helpText: 'Link to wireframe or mockup'
      },
      {
        id: 'design_url',
        name: 'Design URL',
        slug: 'design_url',
        type: 'URL',
        isRequired: false,
        sortOrder: 3,
        helpText: 'Link to final design files'
      },
      {
        id: 'priority',
        name: 'Priority',
        slug: 'priority',
        type: 'SELECT',
        isRequired: true,
        sortOrder: 4,
        options: ['Low', 'Medium', 'High', 'Urgent'],
        helpText: 'Priority level for this page'
      },
      {
        id: 'due_date',
        name: 'Due Date',
        slug: 'due_date',
        type: 'DATE',
        isRequired: true,
        sortOrder: 5,
        helpText: 'When this page should be completed'
      },
      {
        id: 'budget',
        name: 'Budget',
        slug: 'budget',
        type: 'NUMBER',
        isRequired: false,
        sortOrder: 6,
        helpText: 'Budget allocated for this page'
      },
      {
        id: 'client_approved',
        name: 'Client Approved',
        slug: 'client_approved',
        type: 'CHECKBOX',
        isRequired: false,
        sortOrder: 7,
        defaultValue: 'false',
        helpText: 'Mark when client has approved the design'
      }
    ]
  },
  {
    id: 'content-writing',
    name: 'Content Writing',
    description: 'Blog posts, articles, and written content',
    icon: FileText,
    color: 'bg-gradient-to-r from-green-500 to-emerald-600',
    workflowType: 'PROJECT',
    category: 'content',
    fields: [
      {
        id: 'article_title',
        name: 'Article Title',
        slug: 'article_title',
        type: 'TEXT',
        isRequired: true,
        sortOrder: 0,
        helpText: 'Title of the article or blog post'
      },
      {
        id: 'topic_brief',
        name: 'Topic/Brief',
        slug: 'topic_brief',
        type: 'TEXTAREA',
        isRequired: true,
        sortOrder: 1,
        helpText: 'Detailed brief and topic requirements'
      },
      {
        id: 'word_count',
        name: 'Word Count',
        slug: 'word_count',
        type: 'NUMBER',
        isRequired: true,
        sortOrder: 2,
        helpText: 'Target word count for the article'
      },
      {
        id: 'target_keywords',
        name: 'Target Keywords',
        slug: 'target_keywords',
        type: 'TEXTAREA',
        isRequired: false,
        sortOrder: 3,
        helpText: 'SEO keywords to target'
      },
      {
        id: 'due_date',
        name: 'Due Date',
        slug: 'due_date',
        type: 'DATE',
        isRequired: true,
        sortOrder: 4,
        helpText: 'When the article should be completed'
      },
      {
        id: 'draft_url',
        name: 'Draft URL',
        slug: 'draft_url',
        type: 'URL',
        isRequired: false,
        sortOrder: 5,
        helpText: 'Link to draft document'
      },
      {
        id: 'seo_optimized',
        name: 'SEO Optimized',
        slug: 'seo_optimized',
        type: 'CHECKBOX',
        isRequired: false,
        sortOrder: 6,
        defaultValue: 'false',
        helpText: 'Mark when SEO optimization is complete'
      },
      {
        id: 'client_review_complete',
        name: 'Client Review Complete',
        slug: 'client_review_complete',
        type: 'CHECKBOX',
        isRequired: false,
        sortOrder: 7,
        defaultValue: 'false',
        helpText: 'Mark when client has reviewed the content'
      }
    ]
  },
  {
    id: 'brand-identity',
    name: 'Brand Identity',
    description: 'Logo design and brand identity development',
    icon: Palette,
    color: 'bg-gradient-to-r from-purple-500 to-pink-600',
    workflowType: 'MILESTONE',
    category: 'design',
    fields: [
      {
        id: 'asset_type',
        name: 'Asset Type',
        slug: 'asset_type',
        type: 'SELECT',
        isRequired: true,
        sortOrder: 0,
        options: ['Logo', 'Business Card', 'Letterhead', 'Brand Guide', 'Social Media Kit'],
        helpText: 'Type of brand asset being created'
      },
      {
        id: 'description',
        name: 'Description',
        slug: 'description',
        type: 'TEXTAREA',
        isRequired: true,
        sortOrder: 1,
        helpText: 'Detailed description of the brand asset'
      },
      {
        id: 'file_url',
        name: 'File URL',
        slug: 'file_url',
        type: 'URL',
        isRequired: false,
        sortOrder: 2,
        helpText: 'Link to design files'
      },
      {
        id: 'color_palette',
        name: 'Color Palette',
        slug: 'color_palette',
        type: 'TEXT',
        isRequired: false,
        sortOrder: 3,
        helpText: 'Brand colors being used'
      },
      {
        id: 'due_date',
        name: 'Due Date',
        slug: 'due_date',
        type: 'DATE',
        isRequired: true,
        sortOrder: 4,
        helpText: 'When the asset should be completed'
      },
      {
        id: 'revision_round',
        name: 'Revision Round',
        slug: 'revision_round',
        type: 'NUMBER',
        isRequired: false,
        sortOrder: 5,
        helpText: 'Current revision round number'
      },
      {
        id: 'final_approved',
        name: 'Final Approved',
        slug: 'final_approved',
        type: 'CHECKBOX',
        isRequired: false,
        sortOrder: 6,
        defaultValue: 'false',
        helpText: 'Mark when final design is approved'
      }
    ]
  },
  {
    id: 'video-production',
    name: 'Video Production',
    description: 'Video content creation and editing',
    icon: Video,
    color: 'bg-gradient-to-r from-red-500 to-orange-600',
    workflowType: 'PROJECT',
    category: 'video',
    fields: [
      {
        id: 'video_type',
        name: 'Video Type',
        slug: 'video_type',
        type: 'SELECT',
        isRequired: true,
        sortOrder: 0,
        options: ['Commercial', 'Social Media', 'Product Demo', 'Testimonial', 'Event Coverage'],
        helpText: 'Type of video being produced'
      },
      {
        id: 'duration',
        name: 'Duration',
        slug: 'duration',
        type: 'TEXT',
        isRequired: true,
        sortOrder: 1,
        helpText: 'Target duration of the video'
      },
      {
        id: 'script_url',
        name: 'Script URL',
        slug: 'script_url',
        type: 'URL',
        isRequired: false,
        sortOrder: 2,
        helpText: 'Link to video script'
      },
      {
        id: 'raw_footage_url',
        name: 'Raw Footage URL',
        slug: 'raw_footage_url',
        type: 'URL',
        isRequired: false,
        sortOrder: 3,
        helpText: 'Link to raw video footage'
      },
      {
        id: 'edit_url',
        name: 'Edit URL',
        slug: 'edit_url',
        type: 'URL',
        isRequired: false,
        sortOrder: 4,
        helpText: 'Link to edited video file'
      },
      {
        id: 'due_date',
        name: 'Due Date',
        slug: 'due_date',
        type: 'DATE',
        isRequired: true,
        sortOrder: 5,
        helpText: 'When the video should be completed'
      },
      {
        id: 'client_approved',
        name: 'Client Approved',
        slug: 'client_approved',
        type: 'CHECKBOX',
        isRequired: false,
        sortOrder: 6,
        defaultValue: 'false',
        helpText: 'Mark when client has approved the video'
      }
    ]
  },
  {
    id: 'seo-campaign',
    name: 'SEO Campaign',
    description: 'Search engine optimization campaigns',
    icon: Search,
    color: 'bg-gradient-to-r from-yellow-500 to-orange-600',
    workflowType: 'RECURRING',
    category: 'seo',
    fields: [
      {
        id: 'campaign_name',
        name: 'Campaign Name',
        slug: 'campaign_name',
        type: 'TEXT',
        isRequired: true,
        sortOrder: 0,
        helpText: 'Name of the SEO campaign'
      },
      {
        id: 'target_keywords',
        name: 'Target Keywords',
        slug: 'target_keywords',
        type: 'TEXTAREA',
        isRequired: true,
        sortOrder: 1,
        helpText: 'Primary keywords to target'
      },
      {
        id: 'optimization_type',
        name: 'Optimization Type',
        slug: 'optimization_type',
        type: 'SELECT',
        isRequired: true,
        sortOrder: 2,
        options: ['On-Page', 'Off-Page', 'Technical', 'Content', 'Local'],
        helpText: 'Type of SEO optimization'
      },
      {
        id: 'page_url',
        name: 'Page URL',
        slug: 'page_url',
        type: 'URL',
        isRequired: false,
        sortOrder: 3,
        helpText: 'URL of the page being optimized'
      },
      {
        id: 'current_ranking',
        name: 'Current Ranking',
        slug: 'current_ranking',
        type: 'NUMBER',
        isRequired: false,
        sortOrder: 4,
        helpText: 'Current search ranking position'
      },
      {
        id: 'target_ranking',
        name: 'Target Ranking',
        slug: 'target_ranking',
        type: 'NUMBER',
        isRequired: false,
        sortOrder: 5,
        helpText: 'Target search ranking position'
      },
      {
        id: 'report_url',
        name: 'Report URL',
        slug: 'report_url',
        type: 'URL',
        isRequired: false,
        sortOrder: 6,
        helpText: 'Link to SEO performance report'
      },
      {
        id: 'optimization_complete',
        name: 'Optimization Complete',
        slug: 'optimization_complete',
        type: 'CHECKBOX',
        isRequired: false,
        sortOrder: 7,
        defaultValue: 'false',
        helpText: 'Mark when optimization is complete'
      }
    ]
  }
]

const CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: Sparkles },
  { id: 'social', name: 'Social Media', icon: Instagram },
  { id: 'web', name: 'Web Design', icon: Globe },
  { id: 'content', name: 'Content', icon: FileText },
  { id: 'design', name: 'Design', icon: Palette },
  { id: 'video', name: 'Video', icon: Video },
  { id: 'seo', name: 'SEO', icon: Search }
]

export default function ServiceTypeTemplates({
  onSelectTemplate,
  onClose
}: ServiceTypeTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTypeTemplate | null>(null)

  const filteredTemplates = selectedCategory === 'all' 
    ? SERVICE_TEMPLATES 
    : SERVICE_TEMPLATES.filter(template => template.category === selectedCategory)

  const handleTemplateSelect = (template: ServiceTypeTemplate) => {
    setSelectedTemplate(template)
  }

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Choose a Template</h2>
            <p className="text-sm text-gray-500">Start with a pre-built service type template</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        {/* Categories */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="whitespace-nowrap"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {category.name}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => {
              const Icon = template.icon
              const isSelected = selectedTemplate?.id === template.id

              return (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${template.color} text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        <p className="text-xs text-gray-500">{template.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {template.workflowType}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {template.fields.length} fields
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-gray-600">
                          Pre-configured fields
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Template Details */}
        {selectedTemplate && (
          <div className="p-6 border-t bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${selectedTemplate.color} text-white`}>
                  <selectedTemplate.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-500">{selectedTemplate.description}</p>
                </div>
              </div>
              <Button onClick={handleUseTemplate}>
                Use This Template
              </Button>
            </div>

            {/* Fields Preview */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Included Fields:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedTemplate.fields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-2 p-2 bg-white rounded border">
                    <span className="text-xs font-medium text-gray-600">#{index + 1}</span>
                    <span className="text-sm">{field.name}</span>
                    {field.isRequired && (
                      <Badge variant="error" className="text-xs">Required</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {field.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 