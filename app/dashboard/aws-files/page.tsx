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
      return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">AWS JSON Files</h1>
        <p className="text-gray-600 mt-2">Manage JSON files stored in AWS S3/Lightsail bucket</p>
      </div>

      {/* Connection Status Card */}
      <Card className={`border-l-4 ${connectionStatus.connected ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${connectionStatus.connected ? 'bg-green-100' : 'bg-red-100'}`}>
                {connectionStatus.connected ? (
                  <Cloud className="h-6 w-6 text-green-600" />
                ) : (
                  <CloudOff className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  {getConnectionStatusIcon()}
                  <span>AWS Connection Status</span>
                </CardTitle>
                <CardDescription>{connectionStatus.message}</CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkAwsConnection}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
          </div>
        </CardHeader>
        {connectionStatus.connected && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{connectionStatus.totalObjects || 0}</div>
                <p className="text-sm text-gray-500">Total Objects</p>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">{connectionStatus.bucketName}</div>
                <p className="text-sm text-gray-500">Bucket Name</p>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">{connectionStatus.region}</div>
                <p className="text-sm text-gray-500">Region</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* File Operations */}
      {connectionStatus.connected && (
        <Card>
          <CardHeader>
            <CardTitle>File Operations</CardTitle>
            <CardDescription>Upload, manage, and edit JSON files in AWS S3</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="cursor-pointer"
                />
              </div>
              <Button 
                disabled={uploading || !connectionStatus.connected}
                onClick={() => fetchAwsFiles()}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {uploading ? 'Uploading...' : 'Refresh Files'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files List */}
      {connectionStatus.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>AWS S3 Files ({files.length})</span>
            </CardTitle>
            <CardDescription>JSON files stored in your AWS S3/Lightsail bucket</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2">Loading files from AWS...</span>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8">
                <Cloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No JSON files found in your AWS S3 bucket</p>
                <p className="text-sm text-gray-400">Upload your first JSON file to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getFileIcon(file.name)}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">{file.name}</h3>
                          <Badge variant="secondary">AWS S3</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatFileSize(file.size)}</span>
                          <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditFile(file.name)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFile(file.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Connection Help */}
      {!connectionStatus.connected && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              <span>AWS Connection Required</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-yellow-800">
              <p>To use AWS file management, you need to:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Configure your AWS credentials in `.env.local`</li>
                <li>Ensure your S3 bucket is accessible</li>
                <li>Verify your IAM permissions</li>
                <li>Check your network connection</li>
              </ol>
              <p className="text-xs text-yellow-600 mt-2">
                See the environment setup guide in your documentation for detailed instructions.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 