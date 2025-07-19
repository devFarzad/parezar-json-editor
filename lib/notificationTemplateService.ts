import { db } from './firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'
import { NotificationTemplate, MultiLanguageText } from '@/models/NotificationTemplate'

interface NotificationTemplateData {
  title: MultiLanguageText;
  content: MultiLanguageText;
}

export const NotificationTemplateService = {
  async getAllTemplates(): Promise<NotificationTemplate[]> {
    const docRef = db.collection('configs').doc('notification-templates');
    const doc = await docRef.get();

    if (!doc.exists) {
      return [];
    }

    const data = doc.data();
    if (!data) {
      return [];
    }

    console.log('Firestore data:', data);

    const templates: NotificationTemplate[] = [];

    // Dynamically iterate through all template IDs in the document
    Object.keys(data).forEach(templateId => {
      const templateData = data[templateId];
      
      // Check if this is a valid template structure with language objects
      if (templateData && typeof templateData === 'object') {
        // Extract multilingual data from the Firestore structure
        const template: NotificationTemplate = {
          id: templateId,
          title: {
            en: templateData.en?.title || '',
            ar: templateData.ar?.title || '',
            ku: templateData.ku?.title || ''
          },
          content: {
            en: templateData.en?.content || '',
            ar: templateData.ar?.content || '',
            ku: templateData.ku?.content || ''
          },
          type: templateData.type || 'info',
          targetAudience: templateData.targetAudience || 'all',
          createdAt: templateData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: templateData.createdBy || 'system',
          isActive: templateData.isActive !== undefined ? templateData.isActive : true,
          tags: templateData.tags || [templateId.split('-')[0]], // Use first part of ID as tag
          priority: templateData.priority || 'medium',
          metadata: {
            category: templateData.metadata?.category || templateId.split('-')[0],
            version: templateData.metadata?.version || 1,
            description: templateData.metadata?.description || `${templateId} notification template`
          }
        };

        templates.push(template);
      }
    });

    console.log('Processed templates:', templates);
    return templates;
  },

  async updateTemplate(id: string, data: Partial<NotificationTemplateData>) {
    console.log(`Updating template: ${id} with data:`, data);

    const docRef = db.collection('configs').doc('notification-templates');
    
    // Convert the partial MultiLanguageText structure to Firestore format
    const firestoreData: any = {};
    
    // Only update title fields that were provided
    if (data.title) {
      if (data.title.ar !== undefined) {
        firestoreData[`${id}.ar.title`] = data.title.ar;
      }
      if (data.title.en !== undefined) {
        firestoreData[`${id}.en.title`] = data.title.en;
      }
      if (data.title.ku !== undefined) {
        firestoreData[`${id}.ku.title`] = data.title.ku;
      }
    }
    
    // Only update content fields that were provided
    if (data.content) {
      if (data.content.ar !== undefined) {
        firestoreData[`${id}.ar.content`] = data.content.ar;
      }
      if (data.content.en !== undefined) {
        firestoreData[`${id}.en.content`] = data.content.en;
      }
      if (data.content.ku !== undefined) {
        firestoreData[`${id}.ku.content`] = data.content.ku;
      }
    }

    // Update the updatedAt timestamp
    firestoreData[`${id}.updatedAt`] = new Date().toISOString();

    console.log('Updating Firestore with:', firestoreData);

    await docRef.update(firestoreData);
  },

  async createTemplate(id: string, data: NotificationTemplateData) {
    console.log(`Creating template: ${id} with data:`, data);

    const docRef = db.collection('configs').doc('notification-templates');
    
    const templateData = {
      ar: {
        title: data.title.ar || '',
        content: data.content.ar || ''
      },
      en: {
        title: data.title.en || '',
        content: data.content.en || ''
      },
      ku: {
        title: data.title.ku || '',
        content: data.content.ku || ''
      },
      type: 'info',
      targetAudience: 'all',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      isActive: true,
      tags: [id.split('-')[0]],
      priority: 'medium',
      metadata: {
        category: id.split('-')[0],
        version: 1,
        description: `${id} notification template`
      }
    };

    await docRef.update({
      [id]: templateData
    });
  },

  async deleteTemplate(id: string) {
    console.log(`Deleting template: ${id}`);

    const docRef = db.collection('configs').doc('notification-templates');
    
    await docRef.update({
      [id]: FieldValue.delete()
    });
  }
};
