import { NextRequest, NextResponse } from 'next/server'
import { admin } from '@/lib/firebaseAdmin'
import s3Client from '@/lib/s3Client'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'

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

// GET - Test AWS S3 connection
export async function GET(req: NextRequest) {
  const decodedToken = await verifyAuth(req)
  if (!decodedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check environment variables
    const missingVars = []
    console.log('process.env.AWS_ACCESS_KEY_ID', process.env.AWS_ACCESS_KEY_ID)
    console.log('process.env.AWS_SECRET_ACCESS_KEY', process.env.AWS_SECRET_ACCESS_KEY)
    console.log('process.env.AWS_REGION', process.env.AWS_REGION)
    console.log('process.env.S3_BUCKET_NAME', process.env.S3_BUCKET_NAME)
    if (!process.env.AWS_ACCESS_KEY_ID) missingVars.push('AWS_ACCESS_KEY_ID')
    if (!process.env.AWS_SECRET_ACCESS_KEY) missingVars.push('AWS_SECRET_ACCESS_KEY')
    if (!process.env.AWS_REGION) missingVars.push('AWS_REGION')
    if (!process.env.S3_BUCKET_NAME) missingVars.push('S3_BUCKET_NAME')

    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        missingVariables: missingVars,
        message: 'Please check your .env.local file and add the missing AWS credentials.'
      }, { status: 400 })
    }

    // Test S3 connection by listing bucket contents
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      MaxKeys: 1, // Just test the connection, don't load all files
    })

    const response = await s3Client.send(command)
    console.log('response in test-aws route');
    console.log(response);
    return NextResponse.json({
      success: true,
      message: 'AWS S3 connection successful!',
      bucketName: process.env.S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
      totalObjects: response.KeyCount || 0,
      connectionTime: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('AWS connection test failed:', error)
    
    let errorMessage = 'Unknown AWS error'
    let errorCode = error.name || 'UnknownError'

    // Common AWS error handling
    switch (error.name) {
      case 'NoSuchBucket':
        errorMessage = `Bucket '${process.env.S3_BUCKET_NAME}' does not exist or is not accessible`
        break
      case 'InvalidAccessKeyId':
        errorMessage = 'Invalid AWS Access Key ID. Please check your credentials.'
        break
      case 'SignatureDoesNotMatch':
        errorMessage = 'Invalid AWS Secret Access Key. Please check your credentials.'
        break
      case 'AccessDenied':
        errorMessage = 'Access denied. Please check your IAM user permissions.'
        break
      case 'NetworkingError':
        errorMessage = 'Network error. Please check your internet connection.'
        break
      default:
        errorMessage = error.message || 'Failed to connect to AWS S3'
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      errorCode: errorCode,
      bucketName: process.env.S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
      troubleshooting: {
        checkCredentials: 'Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local',
        checkPermissions: 'Ensure IAM user has s3:ListBucket permission',
        checkBucket: 'Verify bucket name and region are correct',
        checkNetwork: 'Ensure internet connection is stable'
      }
    }, { status: 500 })
  }
} 