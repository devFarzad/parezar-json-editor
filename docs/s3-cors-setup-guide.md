# S3 CORS Configuration Setup Guide

## Problem
Direct S3 uploads from the web application are blocked by CORS policy. The browser shows:
```
Access to fetch at 'https://parezar-laws-final.s3.eu-central-1.amazonaws.com/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

## Solution
Configure CORS (Cross-Origin Resource Sharing) on your S3 bucket to allow direct uploads from your web application.

## Steps to Apply CORS Configuration

### Method 1: AWS Console (Recommended)

1. **Navigate to AWS S3 Console**
   - Go to: https://s3.console.aws.amazon.com/
   - Sign in with your AWS credentials

2. **Find Your Bucket**
   - Look for bucket name: `parezar-laws-final`
   - Click on the bucket name

3. **Go to Permissions Tab**
   - Click on the "Permissions" tab
   - Scroll down to find "Cross-origin resource sharing (CORS)"

4. **Edit CORS Configuration**
   - Click the "Edit" button
   - Replace any existing CORS configuration with the following:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://localhost:3000", 
      "https://*.vercel.app",
      "https://your-production-domain.com"
    ],
    "ExposeHeaders": ["ETag", "x-amz-request-id"],
    "MaxAgeSeconds": 3000
  }
]
```

5. **Save Changes**
   - Click "Save changes"
   - Wait for the configuration to propagate (usually takes a few seconds)

### Method 2: AWS CLI (Alternative)

If you have AWS CLI installed and configured:

```bash
aws s3api put-bucket-cors --bucket parezar-laws-final --cors-configuration file://docs/s3-cors-config.json
```

### Method 3: Using AWS SDK (Programmatic)

Add this to your application if you want to set CORS programmatically:

```javascript
import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const corsConfig = {
  Bucket: "parezar-laws-final",
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedHeaders: ["*"],
        AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
        AllowedOrigins: [
          "http://localhost:3000",
          "https://localhost:3000",
          "https://*.vercel.app",
          "https://your-production-domain.com"
        ],
        ExposeHeaders: ["ETag", "x-amz-request-id"],
        MaxAgeSeconds: 3000
      }
    ]
  }
};

const command = new PutBucketCorsCommand(corsConfig);
await s3Client.send(command);
```

## Important Notes

1. **Update Production Domain**: Replace `https://your-production-domain.com` with your actual production domain
2. **Security**: The current configuration allows all headers (`"*"`) for development. Consider restricting this in production
3. **Propagation**: CORS changes may take a few minutes to propagate across all S3 endpoints
4. **Testing**: After applying CORS, test the upload functionality again

## Verification

After applying the CORS configuration:

1. **Clear browser cache** or try in an incognito window
2. **Test the upload** - the CORS error should be resolved
3. **Check browser console** - you should see successful PUT requests to S3

## Troubleshooting

- **Still getting CORS errors?** Double-check that the origin matches exactly (http vs https)
- **403 Forbidden errors?** Check your S3 bucket permissions and AWS credentials
- **Timeout errors?** Verify your pre-signed URL generation is working correctly 