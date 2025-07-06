import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { admin } from '@/lib/firebaseAdmin'

type JsonData = Record<string, unknown>

async function verifyAuth(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    return decodedToken.uid
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const uid = await verifyAuth(request)
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get filename from query params
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('file') || 'myfile.json'
    const filePath = join(process.cwd(), 'data', filename)

    // Read the JSON file
    try {
      const jsonData = readFileSync(filePath, 'utf8')
      const parsedData: JsonData = JSON.parse(jsonData)
      return NextResponse.json(parsedData, {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      // If file doesn't exist, return empty object for new files
      if ((error as any).code === 'ENOENT') {
        return NextResponse.json({}, {
          headers: { 'Content-Type': 'application/json' }
        })
      }
      throw error
    }
  } catch (error) {
    console.error('Error reading JSON file:', error)
    return NextResponse.json(
      { error: 'Failed to read JSON file' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const uid = await verifyAuth(request)
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get filename from query params
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('file') || 'myfile.json'
    const filePath = join(process.cwd(), 'data', filename)

    // Parse request body
    const jsonData: JsonData = await request.json()

    // Validate that the data is an object
    if (typeof jsonData !== 'object' || jsonData === null || Array.isArray(jsonData)) {
      return NextResponse.json(
        { error: 'Invalid JSON data: must be an object' },
        { status: 400 }
      )
    }

    // Write the JSON file
    writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8')

    return NextResponse.json({ 
      message: 'JSON file saved successfully',
      filename: filename,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error saving JSON file:', error)
    return NextResponse.json(
      { error: 'Failed to save JSON file' },
      { status: 500 }
    )
  }
} 