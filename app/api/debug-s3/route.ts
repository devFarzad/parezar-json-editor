import { NextRequest, NextResponse } from 'next/server'
import { admin } from '@/lib/firebaseAdmin'
import s3Client from '@/lib/s3Client'
import { 
  GetObjectCommand, 
  PutObjectCommand, 
  ListObjectsV2Command,
  HeadBucketCommand,
  GetBucketLocationCommand,
  GetBucketAclCommand
} from '@aws-sdk/client-s3'

// Verify Firebase authentication
async function verifyAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const idToken = authHeader.split('Bearer ')[1]
  console.log('idToken in debug-s3 route', idToken)
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

  const debugResults: any = {
    timestamp: new Date().toISOString(),
    user: decodedToken.uid,
    bucket: process.env.S3_BUCKET_NAME,
    region: process.env.AWS_REGION,
    tests: []
  }

  // Test 1: Basic S3 connection
  try {
    const headCommand = new HeadBucketCommand({
      Bucket: process.env.S3_BUCKET_NAME
    })
    await s3Client.send(headCommand)
    debugResults.tests.push({
      name: 'HeadBucket',
      status: 'PASS',
      message: 'Successfully connected to bucket'
    })
  } catch (error: any) {
    debugResults.tests.push({
      name: 'HeadBucket',
      status: 'FAIL',
      error: error.message,
      code: error.Code,
      requestId: error.RequestId
    })
  }

  // Test 2: Get bucket location
  try {
    const locationCommand = new GetBucketLocationCommand({
      Bucket: process.env.S3_BUCKET_NAME
    })
    const location = await s3Client.send(locationCommand)
    debugResults.tests.push({
      name: 'GetBucketLocation',
      status: 'PASS',
      location: location.LocationConstraint || 'us-east-1'
    })
  } catch (error: any) {
    debugResults.tests.push({
      name: 'GetBucketLocation',
      status: 'FAIL',
      error: error.message,
      code: error.Code,
      requestId: error.RequestId
    })
  }

  // Test 3: List objects (should work based on your report)
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      MaxKeys: 5
    })
    const listResult = await s3Client.send(listCommand)
    debugResults.tests.push({
      name: 'ListObjectsV2',
      status: 'PASS',
      objectCount: listResult.KeyCount || 0,
      objects: listResult.Contents?.map(obj => obj.Key).slice(0, 3) || []
    })
  } catch (error: any) {
    debugResults.tests.push({
      name: 'ListObjectsV2',
      status: 'FAIL',
      error: error.message,
      code: error.Code,
      requestId: error.RequestId
    })
  }

  // Test 4: Try to put a small test object
  const testKey = `debug-test-${Date.now()}.json`
  const testContent = JSON.stringify({ test: true, timestamp: new Date().toISOString() })
  
  try {
    const putCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: testKey,
      Body: testContent,
      ContentType: 'application/json'
    })
    const putResult = await s3Client.send(putCommand)
    debugResults.tests.push({
      name: 'PutObject (test file)',
      status: 'PASS',
      etag: putResult.ETag,
      key: testKey
    })

    // If put succeeded, try to get it back
    try {
      const getCommand = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: testKey
      })
      await s3Client.send(getCommand)
      debugResults.tests.push({
        name: 'GetObject (test file)',
        status: 'PASS',
        message: 'Successfully retrieved test file'
      })
    } catch (getError: any) {
      debugResults.tests.push({
        name: 'GetObject (test file)',
        status: 'FAIL',
        error: getError.message,
        code: getError.Code
      })
    }

  } catch (error: any) {
    debugResults.tests.push({
      name: 'PutObject (test file)',
      status: 'FAIL',
      error: error.message,
      code: error.Code,
      requestId: error.RequestId,
      hostId: error.HostId,
      metadata: error.$metadata
    })
  }

  // Test 5: Try different ContentType
  try {
    const putCommand2 = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `debug-test-plain-${Date.now()}.txt`,
      Body: 'Hello World',
      ContentType: 'text/plain'
    })
    await s3Client.send(putCommand2)
    debugResults.tests.push({
      name: 'PutObject (text/plain)',
      status: 'PASS',
      message: 'Text file upload successful'
    })
  } catch (error: any) {
    debugResults.tests.push({
      name: 'PutObject (text/plain)',
      status: 'FAIL',
      error: error.message,
      code: error.Code,
      requestId: error.RequestId
    })
  }

  // Test 6: Check bucket ACL (might require special permission)
  try {
    const aclCommand = new GetBucketAclCommand({
      Bucket: process.env.S3_BUCKET_NAME
    })
    const aclResult = await s3Client.send(aclCommand)
    debugResults.tests.push({
      name: 'GetBucketAcl',
      status: 'PASS',
      owner: aclResult.Owner?.DisplayName,
      grants: aclResult.Grants?.length || 0
    })
  } catch (error: any) {
    debugResults.tests.push({
      name: 'GetBucketAcl',
      status: 'FAIL',
      error: error.message,
      code: error.Code
    })
  }

  return NextResponse.json(debugResults, { status: 200 })
} 