'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  Send, 
  Save, 
  Plus, 
  Edit3, 
  Trash2, 
  Globe, 
  MessageSquare,
  Users,
  Settings,
  Loader2
} from 'lucide-react'
import { 
  NotificationTemplate,
  CreateNotificationTemplateRequest,
  MultiLanguageText
} from '@/models/NotificationTemplate'
import {
  saveNotificationTemplate,
  getUserNotificationTemplates,
  deleteNotificationTemplate,
  duplicateNotificationTemplate
} from '@/lib/notificationTemplateService'

export default function NotificationManagementPage() {
  const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'settings'>('send')
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar' | 'ku'>('en')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [templatesLoading, setTemplatesLoading] = useState(false)
  
  const [newNotification, setNewNotification] = useState<{
    title: MultiLanguageText
    content: MultiLanguageText
    type: 'info' | 'success' | 'warning' | 'error'
    targetAudience: 'all' | 'active' | 'new' | 'premium'
  }>({
    title: { en: '', ar: '', ku: '' },
    content: { en: '', ar: '', ku: '' },
    type: 'info',
    targetAudience: 'all'
  })

  const [templates, setTemplates] = useState<NotificationTemplate[]>([])

  // Load templates on component mount
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setTemplatesLoading(true)
    try {
      const response = await getUserNotificationTemplates()
      if (response.success && response.data) {
        setTemplates(response.data as NotificationTemplate[])
      } else {
        setError(response.error || 'Failed to load templates')
        // Set default templates if loading fails
        setTemplates([
          {
            id: 'default-1',
            title: {
              en: 'Welcome to Parezar',
              ar: 'مرحباً بك في باريزار', 
              ku: 'بەخێربێیت بۆ پارێزار'
            },
            content: {
              en: 'Welcome to our JSON file management system. Get started by uploading your first file.',
              ar: 'مرحباً بك في نظام إدارة ملفات JSON. ابدأ بتحميل ملفك الأول.',
              ku: 'بەخێربێیت بۆ سیستەمی بەڕێوەبردنی فایلی JSON. دەست پێ بکە بە بارکردنی یەکەم فایلەکەت.'
            },
            type: 'info',
            targetAudience: 'all',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            isActive: true
          }
        ])
      }
    } catch (err) {
      console.error('Error loading templates:', err)
      setError('Failed to load templates')
    } finally {
      setTemplatesLoading(false)
    }
  }

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'ku', name: 'کوردی', flag: '🟡' }
  ]

  const notificationTypes = [
    { value: 'info', label: 'Information', color: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' },
    { value: 'success', label: 'Success', color: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' },
    { value: 'warning', label: 'Warning', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' },
    { value: 'error', label: 'Error', color: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' }
  ]

  const handleSendNotification = () => {
    // Validation
    if (!newNotification.title[selectedLanguage] || !newNotification.content[selectedLanguage]) {
      setError('Please fill in all required fields')
      return
    }

    // TODO: Send notification logic will be implemented with Firebase
    setSuccess('Notification sent successfully!')
    setTimeout(() => setSuccess(''), 3000)
    
    // Reset form
    setNewNotification({
      title: { en: '', ar: '', ku: '' },
      content: { en: '', ar: '', ku: '' },
      type: 'info',
      targetAudience: 'all'
    })
  }

  const handleSaveTemplate = async () => {
    // Validation
    if (!newNotification.title.en || !newNotification.content.en) {
      setError('Please fill in at least English title and content')
      return
    }

    setLoading(true)
    try {
      const templateData: CreateNotificationTemplateRequest = {
        title: newNotification.title,
        content: newNotification.content,
        type: newNotification.type,
        targetAudience: newNotification.targetAudience
      }

      const response = await saveNotificationTemplate(templateData)
      
      if (response.success) {
        setSuccess('Template saved successfully!')
        await loadTemplates() // Reload templates
        
        // Reset form
        setNewNotification({
          title: { en: '', ar: '', ku: '' },
          content: { en: '', ar: '', ku: '' },
          type: 'info',
          targetAudience: 'all'
        })
      } else {
        setError(response.error || 'Failed to save template')
      }
    } catch (err) {
      console.error('Error saving template:', err)
      setError('Failed to save template')
    } finally {
      setLoading(false)
      setTimeout(() => {
        setSuccess('')
        setError('')
      }, 3000)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    setLoading(true)
    try {
      const response = await deleteNotificationTemplate(id)
      
      if (response.success) {
        setSuccess('Template deleted successfully!')
        await loadTemplates() // Reload templates
      } else {
        setError(response.error || 'Failed to delete template')
      }
    } catch (err) {
      console.error('Error deleting template:', err)
      setError('Failed to delete template')
    } finally {
      setLoading(false)
      setTimeout(() => {
        setSuccess('')
        setError('')
      }, 3000)
    }
  }

  const handleUseTemplate = (template: NotificationTemplate) => {
    setNewNotification({
      title: template.title,
      content: template.content,
      type: template.type,
      targetAudience: 'all'
    })
    setActiveTab('send')
    setSuccess('Template loaded!')
    setTimeout(() => setSuccess(''), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-card-title">Notification Management</h1>
        <p className="text-muted-foreground mt-2">Configure and send notifications to customers in multiple languages</p>
      </div>

      {/* Alerts */}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('send')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'send'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <Send className="h-4 w-4 inline mr-2" />
            Send Notification
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <MessageSquare className="h-4 w-4 inline mr-2" />
            Templates
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Settings
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'send' && (
            <Card>
              <CardHeader>
            <CardTitle>Compose Notification</CardTitle>
                <CardDescription>
              Select language, target audience and write your notification message
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
            {/* Language Selection */}
            <div className="space-y-2">
              <Label>Language</Label>
              <div className="flex space-x-2 rounded-md bg-muted p-1">
                {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => setSelectedLanguage(lang.code as 'en' | 'ar' | 'ku')}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
                      ${selectedLanguage === lang.code 
                        ? 'bg-background shadow-sm text-foreground' 
                        : 'text-muted-foreground hover:bg-background/50'
                      }
                    `}
                      >
                    {lang.flag} {lang.name}
                      </button>
                    ))}
                  </div>
                </div>

            {/* Notification Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title ({selectedLanguage})</Label>
                <Input
                  id="title"
                  placeholder={`Enter title in ${languages.find(l => l.code === selectedLanguage)?.name}`}
                  value={newNotification.title[selectedLanguage]}
                  onChange={e => setNewNotification({
                    ...newNotification,
                    title: { ...newNotification.title, [selectedLanguage]: e.target.value }
                  })}
                  dir={selectedLanguage === 'ar' || selectedLanguage === 'ku' ? 'rtl' : 'ltr'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content ({selectedLanguage})</Label>
                <Input
                  id="content"
                  placeholder={`Enter content in ${languages.find(l => l.code === selectedLanguage)?.name}`}
                  value={newNotification.content[selectedLanguage]}
                   onChange={e => setNewNotification({
                    ...newNotification,
                    content: { ...newNotification.content, [selectedLanguage]: e.target.value }
                  })}
                  dir={selectedLanguage === 'ar' || selectedLanguage === 'ku' ? 'rtl' : 'ltr'}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <div className="flex space-x-2">
                    {notificationTypes.map(type => (
                      <Badge
                        key={type.value}
                        onClick={() => setNewNotification({ ...newNotification, type: type.value as 'info' | 'success' | 'warning' | 'error' })}
                        className={`cursor-pointer ${
                          newNotification.type === type.value ? 'ring-2 ring-ring' : ''
                        } ${type.color}`}
                      >
                        {type.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  {/* Replace with Select component */}
                </div>
                </div>
                </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <Button onClick={handleSaveTemplate} variant="outline" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save as Template
              </Button>
              <Button onClick={handleSendNotification} disabled={loading}>
                      <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </Button>
                </div>
              </CardContent>
            </Card>
      )}

      {activeTab === 'templates' && (
            <Card>
              <CardHeader>
            <CardTitle>Notification Templates</CardTitle>
                <CardDescription>
              Manage your saved notification templates
                </CardDescription>
              </CardHeader>
              <CardContent>
          {templatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
              <div className="space-y-4">
                {templates.map(template => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{template.title.en}</CardTitle>
                          <CardDescription>
                            <Badge className={`${notificationTypes.find(t => t.value === template.type)?.color} mt-1`}>
                      {template.type}
                    </Badge>
                  </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleUseTemplate(template)}>
                            <Edit3 className="h-4 w-4 mr-2" /> Use
                    </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteTemplate(template.id)}>
                            <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{template.content.en}</p>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
          <Card>
            <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
              Configure notification preferences and integrations
              </CardDescription>
            </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Settings Under Construction</h3>
              <p className="text-muted-foreground">
                Advanced notification settings, including provider integrations (e.g., Firebase), will be available here soon.
              </p>
              </div>
            </CardContent>
          </Card>
      )}
    </div>
  )
} 