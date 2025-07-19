import { NextRequest, NextResponse } from 'next/server'
import admin from '@/lib/firebaseAdmin'
import { getFirestore } from 'firebase-admin/firestore'

// Helper function to verify Firebase auth token
async function verifyAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const idToken = authHeader.split('Bearer ')[1]
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    return decodedToken
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await verifyAuth(req)
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }
    const db = getFirestore()
    const planDoc = await db.collection('plans').doc(id).get()

    if (!planDoc.exists) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({ id: planDoc.id, ...planDoc.data() })
  } catch (error: any) {
    console.error('Error fetching plan:', error)
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await verifyAuth(req)
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }       
    const plan = await req.json()
    
    // Basic validation
    if (!plan.name || !plan.price || !plan.billingCycle || !plan.credits || !plan.currency) {
      return NextResponse.json(
        { error: 'Missing required fields: name, price, billingCycle, credits, currency' },
        { status: 400 }
      )
    }

    const db = getFirestore()
    await db.collection('plans').doc(id).update({
      ...plan,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ id: id, ...plan })
  } catch (error: any) {
    console.error('Error updating plan:', error)
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params:Promise< { id: string }> }
) {
  try {
    const decodedToken = await verifyAuth(req)
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }
    const db = getFirestore()
    await db.collection('plans').doc(id).delete()

    return NextResponse.json({ success: true, id: id })
  } catch (error: any) {
    console.error('Error deleting plan:', error)
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}
