export interface MultiLanguageText {
  en: string
  ar: string
  ku: string
}

export interface NotificationTemplate {
  id: string
  title: MultiLanguageText
  content: MultiLanguageText
  type: 'info' | 'success' | 'warning' | 'error'
  targetAudience: 'all' | 'active' | 'new' | 'premium'
  createdAt: string
  updatedAt: string
  createdBy: string // User ID who created the template
  isActive: boolean
  tags?: string[]
  priority?: 'low' | 'medium' | 'high'
  metadata?: {
    category?: string
    version?: number
    description?: string
  }
}

export interface CreateNotificationTemplateRequest {
  title: MultiLanguageText
  content: MultiLanguageText
  type: 'info' | 'success' | 'warning' | 'error'
  targetAudience?: 'all' | 'active' | 'new' | 'premium'
  tags?: string[]
  priority?: 'low' | 'medium' | 'high'
  metadata?: {
    category?: string
    description?: string
  }
}

export interface UpdateNotificationTemplateRequest {
  id: string
  title?: MultiLanguageText
  content?: MultiLanguageText
  type?: 'info' | 'success' | 'warning' | 'error'
  targetAudience?: 'all' | 'active' | 'new' | 'premium'
  isActive?: boolean
  tags?: string[]
  priority?: 'low' | 'medium' | 'high'
  metadata?: {
    category?: string
    description?: string
  }
}

export interface NotificationTemplateFilter {
  type?: 'info' | 'success' | 'warning' | 'error'
  targetAudience?: 'all' | 'active' | 'new' | 'premium'
  isActive?: boolean
  createdBy?: string
  tags?: string[]
  category?: string
  priority?: 'low' | 'medium' | 'high'
}

export interface NotificationTemplateResponse {
  success: boolean
  message: string
  data?: NotificationTemplate | NotificationTemplate[]
  error?: string
}

// Validation functions
export const validateMultiLanguageText = (text: MultiLanguageText): boolean => {
  return !!(text.en && text.en.trim())
}

export const validateNotificationTemplate = (template: CreateNotificationTemplateRequest): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!validateMultiLanguageText(template.title)) {
    errors.push('English title is required')
  }

  if (!validateMultiLanguageText(template.content)) {
    errors.push('English content is required')
  }

  if (!['info', 'success', 'warning', 'error'].includes(template.type)) {
    errors.push('Invalid notification type')
  }

  if (template.targetAudience && !['all', 'active', 'new', 'premium'].includes(template.targetAudience)) {
    errors.push('Invalid target audience')
  }

  if (template.priority && !['low', 'medium', 'high'].includes(template.priority)) {
    errors.push('Invalid priority level')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Utility functions
export const createNotificationTemplateId = (): string => {
  return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const formatNotificationTemplate = (template: CreateNotificationTemplateRequest, createdBy: string): NotificationTemplate => {
  const now = new Date().toISOString()
  
  return {
    id: createNotificationTemplateId(),
    title: template.title,
    content: template.content,
    type: template.type,
    targetAudience: template.targetAudience || 'all',
    createdAt: now,
    updatedAt: now,
    createdBy,
    isActive: true,
    tags: template.tags || [],
    priority: template.priority || 'medium',
    metadata: {
      ...template.metadata,
      version: 1
    }
  }
}

export const getLanguageCompletionStatus = (template: NotificationTemplate) => {
  const languages = ['en', 'ar', 'ku'] as const
  const completion = {
    en: { hasTitle: !!template.title.en, hasContent: !!template.content.en },
    ar: { hasTitle: !!template.title.ar, hasContent: !!template.content.ar },
    ku: { hasTitle: !!template.title.ku, hasContent: !!template.content.ku }
  }

  const completionPercentage = languages.reduce((acc, lang) => {
    const langCompletion = completion[lang]
    const langScore = (langCompletion.hasTitle ? 0.5 : 0) + (langCompletion.hasContent ? 0.5 : 0)
    return acc + (langScore / languages.length)
  }, 0)

  return {
    completion,
    percentage: Math.round(completionPercentage * 100),
    isComplete: completionPercentage === 1
  }
} 