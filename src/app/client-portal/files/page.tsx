'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download,
  Upload,
  Folder,
  File,
  FileText,
  Image,
  Video,
  Archive,
  Calendar,
  User,
  Eye,
  Search,
  Filter
} from 'lucide-react'

// Types
interface FileItem {
  id: string
  name: string
  type: string
  size: string
  uploadedAt: string
  uploadedBy: string
  project?: string
  deliverable?: string
  isPublic: boolean
  downloadCount: number
}

interface FilesData {
  files: FileItem[]
  stats: {
    totalFiles: number
    totalSize: string
    recentDownloads: number
    pendingUploads: number
  }
  folders: {
    id: string
    name: string
    fileCount: number
  }[]
}

export default function ClientPortalFilesPage() {
  const [filesData, setFilesData] = useState<FilesData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    const loadFilesData = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/client-portal/files')
        // const data = await response.json()
        // setFilesData(data.data)

        // Mock data for now
        setFilesData({
          files: [
            {
              id: '1',
              name: 'logo-final.ai',
              type: 'design',
              size: '2.4 MB',
              uploadedAt: '2024-01-15',
              uploadedBy: 'Alex Rodriguez',
              project: 'Brand Identity Package',
              deliverable: 'Logo Design Final Files',
              isPublic: true,
              downloadCount: 3
            },
            {
              id: '2',
              name: 'homepage-mockup.pdf',
              type: 'document',
              size: '1.8 MB',
              uploadedAt: '2024-01-12',
              uploadedBy: 'Sarah Johnson',
              project: 'Website Redesign',
              deliverable: 'Website Homepage Design',
              isPublic: true,
              downloadCount: 5
            },
            {
              id: '3',
              name: 'social-content-calendar.xlsx',
              type: 'spreadsheet',
              size: '456 KB',
              uploadedAt: '2024-01-10',
              uploadedBy: 'Mike Chen',
              project: 'Social Media Campaign',
              deliverable: 'Social Media Content Calendar',
              isPublic: true,
              downloadCount: 2
            },
            {
              id: '4',
              name: 'brand-guidelines.pdf',
              type: 'document',
              size: '3.2 MB',
              uploadedAt: '2024-01-08',
              uploadedBy: 'Alex Rodriguez',
              project: 'Brand Identity Package',
              deliverable: 'Brand Identity Guidelines',
              isPublic: true,
              downloadCount: 4
            }
          ],
          stats: {
            totalFiles: 4,
            totalSize: '7.9 MB',
            recentDownloads: 14,
            pendingUploads: 0
          },
          folders: [
            { id: '1', name: 'Brand Assets', fileCount: 2 },
            { id: '2', name: 'Website Files', fileCount: 1 },
            { id: '3', name: 'Marketing Materials', fileCount: 1 }
          ]
        })
      } catch (error) {
        console.error('Error loading files data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFilesData()
  }, [])

  const getFileIcon = (type: string) => {
    const icons = {
      'design': <File className="h-4 w-4" />,
      'document': <FileText className="h-4 w-4" />,
      'spreadsheet': <FileText className="h-4 w-4" />,
      'image': <Image className="h-4 w-4" />,
      'video': <Video className="h-4 w-4" />,
      'archive': <Archive className="h-4 w-4" />
    }
    return icons[type as keyof typeof icons] || <File className="h-4 w-4" />
  }

  const getTypeBadge = (type: string) => {
    const variants = {
      'design': { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Design' },
      'document': { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Document' },
      'spreadsheet': { color: 'bg-green-100 text-green-700 border-green-200', label: 'Spreadsheet' },
      'image': { color: 'bg-pink-100 text-pink-700 border-pink-200', label: 'Image' },
      'video': { color: 'bg-red-100 text-red-700 border-red-200', label: 'Video' },
      'archive': { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Archive' }
    }
    
    const variant = variants[type as keyof typeof variants] || variants.document
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variant.color}`}>
        {variant.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const filteredFiles = filesData?.files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || file.type === typeFilter
    return matchesSearch && matchesType
  }) || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!filesData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load files</h2>
        <p className="text-gray-600">Please try refreshing the page or contact your project team.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Project Files
        </h1>
        <p className="text-gray-600">
          Access and download all project files, designs, and deliverables.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Files</p>
                <p className="text-2xl font-bold text-gray-900">{filesData.stats.totalFiles}</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <File className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Size</p>
                <p className="text-2xl font-bold text-blue-600">{filesData.stats.totalSize}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Folder className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recent Downloads</p>
                <p className="text-2xl font-bold text-green-600">{filesData.stats.recentDownloads}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Download className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Uploads</p>
                <p className="text-2xl font-bold text-yellow-600">{filesData.stats.pendingUploads}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Upload className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Download className="h-5 w-5 mr-2" />
              All Files
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="design">Design</option>
                <option value="document">Document</option>
                <option value="spreadsheet">Spreadsheet</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="archive">Archive</option>
              </select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{file.name}</h3>
                        {getTypeBadge(file.type)}
                        {file.isPublic && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Public
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <span>{file.size}</span>
                        <span>•</span>
                        <span>Uploaded {formatDate(file.uploadedAt)}</span>
                        <span>•</span>
                        <span>by {file.uploadedBy}</span>
                        {file.project && (
                          <>
                            <span>•</span>
                            <span>{file.project}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{file.downloadCount} downloads</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Folders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Folder className="h-5 w-5 mr-2" />
            Folders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filesData.folders.map((folder) => (
              <div
                key={folder.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Folder className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{folder.name}</h3>
                    <p className="text-sm text-gray-500">{folder.fileCount} files</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Notice */}
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="p-8 text-center">
          <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">More Features Coming Soon</h3>
          <p className="text-gray-600 mb-4">
            We're working on adding file upload capabilities, version control, and advanced file management features.
          </p>
          <p className="text-sm text-gray-500">
            Contact your project team for file uploads and additional access requests.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 