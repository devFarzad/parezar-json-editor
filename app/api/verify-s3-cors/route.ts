import { NextResponse } from 'next/server';
import { GetBucketCorsCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3Client";

export async function GET() {
  try {
    const command = new GetBucketCorsCommand({
      Bucket: process.env.S3_BUCKET_NAME
    });

    const response = await s3Client.send(command);

    return NextResponse.json({ 
      success: true, 
      message: 'CORS configuration retrieved successfully',
      corsRules: response.CORSRules
    });

  } catch (error: any) {
    console.error("Error getting S3 CORS configuration:", error);
    
    if (error.name === 'NoSuchCORSConfiguration') {
      return NextResponse.json({ 
        success: false,
        error: 'No CORS configuration found on bucket',
        suggestion: 'Please run POST /api/setup-s3-cors to configure CORS'
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to get CORS configuration',
      details: error.message
    }, { status: 500 });
  }
} 