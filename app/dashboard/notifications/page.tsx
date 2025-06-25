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
    { value: 'info', label: 'Information', color: 'bg-blue-100 text-blue-800' },
    { value: 'success', label: 'Success', color: 'bg-green-100 text-green-800' },
    { value: 'warning', label: 'Warning', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'error', label: 'Error', color: 'bg-red-100 text-red-800' }
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
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Notification Management</h1>
        <p className="text-gray-600 mt-2">Configure and send notifications to customers in multiple languages</p>
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
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('send')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'send'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Send className="h-4 w-4 inline mr-2" />
            Send Notification
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageSquare className="h-4 w-4 inline mr-2" />
            Templates
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Settings
          </button>
        </nav>
      </div>

      {/* Send Notification Tab */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notification Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Send className="h-5 w-5 mr-2" />
                  Create Notification
                </CardTitle>
                <CardDescription>
                  Compose and send notifications to your customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Language Selector */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Language</Label>
                  <div className="flex space-x-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setSelectedLanguage(lang.code as 'en' | 'ar' | 'ku')}
                        className={`px-3 py-2 rounded-md text-sm font-medium border ${
                          selectedLanguage === lang.code
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="mr-2">{lang.flag}</span>
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notification Type */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Notification Type</Label>
                  <div className="flex space-x-2">
                    {notificationTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setNewNotification({ ...newNotification, type: type.value as any })}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          newNotification.type === type.value
                            ? type.color
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title Input */}
                <div>
                  <Label htmlFor="title" className="text-sm font-medium">
                    Title ({languages.find(l => l.code === selectedLanguage)?.name})
                  </Label>
                  <Input
                    id="title"
                    value={newNotification.title[selectedLanguage]}
                    onChange={(e) => setNewNotification({
                      ...newNotification,
                      title: { ...newNotification.title, [selectedLanguage]: e.target.value }
                    })}
                    placeholder="Enter notification title"
                    className="mt-1"
                    dir={selectedLanguage === 'ar' || selectedLanguage === 'ku' ? 'rtl' : 'ltr'}
                  />
                </div>

                {/* Content Input */}
                <div>
                  <Label htmlFor="content" className="text-sm font-medium">
                    Content ({languages.find(l => l.code === selectedLanguage)?.name})
                  </Label>
                  <textarea
                    id="content"
                    value={newNotification.content[selectedLanguage]}
                    onChange={(e) => setNewNotification({
                      ...newNotification,
                      content: { ...newNotification.content, [selectedLanguage]: e.target.value }
                    })}
                    placeholder="Enter notification content"
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    dir={selectedLanguage === 'ar' || selectedLanguage === 'ku' ? 'rtl' : 'ltr'}
                  />
                </div>

                {/* Target Audience */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Target Audience</Label>
                  <select
                    value={newNotification.targetAudience}
                    onChange={(e) => setNewNotification({ 
                      ...newNotification, 
                      targetAudience: e.target.value as 'all' | 'active' | 'new' | 'premium'
                    })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="all">All Users</option>
                    <option value="active">Active Users</option>
                    <option value="new">New Users</option>
                    <option value="premium">Premium Users</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button 
                    onClick={handleSendNotification} 
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Notification
                  </Button>
                  <Button 
                    onClick={handleSaveTemplate} 
                    variant="outline"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save as Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Card */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
                <CardDescription>
                  How your notification will appear
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`p-4 rounded-lg border-l-4 ${
                  newNotification.type === 'info' ? 'bg-blue-50 border-blue-500' :
                  newNotification.type === 'success' ? 'bg-green-50 border-green-500' :
                  newNotification.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-red-50 border-red-500'
                }`}>
                  <div className="flex items-start">
                    <Bell className={`h-5 w-5 mt-0.5 mr-3 ${
                      newNotification.type === 'info' ? 'text-blue-600' :
                      newNotification.type === 'success' ? 'text-green-600' :
                      newNotification.type === 'warning' ? 'text-yellow-600' :
                      'text-red-600'
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {newNotification.title[selectedLanguage] || 'Notification Title'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {newNotification.content[selectedLanguage] || 'Notification content will appear here...'}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date().toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Language Status */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Language Status</h5>
                  <div className="space-y-2">
                    {languages.map((lang) => (
                      <div key={lang.code} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {lang.flag} {lang.name}
                        </span>
                        <Badge variant={
                          newNotification.title[lang.code as keyof typeof newNotification.title] &&
                          newNotification.content[lang.code as keyof typeof newNotification.content]
                            ? "default" : "secondary"
                        }>
                          {newNotification.title[lang.code as keyof typeof newNotification.title] &&
                           newNotification.content[lang.code as keyof typeof newNotification.content]
                            ? "Complete" : "Missing"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Notification Templates</h2>
            <Button onClick={() => setActiveTab('send')} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Template
            </Button>
          </div>

          {templatesLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading templates...</span>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Yet</h3>
              <p className="text-gray-500 mb-4">Create your first notification template to get started</p>
              <Button onClick={() => setActiveTab('send')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge className={
                      template.type === 'info' ? 'bg-blue-100 text-blue-800' :
                      template.type === 'success' ? 'bg-green-100 text-green-800' :
                      template.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {template.type}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{template.title.en}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {template.content.en}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
                    <div className="flex space-x-1">
                      {languages.map((lang) => (
                        <span key={lang.code} className="text-xs">
                          {lang.flag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1"
                      disabled={loading}
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Use
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteTemplate(template.id)}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure default settings for notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Default Language</Label>
                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="ku">کوردی</option>
                </select>
              </div>

              <div>
                <Label className="text-sm font-medium">Notification Delivery</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" defaultChecked />
                    <span className="ml-2 text-sm text-gray-700">Email notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" defaultChecked />
                    <span className="ml-2 text-sm text-gray-700">In-app notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                    <span className="ml-2 text-sm text-gray-700">SMS notifications</span>
                  </label>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Notification Frequency</Label>
                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option value="instant">Instant</option>
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly summary</option>
                </select>
              </div>

              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 