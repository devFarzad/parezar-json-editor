import { NextRequest, NextResponse } from 'next/server'
import { admin } from '@/lib/firebaseAdmin'
import s3Client from '@/lib/s3Client'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

// Helper function to convert stream to string
async function streamToString(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    stream.on('data', (chunk: Uint8Array) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
  })
}

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

// GET - Get specific JSON file content from S3
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const decodedToken = await verifyAuth(req)
  if (!decodedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { filename } = await params
    const getFilename = decodeURIComponent(filename)

    if (!getFilename.endsWith('.json')) {
      return NextResponse.json({ error: 'Only JSON files are supported' }, { status: 400 })
    }

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: getFilename,
    })

    const response = await s3Client.send(command)
    
    if (!response.Body) {
      return NextResponse.json({ error: 'File content not found' }, { status: 404 })
    }

    const bodyContents = await streamToString(response.Body)
    
    try {
      const jsonData = JSON.parse(bodyContents)
      return NextResponse.json(jsonData)
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON file content' }, { status: 422 })
    }

  } catch (error: any) {
    console.error('Error fetching file from S3:', error)
    
    if (error.name === 'NoSuchKey') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch file from S3. Please check your AWS configuration.' 
    }, { status: 500 })
  }
}

// PUT - Update specific JSON file content in S3
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const decodedToken = await verifyAuth(req)
  if (!decodedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { filename } = await params
    const getFilename = decodeURIComponent(filename)
    const updatedJsonData = await req.json()

    console.log('=== PUT Operation Debug ===')
    console.log('User UID:', decodedToken.uid)
    console.log('Filename:', getFilename)
    console.log('Bucket:', process.env.S3_BUCKET_NAME)
    console.log('Content size:', JSON.stringify(updatedJsonData).length, 'bytes')
    console.log('============================')

    if (!getFilename.endsWith('.json')) {
      return NextResponse.json({ error: 'Only JSON files are supported' }, { status: 400 })
    }

    // Validate JSON data
    const jsonString = JSON.stringify(updatedJsonData, null, 2)

    // Check if file exists first
    try {
      const getCommand = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: getFilename,
      })
      const existingFile = await s3Client.send(getCommand)
      console.log('File exists, size:', existingFile.ContentLength, 'bytes')
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
      console.error('Error checking file existence:', error)
      throw error
    }

    // Log detailed PutObject command parameters
    const putCommandParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: getFilename,
      Body: jsonString,
      ContentType: 'application/json',
    }
    
    console.log('=== PutObject Command Debug ===')
    console.log('Command params:', {
      ...putCommandParams,
      Body: `[${putCommandParams.Body.length} bytes]`
    })
    console.log('================================')

    // Update file in S3
    const putCommand = new PutObjectCommand(putCommandParams)

    try {
      const result = await s3Client.send(putCommand)
      console.log('PutObject successful:', result)
      
      return NextResponse.json({ 
        success: true, 
        message: `${getFilename} updated successfully in S3`,
        etag: result.ETag
      })
    } catch (putError: any) {
      console.error('=== PutObject Error Details ===')
      console.error('Error name:', putError.name)
      console.error('Error code:', putError.Code)
      console.error('Error message:', putError.message)
      console.error('Request ID:', putError.RequestId)
      console.error('Host ID:', putError.HostId)
      console.error('Full error object:', putError)
      console.error('===============================')

      console.log('metadata in putError in s3-files route');
      console.log(putError['$metadata']);
      
      throw putError
    }

  } catch (error: any) {
    console.error('Error updating file in S3:', error)
    
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON data' }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to update file in S3. Please check your AWS configuration.',
      details: error.Code || error.name || 'Unknown error'
    }, { status: 500 })
  }
} 