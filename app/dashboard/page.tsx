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
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-card-title mb-2">Dashboard</h1>
        <p className="text-muted-foreground text-base sm:text-lg">Professional JSON File Management</p>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 gap-6 px-4 sm:px-0">
        
  

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