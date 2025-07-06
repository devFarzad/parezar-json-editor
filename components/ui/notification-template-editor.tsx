'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationTemplate, MultiLanguageText } from '@/models/NotificationTemplate'
import { toast } from 'sonner'

interface NotificationTemplateEditorProps {
  template: NotificationTemplate
  onUpdate: (updatedTemplate: NotificationTemplate) => void
}

export function NotificationTemplateEditor({ template, onUpdate }: NotificationTemplateEditorProps) {
  const [title, setTitle] = useState<MultiLanguageText>(template.title)
  const [content, setContent] = useState<MultiLanguageText>(template.content)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setTitle(template.title)
    setContent(template.content)
  }, [template])

  const handleTitleChange = (lang: keyof MultiLanguageText, value: string) => {
    setTitle(prev => ({ ...prev, [lang]: value }))
  }

  const handleContentChange = (lang: keyof MultiLanguageText, value: string) => {
    setContent(prev => ({ ...prev, [lang]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/notification-templates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('idToken')}` // Assuming token is stored here
        },
        body: JSON.stringify({ id: template.id, title, content }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update template')
      }

      const updatedTemplate = { ...template, title, content }
      onUpdate(updatedTemplate)
      toast.success('Notification template updated successfully!')
    } catch (error: any) {
      toast.error(`Error updating template: ${error.message}`)
      console.error('Error updating notification template:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{template.id}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['en', 'ar', 'ku'].map((lang) => (
            <div key={lang} className="space-y-2">
              <Label htmlFor={`title-${template.id}-${lang}`}>Title ({lang.toUpperCase()})</Label>
              <Input
                id={`title-${template.id}-${lang}`}
                value={title[lang as keyof MultiLanguageText] || ''}
                onChange={(e) => handleTitleChange(lang as keyof MultiLanguageText, e.target.value)}
              />
              <Label htmlFor={`content-${template.id}-${lang}`}>Content ({lang.toUpperCase()})</Label>
              <Textarea
                id={`content-${template.id}-${lang}`}
                value={content[lang as keyof MultiLanguageText] || ''}
                onChange={(e) => handleContentChange(lang as keyof MultiLanguageText, e.target.value)}
                rows={4}
              />
            </div>
          ))}
        </div>
        <Button onClick={handleSubmit} disabled={loading} className="mt-4">
          {loading ? 'Updating...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  )
}
