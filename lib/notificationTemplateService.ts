import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp, Timestamp } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import app from './firebaseClient'
import { 
  NotificationTemplate, 
  CreateNotificationTemplateRequest, 
  UpdateNotificationTemplateRequest,
  NotificationTemplateFilter,
  NotificationTemplateResponse,
  validateNotificationTemplate,
  formatNotificationTemplate
} from '@/models/NotificationTemplate'

const db = getFirestore(app)
const auth = getAuth(app)

// Firebase collection path: configs/notification_templates/users
const COLLECTION_PATH = 'configs/notification_templates'

/**
 * Save a new notification template to Firebase
 */
export const saveNotificationTemplate = async (
  templateData: CreateNotificationTemplateRequest
): Promise<NotificationTemplateResponse> => {
  try {
    // Validate the template data
    const validation = validateNotificationTemplate(templateData)
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed',
        error: validation.errors.join(', ')
      }
    }

    // Get current user
    const currentUser = auth.currentUser
    if (!currentUser) {
      return {
        success: false,
        message: 'User must be authenticated',
        error: 'No authenticated user found'
      }
    }

    // Format the template with additional metadata
    const formattedTemplate = formatNotificationTemplate(templateData, currentUser.uid)
    
    // Create document reference
    const docRef = doc(db, COLLECTION_PATH, formattedTemplate.id)
    
    // Save to Firebase with server timestamp
    await setDoc(docRef, {
      ...formattedTemplate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return {
      success: true,
      message: 'Template saved successfully',
      data: formattedTemplate
    }
  } catch (error) {
    console.error('Error saving notification template:', error)
    return {
      success: false,
      message: 'Failed to save template',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get a notification template by ID
 */
export const getNotificationTemplate = async (
  templateId: string
): Promise<NotificationTemplateResponse> => {
  try {
    const docRef = doc(db, COLLECTION_PATH, templateId)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      return {
        success: false,
        message: 'Template not found',
        error: `No template found with ID: ${templateId}`
      }
    }
    
    const data = docSnap.data()
    
    // Convert Firebase timestamps to ISO strings
    const template: NotificationTemplate = {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt
    } as NotificationTemplate
    
    return {
      success: true,
      message: 'Template retrieved successfully',
      data: template
    }
  } catch (error) {
    console.error('Error getting notification template:', error)
    return {
      success: false,
      message: 'Failed to get template',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all notification templates with optional filtering
 */
export const getNotificationTemplates = async (
  filter?: NotificationTemplateFilter,
  limitCount: number = 50
): Promise<NotificationTemplateResponse> => {
  try {
    let q = query(
      collection(db, COLLECTION_PATH),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
    
    // Apply filters
    if (filter) {
      if (filter.type) {
        q = query(q, where('type', '==', filter.type))
      }
      if (filter.targetAudience) {
        q = query(q, where('targetAudience', '==', filter.targetAudience))
      }
      if (filter.isActive !== undefined) {
        q = query(q, where('isActive', '==', filter.isActive))
      }
      if (filter.createdBy) {
        q = query(q, where('createdBy', '==', filter.createdBy))
      }
      if (filter.priority) {
        q = query(q, where('priority', '==', filter.priority))
      }
      if (filter.category) {
        q = query(q, where('metadata.category', '==', filter.category))
      }
    }
    
    const querySnapshot = await getDocs(q)
    const templates: NotificationTemplate[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const template: NotificationTemplate = {
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt
      } as NotificationTemplate
      templates.push(template)
    })
    
    return {
      success: true,
      message: `Retrieved ${templates.length} templates`,
      data: templates
    }
  } catch (error) {
    console.error('Error getting notification templates:', error)
    return {
      success: false,
      message: 'Failed to get templates',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get notification templates for current user
 */
export const getUserNotificationTemplates = async (
  limitCount: number = 50
): Promise<NotificationTemplateResponse> => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      return {
        success: false,
        message: 'User must be authenticated',
        error: 'No authenticated user found'
      }
    }
    
    return await getNotificationTemplates(
      { createdBy: currentUser.uid, isActive: true },
      limitCount
    )
  } catch (error) {
    console.error('Error getting user notification templates:', error)
    return {
      success: false,
      message: 'Failed to get user templates',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update a notification template
 */
export const updateNotificationTemplate = async (
  updateData: UpdateNotificationTemplateRequest
): Promise<NotificationTemplateResponse> => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      return {
        success: false,
        message: 'User must be authenticated',
        error: 'No authenticated user found'
      }
    }
    
    // Get existing template to verify ownership
    const existingTemplate = await getNotificationTemplate(updateData.id)
    if (!existingTemplate.success || !existingTemplate.data) {
      return existingTemplate
    }
    
    const template = existingTemplate.data as NotificationTemplate
    if (template.createdBy !== currentUser.uid) {
      return {
        success: false,
        message: 'Unauthorized to update this template',
        error: 'You can only update templates you created'
      }
    }
    
    // Prepare update data
    const updateFields: Partial<NotificationTemplate> = {
      ...updateData,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...template.metadata,
        ...updateData.metadata,
        version: (template.metadata?.version || 1) + 1
      }
    }
    
    // Remove undefined fields
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key as keyof NotificationTemplate] === undefined) {
        delete updateFields[key as keyof NotificationTemplate]
      }
    })
    
    const docRef = doc(db, COLLECTION_PATH, updateData.id)
    await updateDoc(docRef, {
      ...updateFields,
      updatedAt: serverTimestamp()
    })
    
    // Get updated template
    const updatedTemplate = await getNotificationTemplate(updateData.id)
    
    return {
      success: true,
      message: 'Template updated successfully',
      data: updatedTemplate.data
    }
  } catch (error) {
    console.error('Error updating notification template:', error)
    return {
      success: false,
      message: 'Failed to update template',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Delete a notification template (soft delete by setting isActive to false)
 */
export const deleteNotificationTemplate = async (
  templateId: string,
  hardDelete: boolean = false
): Promise<NotificationTemplateResponse> => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      return {
        success: false,
        message: 'User must be authenticated',
        error: 'No authenticated user found'
      }
    }
    
    // Get existing template to verify ownership
    const existingTemplate = await getNotificationTemplate(templateId)
    if (!existingTemplate.success || !existingTemplate.data) {
      return existingTemplate
    }
    
    const template = existingTemplate.data as NotificationTemplate
    if (template.createdBy !== currentUser.uid) {
      return {
        success: false,
        message: 'Unauthorized to delete this template',
        error: 'You can only delete templates you created'
      }
    }
    
    const docRef = doc(db, COLLECTION_PATH, templateId)
    
    if (hardDelete) {
      // Permanently delete the document
      await deleteDoc(docRef)
    } else {
      // Soft delete by setting isActive to false
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      })
    }
    
    return {
      success: true,
      message: hardDelete ? 'Template permanently deleted' : 'Template deactivated successfully'
    }
  } catch (error) {
    console.error('Error deleting notification template:', error)
    return {
      success: false,
      message: 'Failed to delete template',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Duplicate a notification template
 */
export const duplicateNotificationTemplate = async (
  templateId: string,
  newTitle?: string
): Promise<NotificationTemplateResponse> => {
  try {
    // Get the original template
    const originalTemplate = await getNotificationTemplate(templateId)
    if (!originalTemplate.success || !originalTemplate.data) {
      return originalTemplate
    }
    
    const template = originalTemplate.data as NotificationTemplate
    
    // Create new template data
    const duplicateData: CreateNotificationTemplateRequest = {
      title: newTitle ? {
        en: newTitle,
        ar: template.title.ar,
        ku: template.title.ku
      } : {
        en: `${template.title.en} (Copy)`,
        ar: `${template.title.ar} (نسخة)`,
        ku: `${template.title.ku} (کۆپی)`
      },
      content: template.content,
      type: template.type,
      targetAudience: template.targetAudience,
      tags: template.tags,
      priority: template.priority,
      metadata: {
        ...template.metadata,
        description: `Duplicated from template: ${template.id}`
      }
    }
    
    return await saveNotificationTemplate(duplicateData)
  } catch (error) {
    console.error('Error duplicating notification template:', error)
    return {
      success: false,
      message: 'Failed to duplicate template',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Search notification templates by text
 */
export const searchNotificationTemplates = async (
  searchTerm: string,
  limitCount: number = 20
): Promise<NotificationTemplateResponse> => {
  try {
    // Get all templates first (Firestore doesn't support full-text search natively)
    const allTemplates = await getNotificationTemplates(undefined, 100)
    
    if (!allTemplates.success || !allTemplates.data) {
      return allTemplates
    }
    
    const templates = allTemplates.data as NotificationTemplate[]
    const searchTermLower = searchTerm.toLowerCase()
    
    // Filter templates based on search term
    const filteredTemplates = templates.filter(template => {
      const titleMatch = Object.values(template.title).some(title => 
        title.toLowerCase().includes(searchTermLower)
      )
      const contentMatch = Object.values(template.content).some(content => 
        content.toLowerCase().includes(searchTermLower)
      )
      const tagMatch = template.tags?.some(tag => 
        tag.toLowerCase().includes(searchTermLower)
      )
      const categoryMatch = template.metadata?.category?.toLowerCase().includes(searchTermLower)
      
      return titleMatch || contentMatch || tagMatch || categoryMatch
    }).slice(0, limitCount)
    
    return {
      success: true,
      message: `Found ${filteredTemplates.length} templates matching "${searchTerm}"`,
      data: filteredTemplates
    }
  } catch (error) {
    console.error('Error searching notification templates:', error)
    return {
      success: false,
      message: 'Failed to search templates',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 