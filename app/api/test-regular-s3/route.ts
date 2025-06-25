import { NextRequest, NextResponse } from 'next/server'
import { admin } from '@/lib/firebaseAdmin'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// Verify Firebase authentication
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

export async function POST(req: NextRequest) {
  const decodedToken = await verifyAuth(req)
  if (!decodedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Create a regular S3 client (not Lightsail)
  const regularS3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    // Standard S3 configuration
    forcePathStyle: false,
    maxAttempts: 3
  })

  const testResults: any = {
    timestamp: new Date().toISOString(),
    tests: []
  }

  // Test 1: Try to put a test object in the SAME Lightsail bucket but with regular S3 client
  const testKey = `debug-regular-s3-${Date.now()}.json`
  const testContent = JSON.stringify({ 
    test: 'regular-s3-client', 
    timestamp: new Date().toISOString(),
    user: decodedToken.uid
  }, null, 2)

  try {
    console.log('=== Testing Regular S3 Client on Lightsail Bucket ===')
    console.log('Bucket:', process.env.S3_BUCKET_NAME)
    console.log('Key:', testKey)
    console.log('Region:', process.env.AWS_REGION)
    
    const putCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: testKey,
      Body: testContent,
      ContentType: 'application/json'
    })

    const result = await regularS3Client.send(putCommand)
    
    testResults.tests.push({
      name: 'PutObject with Regular S3 Client',
      status: 'SUCCESS',
      etag: result.ETag,
      key: testKey,
      message: 'Regular S3 client worked on Lightsail bucket!'
    })

    // Clean up the test file
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: testKey
      })
      await regularS3Client.send(deleteCommand)
      testResults.tests.push({
        name: 'Cleanup test file',
        status: 'SUCCESS',
        message: 'Test file deleted successfully'
      })
    } catch (deleteError) {
      testResults.tests.push({
        name: 'Cleanup test file',
        status: 'WARNING',
        message: 'File created but cleanup failed - please delete manually'
      })
    }

  } catch (error: any) {
    console.error('=== Regular S3 Client Test Failed ===')
    console.error('Error:', error)
    
    testResults.tests.push({
      name: 'PutObject with Regular S3 Client',
      status: 'FAILED',
      error: error.message,
      code: error.Code,
      requestId: error.RequestId,
      hostId: error.HostId,
      metadata: error.$metadata
    })
  }

  return NextResponse.json(testResults)
} 