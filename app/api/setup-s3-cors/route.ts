import { NextResponse } from 'next/server';
import { PutBucketCorsCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3Client";

export async function POST() {
  try {
    const corsConfiguration = {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
          AllowedOrigins: [
            "http://localhost:3000",
            "https://localhost:3000",
            "https://*.vercel.app",
            // Add your production domain here
            // "https://your-production-domain.com"
          ],
          ExposeHeaders: ["ETag", "x-amz-request-id"],
          MaxAgeSeconds: 3000
        }
      ]
    };

    const command = new PutBucketCorsCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      CORSConfiguration: corsConfiguration
    });

    await s3Client.send(command);

    return NextResponse.json({ 
      success: true, 
      message: 'CORS configuration applied successfully to S3 bucket'
    });

  } catch (error: any) {
    console.error("Error setting S3 CORS configuration:", error);
    return NextResponse.json({ 
      error: 'Failed to set CORS configuration',
      details: error.message
    }, { status: 500 });
  }
} 