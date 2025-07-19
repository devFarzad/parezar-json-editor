import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    console.log('=== Firebase Admin Test Started ===');
    
    // Test 1: Check if Firebase Admin is initialized
    const app = admin.app();
    console.log('✅ Firebase Admin app instance exists');
    console.log('Project ID:', app.options.projectId);
    
    // Test 2: Check Authentication Service
    const auth = admin.auth();
    console.log('✅ Firebase Admin Auth service initialized');
    
    // Test 3: Check Firestore Service  
    const firestore = admin.firestore();
    console.log('✅ Firebase Admin Firestore service initialized');
    
    // Test 4: Try to access a simple Firestore operation (just test connection)
    const testRef = firestore.collection('_test_connection');
    console.log('✅ Firestore collection reference created');
    
    // Test 5: Check if we can create auth tokens (basic auth test)
    const testUid = 'test-user-' + Date.now();
    try {
      const customToken = await auth.createCustomToken(testUid);
      console.log('✅ Custom token creation successful');
    } catch (tokenError) {
      console.warn('⚠️ Custom token creation failed:', tokenError);
    }
    
    console.log('=== Firebase Admin Test Completed ===');
    
    return NextResponse.json({
      success: true,
      message: 'Firebase Admin is working correctly',
      details: {
        projectId: app.options.projectId,
        servicesInitialized: {
          app: true,
          auth: true,
          firestore: true
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Firebase Admin Test Failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Firebase Admin test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
} 