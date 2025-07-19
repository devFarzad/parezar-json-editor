'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, Edit, Upload, Plus, LogOut } from 'lucide-react'

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
    // Check if user is logged in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/login')
      } else {
        fetchFiles()
      }
    })

    return () => unsubscribe()
  }, [router])

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

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.replace('/login')
    } catch (error) {
      setError('Failed to sign out')
    }
  }

  const createNewFile = () => {
    const filename = prompt('Enter new file name (without .json extension):')
    if (!filename) return

    const fullFilename = filename.endsWith('.json') ? filename : `${filename}.json`
    router.push(`/editor?file=${encodeURIComponent(fullFilename)}&new=true`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">JSON File Manager</h1>
            <p className="text-gray-600 mt-1">Manage and edit your JSON files</p>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Upload Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload JSON File
            </CardTitle>
            <CardDescription>
              Upload a new JSON file to manage and edit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <Input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={uploading}
                className="flex-1"
              />
              <Button 
                onClick={createNewFile} 
                className="flex items-center gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                New File
              </Button>
            </div>
            {uploading && (
              <p className="text-sm text-blue-600 mt-2">Uploading...</p>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
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
              <div className="text-center py-8 text-gray-500">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No JSON files yet. Upload or create a new file to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{file.name}</h3>
                      <p className="text-sm text-gray-500">
                        Last modified: {new Date(file.lastModified).toLocaleString()}
                        {file.size && ` • ${Math.round(file.size / 1024)}KB`}
                      </p>
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
    </div>
  )
} 