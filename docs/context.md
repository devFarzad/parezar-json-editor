# Project Context: Parezar JSON Editor App

## Overview
A modern, user-friendly JSON file management and editing application built with Next.js 15+ and Firebase authentication. The app provides a beautiful interface for uploading, managing, and editing JSON files with advanced editing capabilities.

## Tech Stack
- **Frontend**: Next.js 15.3.3 with App Router, React 18.2.0, TypeScript
- **UI Library**: shadcn/ui components with Tailwind CSS
- **Authentication**: Firebase Auth (email/password)
- **Backend**: Firebase Admin SDK for server-side operations
- **Icons**: Lucide React
- **JSON Editing**: Custom-built modal-based JSON editor

## Key Features

### 🔐 Authentication System
- Email/password login with Firebase Auth
- User registration with validation
- Protected routes and API endpoints
- Automatic session management

### 📁 File Management
- Upload JSON files with validation
- Create new JSON files from scratch
- View file list with metadata (size, modified date)
- Delete files with confirmation
- File name validation and duplicate checking

### ✨ **Enhanced JSON Editor** (Recently Improved)
- **Modal-Based Editing**: Click any value to open a rich modal editor
- **Type-Aware Input Fields**: 
  - Large text areas for long strings
  - Proper number inputs for numeric values
  - Dropdown selectors for booleans
  - Code editors for complex objects and arrays
- **Visual Tree View**: Hierarchical display with expand/collapse
- **Type Indicators**: Color-coded badges showing data types
- **Smart Type Conversion**: Easy switching between data types
- **Inline Actions**: Hover to reveal edit, add, and delete buttons
- **Validation**: Real-time JSON validation with error messages
- **Key Editing**: Rename object properties with dedicated UI

### 🛡️ Security Features
- Firebase Admin SDK for server-side token verification
- Protected API routes with JWT validation
- Secure file operations within designated directory
- Input validation and sanitization

## File Structure
```
parezar-app/
├── app/                     # Next.js App Router
│   ├── api/files/          # File management API routes
│   ├── dashboard/          # Main dashboard with sections
│   │   ├── layout.tsx      # Dashboard layout with navigation
│   │   ├── page.tsx        # Dashboard overview
│   │   ├── files/         # JSON file management section
│   │   ├── analytics/     # Usage analytics section
│   │   ├── users/         # User management section
│   │   └── settings/      # Settings section
│   ├── editor/             # Enhanced JSON editor page
│   ├── files/              # Legacy file management (redirects to dashboard)
│   ├── login/ & register/  # Authentication pages
├── components/ui/          # UI Components
│   ├── json-editor.tsx     # Main JSON editor component
│   ├── json-editor-modal.tsx # Modal editor component
│   └── [other shadcn components]
├── lib/                    # Firebase configuration
├── docs/                   # Documentation
└── data/                   # JSON file storage
```

## Recent Major Updates

### Enhanced JSON Editor (December 2024)
- **Problem Solved**: Previous editor had tiny input fields that were difficult to use for long text or complex data
- **Solution**: Created a sophisticated modal-based editing system with:
  - Large text areas for string editing
  - Type-specific input components
  - Visual JSON tree with expand/collapse
  - Intuitive hover actions
  - Professional UX with proper validation

### Core Components
1. **JsonEditorModal**: Rich modal with type selection and appropriate input fields
2. **JsonEditor**: Tree-view component with visual indicators and actions
3. **EditorPage**: Full-featured editing interface with help documentation

## User Experience Flow
1. **Authentication**: Users register/login with email/password
2. **Dashboard**: Main hub with overview of all sections and quick actions
3. **File Management**: Upload or create JSON files via intuitive interface
4. **JSON Editing**: 
   - Select file from list → Opens in enhanced editor
   - Click any value → Modal opens with appropriate editor
   - Change types easily → Smart conversion with validation
   - Save changes → Real-time persistence to server
5. **Navigation**: Seamless flow between dashboard sections

## Current Status
- ✅ Fully functional with enhanced UX
- ✅ All builds passing successfully
- ✅ **S3 Pre-signed URL Implementation Complete** - Fixed 413 Content Too Large error on Vercel
- ✅ Ready for production deployment with large file support
- ✅ Firebase server-side configured
- ✅ AWS S3 integration with direct upload capability
- ⚠️ Requires client-side Firebase config in .env.local

## Recent Architecture Improvements

### S3 Pre-signed URL Implementation (December 2024)
- **Problem Solved**: Vercel's 4.5MB request body size limit causing 413 errors for large JSON files
- **Solution**: Implemented direct S3 uploads using pre-signed URLs
- **Architecture**: 
  1. Browser requests secure upload URL from `/api/generate-upload-url`
  2. Large files uploaded directly to S3, bypassing Vercel API routes
  3. Maintains security with time-limited (60s), single-use URLs
- **Benefits**: 
  - Supports JSON files up to 10MB+
  - No impact on local file operations
  - Production-ready for Vercel deployment
  - Enhanced user experience with upload progress

## Next Steps
- Complete Firebase client configuration
- User testing with large JSON files (>4.5MB)
- Performance monitoring for S3 direct uploads
- Additional export/import formats 