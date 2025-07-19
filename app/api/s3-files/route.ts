import { NextRequest, NextResponse } from 'next/server'
import { admin } from '@/lib/firebaseAdmin'
import s3Client from '@/lib/s3Client'
import { 
  GetObjectCommand, 
  PutObjectCommand, 
  ListObjectsV2Command, 
  DeleteObjectCommand 
} from '@aws-sdk/client-s3'

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
    console.log('Token verified: in verifyAuth s3-files', decodedToken)
    return decodedToken
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Get list of JSON files from S3
async function getS3JsonFiles() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: '', // List all files
    })

    const response = await s3Client.send(command)
    
    if (!response.Contents) {
      return []
    }

    // Filter for JSON files and format response
    const jsonFiles = response.Contents
      .filter(obj => obj.Key && obj.Key.endsWith('.json'))
      .map(obj => ({
        name: obj.Key!,
        lastModified: obj.LastModified?.toISOString() || new Date().toISOString(),
        size: obj.Size || 0,
      }))
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())

    return jsonFiles
  } catch (error) {
    console.error('Error listing S3 files:', error)
    throw error
  }
}

// GET - List all JSON files from S3
export async function GET(req: NextRequest) {
  const decodedToken = await verifyAuth(req)
  if (!decodedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const files = await getS3JsonFiles()
    return NextResponse.json({ files })
  } catch (error) {
    console.error('Error listing S3 files:', error)
    return NextResponse.json({ 
      error: 'Failed to list files from S3. Please check your AWS configuration.' 
    }, { status: 500 })
  }
}

// POST - Upload/Create a new JSON file to S3
export async function POST(req: NextRequest) {
  const decodedToken = await verifyAuth(req)
  if (!decodedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { filename, content } = body

    if (!filename || !content) {
      return NextResponse.json({ error: 'Filename and content are required' }, { status: 400 })
    }

    // Ensure filename ends with .json
    const jsonFilename = filename.endsWith('.json') ? filename : `${filename}.json`
    
    // Validate JSON content
    try {
      JSON.parse(content)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON content' }, { status: 400 })
    }

    // Check if file already exists
    try {
      const getCommand = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: jsonFilename,
      })
      await s3Client.send(getCommand)
      return NextResponse.json({ error: 'File already exists' }, { status: 409 })
    } catch (error: any) {
      // If file doesn't exist, continue with upload
      if (error.name !== 'NoSuchKey') {
        throw error
      }
    }

    // Upload file to S3
    const putCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: jsonFilename,
      Body: content,
      ContentType: 'application/json',
    })

    await s3Client.send(putCommand)

    return NextResponse.json({ 
      message: 'File uploaded successfully to S3',
      filename: jsonFilename 
    })
  } catch (error) {
    console.error('Error uploading file to S3:', error)
    return NextResponse.json({ 
      error: 'Failed to upload file to S3. Please check your AWS configuration.' 
    }, { status: 500 })
  }
}

// DELETE - Delete a JSON file from S3
export async function DELETE(req: NextRequest) {
  const decodedToken = await verifyAuth(req)
  if (!decodedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Check if file exists
    try {
      const getCommand = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: filename,
      })
      await s3Client.send(getCommand)
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
      throw error
    }

    // Delete file from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: filename,
    })

    await s3Client.send(deleteCommand)

    return NextResponse.json({ message: 'File deleted successfully from S3' })
  } catch (error) {
    console.error('Error deleting file from S3:', error)
    return NextResponse.json({ 
      error: 'Failed to delete file from S3. Please check your AWS configuration.' 
    }, { status: 500 })
  }
} 