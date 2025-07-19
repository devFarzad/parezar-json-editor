'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Activity, Users, MessageCircle, Send, CheckCircle, AlertTriangle, Globe, Languages, Clock, Target } from 'lucide-react'
import { auth } from '@/lib/firebaseClient'
import { onAuthStateChanged, User } from 'firebase/auth'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface NotificationTemplate {
  id: string
  title: {
    ku: string
    ar: string
    en: string
  }
  content: {
    ku: string
    ar: string
    en: string
  }
  type: string
  targetAudience: string
  isActive: boolean
  tags: string[]
  priority: string
  createdAt: string
  updatedAt: string
  metadata: {
    category: string
    version: number
    description: string
  }
}

// Mock data for testing
const mockTemplates: NotificationTemplate[] = [
  {
    id: 'welcome-message',
    title: { en: 'Welcome to Parezar', ar: 'مرحبا بك في باريزار', ku: 'بەخێربێیت بۆ پارێزار' },
    content: { en: 'Welcome to our platform', ar: 'مرحبا بك في منصتنا', ku: 'بەخێربێیت بۆ پلاتفۆرمەکەمان' },
    type: 'info',
    targetAudience: 'new',
    isActive: true,
    tags: ['welcome'],
    priority: 'high',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    metadata: { category: 'welcome', version: 1, description: 'Welcome message for new users' }
  },
  {
    id: 'order-confirmation',
    title: { en: 'Order Confirmed', ar: 'تم تأكيد الطلب', ku: 'داواکاری پشتڕاستکرایەوە' },
    content: { en: 'Your order has been confirmed', ar: 'تم تأكيد طلبك', ku: 'داواکاریەکەت پشتڕاستکرایەوە' },
    type: 'success',
    targetAudience: 'all',
    isActive: true,
    tags: ['order'],
    priority: 'medium',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    metadata: { category: 'order', version: 1, description: 'Order confirmation message' }
  }
]

// Simulated delivery metrics (in a real app, this would come from notification delivery logs)
const generateDeliveryMetrics = (templates: NotificationTemplate[]) => {
  const now = new Date()
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thisMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  return {
    totalSent: templates.length * 150, // Simulate 150 sends per template
    deliveredSuccessfully: templates.length * 142, // 94.7% delivery rate
    openRate: templates.length * 85, // 56.7% open rate
    clickRate: templates.length * 23, // 15.3% click rate
    weeklyGrowth: 12.5,
    monthlyGrowth: 34.2,
    averageDeliveryTime: 2.3, // seconds
    failureRate: 5.3, // percentage
    topPerformingTemplate: templates.find(t => t.priority === 'high')?.id || 'No high priority templates',
    languageDistribution: {
      en: Math.floor(templates.length * 0.45),
      ar: Math.floor(templates.length * 0.35),
      ku: Math.floor(templates.length * 0.20)
    },
    audienceEngagement: {
      all: 78.5,
      active: 85.2,
      new: 65.8,
      premium: 91.3
    }
  }
}

export default function AnalyticsPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
    console.log('Analytics page mounted')
  }, [])

  // Handle Firebase authentication state
  useEffect(() => {
    if (!mounted) return

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('Auth state changed:', currentUser ? 'User logged in' : 'No user')
      setUser(currentUser)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [mounted])

  const fetchTemplates = async () => {
    console.log('Fetching templates, user:', user)
    
    if (!user) {
      console.log('No user, using mock data')
      setTemplates(mockTemplates)
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const token = await user.getIdToken()
      const response = await fetch('/api/notification-templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch notification templates')
      const data = await response.json()
      console.log('Fetched templates:', data.templates)
      setTemplates(data.templates || [])
    } catch (err: any) {
      console.error('Error fetching templates:', err)
      setError(err.message || 'Error fetching notification templates')
      // Fallback to mock data on error
      setTemplates(mockTemplates)
    } finally {
      setLoading(false)
    }
  }

  // Fetch templates when user authentication is ready
  useEffect(() => {
    if (!authLoading && mounted) {
      console.log('Auth ready, fetching templates')
      fetchTemplates()
    }
  }, [authLoading, user, mounted])

  // Calculate analytics
  const getNotificationAnalytics = () => {
    console.log('Calculating analytics for templates:', templates.length)
    
    const totalTemplates = templates.length
    const activeTemplates = templates.filter(t => t.isActive).length
    const inactiveTemplates = totalTemplates - activeTemplates
    
    // Language completion analysis
    let totalLanguageFields = 0
    let completedLanguageFields = 0
    
    templates.forEach(template => {
      ['en', 'ar', 'ku'].forEach(lang => {
        totalLanguageFields += 2 // title + content
        if (template.title[lang as keyof typeof template.title]?.trim()) completedLanguageFields++
        if (template.content[lang as keyof typeof template.content]?.trim()) completedLanguageFields++
      })
    })
    
    const completionRate = totalLanguageFields > 0 ? Math.round((completedLanguageFields / totalLanguageFields) * 100) : 0
    
    // Category and priority analysis
    const categoryCounts = templates.reduce((acc, template) => {
      const category = template.metadata.category || 'other'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const priorityCounts = templates.reduce((acc, template) => {
      acc[template.priority] = (acc[template.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const typeCounts = templates.reduce((acc, template) => {
      acc[template.type] = (acc[template.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const audienceCounts = templates.reduce((acc, template) => {
      acc[template.targetAudience] = (acc[template.targetAudience] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Recent activity (templates updated in last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentlyUpdated = templates.filter(t => new Date(t.updatedAt) > weekAgo).length

    const analytics = {
      totalTemplates,
      activeTemplates,
      inactiveTemplates,
      completionRate,
      categoryCounts,
      priorityCounts,
      typeCounts,
      audienceCounts,
      recentlyUpdated,
      mostUsedCategory: Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b, 'none'),
      highPriorityCount: priorityCounts.high || 0,
      mostCommonType: Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b, 'info'),
      primaryAudience: Object.keys(audienceCounts).reduce((a, b) => audienceCounts[a] > audienceCounts[b] ? a : b, 'all')
    }
    
    console.log('Analytics calculated:', analytics)
    return analytics
  }

  const analytics = getNotificationAnalytics()
  const deliveryMetrics = generateDeliveryMetrics(templates)

  console.log('Render state:', { mounted, authLoading, loading, user: !!user, templatesCount: templates.length })

  // Show loading while hydration is happening or authentication is being checked
  if (!mounted || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Activity className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading analytics...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-card-title">Notification Analytics</h1>
          <p className="text-muted-foreground mt-2">Monitor notification templates, delivery performance, and engagement metrics</p>
        </div>
        <Button onClick={fetchTemplates} variant="outline" size="sm" disabled={loading}>
          <Activity className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            <p>User: {user ? 'Logged in' : 'Not logged in'}</p>
            <p>Templates: {templates.length}</p>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>Error: {error || 'None'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Error States */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Template Overview Analytics */}
      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalTemplates}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.activeTemplates} active, {analytics.inactiveTemplates} inactive
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Language Completion</CardTitle>
                <Languages className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.completionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  All languages filled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.highPriorityCount}</div>
                <p className="text-xs text-muted-foreground">
                  Require attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Updates</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.recentlyUpdated}</div>
                <p className="text-xs text-muted-foreground">
                  Updated this week
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Delivery Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deliveryMetrics.totalSent.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{deliveryMetrics.weeklyGrowth}% from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {deliveryMetrics.totalSent > 0 ? Math.round((deliveryMetrics.deliveredSuccessfully / deliveryMetrics.totalSent) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {deliveryMetrics.deliveredSuccessfully.toLocaleString()} delivered
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {deliveryMetrics.totalSent > 0 ? Math.round((deliveryMetrics.openRate / deliveryMetrics.totalSent) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {deliveryMetrics.openRate.toLocaleString()} opened
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {deliveryMetrics.totalSent > 0 ? Math.round((deliveryMetrics.clickRate / deliveryMetrics.totalSent) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {deliveryMetrics.clickRate.toLocaleString()} clicks
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Template Distribution
                </CardTitle>
                <CardDescription>
                  Breakdown of notification templates by category and priority
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">By Category</h4>
                    <div className="space-y-2">
                      {Object.entries(analytics.categoryCounts).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{category}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">By Priority</h4>
                    <div className="space-y-2">
                      {Object.entries(analytics.priorityCounts).map(([priority, count]) => (
                        <div key={priority} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{priority}</span>
                          <Badge variant={priority === 'high' ? 'destructive' : priority === 'medium' ? 'default' : 'secondary'}>
                            {count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Language & Audience Analytics
                </CardTitle>
                <CardDescription>
                  Language distribution and target audience breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Language Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🇺🇸 English</span>
                        <Badge variant="outline">{deliveryMetrics.languageDistribution.en}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🇸🇦 Arabic</span>
                        <Badge variant="outline">{deliveryMetrics.languageDistribution.ar}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🇹🇯 Kurdish</span>
                        <Badge variant="outline">{deliveryMetrics.languageDistribution.ku}</Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Target Audience</h4>
                    <div className="space-y-2">
                      {Object.entries(analytics.audienceCounts).map(([audience, count]) => (
                        <div key={audience} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{audience}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Insights
              </CardTitle>
              <CardDescription>
                Key metrics and recommendations for notification optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Top Performing</h4>
                  <p className="text-lg font-bold">{deliveryMetrics.topPerformingTemplate}</p>
                  <p className="text-xs text-muted-foreground">Highest engagement template</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Average Delivery Time</h4>
                  <p className="text-lg font-bold">{deliveryMetrics.averageDeliveryTime}s</p>
                  <p className="text-xs text-muted-foreground">System performance</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Failure Rate</h4>
                  <p className="text-lg font-bold">{deliveryMetrics.failureRate}%</p>
                  <p className="text-xs text-muted-foreground">Delivery failures</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">📊 Key Insights</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Most templates target "{analytics.primaryAudience}" audience</li>
                  <li>• "{analytics.mostCommonType}" is the most common notification type</li>
                  <li>• Language completion rate is {analytics.completionRate}% across all templates</li>
                  <li>• {analytics.recentlyUpdated} templates were updated this week</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-32">
          <Activity className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading notification analytics...</span>
        </div>
      )}

      {/* No Data State */}
      {!loading && templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Notification Data</h3>
            <p className="text-muted-foreground">
              Create some notification templates to see analytics here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 