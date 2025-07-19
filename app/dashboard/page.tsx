'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Upload, Edit3, ChevronDown, ChevronRight, Eye, BarChart3, Bell, Settings, Cloud, CloudOff, CheckCircle, MessageCircle, Send, AlertTriangle, Languages, TrendingUp, Activity, Globe } from 'lucide-react'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { useRouter } from 'next/navigation'

interface JsonFile {
  name: string
  lastModified: string
  size: number
}

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

// Mock notification data for demonstration
const mockNotificationTemplates: NotificationTemplate[] = [
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
  },
  {
    id: 'payment-reminder',
    title: { en: 'Payment Reminder', ar: 'تذكير بالدفع', ku: 'بیرخستنەوەی پارەدان' },
    content: { en: 'Your payment is due', ar: 'دفعتك مستحقة', ku: 'پارەدانەکەت دەبێت' },
    type: 'warning',
    targetAudience: 'active',
    isActive: true,
    tags: ['payment'],
    priority: 'high',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    metadata: { category: 'payment', version: 1, description: 'Payment reminder for active users' }
  }
]

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalFiles: 0,
    recentFiles: 0,
    totalEdits: 0,
    lastActivity: 'Never'
  })
  const [files, setFiles] = useState<JsonFile[]>([])
  const [showJsonManagement, setShowJsonManagement] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAwsManagement, setShowAwsManagement] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [awsStats, setAwsStats] = useState({
    connected: false,
    totalFiles: 0,
    bucketName: '',
    region: '',
    lastSync: 'Never'
  })
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([])
  const [notificationStats, setNotificationStats] = useState({
    totalTemplates: 0,
    activeTemplates: 0,
    highPriorityTemplates: 0,
    languageCompletion: 0,
    totalSent: 0,
    deliveryRate: 0,
    openRate: 0,
    connected: false
  })
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in and fetch data
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/login')
      } else {
        fetchStats()
        checkAwsConnection()
        fetchNotificationData()
      }
    })

    return () => unsubscribe()
  }, [router])

  // Fetch dashboard stats with authentication
  const fetchStats = async () => {
    try {
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch('/api/files', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const fetchedFiles = await response.json()
        const filesList = fetchedFiles.files || []
        setFiles(filesList)
        setStats({
          totalFiles: filesList.length || 0,
          recentFiles: filesList.filter((file: any) => {
            const fileDate = new Date(file.lastModified)
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            return fileDate > weekAgo
          }).length || 0,
          totalEdits: filesList.length * 3 || 0, // Mock data
          lastActivity: filesList.length > 0 ? 'Today' : 'Never'
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const checkAwsConnection = async () => {
    try {
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch('/api/test-aws', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Fetch S3 files for an accurate count
          const s3FilesResponse = await fetch('/api/s3-files', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          let filesCount = 0
          if (s3FilesResponse.ok) {
            const s3FilesData = await s3FilesResponse.json()
            filesCount = (s3FilesData.files || []).length
          }

          setAwsStats({
            connected: true,
            totalFiles: filesCount,
            bucketName: data.bucketName || '',
            region: data.region || '',
            lastSync: 'Just now'
          })
        }
      }
    } catch (error) {
      console.log('AWS connection check failed - credentials may not be configured')
    }
  }

  const fetchNotificationData = async () => {
    try {
      const user = auth.currentUser
      if (!user) {
        // Use mock data if not authenticated
        setNotificationTemplates(mockNotificationTemplates)
        calculateNotificationStats(mockNotificationTemplates)
        return
      }

      const token = await user.getIdToken()
      const response = await fetch('/api/notification-templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        const templates = data.templates || []
        setNotificationTemplates(templates)
        calculateNotificationStats(templates)
      } else {
        // Fallback to mock data
        setNotificationTemplates(mockNotificationTemplates)
        calculateNotificationStats(mockNotificationTemplates)
      }
    } catch (error) {
      console.error('Error fetching notification data:', error)
      // Fallback to mock data
      setNotificationTemplates(mockNotificationTemplates)
      calculateNotificationStats(mockNotificationTemplates)
    }
  }

  const calculateNotificationStats = (templates: NotificationTemplate[]) => {
    const totalTemplates = templates.length
    const activeTemplates = templates.filter(t => t.isActive).length
    const highPriorityTemplates = templates.filter(t => t.priority === 'high').length
    
    // Calculate language completion
    let totalLanguageFields = 0
    let completedLanguageFields = 0
    
    templates.forEach(template => {
      ['en', 'ar', 'ku'].forEach(lang => {
        totalLanguageFields += 2 // title + content
        if (template.title[lang as keyof typeof template.title]?.trim()) completedLanguageFields++
        if (template.content[lang as keyof typeof template.content]?.trim()) completedLanguageFields++
      })
    })
    
    const languageCompletion = totalLanguageFields > 0 ? Math.round((completedLanguageFields / totalLanguageFields) * 100) : 0
    
    // Simulated delivery metrics
    const totalSent = templates.length * 150
    const deliveryRate = 94.7
    const openRate = 56.7
    
    setNotificationStats({
      totalTemplates,
      activeTemplates,
      highPriorityTemplates,
      languageCompletion,
      totalSent,
      deliveryRate,
      openRate,
      connected: totalTemplates > 0
    })
  }

  const toggleJsonManagement = async () => {
    if (!showJsonManagement && files.length === 0) {
      setLoadingFiles(true)
      // Files are already fetched in useEffect, but we can trigger a refresh if needed
      setLoadingFiles(false)
    }
    setShowJsonManagement(!showJsonManagement)
  }

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  const toggleAwsManagement = () => {
    setShowAwsManagement(!showAwsManagement)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (filename: string) => {
    if (filename.includes('config')) return '⚙️'
    if (filename.includes('data')) return '📊'
    if (filename.includes('user')) return '👤'
    if (filename.includes('setting')) return '🔧'
    return '📄'
  }

  const getLanguageFlag = (lang: string) => {
    switch (lang) {
      case 'ku': return '🇹🇯'
      case 'ar': return '🇸🇦'
      case 'en': return '🇺🇸'
      default: return '🌐'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center px-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-card-title mb-2">Dashboard</h1>
        <p className="text-muted-foreground text-base sm:text-lg">Professional JSON File Management</p>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 gap-6 px-4 sm:px-0">
        
        {/* Notification Analytics Section */}
        <Card className={`border-l-4 ${notificationStats.connected ? 'border-l-blue-500' : 'border-l-gray-400'}`}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center space-x-3">
                <div className={`${notificationStats.connected ? 'bg-blue-100' : 'bg-gray-100'} p-2 sm:p-3 rounded-lg`}>
                  <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">Notification Analytics</CardTitle>
                  <CardDescription className="text-sm">Monitor templates, delivery performance, and engagement metrics</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={toggleNotifications}
                className="flex items-center space-x-2 self-end sm:self-auto"
                size="sm"
              >
                {showNotifications ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="text-sm">{showNotifications ? 'Hide' : 'Expand'}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Badge variant={notificationStats.connected ? "default" : "secondary"}>
                  {notificationStats.connected ? "Active" : "No Data"}
                </Badge>
                <Badge variant="outline">
                  {notificationStats.totalTemplates} Templates
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Link href="/dashboard/notification-templates">
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                </Link>
                <Link href="/dashboard/analytics">
                  <Button size="sm" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Analytics
                  </Button>
                </Link>
              </div>
            </div>
            
            {showNotifications && (
              <div className="border-t pt-4 space-y-4">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg sm:text-xl font-bold text-blue-600">{notificationStats.totalTemplates}</div>
                    <p className="text-xs text-muted-foreground">Total Templates</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg sm:text-xl font-bold text-green-600">{notificationStats.activeTemplates}</div>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg sm:text-xl font-bold text-orange-600">{notificationStats.highPriorityTemplates}</div>
                    <p className="text-xs text-muted-foreground">High Priority</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg sm:text-xl font-bold text-purple-600">{notificationStats.languageCompletion}%</div>
                    <p className="text-xs text-muted-foreground">Language Complete</p>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Send className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Messages Sent</p>
                          <p className="text-2xl font-bold">{notificationStats.totalSent.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">+12.5% from last week</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Delivery Rate</p>
                          <p className="text-2xl font-bold">{notificationStats.deliveryRate}%</p>
                          <p className="text-xs text-muted-foreground">Excellent performance</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="text-sm font-medium">Open Rate</p>
                          <p className="text-2xl font-bold">{notificationStats.openRate}%</p>
                          <p className="text-xs text-muted-foreground">Above average</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Templates */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Recent Templates
                  </h4>
                  <div className="space-y-2">
                    {notificationTemplates.slice(0, 3).map((template) => (
                      <div key={template.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs">{getLanguageFlag('en')}</span>
                            <span className="text-xs">{getLanguageFlag('ar')}</span>
                            <span className="text-xs">{getLanguageFlag('ku')}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{template.id}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {template.title.en}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={template.priority === 'high' ? 'destructive' : template.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                            {template.priority}
                          </Badge>
                          <Badge variant={template.isActive ? 'default' : 'secondary'} className="text-xs">
                            {template.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  {notificationTemplates.length > 3 && (
                    <div className="text-center mt-3">
                      <Link href="/dashboard/notification-templates">
                        <Button variant="ghost" size="sm">
                          View All Templates
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link href="/dashboard/notification-templates">
                    <Button variant="outline" size="sm">
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit Templates
                    </Button>
                  </Link>
                  <Link href="/dashboard/analytics">
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      View Analytics
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={fetchNotificationData}>
                    <Activity className="h-4 w-4 mr-1" />
                    Refresh Data
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AWS S3 Management Section */}
        <Card className={`border-l-4 ${awsStats.connected ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center space-x-3">
                <div className={`${awsStats.connected ? 'bg-green-100' : 'bg-yellow-100'} p-2 sm:p-3 rounded-lg`}>
                  {awsStats.connected ? (
                    <Cloud className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  ) : (
                    <CloudOff className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">AWS S3 Storage</CardTitle>
                  <CardDescription className="text-sm">Manage files stored in your S3 bucket</CardDescription>
                </div>
              </div>
               <Button
                variant="ghost"
                onClick={toggleAwsManagement}
                className="flex items-center space-x-2 self-end sm:self-auto"
                size="sm"
              >
                {showAwsManagement ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="text-sm">{showAwsManagement ? 'Hide' : 'Expand'}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Badge variant={awsStats.connected ? "default" : "secondary"}>
                  {awsStats.connected ? "Connected" : "Not Connected"}
                </Badge>
              </div>
              {!awsStats.connected && (
                <Link href="/docs/env-setup-guide.md">
                  <Button size="sm" variant="outline">
                    Setup Guide
                  </Button>
                </Link>
              )}
            </div>
            {showAwsManagement && (
              <div className="border-t pt-4">
                {awsStats.connected ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-lg sm:text-xl font-bold text-green-500">{awsStats.totalFiles}</div>
                        <p className="text-xs text-muted-foreground">Files in Bucket</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-xl font-bold">{awsStats.bucketName}</div>
                        <p className="text-xs text-muted-foreground">Bucket</p>
                      </div>
                    </div>
                     <div className="flex justify-end pt-2">
                      <Link href="/dashboard/aws-files">
                        <Button variant="ghost" size="sm">
                          Manage S3 files
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                   <div className="text-center py-6 bg-muted/50 rounded-lg">
                     <CloudOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                     <p className="text-sm text-muted-foreground">
                       AWS S3 is not connected.
                     </p>
                     <p className="text-xs text-muted-foreground mt-1">
                       Follow the setup guide to link your S3 bucket.
                     </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 