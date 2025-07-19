'use client'

import { useState, useEffect } from 'react'
import { NotificationTemplate } from '@/models/NotificationTemplate'
import { NotificationTemplateEditor } from '@/components/ui/notification-template-editor'
import { toast } from 'sonner'

export default function NotificationsPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {

    console.log('Notification Page Running')
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/notification-templates', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('idToken')}` // Assuming token is stored here
          }
        })
        console.log('response is Notification Page')
        console.log(response)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to fetch templates')
        }
        const data = await response.json()
        setTemplates(data.templates)
      } catch (err: any) {
        setError(err.message)
        toast.error(`Error: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const handleUpdateTemplate = (updatedTemplate: NotificationTemplate) => {
    setTemplates(prev =>
      prev.map(template =>
        template.id === updatedTemplate.id ? updatedTemplate : template
      )
    )
  }

  if (loading) {
    return <div className="p-4">Loading notification templates...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Notification Templates</h1>
      {templates.length === 0 ? (
        <p>No notification templates found.</p>
      ) : (
        <div className="space-y-6">
          {templates.map(template => (
            <NotificationTemplateEditor
              key={template.id}
              template={template}
              onUpdate={handleUpdateTemplate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
