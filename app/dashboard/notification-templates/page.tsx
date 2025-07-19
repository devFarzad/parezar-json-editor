'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Globe, MessageCircle, RefreshCw, Edit, Save, X, BarChart3, TrendingUp, Activity, Languages, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { auth } from '@/lib/firebaseClient'
import { onAuthStateChanged, User } from 'firebase/auth'

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
  metadata: {
    category: string
    version: number
    description: string
  }
}

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  const [editForm, setEditForm] = useState({
    title: { ku: '', ar: '', en: '' },
    content: { ku: '', ar: '', en: '' }
  })
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState('')

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle Firebase authentication state
  useEffect(() => {
    if (!mounted) return

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [mounted])

  const fetchTemplates = async () => {
    if (!user) {
      setError('Authentication required')
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
      setTemplates(data.templates || [])
    } catch (err: any) {
      setError(err.message || 'Error fetching notification templates')
    } finally {
      setLoading(false)
    }
  }

  // Fetch templates when user authentication is ready
  useEffect(() => {
    if (!authLoading && mounted) {
      fetchTemplates()
    }
  }, [authLoading, user, mounted])

  // Analytics calculations
  const getAnalytics = () => {
    const totalTemplates = templates.length
    const activeTemplates = templates.filter(t => t.isActive).length
    const inactiveTemplates = totalTemplates - activeTemplates
    
    let totalLanguageFields = 0
    let completedLanguageFields = 0
    
    templates.forEach(template => {
      // Count title fields
      ['en', 'ar', 'ku'].forEach(lang => {
        totalLanguageFields += 2 // title + content
        if (template.title[lang as keyof typeof template.title]?.trim()) completedLanguageFields++
        if (template.content[lang as keyof typeof template.content]?.trim()) completedLanguageFields++
      })
    })
    
    const completionRate = totalLanguageFields > 0 ? Math.round((completedLanguageFields / totalLanguageFields) * 100) : 0
    
    const categoryCounts = templates.reduce((acc, template) => {
      const category = template.metadata.category || 'other'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const priorityCounts = templates.reduce((acc, template) => {
      acc[template.priority] = (acc[template.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalTemplates,
      activeTemplates,
      inactiveTemplates,
      completionRate,
      categoryCounts,
      priorityCounts,
      mostUsedCategory: Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b, 'none'),
      highPriorityCount: priorityCounts.high || 0
    }
  }

  const analytics = getAnalytics()

  const handleEditClick = (template: NotificationTemplate) => {
    setEditingTemplate(template)
    setEditForm({
      title: { ...template.title },
      content: { ...template.content }
    })
    setUpdateError('')
    setUpdateSuccess('')
    setIsEditModalOpen(true)
  }

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !user) return

    setUpdating(true)
    setUpdateError('')
    setUpdateSuccess('')

    try {
      // Only send fields that have actually changed
      const changedFields: any = {}
      const originalTemplate = editingTemplate

      // Check which title fields changed
      const titleChanges: any = {}
      if (editForm.title.en !== originalTemplate.title.en) {
        titleChanges.en = editForm.title.en
      }
      if (editForm.title.ar !== originalTemplate.title.ar) {
        titleChanges.ar = editForm.title.ar
      }
      if (editForm.title.ku !== originalTemplate.title.ku) {
        titleChanges.ku = editForm.title.ku
      }
      if (Object.keys(titleChanges).length > 0) {
        changedFields.title = titleChanges
      }

      // Check which content fields changed
      const contentChanges: any = {}
      if (editForm.content.en !== originalTemplate.content.en) {
        contentChanges.en = editForm.content.en
      }
      if (editForm.content.ar !== originalTemplate.content.ar) {
        contentChanges.ar = editForm.content.ar
      }
      if (editForm.content.ku !== originalTemplate.content.ku) {
        contentChanges.ku = editForm.content.ku
      }
      if (Object.keys(contentChanges).length > 0) {
        changedFields.content = contentChanges
      }

      // If no changes, don't make the API call
      if (Object.keys(changedFields).length === 0) {
        setUpdateSuccess('No changes detected!')
        setTimeout(() => {
          setIsEditModalOpen(false)
          setUpdateSuccess('')
        }, 1500)
        return
      }

      console.log('Sending only changed fields:', changedFields)

      const token = await user.getIdToken()
      const response = await fetch('/api/notification-templates', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingTemplate.id,
          ...changedFields,
        }),
      })

      if (!response.ok) throw new Error('Failed to update template')

      setUpdateSuccess('Template updated successfully!')
      
      // Update local state
      setTemplates(prev => prev.map(template => 
        template.id === editingTemplate.id 
          ? { ...template, title: editForm.title, content: editForm.content }
          : template
      ))

      setTimeout(() => {
        setIsEditModalOpen(false)
        setUpdateSuccess('')
      }, 1500)

    } catch (err: any) {
      setUpdateError(err.message || 'Error updating template')
    } finally {
      setUpdating(false)
    }
  }

  const getLanguageFlag = (lang: string) => {
    switch (lang) {
      case 'ku': return '🇹🇯'
      case 'ar': return '🇸🇦'
      case 'en': return '🇺🇸'
      default: return '🌐'
    }
  }

  const getLanguageName = (lang: string) => {
    switch (lang) {
      case 'ku': return 'Kurdish'
      case 'ar': return 'Arabic'
      case 'en': return 'English'
      default: return lang
    }
  }

  // Show loading while hydration is happening or authentication is being checked
  if (!mounted || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          {!mounted ? 'Loading...' : 'Checking authentication...'}
        </span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-card-title">Notification Templates</h1>
          <p className="text-muted-foreground mt-2">
            Manage multilingual notification templates stored in Firestore
          </p>
        </div>
        <Button onClick={fetchTemplates} variant="outline" size="sm" disabled={loading || !user}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Analytics Overview */}
      {!loading && !error && user && (
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
              <CardTitle className="text-sm font-medium">Most Used Category</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{analytics.mostUsedCategory}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.categoryCounts[analytics.mostUsedCategory] || 0} templates
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
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading templates...</span>
        </div>
      )}

      {/* Error States */}
      {!user && !authLoading && (
        <Alert variant="destructive">
          <AlertDescription>You must be logged in to view notification templates.</AlertDescription>
        </Alert>
      )}

      {error && user && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* No Templates Found */}
      {!loading && !error && user && templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-10">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No notification templates found</h3>
            <p className="text-sm text-muted-foreground">
              No templates are currently configured in Firestore at configs/notification-templates
            </p>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      {!loading && !error && user && templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Notification Templates ({templates.length})
            </CardTitle>
            <CardDescription>
              Click the edit button to modify template content for each language
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{template.id}</h3>
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{template.priority}</Badge>
                      <Badge variant="secondary">
                        <Globe className="h-3 w-3 mr-1" />
                        {template.targetAudience}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.metadata.description}
                    </p>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span>🇺🇸</span>
                        <span className="font-medium">EN:</span>
                        <span className="text-muted-foreground truncate max-w-[200px]">
                          {template.title.en || 'No title'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🇸🇦</span>
                        <span className="font-medium">AR:</span>
                        <span className="text-muted-foreground truncate max-w-[200px]">
                          {template.title.ar || 'No title'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🇹🇯</span>
                        <span className="font-medium">KU:</span>
                        <span className="text-muted-foreground truncate max-w-[200px]">
                          {template.title.ku || 'No title'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(template)}
                    className="ml-4"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Notification Template</DialogTitle>
            <DialogDescription>
              Update the title and content for {editingTemplate?.id} in all three languages
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {(['en', 'ar', 'ku'] as const).map((lang) => (
              <div key={lang} className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{getLanguageFlag(lang)}</span>
                  <h3 className="font-semibold">{getLanguageName(lang)}</h3>
                  <Badge variant="outline" className="text-xs">
                    {lang.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`title-${lang}`}>Title</Label>
                    <Input
                      id={`title-${lang}`}
                      value={editForm.title[lang]}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        title: { ...prev.title, [lang]: e.target.value }
                      }))}
                      placeholder={`Enter title in ${getLanguageName(lang)}`}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`content-${lang}`}>Content</Label>
                    <Textarea
                      id={`content-${lang}`}
                      value={editForm.content[lang]}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        content: { ...prev.content, [lang]: e.target.value }
                      }))}
                      placeholder={`Enter content in ${getLanguageName(lang)}`}
                      rows={3}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {updateError && (
            <Alert variant="destructive">
              <AlertDescription>{updateError}</AlertDescription>
            </Alert>
          )}

          {updateSuccess && (
            <Alert>
              <AlertDescription>{updateSuccess}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={updating}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTemplate}
              disabled={updating}
            >
              {updating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {updating ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
