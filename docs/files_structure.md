# File Structure Documentation

## Core Application Files

### Configuration Files
- `package.json` - Project dependencies and scripts (updated to parezar-app)
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration with shadcn/ui support
- `postcss.config.js` - PostCSS configuration for Tailwind

### Firebase Configuration
- `lib/firebaseClient.ts` - Firebase client SDK initialization for authentication
- `lib/firebaseAdmin.ts` - Firebase Admin SDK initialization for server-side operations
- `firebase.service.json.template` - Template for Firebase service account credentials

### Utility Functions
- `lib/utils.ts` - Utility functions for className merging (shadcn/ui compatibility)

### UI Components (shadcn/ui)
- `components/ui/button.tsx` - Reusable button component with variants
- `components/ui/input.tsx` - Form input component
- `components/ui/card.tsx` - Card layout components (Card, CardHeader, CardContent, etc.)
- `components/ui/label.tsx` - Form label component
- `components/ui/alert.tsx` - Alert/notification components

### App Router Pages
- `app/layout.tsx` - Root layout with global styles and metadata
- `app/globals.css` - Global styles with Tailwind and shadcn/ui variables
- `app/page.tsx` - Root page with authentication state management and redirects
- `app/login/page.tsx` - Login page with Firebase authentication
- `app/register/page.tsx` - User registration page
- `app/dashboard/layout.tsx` - Dashboard layout with navigation sidebar
- `app/dashboard/page.tsx` - Main dashboard overview with stats and quick actions
- `app/dashboard/files/page.tsx` - Enhanced JSON file management section
- `app/dashboard/notifications/page.tsx` - Multi-language notification management system
- `app/dashboard/analytics/page.tsx` - Analytics and usage statistics section
- `app/dashboard/users/page.tsx` - User management section
- `app/dashboard/settings/page.tsx` - Application settings section
- `app/editor/page.tsx` - Protected JSON editor with enhanced modal-based editing

### API Routes
- `app/api/config/route.ts` - Protected API endpoints (GET/POST) for JSON file operations

### Data
- `data/myfile.json` - JSON data file that can be edited through the application

### Documentation
- `docs/context.md` - Project context and overview
- `docs/changes.log` - Change tracking log
- `docs/files_structure.md` - This file structure documentation
- `docs/Task.md` - Original project requirements
- `README.md` - Comprehensive setup and deployment instructions

## Key Features by File

### Authentication Flow
- Client-side: `lib/firebaseClient.ts`, `app/login/page.tsx`, `app/page.tsx`
- Server-side: `lib/firebaseAdmin.ts`, `app/api/config/route.ts`

### JSON Editing
- Main editor: `app/editor/page.tsx` (uses react-json-view)
- Data storage: `data/myfile.json`
- API operations: `app/api/config/route.ts`

### UI/UX
- Styling: `app/globals.css`, `tailwind.config.js`
- Components: All files in `components/ui/`
- Layout: `app/layout.tsx`

### Security
- Token verification: `app/api/config/route.ts`
- Route protection: `app/editor/page.tsx`, `app/page.tsx`
- Environment variables: `.env.local` (not tracked)

## Dependencies Summary
- Core: Next.js 15+, React 18, TypeScript
- Authentication: Firebase SDK + Admin SDK
- UI: Tailwind CSS, shadcn/ui components, react-json-view
- Utilities: clsx, tailwind-merge, class-variance-authority

## Models
- **models/NotificationTemplate.ts**: Comprehensive TypeScript interfaces and validation for notification templates with multi-language support

## Library Services
- **lib/firebaseClient.ts**: Firebase client configuration for frontend
- **lib/firebaseAdmin.ts**: Firebase admin SDK for server-side operations
- **lib/notificationTemplateService.ts**: Complete Firebase CRUD service for notification template management with user authentication and data validation
- **lib/utils.ts**: Utility functions for the application

## AWS Integration (NEW)
- `lib/s3Client.ts` - AWS S3 client configuration for Lightsail bucket integration
- `app/api/s3-files/route.ts` - Main S3 files API (list, upload, delete)
- `app/api/s3-files/[filename]/route.ts` - Individual S3 file operations (get, update) - **DEPRECATED for large files**
- `app/api/generate-upload-url/route.ts` - **NEW**: Pre-signed URL generation for direct S3 uploads (bypasses Vercel size limits)
- `app/api/test-aws/route.ts` - AWS connection testing and troubleshooting endpoint
- `app/dashboard/aws-files/page.tsx` - AWS JSON files management page with S3 integration
- `docs/aws-integration-plan.md` - Comprehensive implementation plan and technical specs
- `docs/aws-json-loader-tasks.md` - Task breakdown for AWS JSON loader section implementation
- `docs/env-setup-guide.md` - Environment variables setup guide for AWS credentials

## Architecture Notes
- **Large File Handling**: AWS files >4.5MB now use pre-signed URLs for direct browser-to-S3 uploads
- **Vercel Compatibility**: New architecture bypasses Vercel's serverless function size limits
- **Security**: Time-limited (60s) upload URLs maintain security while enabling large file transfers 