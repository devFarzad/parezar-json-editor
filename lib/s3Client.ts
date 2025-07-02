import { S3Client } from "@aws-sdk/client-s3"

// Validate environment variables
const validateEnvVars = () => {
  const region = process.env.AWS_REGION
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const bucketName = process.env.S3_BUCKET_NAME

  console.log('=== AWS Configuration Debug ===')
  console.log('AWS_REGION:', region ? `${region.substring(0, 10)}...` : 'MISSING')
  console.log('AWS_ACCESS_KEY_ID:', accessKeyId ? `${accessKeyId.substring(0, 10)}...` : 'MISSING')
  console.log('AWS_SECRET_ACCESS_KEY:', secretAccessKey ? `${secretAccessKey.substring(0, 10)}...` : 'MISSING')
  console.log('S3_BUCKET_NAME:', bucketName || 'MISSING')
  console.log('================================')

  if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('Missing required AWS environment variables')
  }

  return { region, accessKeyId, secretAccessKey, bucketName }
}

// Validate and get environment variables
const { region, accessKeyId, secretAccessKey } = validateEnvVars()

// Create S3 client for AWS Lightsail bucket
const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  // Use standard S3 configuration for Lightsail
  forcePathStyle: false, // Let AWS SDK handle the URL style
  maxAttempts: 3,
  // Remove the custom endpoint - let AWS SDK use default
})

console.log('S3 Client created successfully for region:', region)

export default s3Client 