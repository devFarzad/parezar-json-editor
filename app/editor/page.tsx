'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { JsonEditor } from '@/components/ui/json-editor'
import { Loader2, ArrowLeft, Save, FileJson, User, Search } from 'lucide-react'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearchTerm, setActiveSearchTerm] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearch = () => {
    const isNumeric = /^\d+$/.test(searchTerm)
    if (isNumeric && jsonData && 'articles' in jsonData && Array.isArray(jsonData.articles)) {
      const articleIdToFind = `article_${searchTerm}`
      const articleExists = jsonData.articles.some((article: any) => 
        typeof article === 'object' && article !== null && article.id === articleIdToFind
      )

      if (!articleExists) {
        setMessage({
          type: 'error',
          text: `Article with ID ${articleIdToFind} doesn't exist. Please search for another article.`
        })
        setTimeout(() => setMessage(null), 3000)
        return
      }
    }
    setActiveSearchTerm(searchTerm)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setActiveSearchTerm('')
  }

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
        const jsonDataString = JSON.stringify(jsonData, null, 2)
        const blob = new Blob([jsonDataString], { type: 'application/json' })

        setMessage({ type: 'success', text: 'Preparing to save...' })

        const presignedUrlResponse = await fetch('/api/generate-upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: filename,
            fileType: 'application/json',
          }),
        })

        if (!presignedUrlResponse.ok) {
          throw new Error('Failed to get a secure upload link from the server.')
        }

        const { url } = await presignedUrlResponse.json()

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
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }))
          throw new Error(`Failed to save changes: ${errorData.error || response.statusText}`)
        }

        setMessage({ type: 'success', text: 'Changes saved successfully!' })
      }
      
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>Loading JSON editor...</span>
        </div>
      </div>
    )
  }

  if (!jsonData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Alert className="max-w-md">
          <AlertDescription>
            Failed to load JSON data. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
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
                <FileJson className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-semibold text-foreground">JSON Editor</h1>
                <Badge variant="outline">{filename}</Badge>
                {isAwsFile && (
                  <Badge variant="secondary">
                    AWS S3
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <Button onClick={handleSignOut} variant="outline">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <Alert className={`mb-6 ${
            message.type === 'success' 
              ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300' 
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300'
          }`}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>JSON Content</CardTitle>
                <CardDescription>
                  Search, view, and edit the JSON content below.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Search article number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-64"
                />
                <Button onClick={handleSearch}><Search className="w-4 h-4 mr-2" /> Search</Button>
                <Button onClick={handleClearSearch} variant="outline">Clear</Button>
                <Button onClick={saveJsonData} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="min-h-[50vh] border rounded-md p-4 bg-muted/20">
              <JsonEditor 
                data={jsonData} 
                onChange={setJsonData}
                searchTerm={activeSearchTerm}
                onModalClose={handleClearSearch}
              />
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>Loading editor...</span>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  )
} 