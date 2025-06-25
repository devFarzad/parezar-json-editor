'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { JsonEditor } from '@/components/ui/json-editor'
import { Loader2, ArrowLeft, Save, FileJson, User } from 'lucide-react'
import Link from 'next/link'

type JsonData = Record<string, unknown>

function EditorContent() {
  const [user, setUser] = useState<any>(null)
  const [jsonData, setJsonData] = useState<JsonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [filename, setFilename] = useState<string>('')
  const [isAwsFile, setIsAwsFile] = useState<boolean>(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get filename and source from URL parameters
  useEffect(() => {
    const file = searchParams.get('file')
    const source = searchParams.get('source')
    if (file) {
      setFilename(file)
      setIsAwsFile(source === 'aws')
    } else {
      // If no file specified, redirect to dashboard
      router.replace('/dashboard')
    }
  }, [searchParams, router])

  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        router.replace('/login')
      }
    })

    return () => unsubscribe()
  }, [router])

  // Load JSON data when both user and filename are available
  useEffect(() => {
    if (user && filename) {
      loadJsonData()
    }
  }, [user, filename])

  const loadJsonData = async () => {
    if (!user || !filename) return
    
    try {
      setLoading(true)
      const idToken = await user.getIdToken()
      
      // Choose API endpoint based on file source
      const apiEndpoint = isAwsFile 
        ? `/api/s3-files/${encodeURIComponent(filename)}`
        : `/api/files/${encodeURIComponent(filename)}`
      
      const response = await fetch(apiEndpoint, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`)
      }

      const data = await response.json()
      setJsonData(data)
    } catch (error) {
      console.error('Error loading JSON:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to load JSON file' 
      })
    } finally {
      setLoading(false)
    }
  }

  const saveJsonData = async () => {
    if (!user || !jsonData || !filename) return

    try {
      setSaving(true)
      
      if (isAwsFile) {
        // For AWS files, use pre-signed URL approach to bypass Vercel's size limits
        const jsonDataString = JSON.stringify(jsonData, null, 2)
        const blob = new Blob([jsonDataString], { type: 'application/json' })

        setMessage({ type: 'success', text: 'Preparing to save...' })

        // =======================================================
        // STEP 1: Get the pre-signed URL from our new API route
        // =======================================================
        const presignedUrlResponse = await fetch('/api/generate-upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: filename, // The full path/key for the object in S3
            fileType: 'application/json',
          }),
        })

        if (!presignedUrlResponse.ok) {
          throw new Error('Failed to get a secure upload link from the server.')
        }

        const { url } = await presignedUrlResponse.json()

        // =====================================================
        // STEP 2: Upload the file directly to S3 using the URL
        // =====================================================
        setMessage({ type: 'success', text: 'Uploading file directly to AWS S3...' })
        const uploadResponse = await fetch(url, {
          method: 'PUT',
          body: blob,
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!uploadResponse.ok) {
          throw new Error('The direct upload to S3 failed.')
        }

        setMessage({ type: 'success', text: 'Changes saved successfully to AWS S3!' })
      } else {
        // For local files, use the existing approach
        const idToken = await user.getIdToken()
        const apiEndpoint = `/api/files/${encodeURIComponent(filename)}`

        const response = await fetch(apiEndpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify(jsonData)
        })

        if (!response.ok) {
          throw new Error('Failed to save changes')
        }

        setMessage({ type: 'success', text: 'Changes saved successfully!' })
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error saving JSON:', error)
      setMessage({ type: 'error', text: `Error: ${error instanceof Error ? error.message : 'Failed to save changes'}` })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.replace('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading JSON editor...</span>
        </div>
      </div>
    )
  }

  if (!jsonData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Alert className="max-w-md">
          <AlertDescription>
            Failed to load JSON data. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link href={isAwsFile ? "/dashboard/aws-files" : "/dashboard/files"}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to {isAwsFile ? 'AWS Files' : 'Files'}
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">JSON Editor</h1>
                <Badge variant="outline">{filename}</Badge>
                {isAwsFile && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                    AWS S3
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <Button
                onClick={saveJsonData}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : `Save to ${isAwsFile ? 'AWS S3' : 'Local'}`}
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {message && (
          <Alert className={`mb-6 ${
            message.type === 'success' 
              ? 'border-green-200 bg-green-50 text-green-800' 
              : 'border-red-200 bg-red-50 text-red-800'
          }`}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* File Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="w-5 h-5" />
              File Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Filename</p>
                <p className="text-sm text-gray-900">{filename}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Storage</p>
                <p className="text-sm text-gray-900">
                  {isAwsFile ? 'AWS S3 Bucket' : 'Local Storage'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <Badge variant={isAwsFile ? "secondary" : "outline"}>
                  {isAwsFile ? 'Cloud Storage' : 'Local File'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* JSON Editor Card */}
        <Card>
          <CardHeader>
            <CardTitle>JSON Editor</CardTitle>
            <CardDescription>
              Edit your JSON data using the visual editor below. 
              {isAwsFile ? ' Changes will be saved to AWS S3.' : ' Changes will be saved locally.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-96">
              <JsonEditor 
                data={jsonData} 
                onChange={setJsonData}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {isAwsFile ? '🌩️ Stored in AWS S3' : '💾 Stored locally'}
            </div>
            <Button
              onClick={saveJsonData}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : `Save Changes${isAwsFile ? ' to S3' : ''}`}
            </Button>
          </CardFooter>
        </Card>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <span className="font-medium text-blue-600">1.</span>
                <span>Click on any value in the JSON tree to edit it directly</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium text-blue-600">2.</span>
                <span>Use the modal editors for complex values (objects, arrays, long strings)</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium text-blue-600">3.</span>
                <span>Changes are automatically validated - invalid JSON will show an error</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium text-blue-600">4.</span>
                <span>
                  Click "Save Changes" to persist your modifications
                  {isAwsFile ? ' to AWS S3' : ' to local storage'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading editor...</span>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  )
} 