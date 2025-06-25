'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit, Upload, Plus, FileText, Calendar, HardDrive } from 'lucide-react'

interface JsonFile {
  name: string
  lastModified: string
  size: number
}

export default function FilesPage() {
  const [files, setFiles] = useState<JsonFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
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
        const data = await response.json()
        setFiles(data.files || [])
      } else {
        setError('Failed to fetch files')
      }
    } catch (error) {
      setError('Error fetching files')
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
      const response = await fetch('/api/files', {
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
        setSuccess('File uploaded successfully!')
        fetchFiles() // Refresh the list
        // Clear the file input
        event.target.value = ''
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to upload file')
      }
    } catch (error) {
      setError('Error uploading file')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return

    try {
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch(`/api/files?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setSuccess('File deleted successfully!')
        fetchFiles() // Refresh the list
      } else {
        setError('Failed to delete file')
      }
    } catch (error) {
      setError('Error deleting file')
    }
  }

  const handleEditFile = (filename: string) => {
    router.push(`/editor?file=${encodeURIComponent(filename)}`)
  }

  const createNewFile = () => {
    const filename = prompt('Enter new file name (without .json extension):')
    if (!filename) return

    const fullFilename = filename.endsWith('.json') ? filename : `${filename}.json`
    router.push(`/editor?file=${encodeURIComponent(fullFilename)}&new=true`)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">JSON Files</h1>
        <p className="text-gray-600 mt-2">Manage, edit, and organize your JSON files</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files.length}</div>
            <p className="text-xs text-muted-foreground">JSON files stored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(files.reduce((acc, file) => acc + (file.size || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">Storage used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {files.filter(file => {
                const fileDate = new Date(file.lastModified)
                const today = new Date()
                return fileDate.toDateString() === today.toDateString()
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Modified today</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload & Create
          </CardTitle>
          <CardDescription>
            Upload existing JSON files or create new ones from scratch
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
              {uploading && (
                <p className="text-sm text-blue-600 mt-2">Uploading...</p>
              )}
            </div>
            <Button 
              onClick={createNewFile} 
              className="flex items-center gap-2"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              New File
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
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

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Your JSON Files</CardTitle>
          <CardDescription>
            {files.length === 0 ? 'No files found' : `${files.length} file(s) available`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No JSON files yet</h3>
              <p className="mt-2 text-gray-500">Get started by uploading a file or creating a new one.</p>
              <div className="mt-6 flex gap-3 justify-center">
                <Button onClick={createNewFile} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New File
                </Button>
                <Button variant="outline" onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{getFileIcon(file.name)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{file.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          JSON
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(file.lastModified).toLocaleString()}
                        </span>
                        {file.size && (
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatFileSize(file.size)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditFile(file.name)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteFile(file.name)}
                      size="sm"
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 