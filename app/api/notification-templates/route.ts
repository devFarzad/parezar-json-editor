import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import admin from '@/lib/firebaseAdmin'
import { NotificationTemplateService } from '@/lib/notificationTemplateService'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    await getAuth().verifyIdToken(idToken)

    const templates = await NotificationTemplateService.getAllTemplates()
    return NextResponse.json({ templates }, { status: 200 })
  } catch (error) {
    console.error('Error fetching notification templates:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    await getAuth().verifyIdToken(idToken)

    const { id, title, content } = await req.json()
    console.log('API received update request:', { id, title, content })
    
    // Validate that we have an ID and at least one field to update
    if (!id) {
      return NextResponse.json({ message: 'Template ID is required' }, { status: 400 })
    }

    if (!title && !content) {
      return NextResponse.json({ message: 'At least one field (title or content) must be provided for update' }, { status: 400 })
    }

    // Create update data object with only provided fields
    const updateData: any = {}
    if (title) updateData.title = title
    if (content) updateData.content = content

    await NotificationTemplateService.updateTemplate(id, updateData)
    return NextResponse.json({ message: 'Template updated successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error updating notification template:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    await getAuth().verifyIdToken(idToken)

    const { id, title, content } = await req.json()
    console.log('API received create request:', { id, title, content })
    
    // Validate required fields for creation
    if (!id) {
      return NextResponse.json({ message: 'Template ID is required' }, { status: 400 })
    }

    if (!title || !content) {
      return NextResponse.json({ message: 'Both title and content are required for creating a template' }, { status: 400 })
    }

    await NotificationTemplateService.createTemplate(id, { title, content })
    return NextResponse.json({ message: 'Template created successfully' }, { status: 201 })
  } catch (error) {
    console.error('Error creating notification template:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    await getAuth().verifyIdToken(idToken)

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ message: 'Template ID is required' }, { status: 400 })
    }

    await NotificationTemplateService.deleteTemplate(id)
    return NextResponse.json({ message: 'Template deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting notification template:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}