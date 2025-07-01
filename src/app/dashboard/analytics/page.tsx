'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Clock,
  Target,
  Calendar,
  DollarSign,
  CheckSquare,
  AlertCircle,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalRevenue: number
    revenueChange: number
    activeProjects: number
    projectsChange: number
    completedDeliverables: number
    deliverablesChange: number
    teamUtilization: number
    utilizationChange: number
  }
  charts: {
    revenueByMonth: Array<{ month: string; revenue: number }>
    deliverablesByStatus: Array<{ status: string; count: number; color: string }>
    teamPerformance: Array<{ member: string; completed: number; overdue: number }>
    clientGrowth: Array<{ month: string; clients: number }>
  }
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral'
    title: string
    description: string
    action?: string
  }>
}

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/analytics?range=${timeRange}`)
      // const data = await response.json()
      
      // Mock data for now
      const mockData: AnalyticsData = {
        overview: {
          totalRevenue: 125000,
          revenueChange: 12.5,
          activeProjects: 23,
          projectsChange: 5.2,
          completedDeliverables: 147,
          deliverablesChange: 8.3,
          teamUtilization: 78,
          utilizationChange: -2.1
        },
        charts: {
          revenueByMonth: [
            { month: 'Jan', revenue: 98000 },
            { month: 'Feb', revenue: 105000 },
            { month: 'Mar', revenue: 112000 },
            { month: 'Apr', revenue: 108000 },
            { month: 'May', revenue: 125000 },
            { month: 'Jun', revenue: 135000 }
          ],
          deliverablesByStatus: [
            { status: 'Completed', count: 147, color: '#10B981' },
            { status: 'In Progress', count: 34, color: '#F59E0B' },
            { status: 'Overdue', count: 8, color: '#EF4444' },
            { status: 'Pending', count: 12, color: '#6B7280' }
          ],
          teamPerformance: [
            { member: 'Alice Johnson', completed: 23, overdue: 1 },
            { member: 'Bob Smith', completed: 19, overdue: 2 },
            { member: 'Carol Davis', completed: 31, overdue: 0 },
            { member: 'David Wilson', completed: 15, overdue: 3 }
          ],
          clientGrowth: [
            { month: 'Jan', clients: 12 },
            { month: 'Feb', clients: 14 },
            { month: 'Mar', clients: 16 },
            { month: 'Apr', clients: 15 },
            { month: 'May', clients: 18 },
            { month: 'Jun', clients: 20 }
          ]
        },
        insights: [
          {
            type: 'positive',
            title: 'Revenue Growth Accelerating',
            description: 'Monthly revenue has increased by 12.5% this period, with Q2 showing strong momentum.',
            action: 'Review successful campaigns'
          },
          {
            type: 'negative',
            title: 'Team Utilization Declining',
            description: 'Average team utilization dropped to 78%, down 2.1% from last period.',
            action: 'Optimize workload distribution'
          },
          {
            type: 'neutral',
            title: 'Client Retention Stable',
            description: 'Client retention rate remains steady at 94%, within expected range.',
          },
          {
            type: 'positive',
            title: 'Delivery Performance Strong',
            description: 'On-time delivery rate improved to 92%, exceeding our 90% target.',
            action: 'Document best practices'
          }
        ]
      }
      
      setAnalyticsData(mockData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalytics()
    setRefreshing(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return null
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">Track your agency's performance and insights</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="w-20 h-6 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="w-16 h-8 bg-gray-200 rounded mb-2"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load analytics</h3>
          <p className="text-gray-600 mb-4">There was an error loading your analytics data.</p>
          <Button onClick={loadAnalytics}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your agency's performance and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            leftIcon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(analyticsData.overview.totalRevenue)}
            </div>
            <div className={`flex items-center text-sm ${getChangeColor(analyticsData.overview.revenueChange)}`}>
              {getChangeIcon(analyticsData.overview.revenueChange)}
              <span className="ml-1">
                {analyticsData.overview.revenueChange > 0 ? '+' : ''}
                {analyticsData.overview.revenueChange}%
              </span>
              <span className="text-gray-500 ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Projects</CardTitle>
            <Target className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsData.overview.activeProjects}
            </div>
            <div className={`flex items-center text-sm ${getChangeColor(analyticsData.overview.projectsChange)}`}>
              {getChangeIcon(analyticsData.overview.projectsChange)}
              <span className="ml-1">
                {analyticsData.overview.projectsChange > 0 ? '+' : ''}
                {analyticsData.overview.projectsChange}%
              </span>
              <span className="text-gray-500 ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Deliverables</CardTitle>
            <CheckSquare className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsData.overview.completedDeliverables}
            </div>
            <div className={`flex items-center text-sm ${getChangeColor(analyticsData.overview.deliverablesChange)}`}>
              {getChangeIcon(analyticsData.overview.deliverablesChange)}
              <span className="ml-1">
                {analyticsData.overview.deliverablesChange > 0 ? '+' : ''}
                {analyticsData.overview.deliverablesChange}%
              </span>
              <span className="text-gray-500 ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Team Utilization</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsData.overview.teamUtilization}%
            </div>
            <div className={`flex items-center text-sm ${getChangeColor(analyticsData.overview.utilizationChange)}`}>
              {getChangeIcon(analyticsData.overview.utilizationChange)}
              <span className="ml-1">
                {analyticsData.overview.utilizationChange > 0 ? '+' : ''}
                {analyticsData.overview.utilizationChange}%
              </span>
              <span className="text-gray-500 ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.charts.revenueByMonth.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.month}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-brand h-2 rounded-full"
                        style={{ width: `${(item.revenue / 150000) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(item.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Deliverables Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckSquare className="h-5 w-5 mr-2" />
              Deliverables by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.charts.deliverablesByStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">{item.status}</span>
                  </div>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.charts.teamPerformance.map((member, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{member.member}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-green-600">{member.completed} completed</span>
                      {member.overdue > 0 && (
                        <span className="text-xs text-red-600">{member.overdue} overdue</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(member.completed / (member.completed + member.overdue)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Client Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Client Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.charts.clientGrowth.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.month}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(item.clients / 25) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{item.clients} clients</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Key Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.insights.map((insight, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    insight.type === 'positive' ? 'bg-green-500' :
                    insight.type === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                  }`}></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                    {insight.action && (
                      <Badge variant="outline" className="text-xs">
                        Action: {insight.action}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 