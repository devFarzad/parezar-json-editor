# Environment Setup Guide

## AWS Environment Variables Setup

You need to create a `.env.local` file in your project root with your AWS credentials.

### Step 1: Create .env.local file

Create a file named `.env.local` in your project root (same level as package.json) with the following content:

```env
# AWS Configuration for Lightsail Bucket
AWS_ACCESS_KEY_ID=PASTE_YOUR_ACCESS_KEY_ID_HERE
AWS_SECRET_ACCESS_KEY=PASTE_YOUR_SECRET_ACCESS_KEY_HERE
AWS_REGION=eu-central-1
S3_BUCKET_NAME=parezar-laws

# Keep your existing Firebase configuration
# (copy from your existing .env.local if you have one)
```

### Step 2: Replace credentials

Replace `PASTE_YOUR_ACCESS_KEY_ID_HERE` and `PASTE_YOUR_SECRET_ACCESS_KEY_HERE` with your actual AWS IAM user credentials that you created.

### Step 3: Verify configuration

Your final `.env.local` should look like:
```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=eu-central-1
S3_BUCKET_NAME=parezar-laws
```

## Security Notes

- ✅ `.env.local` is already in .gitignore
- ❌ Never commit AWS credentials to version control
- ✅ Keep credentials secure and private
- ✅ Use IAM user with minimal required permissions only

## Next Steps

After creating the `.env.local` file:
1. Restart your development server (`npm run dev`)
2. Test AWS connection with the S3 client
3. Proceed with API integration 