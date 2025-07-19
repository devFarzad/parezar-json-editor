import { NextRequest, NextResponse } from 'next/server'
import { admin } from '@/lib/firebaseAdmin'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }

  const idToken = authHeader.split('Bearer ')[1]
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    console.log('Token verified: in verifyToken filename', decodedToken)
    return decodedToken
  } catch (error) {
    throw new Error('Invalid token')
  }
}

function sanitizeFilename(filename: string): string {
  // Remove any path traversal attempts and ensure .json extension
  const sanitized = path.basename(filename)
  if (!sanitized.endsWith('.json')) {
    return sanitized + '.json'
  }
  return sanitized
}

// GET /api/files/[filename] - Get specific file content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    await verifyToken(request)
    
    const { filename: rawFilename } = await params
    const filename = sanitizeFilename(decodeURIComponent(rawFilename))
    const filePath = path.join(DATA_DIR, filename)
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const jsonData = JSON.parse(fileContent)
    
    return NextResponse.json(jsonData)
  } catch (error) {
    console.error('Error reading file:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Invalid token' || error.message.includes('authorization')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      if (error.message.includes('JSON')) {
        return NextResponse.json(
          { error: 'Invalid JSON file' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    )
  }
}

// PUT /api/files/[filename] - Update specific file content
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    await verifyToken(request)
    
    const { filename: rawFilename } = await params
    const filename = sanitizeFilename(decodeURIComponent(rawFilename))
    const filePath = path.join(DATA_DIR, filename)
    
    const body = await request.json()
    
    // Validate JSON
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { error: 'Request body must be a valid JSON object' },
        { status: 400 }
      )
    }

    // Write file with pretty formatting
    const jsonString = JSON.stringify(body, null, 2)
    fs.writeFileSync(filePath, jsonString, 'utf-8')
    
    return NextResponse.json({
      message: 'File updated successfully',
      filename,
      size: jsonString.length
    })
  } catch (error) {
    console.error('Error updating file:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Invalid token' || error.message.includes('authorization')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      if (error.message.includes('JSON')) {
        return NextResponse.json(
          { error: 'Invalid JSON data' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    )
  }
}

// DELETE /api/files/[filename] - Delete specific file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    await verifyToken(request)
    
    const { filename: rawFilename } = await params
    const filename = sanitizeFilename(decodeURIComponent(rawFilename))
    const filePath = path.join(DATA_DIR, filename)
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    fs.unlinkSync(filePath)
    
    return NextResponse.json({
      message: 'File deleted successfully',
      filename
    })
  } catch (error) {
    console.error('Error deleting file:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Invalid token' || error.message.includes('authorization')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
} 