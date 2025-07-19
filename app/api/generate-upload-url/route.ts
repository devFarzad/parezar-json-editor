import { NextResponse } from 'next/server';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "@/lib/s3Client";

export async function POST(request: Request) {
  try {
    const { fileName, fileType } = await request.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'fileName and fileType are required' }, { status: 400 });
    }

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      ContentType: fileType,
    });

    // Generate the special, one-time-use upload URL
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60, // Link will be valid for 60 seconds
    });

    return NextResponse.json({ url: signedUrl });

  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
} 