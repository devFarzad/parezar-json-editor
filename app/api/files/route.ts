import { NextRequest, NextResponse } from 'next/server'
import { admin } from '@/lib/firebaseAdmin'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

async function verifyAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const idToken = authHeader.split('Bearer ')[1]
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    console.log('Token verified:', decodedToken)
    return decodedToken
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

function getJsonFiles() {
  try {
    const files = fs.readdirSync(DATA_DIR)
    const jsonFiles = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(DATA_DIR, file)
        const stats = fs.statSync(filePath)
        return {
          name: file,
          lastModified: stats.mtime.toISOString(),
          size: stats.size,
        }
      })
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())

    return jsonFiles
  } catch (error) {
    console.error('Error reading files:', error)
    return []
  }
}

// GET - List all JSON files
export async function GET(req: NextRequest) {
  const decodedToken = await verifyAuth(req)
  if (!decodedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const files = getJsonFiles()
    return NextResponse.json({ files })
  } catch (error) {
    console.error('Error listing files:', error)
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 })
  }
}

// POST - Upload/Create a new JSON file
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
    const filePath = path.join(DATA_DIR, jsonFilename)
    if (fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File already exists' }, { status: 409 })
    }

    // Write the file
    fs.writeFileSync(filePath, content, 'utf8')

    return NextResponse.json({ 
      message: 'File uploaded successfully',
      filename: jsonFilename 
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}

// DELETE - Delete a JSON file
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

    const filePath = path.join(DATA_DIR, filename)
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Prevent deletion of myfile.json if you want to keep it as default
    if (filename === 'myfile.json') {
      return NextResponse.json({ error: 'Cannot delete default file' }, { status: 403 })
    }

    fs.unlinkSync(filePath)

    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
} 