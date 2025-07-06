import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Secure Firebase Admin initialization using ONLY environment variables
if (!getApps().length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountJson) {
      throw new Error('Firebase Admin Error: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set');
    }
    
    console.log('Loading Firebase config from environment variable...');
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    // Fix private key formatting - replace escaped newlines with actual newlines
    if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    
    // Validate required fields
    if (!serviceAccount.project_id) {
      throw new Error('Missing project_id in Firebase service account');
    }
    
    if (!serviceAccount.private_key) {
      throw new Error('Missing private_key in Firebase service account');
    }
    
    if (!serviceAccount.client_email) {
      throw new Error('Missing client_email in Firebase service account');
    }
    
    // Fix incomplete private key by adding missing END marker if needed
    const hasBeginMarker = serviceAccount.private_key.includes('-----BEGIN PRIVATE KEY-----');
    const hasEndMarker = serviceAccount.private_key.includes('-----END PRIVATE KEY-----');
    
    console.log('🔧 Fixing private key format...');
    console.log('- Has BEGIN marker:', hasBeginMarker);
    console.log('- Has END marker:', hasEndMarker);
    
    if (hasBeginMarker && !hasEndMarker) {
      // Auto-fix: Add the missing END marker
      console.log('⚡ Adding missing END marker to private key');
      serviceAccount.private_key = serviceAccount.private_key.trim() + '\n-----END PRIVATE KEY-----\n';
      console.log('✅ Private key fixed!');
    } else if (!hasBeginMarker) {
      console.error('❌ Private key missing BEGIN marker - cannot fix automatically');
      throw new Error('Invalid private key format - missing BEGIN marker');
    }
    
    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    
    console.log('🎉 Firebase Admin initialized successfully from environment variable');

  } catch (error: any) {
    console.error('🔥 CRITICAL: Firebase Admin initialization failed:', error.message);
    
    // Enhanced debug info
    console.log('=== Firebase Debug Info ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Has FIREBASE_SERVICE_ACCOUNT_JSON:', !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const envVarLength = process.env.FIREBASE_SERVICE_ACCOUNT_JSON.length;
      console.log('Environment variable length:', envVarLength);
      console.log('First 100 chars:', process.env.FIREBASE_SERVICE_ACCOUNT_JSON.substring(0, 100));
      console.log('Last 100 chars:', process.env.FIREBASE_SERVICE_ACCOUNT_JSON.substring(envVarLength - 100));
    }
    console.log('============================');
    
    // In production or build time, throw to fail fast
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

export { admin };
export const db = admin.firestore();
export default admin;