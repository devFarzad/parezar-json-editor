import { NextRequest, NextResponse } from 'next/server'
import admin from '@/lib/firebaseAdmin'
import { getFirestore } from 'firebase-admin/firestore'

export async function GET(req: NextRequest) {
  try {
    const db = getFirestore()
    const usersSnapshot = await db.collection('user-system').get()
    const users = usersSnapshot.docs.map(doc => doc.data())
    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json()

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['admin', 'cleaner', 'operator'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 })
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: true, // You might want to set this based on your flow
      disabled: false,
    })

    await admin.auth().setCustomUserClaims(userRecord.uid, { role, isActive: true })

    // Now, save user info to Firestore
    const db = getFirestore()
    const userRef = db.collection('user-system').doc(userRecord.uid)
    await userRef.set({
      email: userRecord.email,
      role: role,
      isActive: true,
      createdAt: new Date().toISOString(),
      uid: userRecord.uid
    })

    return NextResponse.json({ success: true, uid: userRecord.uid })
  } catch (error: any) {
    console.error('Error creating new user:', error)
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { uid, isActive } = await req.json()

    if (!uid || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields: uid and isActive' }, { status: 400 });
    }

    // A safeguard: you might want to get the UID of the requesting admin
    // and prevent them from disabling themselves. This is a simplified example.

    // Update Firebase Auth `disabled` state
    await admin.auth().updateUser(uid, {
      disabled: !isActive,
    });

    // Update Firestore document
    const db = getFirestore()
    const userRef = db.collection('user-system').doc(uid)
    await userRef.update({
      isActive: isActive,
    })

    // It's good practice to also update the claims if you rely on them.
    const currentUser = await admin.auth().getUser(uid);
    const currentClaims = currentUser.customClaims || {};
    await admin.auth().setCustomUserClaims(uid, { ...currentClaims, isActive: isActive });

    return NextResponse.json({ success: true, message: `User ${isActive ? 'enabled' : 'disabled'} successfully.` })
  } catch (error: any) {
    console.error('Error updating user status:', error)
    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 })
  }
} 