'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Cloud, 
  CloudOff, 
  Loader2, 
  Upload, 
  FileText, 
  Edit, 
  Trash2, 
  Plus, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download
} from 'lucide-react'

interface AwsFile {
  name: string
  lastModified: string
  size: number
}

interface ConnectionStatus {
  connected: boolean
  message: string
  bucketName?: string
  region?: string
  totalObjects?: number
  error?: string
}

export default function AwsFilesPage() {
  const [files, setFiles] = useState<AwsFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    message: 'Checking connection...'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAwsConnection()
    if (connectionStatus.connected) {
      fetchAwsFiles()
    }
  }, [])

  const checkAwsConnection = async () => {
    try {
      const user = auth.currentUser
      if (!user) {
        setConnectionStatus({
          connected: false,
          message: 'Authentication required'
        })
        return
      }

      const token = await user.getIdToken()
      const response = await fetch('/api/test-aws', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      
      if (data.success) {
        setConnectionStatus({
          connected: true,
          message: 'Connected to AWS S3',
          bucketName: data.bucketName,
          region: data.region,
          totalObjects: data.totalObjects
        })
        fetchAwsFiles()
      } else {
        setConnectionStatus({
          connected: false,
          message: data.error || 'Connection failed',
          error: data.errorCode
        })
      }
    } catch (error) {
      setConnectionStatus({
        connected: false,
        message: 'Failed to check AWS connection',
        error: 'NetworkError'
      })
    }
  }

  const fetchAwsFiles = async () => {
    try {
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch('/api/s3-files', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch files from S3')
      }
    } catch (error) {
      setError('Error fetching files from AWS')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      setError('Please select a JSON file')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const user = auth.currentUser
      if (!user) return

      const fileContent = await file.text()
      
      // Validate JSON
      try {
        JSON.parse(fileContent)
      } catch {
        setError('Invalid JSON file')
        setUploading(false)
        return
      }

      const token = await user.getIdToken()
      const response = await fetch('/api/s3-files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          content: fileContent,
        }),
      })

      if (response.ok) {
        setSuccess('File uploaded successfully to AWS S3!')
        fetchAwsFiles() // Refresh the list
        // Clear the file input
        event.target.value = ''
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to upload file to S3')
      }
    } catch (error) {
      setError('Error uploading file to AWS')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename} from AWS S3?`)) return

    try {
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch(`/api/s3-files?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setSuccess('File deleted successfully from AWS S3!')
        fetchAwsFiles() // Refresh the list
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete file from S3')
      }
    } catch (error) {
      setError('Error deleting file from AWS')
    }
  }

  const handleEditFile = (filename: string) => {
    router.push(`/editor?file=${encodeURIComponent(filename)}&source=aws`)
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

  const getConnectionStatusIcon = () => {
    if (connectionStatus.connected) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else {
      return <XCircle className="h-5 w-5 text-destructive" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-card-title">AWS JSON Files</h1>
        <p className="text-muted-foreground mt-2">Manage JSON files stored in your AWS S3 bucket</p>
      </div>

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {getConnectionStatusIcon()}
              <CardTitle>AWS S3 Connection</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkAwsConnection}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
          <CardDescription className="mt-2">
            {connectionStatus.message}
          </CardDescription>
        </CardHeader>
        {connectionStatus.connected && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-semibold text-foreground">Bucket:</span> {connectionStatus.bucketName}
              </div>
              <div>
                <span className="font-semibold text-foreground">Region:</span> {connectionStatus.region}
              </div>
              <div>
                <span className="font-semibold text-foreground">Total Files:</span> {files.length}
              </div>
            </div>
          </CardContent>
        )}
        {!connectionStatus.connected && connectionStatus.error && (
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error Code: {connectionStatus.error}. Check documentation for troubleshooting steps.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Upload Section */}
      {connectionStatus.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload to S3
            </CardTitle>
            <CardDescription>
              Upload JSON files directly to your S3 bucket.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                <p className="text-sm text-muted-foreground mt-2">Select a .json file to upload.</p>
              </div>
            </div>
            {uploading && <p className="text-sm text-primary mt-2">Uploading...</p>}
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* File List */}
      <Card>
        <CardHeader>
          <CardTitle>File List</CardTitle>
          <CardDescription>A list of all your JSON files stored in the S3 bucket.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : files.length > 0 ? (
            <ul className="space-y-3">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4 flex-shrink min-w-0">
                    <FileText className="h-6 w-6 text-primary" />
                    <div className="flex-shrink min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Last modified: {new Date(file.lastModified).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditFile(file.name)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file.name)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              {connectionStatus.connected ? (
                <>
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="mt-4 text-lg font-medium text-foreground">No files found in S3</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload your first JSON file to get started.
                  </p>
                </>
              ) : (
                <>
                  <CloudOff className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="mt-4 text-lg font-medium text-foreground">S3 Not Connected</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Please configure your AWS credentials to view files.
                  </p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 