'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Upload, Edit3, ChevronDown, ChevronRight, Eye, BarChart3, Bell, Settings, Cloud, CloudOff, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { useRouter } from 'next/navigation'

interface JsonFile {
  name: string
  lastModified: string
  size: number
}

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
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in and fetch data
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/login')
      } else {
        fetchStats()
        checkAwsConnection()
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
          setAwsStats({
            connected: true,
            totalFiles: data.totalObjects || 0,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center px-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600 text-base sm:text-lg">Professional JSON File Management</p>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 gap-6 px-4 sm:px-0">
        
        {/* JSON Management Section */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">JSON Management</CardTitle>
                  <CardDescription className="text-sm">Files, Analytics & Operations</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={toggleJsonManagement}
                className="flex items-center space-x-2 self-end sm:self-auto"
                size="sm"
              >
                {showJsonManagement ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="text-sm">{showJsonManagement ? 'Hide' : 'Expand'}</span>
              </Button>
            </div>
          </CardHeader>
          
          {/* JSON Management Summary */}
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalFiles}</div>
                <p className="text-xs sm:text-sm text-gray-500">Total Files</p>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.recentFiles}</div>
                <p className="text-xs sm:text-sm text-gray-500">Recent</p>
              </div>
            </div>

            {showJsonManagement && (
              <div className="space-y-4 border-t pt-4">
                {/* Analytics Section */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-sm sm:text-base">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics Overview
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-bold text-purple-600">{stats.totalEdits}</div>
                      <p className="text-xs text-gray-500">Total Edits</p>
                    </div>
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-bold text-orange-600">{stats.lastActivity}</div>
                      <p className="text-xs text-gray-500">Last Activity</p>
                    </div>
                  </div>
                </div>

                {/* Files Section */}
                {files.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center text-sm sm:text-base">
                      <FileText className="h-4 w-4 mr-2" />
                      Recent Files ({files.length})
                    </h4>
                    {files.slice(0, 3).map((file, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border rounded-lg gap-3 sm:gap-0">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{getFileIcon(file.name)}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                              <h5 className="font-medium text-gray-900 text-sm truncate">{file.name}</h5>
                              <Badge variant="secondary" className="text-xs self-start sm:self-auto">JSON</Badge>
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(file.lastModified).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Link href={`/editor?file=${encodeURIComponent(file.name)}`} className="self-end sm:self-auto">
                          <Button size="sm" variant="outline">
                            <Edit3 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">No JSON files yet</p>
                    <Link href="/dashboard/files">
                      <Button size="sm">
                        <Upload className="h-3 w-3 mr-1" />
                        Upload First File
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
                  <Link href="/dashboard/files" className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <Eye className="h-3 w-3 mr-1" />
                      Manage Files
                    </Button>
                  </Link>
                  <Link href="/dashboard/analytics" className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      View Analytics
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AWS JSON Management Section */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 sm:p-3 rounded-lg">
                  {awsStats.connected ? (
                    <Cloud className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                  ) : (
                    <CloudOff className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
                    <span>AWS JSON Management</span>
                    {awsStats.connected && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {awsStats.connected ? 'S3 Bucket Connected' : 'AWS Connection Required'}
                  </CardDescription>
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
          
          {/* AWS Management Summary */}
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-orange-600">
                  {awsStats.connected ? awsStats.totalFiles : '?'}
                </div>
                <p className="text-xs sm:text-sm text-gray-500">S3 Files</p>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {awsStats.connected ? awsStats.region : '--'}
                </div>
                <p className="text-xs sm:text-sm text-gray-500">Region</p>
              </div>
            </div>

            {showAwsManagement && (
              <div className="space-y-4 border-t pt-4">
                {awsStats.connected ? (
                  <div className="space-y-4">
                    {/* AWS Connection Info */}
                    <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-3 flex items-center text-sm sm:text-base">
                        <Cloud className="h-4 w-4 mr-2" />
                        AWS S3 Connection Active
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-base sm:text-lg font-bold text-green-600">{awsStats.bucketName}</div>
                          <p className="text-xs text-gray-500">Bucket Name</p>
                        </div>
                        <div className="text-center">
                          <div className="text-base sm:text-lg font-bold text-blue-600">{awsStats.lastSync}</div>
                          <p className="text-xs text-gray-500">Last Sync</p>
                        </div>
                      </div>
                    </div>

                    {/* AWS Quick Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                      <Link href="/dashboard/aws-files" className="flex-1">
                        <Button className="w-full" size="sm">
                          <Cloud className="h-3 w-3 mr-1" />
                          Manage AWS Files
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={checkAwsConnection}
                        className="flex-1"
                      >
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Check Status
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-yellow-50 rounded-lg">
                    <CloudOff className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-sm text-yellow-700 mb-3">AWS connection not configured</p>
                    <div className="space-y-2">
                      <p className="text-xs text-yellow-600">
                        Configure your AWS credentials to access S3 files
                      </p>
                      <Link href="/dashboard/aws-files">
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3 mr-1" />
                          Setup AWS Connection
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Always show quick access button */}
            {!showAwsManagement && (
              <div className="mt-3">
                <Link href="/dashboard/aws-files">
                  <Button size="sm" variant="outline" className="w-full">
                    <Cloud className="h-3 w-3 mr-1" />
                    {awsStats.connected ? 'Manage AWS Files' : 'Setup AWS Connection'}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex flex-col gap-3">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 sm:p-3 rounded-lg">
                  <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg sm:text-xl">Notifications</CardTitle>
                  <CardDescription className="text-sm">Configure & send notifications</CardDescription>
                </div>
              </div>
              <div className="flex flex-col xs:flex-row gap-2">
                <Link href="/dashboard/notifications" className="flex-1 xs:flex-none">
                  <Button className="w-full xs:w-auto" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    <span>Manage</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={toggleNotifications}
                  className="flex items-center justify-center space-x-2"
                  size="sm"
                >
                  {showNotifications ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="text-sm">{showNotifications ? 'Hide' : 'Preview'}</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {/* Notifications Summary */}
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">3</div>
                <p className="text-xs sm:text-sm text-gray-500">Languages</p>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">5</div>
                <p className="text-xs sm:text-sm text-gray-500">Templates</p>
              </div>
            </div>

            {showNotifications && (
              <div className="space-y-4 border-t pt-4">
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <Bell className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Notification Management</h3>
                  <p className="text-sm text-gray-500 mb-4 px-2">Send notifications to customers in multiple languages</p>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm text-gray-600">
                      <span className="flex items-center">🇺🇸 English</span>
                      <span className="flex items-center">🇸🇦 العربية</span>
                      <span className="flex items-center">🟡 کوردی</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link href="/dashboard/notifications">
                      <Button size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Open Notification Manager
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Future Sections Placeholder */}
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="text-center py-8">
          <div className="text-gray-400">
            <Plus className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">More Sections Coming Soon</h3>
            <p className="text-sm text-gray-500">Additional dashboard sections will be added here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 