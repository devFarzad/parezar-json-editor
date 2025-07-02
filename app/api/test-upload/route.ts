import { NextResponse } from 'next/server';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "@/lib/s3Client";

export async function GET() {
  try {
    const testFileName = `test-${Date.now()}.json`;
    
    // Generate pre-signed URL
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: testFileName,
      ContentType: 'application/json',
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60,
    });

    // Test data
    const testData = { message: "CORS test", timestamp: new Date().toISOString() };
    const testDataString = JSON.stringify(testData, null, 2);

    return NextResponse.json({
      success: true,
      message: 'Pre-signed URL generated successfully',
      testFileName,
      signedUrl,
      testData: testDataString,
      instructions: [
        '1. Copy the signedUrl',
        '2. Use a tool like Postman or curl to make a PUT request to the signedUrl',
        '3. Set Content-Type: application/json header',
        '4. Put the testData as the request body',
        '5. If successful, CORS is working correctly'
      ]
    });

  } catch (error: any) {
    console.error("Error generating test upload URL:", error);
    return NextResponse.json({ 
      error: 'Failed to generate test upload URL',
      details: error.message
    }, { status: 500 });
  }
} 