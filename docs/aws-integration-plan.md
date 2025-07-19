# AWS Integration Plan for Parezar JSON Manager

## Overview
This plan outlines the integration of AWS Lightsail Bucket with the existing Parezar JSON management system. The goal is to replace local file storage with AWS S3-compatible Lightsail bucket storage while maintaining the existing UI and functionality.

## Current State Analysis
- **Existing System**: Local file storage in `/data` directory
- **Current API**: `/api/files/route.ts` handles local file operations
- **UI**: Dashboard with JSON file management (keeping existing UI)
- **Authentication**: Firebase Auth with token verification
- **Missing**: AWS SDK, environment variables, S3 client setup

## Implementation Phases

### Phase 1: AWS Setup & Configuration ✅ (User Completed)
- [x] AWS IAM User created with Lightsail bucket access
- [x] Bucket permissions configured (`parezar-laws`)
- [x] AWS Access Keys generated

### Phase 2: Environment & Dependencies Setup 🔄 (In Progress)
**Tasks:**
1. Install AWS SDK for JavaScript v3
2. Create `.env.local` with AWS credentials
3. Create S3 client configuration
4. Test AWS connection

**Files to Create/Modify:**
- `.env.local` - AWS environment variables
- `lib/s3Client.ts` - S3 client configuration
- `package.json` - Add AWS SDK dependency

### Phase 3: API Integration 🔄 (Next)
**Tasks:**
1. Create new AWS-based API routes
2. Implement file listing from S3
3. Implement file upload to S3
4. Implement file download from S3
5. Implement file deletion from S3
6. Maintain existing API interface for UI compatibility

**Files to Create/Modify:**
- `app/api/s3-files/route.ts` - New S3-based file operations
- `app/api/s3-files/[filename]/route.ts` - Individual file operations
- Keep existing `/api/files` for backward compatibility during transition

### Phase 4: Testing & Migration 🔲 (Future)
**Tasks:**
1. Test all S3 operations
2. Migrate existing local files to S3
3. Update UI to use S3 endpoints
4. Remove local file system dependencies

### Phase 5: Optimization & Security 🔲 (Future)
**Tasks:**
1. Implement file caching strategies
2. Add error handling for network issues
3. Implement file versioning
4. Add file metadata management

## Technical Specifications

### AWS Configuration
- **Region**: `eu-central-1`
- **Bucket**: `parezar-laws`
- **IAM User**: `parezar-bucket-user`
- **Permissions**: `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket`

### Environment Variables Required
```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=eu-central-1
S3_BUCKET_NAME=parezar-laws
```

### Dependencies to Install
```json
{
  "@aws-sdk/client-s3": "^3.x.x"
}
```

### API Endpoints Design
- `GET /api/s3-files` - List all JSON files from S3
- `POST /api/s3-files` - Upload new JSON file to S3
- `DELETE /api/s3-files?filename=x` - Delete file from S3
- `GET /api/s3-files/[filename]` - Get specific file content
- `PUT /api/s3-files/[filename]` - Update specific file content

### UI Compatibility
- **Maintain existing UI**: Keep current dashboard and file management interface
- **Seamless transition**: UI should work with both local and S3 storage
- **Error handling**: Graceful fallback for connection issues
- **Performance**: Loading states for network operations

## Success Criteria
1. ✅ All JSON files stored in AWS Lightsail bucket
2. ✅ Existing UI functionality preserved
3. ✅ Authentication and authorization maintained
4. ✅ File operations (CRUD) working seamlessly
5. ✅ Error handling for network and AWS issues
6. ✅ Performance comparable to local storage

## Risk Mitigation
- **Network Issues**: Implement retry logic and fallback mechanisms
- **Authentication**: Secure AWS credentials handling
- **Data Loss**: Backup strategy for existing files
- **Performance**: Connection pooling and caching strategies

## Timeline
- **Phase 2**: 30 minutes (Setup & Dependencies)
- **Phase 3**: 60 minutes (API Integration)
- **Phase 4**: 30 minutes (Testing & Migration)
- **Phase 5**: 30 minutes (Optimization)

**Total Estimated Time**: 2.5 hours

## Next Steps
1. Start with Phase 2: Install AWS SDK and configure environment
2. Test AWS connection with simple operations
3. Implement S3-based file operations
4. Migrate existing files and test thoroughly 